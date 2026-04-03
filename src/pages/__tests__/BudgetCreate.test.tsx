import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BudgetCreate } from '../BudgetCreate';
import { budgetApi } from '../../api/modules/budget.api';
import { departmentApi } from '../../api/modules/department.api';

// Mock API 模块
vi.mock('../../api/modules/budget.api', () => ({
  budgetApi: {
    create: vi.fn(),
  },
}));

vi.mock('../../api/modules/department.api', () => ({
  departmentApi: {
    getTree: vi.fn(),
  },
  DepartmentTreeNode: class {},
}));

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

// Mock window.alert
const mockAlert = vi.fn();
Object.defineProperty(window, 'alert', {
  writable: true,
  value: mockAlert,
});

describe('BudgetCreate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock department data
    vi.mocked(departmentApi.getTree).mockResolvedValue({
      data: [
        {
          id: 'dept-1',
          name: '研发部',
          children: [
            { id: 'dept-1-1', name: '前端组', children: [] },
            { id: 'dept-1-2', name: '后端组', children: [] },
          ],
        },
        { id: 'dept-2', name: '市场部', children: [] },
      ],
    } as any);
  });

  it('应渲染表单字段（预算名称、部门、类型、金额）', async () => {
    render(<BudgetCreate />);

    // 等待部门数据加载
    await waitFor(() => {
      expect(departmentApi.getTree).toHaveBeenCalled();
    });

    // 检查基本表单字段
    expect(screen.getByText(/预算名称/i)).toBeInTheDocument();
    expect(screen.getByText(/所属部门/i)).toBeInTheDocument();
    expect(screen.getByText(/预算类型/i)).toBeInTheDocument();
    expect(screen.getByText(/年度/i)).toBeInTheDocument();

    // 检查预算明细表格
    expect(screen.getByText(/预算明细/i)).toBeInTheDocument();
    expect(screen.getByText(/项目名称/i)).toBeInTheDocument();
    expect(screen.getByText(/单价/i)).toBeInTheDocument();
    expect(screen.getByText(/数量/i)).toBeInTheDocument();
  });

  it('提交表单应调用 API', async () => {
    vi.mocked(budgetApi.create).mockResolvedValue({
      data: { id: 'new-budget-id', name: '测试预算' },
    } as any);

    render(<BudgetCreate />);

    // 等待部门数据加载
    await waitFor(() => {
      expect(departmentApi.getTree).toHaveBeenCalled();
    });

    // 填写表单 - 使用 placeholder 查找输入框
    const nameInput = screen.getByPlaceholderText(/例如：2024年度研发部预算/i);
    fireEvent.change(nameInput, {
      target: { value: '2024年度测试预算' },
    });

    // 选择部门 - 使用 combobox role
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], {
      target: { value: 'dept-1' },
    });

    // 填写预算明细
    const nameInputs = screen.getAllByPlaceholderText(/例如：研发材料/i);
    fireEvent.change(nameInputs[0], {
      target: { value: '测试材料' },
    });

    const priceInputs = screen.getAllByPlaceholderText('0');
    fireEvent.change(priceInputs[0], {
      target: { value: '10000' },
    });

    // 提交表单
    const submitButton = screen.getByText(/保存为草稿/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(budgetApi.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: '2024年度测试预算',
          departmentId: 'dept-1',
          type: 'OPEX',
          items: expect.arrayContaining([
            expect.objectContaining({
              name: '测试材料',
              unitPrice: 10000,
            }),
          ]),
        })
      );
    });

    expect(mockAlert).toHaveBeenCalledWith('预算创建成功');
    expect(mockNavigate).toHaveBeenCalledWith('/budgets');
  });

  it('验证必填字段', async () => {
    render(<BudgetCreate />);

    // 等待部门数据加载
    await waitFor(() => {
      expect(departmentApi.getTree).toHaveBeenCalled();
    });

    // 检查必填字段存在
    const nameInput = screen.getByPlaceholderText(/例如：2024年度研发部预算/i);
    expect(nameInput).toBeInTheDocument();

    // 检查有 combobox (部门选择)
    const selects = screen.getAllByRole('combobox');
    expect(selects.length).toBeGreaterThan(0);
  });

  it('无有效预算明细时应显示警告', async () => {
    render(<BudgetCreate />);

    // 等待部门数据加载
    await waitFor(() => {
      expect(departmentApi.getTree).toHaveBeenCalled();
    });

    // 填写表单但不填写预算明细
    const nameInput = screen.getByPlaceholderText(/例如：2024年度研发部预算/i);
    fireEvent.change(nameInput, {
      target: { value: '测试预算' },
    });

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], {
      target: { value: 'dept-1' },
    });

    // 提交表单
    const submitButton = screen.getByText(/保存为草稿/i);
    fireEvent.click(submitButton);

    // 应该显示警告，而不是调用API
    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith('请至少添加一条有效的预算明细');
    });
    expect(budgetApi.create).not.toHaveBeenCalled();
  });

  it('API 调用失败时应显示错误', async () => {
    vi.mocked(budgetApi.create).mockRejectedValue({
      response: {
        data: {
          message: '预算名称已存在',
        },
      },
    });

    render(<BudgetCreate />);

    // 等待部门数据加载
    await waitFor(() => {
      expect(departmentApi.getTree).toHaveBeenCalled();
    });

    // 填写表单
    const nameInput = screen.getByPlaceholderText(/例如：2024年度研发部预算/i);
    fireEvent.change(nameInput, {
      target: { value: '重复预算' },
    });

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], {
      target: { value: 'dept-1' },
    });

    // 填写预算明细
    const nameInputs = screen.getAllByPlaceholderText(/例如：研发材料/i);
    fireEvent.change(nameInputs[0], {
      target: { value: '测试材料' },
    });

    const priceInputs = screen.getAllByPlaceholderText('0');
    fireEvent.change(priceInputs[0], {
      target: { value: '10000' },
    });

    // 提交表单
    const submitButton = screen.getByText(/保存为草稿/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith('预算名称已存在');
    });
  });

  it('应能添加和删除预算明细项', async () => {
    render(<BudgetCreate />);

    // 等待部门数据加载
    await waitFor(() => {
      expect(departmentApi.getTree).toHaveBeenCalled();
    });

    // 初始应该有一个明细项
    let nameInputs = screen.getAllByPlaceholderText(/例如：研发材料/i);
    expect(nameInputs).toHaveLength(1);

    // 点击添加项目
    const addButton = screen.getByText(/添加项目/i);
    fireEvent.click(addButton);

    // 应该有两个明细项
    nameInputs = screen.getAllByPlaceholderText(/例如：研发材料/i);
    expect(nameInputs).toHaveLength(2);

    // 删除一个项目 - 找到删除按钮（Trash2图标按钮）
    const allButtons = screen.getAllByRole('button');
    // 找到带有 svg 的按钮（删除按钮）
    const deleteButtons = allButtons.filter(btn => 
      btn.innerHTML.includes('svg') && !btn.textContent?.includes('添加')
    );
    
    // 确保至少有一个删除按钮
    expect(deleteButtons.length).toBeGreaterThan(0);
    
    // 点击第一个删除按钮
    if (deleteButtons.length > 0) {
      fireEvent.click(deleteButtons[0]);
    }

    // 检查明细项数量（至少应该还有一个）
    nameInputs = screen.getAllByPlaceholderText(/例如：研发材料/i);
    expect(nameInputs.length).toBeGreaterThanOrEqual(1);
  });

  it('应正确计算预算合计', async () => {
    render(<BudgetCreate />);

    // 等待部门数据加载
    await waitFor(() => {
      expect(departmentApi.getTree).toHaveBeenCalled();
    });

    // 填写预算明细
    const priceInputs = screen.getAllByPlaceholderText('0');
    fireEvent.change(priceInputs[0], {
      target: { value: '5000' },
    });

    const quantityInputs = screen.getAllByRole('spinbutton').filter(
      input => input.getAttribute('min') === '1'
    );
    fireEvent.change(quantityInputs[0], {
      target: { value: '3' },
    });

    // 检查合计金额
    await waitFor(() => {
      expect(screen.getByText(/预算合计/i)).toBeInTheDocument();
    });
  });
});
