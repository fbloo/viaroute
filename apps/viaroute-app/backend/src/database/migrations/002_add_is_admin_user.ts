import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Add isAdminUser column to users table
  await db.schema
    .alterTable('users')
    .addColumn('is_admin_user', 'boolean', (col) => col.notNull().defaultTo(false))
    .execute();

  // Add auth0_sub column to users table
  await db.schema
    .alterTable('users')
    .addColumn('auth0_sub', 'varchar(255)', (col) => col)
    .execute();

  // Create unique index on auth0_sub
  await db.schema
    .createIndex('idx_users_auth0_sub')
    .ifNotExists()
    .on('users')
    .column('auth0_sub')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  // Drop index
  await db.schema.dropIndex('idx_users_auth0_sub').ifExists().execute();

  // Drop columns
  await db.schema
    .alterTable('users')
    .dropColumn('auth0_sub')
    .execute();

  await db.schema
    .alterTable('users')
    .dropColumn('is_admin_user')
    .execute();
}

