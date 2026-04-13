import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { VarianceAnalysisService } from '../services/variance-analysis.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('analysis')
@UseGuards(JwtAuthGuard)
export class VarianceAnalysisController {
  constructor(
    private readonly varianceAnalysisService: VarianceAnalysisService,
  ) {}

  @Get('variance')
  async analyzeVariance(
    @Query('year') year: number,
    @Query('budgetType') budgetType?: string,
    @Query('organizationId') organizationId?: string,
    @Query('ledger') ledger?: 'PR' | 'PO' | 'ACTUAL',
  ) {
    return await this.varianceAnalysisService.analyzeMultiDimension({
      year: year || new Date().getFullYear(),
      budgetType,
      organizationId,
      ledger,
    });
  }

  @Get('trend')
  async getExecutionTrend(
    @Query('year') year: number,
    @Query('budgetType') budgetType?: string,
  ) {
    return await this.varianceAnalysisService.getExecutionTrend({
      year: year || new Date().getFullYear(),
      budgetType,
    });
  }

  @Get('forecast')
  async forecastFullYear(
    @Query('year') year: number,
    @Query('budgetType') budgetType?: string,
    @Query('ledger') ledger?: 'PR' | 'PO' | 'ACTUAL',
  ) {
    return await this.varianceAnalysisService.forecastFullYear({
      year: year || new Date().getFullYear(),
      budgetType,
      ledger,
    });
  }
}
