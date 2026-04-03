import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { AuditLog, Prisma } from '@prisma/client';
import * as ExcelJS from 'exceljs';

export interface CreateAuditLogDto {
  userId: string;
  userName: string;
  action: string;
  module: string;
  targetType?: string;
  targetId?: string;
  oldValue?: any;
  newValue?: any;
  ip?: string;
  userAgent?: string;
}

export interface FindAllParams {
  page?: number;
  pageSize?: number;
  userId?: string;
  module?: string;
  action?: string;
  targetType?: string;
  targetId?: string;
  startDate?: string;
  endDate?: string;
}

export interface AuditStatsParams {
  module?: string;
  startDate?: string;
  endDate?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  /**
   * 创建审计日志记录
   */
  async create(data: CreateAuditLogDto): Promise<AuditLog> {
    return this.prisma.auditLog.create({
      data: {
        userId: data.userId,
        userName: data.userName,
        action: data.action,
        module: data.module,
        targetType: data.targetType,
        targetId: data.targetId,
        oldValue: data.oldValue ? JSON.parse(JSON.stringify(data.oldValue)) : null,
        newValue: data.newValue ? JSON.parse(JSON.stringify(data.newValue)) : null,
        ip: data.ip,
        userAgent: data.userAgent,
      },
    });
  }

  /**
   * 分页查询日志（支持筛选）
   */
  async findAll(params: FindAllParams): Promise<PaginatedResult<AuditLog>> {
    const {
      page = 1,
      pageSize = 20,
      userId,
      module,
      action,
      targetType,
      targetId,
      startDate,
      endDate,
    } = params;

    const where: Prisma.AuditLogWhereInput = {};

    if (userId) {
      where.userId = userId;
    }

    if (module) {
      where.module = {
        equals: module,
        mode: 'insensitive',
      };
    }

    if (action) {
      where.action = {
        equals: action,
        mode: 'insensitive',
      };
    }

    if (targetType) {
      where.targetType = {
        equals: targetType,
        mode: 'insensitive',
      };
    }

    if (targetId) {
      where.targetId = targetId;
    }

    // 日期范围筛选
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * 查询特定对象的操作历史
   */
  async findByTarget(targetType: string, targetId: string): Promise<AuditLog[]> {
    return this.prisma.auditLog.findMany({
      where: {
        targetType: {
          equals: targetType,
          mode: 'insensitive',
        },
        targetId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * 获取统计信息
   */
  async getStats(params: AuditStatsParams): Promise<any> {
    const { module, startDate, endDate } = params;

    const where: Prisma.AuditLogWhereInput = {};

    if (module) {
      where.module = {
        equals: module,
        mode: 'insensitive',
      };
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // 按模块统计
    const moduleStats = await this.prisma.auditLog.groupBy({
      by: ['module'],
      where,
      _count: {
        id: true,
      },
    });

    // 按操作类型统计
    const actionStats = await this.prisma.auditLog.groupBy({
      by: ['action'],
      where,
      _count: {
        id: true,
      },
    });

    // 按日期统计（最近30天）
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyStats = await this.prisma.auditLog.groupBy({
      by: ['createdAt'],
      where: {
        ...where,
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      _count: {
        id: true,
      },
    });

    // 活跃用户统计（Top 10）
    const topUsers = await this.prisma.auditLog.groupBy({
      by: ['userId', 'userName'],
      where,
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
    });

    // 总记录数
    const totalCount = await this.prisma.auditLog.count({ where });

    return {
      totalCount,
      moduleStats: moduleStats.map((s) => ({
        module: s.module,
        count: s._count.id,
      })),
      actionStats: actionStats.map((s) => ({
        action: s.action,
        count: s._count.id,
      })),
      dailyStats: dailyStats.map((s) => ({
        date: s.createdAt.toISOString().split('T')[0],
        count: s._count.id,
      })),
      topUsers: topUsers.map((u) => ({
        userId: u.userId,
        userName: u.userName,
        count: u._count.id,
      })),
    };
  }

  /**
   * 导出Excel
   */
  async exportToExcel(params: FindAllParams): Promise<Buffer> {
    const { items } = await this.findAll({
      ...params,
      page: 1,
      pageSize: 10000, // 导出最多10000条
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('审计日志');

    // 设置列
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 36 },
      { header: '操作时间', key: 'createdAt', width: 20 },
      { header: '用户ID', key: 'userId', width: 36 },
      { header: '用户名', key: 'userName', width: 15 },
      { header: '操作类型', key: 'action', width: 12 },
      { header: '模块', key: 'module', width: 12 },
      { header: '对象类型', key: 'targetType', width: 12 },
      { header: '对象ID', key: 'targetId', width: 36 },
      { header: 'IP地址', key: 'ip', width: 15 },
      { header: '用户代理', key: 'userAgent', width: 30 },
      { header: '旧值', key: 'oldValue', width: 30 },
      { header: '新值', key: 'newValue', width: 30 },
    ];

    // 添加数据
    items.forEach((log) => {
      worksheet.addRow({
        id: log.id,
        createdAt: log.createdAt.toISOString(),
        userId: log.userId,
        userName: log.userName,
        action: log.action,
        module: log.module,
        targetType: log.targetType || '',
        targetId: log.targetId || '',
        ip: log.ip || '',
        userAgent: log.userAgent || '',
        oldValue: log.oldValue ? JSON.stringify(log.oldValue) : '',
        newValue: log.newValue ? JSON.stringify(log.newValue) : '',
      });
    });

    // 设置表头样式
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // 自动筛选
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: worksheet.columns.length },
    };

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * 导出JSON（备用方案）
   */
  async exportToJson(params: FindAllParams): Promise<any> {
    const { items } = await this.findAll({
      ...params,
      page: 1,
      pageSize: 10000,
    });

    return {
      exportTime: new Date().toISOString(),
      total: items.length,
      data: items,
    };
  }
}
