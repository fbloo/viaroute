import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { sql } from 'kysely';
import { DatabaseService } from './database.service';
import * as initialSchemaMigration from './migrations/001_initial_schema';
import * as addIsAdminUserMigration from './migrations/002_add_is_admin_user';

@Injectable()
export class MigrationService implements OnModuleInit {
  private readonly logger = new Logger(MigrationService.name);

  constructor(private readonly db: DatabaseService) {}

  async onModuleInit() {
    await this.runMigrations();
  }

  async runMigrations() {
    try {
      // Check if migrations table exists, if not create it
      await this.ensureMigrationsTable();

      // Run migrations in order
      await this.runMigration('001_initial_schema', initialSchemaMigration.up);
      await this.runMigration('002_add_is_admin_user', addIsAdminUserMigration.up);
    } catch (error) {
      this.logger.error('Failed to run migrations:', error);
      // Don't throw - allow app to start even if migrations fail
      // In production, you might want to throw here
    }
  }

  private async ensureMigrationsTable() {
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS kysely_migration (
          name VARCHAR(255) PRIMARY KEY,
          timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `.execute(this.db);
    } catch (error) {
      this.logger.warn('Could not create migrations table:', error);
    }
  }

  private async runMigration(migrationName: string, up: (db: any) => Promise<void>) {
    // Check if migration already ran using raw SQL
    const existing = await sql<{ name: string }>`
      SELECT name FROM kysely_migration WHERE name = ${migrationName}
    `.execute(this.db);

    if (existing.rows.length > 0) {
      this.logger.log(`Migration "${migrationName}" already executed, skipping`);
      return;
    }

    this.logger.log(`Running migration "${migrationName}"...`);

    try {
      await up(this.db);

      // Mark migration as completed using raw SQL
      await sql`
        INSERT INTO kysely_migration (name) VALUES (${migrationName})
      `.execute(this.db);

      this.logger.log(`Migration "${migrationName}" completed successfully`);
    } catch (error) {
      this.logger.error(`Migration "${migrationName}" failed:`, error);
      throw error;
    }
  }
}

