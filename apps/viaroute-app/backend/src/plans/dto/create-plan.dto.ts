import { IsString, IsNotEmpty, IsObject, IsOptional } from 'class-validator';

export class CreatePlanDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  tenant_id: string;

  @IsString()
  @IsOptional()
  features?: string; // JSON string
}

