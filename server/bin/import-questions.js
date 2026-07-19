import fs from 'fs';
import path from 'path';
import knex from 'knex';
import knexConfig from '../knexfile.js';

const db = knex(knexConfig[process.env.NODE_ENV || 'development']);

async function importQuestions(filePath) {
  try {
    const rawData = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(rawData);

    if (!Array.isArray(data)) {
      throw new Error('JSON root must be an array of questions.');
    }

    console.log(`Validating and importing ${data.length} questions...`);

    const topics = await db('topics').select('*');
    const categories = await db('categories').select('*');

    const toInsert = [];

    for (let i = 0; i < data.length; i++) {
      const q = data[i];
      const indexStr = `at index ${i}`;

      if (!q.categorySlug || !q.topicSlug) {
        throw new Error(`Question ${indexStr} is missing categorySlug or topicSlug.`);
      }

      const category = categories.find(c => c.slug === q.categorySlug);
      if (!category) {
        throw new Error(`Category "${q.categorySlug}" does not exist in the database.`);
      }

      const topic = topics.find(t => t.slug === q.topicSlug);
      if (!topic) {
        throw new Error(`Topic "${q.topicSlug}" does not exist in the database.`);
      }

      if (!q.questionText || typeof q.questionText !== 'string') {
        throw new Error(`Question ${indexStr} has invalid questionText.`);
      }

      if (!Array.isArray(q.options) || q.options.length !== 4) {
        throw new Error(`Question ${indexStr} options must be an array of exactly 4 elements.`);
      }

      // Validate options have id and text
      for (const opt of q.options) {
        if (!opt.id || !opt.text) {
          throw new Error(`Question ${indexStr} option ${JSON.stringify(opt)} is missing id or text.`);
        }
      }

      if (!Array.isArray(q.correctAnswer) || q.correctAnswer.length === 0) {
        throw new Error(`Question ${indexStr} correctAnswer must be a non-empty array of option IDs.`);
      }

      // Validate correct option IDs exist in options
      const optionIds = q.options.map(o => o.id);
      for (const correctId of q.correctAnswer) {
        if (!optionIds.includes(correctId)) {
          throw new Error(`Question ${indexStr} correct option "${correctId}" is not in the options list.`);
        }
      }

      if (!q.explanation || typeof q.explanation !== 'string') {
        throw new Error(`Question ${indexStr} has invalid explanation.`);
      }

      if (!q.difficulty || !['easy', 'medium', 'hard'].includes(q.difficulty)) {
        throw new Error(`Question ${indexStr} difficulty must be one of: easy, medium, hard.`);
      }

      toInsert.push({
        category_id: category.id,
        topic_id: topic.id,
        difficulty: q.difficulty,
        question_text: q.questionText,
        options_json: JSON.stringify(q.options),
        correct_answer_json: JSON.stringify(q.correctAnswer),
        hint: q.hint || null,
        explanation: q.explanation,
        status: q.status || 'published'
      });
    }

    await db('questions').insert(toInsert);
    console.log(`Successfully imported ${toInsert.length} questions!`);
    process.exit(0);
  } catch (err) {
    console.error('Import failed:', err.message);
    process.exit(1);
  }
}

const fileArg = process.argv[2];
if (!fileArg) {
  console.log('Usage: npm run import-questions <path_to_json_file>');
  process.exit(1);
}

importQuestions(path.resolve(fileArg));
