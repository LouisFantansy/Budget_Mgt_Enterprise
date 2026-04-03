import { Controller, Get, Request, Query, UseGuards, Param, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { ReportService } from './report.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('报表分析')
@Controller('analysis')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnalysisController {
  constructor(private readonly reportService: ReportService) {}

  @Get('dashboard')
  @ApiOperation({ summary: '获取仪表盘数据' })
  getDashboardData(
    @CurrentUser() user: any,
    @Query('departmentId') departmentId?: string,
  ) {
    return this.reportService.getDashboardData(user, departmentId);
  }

  @Get('department-ranking')
  @ApiOperation({ summary: '部门预算排名' })
  getDepartmentRanking(@Query('year') year?: number) {
    return this.reportService.getDepartmentRanking(year ? Number(year) : undefined);
  }

  @Get('monthly-trend')
  @ApiOperation({ summary: '月度趋势分析' })
  getMonthlyTrend(@Query('year') year: number) {
    if (!year) {
      year = new Date().getFullYear();
    }
    return this.reportService.getMonthlyTrend(Number(year));
  }

  @Get('category-analysis')
  @ApiOperation({ summary: '预算类别分析' })
  getCategoryAnalysis(@Query('year') year?: number) {
    return this.reportService.getBudgetCategoryAnalysis(year ? Number(year) : undefined);
  }

  @Get('budget-summary')
  @ApiOperation({ summary: '预算汇总报表（多维度聚合）' })
  @ApiQuery({ name: 'year', required: false, type: Number, description: '年度' })
  @ApiQuery({ name: 'departmentId', required: false, type: String, description: '部门ID' })
  getBudgetSummary(
    @CurrentUser() user: any,
    @Query('year') year?: number,
    @Query('departmentId') departmentId?: string,
  ) {
    return this.reportService.getBudgetSummary(user, {
      year: year ? Number(year) : undefined,
      departmentId,
    });
  }

  @Get('budget-usage/:id')
  @ApiOperation({ summary: '单个预算使用追踪' })
  getBudgetUsage(@Param('id') budgetId: string) {
    return this.reportService.getBudgetUsage(budgetId);
  }

  @Get('export/budgets')
  @ApiOperation({ summary: '导出预算报表Excel' })
  @ApiQuery({ name: 'year', required: false, type: Number, description: '年度' })
  @ApiQuery({ name: 'departmentId', required: false, type: String, description: '部门ID' })
  async exportBudgetReport(
    @CurrentUser() user: any,
    @Query('year') year?: number,
    @Query('departmentId') departmentId?: string,
    @Res() res?: Response,
  ) {
    const workbook = await this.reportService.exportBudgetReport(user, {
      year: year ? Number(year) : undefined,
      departmentId,
    });

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=budget-report-${year || 'all'}-${Date.now()}.xlsx`,
    );
    res.send(buffer);
  }
}
