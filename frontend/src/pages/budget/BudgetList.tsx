import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Card,
  Space,
  Tag,
  Modal,
  message,
  Select,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { budgetService } from '../../services/budget';
import { Budget } from '../../types';

const BudgetList: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Budget[]>([]);
  const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear());
  const [typeFilter, setTypeFilter] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, [yearFilter, typeFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await budgetService.getAll({
        year: yearFilter,
        type: typeFilter || undefined,
      });
      setData(response);
    } catch (error) {
      message.error('获取预算列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个预算吗？',
      onOk: async () => {
        try {
          await budgetService.delete(id);
          message.success('删除成功');
          fetchData();
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  const handleSubmit = async (id: string) => {
    try {
      await budgetService.submit(id);
      message.success('提交成功');
      fetchData();
    } catch (error: any) {
      message.error(error?.response?.data?.message || '提交失败');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await budgetService.approve(id);
      message.success('审批成功');
      fetchData();
    } catch (error: any) {
      message.error(error?.response?.data?.message || '审批失败');
    }
  };

  const handleReject = async (id: string) => {
    Modal.confirm({
      title: '拒绝原因',
      content: '请输入拒绝原因',
      onOk: async () => {
        try {
          await budgetService.reject(id, '审批不通过');
          message.success('已拒绝');
          fetchData();
        } catch (error) {
          message.error('操作失败');
        }
      },
    });
  };

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      draft: { color: 'default', text: '草稿' },
      submitted: { color: 'blue', text: '待审批' },
      approved: { color: 'green', text: '已审批' },
      rejected: { color: 'red', text: '已拒绝' },
      adjusted: { color: 'orange', text: '已调整' },
    };
    const { color, text } = statusMap[status] || { color: 'default', text: status };
    return <Tag color={color}>{text}</Tag>;
  };

  const columns: ColumnsType<Budget> = [
    {
      title: '预算年度',
      dataIndex: 'budgetYear',
      key: 'budgetYear',
      width: 100,
    },
    {
      title: '预算类型',
      dataIndex: 'budgetType',
      key: 'budgetType',
      width: 100,
      render: (type) => (
        <Tag color={type === 'CAPEX' ? 'blue' : 'green'}>{type}</Tag>
      ),
    },
    {
      title: '组织',
      dataIndex: ['organization', 'name'],
      key: 'organization',
      width: 150,
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      width: 80,
    },
    {
      title: '预算总额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 150,
      render: (amount) => `¥${Number(amount || 0).toLocaleString()}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: getStatusTag,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (val) => val ? new Date(val).toLocaleDateString() : '',
    },
    {
      title: '操作',
      key: 'action',
      width: 250,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/budget/${record.id}`)}
          >
            查看
          </Button>
          {record.status === 'draft' && (
            <>
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => navigate(`/budget/${record.id}/edit`)}
              >
                编辑
              </Button>
              <Button
                type="link"
                size="small"
                onClick={() => handleSubmit(record.id)}
              >
                提交
              </Button>
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(record.id)}
              >
                删除
              </Button>
            </>
          )}
          {record.status === 'submitted' && (
            <>
              <Button
                type="link"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => handleApprove(record.id)}
              >
                审批
              </Button>
              <Button
                type="link"
                size="small"
                danger
                icon={<CloseOutlined />}
                onClick={() => handleReject(record.id)}
              >
                拒绝
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 24, color: '#1a1a1a' }}>
        预算管理
      </h2>

      <div style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Select
              value={yearFilter}
              onChange={setYearFilter}
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
              value={typeFilter}
              onChange={setTypeFilter}
              style={{ width: '100%' }}
              allowClear
              placeholder="预算类型"
              options={[
                { value: 'CAPEX', label: 'CAPEX (资本性支出)' },
                { value: 'OPEX', label: 'OPEX (运营性支出)' },
              ]}
            />
          </Col>
          <Col span={12} style={{ textAlign: 'right' }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/budget/create')}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: 8,
                height: 40,
              }}
            >
              新建预算
            </Button>
          </Col>
        </Row>
      </div>

      <Card style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: 'none' }}>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      </Card>
    </div>
  );
};

export default BudgetList;
