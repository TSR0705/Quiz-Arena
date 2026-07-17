import db from '../config/db.js';

async function createAuditLog(adminId, action, resourceType, resourceId, metadata = null) {
  try {
    await db('admin_audit_logs').insert({
      admin_id: adminId,
      action,
      resource_type: resourceType,
      resource_id: String(resourceId),
      metadata_json: metadata ? JSON.stringify(metadata) : null
    });
  } catch (err) {
    console.error('Failed to create audit log:', err.message);
  }
}

export async function createQuestion(req, res) {
  const { categoryId, topicId, difficulty, questionText, options, correctAnswer, hint, explanation } = req.body;

  if (!categoryId || !topicId || !difficulty || !questionText || !options || !correctAnswer || !explanation) {
    return res.status(400).json({ error: { message: 'Required fields missing.' } });
  }

  try {
    const [question] = await db('questions').insert({
      category_id: parseInt(categoryId),
      topic_id: parseInt(topicId),
      difficulty,
      question_text: questionText,
      options_json: JSON.stringify(options),
      correct_answer_json: JSON.stringify(correctAnswer),
      hint: hint || null,
      explanation,
      status: 'published'
    }).returning('*');

    await createAuditLog(req.principal.userId, 'CREATE_QUESTION', 'questions', question.id, { questionText });

    res.status(201).json(question);
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to create question.' } });
  }
}

export async function updateQuestion(req, res) {
  const { id } = req.params;
  const { categoryId, topicId, difficulty, questionText, options, correctAnswer, hint, explanation, status } = req.body;

  try {
    const existing = await db('questions').where({ id }).first();
    if (!existing) {
      return res.status(404).json({ error: { message: 'Question not found.' } });
    }

    const updates = {};
    if (categoryId !== undefined) updates.category_id = parseInt(categoryId);
    if (topicId !== undefined) updates.topic_id = parseInt(topicId);
    if (difficulty !== undefined) updates.difficulty = difficulty;
    if (questionText !== undefined) updates.question_text = questionText;
    if (options !== undefined) updates.options_json = JSON.stringify(options);
    if (correctAnswer !== undefined) updates.correct_answer_json = JSON.stringify(correctAnswer);
    if (hint !== undefined) updates.hint = hint || null;
    if (explanation !== undefined) updates.explanation = explanation;
    if (status !== undefined) updates.status = status;

    const [updated] = await db('questions')
      .where({ id })
      .update(updates)
      .returning('*');

    await createAuditLog(req.principal.userId, 'UPDATE_QUESTION', 'questions', id, updates);

    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to update question.' } });
  }
}

export async function deleteQuestion(req, res) {
  const { id } = req.params;

  try {
    const existing = await db('questions').where({ id }).first();
    if (!existing) {
      return res.status(404).json({ error: { message: 'Question not found.' } });
    }

    // Soft delete / archive question
    await db('questions').where({ id }).update({ status: 'archived' });

    await createAuditLog(req.principal.userId, 'ARCHIVE_QUESTION', 'questions', id);

    res.status(200).json({ message: 'Question archived successfully.' });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to archive question.' } });
  }
}

export async function getReports(req, res) {
  try {
    const reports = await db('question_reports')
      .join('questions', 'question_reports.question_id', 'questions.id')
      .leftJoin('users', 'question_reports.user_id', 'users.id')
      .select(
        'question_reports.*',
        'questions.question_text as questionText',
        'users.display_name as reporterName'
      )
      .orderBy('question_reports.created_at', 'desc');

    res.status(200).json(reports);
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to load reports.' } });
  }
}

export async function resolveReport(req, res) {
  const { id } = req.params;
  const { adminNotes } = req.body;

  try {
    const report = await db('question_reports').where({ id }).first();
    if (!report) {
      return res.status(404).json({ error: { message: 'Report not found.' } });
    }

    await db('question_reports')
      .where({ id })
      .update({
        status: 'resolved',
        admin_notes: adminNotes || null,
        resolved_at: new Date()
      });

    await createAuditLog(req.principal.userId, 'RESOLVE_REPORT', 'question_reports', id, { adminNotes });

    res.status(200).json({ message: 'Report resolved.' });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to resolve report.' } });
  }
}

export async function getAuditLogs(req, res) {
  try {
    const logs = await db('admin_audit_logs')
      .join('users', 'admin_audit_logs.admin_id', 'users.id')
      .select('admin_audit_logs.*', 'users.display_name as adminName')
      .orderBy('admin_audit_logs.created_at', 'desc')
      .limit(100);

    res.status(200).json(logs);
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to load audit logs.' } });
  }
}
