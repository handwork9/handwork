'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Card,
  Form,
  Input,
  Button,
  Avatar,
  Upload,
  App,
  Typography,
  Row,
  Col,
  Divider,
  Tag,
  Space,
  Descriptions,
  Modal,
  Tabs,
  Timeline,
  Switch,
  Badge,
  Progress,
  Statistic,
  Flex,
  Tooltip,
  Spin,
  Empty,
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  LockOutlined,
  CameraOutlined,
  SaveOutlined,
  KeyOutlined,
  BellOutlined,
  SecurityScanOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DesktopOutlined,
  MobileOutlined,
  GlobalOutlined,
  EditOutlined,
  SafetyCertificateOutlined,
  SafetyOutlined,
  StarOutlined,
  CalendarOutlined,
  CopyOutlined,
  LoadingOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { useAuthStore, AdminRole, PERMISSIONS, ROLE_PERMISSIONS } from '@/store/auth';
import { authApi, sessionsApi, twoFactorApi } from '@/lib/api';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Title, Text, Paragraph } = Typography;

// Role configuration with colors and descriptions
const ROLE_CONFIG: Record<AdminRole, { color: string; label: string; description: string }> = {
  superadmin: {
    color: '#f50',
    label: 'Super Admin',
    description: 'Full system access with all permissions',
  },
  admin: {
    color: '#722ed1',
    label: 'Admin',
    description: 'Administrative access to manage the platform',
  },
  operations: {
    color: '#2f54eb',
    label: 'Operations',
    description: 'Manage orders, dispatch, and daily operations',
  },
  finance: {
    color: '#52c41a',
    label: 'Finance',
    description: 'Access to financial reports and transactions',
  },
  support: {
    color: '#13c2c2',
    label: 'Support',
    description: 'Handle customer inquiries and support tickets',
  },
};

// Types for API responses
interface Session {
  id: string;
  device: string;
  location: string;
  ip: string;
  lastActive: string;
  current: boolean;
}

interface Activity {
  id: string;
  action: string;
  timestamp: string;
  device: string;
  ip: string;
}

export default function ProfilePage() {
  const { message } = App.useApp();
  const { user, setAuth } = useAuthStore();
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [changePasswordModal, setChangePasswordModal] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar);

  // Fetch active sessions from API
  const { data: sessionsData, isLoading: isLoadingSessions, refetch: refetchSessions } = useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      const response = await sessionsApi.getSessions();
      return response.data.sessions || [];
    },
  });

  // Fetch login history from API  
  const { data: activityData, isLoading: isLoadingActivity } = useQuery({
    queryKey: ['loginHistory'],
    queryFn: async () => {
      const response = await sessionsApi.getLoginHistory();
      return response.data.activities || [];
    },
  });

  // Use API data
  const sessions: Session[] = sessionsData || [];
  const activityLog: Activity[] = activityData || [];

  // Notification preferences state
  const [notificationPrefs, setNotificationPrefs] = useState({
    emailNotifications: true,
    orderAlerts: true,
    systemUpdates: false,
    marketingEmails: false,
    desktopNotifications: true,
    soundAlerts: true,
  });

  // 2FA state
  const [twoFactorModal, setTwoFactorModal] = useState(false);
  const [twoFactorDisableModal, setTwoFactorDisableModal] = useState(false);
  const [twoFactorSetupData, setTwoFactorSetupData] = useState<{
    secret: string;
    qrCodeDataUrl: string;
    otpauthUrl: string;
  } | null>(null);
  const [verificationCode, setVerificationCode] = useState('');

  // Fetch 2FA status
  const { data: twoFactorStatus, isLoading: isLoadingTwoFactorStatus, refetch: refetchTwoFactorStatus } = useQuery({
    queryKey: ['twoFactorStatus'],
    queryFn: async () => {
      const response = await twoFactorApi.getStatus();
      return response.data?.data || response.data;
    },
  });

  // Generate 2FA secret mutation
  const generateTwoFactorMutation = useMutation({
    mutationFn: async () => {
      const response = await twoFactorApi.generate();
      return response.data?.data || response.data;
    },
    onSuccess: (data) => {
      setTwoFactorSetupData(data);
      setTwoFactorModal(true);
    },
    onError: () => {
      message.error('Failed to generate 2FA secret');
    },
  });

  // Enable 2FA mutation
  const enableTwoFactorMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await twoFactorApi.enable(code);
      return response.data?.data || response.data;
    },
    onSuccess: () => {
      message.success('Two-Factor Authentication enabled successfully');
      setTwoFactorModal(false);
      setTwoFactorSetupData(null);
      setVerificationCode('');
      refetchTwoFactorStatus();
    },
    onError: () => {
      message.error('Invalid verification code. Please try again.');
    },
  });

  // Disable 2FA mutation
  const disableTwoFactorMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await twoFactorApi.disable(code);
      return response.data?.data || response.data;
    },
    onSuccess: () => {
      message.success('Two-Factor Authentication disabled');
      setTwoFactorDisableModal(false);
      setVerificationCode('');
      refetchTwoFactorStatus();
    },
    onError: () => {
      message.error('Invalid verification code. Please try again.');
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (values: { name: string; email: string }) => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return { ...user, ...values };
    },
    onSuccess: (updatedUser) => {
      if (user) {
        setAuth(
          { ...user, name: updatedUser.name, email: updatedUser.email },
          document.cookie.split('admin_token=')[1]?.split(';')[0] || ''
        );
      }
      message.success('Profile updated successfully');
    },
    onError: () => {
      message.error('Failed to update profile');
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (
      data: { currentPassword: string; newPassword: string }
    ) => {
      const response = await authApi.changePassword(data.currentPassword, data.newPassword);
      return response.data;
    },
    onSuccess: () => {
      message.success('Password changed successfully');
      setChangePasswordModal(false);
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      message.error(error.response?.data?.message || 'Failed to change password');
    },
  });

  // Upload props for avatar
  const uploadProps: UploadProps = {
    name: 'avatar',
    showUploadList: false,
    beforeUpload: (file) => {
      const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
      if (!isJpgOrPng) {
        message.error('You can only upload JPG/PNG files!');
        return false;
      }
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        message.error('Image must be smaller than 2MB!');
        return false;
      }
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      return false;
    },
  };

  const handleProfileUpdate = (values: { name: string; email: string }) => {
    updateProfileMutation.mutate(values);
  };

  const handlePasswordChange = (values: { currentPassword: string; newPassword: string }) => {
    changePasswordMutation.mutate(values);
  };

  const roleConfig = user?.role ? ROLE_CONFIG[user.role] : ROLE_CONFIG.admin;

  // Get actual permissions based on role
  const actualUserPermissions = user?.role ? ROLE_PERMISSIONS[user.role] || [] : [];

  // Calculate permission stats
  const totalPermissions = Object.keys(PERMISSIONS).length;
  const userPermissionsCount = actualUserPermissions.length;
  const permissionPercentage = Math.round((userPermissionsCount / totalPermissions) * 100);

  const tabItems = [
    {
      key: 'profile',
      label: (
        <span>
          <UserOutlined />
          Profile
        </span>
      ),
      children: (
        <Row gutter={24}>
          <Col xs={24} lg={8}>
            <Card 
              style={{ borderRadius: 16, textAlign: 'center' }}
              styles={{ body: { padding: 24 } }}
            >
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: 20 }}>
                <Upload {...uploadProps}>
                  <div style={{ position: 'relative', cursor: 'pointer' }}>
                    <Avatar
                      size={120}
                      src={avatarUrl}
                      icon={<UserOutlined />}
                      style={{ 
                        border: '4px solid #f0f0f0',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      }}
                    />
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '3px solid #fff',
                    }}>
                      <CameraOutlined style={{ color: '#fff', fontSize: 16 }} />
                    </div>
                  </div>
                </Upload>
              </div>
              
              <Title level={4} style={{ margin: '0 0 4px 0' }}>
                {user?.name || 'Admin User'}
              </Title>
              <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
                {user?.email || 'admin@handwork.com'}
              </Text>
              <Tag 
                color={roleConfig.color}
                style={{ 
                  padding: '4px 16px', 
                  fontSize: 14,
                  borderRadius: 20,
                }}
              >
                {roleConfig.label}
              </Tag>
              <Paragraph type="secondary" style={{ marginTop: 12, fontSize: 13 }}>
                {roleConfig.description}
              </Paragraph>

              <Divider />

              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={12}>
                  <div style={{ 
                    padding: 16, 
                    background: '#f9fafb', 
                    borderRadius: 12 
                  }}>
                    <CalendarOutlined style={{ fontSize: 20, color: '#8b5cf6', marginBottom: 8 }} />
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>Member Since</Text>
                      <br />
                      <Text strong>Jan 2024</Text>
                    </div>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ 
                    padding: 16, 
                    background: '#f9fafb', 
                    borderRadius: 12 
                  }}>
                    <SafetyOutlined style={{ fontSize: 20, color: '#10b981', marginBottom: 8 }} />
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>Status</Text>
                      <br />
                      <Badge status="success" text={<Text strong>Active</Text>} />
                    </div>
                  </div>
                </Col>
              </Row>

              <div style={{ 
                padding: 16, 
                background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', 
                borderRadius: 12 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text strong>Access Level</Text>
                  <Text type="secondary">{userPermissionsCount}/{totalPermissions}</Text>
                </div>
                <Progress
                  percent={permissionPercentage}
                  size="small"
                  strokeColor={{
                    '0%': '#667eea',
                    '100%': '#764ba2',
                  }}
                  showInfo={false}
                />
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={16}>
            <Card 
              title={
                <Space>
                  <EditOutlined style={{ color: '#667eea' }} />
                  <span>Edit Profile</span>
                </Space>
              }
              style={{ borderRadius: 16, marginBottom: 16 }}
              styles={{ body: { padding: 24 } }}
            >
              <Form
                form={profileForm}
                layout="vertical"
                initialValues={{
                  name: user?.name || 'Admin User',
                  email: user?.email || 'admin@handwork.com',
                }}
                onFinish={handleProfileUpdate}
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="name"
                      label="Full Name"
                      rules={[{ required: true, message: 'Please enter your name' }]}
                    >
                      <Input prefix={<UserOutlined />} placeholder="Enter your name" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="email"
                      label="Email Address"
                      rules={[
                        { required: true, message: 'Please enter your email' },
                        { type: 'email', message: 'Please enter a valid email' },
                      ]}
                    >
                      <Input prefix={<MailOutlined />} placeholder="Enter your email" />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item>
                  <Space>
                    <Button
                      type="primary"
                      htmlType="submit"
                      icon={<SaveOutlined />}
                      loading={updateProfileMutation.isPending}
                    >
                      Save Changes
                    </Button>
                    <Button onClick={() => profileForm.resetFields()}>Reset</Button>
                  </Space>
                </Form.Item>
              </Form>
            </Card>

            <Card 
              title={
                <Space>
                  <SafetyCertificateOutlined style={{ color: '#ef4444' }} />
                  <span>Security</span>
                </Space>
              }
              style={{ borderRadius: 16 }}
              styles={{ body: { padding: 24 } }}
            >
              <Row gutter={24}>
                <Col span={12}>
                  <div style={{ 
                    padding: 20, 
                    background: '#fef3f2', 
                    borderRadius: 12,
                    border: '1px solid #fecaca',
                  }}>
                    <Space style={{ marginBottom: 12 }}>
                      <LockOutlined style={{ fontSize: 20, color: '#ef4444' }} />
                      <Text strong>Password</Text>
                    </Space>
                    <Paragraph type="secondary" style={{ marginBottom: 12, fontSize: 13 }}>
                      Last changed 30 days ago. We recommend changing your password regularly.
                    </Paragraph>
                    <Button
                      type="primary"
                      danger
                      icon={<KeyOutlined />}
                      onClick={() => setChangePasswordModal(true)}
                    >
                      Change Password
                    </Button>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ 
                    padding: 20, 
                    background: twoFactorStatus?.isEnabled ? '#f0fdf4' : '#fef3c7', 
                    borderRadius: 12,
                    border: `1px solid ${twoFactorStatus?.isEnabled ? '#bbf7d0' : '#fcd34d'}`,
                  }}>
                    <Space style={{ marginBottom: 12 }}>
                      <SecurityScanOutlined style={{ fontSize: 20, color: twoFactorStatus?.isEnabled ? '#10b981' : '#f59e0b' }} />
                      <Text strong>Two-Factor Auth</Text>
                      {isLoadingTwoFactorStatus ? (
                        <LoadingOutlined style={{ marginLeft: 8 }} />
                      ) : twoFactorStatus?.isEnabled ? (
                        <Tag color="success">Enabled</Tag>
                      ) : (
                        <Tag color="warning">Disabled</Tag>
                      )}
                    </Space>
                    <Paragraph type="secondary" style={{ marginBottom: 12, fontSize: 13 }}>
                      {twoFactorStatus?.isEnabled 
                        ? 'Your account is protected with two-factor authentication.' 
                        : 'Add an extra layer of security to your account.'}
                    </Paragraph>
                    {twoFactorStatus?.isEnabled ? (
                      <Button 
                        danger
                        icon={<SecurityScanOutlined />}
                        onClick={() => setTwoFactorDisableModal(true)}
                      >
                        Disable 2FA
                      </Button>
                    ) : (
                      <Button 
                        icon={<SecurityScanOutlined />}
                        loading={generateTwoFactorMutation.isPending}
                        onClick={() => generateTwoFactorMutation.mutate()}
                        style={{ background: '#10b981', color: '#fff', border: 'none' }}
                      >
                        Enable 2FA
                      </Button>
                    )}
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'notifications',
      label: (
        <span>
          <BellOutlined />
          Notifications
        </span>
      ),
      children: (
        <Row gutter={24}>
          <Col xs={24} lg={12}>
            <Card 
              title={
                <Space>
                  <MailOutlined style={{ color: '#3b82f6' }} />
                  <span>Email Notifications</span>
                </Space>
              }
              style={{ borderRadius: 16 }}
              styles={{ body: { padding: 20 } }}
            >
              {[
                {
                  key: 'emailNotifications',
                  title: 'Email Notifications',
                  description: 'Receive email notifications for important updates',
                },
                {
                  key: 'orderAlerts',
                  title: 'Order Alerts',
                  description: 'Get notified about new orders and status changes',
                },
                {
                  key: 'systemUpdates',
                  title: 'System Updates',
                  description: 'Receive updates about system maintenance and changes',
                },
                {
                  key: 'marketingEmails',
                  title: 'Marketing Emails',
                  description: 'Receive promotional content and newsletters',
                },
              ].map((item, index, arr) => (
                <div key={item.key}>
                  <Flex justify="space-between" align="center" style={{ padding: '12px 0' }}>
                    <div>
                      <Text strong>{item.title}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>{item.description}</Text>
                    </div>
                    <Switch
                      checked={notificationPrefs[item.key as keyof typeof notificationPrefs]}
                      onChange={(checked) =>
                        setNotificationPrefs((prev) => ({ ...prev, [item.key]: checked }))
                      }
                    />
                  </Flex>
                  {index < arr.length - 1 && <Divider style={{ margin: 0 }} />}
                </div>
              ))}
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card 
              title={
                <Space>
                  <DesktopOutlined style={{ color: '#8b5cf6' }} />
                  <span>Push Notifications</span>
                </Space>
              }
              style={{ borderRadius: 16 }}
              styles={{ body: { padding: 20 } }}
            >
              {[
                {
                  key: 'desktopNotifications',
                  title: 'Desktop Notifications',
                  description: 'Show desktop notifications when browser is open',
                },
                {
                  key: 'soundAlerts',
                  title: 'Sound Alerts',
                  description: 'Play sound for new notifications',
                },
              ].map((item, index, arr) => (
                <div key={item.key}>
                  <Flex justify="space-between" align="center" style={{ padding: '12px 0' }}>
                    <div>
                      <Text strong>{item.title}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>{item.description}</Text>
                    </div>
                    <Switch
                      checked={notificationPrefs[item.key as keyof typeof notificationPrefs]}
                      onChange={(checked) =>
                        setNotificationPrefs((prev) => ({ ...prev, [item.key]: checked }))
                      }
                    />
                  </Flex>
                  {index < arr.length - 1 && <Divider style={{ margin: 0 }} />}
                </div>
              ))}
            </Card>

            <Card 
              title={
                <Space>
                  <StarOutlined style={{ color: '#f59e0b' }} />
                  <span>Notification Summary</span>
                </Space>
              }
              style={{ marginTop: 16, borderRadius: 16 }}
              styles={{ body: { padding: 20 } }}
            >
              <Row gutter={16}>
                <Col span={8}>
                  <div style={{ textAlign: 'center', padding: 16, background: '#eff6ff', borderRadius: 12 }}>
                    <Statistic
                      title={<Text type="secondary" style={{ fontSize: 12 }}>Today</Text>}
                      value={12}
                      prefix={<BellOutlined style={{ color: '#3b82f6' }} />}
                      styles={{ content: { color: '#3b82f6', fontSize: 24 } }}
                    />
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: 'center', padding: 16, background: '#f0fdf4', borderRadius: 12 }}>
                    <Statistic
                      title={<Text type="secondary" style={{ fontSize: 12 }}>This Week</Text>}
                      value={48}
                      prefix={<BellOutlined style={{ color: '#10b981' }} />}
                      styles={{ content: { color: '#10b981', fontSize: 24 } }}
                    />
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: 'center', padding: 16, background: '#fefce8', borderRadius: 12 }}>
                    <Statistic
                      title={<Text type="secondary" style={{ fontSize: 12 }}>Unread</Text>}
                      value={5}
                      prefix={<BellOutlined style={{ color: '#f59e0b' }} />}
                      styles={{ content: { color: '#f59e0b', fontSize: 24 } }}
                    />
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'activity',
      label: (
        <span>
          <HistoryOutlined />
          Activity Log
        </span>
      ),
      children: (
        <Row gutter={24}>
          <Col xs={24} lg={16}>
            <Card 
              title={
                <Space>
                  <HistoryOutlined style={{ color: '#10b981' }} />
                  <span>Recent Activity</span>
                </Space>
              }
              style={{ borderRadius: 16 }}
              styles={{ body: { padding: 24 } }}
            >
              {isLoadingActivity ? (
                <Flex justify="center" align="center" style={{ minHeight: 200 }}>
                  <Spin />
                </Flex>
              ) : activityLog.length === 0 ? (
                <Empty description="No recent activity" />
              ) : (
                <Timeline
                  items={activityLog.map((activity) => ({
                    color: 'green',
                    content: (
                      <div>
                        <Text strong>{activity.action}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {dayjs(activity.timestamp).fromNow()} • {activity.device} • {activity.ip}
                        </Text>
                      </div>
                    ),
                  }))}
                />
              )}
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card 
              title={
                <Space>
                  <DesktopOutlined style={{ color: '#3b82f6' }} />
                  <span>Active Sessions</span>
                </Space>
              }
              style={{ borderRadius: 16 }}
              styles={{ body: { padding: 20 } }}
            >
              {isLoadingSessions ? (
                <Flex justify="center" align="center" style={{ minHeight: 150 }}>
                  <Spin />
                </Flex>
              ) : sessions.length === 0 ? (
                <Empty description="No active sessions" />
              ) : (
                sessions.map((session, index) => (
                  <div key={session.id}>
                    <Flex gap={12} align="flex-start" style={{ padding: '12px 0' }}>
                      {session.device.includes('iPhone') || session.device.includes('Android') || session.device.includes('Mobile') ? (
                        <MobileOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                      ) : (
                        <DesktopOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                      )}
                      <div style={{ flex: 1 }}>
                        <Flex justify="space-between" align="center">
                          <Space>
                            <Text strong>{session.device}</Text>
                            {session.current && <Tag color="green">Current</Tag>}
                          </Space>
                          {!session.current && (
                            <Button 
                              type="link" 
                              danger 
                              size="small"
                              onClick={async () => {
                                try {
                                  await sessionsApi.endSession(session.id);
                                  message.success('Session ended');
                                  refetchSessions();
                                } catch {
                                  message.error('Failed to end session');
                                }
                              }}
                            >
                              Revoke
                            </Button>
                          )}
                        </Flex>
                        <div>
                          <GlobalOutlined /> {session.location}
                          <br />
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {session.current ? 'Active now' : dayjs(session.lastActive).fromNow()}
                          </Text>
                        </div>
                      </div>
                    </Flex>
                    {index < sessions.length - 1 && <Divider style={{ margin: 0 }} />}
                  </div>
                ))
              )}
              <Button 
                type="link" 
                danger 
                style={{ marginTop: 16 }}
                onClick={async () => {
                  try {
                    await sessionsApi.endAllSessions();
                    message.success('All other sessions ended');
                    refetchSessions();
                  } catch {
                    message.error('Failed to end sessions');
                  }
                }}
              >
                Sign out all other sessions
              </Button>
            </Card>

            <Card 
              title={
                <Space>
                  <ClockCircleOutlined style={{ color: '#8b5cf6' }} />
                  <span>Login Stats</span>
                </Space>
              }
              style={{ marginTop: 16, borderRadius: 16 }}
              styles={{ body: { padding: 20 } }}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <div style={{ textAlign: 'center', padding: 16, background: '#faf5ff', borderRadius: 12 }}>
                    <Statistic 
                      title={<Text type="secondary" style={{ fontSize: 12 }}>Total Logins</Text>}
                      value={156} 
                      styles={{ content: { color: '#8b5cf6', fontSize: 24 } }}
                    />
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ textAlign: 'center', padding: 16, background: '#ecfdf5', borderRadius: 12 }}>
                    <Statistic 
                      title={<Text type="secondary" style={{ fontSize: 12 }}>This Month</Text>}
                      value={23} 
                      styles={{ content: { color: '#10b981', fontSize: 24 } }}
                    />
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'permissions',
      label: (
        <span>
          <SecurityScanOutlined />
          Permissions
        </span>
      ),
      children: (
        <Card 
          title={
            <Space>
              <SafetyOutlined style={{ color: '#6366f1' }} />
              <span>Your Permissions</span>
            </Space>
          }
          style={{ borderRadius: 16 }}
          styles={{ body: { padding: 24 } }}
        >
          <div style={{ 
            padding: 16, 
            background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)', 
            borderRadius: 12,
            marginBottom: 24,
          }}>
            <Paragraph type="secondary" style={{ margin: 0 }}>
              These permissions are assigned based on your role (<Tag color={roleConfig.color}>{roleConfig.label}</Tag>). 
              Contact a super admin if you need additional access.
            </Paragraph>
          </div>

          <Row gutter={[16, 16]}>
            {Object.entries(PERMISSIONS).map(([key, value]) => {
              const hasPermission =
                user?.role === 'superadmin' || user?.role === 'admin' || actualUserPermissions.includes(value);
              return (
                <Col xs={24} sm={12} md={8} key={key}>
                  <div
                    style={{
                      padding: 16,
                      borderRadius: 12,
                      background: hasPermission ? '#f0fdf4' : '#f9fafb',
                      border: `1px solid ${hasPermission ? '#bbf7d0' : '#e5e7eb'}`,
                      opacity: hasPermission ? 1 : 0.7,
                    }}
                  >
                    <Space>
                      {hasPermission ? (
                        <CheckCircleOutlined style={{ color: '#10b981', fontSize: 18 }} />
                      ) : (
                        <LockOutlined style={{ color: '#9ca3af', fontSize: 18 }} />
                      )}
                      <Text strong={hasPermission} style={{ color: hasPermission ? '#047857' : '#6b7280' }}>
                        {key
                          .split('_')
                          .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                          .join(' ')}
                      </Text>
                    </Space>
                  </div>
                </Col>
              );
            })}
          </Row>
        </Card>
      ),
    },
  ];

  return (
    <div style={{ margin: -24 }}>
      {/* Gradient Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '24px 24px 80px 24px',
        marginBottom: -56,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Avatar
              size={64}
              src={avatarUrl}
              icon={<UserOutlined />}
              style={{ 
                border: '3px solid rgba(255,255,255,0.3)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              }}
            />
            <div>
              <Title level={3} style={{ color: '#fff', margin: 0 }}>
                {user?.name || 'Admin User'}
              </Title>
              <Space style={{ marginTop: 4 }}>
                <Tag 
                  color="rgba(255,255,255,0.2)" 
                  style={{ color: '#fff', border: 'none' }}
                >
                  {roleConfig.label}
                </Tag>
                <Text style={{ color: 'rgba(255,255,255,0.8)' }}>
                  {user?.email || 'admin@handwork.com'}
                </Text>
              </Space>
            </div>
          </div>
          <Tooltip title="Edit Profile">
            <Button 
              icon={<EditOutlined />}
              style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff' }}
            >
              Edit
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ padding: '0 24px', marginBottom: 24 }}>
        <Row gutter={16}>
          <Col xs={12} sm={6}>
            <Card 
              size="small" 
              style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              styles={{ body: { padding: 16 } }}
            >
              <Statistic
                title={<Text type="secondary" style={{ fontSize: 12 }}>Permissions</Text>}
                value={userPermissionsCount}
                suffix={`/ ${totalPermissions}`}
                prefix={<SafetyOutlined style={{ color: '#667eea' }} />}
                styles={{ content: { fontSize: 24 } }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card 
              size="small" 
              style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              styles={{ body: { padding: 16 } }}
            >
              <Statistic
                title={<Text type="secondary" style={{ fontSize: 12 }}>Sessions</Text>}
                value={sessions.length}
                prefix={<DesktopOutlined style={{ color: '#3b82f6' }} />}
                styles={{ content: { fontSize: 24 } }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card 
              size="small" 
              style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              styles={{ body: { padding: 16 } }}
            >
              <Statistic
                title={<Text type="secondary" style={{ fontSize: 12 }}>Activities</Text>}
                value={activityLog.length}
                prefix={<HistoryOutlined style={{ color: '#10b981' }} />}
                styles={{ content: { fontSize: 24 } }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card 
              size="small" 
              style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              styles={{ body: { padding: 16 } }}
            >
              <Statistic
                title={<Text type="secondary" style={{ fontSize: 12 }}>2FA Status</Text>}
                value="Disabled"
                prefix={<SecurityScanOutlined style={{ color: '#f59e0b' }} />}
                styles={{ content: { fontSize: 20, color: '#f59e0b' } }}
              />
            </Card>
          </Col>
        </Row>
      </div>

      {/* Main Content */}
      <div style={{ padding: '0 24px 24px' }}>
        <Tabs 
          items={tabItems} 
          type="card"
          style={{ background: '#fff', borderRadius: 16, padding: 16 }}
        />
      </div>

      {/* Change Password Modal */}
      <Modal
        title="Change Password"
        open={changePasswordModal}
        onCancel={() => setChangePasswordModal(false)}
        afterClose={() => passwordForm.resetFields()}
        footer={null}
        destroyOnHidden
      >
        <Form form={passwordForm} layout="vertical" onFinish={handlePasswordChange}>
          <Form.Item
            name="currentPassword"
            label="Current Password"
            rules={[{ required: true, message: 'Please enter current password' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Enter current password" />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label="New Password"
            rules={[
              { required: true, message: 'Please enter new password' },
              { min: 8, message: 'Password must be at least 8 characters' },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Enter new password" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Confirm Password"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Please confirm password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match'));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Confirm new password" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setChangePasswordModal(false)}>Cancel</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={changePasswordMutation.isPending}
              >
                Change Password
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 2FA Setup Modal */}
      <Modal
        title={
          <Space>
            <SecurityScanOutlined style={{ color: '#10b981' }} />
            <span>Set Up Two-Factor Authentication</span>
          </Space>
        }
        open={twoFactorModal}
        onCancel={() => {
          setTwoFactorModal(false);
          setTwoFactorSetupData(null);
          setVerificationCode('');
        }}
        footer={null}
        width={480}
        destroyOnHidden
      >
        {twoFactorSetupData ? (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Paragraph type="secondary">
                Scan this QR code with your authenticator app (like Google Authenticator, Authy, or 1Password)
              </Paragraph>
              <div style={{ 
                display: 'inline-block', 
                padding: 16, 
                background: '#fff', 
                borderRadius: 12,
                border: '1px solid #e5e7eb',
                marginBottom: 16
              }}>
                <img 
                  src={twoFactorSetupData.qrCodeDataUrl} 
                  alt="2FA QR Code" 
                  style={{ width: 200, height: 200 }}
                />
              </div>
            </div>

            <div style={{ 
              background: '#f9fafb', 
              padding: 16, 
              borderRadius: 8,
              marginBottom: 24
            }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Can&apos;t scan? Enter this code manually:
              </Text>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8, 
                marginTop: 8 
              }}>
                <code style={{ 
                  flex: 1, 
                  padding: '8px 12px', 
                  background: '#fff', 
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  fontFamily: 'monospace',
                  fontSize: 14,
                  letterSpacing: 2
                }}>
                  {twoFactorSetupData.secret}
                </code>
                <Tooltip title="Copy to clipboard">
                  <Button 
                    icon={<CopyOutlined />} 
                    onClick={() => {
                      navigator.clipboard.writeText(twoFactorSetupData.secret);
                      message.success('Secret copied to clipboard');
                    }}
                  />
                </Tooltip>
              </div>
            </div>

            <Divider style={{ margin: '16px 0' }} />

            <div>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>
                Enter the 6-digit code from your authenticator app:
              </Text>
              <Input
                size="large"
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                style={{ 
                  textAlign: 'center', 
                  fontSize: 24, 
                  letterSpacing: 8,
                  fontFamily: 'monospace'
                }}
                maxLength={6}
              />
            </div>

            <div style={{ marginTop: 24, textAlign: 'right' }}>
              <Space>
                <Button onClick={() => {
                  setTwoFactorModal(false);
                  setTwoFactorSetupData(null);
                  setVerificationCode('');
                }}>
                  Cancel
                </Button>
                <Button 
                  type="primary"
                  disabled={verificationCode.length !== 6}
                  loading={enableTwoFactorMutation.isPending}
                  onClick={() => enableTwoFactorMutation.mutate(verificationCode)}
                  style={{ background: '#10b981', borderColor: '#10b981' }}
                >
                  Enable 2FA
                </Button>
              </Space>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <LoadingOutlined style={{ fontSize: 32, color: '#10b981' }} />
            <Paragraph style={{ marginTop: 16 }}>Generating your secret key...</Paragraph>
          </div>
        )}
      </Modal>

      {/* 2FA Disable Modal */}
      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: '#ef4444' }} />
            <span>Disable Two-Factor Authentication</span>
          </Space>
        }
        open={twoFactorDisableModal}
        onCancel={() => {
          setTwoFactorDisableModal(false);
          setVerificationCode('');
        }}
        footer={null}
        width={400}
        destroyOnHidden
      >
        <div>
          <Paragraph type="secondary">
            To disable two-factor authentication, please enter the 6-digit code from your authenticator app.
          </Paragraph>
          
          <div style={{ marginTop: 16 }}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>
              Verification Code:
            </Text>
            <Input
              size="large"
              placeholder="000000"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              style={{ 
                textAlign: 'center', 
                fontSize: 24, 
                letterSpacing: 8,
                fontFamily: 'monospace'
              }}
              maxLength={6}
            />
          </div>

          <div style={{ marginTop: 24, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setTwoFactorDisableModal(false);
                setVerificationCode('');
              }}>
                Cancel
              </Button>
              <Button 
                danger
                type="primary"
                disabled={verificationCode.length !== 6}
                loading={disableTwoFactorMutation.isPending}
                onClick={() => disableTwoFactorMutation.mutate(verificationCode)}
              >
                Disable 2FA
              </Button>
            </Space>
          </div>
        </div>
      </Modal>
    </div>
  );
}
