import {
  Controller,
  Get,
  Query,
  Res,
  UseGuards,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuditService, FindAllParams, AuditStatsParams } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, ROLES_KEY } from '../auth/guards/roles.guard';
import { SetMetadata } from '@nestjs/common';

// 管理员角色装饰器
export const Admin = () => SetMetadata(ROLES_KEY, ['admin']);

@ApiTags('审计日志')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Admin()
  @ApiOperation({ summary: '查询审计日志（分页筛选）' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '页码，默认1' })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, description: '每页条数，默认20' })
  @ApiQuery({ name: 'userId', required: false, type: String, description: '用户ID筛选' })
  @ApiQuery({ name: 'module', required: false, type: String, description: '模块筛选' })
  @ApiQuery({ name: 'action', required: false, type: String, description: '操作类型筛选' })
  @ApiQuery({ name: 'targetType', required: false, type: String, description: '对象类型筛选' })
  @ApiQuery({ name: 'targetId', required: false, type: String, description: '对象ID筛选' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: '开始日期 (ISO格式)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: '结束日期 (ISO格式)' })
  async findAll(@Query() query: FindAllParams) {
    const page = query.page ? parseInt(query.page as any, 10) : 1;
    const pageSize = query.pageSize ? parseInt(query.pageSize as any, 10) : 20;

    return this.auditService.findAll({
      ...query,
      page,
      pageSize,
    });
  }

  @Get('stats')
  @Admin()
  @ApiOperation({ summary: '获取审计统计信息' })
  @ApiQuery({ name: 'module', required: false, type: String, description: '模块筛选' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: '开始日期' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: '结束日期' })
  async getStats(@Query() query: AuditStatsParams) {
    return this.auditService.getStats(query);
  }

  @Get('export')
  @Admin()
  @ApiOperation({ summary: '导出审计日志（Excel/JSON）' })
  @ApiQuery({ name: 'format', required: false, type: String, description: '导出格式：excel 或 json，默认excel' })
  @ApiQuery({ name: 'userId', required: false, type: String, description: '用户ID筛选' })
  @ApiQuery({ name: 'module', required: false, type: String, description: '模块筛选' })
  @ApiQuery({ name: 'action', required: false, type: String, description: '操作类型筛选' })
  @ApiQuery({ name: 'targetType', required: false, type: String, description: '对象类型筛选' })
  @ApiQuery({ name: 'targetId', required: false, type: String, description: '对象ID筛选' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: '开始日期' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: '结束日期' })
  async export(
    @Query() query: FindAllParams & { format?: string },
    @Res() res: Response,
  ) {
    const format = query.format || 'excel';
    const params: FindAllParams = {
      userId: query.userId,
      module: query.module,
      action: query.action,
      targetType: query.targetType,
      targetId: query.targetId,
      startDate: query.startDate,
      endDate: query.endDate,
    };

    try {
      if (format.toLowerCase() === 'excel') {
        const buffer = await this.auditService.exportToExcel(params);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `audit-logs-${timestamp}.xlsx`;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', buffer.length);
        res.send(buffer);
      } else if (format.toLowerCase() === 'json') {
        const data = await this.auditService.exportToJson(params);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `audit-logs-${timestamp}.json`;

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.json(data);
      } else {
        throw new HttpException('不支持的导出格式，请使用 excel 或 json', HttpStatus.BAD_REQUEST);
      }
    } catch (error) {
      throw new HttpException(
        `导出失败: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
