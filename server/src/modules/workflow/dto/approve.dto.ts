import { IsString, IsOptional, IsEnum } from 'class-validator';

export enum ApprovalActionEnum {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  WITHDRAW = 'WITHDRAW',
}

export class ApproveDto {
  @IsOptional()
  @IsString()
  comment?: string;
}

export class RejectDto {
  @IsString()
  comment: string;
}

export class WithdrawDto {
  @IsOptional()
  @IsString()
  comment?: string;
}
