'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Card,
  Form,
  Input,
  Button,
  Avatar,
  Upload,
  message,
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
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { useAuthStore, AdminRole, PERMISSIONS } from '@/store/auth';
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

// Mock activity data
const mockActivityLog = [
  { id: '1', action: 'Logged in', timestamp: new Date(Date.now() - 300000), device: 'Chrome on macOS', ip: '192.168.1.1' },
  { id: '2', action: 'Updated order #12345 status', timestamp: new Date(Date.now() - 3600000), device: 'Chrome on macOS', ip: '192.168.1.1' },
  { id: '3', action: 'Approved farmer application', timestamp: new Date(Date.now() - 7200000), device: 'Safari on iPhone', ip: '10.0.0.15' },
  { id: '4', action: 'Exported reports', timestamp: new Date(Date.now() - 86400000), device: 'Chrome on macOS', ip: '192.168.1.1' },
  { id: '5', action: 'Changed notification settings', timestamp: new Date(Date.now() - 172800000), device: 'Chrome on Windows', ip: '192.168.1.2' },
];

// Mock active sessions
const mockSessions = [
  { id: '1', device: 'Chrome on macOS', location: 'Lagos, Nigeria', ip: '192.168.1.1', lastActive: new Date(), current: true },
  { id: '2', device: 'Safari on iPhone', location: 'Lagos, Nigeria', ip: '10.0.0.15', lastActive: new Date(Date.now() - 3600000), current: false },
];

export default function ProfilePage() {
  const { user, setAuth } = useAuthStore();
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [changePasswordModal, setChangePasswordModal] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar);

  // Notification preferences state
  const [notificationPrefs, setNotificationPrefs] = useState({
    emailNotifications: true,
    orderAlerts: true,
    systemUpdates: false,
    marketingEmails: false,
    desktopNotifications: true,
    soundAlerts: true,
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _data: { currentPassword: string; newPassword: string }
    ) => {
      // Simulate API call - _data will be used when connected to real API
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return true;
    },
    onSuccess: () => {
      message.success('Password changed successfully');
      setChangePasswordModal(false);
      passwordForm.resetFields();
    },
    onError: () => {
      message.error('Failed to change password');
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

  // Calculate permission stats
  const totalPermissions = Object.keys(PERMISSIONS).length;
  const userPermissions = user?.permissions?.length || 0;
  const permissionPercentage = Math.round((userPermissions / totalPermissions) * 100);

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
            <Card>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <Upload {...uploadProps}>
                  <Badge
                    count={<CameraOutlined style={{ color: '#fff', fontSize: 12 }} />}
                    offset={[-10, 70]}
                    style={{ backgroundColor: '#1890ff', cursor: 'pointer' }}
                  >
                    <Avatar
                      size={100}
                      src={avatarUrl}
                      icon={<UserOutlined />}
                      style={{ cursor: 'pointer' }}
                    />
                  </Badge>
                </Upload>
                <Title level={4} style={{ marginTop: 16, marginBottom: 4 }}>
                  {user?.name || 'Admin User'}
                </Title>
                <Tag color={roleConfig.color}>{roleConfig.label}</Tag>
                <Paragraph type="secondary" style={{ marginTop: 8, fontSize: 12 }}>
                  {roleConfig.description}
                </Paragraph>
              </div>

              <Divider />

              <Descriptions column={1} size="small">
                <Descriptions.Item label="Email">
                  <Space>
                    <MailOutlined />
                    {user?.email || 'admin@handwork.com'}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="Role">
                  <Tag color={roleConfig.color}>{roleConfig.label}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Member Since">
                  <Space>
                    <ClockCircleOutlined />
                    Jan 2024
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Badge status="success" text="Active" />
                </Descriptions.Item>
              </Descriptions>

              <Divider />

              <div style={{ marginBottom: 16 }}>
                <Text strong>Access Level</Text>
                <Progress
                  percent={permissionPercentage}
                  size="small"
                  strokeColor={roleConfig.color}
                  style={{ marginTop: 8 }}
                />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {userPermissions} of {totalPermissions} permissions
                </Text>
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={16}>
            <Card title="Edit Profile" extra={<EditOutlined />}>
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

            <Card title="Security" style={{ marginTop: 16 }}>
              <Row gutter={24}>
                <Col span={12}>
                  <Card
                    type="inner"
                    title={
                      <Space>
                        <LockOutlined />
                        Password
                      </Space>
                    }
                  >
                    <Paragraph type="secondary">
                      Last changed 30 days ago. We recommend changing your password regularly.
                    </Paragraph>
                    <Button
                      type="primary"
                      icon={<KeyOutlined />}
                      onClick={() => setChangePasswordModal(true)}
                    >
                      Change Password
                    </Button>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card
                    type="inner"
                    title={
                      <Space>
                        <SecurityScanOutlined />
                        Two-Factor Auth
                      </Space>
                    }
                  >
                    <Paragraph type="secondary">
                      Add an extra layer of security to your account.
                    </Paragraph>
                    <Button icon={<SecurityScanOutlined />}>Enable 2FA</Button>
                  </Card>
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
            <Card title="Email Notifications">
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
            <Card title="Push Notifications">
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

            <Card title="Notification Summary" style={{ marginTop: 16 }}>
              <Row gutter={16}>
                <Col span={8}>
                  <Statistic
                    title="Today"
                    value={12}
                    prefix={<BellOutlined />}
                    styles={{ content: { color: '#1890ff' } }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="This Week"
                    value={48}
                    prefix={<BellOutlined />}
                    styles={{ content: { color: '#52c41a' } }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Unread"
                    value={5}
                    prefix={<BellOutlined />}
                    styles={{ content: { color: '#faad14' } }}
                  />
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
            <Card title="Recent Activity">
              <Timeline
                items={mockActivityLog.map((activity) => ({
                  dot: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
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
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card title="Active Sessions">
              {mockSessions.map((session, index) => (
                <div key={session.id}>
                  <Flex gap={12} align="flex-start" style={{ padding: '12px 0' }}>
                    {session.device.includes('iPhone') || session.device.includes('Android') ? (
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
                          <Button type="link" danger size="small">
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
                  {index < mockSessions.length - 1 && <Divider style={{ margin: 0 }} />}
                </div>
              ))}
              <Button type="link" danger style={{ marginTop: 16 }}>
                Sign out all other sessions
              </Button>
            </Card>

            <Card title="Login Stats" style={{ marginTop: 16 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic title="Total Logins" value={156} />
                </Col>
                <Col span={12}>
                  <Statistic title="This Month" value={23} />
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
        <Card title="Your Permissions">
          <Paragraph type="secondary" style={{ marginBottom: 24 }}>
            These permissions are assigned based on your role ({roleConfig.label}). Contact a super
            admin if you need additional access.
          </Paragraph>

          <Row gutter={[16, 16]}>
            {Object.entries(PERMISSIONS).map(([key, value]) => {
              const hasPermission =
                user?.role === 'superadmin' || user?.permissions?.includes(value);
              return (
                <Col xs={24} sm={12} md={8} key={key}>
                  <Card
                    size="small"
                    style={{
                      borderColor: hasPermission ? '#52c41a' : '#d9d9d9',
                      opacity: hasPermission ? 1 : 0.6,
                    }}
                  >
                    <Space>
                      {hasPermission ? (
                        <CheckCircleOutlined style={{ color: '#52c41a' }} />
                      ) : (
                        <LockOutlined style={{ color: '#d9d9d9' }} />
                      )}
                      <Text strong={hasPermission}>
                        {key
                          .split('_')
                          .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                          .join(' ')}
                      </Text>
                    </Space>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </Card>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>My Profile</Title>
        <Text type="secondary">Manage your account settings and preferences</Text>
      </div>

      <Tabs items={tabItems} />

      {/* Change Password Modal */}
      <Modal
        title="Change Password"
        open={changePasswordModal}
        onCancel={() => {
          setChangePasswordModal(false);
          passwordForm.resetFields();
        }}
        footer={null}
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
    </div>
  );
}
