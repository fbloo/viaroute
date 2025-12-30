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
  ForbiddenException,
} from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { JwtAuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@Controller('tenants')
@UseGuards(JwtAuthGuard)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @UseGuards(AdminGuard)
  create(@Body() createTenantDto: CreateTenantDto) {
    return this.tenantsService.create(createTenantDto);
  }

  @Get()
  findAll(@Request() req: any) {
    const isAdmin = req.user?.isAdminUser;
    const tenantId = req.user?.tenant_id || req.tenantId;
    
    if (isAdmin) {
      // Admin can see all tenants
      return this.tenantsService.findAll();
    }
    
    // Regular user can only see their tenant
    if (!tenantId) {
      throw new ForbiddenException('Tenant ID is required');
    }
    return this.tenantsService.findOne(tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    const isAdmin = req.user?.isAdminUser;
    const tenantId = req.user?.tenant_id || req.tenantId;
    
    if (isAdmin) {
      // Admin can access any tenant
      return this.tenantsService.findOne(id);
    }
    
    // Regular user can only access their own tenant
    if (!tenantId || tenantId !== id) {
      throw new ForbiddenException('Cannot access other tenant');
    }
    return this.tenantsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  update(
    @Param('id') id: string,
    @Body() updateTenantDto: UpdateTenantDto,
    @Request() req: any,
  ) {
    return this.tenantsService.update(id, updateTenantDto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  remove(@Param('id') id: string, @Request() req: any) {
    return this.tenantsService.remove(id);
  }
}

