import db from '../config/db.js';

export async function rateQuestion(req, res) {
  const { attemptQuestionId, rating } = req.body;

  if (!attemptQuestionId || !rating) {
    return res.status(400).json({ error: { message: 'attemptQuestionId and rating are required.' } });
  }

  if (!['helpful', 'confusing', 'incorrect'].includes(rating)) {
    return res.status(400).json({ error: { message: 'Invalid rating value.' } });
  }

  try {
    const aq = await db('attempt_questions').where({ id: attemptQuestionId }).first();
    if (!aq) {
      return res.status(404).json({ error: { message: 'Attempt question not found.' } });
    }

    // Verify ownership of the attempt
    const attempt = await db('quiz_attempts').where({ id: aq.attempt_id }).first();
    const principal = req.principal;
    if (attempt.user_id && attempt.user_id !== principal.userId) {
      return res.status(403).json({ error: { message: 'Access denied.' } });
    }
    if (attempt.guest_session_id && attempt.guest_session_id !== principal.guestSessionId) {
      return res.status(403).json({ error: { message: 'Access denied.' } });
    }

    // Upsert rating using ON CONFLICT to prevent rating spam (Patch 4)
    await db('question_ratings')
      .insert({
        attempt_question_id: attemptQuestionId,
        rating
      })
      .onConflict('attempt_question_id')
      .merge({
        rating,
        updated_at: db.fn.now()
      });

    res.status(200).json({ message: 'Rating saved.' });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to submit rating.' } });
  }
}

export async function reportQuestion(req, res) {
  const { questionId, attemptId, reportType, message } = req.body;

  if (!questionId || !attemptId || !reportType || !message) {
    return res.status(400).json({ error: { message: 'questionId, attemptId, reportType, and message are required.' } });
  }

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

    // Insert report, unique on attempt_id + question_id to prevent double report
    await db('question_reports')
      .insert({
        question_id: questionId,
        attempt_id: attemptId,
        user_id: principal.type === 'user' ? principal.userId : null,
        report_type: reportType,
        message,
        status: 'open'
      })
      .onConflict(['attempt_id', 'question_id'])
      .merge({
        report_type: reportType,
        message,
        status: 'open',
        resolved_at: null
      });

    res.status(201).json({ message: 'Report submitted successfully.' });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to submit report.' } });
  }
}

export async function submitContactMessage(req, res) {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: { message: 'Name, email, and message are required.' } });
  }

  try {
    await db('contact_messages').insert({
      name,
      email: email.toLowerCase(),
      message
    });
    res.status(201).json({ message: 'Message sent successfully.' });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to send message.' } });
  }
}

export async function subscribeNewsletter(req, res) {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: { message: 'Email is required.' } });
  }

  try {
    await db('newsletter_subscribers')
      .insert({ email: email.toLowerCase() })
      .onConflict('email')
      .ignore();
    res.status(200).json({ message: 'Thank you for subscribing!' });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to subscribe.' } });
  }
}
