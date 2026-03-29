import { Controller, Get, Request, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportService } from './report.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('报表分析')
@Controller('analysis')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnalysisController {
  constructor(private readonly reportService: ReportService) {}

  @Get('dashboard')
  @ApiOperation({ summary: '获取仪表盘数据' })
  getDashboardData(@Request() req, @Query('departmentId') departmentId?: string) {
    return this.reportService.getDashboardData(req.user.userId, departmentId);
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
}
