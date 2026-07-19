import db from '../config/db.js';
import { calculateScore, evaluateBadges } from './scoring.js';

/**
 * Transactionally finalizes and grades a quiz attempt.
 * Safe for concurrent executions (idempotent).
 * 
 * @param {string} attemptId - Attempt UUID
 * @param {string} reason - 'manual' or 'expired'
 * @returns {Object} - Graded attempt details
 */
export async function finalizeAttempt(attemptId, reason) {
  return await db.transaction(async (trx) => {
    // 1. Lock the quiz attempt row to prevent concurrent finalizations
    const attempt = await trx('quiz_attempts')
      .where({ id: attemptId })
      .first()
      .forUpdate();

    if (!attempt) {
      throw new Error('ATTEMPT_NOT_FOUND');
    }

    // Idempotency check: if already submitted, return the graded summary
    if (attempt.status !== 'in_progress') {
      return {
        id: attempt.id,
        status: attempt.status,
        totalScore: attempt.total_score,
        maxScore: attempt.max_score,
        percentage: attempt.percentage,
        xpEarned: attempt.xp_earned,
        finalizationReason: attempt.finalization_reason
      };
    }

    const questions = await trx('attempt_questions')
      .where({ attempt_id: attemptId })
      .orderBy('position', 'asc');

    const answers = await trx('attempt_answers')
      .where({ attempt_id: attemptId });

    // 2. Ensure all questions have an answer record. Unanswered questions are timed out.
    const finalAnswers = [];
    const now = new Date();

    for (const q of questions) {
      let ans = answers.find(a => a.attempt_question_id === q.id);

      if (!ans) {
        // Create timed out entry
        const [newAns] = await trx('attempt_answers').insert({
          attempt_id: attemptId,
          attempt_question_id: q.id,
          selected_option_id: null,
          is_correct: false,
          points_awarded: 0.00,
          time_taken_seconds: 0,
          timed_out: true,
          selected_at: null,
          graded_at: now
        }).returning('*');
        ans = newAns;
      } else if (attempt.quiz_mode === 'assessment') {
        // Grade Assessment Mode draft selections
        const qSnapshot = q.question_snapshot_json;
        const correctOptionIds = Array.isArray(qSnapshot.correct_answer_json)
          ? qSnapshot.correct_answer_json
          : JSON.parse(qSnapshot.correct_answer_json || '[]');

        const isCorrect = ans.selected_option_id && correctOptionIds.includes(ans.selected_option_id);
        let points = isCorrect ? 1.0 : 0.0;

        if (ans.hint_used) points -= 0.25;
        if (ans.fifty_fifty_used) points -= 0.25;
        points = Math.max(0.00, points);

        // Update draft row with grading
        const [updatedAns] = await trx('attempt_answers')
          .where({ id: ans.id })
          .update({
            is_correct: isCorrect,
            points_awarded: points,
            time_taken_seconds: ans.time_taken_seconds || 0,
            graded_at: now
          })
          .returning('*');
        ans = updatedAns;
      }
      finalAnswers.push(ans);
    }

    // 3. Compute final scores
    const scoreResults = calculateScore(finalAnswers, questions);

    // 4. Update User progression (XP, streaks, level) if it is a registered user
    if (attempt.user_id) {
      const user = await trx('users').where({ id: attempt.user_id }).first().forUpdate();
      
      const newTotalXp = user.total_xp + scoreResults.xpEarned;
      const newLevel = Math.floor(newTotalXp / 50) + 1;

      // Streak tracking
      let nextStreak = user.current_streak;
      const todayStr = now.toISOString().split('T')[0]; // UTC date YYYY-MM-DD

      if (user.last_activity_date) {
        const lastDate = new Date(user.last_activity_date);
        const lastDateStr = lastDate.toISOString().split('T')[0];

        if (lastDateStr === todayStr) {
          // Already active today; streak unchanged
        } else {
          // Check if yesterday
          const yesterday = new Date(now);
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];

          if (lastDateStr === yesterdayStr) {
            nextStreak += 1;
          } else {
            nextStreak = 1;
          }
        }
      } else {
        nextStreak = 1;
      }

      const nextLongestStreak = Math.max(user.longest_streak, nextStreak);

      await trx('users')
        .where({ id: user.id })
        .update({
          total_xp: newTotalXp,
          current_level: newLevel,
          current_streak: nextStreak,
          longest_streak: nextLongestStreak,
          last_activity_date: todayStr
        });

      // 5. Award Badges
      const history = await trx('quiz_attempts')
        .where({ user_id: attempt.user_id, status: 'submitted' })
        .select('*');

      const existingBadges = await trx('user_badges')
        .where({ user_id: attempt.user_id })
        .select('badge_id');

      const badgesList = await trx('badges').select('*');
      const existingBadgeCodes = existingBadges.map(eb => {
        const b = badgesList.find(bl => bl.id === eb.badge_id);
        return b ? b.code : null;
      }).filter(Boolean);

      const currentAttemptSummary = {
        max_score: scoreResults.maxScore,
        percentage: scoreResults.percentage,
        topic_id: attempt.topic_id,
        gradedAnswers: scoreResults.gradedAnswers
      };

      const newBadgeCodes = evaluateBadges(history, currentAttemptSummary, existingBadgeCodes);

      for (const code of newBadgeCodes) {
        const b = badgesList.find(bl => bl.code === code);
        if (b) {
          await trx('user_badges')
            .insert({
              user_id: attempt.user_id,
              badge_id: b.id,
              attempt_id: attemptId
            })
            .onConflict(['user_id', 'badge_id'])
            .ignore(); // One-time award enforcement (Patch 4)
        }
      }
    }

    // 6. Finalize quiz_attempts status
    const timeTaken = Math.floor((now.getTime() - new Date(attempt.started_at).getTime()) / 1000);

    await trx('quiz_attempts')
      .where({ id: attemptId })
      .update({
        status: 'submitted',
        submitted_at: now,
        total_score: scoreResults.totalScore,
        percentage: scoreResults.percentage,
        xp_earned: scoreResults.xpEarned,
        time_taken_seconds: timeTaken,
        finalization_reason: reason
      });

    return {
      id: attemptId,
      status: 'submitted',
      totalScore: scoreResults.totalScore,
      maxScore: scoreResults.maxScore,
      percentage: scoreResults.percentage,
      xpEarned: scoreResults.xpEarned,
      finalizationReason: reason
    };
  });
}
