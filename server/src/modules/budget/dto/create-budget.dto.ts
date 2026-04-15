import { IsNotEmpty, IsString, IsInt, IsNumberString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BudgetType } from '@prisma/client';

export class CreateBudgetDto {
  @ApiProperty({ description: '预算名称', example: '2026 年度技术部预算' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: '部门 ID' })
  @IsNotEmpty()
  @IsString()
  departmentId: string;

  @ApiProperty({ description: '预算类型', enum: BudgetType })
  @IsNotEmpty()
  @IsEnum(BudgetType)
  type: BudgetType;

  @ApiProperty({ description: '年份', example: 2026 })
  @IsNotEmpty()
  @IsInt()
  year: number;

  @ApiProperty({ description: '总金额', example: 1000000 })
  @IsNotEmpty()
  @IsNumberString()
  totalAmount: string;

  @ApiProperty({ description: '付款主体', required: false })
  @IsOptional()
  @IsString()
  paymentEntity?: string;

  @ApiProperty({ description: '组别', required: false })
  @IsOptional()
  @IsString()
  group?: string;

  @ApiProperty({ description: '会计科目代码', required: false })
  @IsOptional()
  @IsString()
  accountCode?: string;

  @ApiProperty({ description: '备注', required: false })
  @IsOptional()
  @IsString()
  remark?: string;

  @ApiProperty({ description: '预算明细', required: false, type: 'array', items: { type: 'object' } })
  @IsOptional()
  items?: CreateBudgetItemDto[];
}

export class CreateBudgetItemDto {
  @ApiProperty({ description: '采购名称', example: '服务器采购' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: '费用类别', example: '硬件设备' })
  @IsNotEmpty()
  @IsString()
  category: string;

  @ApiProperty({ description: '规格型号', required: false })
  @IsOptional()
  @IsString()
  specification?: string;

  @ApiProperty({ description: '功能描述', required: false })
  @IsOptional()
  @IsString()
  function?: string;

  @ApiProperty({ description: '单价', example: 50000 })
  @IsNotEmpty()
  @IsNumberString()
  unitPrice: string;

  @ApiProperty({ description: '数量', example: 10 })
  @IsNotEmpty()
  @IsInt()
  quantity: number;

  @ApiProperty({ description: '付款主体', required: false })
  @IsOptional()
  @IsString()
  paymentEntity?: string;

  @ApiProperty({ description: '组别', required: false })
  @IsOptional()
  @IsString()
  group?: string;

  @ApiProperty({ description: '会计科目代码', required: false })
  @IsOptional()
  @IsString()
  accountCode?: string;

  @ApiProperty({ description: '月度计划', required: false })
  @IsOptional()
  monthlyPlan?: Record<number, number>;

  @ApiProperty({ description: '项目', required: false })
  @IsOptional()
  @IsString()
  project?: string;

  @ApiProperty({ description: '用途', required: false })
  @IsOptional()
  @IsString()
  purpose?: string;

  @ApiProperty({ description: '供应商', required: false })
  @IsOptional()
  @IsString()
  supplier?: string;

  @ApiProperty({ description: '交货日期', required: false })
  @IsOptional()
  @IsString()
  deliveryDate?: string;

  @ApiProperty({ description: '排序号', example: 0, required: false })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
