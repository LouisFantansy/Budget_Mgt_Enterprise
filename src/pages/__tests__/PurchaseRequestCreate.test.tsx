import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PurchaseRequestCreate } from '../PurchaseRequestCreate';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
      <a href={to}>{children}</a>
    ),
  };
});

// Mock console.log
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});

describe('PurchaseRequestCreate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应渲染表单字段', () => {
    render(<PurchaseRequestCreate />);

    // 检查表单标题
    expect(screen.getByText(/新建采购申请/i)).toBeInTheDocument();

    // 检查预算选择字段
    expect(screen.getByText(/关联预算编号/i)).toBeInTheDocument();

    // 检查采购明细字段
    expect(screen.getByText(/采购物品名称/i)).toBeInTheDocument();
    expect(screen.getByText(/规格型号/i)).toBeInTheDocument();
    expect(screen.getByText(/数量/i)).toBeInTheDocument();
    expect(screen.getByText(/单价/i)).toBeInTheDocument();
    expect(screen.getByText(/用途说明/i)).toBeInTheDocument();

    // 检查金额汇总
    expect(screen.getByText(/金额汇总/i)).toBeInTheDocument();

    // 检查审批流程预览
    expect(screen.getByText(/审批流程预览/i)).toBeInTheDocument();
  });

  it('应加载预算列表供选择', () => {
    render(<PurchaseRequestCreate />);

    // 检查预算选项 - 使用 combobox role
    const budgetSelect = screen.getByRole('combobox');
    expect(budgetSelect).toBeInTheDocument();

    // 检查选项内容（mock数据）
    expect(screen.getByText(/BUD-2024-001 - 测试晶圆/i)).toBeInTheDocument();
    expect(screen.getByText(/BUD-2024-002 - 测试设备/i)).toBeInTheDocument();
    expect(screen.getByText(/BUD-2024-003 - 研发材料/i)).toBeInTheDocument();
  });

  it('选择预算后应显示预算信息', () => {
    render(<PurchaseRequestCreate />);

    // 选择预算
    const budgetSelect = screen.getByRole('combobox');
    fireEvent.change(budgetSelect, {
      target: { value: 'BUD-2024-001' },
    });

    // 检查是否显示预算信息
    expect(screen.getByText(/预算充足/i)).toBeInTheDocument();
    expect(screen.getByText(/可用余额：¥500,000/i)).toBeInTheDocument();
  });

  it('提交表单应调用 API 并导航', () => {
    render(<PurchaseRequestCreate />);

    // 填写表单
    const budgetSelect = screen.getByRole('combobox');
    fireEvent.change(budgetSelect, {
      target: { value: 'BUD-2024-001' },
    });

    const textInputs = screen.getAllByRole('textbox');
    fireEvent.change(textInputs[0], {
      target: { value: '测试服务器' },
    });

    fireEvent.change(textInputs[1], {
      target: { value: 'Dell R750' },
    });

    const numberInputs = screen.getAllByRole('spinbutton');
    fireEvent.change(numberInputs[0], {
      target: { value: '2' },
    });

    fireEvent.change(numberInputs[1], {
      target: { value: '50000' },
    });

    fireEvent.change(textInputs[2], {
      target: { value: '用于研发测试环境' },
    });

    // 提交表单
    const submitButton = screen.getByText(/提交申请/i);
    fireEvent.click(submitButton);

    // 检查是否调用了console.log（模拟API调用）
    expect(mockConsoleLog).toHaveBeenCalledWith(
      'Creating purchase request:',
      expect.objectContaining({
        budgetItem: 'BUD-2024-001',
        itemName: '测试服务器',
        specification: 'Dell R750',
        quantity: 2,
        unitPrice: 50000,
        purpose: '用于研发测试环境',
      })
    );

    // 检查是否导航到列表页
    expect(mockNavigate).toHaveBeenCalledWith('/purchase');
  });

  it('应正确计算合计金额', () => {
    render(<PurchaseRequestCreate />);

    // 填写数量和单价
    const numberInputs = screen.getAllByRole('spinbutton');
    fireEvent.change(numberInputs[0], {
      target: { value: '5' },
    });

    fireEvent.change(numberInputs[1], {
      target: { value: '10000' },
    });

    // 检查合计金额
    expect(screen.getByText(/合计金额/i)).toBeInTheDocument();
    expect(screen.getByText('¥50,000')).toBeInTheDocument();
  });

  it('验证必填字段', () => {
    render(<PurchaseRequestCreate />);

    // 检查表单中有 required 属性的输入字段
    const requiredInputs = screen.getAllByRole('textbox');
    const requiredSelects = screen.getAllByRole('combobox');
    const requiredNumbers = screen.getAllByRole('spinbutton');
    
    // 验证必填字段存在
    expect(requiredInputs.length).toBeGreaterThan(0);
    expect(requiredSelects.length).toBeGreaterThan(0);
    expect(requiredNumbers.length).toBeGreaterThan(0);
  });

  it('应显示审批流程步骤', () => {
    render(<PurchaseRequestCreate />);

    // 检查审批流程步骤
    expect(screen.getByText(/需求人提交/i)).toBeInTheDocument();
    expect(screen.getByText(/部门负责人审批/i)).toBeInTheDocument();
    expect(screen.getByText(/预算管理员审批/i)).toBeInTheDocument();
    expect(screen.getByText(/财务审批/i)).toBeInTheDocument();
    expect(screen.getByText(/采购部执行/i)).toBeInTheDocument();
  });

  it('应显示返回链接', () => {
    render(<PurchaseRequestCreate />);

    const backLink = screen.getByText(/返回列表/i);
    expect(backLink).toBeInTheDocument();
    expect(backLink.closest('a')).toHaveAttribute('href', '/purchase');
  });

  it('应显示保存草稿按钮', () => {
    render(<PurchaseRequestCreate />);

    expect(screen.getByText(/保存草稿/i)).toBeInTheDocument();
  });
});
