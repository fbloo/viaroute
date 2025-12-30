import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import { Database } from './schema';

@Injectable()
export class DatabaseService extends Kysely<Database> implements OnModuleInit {
  constructor(private configService: ConfigService) {
    const dialect = new PostgresDialect({
      pool: new Pool({
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT') || 5432,
        database: configService.get<string>('DB_NAME', 'viaroute'),
        user: configService.get<string>('DB_USER', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'postgres'),
      }),
    });

    super({
      dialect,
    });
  }

  async onModuleInit() {
    // Connection is established, migrations will be run by MigrationService
    // Test connection after a brief delay to allow migrations to complete
    setTimeout(async () => {
      try {
        await this.selectFrom('tenants').select('id').limit(1).execute();
        console.log('Database connection verified');
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn('Database connection test failed:', message);
      }
    }, 2000);
  }
}

