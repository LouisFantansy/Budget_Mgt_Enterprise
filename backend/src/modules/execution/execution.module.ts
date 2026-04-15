import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  PrRecord,
  PoRecord,
  SettlementRecord,
} from './entities/execution-records.entity';
import { ImportBatch } from './entities/import-batch.entity';
import { ImportRow } from './entities/import-row.entity';
import { BudgetItem } from '../budget/entities/budget.entity';
import { ExcelImportService } from './services/excel-import.service';
import { DataImportService } from './services/data-import.service';
import { DataImportController } from './controllers/data-import.controller';
import { BudgetModule } from '../budget/budget.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PrRecord,
      PoRecord,
      SettlementRecord,
      ImportBatch,
      ImportRow,
      BudgetItem,
    ]),
    BudgetModule,
  ],
  controllers: [DataImportController],
  providers: [ExcelImportService, DataImportService],
  exports: [DataImportService],
})
export class ExecutionModule {}
