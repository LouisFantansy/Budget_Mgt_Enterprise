import React, { useState, useEffect } from 'react';
import { Table, Button, Card, Space, Modal, Form, Input, Select, message, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { masterService } from '../../services/master';
import { BudgetAccount } from '../../types';

const AccountList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<BudgetAccount[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BudgetAccount | null>(null);
  const [form] = Form.useForm();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await masterService.getBudgetAccounts();
      setData(response);
    } catch (error) {
      message.error('获取科目列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => { setEditingAccount(null); form.resetFields(); setModalVisible(true); };
  const handleEdit = (record: BudgetAccount) => { setEditingAccount(record); form.setFieldsValue(record); setModalVisible(true); };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确认删除', content: '确定要删除这个科目吗？',
      onOk: async () => {
        try { await masterService.deleteBudgetAccount(id); message.success('删除成功'); fetchData(); }
        catch (error) { message.error('删除失败'); }
      },
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingAccount) {
        await masterService.updateBudgetAccount(editingAccount.id, values);
        message.success('更新成功');
      } else {
        await masterService.createBudgetAccount(values);
        message.success('创建成功');
      }
      setModalVisible(false); fetchData();
    } catch (error) { message.error('操作失败'); }
  };

  const columns: ColumnsType<BudgetAccount> = [
    { title: '科目编码', dataIndex: 'accountCode', key: 'accountCode', width: 120 },
    { title: '科目名称', dataIndex: 'accountName', key: 'accountName', width: 200 },
    {
      title: '预算类型', dataIndex: 'accountType', key: 'accountType', width: 100,
      render: (type: string) => <Tag color={type === 'CAPEX' ? 'blue' : 'green'}>{type}</Tag>,
    },
    { title: '层级', dataIndex: 'accountLevel', key: 'accountLevel', width: 80 },
    {
      title: '是否叶节点', dataIndex: 'isLeaf', key: 'isLeaf', width: 100,
      render: (isLeaf: boolean) => <Tag color={isLeaf ? 'blue' : 'default'}>{isLeaf ? '明细' : '分类'}</Tag>,
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (status: string) => <Tag color={status === 'active' ? 'green' : 'red'}>{status === 'active' ? '启用' : '禁用'}</Tag>,
    },
    {
      title: '操作', key: 'action', width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>删除</Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 24, color: '#1a1a1a' }}>预算科目管理</h2>
      <Card
        style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: 'none' }}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}
            style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none', borderRadius: 8 }}>
            新建科目
          </Button>
        }
      >
        <Table columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={{ pageSize: 20 }} />
      </Card>
      <Modal title={editingAccount ? '编辑科目' : '新建科目'} open={modalVisible} onOk={handleSubmit} onCancel={() => setModalVisible(false)} width={600}>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="accountCode" label="科目编码" rules={[{ required: true }]}>
            <Input placeholder="请输入科目编码" />
          </Form.Item>
          <Form.Item name="accountName" label="科目名称" rules={[{ required: true }]}>
            <Input placeholder="请输入科目名称" />
          </Form.Item>
          <Form.Item name="accountType" label="预算类型" rules={[{ required: true }]}>
            <Select placeholder="请选择" options={[{ value: 'CAPEX', label: 'CAPEX' }, { value: 'OPEX', label: 'OPEX' }]} />
          </Form.Item>
          <Form.Item name="accountLevel" label="层级" rules={[{ required: true }]}>
            <Input placeholder="1, 2, 3" />
          </Form.Item>
          <Form.Item name="isLeaf" label="是否叶节点">
            <Select placeholder="请选择" options={[{ value: true, label: '明细' }, { value: false, label: '分类' }]} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AccountList;
