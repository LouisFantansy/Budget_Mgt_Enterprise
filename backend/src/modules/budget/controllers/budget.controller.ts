import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { BudgetService } from '../services/budget.service';
import { Budget, BudgetItem } from '../entities/budget.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('budget')
@UseGuards(JwtAuthGuard)
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  @Post()
  async create(@Body() createBudgetDto: Partial<Budget>) {
    return await this.budgetService.create(createBudgetDto);
  }

  @Post(':id/items')
  async addItem(
    @Param('id') id: string,
    @Body() addItemDto: Partial<BudgetItem>,
  ) {
    return await this.budgetService.addItem(id, addItemDto);
  }

  @Post(':id/items/batch')
  async addItems(
    @Param('id') id: string,
    @Body() items: Partial<BudgetItem>[],
  ) {
    return await this.budgetService.addItems(id, items);
  }

  @Get()
  async findAll(
    @Query('year') year?: number,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('orgId') orgId?: string,
  ) {
    return await this.budgetService.findAll({ year, type, status, orgId });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.budgetService.findOne(id);
  }

  @Get(':id/execution')
  async getExecutionStatus(@Param('id') id: string) {
    return await this.budgetService.getExecutionStatus(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateBudgetDto: Partial<Budget>,
  ) {
    return await this.budgetService.update(id, updateBudgetDto);
  }

  @Put('items/:itemId')
  async updateItem(
    @Param('itemId') itemId: string,
    @Body() updateItemDto: Partial<BudgetItem>,
  ) {
    return await this.budgetService.updateItem(itemId, updateItemDto);
  }

  @Post(':id/submit')
  async submit(@Param('id') id: string, @Request() req: any) {
    return await this.budgetService.submit(id, req.user.id);
  }

  @Post(':id/approve')
  async approve(@Param('id') id: string, @Request() req: any) {
    return await this.budgetService.approve(id, req.user.id);
  }

  @Post(':id/reject')
  async reject(
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    return await this.budgetService.reject(id, reason);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.budgetService.remove(id);
    return { message: '删除成功' };
  }

  @Delete('items/:itemId')
  async removeItem(@Param('itemId') itemId: string) {
    await this.budgetService.removeItem(itemId);
    return { message: '删除成功' };
  }
}
