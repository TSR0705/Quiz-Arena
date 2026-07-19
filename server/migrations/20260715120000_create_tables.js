export async function up(knex) {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
  
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('email').unique().notNullable();
    table.string('password_hash').notNullable();
    table.string('display_name', 100).notNullable();
    table.string('role', 20).notNullable().defaultTo('user');
    table.text('avatar_url');
    table.boolean('leaderboard_opt_in').notNullable().defaultTo(true);
    table.integer('total_xp').notNullable().defaultTo(0);
    table.integer('current_level').notNullable().defaultTo(1);
    table.integer('current_streak').notNullable().defaultTo(0);
    table.integer('longest_streak').notNullable().defaultTo(0);
    table.date('last_activity_date');
    table.timestamps(true, true);
  });

  await knex.schema.createTable('guest_sessions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('token_hash', 64).unique().notNullable();
    table.timestamp('expires_at', { useTz: true }).notNullable();
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('categories', (table) => {
    table.increments('id').primary();
    table.string('name', 100).notNullable();
    table.string('slug', 100).unique().notNullable();
    table.text('description');
    table.string('icon', 100);
    table.boolean('is_active').notNullable().defaultTo(true);
  });

  await knex.schema.createTable('topics', (table) => {
    table.increments('id').primary();
    table.integer('category_id').unsigned().notNullable().references('id').inTable('categories').onDelete('CASCADE');
    table.string('name', 100).notNullable();
    table.string('slug', 100).unique().notNullable();
    table.text('description');
    table.boolean('is_active').notNullable().defaultTo(true);
  });

  await knex.schema.createTable('questions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.integer('category_id').unsigned().notNullable().references('id').inTable('categories');
    table.integer('topic_id').unsigned().notNullable().references('id').inTable('topics');
    table.string('difficulty', 20).notNullable();
    table.string('question_type', 50).notNullable().defaultTo('single_choice');
    table.text('question_text').notNullable();
    table.jsonb('options_json').notNullable();
    table.jsonb('correct_answer_json').notNullable();
    table.text('hint');
    table.text('explanation').notNullable();
    table.string('status', 20).notNullable().defaultTo('published');
    table.timestamps(true, true);
  });

  await knex.schema.createTable('quiz_attempts', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');
    table.uuid('guest_session_id').references('id').inTable('guest_sessions').onDelete('SET NULL');
    table.integer('category_id').unsigned().notNullable().references('id').inTable('categories');
    table.integer('topic_id').unsigned().notNullable().references('id').inTable('topics');
    table.string('difficulty', 20).notNullable();
    table.integer('question_count').notNullable();
    table.string('quiz_mode', 20).notNullable().defaultTo('assessment');
    table.string('status', 20).notNullable().defaultTo('in_progress');
    table.timestamp('started_at', { useTz: true }).notNullable();
    table.timestamp('expires_at', { useTz: true });
    table.integer('current_question_index').notNullable().defaultTo(0);
    table.timestamp('submitted_at', { useTz: true });
    table.decimal('total_score', 5, 2).defaultTo(0.00);
    table.integer('max_score').notNullable();
    table.decimal('percentage', 5, 2).defaultTo(0.00);
    table.integer('xp_earned').defaultTo(0);
    table.integer('time_taken_seconds').defaultTo(0);
  });

  await knex.raw(`
    ALTER TABLE quiz_attempts ADD CONSTRAINT chk_attempt_ownership CHECK (
      (user_id IS NOT NULL AND guest_session_id IS NULL) OR 
      (user_id IS NULL AND guest_session_id IS NOT NULL)
    );
    ALTER TABLE quiz_attempts ADD CONSTRAINT chk_quiz_mode_expiry CHECK (
      (quiz_mode = 'assessment' AND expires_at IS NOT NULL) OR
      (quiz_mode = 'practice' AND expires_at IS NULL)
    );
  `);

  await knex.schema.createTable('attempt_questions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('attempt_id').notNullable().references('id').inTable('quiz_attempts').onDelete('CASCADE');
    table.uuid('question_id').notNullable().references('id').inTable('questions');
    table.jsonb('question_snapshot_json').notNullable();
    table.integer('position').notNullable();
    table.jsonb('option_order_json').notNullable();
    table.jsonb('eliminated_options_json');
    table.timestamp('unlocked_at', { useTz: true });
    table.timestamp('answered_at', { useTz: true });
    table.timestamp('timed_out_at', { useTz: true });
    table.unique(['attempt_id', 'question_id']);
    table.unique(['attempt_id', 'position']);
  });

  await knex.schema.createTable('attempt_answers', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('attempt_id').notNullable().references('id').inTable('quiz_attempts').onDelete('CASCADE');
    table.uuid('attempt_question_id').notNullable().references('id').inTable('attempt_questions').onDelete('CASCADE');
    table.string('selected_option_id', 50);
    table.boolean('is_correct').defaultTo(null);
    table.decimal('points_awarded', 3, 2).defaultTo(null);
    table.integer('time_taken_seconds').defaultTo(null);
    table.boolean('hint_used').defaultTo(false);
    table.boolean('fifty_fifty_used').defaultTo(false);
    table.boolean('flagged').defaultTo(false);
    table.boolean('timed_out').defaultTo(false);
    table.timestamp('selected_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('graded_at', { useTz: true }).defaultTo(null);
    table.unique(['attempt_id', 'attempt_question_id']);
  });

  await knex.schema.createTable('question_ratings', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('attempt_question_id').unique().notNullable().references('id').inTable('attempt_questions').onDelete('CASCADE');
    table.string('rating', 20).notNullable();
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  await knex.raw(`
    ALTER TABLE question_ratings ADD CONSTRAINT chk_rating_value CHECK (
      rating IN ('helpful', 'confusing', 'incorrect')
    );
  `);

  await knex.schema.createTable('badges', (table) => {
    table.increments('id').primary();
    table.string('code', 50).unique().notNullable();
    table.string('name', 100).notNullable();
    table.text('description').notNullable();
    table.string('icon', 100).notNullable();
    table.jsonb('rule_json').notNullable();
  });

  await knex.schema.createTable('user_badges', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('badge_id').notNullable().references('id').inTable('badges').onDelete('CASCADE');
    table.timestamp('earned_at', { useTz: true }).defaultTo(knex.fn.now());
    table.uuid('attempt_id').references('id').inTable('quiz_attempts').onDelete('SET NULL');
    table.unique(['user_id', 'badge_id', 'attempt_id']);
  });

  await knex.schema.createTable('certificates', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('attempt_id').unique().notNullable().references('id').inTable('quiz_attempts').onDelete('CASCADE');
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('verification_code', 64).unique().notNullable();
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('question_reports', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('question_id').notNullable().references('id').inTable('questions');
    table.uuid('attempt_id').notNullable().references('id').inTable('quiz_attempts');
    table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');
    table.string('report_type', 50).notNullable();
    table.text('message').notNullable();
    table.string('status', 20).notNullable().defaultTo('open');
    table.text('admin_notes');
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('resolved_at', { useTz: true });
    table.unique(['attempt_id', 'question_id']);
  });

  await knex.schema.createTable('contact_messages', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 100).notNullable();
    table.string('email', 255).notNullable();
    table.text('message').notNullable();
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('newsletter_subscribers', (table) => {
    table.string('email', 255).primary();
    table.string('status', 50).notNullable().defaultTo('subscribed');
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('admin_audit_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('admin_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('action', 100).notNullable();
    table.string('resource_type', 50).notNullable();
    table.string('resource_id', 50).notNullable();
    table.jsonb('metadata_json');
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('refresh_tokens', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('session_id').notNullable();
    table.string('token_hash', 64).unique().notNullable();
    table.integer('lineage_version').notNullable().defaultTo(1);
    table.timestamp('expires_at', { useTz: true }).notNullable();
    table.boolean('is_revoked').notNullable().defaultTo(false);
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('password_resets', (table) => {
    table.increments('id').primary();
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('token_hash', 64).unique().notNullable();
    table.timestamp('expires_at', { useTz: true }).notNullable();
    table.boolean('is_used').notNullable().defaultTo(false);
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });
}

export async function down(knex) {
  // Ordered drops in reverse dependency order
  await knex.schema.dropTableIfExists('password_resets');
  await knex.schema.dropTableIfExists('refresh_tokens');
  await knex.schema.dropTableIfExists('admin_audit_logs');
  await knex.schema.dropTableIfExists('newsletter_subscribers');
  await knex.schema.dropTableIfExists('contact_messages');
  await knex.schema.dropTableIfExists('question_reports');
  await knex.schema.dropTableIfExists('certificates');
  await knex.schema.dropTableIfExists('user_badges');
  await knex.schema.dropTableIfExists('badges');
  await knex.schema.dropTableIfExists('question_ratings');
  await knex.schema.dropTableIfExists('attempt_answers');
  await knex.schema.dropTableIfExists('attempt_questions');
  await knex.schema.dropTableIfExists('quiz_attempts');
  await knex.schema.dropTableIfExists('questions');
  await knex.schema.dropTableIfExists('topics');
  await knex.schema.dropTableIfExists('categories');
  await knex.schema.dropTableIfExists('guest_sessions');
  await knex.schema.dropTableIfExists('users');
}
