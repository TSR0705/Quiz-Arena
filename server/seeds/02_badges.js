export async function seed(knex) {
  await knex('user_badges').del();
  await knex('badges').del();

  await knex('badges').insert([
    {
      code: 'first_quiz',
      name: 'First Quiz',
      description: 'Complete your first quiz attempt.',
      icon: 'Award',
      rule_json: JSON.stringify({ type: 'quiz_count', target: 1 })
    },
    {
      code: 'speedy_thinker',
      name: 'Speedy Thinker',
      description: 'Answer a correct question in under 10 seconds 5 times.',
      icon: 'Zap',
      rule_json: JSON.stringify({ type: 'speed_thinker', target: 5 })
    },
    {
      code: 'perfect_score',
      name: 'Perfect Score',
      description: 'Get a 100% score on a quiz with at least 5 questions.',
      icon: 'Star',
      rule_json: JSON.stringify({ type: 'perfect_score', target: 1 })
    },
    {
      code: 'quiz_master',
      name: 'Quiz Master',
      description: 'Complete 10 quiz attempts.',
      icon: 'Cpu',
      rule_json: JSON.stringify({ type: 'quiz_count', target: 10 })
    },
    {
      code: 'topic_specialist',
      name: 'Topic Specialist',
      description: 'Score 80% or higher on 5 quizzes of the same topic.',
      icon: 'Shield',
      rule_json: JSON.stringify({ type: 'topic_specialist', target: 5 })
    }
  ]);
}
