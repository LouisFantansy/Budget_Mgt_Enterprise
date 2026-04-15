import React, { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../store';
import { login } from '../../store/slices/authSlice';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const result = await dispatch(login(values)).unwrap();
      console.log('Login result:', result);
      message.success('登录成功');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMsg = typeof error === 'string' ? error : (error?.message || '登录失败');
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    }}>
      <div style={{
        width: 420,
        padding: 40,
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        {/* Logo和标题 */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 80,
            height: 80,
            margin: '0 auto 20px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 40,
            color: '#fff',
          }}>
            💰
          </div>
          <h1 style={{
            fontSize: 28,
            fontWeight: 700,
            color: '#1a1a1a',
            margin: 0,
            marginBottom: 8,
          }}>
            预算管理系统
          </h1>
          <p style={{
            fontSize: 14,
            color: '#666',
            margin: 0,
          }}>
            Budget Management System
          </p>
        </div>

        {/* 登录表单 */}
        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          layout="vertical"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#999' }} />}
              placeholder="用户名"
              size="large"
              style={{
                height: 48,
                borderRadius: 8,
                fontSize: 15,
              }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#999' }} />}
              placeholder="密码"
              size="large"
              style={{
                height: 48,
                borderRadius: 8,
                fontSize: 15,
              }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
              style={{
                height: 48,
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 600,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
              }}
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        {/* 提示信息 */}
        <div style={{
          textAlign: 'center',
          paddingTop: 20,
          borderTop: '1px solid #f0f0f0',
        }}>
          <p style={{
            fontSize: 13,
            color: '#999',
            margin: 0,
          }}>
            默认账号：<span style={{ color: '#666', fontWeight: 500 }}>admin</span> / 
            <span style={{ color: '#666', fontWeight: 500 }}>123456</span>
          </p>
          <p style={{
            fontSize: 12,
            color: '#bbb',
            margin: 0,
            marginTop: 4,
          }}>
            其他账号: sysadmin / budgetadmin / depthead / finance / user01 (密码均为123456)
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
