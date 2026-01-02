'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  Form,
  Input,
  InputNumber,
  Switch,
  Button,
  Space,
  Typography,
  Tabs,
  Divider,
  message,
  Row,
  Col,
  Select,
  TimePicker,
  Spin,
  Alert,
  Tooltip,
} from 'antd';
import {
  SettingOutlined,
  DollarOutlined,
  BellOutlined,
  SafetyOutlined,
  GlobalOutlined,
  SaveOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { adminApi } from '@/lib/api';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface AppSettings {
  // General Settings
  appName: string;
  supportEmail: string;
  supportPhone: string;
  currency: string;
  timezone: string;
  
  // Business Settings
  commissionRate: number;
  riderCommissionRate: number;
  serviceFeeRate: number;
  minOrderAmount: number;
  maxOrderAmount: number;
  defaultDeliveryFee: number;
  freeDeliveryThreshold: number;
  
  // Notification Settings
  enableEmailNotifications: boolean;
  enableSmsNotifications: boolean;
  enablePushNotifications: boolean;
  orderNotificationEmails: string;
  
  // Security Settings
  maxLoginAttempts: number;
  sessionTimeout: number;
  requireEmailVerification: boolean;
  require2FA: boolean;
  
  // Operational Settings
  operatingHoursStart: string;
  operatingHoursEnd: string;
  enableMaintenanceMode: boolean;
  maintenanceMessage: string;
  allowNewRegistrations: boolean;
}

// Mock default settings (replace with actual API)
const defaultSettings: AppSettings = {
  appName: 'Handwork Marketplace',
  supportEmail: 'support@handwork.com',
  supportPhone: '+234 706 210 3875',
  currency: 'NGN',
  timezone: 'Africa/Lagos',
  
  commissionRate: 10,
  riderCommissionRate: 15,
  serviceFeeRate: 2,
  minOrderAmount: 500,
  maxOrderAmount: 1000000,
  defaultDeliveryFee: 500,
  freeDeliveryThreshold: 10000,
  
  enableEmailNotifications: true,
  enableSmsNotifications: true,
  enablePushNotifications: true,
  orderNotificationEmails: 'orders@handwork.com',
  
  maxLoginAttempts: 5,
  sessionTimeout: 30,
  requireEmailVerification: true,
  require2FA: false,
  
  operatingHoursStart: '08:00',
  operatingHoursEnd: '22:00',
  enableMaintenanceMode: false,
  maintenanceMessage: 'We are currently performing scheduled maintenance. Please check back soon.',
  allowNewRegistrations: true,
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [generalForm] = Form.useForm();
  const [businessForm] = Form.useForm();
  const [notificationForm] = Form.useForm();
  const [securityForm] = Form.useForm();
  const [operationalForm] = Form.useForm();
  const queryClient = useQueryClient();

  // Fetch settings from API
  const { data: settings, isLoading } = useQuery({
    queryKey: ['adminSettings'],
    queryFn: async () => {
      try {
        const response = await adminApi.getSettings();
        return response.data || defaultSettings;
      } catch (error) {
        console.error('Failed to fetch settings:', error);
        return defaultSettings;
      }
    },
  });

  // Update settings mutation
  const updateMutation = useMutation({
    mutationFn: async ({ category, data }: { category: string; data: Partial<AppSettings> }) => {
      return adminApi.updateSettings(category, data);
    },
    onSuccess: () => {
      message.success('Settings saved successfully');
      queryClient.invalidateQueries({ queryKey: ['adminSettings'] });
    },
    onError: (error) => {
      console.error('Failed to save settings:', error);
      message.error('Failed to save settings');
    },
  });

  const handleSaveGeneral = (values: Partial<AppSettings>) => {
    updateMutation.mutate({ category: 'general', data: values });
  };

  const handleSaveBusiness = (values: Partial<AppSettings>) => {
    updateMutation.mutate({ category: 'business', data: values });
  };

  const handleSaveNotification = (values: Partial<AppSettings>) => {
    updateMutation.mutate({ category: 'notifications', data: values });
  };

  const handleSaveSecurity = (values: Partial<AppSettings>) => {
    updateMutation.mutate({ category: 'security', data: values });
  };

  const handleSaveOperational = (values: Partial<AppSettings>) => {
    const data = {
      ...values,
      operatingHoursStart: values.operatingHoursStart ? dayjs(values.operatingHoursStart).format('HH:mm') : undefined,
      operatingHoursEnd: values.operatingHoursEnd ? dayjs(values.operatingHoursEnd).format('HH:mm') : undefined,
    };
    updateMutation.mutate({ category: 'operational', data });
  };

  if (isLoading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  const tabItems = [
    {
      key: 'general',
      label: (
        <span>
          <GlobalOutlined />
          General
        </span>
      ),
      children: (
        <div style={{ padding: 24 }}>
          <div style={{ marginBottom: 24 }}>
            <Title level={4} style={{ margin: 0 }}>
              <GlobalOutlined style={{ marginRight: 8, color: '#6366f1' }} />
              General Settings
            </Title>
            <Text type="secondary">Basic application configuration</Text>
          </div>
          <Form
            form={generalForm}
            layout="vertical"
            initialValues={settings}
            onFinish={handleSaveGeneral}
          >
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  name="appName"
                  label="Application Name"
                  rules={[{ required: true, message: 'Please enter app name' }]}
                >
                  <Input placeholder="Enter application name" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="currency"
                  label="Currency"
                  rules={[{ required: true }]}
                >
                  <Select>
                    <Select.Option value="NGN">NGN - Nigerian Naira</Select.Option>
                    <Select.Option value="USD">USD - US Dollar</Select.Option>
                    <Select.Option value="GBP">GBP - British Pound</Select.Option>
                    <Select.Option value="EUR">EUR - Euro</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  name="supportEmail"
                  label="Support Email"
                  rules={[{ required: true, type: 'email' }]}
                >
                  <Input placeholder="support@example.com" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="supportPhone"
                  label="Support Phone"
                  rules={[{ required: true }]}
                >
                  <Input placeholder="+234 706 210 3875" />
                </Form.Item>
              </Col>
            </Row>
            
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  name="timezone"
                  label="Timezone"
                  rules={[{ required: true }]}
                >
                  <Select>
                    <Select.Option value="Africa/Lagos">Africa/Lagos (WAT)</Select.Option>
                    <Select.Option value="UTC">UTC</Select.Option>
                    <Select.Option value="Europe/London">Europe/London (GMT)</Select.Option>
                    <Select.Option value="America/New_York">America/New_York (EST)</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            
            <Divider />
            
            <Form.Item>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={updateMutation.isPending}>
                Save General Settings
              </Button>
            </Form.Item>
          </Form>
        </div>
      ),
    },
    {
      key: 'business',
      label: (
        <span>
          <DollarOutlined />
          Business
        </span>
      ),
      children: (
        <div style={{ padding: 24 }}>
          <div style={{ marginBottom: 24 }}>
            <Title level={4} style={{ margin: 0 }}>
              <DollarOutlined style={{ marginRight: 8, color: '#10b981' }} />
              Business Settings
            </Title>
            <Text type="secondary">Configure commission rates and fees</Text>
          </div>
          <Form
            form={businessForm}
            layout="vertical"
            initialValues={settings}
            onFinish={handleSaveBusiness}
          >
            <Card 
              size="small" 
              title={<Text strong>Commission & Fees</Text>}
              style={{ marginBottom: 24, borderRadius: 12 }}
              styles={{ body: { padding: 16 } }}
            >
              <Paragraph type="secondary" style={{ marginBottom: 16 }}>
                Configure platform commission rates and fees. These rates determine how much the platform earns from each transaction.
              </Paragraph>
              
              <Row gutter={24}>
                <Col span={8}>
                  <Form.Item
                    name="commissionRate"
                    label="Farmer Commission Rate"
                    tooltip="Percentage deducted from farmer sales"
                    rules={[{ required: true }]}
                  >
                  <Space.Compact style={{ width: '100%' }}>
                    <InputNumber
                      min={0}
                      max={100}
                      style={{ width: '100%' }}
                    />
                    <Button disabled>%</Button>
                  </Space.Compact>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="riderCommissionRate"
                  label="Rider Commission Rate"
                  tooltip="Percentage deducted from rider delivery fees"
                  rules={[{ required: true }]}
                >
                  <Space.Compact style={{ width: '100%' }}>
                    <InputNumber
                      min={0}
                      max={100}
                      style={{ width: '100%' }}
                    />
                    <Button disabled>%</Button>
                  </Space.Compact>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="serviceFeeRate"
                  label="Service Fee Rate"
                  tooltip="Percentage charged as service fee on each order"
                  rules={[{ required: true }]}
                >
                  <Space.Compact style={{ width: '100%' }}>
                    <InputNumber
                      min={0}
                      max={100}
                      style={{ width: '100%' }}
                    />
                    <Button disabled>%</Button>
                  </Space.Compact>
                </Form.Item>
              </Col>
            </Row>
            
            <Row gutter={24}>
              <Col span={8}>
                <Form.Item
                  name="defaultDeliveryFee"
                  label="Default Delivery Fee"
                  rules={[{ required: true }]}
                >
                  <InputNumber
                    min={0}
                    style={{ width: '100%' }}
                    formatter={(value) => `₦ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="freeDeliveryThreshold"
                  label="Free Delivery Threshold"
                  rules={[{ required: true }]}
                >
                  <InputNumber
                    min={0}
                    style={{ width: '100%' }}
                    formatter={(value) => `₦ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  />
                </Form.Item>
              </Col>
            </Row>
            </Card>
            
            <Card 
              size="small" 
              title={<Text strong>Order Limits</Text>}
              style={{ marginBottom: 24, borderRadius: 12 }}
              styles={{ body: { padding: 16 } }}
            >
            <Paragraph type="secondary" style={{ marginBottom: 16 }}>
              Set minimum and maximum order amounts
            </Paragraph>
            
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  name="minOrderAmount"
                  label="Minimum Order Amount"
                  rules={[{ required: true }]}
                >
                  <InputNumber
                    min={0}
                    style={{ width: '100%' }}
                    formatter={(value) => `₦ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="maxOrderAmount"
                  label="Maximum Order Amount"
                  rules={[{ required: true }]}
                >
                  <InputNumber
                    min={0}
                    style={{ width: '100%' }}
                    formatter={(value) => `₦ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  />
                </Form.Item>
              </Col>
            </Row>
            </Card>
            
            <Form.Item>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={updateMutation.isPending}>
                Save Business Settings
              </Button>
            </Form.Item>
          </Form>
        </div>
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
        <div style={{ padding: 24 }}>
          <div style={{ marginBottom: 24 }}>
            <Title level={4} style={{ margin: 0 }}>
              <BellOutlined style={{ marginRight: 8, color: '#f59e0b' }} />
              Notification Settings
            </Title>
            <Text type="secondary">Configure notification channels and preferences</Text>
          </div>
          <Form
            form={notificationForm}
            layout="vertical"
            initialValues={settings}
            onFinish={handleSaveNotification}
          >
            <Card 
              size="small" 
              title={<Text strong>Notification Channels</Text>}
              style={{ marginBottom: 24, borderRadius: 12 }}
              styles={{ body: { padding: 16 } }}
            >
            <Paragraph type="secondary" style={{ marginBottom: 16 }}>
              Enable or disable notification channels
            </Paragraph>
            
            <Row gutter={24}>
              <Col span={8}>
                <Form.Item
                  name="enableEmailNotifications"
                  label="Email Notifications"
                  valuePropName="checked"
                >
                  <Switch checkedChildren="On" unCheckedChildren="Off" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="enableSmsNotifications"
                  label="SMS Notifications"
                  valuePropName="checked"
                >
                  <Switch checkedChildren="On" unCheckedChildren="Off" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="enablePushNotifications"
                  label="Push Notifications"
                  valuePropName="checked"
                >
                  <Switch checkedChildren="On" unCheckedChildren="Off" />
                </Form.Item>
              </Col>
            </Row>
            </Card>
            
            <Card 
              size="small" 
              title={<Text strong>Admin Notifications</Text>}
              style={{ marginBottom: 24, borderRadius: 12 }}
              styles={{ body: { padding: 16 } }}
            >
            <Paragraph type="secondary" style={{ marginBottom: 16 }}>
              Configure where admin notifications are sent
            </Paragraph>
            
            <Row gutter={24}>
              <Col span={24}>
                <Form.Item
                  name="orderNotificationEmails"
                  label="Order Notification Emails"
                  extra="Comma-separated list of emails to receive order notifications"
                >
                  <Input placeholder="admin@example.com, orders@example.com" />
                </Form.Item>
              </Col>
            </Row>
            </Card>
            
            <Form.Item>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={updateMutation.isPending}>
                Save Notification Settings
              </Button>
            </Form.Item>
          </Form>
        </div>
      ),
    },
    {
      key: 'security',
      label: (
        <span>
          <SafetyOutlined />
          Security
        </span>
      ),
      children: (
        <div style={{ padding: 24 }}>
          <div style={{ marginBottom: 24 }}>
            <Title level={4} style={{ margin: 0 }}>
              <SafetyOutlined style={{ marginRight: 8, color: '#ef4444' }} />
              Security Settings
            </Title>
            <Text type="secondary">Configure authentication and security options</Text>
          </div>
          <Form
            form={securityForm}
            layout="vertical"
            initialValues={settings}
            onFinish={handleSaveSecurity}
          >
            <Card 
              size="small" 
              title={<Text strong>Login Security</Text>}
              style={{ marginBottom: 24, borderRadius: 12 }}
              styles={{ body: { padding: 16 } }}
            >
            <Paragraph type="secondary" style={{ marginBottom: 16 }}>
              Configure security settings for user authentication
            </Paragraph>
            
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  name="maxLoginAttempts"
                  label="Max Login Attempts"
                  extra="Number of failed attempts before account lockout"
                >
                  <InputNumber min={1} max={10} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="sessionTimeout"
                  label="Session Timeout (minutes)"
                  extra="Auto logout after inactivity"
                >
                  <InputNumber min={5} max={480} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
            </Card>
            
            <Card 
              size="small" 
              title={<Text strong>Verification & 2FA</Text>}
              style={{ marginBottom: 24, borderRadius: 12 }}
              styles={{ body: { padding: 16 } }}
            >
            <Paragraph type="secondary" style={{ marginBottom: 16 }}>
              Additional security measures
            </Paragraph>
            
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  name="requireEmailVerification"
                  label="Require Email Verification"
                  valuePropName="checked"
                >
                  <Switch checkedChildren="Yes" unCheckedChildren="No" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="require2FA"
                  label="Require Two-Factor Authentication"
                  valuePropName="checked"
                >
                  <Switch checkedChildren="Yes" unCheckedChildren="No" />
                </Form.Item>
              </Col>
            </Row>
            </Card>
            
            <Form.Item>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={updateMutation.isPending}>
                Save Security Settings
              </Button>
            </Form.Item>
          </Form>
        </div>
      ),
    },
    {
      key: 'operational',
      label: (
        <span>
          <ClockCircleOutlined />
          Operational
        </span>
      ),
      children: (
        <div style={{ padding: 24 }}>
          <div style={{ marginBottom: 24 }}>
            <Title level={4} style={{ margin: 0 }}>
              <ClockCircleOutlined style={{ marginRight: 8, color: '#8b5cf6' }} />
              Operational Settings
            </Title>
            <Text type="secondary">Configure operating hours and platform status</Text>
          </div>
          <Form
            form={operationalForm}
            layout="vertical"
            initialValues={{
              ...settings,
              operatingHoursStart: settings?.operatingHoursStart ? dayjs(settings.operatingHoursStart, 'HH:mm') : undefined,
              operatingHoursEnd: settings?.operatingHoursEnd ? dayjs(settings.operatingHoursEnd, 'HH:mm') : undefined,
            }}
            onFinish={handleSaveOperational}
          >
            <Card 
              size="small" 
              title={<Text strong>Operating Hours</Text>}
              style={{ marginBottom: 24, borderRadius: 12 }}
              styles={{ body: { padding: 16 } }}
            >
            <Paragraph type="secondary" style={{ marginBottom: 16 }}>
              Set the platform operating hours
            </Paragraph>
            
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  name="operatingHoursStart"
                  label="Opening Time"
                >
                  <TimePicker format="HH:mm" style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="operatingHoursEnd"
                  label="Closing Time"
                >
                  <TimePicker format="HH:mm" style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
            </Card>
            
            <Card 
              size="small" 
              title={<Text strong>Platform Status</Text>}
              style={{ marginBottom: 24, borderRadius: 12 }}
              styles={{ body: { padding: 16 } }}
            >
            <Paragraph type="secondary" style={{ marginBottom: 16 }}>
              Control platform availability
            </Paragraph>
            
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  name="allowNewRegistrations"
                  label="Allow New Registrations"
                  valuePropName="checked"
                >
                  <Switch checkedChildren="Yes" unCheckedChildren="No" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="enableMaintenanceMode"
                  label="Maintenance Mode"
                  valuePropName="checked"
                >
                  <Switch checkedChildren="On" unCheckedChildren="Off" />
                </Form.Item>
              </Col>
            </Row>
            
            <Form.Item
              name="maintenanceMessage"
              label="Maintenance Message"
              extra="Message shown to users during maintenance"
            >
              <TextArea rows={3} placeholder="Enter maintenance message" />
            </Form.Item>

            {settings?.enableMaintenanceMode && (
              <Alert
                type="warning"
                title="Maintenance Mode Active"
                description="The platform is currently in maintenance mode. Users cannot access the application."
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}
            </Card>
            
            <Form.Item>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={updateMutation.isPending}>
                Save Operational Settings
              </Button>
            </Form.Item>
          </Form>
        </div>
      ),
    },
  ];

  return (
    <div style={{ margin: -24 }}>
      {/* Gradient Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        padding: '24px 24px 80px 24px',
        marginBottom: -56,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ 
              width: 48, 
              height: 48, 
              borderRadius: 12, 
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <SettingOutlined style={{ fontSize: 24, color: '#fff' }} />
            </div>
            <div>
              <Title level={3} style={{ color: '#fff', margin: 0 }}>Settings</Title>
              <Text style={{ color: 'rgba(255,255,255,0.8)' }}>Configure application settings and preferences</Text>
            </div>
          </div>
          <Tooltip title="Reset all forms">
            <Button 
              icon={<ReloadOutlined />} 
              style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff' }}
              onClick={() => {
                generalForm.resetFields();
                businessForm.resetFields();
                notificationForm.resetFields();
                securityForm.resetFields();
                operationalForm.resetFields();
              }}
            >
              Reset All
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ padding: '0 24px 24px' }}>
        <Card 
          style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          styles={{ body: { padding: 0 } }}
        >
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            tabPosition="left"
            style={{ minHeight: 600 }}
            destroyInactiveTabPane={false}
          />
        </Card>
      </div>
    </div>
  );
}
