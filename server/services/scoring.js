/**
 * scoring.js - Pure functions for quiz grading, XP calculations, and badge evaluation.
 */

/**
 * Calculates scores, points, and XP for a quiz attempt.
 * 
 * @param {Array} answers - List of answers: { selected_option_id, hint_used, fifty_fifty_used, time_taken_seconds, timed_out }
 * @param {Array} questions - List of matching question snapshots: { id, correct_answer_json }
 * @returns {Object} - { totalScore, maxScore, percentage, xpEarned, gradedAnswers }
 */
export function calculateScore(answers, questions) {
  let totalScore = 0;
  let correctCount = 0;
  let streakCount = 0;
  
  const gradedAnswers = [];

  for (let i = 0; i < questions.length; i++) {
    const qSnapshot = questions[i];
    const ans = answers.find(a => a.attempt_question_id === qSnapshot.id) || {
      selected_option_id: null,
      hint_used: false,
      fifty_fifty_used: false,
      time_taken_seconds: 0,
      timed_out: true
    };

    const correctOptionIds = Array.isArray(qSnapshot.question_snapshot_json.correct_answer_json)
      ? qSnapshot.question_snapshot_json.correct_answer_json
      : JSON.parse(qSnapshot.question_snapshot_json.correct_answer_json || '[]');

    const isCorrect = !ans.timed_out && 
                      ans.selected_option_id && 
                      correctOptionIds.includes(ans.selected_option_id);

    let points = isCorrect ? 1.0 : 0.0;

    // Lifeline Penalties
    if (ans.hint_used) points -= 0.25;
    if (ans.fifty_fifty_used) points -= 0.25;

    // Floor question score at 0
    points = Math.max(0.00, points);

    // Fast Answer Bonus: +0.25 if correct, under 10 seconds, and no lifelines used
    let isFastBonus = false;
    if (isCorrect && ans.time_taken_seconds < 10 && !ans.hint_used && !ans.fifty_fifty_used) {
      points += 0.25;
      isFastBonus = true;
    }

    // Streak tracking and bonus
    let isStreakBonus = false;
    if (isCorrect) {
      correctCount += 1;
      streakCount += 1;
      if (streakCount > 0 && streakCount % 3 === 0) {
        points += 1.0;
        isStreakBonus = true;
      }
    } else {
      streakCount = 0;
    }

    totalScore += points;

    gradedAnswers.push({
      attemptQuestionId: qSnapshot.id,
      selectedOptionId: ans.selected_option_id,
      isCorrect,
      pointsAwarded: parseFloat(points.toFixed(2)),
      timeTakenSeconds: ans.time_taken_seconds || 0,
      hintUsed: ans.hint_used,
      fifty_fiftyUsed: ans.fifty_fifty_used,
      timedOut: ans.timed_out,
      fastBonusAwarded: isFastBonus,
      streakBonusAwarded: isStreakBonus
    });
  }

  const maxScore = questions.length;
  const percentage = maxScore > 0 ? parseFloat(((correctCount / maxScore) * 100).toFixed(2)) : 0.00;
  
  // XP = 10 per correct answer + 5 completion bonus
  const xpEarned = (correctCount * 10) + 5;

  return {
    totalScore: parseFloat(totalScore.toFixed(2)),
    maxScore,
    percentage,
    xpEarned,
    gradedAnswers
  };
}

/**
 * Evaluates which badges the user qualifies for.
 * 
 * @param {Array} history - User's historical attempts (submitted only, excluding current)
 * @param {Object} currentAttempt - The newly submitted attempt results
 * @param {Array} currentBadges - User's existing badge codes (e.g. ['first_quiz'])
 * @returns {Array} - Array of new badge codes earned in this attempt (e.g. ['speedy_thinker'])
 */
export function evaluateBadges(history, currentAttempt, currentBadges) {
  const newBadges = [];
  const allAttempts = [...history, currentAttempt];

  // 1. First Quiz
  if (!currentBadges.includes('first_quiz')) {
    newBadges.push('first_quiz');
  }

  // 2. Speedy Thinker (Correct answer under 10 seconds 5 times overall)
  if (!currentBadges.includes('speedy_thinker')) {
    let fastCorrectCount = 0;
    for (const attempt of allAttempts) {
      const answers = attempt.gradedAnswers || [];
      const fastCount = answers.filter(a => a.isCorrect && a.timeTakenSeconds < 10 && !a.hintUsed && !a.fifty_fiftyUsed).length;
      fastCorrectCount += fastCount;
    }
    if (fastCorrectCount >= 5) {
      newBadges.push('speedy_thinker');
    }
  }

  // 3. Perfect Score (100% on a quiz with >= 5 questions)
  if (!currentBadges.includes('perfect_score')) {
    const hasPerfectScore = allAttempts.some(a => a.max_score >= 5 && a.percentage === 100.00);
    if (hasPerfectScore) {
      newBadges.push('perfect_score');
    }
  }

  // 4. Quiz Master (Complete 10 quizzes)
  if (!currentBadges.includes('quiz_master')) {
    if (allAttempts.length >= 10) {
      newBadges.push('quiz_master');
    }
  }

  // 5. Topic Specialist (Score >= 80% on 5 attempts of the same topic)
  if (!currentBadges.includes('topic_specialist')) {
    // Group attempts by topic
    const topicScores = {};
    for (const attempt of allAttempts) {
      const topicId = attempt.topic_id;
      if (!topicScores[topicId]) {
        topicScores[topicId] = [];
      }
      topicScores[topicId].push(attempt.percentage);
    }

    const hasSpecialist = Object.values(topicScores).some(scores => {
      const highScoresCount = scores.filter(s => s >= 80.00).length;
      return highScoresCount >= 5;
    });

    if (hasSpecialist) {
      newBadges.push('topic_specialist');
    }
  }

  return newBadges;
}
