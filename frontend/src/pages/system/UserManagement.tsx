import React, { useState, useEffect } from 'react';
import { Table, Button, Card, Space, Modal, Form, Input, Select, Tag, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, KeyOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { systemService } from '../../services/system';
import { SystemUser, SystemRole } from '../../types';

const UserManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SystemUser[]>([]);
  const [total, setTotal] = useState(0);
  const [roles, setRoles] = useState<SystemRole[]>([]);
  const [page, setPage] = useState(1);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [form] = Form.useForm();

  useEffect(() => { fetchRoles(); fetchData(); }, []);

  const fetchData = async (p = page) => {
    setLoading(true);
    try {
      const result = await systemService.getUsers({ page: p, pageSize: 20 });
      setData(result.data);
      setTotal(result.total);
    } catch (error) { message.error('获取用户列表失败'); }
    finally { setLoading(false); }
  };

  const fetchRoles = async () => {
    try {
      const result = await systemService.getRoles();
      setRoles(result);
    } catch (error) { console.error('获取角色失败', error); }
  };

  const handleCreate = () => {
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: SystemUser) => {
    setEditingUser(record);
    form.setFieldsValue({
      ...record,
      roleCodes: record.roles?.map(r => r.roleCode),
    });
    setModalVisible(true);
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确认删除', content: '确定要删除这个用户吗？',
      onOk: async () => {
        try { await systemService.deleteUser(id); message.success('删除成功'); fetchData(); }
        catch (error) { message.error('删除失败'); }
      },
    });
  };

  const handleResetPassword = (id: string) => {
    Modal.confirm({
      title: '重置密码', content: '确定要重置密码为123456吗？',
      onOk: async () => {
        try { await systemService.resetPassword(id, '123456'); message.success('密码已重置为123456'); }
        catch (error) { message.error('重置失败'); }
      },
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingUser) {
        await systemService.updateUser(editingUser.id, values);
        message.success('更新成功');
      } else {
        await systemService.createUser(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchData();
    } catch (error: any) {
      message.error(error?.response?.data?.message || '操作失败');
    }
  };

  const columns: ColumnsType<SystemUser> = [
    { title: '用户名', dataIndex: 'username', key: 'username', width: 120 },
    { title: '姓名', dataIndex: 'realName', key: 'realName', width: 120 },
    { title: '邮箱', dataIndex: 'email', key: 'email', width: 200 },
    { title: '电话', dataIndex: 'phone', key: 'phone', width: 130 },
    {
      title: '角色', dataIndex: 'roles', key: 'roles', width: 200,
      render: (roles: SystemRole[]) => roles?.map(r => <Tag key={r.id} color="blue">{r.roleName}</Tag>),
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 80,
      render: (status: string) => <Tag color={status === 'active' ? 'green' : 'red'}>{status === 'active' ? '启用' : '禁用'}</Tag>,
    },
    {
      title: '操作', key: 'action', width: 280,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Button type="link" size="small" icon={<KeyOutlined />} onClick={() => handleResetPassword(record.id)}>重置密码</Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>删除</Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 24, color: '#1a1a1a' }}>用户管理</h2>
      <Card
        style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: 'none' }}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}
            style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none', borderRadius: 8 }}>
            新建用户
          </Button>
        }
      >
        <Table
          columns={columns} dataSource={data} rowKey="id" loading={loading}
          pagination={{ current: page, total, pageSize: 20, onChange: (p) => { setPage(p); fetchData(p); } }}
        />
      </Card>
      <Modal title={editingUser ? '编辑用户' : '新建用户'} open={modalVisible} onOk={handleSubmit} onCancel={() => setModalVisible(false)} width={600}>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="username" label="用户名" rules={[{ required: true }]}>
            <Input placeholder="请输入用户名" disabled={!!editingUser} />
          </Form.Item>
          {!editingUser && (
            <Form.Item name="password" label="密码" rules={[{ required: true }]}>
              <Input.Password placeholder="请输入密码" />
            </Form.Item>
          )}
          <Form.Item name="realName" label="姓名" rules={[{ required: true }]}>
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Form.Item name="email" label="邮箱">
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item name="phone" label="电话">
            <Input placeholder="请输入电话" />
          </Form.Item>
          <Form.Item name="roleCodes" label="角色">
            <Select mode="multiple" placeholder="请选择角色"
              options={roles.map(r => ({ value: r.roleCode, label: r.roleName }))} />
          </Form.Item>
          {editingUser && (
            <Form.Item name="status" label="状态">
              <Select options={[{ value: 'active', label: '启用' }, { value: 'inactive', label: '禁用' }]} />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;
