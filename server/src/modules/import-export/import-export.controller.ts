import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ExportService } from './export.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Response } from 'express';

@ApiTags('导入导出')
@Controller('export')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ImportExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get('budgets')
  @ApiOperation({ summary: '导出预算报表' })
  async exportBudgets(
    @Res() res: Response,
    @Query('year') year?: number,
    @Query('departmentId') departmentId?: string,
    @Query('status') status?: string,
  ) {
    const buffer = await this.exportService.exportBudgets({
      year: year ? Number(year) : undefined,
      departmentId,
      status,
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="预算报表_${new Date().toISOString().split('T')[0]}.xlsx"`,
    );
    res.send(buffer);
  }

  @Get('purchases')
  @ApiOperation({ summary: '导出采购申请报表' })
  async exportPurchases(
    @Res() res: Response,
    @Query('status') status?: string,
    @Query('departmentId') departmentId?: string,
  ) {
    const buffer = await this.exportService.exportPurchases({
      status,
      departmentId,
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="采购申请报表_${new Date().toISOString().split('T')[0]}.xlsx"`,
    );
    res.send(buffer);
  }
}
