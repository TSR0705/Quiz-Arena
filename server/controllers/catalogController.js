import db from '../config/db.js';

export async function getCategories(req, res) {
  try {
    const categories = await db('categories').where({ is_active: true }).select('*');
    const topics = await db('topics').where({ is_active: true }).select('*');

    const formatted = categories.map(cat => {
      return {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        icon: cat.icon,
        topics: topics
          .filter(t => t.category_id === cat.id)
          .map(t => ({
            id: t.id,
            name: t.name,
            slug: t.slug,
            description: t.description
          }))
      };
    });

    res.status(200).json(formatted);
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to retrieve catalog.' } });
  }
}

export async function getQuestionCount(req, res) {
  const { topicId, difficulty } = req.query;

  if (!topicId || !difficulty) {
    return res.status(400).json({ error: { message: 'topicId and difficulty are required.' } });
  }

  try {
    const [result] = await db('questions')
      .where({
        topic_id: parseInt(topicId),
        difficulty,
        status: 'published'
      })
      .count('id as count');

    res.status(200).json({ count: parseInt(result.count || 0) });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to retrieve question count.' } });
  }
}
