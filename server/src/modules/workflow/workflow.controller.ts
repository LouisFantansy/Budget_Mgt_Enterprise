import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { WorkflowEngineService } from './workflow-engine.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { ApproveDto, RejectDto, WithdrawDto } from './dto/approve.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller()
export class WorkflowController {
  constructor(
    private readonly workflowEngineService: WorkflowEngineService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * 获取流程模板列表
   * GET /api/workflows
   */
  @Get('api/workflows')
  @UseGuards(JwtAuthGuard)
  async getWorkflowTemplates(@Query('type') type?: string) {
    const where = type ? { type, isActive: true } : { isActive: true };
    return this.prisma.workflowTemplate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 创建流程模板
   * POST /api/workflows
   */
  @Post('api/workflows')
  @UseGuards(JwtAuthGuard)
  async createWorkflowTemplate(@Body() dto: CreateWorkflowDto) {
    return this.prisma.workflowTemplate.create({
      data: {
        name: dto.name,
        type: dto.type,
        steps: dto.steps,
        conditions: dto.conditions || {},
        isActive: dto.isActive ?? true,
        version: dto.version || 1,
      },
    });
  }

  /**
   * 获取待审批列表（按当前用户角色过滤）
   * GET /api/approvals
   */
  @Get('api/approvals')
  @UseGuards(JwtAuthGuard)
  async getPendingApprovals(
    @Request() req,
    @Query('roles') rolesQuery?: string,
  ) {
    const userId = req.user.userId;
    const roles = rolesQuery ? rolesQuery.split(',') : [];
    return this.workflowEngineService.getPendingApprovals(userId, roles);
  }

  /**
   * 获取我发起的审批
   * GET /api/approvals/my
   */
  @Get('api/approvals/my')
  @UseGuards(JwtAuthGuard)
  async getMyApprovals(@Request() req) {
    const userId = req.user.userId;
    return this.workflowEngineService.getMyApprovals(userId);
  }

  /**
   * 批准审批
   * POST /api/approvals/:id/approve
   */
  @Post('api/approvals/:id/approve')
  @UseGuards(JwtAuthGuard)
  async approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApproveDto,
    @Request() req,
  ) {
    const userId = req.user.userId;
    return this.workflowEngineService.advanceStep(
      id,
      'APPROVE',
      userId,
      dto.comment,
    );
  }

  /**
   * 拒绝审批
   * POST /api/approvals/:id/reject
   */
  @Post('api/approvals/:id/reject')
  @UseGuards(JwtAuthGuard)
  async reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectDto,
    @Request() req,
  ) {
    const userId = req.user.userId;
    return this.workflowEngineService.advanceStep(
      id,
      'REJECT',
      userId,
      dto.comment,
    );
  }

  /**
   * 撤回审批
   * POST /api/approvals/:id/withdraw
   */
  @Post('api/approvals/:id/withdraw')
  @UseGuards(JwtAuthGuard)
  async withdraw(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: WithdrawDto,
    @Request() req,
  ) {
    const userId = req.user.userId;
    return this.workflowEngineService.advanceStep(
      id,
      'WITHDRAW',
      userId,
      dto.comment,
    );
  }

  /**
   * 获取审批详情
   * GET /api/approvals/:id
   */
  @Get('api/approvals/:id')
  @UseGuards(JwtAuthGuard)
  async getApprovalDetail(@Param('id', ParseUUIDPipe) id: string) {
    return this.workflowEngineService.getApprovalStatus(id);
  }
}
