'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, Form, Input, Button, Typography, Alert, Space, Spin, Result, Tag } from 'antd';
import { UserOutlined, LockOutlined, PhoneOutlined, MailOutlined, TeamOutlined } from '@ant-design/icons';
import { useQuery, useMutation } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';

const { Title, Text } = Typography;

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  superadmin: { label: 'Super Admin', color: 'purple' },
  admin: { label: 'Administrator', color: 'blue' },
  operations: { label: 'Operations Manager', color: 'green' },
  finance: { label: 'Finance Manager', color: 'gold' },
  support: { label: 'Support Agent', color: 'cyan' },
};

function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const [error, setError] = useState<string | null>(null);

  // Verify token
  const { data: inviteData, isLoading: verifying, error: verifyError } = useQuery({
    queryKey: ['verify-invite', token],
    queryFn: async () => {
      if (!token) throw new Error('No invite token provided');
      const res = await adminApi.verifyInviteToken(token);
      return res.data.data;
    },
    enabled: !!token,
    retry: false,
  });

  // Accept invite mutation
  const acceptMutation = useMutation({
    mutationFn: (data: { name: string; password: string; phone?: string }) =>
      adminApi.acceptInvite({ token: token!, ...data }),
    onSuccess: () => {
      router.push('/login?invited=true');
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      setError(err.response?.data?.message || 'Failed to create account');
    },
  });

  const handleSubmit = (values: { name: string; password: string; confirmPassword: string; phone?: string }) => {
    if (values.password !== values.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError(null);
    acceptMutation.mutate({
      name: values.name,
      password: values.password,
      phone: values.phone,
    });
  };

  if (!token) {
    return (
      <Result
        status="error"
        title="Invalid Invite Link"
        subTitle="This invite link is invalid or missing the invite token."
        extra={
          <Button type="primary" onClick={() => router.push('/login')}>
            Go to Login
          </Button>
        }
      />
    );
  }

  if (verifying) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <Spin size="large" />
        <Text style={{ display: 'block', marginTop: 16 }}>Verifying invitation...</Text>
      </div>
    );
  }

  if (verifyError) {
    const errorMessage = (verifyError as Error & { response?: { data?: { message?: string } } })?.response?.data?.message || 'This invitation is invalid or has expired.';
    return (
      <Result
        status="warning"
        title="Invalid Invitation"
        subTitle={errorMessage}
        extra={
          <Button type="primary" onClick={() => router.push('/login')}>
            Go to Login
          </Button>
        }
      />
    );
  }

  const roleConfig = ROLE_LABELS[inviteData?.role] || { label: inviteData?.role, color: 'default' };

  return (
    <>
      <Space orientation="vertical" size="large" style={{ width: '100%' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <TeamOutlined style={{ fontSize: 48, color: '#16a34a' }} />
          <Title level={2} style={{ margin: '16px 0 4px', color: '#1f2937' }}>
            Join Handwork Admin Team
          </Title>
          <Text type="secondary">Complete your account setup to get started</Text>
        </div>

        {/* Invite Info */}
        <div style={{ background: '#f0fdf4', padding: 16, borderRadius: 8, border: '1px solid #bbf7d0' }}>
          <Space>
            <MailOutlined style={{ color: '#16a34a' }} />
            <Text strong>{inviteData?.email}</Text>
          </Space>
          <div style={{ marginTop: 8 }}>
            <Text type="secondary">You&apos;ve been invited as: </Text>
            <Tag color={roleConfig.color}>{roleConfig.label}</Tag>
          </div>
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

        {/* Form */}
        <Form
          layout="vertical"
          onFinish={handleSubmit}
          requiredMark={false}
        >
          <Form.Item
            name="name"
            label="Full Name"
            rules={[{ required: true, message: 'Please enter your name' }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#9ca3af' }} />}
              placeholder="Your full name"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Phone Number (Optional)"
          >
            <Input
              prefix={<PhoneOutlined style={{ color: '#9ca3af' }} />}
              placeholder="+234 800 000 0000"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[
              { required: true, message: 'Please enter a password' },
              { min: 8, message: 'Password must be at least 8 characters' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#9ca3af' }} />}
              placeholder="Create a password"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Confirm Password"
            rules={[{ required: true, message: 'Please confirm your password' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#9ca3af' }} />}
              placeholder="Confirm your password"
              size="large"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={acceptMutation.isPending}
              style={{ background: '#16a34a' }}
            >
              Create Account & Join Team
            </Button>
          </Form.Item>
        </Form>

        <Text type="secondary" style={{ textAlign: 'center', display: 'block' }}>
          Already have an account?{' '}
          <a href="/login" style={{ color: '#16a34a' }}>
            Sign in
          </a>
        </Text>
      </Space>
    </>
  );
}

export default function AcceptInvitePage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)',
        padding: '20px',
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 480,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          borderRadius: 16,
        }}
        variant="borderless"
      >
        <Suspense fallback={
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin size="large" />
          </div>
        }>
          <AcceptInviteContent />
        </Suspense>
      </Card>
    </div>
  );
}
