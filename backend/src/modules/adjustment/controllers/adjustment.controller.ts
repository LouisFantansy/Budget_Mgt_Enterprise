import { Body, Controller, Get, Param, Post, Query, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdjustmentService } from '../services/adjustment.service';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RoleCodes } from '../../../common/constants/roles.constants';

@ApiTags('adjustment')
@ApiBearerAuth()
@Controller('adjustments')
export class AdjustmentController {
  constructor(private readonly adjustmentService: AdjustmentService) {}

  @Post()
  @ApiOperation({ summary: '创建预算调整申请' })
  @Roles(RoleCodes.RD_BUDGET_ADMIN, RoleCodes.RD_MANAGER)
  async create(@Body() body: any, @Request() req: any) {
    return await this.adjustmentService.createRequest({
      budgetId: body.budgetId,
      itemId: body.itemId,
      adjustedAmount: body.adjustedAmount,
      reason: body.reason,
      requestedBy: req.user.id,
    });
  }

  @Get()
  @ApiOperation({ summary: '查询预算调整单列表' })
  async list(@Query('budgetId') budgetId?: string) {
    return await this.adjustmentService.list(budgetId);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: '审批通过预算调整' })
  @Roles(RoleCodes.FINANCE, RoleCodes.SYS_ADMIN)
  async approve(@Param('id') id: string, @Request() req: any) {
    return await this.adjustmentService.approve(id, req.user.id);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: '驳回预算调整' })
  @Roles(RoleCodes.FINANCE, RoleCodes.SYS_ADMIN)
  async reject(@Param('id') id: string, @Request() req: any) {
    return await this.adjustmentService.reject(id, req.user.id);
  }
}

