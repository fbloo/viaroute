import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class TenantsService {
  constructor(private db: DatabaseService) {}

  async create(createTenantDto: CreateTenantDto) {
    const id = randomUUID();
    await this.db
      .insertInto('tenants')
      .values({
        id,
        name: createTenantDto.name,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .execute();

    return this.findOne(id);
  }

  async findAll() {
    return this.db.selectFrom('tenants').selectAll().execute();
  }

  async findOne(id: string) {
    const tenant = await this.db
      .selectFrom('tenants')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }

  async update(id: string, updateTenantDto: UpdateTenantDto) {
    await this.db
      .updateTable('tenants')
      .set({
        ...updateTenantDto,
        updated_at: new Date(),
      })
      .where('id', '=', id)
      .execute();

    return this.findOne(id);
  }

  async remove(id: string) {
    await this.db.deleteFrom('tenants').where('id', '=', id).execute();
    return { message: 'Tenant deleted successfully' };
  }
}

