import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Progress, Table, Tag, Select, Spin } from 'antd';
import {
  DollarOutlined,
  ShoppingCartOutlined,
  BarChartOutlined,
  RiseOutlined,
  FallOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { systemService } from '../../services/system';
import { DashboardData } from '../../types';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [year, setYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    fetchData();
  }, [year]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await systemService.getDashboardData(year);
      setData(result);
    } catch (error) {
      console.error('获取Dashboard数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  const { summary, byType, byDepartment, byStatus, recentBudgets, monthlyTrend, topProjects: _topProjects } = data;
  void byStatus;
  void _topProjects;

  // CAPEX/OPEX饼图
  const typePieOption = {
    tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
    legend: { bottom: 0 },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, formatter: '{b}\n{d}%' },
      data: [
        { value: byType.capex.budget, name: 'CAPEX', itemStyle: { color: '#5470c6' } },
        { value: byType.opex.budget, name: 'OPEX', itemStyle: { color: '#91cc75' } },
      ],
    }],
  };

  // 月度趋势图
  const trendOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['预算', '执行'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: monthlyTrend.map(m => m.month) },
    yAxis: { type: 'value', axisLabel: { formatter: (v: number) => v >= 10000 ? `${v/10000}万` : v } },
    series: [
      {
        name: '预算',
        type: 'bar',
        data: monthlyTrend.map(m => m.budget),
        itemStyle: { color: '#5470c6', borderRadius: [4, 4, 0, 0] },
      },
      {
        name: '执行',
        type: 'line',
        data: monthlyTrend.map(m => m.executed),
        itemStyle: { color: '#ee6666' },
        smooth: true,
        areaStyle: { color: 'rgba(238,102,102,0.1)' },
      },
    ],
  };

  // 部门执行率柱状图
  const deptOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: byDepartment.slice(0, 8).map(d => d.departmentName), axisLabel: { rotate: 30 } },
    yAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%' } },
    series: [{
      type: 'bar',
      data: byDepartment.slice(0, 8).map(d => d.executionRate),
      itemStyle: {
        color: (params: any) => {
          const val = params.value;
          if (val >= 80) return '#ee6666';
          if (val >= 60) return '#fac858';
          return '#91cc75';
        },
        borderRadius: [4, 4, 0, 0],
      },
    }],
  };

  // 状态分布
  const statusMap: Record<string, string> = { '草稿': 'default', '待审批': 'blue', '已审批': 'green', '已拒绝': 'red' };

  const recentColumns = [
    { title: '组织', dataIndex: 'organizationName', key: 'org' },
    {
      title: '类型', dataIndex: 'budgetType', key: 'type',
      render: (type: string) => <Tag color={type === 'CAPEX' ? 'blue' : 'green'}>{type}</Tag>,
    },
    {
      title: '预算金额', dataIndex: 'totalAmount', key: 'amount',
      render: (amount: number) => `¥${Number(amount || 0).toLocaleString()}`,
    },
    {
      title: '状态', dataIndex: 'status', key: 'status',
      render: (status: string) => <Tag color={statusMap[status] || 'default'}>{status}</Tag>,
    },
    {
      title: '执行率', dataIndex: 'executionRate', key: 'rate',
      render: (rate: number) => <Progress percent={Math.round(rate)} size="small" />,
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 600, color: '#1a1a1a', margin: 0 }}>
          预算执行概览
        </h2>
        <Select
          value={year}
          onChange={setYear}
          style={{ width: 120 }}
          options={[
            { value: 2026, label: '2026年' },
            { value: 2025, label: '2025年' },
            { value: 2024, label: '2024年' },
          ]}
        />
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: 'none' }}>
            <Statistic
              title={<span style={{ color: '#666', fontSize: 14 }}>年度预算总额</span>}
              value={summary.totalBudget}
              precision={0}
              prefix={<DollarOutlined style={{ color: '#667eea' }} />}
              suffix="元"
              valueStyle={{ color: '#1a1a1a', fontSize: 24, fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: 'none' }}>
            <Statistic
              title={<span style={{ color: '#666', fontSize: 14 }}>已执行预算</span>}
              value={summary.totalExecuted}
              precision={0}
              prefix={<ShoppingCartOutlined style={{ color: '#52c41a' }} />}
              suffix="元"
              valueStyle={{ color: '#52c41a', fontSize: 24, fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: 'none' }}>
            <Statistic
              title={<span style={{ color: '#666', fontSize: 14 }}>预算余额</span>}
              value={summary.totalRemaining}
              precision={0}
              prefix={<BarChartOutlined style={{ color: '#faad14' }} />}
              suffix="元"
              valueStyle={{ color: '#faad14', fontSize: 24, fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: 'none' }}>
            <div style={{ marginBottom: 8 }}>
              <span style={{ color: '#666', fontSize: 14 }}>整体执行率</span>
            </div>
            <Progress
              percent={Math.round(summary.executionRate)}
              size="default"
              strokeColor={{ '0%': '#667eea', '100%': '#764ba2' }}
            />
            <div style={{ marginTop: 8, color: '#666', fontSize: 12 }}>
              {summary.executionRate >= 70 ? (
                <><RiseOutlined style={{ color: '#52c41a', marginRight: 4 }} />执行进度良好</>
              ) : (
                <><FallOutlined style={{ color: '#faad14', marginRight: 4 }} />需要加快执行</>
              )}
            </div>
          </Card>
        </Col>
      </Row>

      {/* 预算数量统计 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card style={{ borderRadius: 12, border: 'none', textAlign: 'center' }}>
            <Statistic title="预算总数" value={summary.budgetCount} prefix={<FileTextOutlined style={{ color: '#667eea' }} />} />
          </Card>
        </Col>
        <Col span={8}>
          <Card style={{ borderRadius: 12, border: 'none', textAlign: 'center' }}>
            <Statistic title="已审批" value={summary.approvedCount} prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />} />
          </Card>
        </Col>
        <Col span={8}>
          <Card style={{ borderRadius: 12, border: 'none', textAlign: 'center' }}>
            <Statistic title="待审批" value={summary.pendingCount} prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />} />
          </Card>
        </Col>
      </Row>

      {/* 图表区域 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card title="CAPEX/OPEX分布" style={{ borderRadius: 12, border: 'none' }}>
            <ReactECharts option={typePieOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="部门执行率" style={{ borderRadius: 12, border: 'none' }}>
            <ReactECharts option={deptOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card title="月度预算执行趋势" style={{ borderRadius: 12, border: 'none' }}>
            <ReactECharts option={trendOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      {/* 近期预算列表 */}
      <Card
        title={<span style={{ fontSize: 16, fontWeight: 600 }}>近期预算</span>}
        style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: 'none' }}
      >
        <Table
          columns={recentColumns}
          dataSource={recentBudgets}
          rowKey="id"
          pagination={false}
        />
      </Card>
    </div>
  );
};

export default Dashboard;
