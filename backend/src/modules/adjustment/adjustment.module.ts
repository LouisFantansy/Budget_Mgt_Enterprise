import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BudgetAdjustment } from './entities/budget-adjustment.entity';
import { AdjustmentService } from './services/adjustment.service';
import { AdjustmentController } from './controllers/adjustment.controller';
import { Budget, BudgetItem } from '../budget/entities/budget.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BudgetAdjustment, Budget, BudgetItem])],
  controllers: [AdjustmentController],
  providers: [AdjustmentService],
  exports: [AdjustmentService],
})
export class AdjustmentModule {}
