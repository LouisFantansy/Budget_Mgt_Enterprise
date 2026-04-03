import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { MatchStatus, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export interface MatchResult {
  total: number;
  fullMatch: number;
  partialMatch: number;
  noMatch: number;
  details: Array<{
    mappingId: string;
    budgetNo: string | null;
    purchaseOrderNo: string | null;
    settlementNo: string | null;
    matchStatus: MatchStatus;
    amountDiff: number | null;
  }>;
}

export interface FindAllParams {
  page?: number;
  pageSize?: number;
  matchStatus?: MatchStatus;
  budgetNo?: string;
}

export interface MappingListResult {
  data: any[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ManualMatchData {
  budgetNo?: string;
  purchaseOrderNo?: string;
  settlementNo?: string;
}

@Injectable()
export class MappingService {
  constructor(private prisma: PrismaService) {}

  /**
   * 自动匹配三单关联
   * 匹配逻辑：通过 budgetNo 关联预算、采购订单、结算单
   */
  async autoMatch(): Promise<MatchResult> {
    // 获取所有未关联或需要重新匹配的采购订单
    const purchaseOrders = await this.prisma.purchaseOrder.findMany({
      where: {
        OR: [
          { mappingId: null },
          { budgetNo: { not: null } },
        ],
      },
    });

    // 获取所有未关联或需要重新匹配的结算单
    const settlements = await this.prisma.settlement.findMany({
      where: {
        OR: [
          { mappingId: null },
          { budgetNo: { not: null } },
        ],
      },
    });

    // 获取所有预算
    const budgets = await this.prisma.budget.findMany({
      select: {
        budgetNo: true,
        totalAmount: true,
        usedAmount: true,
      },
    });

    const budgetMap = new Map(budgets.map(b => [b.budgetNo, b]));
    const processedBudgetNos = new Set<string>();
    const results: MatchResult['details'] = [];

    // 按 budgetNo 分组采购订单
    const poByBudgetNo = new Map<string, typeof purchaseOrders>();
    for (const po of purchaseOrders) {
      if (po.budgetNo) {
        if (!poByBudgetNo.has(po.budgetNo)) {
          poByBudgetNo.set(po.budgetNo, []);
        }
        poByBudgetNo.get(po.budgetNo)!.push(po);
      }
    }

    // 按 budgetNo 分组结算单
    const stByBudgetNo = new Map<string, typeof settlements>();
    for (const st of settlements) {
      if (st.budgetNo) {
        if (!stByBudgetNo.has(st.budgetNo)) {
          stByBudgetNo.set(st.budgetNo, []);
        }
        stByBudgetNo.get(st.budgetNo)!.push(st);
      }
    }

    // 收集所有相关的 budgetNo
    const allBudgetNos = new Set([
      ...poByBudgetNo.keys(),
      ...stByBudgetNo.keys(),
    ]);

    // 处理每个预算编号的三单匹配
    for (const budgetNo of allBudgetNos) {
      if (processedBudgetNos.has(budgetNo)) continue;
      processedBudgetNos.add(budgetNo);

      const pos = poByBudgetNo.get(budgetNo) || [];
      const sts = stByBudgetNo.get(budgetNo) || [];
      const budget = budgetMap.get(budgetNo);

      // 计算总金额
      let poTotal = new Decimal(0);
      for (const po of pos) {
        poTotal = poTotal.plus(po.amount);
      }
      let stTotal = new Decimal(0);
      for (const st of sts) {
        stTotal = stTotal.plus(st.amount);
      }
      const budgetAmount = budget ? budget.totalAmount : new Decimal(0);

      // 确定匹配状态
      let matchStatus: MatchStatus;
      let amountDiff: Decimal | null = null;

      if (pos.length === 0 && sts.length === 0) {
        // 没有采购订单和结算单，跳过
        continue;
      }

      if (budget) {
        // 有预算的情况
        const poMatch = pos.length > 0;
        const stMatch = sts.length > 0;

        if (poMatch && stMatch) {
          // 三单都有
          amountDiff = budgetAmount.minus(poTotal).minus(stTotal);
          // 如果金额差异在可接受范围内（比如1%），认为是完全匹配
          const tolerance = budgetAmount.mul(0.01);
          if (amountDiff.abs().lessThanOrEqualTo(tolerance)) {
            matchStatus = MatchStatus.FULL;
          } else {
            matchStatus = MatchStatus.PARTIAL;
          }
        } else if (poMatch || stMatch) {
          // 只有部分单据
          matchStatus = MatchStatus.PARTIAL;
          amountDiff = budgetAmount.minus(poTotal).minus(stTotal);
        } else {
          matchStatus = MatchStatus.NONE;
        }
      } else {
        // 没有预算的情况
        matchStatus = MatchStatus.NONE;
        if (pos.length > 0 && sts.length > 0) {
          amountDiff = poTotal.minus(stTotal);
          // 采购订单和结算单金额匹配
          if (amountDiff.abs().lessThanOrEqualTo(poTotal.mul(0.01))) {
            matchStatus = MatchStatus.PARTIAL;
          }
        }
      }

      // 创建或更新映射记录
      const mapping = await this.prisma.dataMapping.upsert({
        where: {
          // 使用复合唯一键或查找现有记录
          id: await this.findExistingMappingId(budgetNo),
        },
        create: {
          budgetNo,
          purchaseOrderNo: pos.length > 0 ? pos[0].orderNo : null,
          settlementNo: sts.length > 0 ? sts[0].settlementNo : null,
          matchStatus,
          amountDiff: amountDiff ? new Decimal(amountDiff.toFixed(2)) : null,
        },
        update: {
          purchaseOrderNo: pos.length > 0 ? pos[0].orderNo : null,
          settlementNo: sts.length > 0 ? sts[0].settlementNo : null,
          matchStatus,
          amountDiff: amountDiff ? new Decimal(amountDiff.toFixed(2)) : null,
        },
      });

      // 更新采购订单的 mappingId
      for (const po of pos) {
        if (po.mappingId !== mapping.id) {
          await this.prisma.purchaseOrder.update({
            where: { id: po.id },
            data: { mappingId: mapping.id },
          });
        }
      }

      // 更新结算单的 mappingId
      for (const st of sts) {
        if (st.mappingId !== mapping.id) {
          await this.prisma.settlement.update({
            where: { id: st.id },
            data: { mappingId: mapping.id },
          });
        }
      }

      results.push({
        mappingId: mapping.id,
        budgetNo,
        purchaseOrderNo: pos.length > 0 ? pos[0].orderNo : null,
        settlementNo: sts.length > 0 ? sts[0].settlementNo : null,
        matchStatus,
        amountDiff: amountDiff ? Number(amountDiff.toFixed(2)) : null,
      });
    }

    // 处理没有 budgetNo 的采购订单和结算单（独立匹配）
    const orphanPOs = purchaseOrders.filter(po => !po.budgetNo && !po.mappingId);
    const orphanSTs = settlements.filter(st => !st.budgetNo && !st.mappingId);

    for (const po of orphanPOs) {
      // 查找相同供应商的结算单
      const matchingSTs = orphanSTs.filter(st => 
        st.supplier === po.supplier &&
        st.amount.equals(po.amount)
      );

      if (matchingSTs.length > 0) {
        const st = matchingSTs[0];
        const mapping = await this.prisma.dataMapping.create({
          data: {
            budgetNo: null,
            purchaseOrderNo: po.orderNo,
            settlementNo: st.settlementNo,
            matchStatus: MatchStatus.PARTIAL,
            amountDiff: new Decimal(0),
          },
        });

        await this.prisma.purchaseOrder.update({
          where: { id: po.id },
          data: { mappingId: mapping.id },
        });

        await this.prisma.settlement.update({
          where: { id: st.id },
          data: { mappingId: mapping.id },
        });

        results.push({
          mappingId: mapping.id,
          budgetNo: null,
          purchaseOrderNo: po.orderNo,
          settlementNo: st.settlementNo,
          matchStatus: MatchStatus.PARTIAL,
          amountDiff: 0,
        });
      }
    }

    // 统计结果
    const fullMatch = results.filter(r => r.matchStatus === MatchStatus.FULL).length;
    const partialMatch = results.filter(r => r.matchStatus === MatchStatus.PARTIAL).length;
    const noMatch = results.filter(r => r.matchStatus === MatchStatus.NONE).length;

    return {
      total: results.length,
      fullMatch,
      partialMatch,
      noMatch,
      details: results,
    };
  }

  /**
   * 查找现有的映射记录ID
   */
  private async findExistingMappingId(budgetNo: string): Promise<string | undefined> {
    const existing = await this.prisma.dataMapping.findFirst({
      where: { budgetNo },
      select: { id: true },
    });
    return existing?.id;
  }

  /**
   * 分页查询三单关联列表
   */
  async findAll(params: FindAllParams): Promise<MappingListResult> {
    const { page = 1, pageSize = 10, matchStatus, budgetNo } = params;
    const skip = (page - 1) * pageSize;

    const where: Prisma.DataMappingWhereInput = {};
    
    if (matchStatus) {
      where.matchStatus = matchStatus;
    }
    
    if (budgetNo) {
      where.budgetNo = { contains: budgetNo, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      this.prisma.dataMapping.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        // 关联详细信息在下方单独查询
      }),
      this.prisma.dataMapping.count({ where }),
    ]);

    // 获取关联的详细信息
    const enrichedData = await Promise.all(
      data.map(async (mapping) => {
        const [budget, purchaseOrders, settlements] = await Promise.all([
          mapping.budgetNo
            ? this.prisma.budget.findUnique({
                where: { budgetNo: mapping.budgetNo },
                select: {
                  budgetNo: true,
                  name: true,
                  totalAmount: true,
                  usedAmount: true,
                },
              })
            : null,
          mapping.purchaseOrderNo
            ? this.prisma.purchaseOrder.findMany({
                where: { orderNo: mapping.purchaseOrderNo },
              })
            : this.prisma.purchaseOrder.findMany({
                where: { budgetNo: mapping.budgetNo || undefined },
              }),
          mapping.settlementNo
            ? this.prisma.settlement.findMany({
                where: { settlementNo: mapping.settlementNo },
              })
            : this.prisma.settlement.findMany({
                where: { budgetNo: mapping.budgetNo || undefined },
              }),
        ]);

        // 计算实际关联的金额
        let poTotal = new Decimal(0);
        for (const po of purchaseOrders) {
          poTotal = poTotal.plus(po.amount);
        }
        let stTotal = new Decimal(0);
        for (const st of settlements) {
          stTotal = stTotal.plus(st.amount);
        }

        return {
          ...mapping,
          budget,
          purchaseOrders: purchaseOrders.map(po => ({
            ...po,
            amount: Number(po.amount),
          })),
          settlements: settlements.map(st => ({
            ...st,
            amount: Number(st.amount),
          })),
          poTotal: Number(poTotal),
          stTotal: Number(stTotal),
          amountDiff: mapping.amountDiff ? Number(mapping.amountDiff) : null,
        };
      })
    );

    return {
      data: enrichedData,
      total,
      page,
      pageSize,
    };
  }

  /**
   * 手动关联/修改关联关系
   */
  async manualMatch(id: string, data: ManualMatchData, userId: string): Promise<any> {
    const mapping = await this.prisma.dataMapping.findUnique({
      where: { id },
    });

    if (!mapping) {
      throw new NotFoundException('映射记录不存在');
    }

    // 获取关联的数据
    const [budget, purchaseOrders, settlements] = await Promise.all([
      data.budgetNo
        ? this.prisma.budget.findUnique({
            where: { budgetNo: data.budgetNo },
          })
        : null,
      data.purchaseOrderNo
        ? this.prisma.purchaseOrder.findMany({
            where: { orderNo: data.purchaseOrderNo },
          })
        : [],
      data.settlementNo
        ? this.prisma.settlement.findMany({
            where: { settlementNo: data.settlementNo },
          })
        : [],
    ]);

    // 计算金额差异
    let poTotal = new Decimal(0);
    for (const po of purchaseOrders) {
      poTotal = poTotal.plus(po.amount);
    }
    let stTotal = new Decimal(0);
    for (const st of settlements) {
      stTotal = stTotal.plus(st.amount);
    }
    const budgetAmount = budget ? budget.totalAmount : new Decimal(0);

    let matchStatus: MatchStatus;
    let amountDiff: Decimal | null = null;

    if (budget) {
      const poMatch = purchaseOrders.length > 0;
      const stMatch = settlements.length > 0;

      if (poMatch && stMatch) {
        amountDiff = budgetAmount.minus(poTotal).minus(stTotal);
        const tolerance = budgetAmount.mul(0.01);
        if (amountDiff.abs().lessThanOrEqualTo(tolerance)) {
          matchStatus = MatchStatus.FULL;
        } else {
          matchStatus = MatchStatus.PARTIAL;
        }
      } else if (poMatch || stMatch) {
        matchStatus = MatchStatus.PARTIAL;
        amountDiff = budgetAmount.minus(poTotal).minus(stTotal);
      } else {
        matchStatus = MatchStatus.NONE;
      }
    } else {
      matchStatus = MatchStatus.NONE;
      if (purchaseOrders.length > 0 && settlements.length > 0) {
        amountDiff = poTotal.minus(stTotal);
        if (amountDiff.abs().lessThanOrEqualTo(poTotal.mul(0.01))) {
          matchStatus = MatchStatus.PARTIAL;
        }
      }
    }

    // 更新映射记录
    const updatedMapping = await this.prisma.dataMapping.update({
      where: { id },
      data: {
        budgetNo: data.budgetNo ?? mapping.budgetNo,
        purchaseOrderNo: data.purchaseOrderNo ?? mapping.purchaseOrderNo,
        settlementNo: data.settlementNo ?? mapping.settlementNo,
        matchStatus,
        amountDiff: amountDiff ? new Decimal(amountDiff.toFixed(2)) : null,
        verifiedAt: new Date(),
        verifiedBy: userId,
      },
    });

    // 更新关联单据的 mappingId
    if (data.budgetNo) {
      await this.prisma.purchaseOrder.updateMany({
        where: { budgetNo: data.budgetNo, mappingId: null },
        data: { mappingId: id },
      });
      await this.prisma.settlement.updateMany({
        where: { budgetNo: data.budgetNo, mappingId: null },
        data: { mappingId: id },
      });
    }

    for (const po of purchaseOrders) {
      if (po.mappingId !== id) {
        await this.prisma.purchaseOrder.update({
          where: { id: po.id },
          data: { mappingId: id },
        });
      }
    }

    for (const st of settlements) {
      if (st.mappingId !== id) {
        await this.prisma.settlement.update({
          where: { id: st.id },
          data: { mappingId: id },
        });
      }
    }

    return {
      ...updatedMapping,
      amountDiff: updatedMapping.amountDiff
        ? Number(updatedMapping.amountDiff)
        : null,
    };
  }

  /**
   * 获取单个映射详情
   */
  async findOne(id: string): Promise<any> {
    const mapping = await this.prisma.dataMapping.findUnique({
      where: { id },
    });

    if (!mapping) {
      throw new NotFoundException('映射记录不存在');
    }

    const [budget, purchaseOrders, settlements] = await Promise.all([
      mapping.budgetNo
        ? this.prisma.budget.findUnique({
            where: { budgetNo: mapping.budgetNo },
          })
        : null,
      mapping.budgetNo
        ? this.prisma.purchaseOrder.findMany({
            where: { budgetNo: mapping.budgetNo },
          })
        : mapping.purchaseOrderNo
        ? this.prisma.purchaseOrder.findMany({
            where: { orderNo: mapping.purchaseOrderNo },
          })
        : [],
      mapping.budgetNo
        ? this.prisma.settlement.findMany({
            where: { budgetNo: mapping.budgetNo },
          })
        : mapping.settlementNo
        ? this.prisma.settlement.findMany({
            where: { settlementNo: mapping.settlementNo },
          })
        : [],
    ]);

    let poTotal = new Decimal(0);
    for (const po of purchaseOrders) {
      poTotal = poTotal.plus(po.amount);
    }
    let stTotal = new Decimal(0);
    for (const st of settlements) {
      stTotal = stTotal.plus(st.amount);
    }

    return {
      ...mapping,
      amountDiff: mapping.amountDiff ? Number(mapping.amountDiff) : null,
      budget,
      purchaseOrders: purchaseOrders.map(po => ({
        ...po,
        amount: Number(po.amount),
      })),
      settlements: settlements.map(st => ({
        ...st,
        amount: Number(st.amount),
      })),
      poTotal: Number(poTotal),
      stTotal: Number(stTotal),
    };
  }
}
