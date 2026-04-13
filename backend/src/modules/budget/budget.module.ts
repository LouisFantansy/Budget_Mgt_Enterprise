import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Budget, BudgetItem } from './entities/budget.entity';
import { BudgetService } from './services/budget.service';
import { BudgetController } from './controllers/budget.controller';
import { MasterModule } from '../master/master.module';

@Module({
  imports: [TypeOrmModule.forFeature([Budget, BudgetItem]), MasterModule],
  controllers: [BudgetController],
  providers: [BudgetService],
  exports: [BudgetService],
})
export class BudgetModule {}
