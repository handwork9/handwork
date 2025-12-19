'use client';

import { useState } from 'react';
import { Form, Input, Button, Card, Typography, Alert, Space } from 'antd';
import { UserOutlined, LockOutlined, ShopOutlined } from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

const { Title, Text } = Typography;

interface LoginForm {
  identifier: string;
  password: string;
}

export default function LoginPage() {
  const { setAuth } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  const loginMutation = useMutation({
    mutationFn: (data: LoginForm) => authApi.login(data.identifier, data.password),
    onSuccess: (response) => {
      const { user: apiUser, accessToken, refreshToken } = response.data.data;
      
      // Check if user has admin role
      const adminRoles = ['admin', 'superadmin', 'operations', 'finance', 'support'];
      if (!adminRoles.includes(apiUser.role)) {
        setError('Access denied. Admin privileges required.');
        return;
      }

      // Map API user to AdminUser format
      const user = {
        id: apiUser.id,
        name: apiUser.name || apiUser.fullName || 'Admin',
        email: apiUser.email,
        role: apiUser.role,
        avatar: apiUser.avatar,
        permissions: [], // Permissions derived from role
      };

      // Store auth
      setAuth(user, accessToken, refreshToken);
      
      // Small delay to ensure cookie is set before redirect
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
    },
    onError: (err: Error & { response?: { data?: { message?: string } }; message?: string }) => {
      console.error('Login error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Invalid credentials';
      setError(errorMessage);
    },
  });

  const onFinish = (values: LoginForm) => {
    setError(null);
    loginMutation.mutate(values);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px',
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 420,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          borderRadius: 16,
        }}
        variant="borderless"
      >
        <Space orientation="vertical" size="large" style={{ width: '100%' }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <ShopOutlined style={{ fontSize: 48, color: '#4f46e5' }} />
            <Title level={2} style={{ margin: '16px 0 4px', color: '#1f2937' }}>
              Handwork Admin
            </Title>
            <Text type="secondary">Marketplace Management Dashboard</Text>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert
              title={error}
              type="error"
              showIcon
              closable
              onClose={() => setError(null)}
            />
          )}

          {/* Login Form */}
          <Form
            name="login"
            onFinish={onFinish}
            layout="vertical"
            size="large"
            requiredMark={false}
          >
            <Form.Item
              name="identifier"
              label="Email or Phone"
              rules={[
                { required: true, message: 'Please enter your email or phone' },
              ]}
            >
              <Input
                prefix={<UserOutlined style={{ color: '#9ca3af' }} />}
                placeholder="admin@handwork.ng"
                autoComplete="email"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[
                { required: true, message: 'Please enter your password' },
                { min: 6, message: 'Password must be at least 6 characters' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#9ca3af' }} />}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={loginMutation.isPending}
                style={{
                  height: 48,
                  borderRadius: 8,
                  background: '#4f46e5',
                  fontWeight: 600,
                }}
              >
                Sign In
              </Button>
            </Form.Item>
          </Form>

          {/* Footer */}
          <div style={{ textAlign: 'center' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              © 2024 Handwork Marketplace. All rights reserved.
            </Text>
          </div>
        </Space>
      </Card>
    </div>
  );
}
