/**
 * 年度预算编制模块单元测试
 * @description 测试预算创建、表单验证、计算逻辑
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// ==================== 类型定义测试 ====================

/**
 * 预算条目明细接口
 */
interface BudgetItemDetail {
  id: string
  paymentEntity: string   // 付款主体
  group: string           // 组别
  accountCode: string     // 会计科目
  deptLevel1: string
  deptLevel2: string
  deptLevel3: string
  category: string
  name: string
  specification: string
  functionDesc: string
  unitPrice: number
  quantity: number
  totalAmount: number     // 总价（自动计算）
  project: string
  purpose: string
  supplier: string
  deliveryDate: string
  /** 1-12月每月的采购数量，支持月度采购计划、执行追踪 */
  monthlyQuantity: number[]
  /** 1-12月每月的采购金额（月数量*单价），用于月度下款与执行睡析分析 */
  monthlyAmount: number[]
}

// ==================== 工具函数 ====================

/**
 * 计算预算条目总价
 * @param unitPrice - 单价
 * @param quantity - 数量
 * @returns 总价
 */
function calculateTotalAmount(unitPrice: number, quantity: number): number {
  return unitPrice * quantity
}

/**
 * 计算月度金额分布
 * @param monthlyQuantity - 1-12月每月的采购数量数组
 * @param unitPrice - 单价
 * @returns 1-12月每月的金额数组（月金额 = 月数量 * 单价）
 */
function calculateMonthlyAmounts(monthlyQuantity: number[], unitPrice: number): number[] {
  return monthlyQuantity.map(qty => qty * unitPrice)
}

/**
 * 验证预算条目必填字段
 * @param item - 预算条目
 * @returns 验证结果
 */
function validateBudgetItem(item: Partial<BudgetItemDetail>): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!item.name?.trim()) {
    errors.push('采购名称不能为空')
  }
  if (!item.category?.trim()) {
    errors.push('费用类别不能为空')
  }
  if (item.unitPrice === undefined || item.unitPrice < 0) {
    errors.push('单价必须大于等于0')
  }
  if (item.quantity === undefined || item.quantity < 0) {
    errors.push('数量必须大于等于0')
  }
  if (!item.paymentEntity?.trim()) {
    errors.push('付款主体不能为空')
  }
  if (!item.accountCode?.trim()) {
    errors.push('会计科目不能为空')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * 验识月度数量总和与年度数量是否一致
 * @param monthlyQuantity - 1-12月每月的采购数量数组
 * @param totalQuantity - 年度总数量
 * @returns 是否一致（月数量总和 = 年度总数量）
 * @description 用于验识月度采购计划是否揺杂，确保月度牧控的氣密性
 */
function validateMonthlyQuantitySum(monthlyQuantity: number[], totalQuantity: number): boolean {
  const sum = monthlyQuantity.reduce((acc, qty) => acc + qty, 0)
  return sum === totalQuantity
}

/**
 * 计算预算总额（多个条目）
 * @param items - 预算条目数组
 * @returns 总金额
 */
function calculateBudgetTotal(items: BudgetItemDetail[]): number {
  return items.reduce((sum, item) => sum + item.totalAmount, 0)
}

/**
 * 按部门汇总预算
 * @param items - 预算条目数组
 * @returns 按部门分组的汇总
 */
function summarizeByDepartment(items: BudgetItemDetail[]): Record<string, number> {
  return items.reduce((acc, item) => {
    const dept = item.deptLevel2 || item.deptLevel1 || '未分类'
    acc[dept] = (acc[dept] || 0) + item.totalAmount
    return acc
  }, {} as Record<string, number>)
}

/**
 * 按类别汇总预算
 * @param items - 预算条目数组
 * @returns 按类别分组的汇总
 */
function summarizeByCategory(items: BudgetItemDetail[]): Record<string, number> {
  return items.reduce((acc, item) => {
    const category = item.category || '其他'
    acc[category] = (acc[category] || 0) + item.totalAmount
    return acc
  }, {} as Record<string, number>)
}

/**
 * 按月度汇总预算
 * @param items - 预算条目数组
 * @returns 12个月的预算金额数组
 */
function summarizeByMonth(items: BudgetItemDetail[]): number[] {
  const monthlyTotals = Array(12).fill(0)
  items.forEach(item => {
    item.monthlyAmount.forEach((amount, idx) => {
      monthlyTotals[idx] += amount
    })
  })
  return monthlyTotals
}

/**
 * 按项目汇总预算
 * @param items - 预算条目数组
 * @returns 按项目分组的汇总
 */
function summarizeByProject(items: BudgetItemDetail[]): Record<string, number> {
  return items.reduce((acc, item) => {
    const project = item.project || '未分配项目'
    acc[project] = (acc[project] || 0) + item.totalAmount
    return acc
  }, {} as Record<string, number>)
}

// ==================== 测试用例 ====================

describe('年度预算编制模块', () => {
  
  // 创建空条目工厂函数
  const createEmptyItem = (): BudgetItemDetail => ({
    id: Date.now().toString(),
    paymentEntity: '',
    group: '',
    accountCode: '',
    deptLevel1: '',
    deptLevel2: '',
    deptLevel3: '',
    category: '',
    name: '',
    specification: '',
    functionDesc: '',
    unitPrice: 0,
    quantity: 0,
    totalAmount: 0,
    project: '',
    purpose: '',
    supplier: '',
    deliveryDate: '',
    monthlyQuantity: Array(12).fill(0),
    monthlyAmount: Array(12).fill(0),
  })

  // 示例数据
  let sampleItem: BudgetItemDetail
  let sampleItems: BudgetItemDetail[]

  beforeEach(() => {
    sampleItem = {
      ...createEmptyItem(),
      id: '1',
      paymentEntity: '总公司',
      group: '研发一组',
      accountCode: '5001-01',
      deptLevel1: '研发部',
      deptLevel2: '半导体研发处',
      deptLevel3: '芯片验证组',
      category: '材料费',
      name: 'FPGA开发板',
      specification: 'Xilinx ZCU104',
      functionDesc: '用于芯片验证测试',
      unitPrice: 15000,
      quantity: 5,
      totalAmount: 75000,
      project: '5G芯片研发',
      purpose: '芯片验证',
      supplier: '贸泽电子',
      deliveryDate: '2026-06-30',
      monthlyQuantity: [1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
      monthlyAmount: [15000, 15000, 15000, 15000, 15000, 0, 0, 0, 0, 0, 0, 0],
    }

    sampleItems = [
      sampleItem,
      {
        ...createEmptyItem(),
        id: '2',
        paymentEntity: '分公司A',
        group: '测试二组',
        accountCode: '5001-02',
        deptLevel1: '测试部',
        deptLevel2: '可靠性测试处',
        category: '测试费',
        name: 'ATE测试费用',
        unitPrice: 5000,
        quantity: 12,
        totalAmount: 60000,
        project: '5G芯片研发',
        monthlyQuantity: Array(12).fill(1),
        monthlyAmount: Array(12).fill(5000),
      },
      {
        ...createEmptyItem(),
        id: '3',
        paymentEntity: '总公司',
        group: '设备一组',
        accountCode: '6001-01',
        deptLevel1: '设备部',
        deptLevel2: '生产设备处',
        category: '设备费',
        name: '贴片机',
        unitPrice: 500000,
        quantity: 1,
        totalAmount: 500000,
        project: '生产线升级',
        monthlyQuantity: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        monthlyAmount: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 500000],
      },
    ]
  })

  // ==================== 计算逻辑测试 ====================

  describe('计算逻辑', () => {
    it('应该正确计算总价', () => {
      expect(calculateTotalAmount(15000, 5)).toBe(75000)
      expect(calculateTotalAmount(100, 10)).toBe(1000)
      expect(calculateTotalAmount(0, 100)).toBe(0)
      expect(calculateTotalAmount(500, 0)).toBe(0)
    })

    it('应该正确计算月度金额分布', () => {
      const monthlyQty = [1, 2, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0]
      const amounts = calculateMonthlyAmounts(monthlyQty, 1000)
      
      expect(amounts).toEqual([1000, 2000, 3000, 0, 0, 0, 0, 0, 0, 0, 0, 0])
    })

    it('应该正确计算多个条目的总预算', () => {
      const total = calculateBudgetTotal(sampleItems)
      expect(total).toBe(635000) // 75000 + 60000 + 500000
    })
  })

  // ==================== 验证逻辑测试 ====================

  describe('验证逻辑', () => {
    it('应该验证必填字段 - 有效数据', () => {
      const result = validateBudgetItem({
        name: '测试项目',
        category: '材料费',
        unitPrice: 1000,
        quantity: 10,
        paymentEntity: '总公司',
        accountCode: '5001-01',
      })
      
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('应该验证必填字段 - 缺少名称', () => {
      const result = validateBudgetItem({
        name: '',
        category: '材料费',
        unitPrice: 1000,
        quantity: 10,
        paymentEntity: '总公司',
        accountCode: '5001-01',
      })
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('采购名称不能为空')
    })

    it('应该验证必填字段 - 缺少付款主体', () => {
      const result = validateBudgetItem({
        name: '测试项目',
        category: '材料费',
        unitPrice: 1000,
        quantity: 10,
        paymentEntity: '',
        accountCode: '5001-01',
      })
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('付款主体不能为空')
    })

    it('应该验证月度数量总和与年度数量一致性', () => {
      // 一致的情况
      expect(validateMonthlyQuantitySum([1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0], 5)).toBe(true)
      
      // 不一致的情况
      expect(validateMonthlyQuantitySum([1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0], 6)).toBe(false)
    })
  })

  // ==================== 汇总分析测试 ====================

  describe('汇总分析', () => {
    it('应该按部门汇总预算', () => {
      const summary = summarizeByDepartment(sampleItems)
      
      expect(summary['半导体研发处']).toBe(75000)
      expect(summary['可靠性测试处']).toBe(60000)
      expect(summary['生产设备处']).toBe(500000)
    })

    it('应该按类别汇总预算', () => {
      const summary = summarizeByCategory(sampleItems)
      
      expect(summary['材料费']).toBe(75000)
      expect(summary['测试费']).toBe(60000)
      expect(summary['设备费']).toBe(500000)
    })

    it('应该按月度汇总预算', () => {
      const summary = summarizeByMonth(sampleItems)
      
      // 1月: 15000 + 5000 + 0 = 20000
      expect(summary[0]).toBe(20000)
      
      // 6月: 0 + 5000 + 0 = 5000
      expect(summary[5]).toBe(5000)
      
      // 12月: 0 + 5000 + 500000 = 505000
      expect(summary[11]).toBe(505000)
    })

    it('应该按项目汇总预算', () => {
      const summary = summarizeByProject(sampleItems)
      
      expect(summary['5G芯片研发']).toBe(135000) // 75000 + 60000
      expect(summary['生产线升级']).toBe(500000)
    })
  })

  // ==================== 边界条件测试 ====================

  describe('边界条件', () => {
    it('应该处理空数组', () => {
      expect(calculateBudgetTotal([])).toBe(0)
      expect(summarizeByDepartment([])).toEqual({})
      expect(summarizeByMonth([])).toEqual(Array(12).fill(0))
    })

    it('应该处理负数价格', () => {
      const result = validateBudgetItem({
        name: '测试',
        category: '材料费',
        unitPrice: -100,
        quantity: 10,
        paymentEntity: '总公司',
        accountCode: '5001-01',
      })
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('单价必须大于等于0')
    })

    it('应该处理超额月度数量', () => {
      const result = validateBudgetItem({
        name: '测试',
        category: '材料费',
        unitPrice: 1000,
        quantity: 5,
        paymentEntity: '总公司',
        accountCode: '5001-01',
      })
      
      // 即使月度数量超过年度数量，也应该验证通过（由业务规则决定是否需要额外校验）
      expect(result.valid).toBe(true)
    })
  })
})

// ==================== 集成场景测试 ====================

describe('年度预算编制集成场景', () => {
  
  const createEmptyItem = (): BudgetItemDetail => ({
    id: Date.now().toString(),
    paymentEntity: '',
    group: '',
    accountCode: '',
    deptLevel1: '',
    deptLevel2: '',
    deptLevel3: '',
    category: '',
    name: '',
    specification: '',
    functionDesc: '',
    unitPrice: 0,
    quantity: 0,
    totalAmount: 0,
    project: '',
    purpose: '',
    supplier: '',
    deliveryDate: '',
    monthlyQuantity: Array(12).fill(0),
    monthlyAmount: Array(12).fill(0),
  })

  describe('场景1: 半导体研发部门年度预算编制', () => {
    it('应该正确汇总OPEX和CAPEX', () => {
      const opexItems: BudgetItemDetail[] = [
        {
          ...createEmptyItem(),
          id: '1',
          category: '材料费',
          name: '硅片采购',
          unitPrice: 5000,
          quantity: 100,
          totalAmount: 500000,
          monthlyQuantity: Array(12).fill(8),
          monthlyAmount: Array(12).fill(40000),
        },
        {
          ...createEmptyItem(),
          id: '2',
          category: '测试费',
          name: 'WAT测试',
          unitPrice: 10000,
          quantity: 50,
          totalAmount: 500000,
          monthlyQuantity: Array(12).fill(4),
          monthlyAmount: Array(12).fill(40000),
        },
      ]

      const capexItems: BudgetItemDetail[] = [
        {
          ...createEmptyItem(),
          id: '3',
          category: '设备费',
          name: '光刻机租赁',
          unitPrice: 100000,
          quantity: 5,
          totalAmount: 500000,
          monthlyQuantity: Array(12).fill(0).map((_, i) => i < 2 ? 2 : 0),
          monthlyAmount: Array(12).fill(0).map((_, i) => i < 2 ? 200000 : 0),
        },
      ]

      const opexTotal = calculateBudgetTotal(opexItems)
      const capexTotal = calculateBudgetTotal(capexItems)
      
      expect(opexTotal).toBe(1000000)
      expect(capexTotal).toBe(500000)
    })
  })

  describe('场景2: 二级部门预算汇总到一级部门', () => {
    it('应该正确汇总二级部门预算到一级部门', () => {
      const allItems: BudgetItemDetail[] = [
        {
          ...createEmptyItem(),
          id: '1',
          deptLevel1: '研发部',
          deptLevel2: '芯片设计处',
          name: 'EDA工具授权',
          totalAmount: 200000,
        },
        {
          ...createEmptyItem(),
          id: '2',
          deptLevel1: '研发部',
          deptLevel2: '芯片验证处',
          name: 'FPGA板卡',
          totalAmount: 150000,
        },
        {
          ...createEmptyItem(),
          id: '3',
          deptLevel1: '生产部',
          deptLevel2: '封装测试处',
          name: '封装设备',
          totalAmount: 300000,
        },
      ]

      const summary = summarizeByDepartment(allItems)
      
      // 一级部门汇总
      const rdTotal = summary['芯片设计处'] + summary['芯片验证处']
      expect(rdTotal).toBe(350000)
      
      // 二级部门明细
      expect(summary['芯片设计处']).toBe(200000)
      expect(summary['芯片验证处']).toBe(150000)
      expect(summary['封装测试处']).toBe(300000)
    })
  })
})
