import db from '../config/db.js';

export async function getLeaderboard(req, res) {
  const { categoryId, topicId, difficulty, period } = req.query;

  try {
    let query = db('quiz_attempts')
      .join('users', 'quiz_attempts.user_id', 'users.id')
      .join('topics', 'quiz_attempts.topic_id', 'topics.id')
      .join('categories', 'quiz_attempts.category_id', 'categories.id')
      .where({
        'quiz_attempts.status': 'submitted',
        'users.leaderboard_opt_in': true
      })
      .select(
        'quiz_attempts.id as attemptId',
        'users.display_name as displayName',
        'quiz_attempts.total_score as score',
        'quiz_attempts.max_score as maxScore',
        'quiz_attempts.percentage',
        'quiz_attempts.xp_earned as xpEarned',
        'quiz_attempts.time_taken_seconds as timeTakenSeconds',
        'quiz_attempts.submitted_at as attemptDate',
        'categories.name as categoryName',
        'topics.name as topicName',
        'quiz_attempts.difficulty'
      );

    if (categoryId) {
      query = query.andWhere('quiz_attempts.category_id', parseInt(categoryId));
    }
    if (topicId) {
      query = query.andWhere('quiz_attempts.topic_id', parseInt(topicId));
    }
    if (difficulty) {
      query = query.andWhere('quiz_attempts.difficulty', difficulty);
    }

    const now = new Date();
    if (period === 'daily') {
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      query = query.andWhere('quiz_attempts.submitted_at', '>=', oneDayAgo);
    } else if (period === 'weekly') {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      query = query.andWhere('quiz_attempts.submitted_at', '>=', oneWeekAgo);
    }

    // Sort by percentage descending, then time taken ascending (faster wins tie breakers)
    const attempts = await query
      .orderBy('quiz_attempts.percentage', 'desc')
      .orderBy('quiz_attempts.time_taken_seconds', 'asc')
      .orderBy('quiz_attempts.submitted_at', 'desc')
      .limit(50);

    const ranked = attempts.map((a, idx) => ({
      rank: idx + 1,
      ...a
    }));

    res.status(200).json(ranked);
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to retrieve leaderboard.' } });
  }
}
