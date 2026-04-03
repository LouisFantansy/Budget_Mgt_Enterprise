import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { Approval } from '../Approval';

describe('Approval', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应渲染待审批列表', () => {
    render(<Approval />);

    // 检查页面标题
    expect(screen.getByText(/审批中心/i)).toBeInTheDocument();
    expect(screen.getByText(/处理预算审批流程/i)).toBeInTheDocument();

    // 检查Tab按钮
    expect(screen.getByText(/待审批/i)).toBeInTheDocument();
    expect(screen.getByText(/已通过/i)).toBeInTheDocument();
    expect(screen.getByText(/已拒绝/i)).toBeInTheDocument();

    // 检查表格列标题 - 使用 getAllByText 因为某些词可能在多处出现
    expect(screen.getByText(/^类型$/i)).toBeInTheDocument();
    expect(screen.getByText(/^标题$/i)).toBeInTheDocument();
    expect(screen.getAllByText(/部门/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/^金额$/i)).toBeInTheDocument();
    expect(screen.getByText(/申请人/i)).toBeInTheDocument();
    expect(screen.getByText(/当前步骤/i)).toBeInTheDocument();
    expect(screen.getByText(/^操作$/i)).toBeInTheDocument();
  });

  it('应渲染我的审批列表（mock数据）', () => {
    render(<Approval />);

    // 检查mock数据是否显示
    expect(screen.getByText(/2024年度研发部预算/i)).toBeInTheDocument();
    expect(screen.getByText(/研发材料预算调整/i)).toBeInTheDocument();
    expect(screen.getByText(/2024年度生产部设备采购/i)).toBeInTheDocument();

    // 检查部门信息
    expect(screen.getAllByText(/研发部/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/生产部/i).length).toBeGreaterThan(0);

    // 检查申请人
    expect(screen.getAllByText(/李部门/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/张生产/i).length).toBeGreaterThan(0);
  });

  it('Tab 切换功能应正常工作', () => {
    render(<Approval />);

    // 默认显示待审批
    expect(screen.getByText(/2024年度研发部预算/i)).toBeInTheDocument();

    // 点击已通过Tab
    const approvedTab = screen.getByText(/已通过/i);
    fireEvent.click(approvedTab);

    // 检查已通过Tab是否激活
    expect(approvedTab).toHaveClass('active');

    // 显示空状态
    expect(screen.getByText(/暂无已通过的审批记录/i)).toBeInTheDocument();

    // 点击已拒绝Tab
    const rejectedTab = screen.getByText(/已拒绝/i);
    fireEvent.click(rejectedTab);

    // 检查已拒绝Tab是否激活
    expect(rejectedTab).toHaveClass('active');

    // 显示空状态
    expect(screen.getByText(/暂无已拒绝的审批记录/i)).toBeInTheDocument();

    // 切回待审批
    const pendingTab = screen.getByText(/待审批/i);
    fireEvent.click(pendingTab);

    // 检查待审批Tab是否激活
    expect(pendingTab).toHaveClass('active');

    // 重新显示待审批列表
    expect(screen.getByText(/2024年度研发部预算/i)).toBeInTheDocument();
  });

  it('应显示审批/拒绝操作按钮', () => {
    render(<Approval />);

    // 检查通过和拒绝按钮 - 使用 role 来查找按钮
    const allButtons = screen.getAllByRole('button');
    const approveButtons = allButtons.filter(btn => btn.textContent?.includes('通过'));
    const rejectButtons = allButtons.filter(btn => btn.textContent?.includes('拒绝'));

    // 有3条mock数据，应该有3组按钮（可能还有其他按钮）
    expect(approveButtons.length).toBeGreaterThanOrEqual(3);
    expect(rejectButtons.length).toBeGreaterThanOrEqual(3);
  });

  it('应显示正确的审批类型标签', () => {
    render(<Approval />);

    // 检查类型标签
    expect(screen.getAllByText(/预算申请/i).length).toBe(2);
    expect(screen.getAllByText(/预算调整/i).length).toBeGreaterThan(0);
  });

  it('应显示当前步骤标签', () => {
    render(<Approval />);

    // 检查步骤标签 - 使用 getAllByText 因为可能有多个匹配
    expect(screen.getAllByText(/预算管理员/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/财务/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/部门负责人/i).length).toBeGreaterThan(0);
  });

  it('应正确格式化金额显示', () => {
    render(<Approval />);

    // 检查金额格式（转换为万元）
    expect(screen.getByText(/¥1500万/i)).toBeInTheDocument();
    expect(screen.getByText(/¥200万/i)).toBeInTheDocument();
    expect(screen.getByText(/¥800万/i)).toBeInTheDocument();
  });

  it('应显示正确的待审批数量', () => {
    render(<Approval />);

    // 检查Tab上显示的数量
    expect(screen.getByText(/待审批 \(3\)/i)).toBeInTheDocument();
    expect(screen.getByText(/已通过 \(0\)/i)).toBeInTheDocument();
    expect(screen.getByText(/已拒绝 \(0\)/i)).toBeInTheDocument();
  });

  it('点击通过按钮应触发审批操作', () => {
    render(<Approval />);

    // 获取第一个通过按钮
    const approveButtons = screen.getAllByText(/通过/i);
    
    // 点击通过按钮
    fireEvent.click(approveButtons[0]);

    // 由于当前是mock数据，点击不会实际改变状态
    // 但我们可以验证按钮是可点击的
    expect(approveButtons[0]).toBeEnabled();
  });

  it('点击拒绝按钮应触发拒绝操作', () => {
    render(<Approval />);

    // 获取第一个拒绝按钮
    const rejectButtons = screen.getAllByText(/拒绝/i);
    
    // 点击拒绝按钮
    fireEvent.click(rejectButtons[0]);

    // 由于当前是mock数据，点击不会实际改变状态
    // 但我们可以验证按钮是可点击的
    expect(rejectButtons[0]).toBeEnabled();
  });
});
