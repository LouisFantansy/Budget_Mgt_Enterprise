import { Module } from '@nestjs/common';
import { ReportService } from './report.service';
import { AnalysisController } from './report.controller';
import { PrismaModule } from 'src/common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ReportService],
  controllers: [AnalysisController],
  exports: [ReportService],
})
export class ReportModule {}
