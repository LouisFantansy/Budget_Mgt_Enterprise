import { IsString, IsOptional, IsBoolean, IsInt, IsJSON, IsObject } from 'class-validator';

export class CreateWorkflowDto {
  @IsString()
  name: string;

  @IsString()
  type: string;

  @IsObject()
  steps: {
    name: string;
    approverRole: string;
    approverId?: string;
  }[];

  @IsOptional()
  @IsObject()
  conditions?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  version?: number;
}
