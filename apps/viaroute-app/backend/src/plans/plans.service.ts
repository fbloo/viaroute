import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class PlansService {
  constructor(private db: DatabaseService) {}

  async create(createPlanDto: CreatePlanDto) {
    const id = randomUUID();
    await this.db
      .insertInto('plans')
      .values({
        id,
        tenant_id: createPlanDto.tenant_id,
        name: createPlanDto.name,
        features: createPlanDto.features || '{}',
        created_at: new Date(),
        updated_at: new Date(),
      })
      .execute();

    return this.findOne(id, createPlanDto.tenant_id);
  }

  async findAll(tenantId: string) {
    return this.db
      .selectFrom('plans')
      .selectAll()
      .where('tenant_id', '=', tenantId)
      .execute();
  }

  async findOne(id: string, tenantId: string) {
    const plan = await this.db
      .selectFrom('plans')
      .selectAll()
      .where('id', '=', id)
      .where('tenant_id', '=', tenantId)
      .executeTakeFirst();

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    return plan;
  }

  async update(id: string, tenantId: string, updatePlanDto: UpdatePlanDto) {
    await this.db
      .updateTable('plans')
      .set({
        ...updatePlanDto,
        updated_at: new Date(),
      })
      .where('id', '=', id)
      .where('tenant_id', '=', tenantId)
      .execute();

    return this.findOne(id, tenantId);
  }

  async remove(id: string, tenantId: string) {
    await this.db
      .deleteFrom('plans')
      .where('id', '=', id)
      .where('tenant_id', '=', tenantId)
      .execute();
    return { message: 'Plan deleted successfully' };
  }

  async findAllAdmin() {
    return this.db
      .selectFrom('plans')
      .selectAll()
      .execute();
  }
}

