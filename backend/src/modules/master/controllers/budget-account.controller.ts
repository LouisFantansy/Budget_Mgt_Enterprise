import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { BudgetAccountService } from '../services/budget-account.service';
import { BudgetAccount } from '../entities/budget-account.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('master/budget-accounts')
@UseGuards(JwtAuthGuard)
export class BudgetAccountController {
  constructor(private readonly budgetAccountService: BudgetAccountService) {}

  @Post()
  async create(@Body() createDto: Partial<BudgetAccount>) {
    return await this.budgetAccountService.create(createDto);
  }

  @Get()
  async findAll() {
    return await this.budgetAccountService.findAll();
  }

  @Get('tree')
  async findTree() {
    return await this.budgetAccountService.findTree();
  }

  @Get('type/:type')
  async findByType(@Param('type') type: string) {
    return await this.budgetAccountService.findByType(type);
  }

  @Get('leaf')
  async findLeafAccounts() {
    return await this.budgetAccountService.findLeafAccounts();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.budgetAccountService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: Partial<BudgetAccount>,
  ) {
    return await this.budgetAccountService.update(id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.budgetAccountService.remove(id);
    return { message: '删除成功' };
  }
}
