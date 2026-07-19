export async function seed(knex) {
  // Truncate all tables in cascade order to allow safe re-runs
  await knex.raw('TRUNCATE TABLE categories, topics, questions, quiz_attempts, attempt_questions, attempt_answers, question_ratings, question_reports CASCADE;');

  const categories = await knex('categories').insert([
    { name: 'Computer Science', slug: 'computer-science', description: 'Challenge your CS fundamentals.', icon: 'Cpu' },
    { name: 'Web Development', slug: 'web-development', description: 'Frontend and backend development topics.', icon: 'Code' },
    { name: 'Software Engineering', slug: 'software-engineering', description: 'SDLC, Agile, and Design Patterns.', icon: 'Settings' },
    { name: 'Operating Systems', slug: 'operating-systems', description: 'Processes, memory management, and file systems.', icon: 'Terminal' },
    { name: 'Database Systems', slug: 'database-systems', description: 'Relational design, indexing, and SQL queries.', icon: 'Database' }
  ]).returning('*');

  const cs = categories.find(c => c.slug === 'computer-science');
  const web = categories.find(c => c.slug === 'web-development');
  const se = categories.find(c => c.slug === 'software-engineering');
  const os = categories.find(c => c.slug === 'operating-systems');
  const db = categories.find(c => c.slug === 'database-systems');

  await knex('topics').insert([
    // CS
    { category_id: cs.id, name: 'Data Structures', slug: 'data-structures', description: 'Arrays, Linked Lists, Trees, and Graphs.' },
    { category_id: cs.id, name: 'Algorithms', slug: 'algorithms', description: 'Sorting, searching, and algorithm design.' },
    { category_id: cs.id, name: 'Computer Networks', slug: 'computer-networks', description: 'OSI model, TCP/IP, and routing protocols.' },
    // Web
    { category_id: web.id, name: 'React', slug: 'react', description: 'Components, hooks, state, and routing.' },
    { category_id: web.id, name: 'Node.js', slug: 'node-js', description: 'Event loop, fs modules, and server building.' },
    // SE
    { category_id: se.id, name: 'Design Patterns', slug: 'design-patterns', description: 'Creational, Structural, and Behavioral patterns.' },
    { category_id: se.id, name: 'Testing', slug: 'testing', description: 'Unit, Integration, and E2E testing strategies.' },
    // OS
    { category_id: os.id, name: 'Scheduling', slug: 'scheduling', description: 'CPU scheduling algorithms.' },
    { category_id: os.id, name: 'Memory Management', slug: 'memory-management', description: 'Virtual memory, paging, and fragmentation.' },
    { category_id: os.id, name: 'File Systems', slug: 'file-systems', description: 'FAT, NTFS, inodes, and file access models.' },
    // DB
    { category_id: db.id, name: 'SQL Queries', slug: 'sql-queries', description: 'SELECT, JOINs, aggregations, and subqueries.' },
    { category_id: db.id, name: 'Transactions', slug: 'transactions', description: 'ACID properties, isolation levels, and locks.' }
  ]);
}
