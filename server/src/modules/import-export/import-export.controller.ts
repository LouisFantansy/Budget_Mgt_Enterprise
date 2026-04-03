import {
  Controller,
  Get,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  Param,
  ParseEnumPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ExportService } from './export.service';
import { ImportService } from './import.service';
import { MappingService } from './mapping.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Response } from 'express';
import { MatchStatus } from '@prisma/client';

@ApiTags('导入导出')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ImportExportController {
  constructor(
    private readonly exportService: ExportService,
    private readonly importService: ImportService,
    private readonly mappingService: MappingService,
  ) {}

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

  // ==================== 导入功能 ====================

  @Post('import/purchase-orders')
  @ApiOperation({ summary: '导入采购订单Excel' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: '采购订单Excel文件',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async importPurchaseOrders(
    @UploadedFile() file: any,
    @CurrentUser('userId') userId: string,
  ) {
    if (!file) {
      return {
        success: false,
        message: '请上传文件',
      };
    }

    const result = await this.importService.importPurchaseOrders(file.buffer, userId);
    return {
      success: result.failed === 0,
      message: result.failed === 0 ? '导入成功' : '部分数据导入失败',
      data: result,
    };
  }

  @Post('import/settlements')
  @ApiOperation({ summary: '导入结算单Excel' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: '结算单Excel文件',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async importSettlements(
    @UploadedFile() file: any,
    @CurrentUser('userId') userId: string,
  ) {
    if (!file) {
      return {
        success: false,
        message: '请上传文件',
      };
    }

    const result = await this.importService.importSettlements(file.buffer, userId);
    return {
      success: result.failed === 0,
      message: result.failed === 0 ? '导入成功' : '部分数据导入失败',
      data: result,
    };
  }

  @Get('import/templates/:type')
  @ApiOperation({ summary: '下载导入模板' })
  async downloadTemplate(
    @Param('type', new ParseEnumPipe(['purchase-order', 'settlement'])) type: 'purchase-order' | 'settlement',
    @Res() res: Response,
  ) {
    const buffer = await this.importService.generateTemplate(type);
    const filename = type === 'purchase-order' ? '采购订单导入模板.xlsx' : '结算单导入模板.xlsx';

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(filename)}"`,
    );
    res.send(buffer);
  }

  // ==================== 三单匹配功能 ====================

  @Get('mappings')
  @ApiOperation({ summary: '获取三单关联列表' })
  async findAllMappings(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('matchStatus') matchStatus?: MatchStatus,
    @Query('budgetNo') budgetNo?: string,
  ) {
    const result = await this.mappingService.findAll({
      page: page ? parseInt(page) : 1,
      pageSize: pageSize ? parseInt(pageSize) : 10,
      matchStatus,
      budgetNo,
    });
    return {
      success: true,
      data: result,
    };
  }

  @Get('mappings/:id')
  @ApiOperation({ summary: '获取三单关联详情' })
  async findOneMapping(@Param('id') id: string) {
    const result = await this.mappingService.findOne(id);
    return {
      success: true,
      data: result,
    };
  }

  @Post('mappings/auto-match')
  @ApiOperation({ summary: '执行自动匹配' })
  async autoMatch() {
    const result = await this.mappingService.autoMatch();
    return {
      success: true,
      message: `匹配完成，共处理 ${result.total} 条记录`,
      data: result,
    };
  }

  @Put('mappings/:id')
  @ApiOperation({ summary: '手动关联/修改关联关系' })
  async manualMatch(
    @Param('id') id: string,
    @Body() data: {
      budgetNo?: string;
      purchaseOrderNo?: string;
      settlementNo?: string;
    },
    @CurrentUser('userId') userId: string,
  ) {
    const result = await this.mappingService.manualMatch(id, data, userId);
    return {
      success: true,
      message: '关联关系已更新',
      data: result,
    };
  }
}
