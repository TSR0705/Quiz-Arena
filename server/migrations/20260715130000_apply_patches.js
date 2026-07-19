export async function up(knex) {
  // 1. Modify attempt_answers: selected_at drops default and becomes nullable
  await knex.raw('ALTER TABLE attempt_answers ALTER COLUMN selected_at DROP DEFAULT;');
  await knex.raw('ALTER TABLE attempt_answers ALTER COLUMN selected_at DROP NOT NULL;');

  // 2. Modify quiz_attempts: add finalization_reason
  await knex.schema.alterTable('quiz_attempts', (table) => {
    table.string('finalization_reason', 50).nullable();
  });

  // 3. Modify user_badges: UNIQUE(user_id, badge_id) instead of UNIQUE(user_id, badge_id, attempt_id)
  await knex.schema.alterTable('user_badges', (table) => {
    table.dropUnique(['user_id', 'badge_id', 'attempt_id']);
    table.unique(['user_id', 'badge_id']);
  });
}

export async function down(knex) {
  await knex.schema.alterTable('user_badges', (table) => {
    table.dropUnique(['user_id', 'badge_id']);
    table.unique(['user_id', 'badge_id', 'attempt_id']);
  });

  await knex.schema.alterTable('quiz_attempts', (table) => {
    table.dropColumn('finalization_reason');
  });

  await knex.raw('ALTER TABLE attempt_answers ALTER COLUMN selected_at SET DEFAULT CURRENT_TIMESTAMP;');
}
