import crypto from 'crypto';
import db from '../config/db.js';
import { finalizeAttempt } from '../services/quizService.js';

// Unbiased Fisher-Yates shuffle using crypto.randomInt()
function secureShuffle(arr) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Helper to serialize an attempt question for the frontend (strips correct answers)
function serializeAttemptQuestion(aq, answerRecord) {
  const q = typeof aq.question_snapshot_json === 'string'
    ? JSON.parse(aq.question_snapshot_json)
    : aq.question_snapshot_json;
  
  // Shuffled options list built from option_order_json order
  const optionOrder = typeof aq.option_order_json === 'string'
    ? JSON.parse(aq.option_order_json)
    : aq.option_order_json;

  const options = optionOrder.map(id => {
    const opt = q.options_json.find(o => o.id === id);
    return { id, text: opt ? opt.text : '' };
  });

  return {
    attemptQuestionId: aq.id,
    questionText: q.question_text,
    position: aq.position,
    options,
    hintUsed: answerRecord ? !!answerRecord.hint_used : false,
    fiftyFiftyUsed: answerRecord ? !!answerRecord.fifty_fifty_used : false,
    eliminatedOptionIds: typeof aq.eliminated_options_json === 'string'
      ? JSON.parse(aq.eliminated_options_json)
      : (aq.eliminated_options_json || [])
  };
}

// Expiry check hook (Patch 1)
async function getActiveAttempt(attemptId) {
  const attempt = await db('quiz_attempts').where({ id: attemptId }).first();
  if (!attempt) return null;

  if (attempt.status === 'in_progress' && attempt.quiz_mode === 'assessment' && attempt.expires_at < new Date()) {
    await finalizeAttempt(attemptId, 'expired');
    return await db('quiz_attempts').where({ id: attemptId }).first();
  }
  return attempt;
}

export async function createAttempt(req, res) {
  const { categoryId, topicId, difficulty, questionCount, quizMode } = req.body;
  const mode = quizMode === 'practice' ? 'practice' : 'assessment';

  if (!categoryId || !topicId || !difficulty || !questionCount) {
    return res.status(400).json({ error: { message: 'categoryId, topicId, difficulty, and questionCount are required.' } });
  }

  const qCount = parseInt(questionCount);
  if (isNaN(qCount) || qCount < 1 || qCount > 50) {
    return res.status(400).json({ error: { message: 'questionCount must be an integer between 1 and 50.' } });
  }

  try {
    // 1. Check question pool size
    const [poolSizeRes] = await db('questions')
      .where({
        category_id: parseInt(categoryId),
        topic_id: parseInt(topicId),
        difficulty,
        status: 'published'
      })
      .count('id as count');

    const poolSize = parseInt(poolSizeRes.count || 0);
    if (poolSize < qCount) {
      return res.status(400).json({
        error: {
          code: 'INSUFFICIENT_QUESTIONS',
          message: `Only ${poolSize} questions are available for this topic and difficulty.`
        }
      });
    }

    // 2. Fetch random questions
    const questions = await db('questions')
      .where({
        category_id: parseInt(categoryId),
        topic_id: parseInt(topicId),
        difficulty,
        status: 'published'
      })
      .orderByRaw('RANDOM()')
      .limit(qCount);

    const now = new Date();
    let expiresAt = null;

    if (mode === 'assessment') {
      expiresAt = new Date(now.getTime() + qCount * 30 * 1000); // 30 seconds per question
    }

    const principal = req.principal;

    const attemptData = {
      user_id: principal.type === 'user' ? principal.userId : null,
      guest_session_id: principal.type === 'guest' ? principal.guestSessionId : null,
      category_id: parseInt(categoryId),
      topic_id: parseInt(topicId),
      difficulty,
      question_count: qCount,
      max_score: qCount,
      quiz_mode: mode,
      status: 'in_progress',
      started_at: now,
      expires_at: expiresAt,
      current_question_index: 0
    };

    const attemptId = await db.transaction(async (trx) => {
      const [newAttempt] = await trx('quiz_attempts').insert(attemptData).returning('*');

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        
        // Extract option IDs
        const optionsList = typeof q.options_json === 'string' ? JSON.parse(q.options_json) : q.options_json;
        const optionIds = optionsList.map(o => o.id);

        // Shuffle option IDs
        const shuffledOptionIds = secureShuffle(optionIds);

        await trx('attempt_questions').insert({
          attempt_id: newAttempt.id,
          question_id: q.id,
          question_snapshot_json: JSON.stringify(q), // Must stringify for Postgres JSONB column
          position: i,
          option_order_json: JSON.stringify(shuffledOptionIds),
          unlocked_at: (i === 0 && mode === 'practice') ? now : null
        });
      }

      return newAttempt.id;
    });

    // 3. Return initial attempt details with first question DTO
    const firstQuestion = await db('attempt_questions')
      .where({ attempt_id: attemptId, position: 0 })
      .first();

    const response = {
      attemptId,
      status: 'in_progress',
      quizMode: mode,
      startedAt: now,
      expiresAt,
      currentQuestionIndex: 0,
      questionsCount: qCount,
      currentQuestion: serializeAttemptQuestion(firstQuestion, null)
    };

    res.status(201).json(response);
  } catch (err) {
    console.error('createAttempt error:', err);
    res.status(500).json({ error: { message: 'Failed to start quiz attempt.' } });
  }
}

export async function getAttempt(req, res) {
  const attemptId = req.params.id;

  try {
    const attempt = await getActiveAttempt(attemptId);
    if (!attempt) {
      return res.status(404).json({ error: { message: 'Attempt not found.' } });
    }

    // Verify ownership
    const principal = req.principal;
    if (attempt.user_id && attempt.user_id !== principal.userId) {
      return res.status(403).json({ error: { message: 'Access denied.' } });
    }
    if (attempt.guest_session_id && attempt.guest_session_id !== principal.guestSessionId) {
      return res.status(403).json({ error: { message: 'Access denied.' } });
    }

    if (attempt.status === 'submitted') {
      return res.status(200).json({
        attemptId: attempt.id,
        status: 'submitted',
        resultsAvailable: true
      });
    }

    // Get current active question based on position
    const currentQIndex = attempt.current_question_index;
    const aq = await db('attempt_questions')
      .where({ attempt_id: attemptId, position: currentQIndex })
      .first();

    const answer = await db('attempt_answers')
      .where({ attempt_id: attemptId, attempt_question_id: aq.id })
      .first();

    // Unlock next question if it was locked in Practice Mode
    if (attempt.quiz_mode === 'practice' && !aq.unlocked_at) {
      await db('attempt_questions').where({ id: aq.id }).update({ unlocked_at: new Date() });
      aq.unlocked_at = new Date();
    }

    const response = {
      attemptId: attempt.id,
      status: attempt.status,
      quizMode: attempt.quiz_mode,
      currentQuestionIndex: currentQIndex,
      questionsCount: attempt.question_count,
      expiresAt: attempt.expires_at,
      currentQuestion: serializeAttemptQuestion(aq, answer)
    };

    res.status(200).json(response);
  } catch (err) {
    console.error('getAttempt error:', err);
    res.status(500).json({ error: { message: 'Failed to load attempt.' } });
  }
}

export async function getAttemptResults(req, res) {
  const attemptId = req.params.id;

  try {
    const attempt = await getActiveAttempt(attemptId);
    if (!attempt) {
      return res.status(404).json({ error: { message: 'Attempt not found.' } });
    }

    // Verify ownership
    const principal = req.principal;
    if (attempt.user_id && attempt.user_id !== principal.userId) {
      return res.status(403).json({ error: { message: 'Access denied.' } });
    }
    if (attempt.guest_session_id && attempt.guest_session_id !== principal.guestSessionId) {
      return res.status(403).json({ error: { message: 'Access denied.' } });
    }

    // If still in progress (even after checking expiration), return Conflict
    if (attempt.status === 'in_progress') {
      return res.status(409).json({
        error: {
          code: 'ATTEMPT_NOT_SUBMITTED',
          message: 'Results are available only after final submission.'
        }
      });
    }

    // Load full graded details
    const questions = await db('attempt_questions').where({ attempt_id: attemptId }).orderBy('position', 'asc');
    const answers = await db('attempt_answers').where({ attempt_id: attemptId });

    const gradedAnswers = questions.map(q => {
      const ans = answers.find(a => a.attempt_question_id === q.id) || {
        selected_option_id: null,
        is_correct: false,
        points_awarded: 0.00,
        time_taken_seconds: 0,
        hint_used: false,
        fifty_fifty_used: false,
        timed_out: true
      };

      const qSnapshot = typeof q.question_snapshot_json === 'string'
        ? JSON.parse(q.question_snapshot_json)
        : q.question_snapshot_json;

      const optionOrder = typeof q.option_order_json === 'string'
        ? JSON.parse(q.option_order_json)
        : q.option_order_json;

      return {
        questionId: q.question_id,
        questionText: qSnapshot.question_text,
        options: optionOrder.map(id => {
          const opt = qSnapshot.options_json.find(o => o.id === id);
          return { id, text: opt ? opt.text : '' };
        }),
        selectedOptionId: ans.selected_option_id,
        correctOptionIds: typeof qSnapshot.correct_answer_json === 'string'
          ? JSON.parse(qSnapshot.correct_answer_json)
          : qSnapshot.correct_answer_json,
        isCorrect: ans.is_correct,
        pointsAwarded: ans.points_awarded,
        timeTakenSeconds: ans.time_taken_seconds,
        hintUsed: ans.hint_used,
        fiftyFiftyUsed: ans.fifty_fifty_used,
        timedOut: ans.timed_out,
        explanation: qSnapshot.explanation
      };
    });

    res.status(200).json({
      attemptId: attempt.id,
      status: attempt.status,
      quizMode: attempt.quiz_mode,
      totalScore: attempt.total_score,
      maxScore: attempt.max_score,
      percentage: attempt.percentage,
      xpEarned: attempt.xp_earned,
      timeTakenSeconds: attempt.time_taken_seconds,
      finalizationReason: attempt.finalization_reason,
      answers: gradedAnswers
    });
  } catch (err) {
    console.error('getAttemptResults error:', err);
    res.status(500).json({ error: { message: 'Failed to load results.' } });
  }
}

export async function saveAnswer(req, res) {
  const attemptId = req.params.id;
  const { selectedOptionId } = req.body;

  try {
    const attempt = await getActiveAttempt(attemptId);
    if (!attempt) {
      return res.status(404).json({ error: { message: 'Attempt not found.' } });
    }

    if (attempt.status !== 'in_progress') {
      return res.status(400).json({ error: { message: 'Attempt is already finalized.' } });
    }

    // Verify ownership
    const principal = req.principal;
    if (attempt.user_id && attempt.user_id !== principal.userId) {
      return res.status(403).json({ error: { message: 'Access denied.' } });
    }
    if (attempt.guest_session_id && attempt.guest_session_id !== principal.guestSessionId) {
      return res.status(403).json({ error: { message: 'Access denied.' } });
    }

    const currentQIndex = attempt.current_question_index;

    await db.transaction(async (trx) => {
      const activeQ = await trx('attempt_questions')
        .where({ attempt_id: attemptId, position: currentQIndex })
        .first()
        .forUpdate();

      if (!activeQ) {
        throw new Error('QUESTION_NOT_FOUND');
      }

      const qSnapshot = typeof activeQ.question_snapshot_json === 'string'
        ? JSON.parse(activeQ.question_snapshot_json)
        : activeQ.question_snapshot_json;

      if (attempt.quiz_mode === 'practice') {
        // Enforce per-question timing and immutability (Practice Mode)
        const existingAns = await trx('attempt_answers')
          .where({ attempt_question_id: activeQ.id })
          .first();

        if (existingAns && existingAns.selected_option_id !== null) {
          throw new Error('ALREADY_ANSWERED');
        }

        const now = new Date();
        const elapsed = Math.floor((now.getTime() - new Date(activeQ.unlocked_at).getTime()) / 1000);
        let points = 0.00;
        let isCorrect = false;
        let timedOut = false;
        let finalOption = selectedOptionId;

        // Fetch hint/5050 flags from a temp draft answer if any exist
        let hintUsed = false;
        let fiftyFiftyUsed = false;
        if (existingAns) {
          hintUsed = !!existingAns.hint_used;
          fiftyFiftyUsed = !!existingAns.fifty_fifty_used;
        }

        if (elapsed > 32) {
          // Timeout
          timedOut = true;
          finalOption = null;
        } else {
          const correctOptionIds = Array.isArray(qSnapshot.correct_answer_json)
            ? qSnapshot.correct_answer_json
            : JSON.parse(qSnapshot.correct_answer_json || '[]');

          isCorrect = selectedOptionId && correctOptionIds.includes(selectedOptionId);
          points = isCorrect ? 1.00 : 0.00;
          if (hintUsed) points -= 0.25;
          if (fiftyFiftyUsed) points -= 0.25;
          points = Math.max(0.00, points);
        }

        // Save answer and grade immediately
        if (existingAns) {
          await trx('attempt_answers')
            .where({ id: existingAns.id })
            .update({
              selected_option_id: finalOption,
              is_correct: isCorrect,
              points_awarded: points,
              time_taken_seconds: Math.min(30, elapsed),
              timed_out: timedOut,
              selected_at: now,
              graded_at: now
            });
        } else {
          await trx('attempt_answers').insert({
            attempt_id: attemptId,
            attempt_question_id: activeQ.id,
            selected_option_id: finalOption,
            is_correct: isCorrect,
            points_awarded: points,
            time_taken_seconds: Math.min(30, elapsed),
            timed_out: timedOut,
            selected_at: now,
            graded_at: now
          });
        }

        // Lock timing
        await trx('attempt_questions').where({ id: activeQ.id }).update({
          answered_at: timedOut ? null : now,
          timed_out_at: timedOut ? now : null
        });

        // Increment question index
        const nextIndex = currentQIndex + 1;
        await trx('quiz_attempts').where({ id: attemptId }).update({ current_question_index: nextIndex });

        if (nextIndex < attempt.question_count) {
          await trx('attempt_questions')
            .where({ attempt_id: attemptId, position: nextIndex })
            .update({ unlocked_at: now });
        }

        res.status(200).json({
          message: 'Answer saved.',
          isCorrect,
          explanation: qSnapshot.explanation
        });
      } else {
        // Assessment Mode (Editable, Graded at submit)
        const now = new Date();
        const existingAns = await trx('attempt_answers')
          .where({ attempt_question_id: activeQ.id })
          .first();

        if (existingAns) {
          await trx('attempt_answers')
            .where({ id: existingAns.id })
            .update({
              selected_option_id: selectedOptionId,
              selected_at: existingAns.selected_option_id ? existingAns.selected_at : now, // set on first selection (Patch 3)
              updated_at: now
            });
        } else {
          await trx('attempt_answers').insert({
            attempt_id: attemptId,
            attempt_question_id: activeQ.id,
            selected_option_id: selectedOptionId,
            selected_at: now,
            updated_at: now
          });
        }

        res.status(200).json({ message: 'Answer saved.' });
      }
    });
  } catch (err) {
    console.error('saveAnswer error:', err);
    if (err.message === 'ALREADY_ANSWERED') {
      res.status(409).json({ error: { message: 'This question has already been answered.' } });
    } else {
      res.status(500).json({ error: { message: 'Failed to save answer.' } });
    }
  }
}

// Controller to jump question index in Assessment Mode
export async function updateIndex(req, res) {
  const attemptId = req.params.id;
  const { index } = req.body;

  try {
    const attempt = await getActiveAttempt(attemptId);
    if (!attempt || attempt.status !== 'in_progress') {
      return res.status(400).json({ error: { message: 'Attempt is unavailable or finalized.' } });
    }

    // Verify ownership
    const principal = req.principal;
    if (attempt.user_id && attempt.user_id !== principal.userId) {
      return res.status(403).json({ error: { message: 'Access denied.' } });
    }
    if (attempt.guest_session_id && attempt.guest_session_id !== principal.guestSessionId) {
      return res.status(403).json({ error: { message: 'Access denied.' } });
    }

    const idx = parseInt(index);
    if (isNaN(idx) || idx < 0 || idx >= attempt.question_count) {
      return res.status(400).json({ error: { message: 'Invalid index parameter.' } });
    }

    await db('quiz_attempts').where({ id: attemptId }).update({ current_question_index: idx });
    res.status(200).json({ message: 'Question index updated.' });
  } catch (err) {
    console.error('updateIndex error:', err);
    res.status(500).json({ error: { message: 'Failed to update question index.' } });
  }
}

export async function submitAttempt(req, res) {
  const attemptId = req.params.id;

  try {
    const attempt = await db('quiz_attempts').where({ id: attemptId }).first();
    if (!attempt) {
      return res.status(404).json({ error: { message: 'Attempt not found.' } });
    }

    // Verify ownership
    const principal = req.principal;
    if (attempt.user_id && attempt.user_id !== principal.userId) {
      return res.status(403).json({ error: { message: 'Access denied.' } });
    }
    if (attempt.guest_session_id && attempt.guest_session_id !== principal.guestSessionId) {
      return res.status(403).json({ error: { message: 'Access denied.' } });
    }

    const isExpired = attempt.quiz_mode === 'assessment' && attempt.expires_at < new Date();
    const reason = isExpired ? 'expired' : 'manual';

    const results = await finalizeAttempt(attemptId, reason);
    res.status(200).json({ message: 'Quiz submitted successfully.', results });
  } catch (err) {
    console.error('submitAttempt error:', err);
    res.status(500).json({ error: { message: 'Failed to submit quiz.' } });
  }
}

export async function useLifelineHint(req, res) {
  const attemptId = req.params.id;

  try {
    const attempt = await getActiveAttempt(attemptId);
    if (!attempt || attempt.status !== 'in_progress') {
      return res.status(400).json({ error: { message: 'Attempt is finalized.' } });
    }

    // Verify ownership
    const principal = req.principal;
    if (attempt.user_id && attempt.user_id !== principal.userId) {
      return res.status(403).json({ error: { message: 'Access denied.' } });
    }
    if (attempt.guest_session_id && attempt.guest_session_id !== principal.guestSessionId) {
      return res.status(403).json({ error: { message: 'Access denied.' } });
    }

    const currentQIndex = attempt.current_question_index;

    const result = await db.transaction(async (trx) => {
      const activeQ = await trx('attempt_questions')
        .where({ attempt_id: attemptId, position: currentQIndex })
        .first()
        .forUpdate();

      const qSnapshot = typeof activeQ.question_snapshot_json === 'string'
        ? JSON.parse(activeQ.question_snapshot_json)
        : activeQ.question_snapshot_json;

      const existingAns = await trx('attempt_answers')
        .where({ attempt_question_id: activeQ.id })
        .first();

      if (existingAns && existingAns.hint_used) {
        throw new Error('HINT_ALREADY_USED');
      }

      if (existingAns) {
        await trx('attempt_answers')
          .where({ id: existingAns.id })
          .update({ hint_used: true });
      } else {
        await trx('attempt_answers').insert({
          attempt_id: attemptId,
          attempt_question_id: activeQ.id,
          hint_used: true
        });
      }

      return qSnapshot.hint;
    });

    res.status(200).json({ hintText: result });
  } catch (err) {
    console.error('useLifelineHint error:', err);
    if (err.message === 'HINT_ALREADY_USED') {
      res.status(409).json({ error: { message: 'Hint has already been used for this question.' } });
    } else {
      res.status(500).json({ error: { message: 'Failed to execute hint lifeline.' } });
    }
  }
}

export async function useLifelineFiftyFifty(req, res) {
  const attemptId = req.params.id;

  try {
    const attempt = await getActiveAttempt(attemptId);
    if (!attempt || attempt.status !== 'in_progress') {
      return res.status(400).json({ error: { message: 'Attempt is finalized.' } });
    }

    // Verify ownership
    const principal = req.principal;
    if (attempt.user_id && attempt.user_id !== principal.userId) {
      return res.status(403).json({ error: { message: 'Access denied.' } });
    }
    if (attempt.guest_session_id && attempt.guest_session_id !== principal.guestSessionId) {
      return res.status(403).json({ error: { message: 'Access denied.' } });
    }

    const currentQIndex = attempt.current_question_index;

    const result = await db.transaction(async (trx) => {
      const activeQ = await trx('attempt_questions')
        .where({ attempt_id: attemptId, position: currentQIndex })
        .first()
        .forUpdate();

      if (activeQ.eliminated_options_json) {
        throw new Error('FIFTY_FIFTY_ALREADY_USED');
      }

      const qSnapshot = typeof activeQ.question_snapshot_json === 'string'
        ? JSON.parse(activeQ.question_snapshot_json)
        : activeQ.question_snapshot_json;
      
      const correctOptionIds = typeof qSnapshot.correct_answer_json === 'string'
        ? JSON.parse(qSnapshot.correct_answer_json)
        : qSnapshot.correct_answer_json;

      const optionOrder = typeof activeQ.option_order_json === 'string'
        ? JSON.parse(activeQ.option_order_json)
        : activeQ.option_order_json;

      // Find options to eliminate
      const incorrectOptionIds = optionOrder.filter(id => !correctOptionIds.includes(id));

      // Eliminate exactly two incorrect options
      const shuffledIncorrect = secureShuffle(incorrectOptionIds);
      const toEliminate = shuffledIncorrect.slice(0, 2);

      await trx('attempt_questions')
        .where({ id: activeQ.id })
        .update({ eliminated_options_json: JSON.stringify(toEliminate) });

      const existingAns = await trx('attempt_answers')
        .where({ attempt_question_id: activeQ.id })
        .first();

      if (existingAns) {
        await trx('attempt_answers')
          .where({ id: existingAns.id })
          .update({ fifty_fifty_used: true });
      } else {
        await trx('attempt_answers').insert({
          attempt_id: attemptId,
          attempt_question_id: activeQ.id,
          fifty_fifty_used: true
        });
      }

      return toEliminate;
    });

    res.status(200).json({ eliminatedOptionIds: result });
  } catch (err) {
    console.error('useLifelineFiftyFifty error:', err);
    if (err.message === 'FIFTY_FIFTY_ALREADY_USED') {
      res.status(409).json({ error: { message: '50/50 lifeline has already been used.' } });
    } else {
      res.status(500).json({ error: { message: 'Failed to execute 50/50 lifeline.' } });
    }
  }
}
