import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Budget, BudgetItem } from '../budget/entities/budget.entity';
import { Organization } from '../master/entities/organization.entity';
import {
  PrRecord,
  PoRecord,
  SettlementRecord,
} from '../execution/entities/execution-records.entity';
import { VarianceAnalysisService } from './services/variance-analysis.service';
import { VarianceAnalysisController } from './controllers/variance-analysis.controller';
import { BudgetModule } from '../budget/budget.module';
import { MasterModule } from '../master/master.module';
import { ExecutionModule } from '../execution/execution.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Budget,
      BudgetItem,
      Organization,
      PrRecord,
      PoRecord,
      SettlementRecord,
    ]),
    BudgetModule,
    MasterModule,
    ExecutionModule,
  ],
  controllers: [VarianceAnalysisController],
  providers: [VarianceAnalysisService],
  exports: [VarianceAnalysisService],
})
export class AnalysisModule {}
