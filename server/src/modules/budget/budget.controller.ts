import { Controller, Get, Post, Body, Param, Delete, Put, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BudgetService } from './budget.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserType } from 'src/common/decorators/current-user.decorator';

@ApiTags('预算管理')
@Controller('budgets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  @Post()
  @ApiOperation({ summary: '创建预算' })
  create(@Body() createBudgetDto: CreateBudgetDto) {
    return this.budgetService.create(createBudgetDto);
  }

  @Get()
  @ApiOperation({ summary: '获取预算列表' })
  findAll(
    @CurrentUser() user: CurrentUserType,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('departmentId') departmentId?: string,
    @Query('year') year?: number,
    @Query('status') status?: string,
  ) {
    return this.budgetService.findAll({ 
      page: page ? Number(page) : 1, 
      pageSize: pageSize ? Number(pageSize) : 20,
      departmentId,
      year,
      status,
    }, user);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取预算详情' })
  findOne(@Param('id') id: string, @CurrentUser() user: CurrentUserType) {
    return this.budgetService.findOne(id, user);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新预算' })
  update(@Param('id') id: string, @Body() updateData: any) {
    return this.budgetService.update(id, updateData);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除预算' })
  remove(@Param('id') id: string) {
    return this.budgetService.remove(id);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: '提交审批' })
  submitForApproval(@Param('id') id: string) {
    return this.budgetService.submitForApproval(id);
  }
}
