import { IsNotEmpty, IsString, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDepartmentDto {
  @ApiProperty({ description: '部门名称', example: '技术部' })
  @IsNotEmpty({ message: '部门名称不能为空' })
  @IsString()
  name: string;

  @ApiProperty({ description: '部门编码', example: 'TECH' })
  @IsNotEmpty({ message: '部门编码不能为空' })
  @IsString()
  code: string;

  @ApiProperty({ description: '部门层级', example: 1 })
  @IsInt()
  @Min(1)
  level: number;

  @ApiProperty({ description: '父部门 ID', required: false })
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiProperty({ description: '部门负责人 ID', required: false })
  @IsOptional()
  @IsString()
  managerId?: string;

  @ApiProperty({ description: '预算管理员 ID', required: false })
  @IsOptional()
  @IsString()
  budgetAdminId?: string;

  @ApiProperty({ description: '排序号', example: 0, required: false })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
