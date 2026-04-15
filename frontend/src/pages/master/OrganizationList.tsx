import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Card,
  Space,
  Modal,
  Form,
  Input,
  message,
  Tree,
  Row,
  Col,
  Tag,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ApartmentOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { masterService } from '../../services/master';
import { Organization } from '../../types';

const OrganizationList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Organization[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await masterService.getOrganizations();
      setData(response);
    } catch (error) {
      message.error('获取组织列表失败');
    } finally {
      setLoading(false);
    }
  };

  const buildTreeData = (orgs: Organization[]): any[] => {
    const map = new Map<string, any>();
    const roots: any[] = [];
    for (const org of orgs) {
      map.set(org.id, { title: org.name, key: org.id, children: [] });
    }
    for (const org of orgs) {
      const node = map.get(org.id)!;
      if (org.parentId && map.has(org.parentId)) {
        map.get(org.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }
    return roots;
  };

  const handleCreate = () => {
    setEditingOrg(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: Organization) => {
    setEditingOrg(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个组织吗？',
      onOk: async () => {
        try {
          await masterService.deleteOrganization(id);
          message.success('删除成功');
          fetchData();
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingOrg) {
        await masterService.updateOrganization(editingOrg.id, values);
        message.success('更新成功');
      } else {
        await masterService.createOrganization(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const columns: ColumnsType<Organization> = [
    { title: '组织编码', dataIndex: 'code', key: 'code', width: 150 },
    { title: '组织名称', dataIndex: 'name', key: 'name', width: 200 },
    {
      title: '层级', dataIndex: 'orgLevel', key: 'orgLevel', width: 80,
      render: (level: number) => {
        const labels = { 1: '公司', 2: '一级部门', 3: '二级部门' };
        return <Tag>{labels[level as keyof typeof labels] || level}</Tag>;
      },
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>{status === 'active' ? '启用' : '禁用'}</Tag>
      ),
    },
    {
      title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 120,
      render: (val: string) => val ? new Date(val).toLocaleDateString() : '',
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
      <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 24, color: '#1a1a1a' }}>组织管理</h2>
      <Row gutter={16}>
        <Col span={8}>
          <Card
            title={<span style={{ fontSize: 16, fontWeight: 600 }}><ApartmentOutlined /> 组织架构</span>}
            style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: 'none' }}
          >
            <Tree showLine defaultExpandedKeys={data.slice(0, 3).map(d => d.id)} treeData={buildTreeData(data)} />
          </Card>
        </Col>
        <Col span={16}>
          <Card
            style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: 'none' }}
            extra={
              <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}
                style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none', borderRadius: 8 }}>
                新建组织
              </Button>
            }
          >
            <Table columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
          </Card>
        </Col>
      </Row>
      <Modal title={editingOrg ? '编辑组织' : '新建组织'} open={modalVisible} onOk={handleSubmit} onCancel={() => setModalVisible(false)} width={600}>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="code" label="组织编码" rules={[{ required: true, message: '请输入组织编码' }]}>
            <Input placeholder="请输入组织编码" />
          </Form.Item>
          <Form.Item name="name" label="组织名称" rules={[{ required: true, message: '请输入组织名称' }]}>
            <Input placeholder="请输入组织名称" />
          </Form.Item>
          <Form.Item name="orgLevel" label="组织层级" rules={[{ required: true }]}>
            <Input placeholder="1-公司, 2-一级部门, 3-二级部门" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default OrganizationList;
