import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class UsersService {
  constructor(private db: DatabaseService) {}

  async create(createUserDto: CreateUserDto, auth0Sub?: string) {
    const id = randomUUID();
    await this.db
      .insertInto('users')
      .values({
        id,
        tenant_id: createUserDto.tenant_id,
        name: createUserDto.name,
        email: createUserDto.email,
        auth0_sub: auth0Sub || null,
        is_admin_user: false,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .execute();

    return this.findOne(id, createUserDto.tenant_id);
  }

  async findAll(tenantId: string) {
    return this.db
      .selectFrom('users')
      .selectAll()
      .where('tenant_id', '=', tenantId)
      .execute();
  }

  async findOne(id: string, tenantId: string) {
    const user = await this.db
      .selectFrom('users')
      .selectAll()
      .where('id', '=', id)
      .where('tenant_id', '=', tenantId)
      .executeTakeFirst();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(id: string, tenantId: string, updateUserDto: UpdateUserDto) {
    await this.db
      .updateTable('users')
      .set({
        ...updateUserDto,
        updated_at: new Date(),
      })
      .where('id', '=', id)
      .where('tenant_id', '=', tenantId)
      .execute();

    return this.findOne(id, tenantId);
  }

  async remove(id: string, tenantId: string) {
    await this.db
      .deleteFrom('users')
      .where('id', '=', id)
      .where('tenant_id', '=', tenantId)
      .execute();
    return { message: 'User deleted successfully' };
  }

  async findByEmail(email: string) {
    return this.db
      .selectFrom('users')
      .selectAll()
      .where('email', '=', email)
      .executeTakeFirst();
  }

  async findByAuth0Sub(auth0Sub: string) {
    return this.db
      .selectFrom('users')
      .selectAll()
      .where('auth0_sub', '=', auth0Sub)
      .executeTakeFirst();
  }

  async findAllAdmin() {
    return this.db
      .selectFrom('users')
      .selectAll()
      .execute();
  }
}

