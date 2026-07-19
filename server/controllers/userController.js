import db from '../config/db.js';

export async function getUserDashboard(req, res) {
  const userId = req.principal.userId;

  try {
    const user = await db('users').where({ id: userId }).first();
    if (!user) {
      return res.status(404).json({ error: { message: 'User not found.' } });
    }

    // 1. Attempts statistics
    const attemptsSummary = await db('quiz_attempts')
      .where({ user_id: userId, status: 'submitted' })
      .select(
        db.raw('count(id) as total_attempts'),
        db.raw('avg(percentage) as avg_score'),
        db.raw('max(percentage) as max_score')
      )
      .first();

    const totalAttempts = parseInt(attemptsSummary.total_attempts || 0);
    const averageScore = parseFloat(parseFloat(attemptsSummary.avg_score || 0.00).toFixed(2));
    const highestScore = parseFloat(parseFloat(attemptsSummary.max_score || 0.00).toFixed(2));

    // 2. Recent attempts (last 5)
    const recentAttempts = await db('quiz_attempts')
      .join('topics', 'quiz_attempts.topic_id', 'topics.id')
      .join('categories', 'quiz_attempts.category_id', 'categories.id')
      .where({ 'quiz_attempts.user_id': userId })
      .select(
        'quiz_attempts.id as attemptId',
        'quiz_attempts.status',
        'quiz_attempts.total_score as score',
        'quiz_attempts.max_score as maxScore',
        'quiz_attempts.percentage',
        'quiz_attempts.xp_earned as xpEarned',
        'quiz_attempts.submitted_at as attemptDate',
        'categories.name as categoryName',
        'topics.name as topicName',
        'quiz_attempts.difficulty'
      )
      .orderBy('quiz_attempts.started_at', 'desc')
      .limit(5);

    // 3. Earned badges
    const userBadges = await db('user_badges')
      .join('badges', 'user_badges.badge_id', 'badges.id')
      .where({ 'user_badges.user_id': userId })
      .select('badges.code', 'badges.name', 'badges.description', 'badges.icon', 'user_badges.earned_at as earnedAt')
      .orderBy('user_badges.earned_at', 'desc');

    // 4. Weak topics (topics where average score is < 80% and has at least 1 attempt)
    const topicStats = await db('quiz_attempts')
      .join('topics', 'quiz_attempts.topic_id', 'topics.id')
      .where({ 'quiz_attempts.user_id': userId, 'quiz_attempts.status': 'submitted' })
      .groupBy('topics.id', 'topics.name')
      .select(
        'topics.id as topicId',
        'topics.name as topicName',
        db.raw('avg(percentage) as avg_pct')
      );

    const weakTopics = topicStats
      .filter(t => parseFloat(t.avg_pct) < 80.00)
      .map(t => ({
        topicId: t.topicId,
        topicName: t.topicName,
        averagePercentage: parseFloat(parseFloat(t.avg_pct).toFixed(2))
      }));

    res.status(200).json({
      profile: {
        userId: user.id,
        displayName: user.display_name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatar_url,
        leaderboardOptIn: user.leaderboard_opt_in,
        totalXp: user.total_xp,
        currentLevel: user.current_level,
        currentStreak: user.current_streak,
        longestStreak: user.longest_streak
      },
      stats: {
        totalAttempts,
        averageScore,
        highestScore
      },
      recentAttempts,
      badges: userBadges,
      weakTopics
    });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to load user dashboard.' } });
  }
}

export async function updateUserProfile(req, res) {
  const userId = req.principal.userId;
  const { displayName, email, leaderboardOptIn } = req.body;

  try {
    if (email) {
      const existingUser = await db('users').where({ email }).andWhereNot({ id: userId }).first();
      if (existingUser) {
        return res.status(400).json({ error: { message: 'Email is already in use.' } });
      }
    }

    const updates = {};
    if (displayName !== undefined) updates.display_name = displayName;
    if (email !== undefined) updates.email = email;
    if (leaderboardOptIn !== undefined) updates.leaderboard_opt_in = !!leaderboardOptIn;

    if (Object.keys(updates).length > 0) {
      await db('users').where({ id: userId }).update(updates);
    }

    const updatedUser = await db('users').where({ id: userId }).first();

    res.status(200).json({
      message: 'Profile updated successfully.',
      user: {
        userId: updatedUser.id,
        displayName: updatedUser.display_name,
        email: updatedUser.email,
        role: updatedUser.role,
        avatarUrl: updatedUser.avatar_url,
        leaderboardOptIn: updatedUser.leaderboard_opt_in,
        totalXp: updatedUser.total_xp,
        currentLevel: updatedUser.current_level,
        currentStreak: updatedUser.current_streak,
        longestStreak: updatedUser.longest_streak
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { message: 'Failed to update profile.' } });
  }
}

export async function getUserCalendarActivity(req, res) {
  const userId = req.principal.userId;

  try {
    const oneYearAgo = new Date();
    oneYearAgo.setDate(oneYearAgo.getDate() - 365);

    const activityList = await db('quiz_attempts')
      .where({ user_id: userId, status: 'submitted' })
      .andWhere('submitted_at', '>=', oneYearAgo.toISOString())
      .select(
        db.raw('CAST(submitted_at AS DATE) as "activityDate"'),
        db.raw('sum(xp_earned) as "totalXp"'),
        db.raw('count(id) as "quizzesCompleted"'),
        db.raw('sum(total_score) as "questionsSolved"'),
        db.raw('sum(time_taken_seconds) as "studyTimeSeconds"')
      )
      .groupByRaw('CAST(submitted_at AS DATE)');

    const activityData = {};
    activityList.forEach((item) => {
      // Clean date string to YYYY-MM-DD
      const rawDate = item.activityDate;
      let dateStr = '';
      if (rawDate instanceof Date) {
        dateStr = rawDate.toISOString().split('T')[0];
      } else {
        dateStr = String(rawDate).split('T')[0];
      }
      
      const xp = parseInt(item.totalXp || 0);
      const quizzes = parseInt(item.quizzesCompleted || 0);
      const questions = parseInt(item.questionsSolved || 0);
      const studyTime = Math.ceil(parseInt(item.studyTimeSeconds || 0) / 60);

      // Map level 0-4 based on XP
      let level = 0;
      if (xp > 0) {
        if (xp <= 50) level = 1;
        else if (xp <= 150) level = 2;
        else if (xp <= 300) level = 3;
        else level = 4;
      }

      activityData[dateStr] = {
        level,
        xpEarned: xp,
        quizzesCompleted: quizzes,
        questionsSolved: questions,
        studyTimeMinutes: studyTime
      };
    });

    res.json(activityData);
  } catch (err) {
    console.error('Error fetching calendar activity:', err);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
}
