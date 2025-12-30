import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Create tenants table
  await db.schema
    .createTable('tenants')
    .ifNotExists()
    .addColumn('id', 'varchar(255)', (col) => col.primaryKey())
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addColumn('created_at', 'timestamp', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('updated_at', 'timestamp', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute();

  // Create users table
  await db.schema
    .createTable('users')
    .ifNotExists()
    .addColumn('id', 'varchar(255)', (col) => col.primaryKey())
    .addColumn('tenant_id', 'varchar(255)', (col) => col.notNull().references('tenants.id').onDelete('cascade'))
    .addColumn('email', 'varchar(255)', (col) => col.notNull())
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addColumn('created_at', 'timestamp', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('updated_at', 'timestamp', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addUniqueConstraint('users_tenant_email_unique', ['tenant_id', 'email'])
    .execute();

  // Create plans table
  await db.schema
    .createTable('plans')
    .ifNotExists()
    .addColumn('id', 'varchar(255)', (col) => col.primaryKey())
    .addColumn('tenant_id', 'varchar(255)', (col) => col.notNull().references('tenants.id').onDelete('cascade'))
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addColumn('features', 'text', (col) => col.notNull().defaultTo('{}'))
    .addColumn('created_at', 'timestamp', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('updated_at', 'timestamp', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute();

  // Create indexes
  await db.schema.createIndex('idx_users_tenant_id').ifNotExists().on('users').column('tenant_id').execute();
  await db.schema.createIndex('idx_plans_tenant_id').ifNotExists().on('plans').column('tenant_id').execute();

  // Create function to update updated_at timestamp
  await sql`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    $$ language 'plpgsql';
  `.execute(db);

  // Create triggers
  await sql`
    DROP TRIGGER IF EXISTS update_tenants_updated_at ON tenants;
    CREATE TRIGGER update_tenants_updated_at 
      BEFORE UPDATE ON tenants
      FOR EACH ROW 
      EXECUTE FUNCTION update_updated_at_column();
  `.execute(db);

  await sql`
    DROP TRIGGER IF EXISTS update_users_updated_at ON users;
    CREATE TRIGGER update_users_updated_at 
      BEFORE UPDATE ON users
      FOR EACH ROW 
      EXECUTE FUNCTION update_updated_at_column();
  `.execute(db);

  await sql`
    DROP TRIGGER IF EXISTS update_plans_updated_at ON plans;
    CREATE TRIGGER update_plans_updated_at 
      BEFORE UPDATE ON plans
      FOR EACH ROW 
      EXECUTE FUNCTION update_updated_at_column();
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  // Drop triggers
  await sql`DROP TRIGGER IF EXISTS update_plans_updated_at ON plans`.execute(db);
  await sql`DROP TRIGGER IF EXISTS update_users_updated_at ON users`.execute(db);
  await sql`DROP TRIGGER IF EXISTS update_tenants_updated_at ON tenants`.execute(db);

  // Drop function
  await sql`DROP FUNCTION IF EXISTS update_updated_at_column()`.execute(db);

  // Drop tables (in reverse order due to foreign keys)
  await db.schema.dropTable('plans').ifExists().execute();
  await db.schema.dropTable('users').ifExists().execute();
  await db.schema.dropTable('tenants').ifExists().execute();
}

