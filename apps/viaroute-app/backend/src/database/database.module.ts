import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseService } from './database.service';
import { MigrationService } from './migration.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [DatabaseService, MigrationService],
  exports: [DatabaseService],
})
export class DatabaseModule {}

