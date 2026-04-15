import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Select,
  Row,
  Col,
  Statistic,
  Tabs,
  Progress,
  Tag,
  Button,
} from 'antd';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { analysisService, Ledger } from '../../services/analysis';
import { useAppSelector } from '../../store';

const { TabPane } = Tabs;

interface VarianceData {
  dimension: string;
  dimensionValue: string;
  budgetAmount: number;
  executedAmount: number;
  variance: number;
  varianceRate: number;
  executionRate: number;
}

interface AnalysisResult {
  byOrganization: VarianceData[];
  byDepartment: VarianceData[];
  byProject: VarianceData[];
  byAccount: VarianceData[];
  summary: {
    totalBudget: number;
    totalExecuted: number;
    totalVariance: number;
    avgExecutionRate: number;
  };
}

const VarianceAnalysis: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [budgetType, setBudgetType] = useState<string>('');
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [ledger, setLedger] = useState<Ledger>('PR');
  const { user } = useAppSelector((s) => s.auth);

  const roleCodes = user?.roles?.map((r) => r.code) || [];
  const canSeePo =
    roleCodes.includes('PROCUREMENT') ||
    roleCodes.includes('FINANCE') ||
    roleCodes.includes('SYS_ADMIN');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await analysisService.getVariance({
        year,
        budgetType: budgetType || undefined,
        ledger: canSeePo ? ledger : 'PR',
      });
      setData(response as unknown as AnalysisResult);
    } catch (error) {
      console.error('获取分析数据失败');
    } finally {
      setLoading(false);
    }
  }, [year, budgetType, ledger, canSeePo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const columns: ColumnsType<VarianceData> = [
    {
      title: '名称',
      dataIndex: 'dimensionValue',
      key: 'dimensionValue',
      width: 200,
    },
    {
      title: '预算金额',
      dataIndex: 'budgetAmount',
      key: 'budgetAmount',
      width: 150,
      render: (value) => `¥${value?.toLocaleString()}`,
    },
    {
      title: '执行金额',
      dataIndex: 'executedAmount',
      key: 'executedAmount',
      width: 150,
      render: (value) => `¥${value?.toLocaleString()}`,
    },
    {
      title: '差异金额',
      dataIndex: 'variance',
      key: 'variance',
      width: 150,
      render: (value) => (
        <span style={{ color: value >= 0 ? '#52c41a' : '#f5222d' }}>
          ¥{value?.toLocaleString()}
        </span>
      ),
    },
    {
      title: '差异率',
      dataIndex: 'varianceRate',
      key: 'varianceRate',
      width: 120,
      render: (value) => (
        <Tag color={value > 20 ? 'red' : value > 10 ? 'orange' : 'green'}>
          {value?.toFixed(1)}%
        </Tag>
      ),
    },
    {
      title: '执行率',
      dataIndex: 'executionRate',
      key: 'executionRate',
      width: 200,
      render: (value) => (
        <Progress
          percent={value}
          size="small"
          strokeColor={
            value > 90 ? '#f5222d' : value > 70 ? '#faad14' : '#52c41a'
          }
        />
      ),
    },
  ];

  const handleExport = () => {
    // TODO: 实现导出功能
    console.log('导出报表');
  };

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 24, color: '#1a1a1a' }}>
        差异分析
      </h2>

      <div style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Select
              value={year}
              onChange={setYear}
              style={{ width: '100%' }}
              options={[
                { value: 2026, label: '2026年' },
                { value: 2025, label: '2025年' },
                { value: 2024, label: '2024年' },
              ]}
            />
          </Col>
          <Col span={6}>
            <Select
              value={budgetType}
              onChange={setBudgetType}
              style={{ width: '100%' }}
              allowClear
              placeholder="预算类型"
              options={[
                { value: 'CAPEX', label: 'CAPEX (资本性支出)' },
                { value: 'OPEX', label: 'OPEX (运营性支出)' },
              ]}
            />
          </Col>
          <Col span={6}>
            <Select
              value={ledger}
              onChange={setLedger}
              style={{ width: '100%' }}
              disabled={!canSeePo}
              placeholder="口径"
              options={[
                { value: 'PR', label: 'PR账本（研发口径）' },
                { value: 'PO', label: 'PO账本（采购/财务口径）' },
                { value: 'ACTUAL', label: '结算口径（实际）' },
              ]}
            />
          </Col>
          <Col span={6} style={{ textAlign: 'right' }}>
            <Button 
              icon={<DownloadOutlined />} 
              onClick={handleExport}
              style={{ borderRadius: 8 }}
            >
              导出报表
            </Button>
          </Col>
        </Row>
      </div>

      {data && (
        <>
          <Card style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: 'none', marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={6}>
                <Statistic
                  title={<span style={{ color: '#666' }}>预算总额</span>}
                  value={data.summary.totalBudget}
                  precision={0}
                  prefix="¥"
                  valueStyle={{ color: '#1a1a1a', fontWeight: 600 }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title={<span style={{ color: '#666' }}>执行总额</span>}
                  value={data.summary.totalExecuted}
                  precision={0}
                  prefix="¥"
                  valueStyle={{ color: '#52c41a', fontWeight: 600 }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title={<span style={{ color: '#666' }}>差异总额</span>}
                  value={data.summary.totalVariance}
                  precision={0}
                  formatter={(v) => `¥${Number(v).toLocaleString()}`}
                  valueStyle={{
                    color: data.summary.totalVariance >= 0 ? '#52c41a' : '#ff4d4f',
                    fontWeight: 600,
                  }}
                  prefix={
                    data.summary.totalVariance >= 0 ? (
                      <ArrowUpOutlined />
                    ) : (
                      <ArrowDownOutlined />
                    )
                  }
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title={<span style={{ color: '#666' }}>平均执行率</span>}
                  value={data.summary.avgExecutionRate}
                  precision={1}
                  suffix="%"
                  valueStyle={{
                    color:
                      data.summary.avgExecutionRate > 90
                        ? '#ff4d4f'
                        : data.summary.avgExecutionRate > 70
                        ? '#faad14'
                        : '#52c41a',
                    fontWeight: 600,
                  }}
                />
              </Col>
            </Row>
          </Card>

          <Card style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: 'none' }}>
            <Tabs defaultActiveKey="department">
              <TabPane tab="按部门" key="department">
                <Table
                  columns={columns}
                  dataSource={data.byDepartment}
                  rowKey="dimensionValue"
                  loading={loading}
                  pagination={false}
                />
              </TabPane>
              <TabPane tab="按项目" key="project">
                <Table
                  columns={columns}
                  dataSource={data.byProject}
                  rowKey="dimensionValue"
                  loading={loading}
                  pagination={false}
                />
              </TabPane>
              <TabPane tab="按科目" key="account">
                <Table
                  columns={columns}
                  dataSource={data.byAccount}
                  rowKey="dimensionValue"
                  loading={loading}
                  pagination={false}
                />
              </TabPane>
              <TabPane tab="按组织" key="organization">
                <Table
                  columns={columns}
                  dataSource={data.byOrganization}
                  rowKey="dimensionValue"
                  loading={loading}
                  pagination={false}
                />
              </TabPane>
            </Tabs>
          </Card>
        </>
      )}
    </div>
  );
};

export default VarianceAnalysis;
