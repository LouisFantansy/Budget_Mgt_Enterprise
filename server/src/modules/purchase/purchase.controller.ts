import { Controller, Get, Post, Body, Param, Delete, Put, Query, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PurchaseService } from './purchase.service';
import { CreatePurchaseRequestDto } from './dto/create-purchase-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserType } from 'src/common/decorators/current-user.decorator';

@ApiTags('采购申请')
@Controller('purchases')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PurchaseController {
  constructor(private readonly purchaseService: PurchaseService) {}

  @Post()
  @ApiOperation({ summary: '创建采购申请' })
  create(@Request() req, @Body() createPurchaseRequestDto: CreatePurchaseRequestDto) {
    return this.purchaseService.create(createPurchaseRequestDto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: '获取采购申请列表' })
  findAll(
    @CurrentUser() user: CurrentUserType,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('budgetId') budgetId?: string,
    @Query('status') status?: string,
  ) {
    return this.purchaseService.findAll({ 
      page: page ? Number(page) : 1, 
      pageSize: pageSize ? Number(pageSize) : 20,
      budgetId,
      status,
    }, user);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取采购申请详情' })
  findOne(@Param('id') id: string, @CurrentUser() user: CurrentUserType) {
    return this.purchaseService.findOne(id, user);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新采购申请' })
  update(@Param('id') id: string, @Body() updateData: any) {
    return this.purchaseService.update(id, updateData);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除采购申请' })
  remove(@Param('id') id: string) {
    return this.purchaseService.remove(id);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: '提交审批' })
  submitForApproval(@Param('id') id: string) {
    return this.purchaseService.submitForApproval(id);
  }
}
