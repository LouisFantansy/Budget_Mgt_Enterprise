import { IsNotEmpty, IsString, IsInt, IsNumberString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UrgencyLevel } from '@prisma/client';

export class CreatePurchaseRequestDto {
  @ApiProperty({ description: '预算 ID' })
  @IsNotEmpty()
  @IsString()
  budgetId: string;

  @ApiProperty({ description: '预算条目 ID', required: false })
  @IsOptional()
  @IsString()
  budgetItemId?: string;

  @ApiProperty({ description: '采购明细', type: 'array', items: { type: 'object' } })
  @IsNotEmpty()
  items: CreatePurchaseItemDto[];

  @ApiProperty({ description: '用途', example: '办公使用' })
  @IsNotEmpty()
  @IsString()
  purpose: string;

  @ApiProperty({ description: '紧急程度', enum: UrgencyLevel, default: UrgencyLevel.NORMAL })
  @IsOptional()
  @IsEnum(UrgencyLevel)
  urgencyLevel?: UrgencyLevel;

  @ApiProperty({ description: '备注', required: false })
  @IsOptional()
  @IsString()
  remark?: string;
}

export class CreatePurchaseItemDto {
  @ApiProperty({ description: '采购名称', example: '笔记本电脑' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: '规格型号', required: false })
  @IsOptional()
  @IsString()
  specification?: string;

  @ApiProperty({ description: '数量', example: 5 })
  @IsNotEmpty()
  @IsInt()
  quantity: number;

  @ApiProperty({ description: '单价', example: 8000 })
  @IsNotEmpty()
  @IsNumberString()
  unitPrice: string;

  @ApiProperty({ description: '供应商', required: false })
  @IsOptional()
  @IsString()
  supplier?: string;

  @ApiProperty({ description: '交货日期', required: false })
  @IsOptional()
  @IsString()
  deliveryDate?: string;

  @ApiProperty({ description: '备注', required: false })
  @IsOptional()
  @IsString()
  remark?: string;
}
