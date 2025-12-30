import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(AdminGuard)
  create(@Body() createUserDto: CreateUserDto, @Request() req: any) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll(@Request() req: any) {
    const isAdmin = req.user?.isAdminUser;
    const tenantId = req.user?.tenant_id || req.tenantId;
    
    if (isAdmin) {
      // Admin can see all users
      return this.usersService.findAllAdmin();
    }
    
    // Regular user can only see users in their tenant
    if (!tenantId) {
      throw new BadRequestException('Tenant ID is required');
    }
    return this.usersService.findAll(tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    const isAdmin = req.user?.isAdminUser;
    const tenantId = req.user?.tenant_id || req.tenantId;
    
    if (isAdmin) {
      // Admin can access any user (need to find by id only)
      // For now, we'll need to get tenant_id from the user record
      // This is a simplified version - in production you might want a findById method
      return this.usersService.findOne(id, tenantId || '');
    }
    
    // Regular user can only access users in their tenant
    if (!tenantId) {
      throw new BadRequestException('Tenant ID is required');
    }
    return this.usersService.findOne(id, tenantId);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req: any,
  ) {
    // Admin can update any user - need to get tenant_id from user record
    // For simplicity, we'll require tenant_id in the request or get it from the user
    const tenantId = req.user?.tenant_id || req.body.tenant_id;
    if (!tenantId) {
      throw new BadRequestException('Tenant ID is required');
    }
    return this.usersService.update(id, tenantId, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  remove(@Param('id') id: string, @Request() req: any) {
    // Admin can delete any user - need to get tenant_id from user record
    // For simplicity, we'll require tenant_id in the request
    const tenantId = req.user?.tenant_id || req.body.tenant_id;
    if (!tenantId) {
      throw new BadRequestException('Tenant ID is required');
    }
    return this.usersService.remove(id, tenantId);
  }
}

