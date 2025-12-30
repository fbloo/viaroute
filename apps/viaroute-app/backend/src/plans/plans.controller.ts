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
import { PlansService } from './plans.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { JwtAuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@Controller('plans')
@UseGuards(JwtAuthGuard)
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Post()
  @UseGuards(AdminGuard)
  create(@Body() createPlanDto: CreatePlanDto, @Request() req: any) {
    return this.plansService.create(createPlanDto);
  }

  @Get()
  findAll(@Request() req: any) {
    const isAdmin = req.user?.isAdminUser;
    const tenantId = req.user?.tenant_id || req.tenantId;
    
    if (isAdmin) {
      // Admin can see all plans
      return this.plansService.findAllAdmin();
    }
    
    // Regular user can only see plans for their tenant
    if (!tenantId) {
      throw new BadRequestException('Tenant ID is required');
    }
    return this.plansService.findAll(tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    const isAdmin = req.user?.isAdminUser;
    const tenantId = req.user?.tenant_id || req.tenantId;
    
    if (isAdmin) {
      // Admin can access any plan - need tenant_id from plan record
      // For now, require tenant_id in query or get from plan
      if (!tenantId) {
        throw new BadRequestException('Tenant ID is required');
      }
      return this.plansService.findOne(id, tenantId);
    }
    
    // Regular user can only access plans for their tenant
    if (!tenantId) {
      throw new BadRequestException('Tenant ID is required');
    }
    return this.plansService.findOne(id, tenantId);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  update(
    @Param('id') id: string,
    @Body() updatePlanDto: UpdatePlanDto,
    @Request() req: any,
  ) {
    const tenantId = req.user?.tenant_id || req.body.tenant_id;
    if (!tenantId) {
      throw new BadRequestException('Tenant ID is required');
    }
    return this.plansService.update(id, tenantId, updatePlanDto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  remove(@Param('id') id: string, @Request() req: any) {
    const tenantId = req.user?.tenant_id || req.body.tenant_id;
    if (!tenantId) {
      throw new BadRequestException('Tenant ID is required');
    }
    return this.plansService.remove(id, tenantId);
  }
}

