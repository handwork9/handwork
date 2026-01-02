'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Button,
  Table,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  message,
  Statistic,
  Tabs,
  Alert,
  Divider,
  Switch,
  Tooltip,
} from 'antd';
import {
  WhatsAppOutlined,
  SendOutlined,
  UserOutlined,
  TeamOutlined,
  MessageOutlined,
  SettingOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { format } from 'date-fns';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface MessageLog {
  id: string;
  recipient: string;
  recipientName: string;
  type: 'text' | 'template' | 'interactive';
  templateName?: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  createdAt: string;
}

interface Template {
  name: string;
  language: string;
  status: 'approved' | 'pending' | 'rejected';
  category: string;
}

// Mock data
const mockLogs: MessageLog[] = [
  {
    id: '1',
    recipient: '+2348012345678',
    recipientName: 'John Doe',
    type: 'template',
    templateName: 'order_confirmation',
    status: 'delivered',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    recipient: '+2348098765432',
    recipientName: 'Jane Smith',
    type: 'template',
    templateName: 'delivery_update',
    status: 'read',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

const mockTemplates: Template[] = [
  { name: 'order_confirmation', language: 'en', status: 'approved', category: 'TRANSACTIONAL' },
  { name: 'delivery_update', language: 'en', status: 'approved', category: 'TRANSACTIONAL' },
  { name: 'welcome_message', language: 'en', status: 'approved', category: 'MARKETING' },
  { name: 'promotional_offer', language: 'en', status: 'pending', category: 'MARKETING' },
];

export default function WhatsAppIntegrationPage() {
  const [loading, setLoading] = useState(false);
  const [messageLogs, setMessageLogs] = useState<MessageLog[]>(mockLogs);
  const [templates, setTemplates] = useState<Template[]>(mockTemplates);
  const [sendModalVisible, setSendModalVisible] = useState(false);
  const [bulkModalVisible, setBulkModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [bulkForm] = Form.useForm();

  const stats = {
    totalSent: 1250,
    delivered: 1180,
    read: 980,
    failed: 70,
  };

  const handleSendMessage = async (values: any) => {
    setLoading(true);
    try {
      // API call would go here
      // await fetch('/api/v1/integrations/whatsapp/send', { method: 'POST', body: JSON.stringify(values) });
      message.success('Message sent successfully!');
      setSendModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkSend = async (values: any) => {
    setLoading(true);
    try {
      // API call would go here
      message.success(`Bulk message queued for ${values.audience} recipients`);
      setBulkModalVisible(false);
      bulkForm.resetFields();
    } catch (error) {
      message.error('Failed to queue bulk messages');
    } finally {
      setLoading(false);
    }
  };

  const logColumns: ColumnsType<MessageLog> = [
    {
      title: 'Recipient',
      dataIndex: 'recipientName',
      key: 'recipientName',
      render: (name, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{name}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.recipient}</Text>
        </Space>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type, record) => (
        <Space direction="vertical" size={0}>
          <Tag color={type === 'template' ? 'blue' : type === 'interactive' ? 'purple' : 'default'}>
            {type.toUpperCase()}
          </Tag>
          {record.templateName && (
            <Text type="secondary" style={{ fontSize: 12 }}>{record.templateName}</Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors: Record<string, string> = {
          sent: 'processing',
          delivered: 'success',
          read: 'cyan',
          failed: 'error',
        };
        return <Tag color={colors[status]}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Sent At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => format(new Date(date), 'MMM d, yyyy HH:mm'),
    },
  ];

  const templateColumns: ColumnsType<Template> = [
    {
      title: 'Template Name',
      dataIndex: 'name',
      key: 'name',
      render: (name) => <Text code>{name}</Text>,
    },
    {
      title: 'Language',
      dataIndex: 'language',
      key: 'language',
      render: (lang) => lang.toUpperCase(),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (cat) => <Tag>{cat}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors: Record<string, string> = {
          approved: 'success',
          pending: 'warning',
          rejected: 'error',
        };
        return <Tag color={colors[status]}>{status.toUpperCase()}</Tag>;
      },
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 24 }}>
        <Space align="center" style={{ marginBottom: 8 }}>
          <WhatsAppOutlined style={{ fontSize: 32, color: '#25D366' }} />
          <Title level={2} style={{ margin: 0 }}>WhatsApp Business</Title>
        </Space>
        <Paragraph type="secondary">
          Manage WhatsApp Business API integration for customer communication
        </Paragraph>
      </div>

      {/* Configuration Alert */}
      <Alert
        message="Configuration Required"
        description={
          <Space direction="vertical">
            <Text>Ensure these environment variables are set in your backend:</Text>
            <Text code>WHATSAPP_ACCESS_TOKEN</Text>
            <Text code>WHATSAPP_PHONE_NUMBER_ID</Text>
            <Text code>WHATSAPP_BUSINESS_ACCOUNT_ID</Text>
            <Text code>WHATSAPP_WEBHOOK_VERIFY_TOKEN</Text>
          </Space>
        }
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Total Sent"
              value={stats.totalSent}
              prefix={<SendOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Delivered"
              value={stats.delivered}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Read"
              value={stats.read}
              prefix={<MessageOutlined />}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Failed"
              value={stats.failed}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Action Buttons */}
      <Space style={{ marginBottom: 24 }}>
        <Button
          type="primary"
          icon={<SendOutlined />}
          style={{ backgroundColor: '#25D366', borderColor: '#25D366' }}
          onClick={() => setSendModalVisible(true)}
        >
          Send Message
        </Button>
        <Button
          icon={<TeamOutlined />}
          onClick={() => setBulkModalVisible(true)}
        >
          Bulk Campaign
        </Button>
        <Button icon={<ReloadOutlined />} onClick={() => message.info('Refreshing data...')}>
          Refresh
        </Button>
      </Space>

      {/* Tabs for Logs and Templates */}
      <Tabs
        items={[
          {
            key: 'logs',
            label: 'Message Logs',
            children: (
              <Card>
                <Table
                  columns={logColumns}
                  dataSource={messageLogs}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                />
              </Card>
            ),
          },
          {
            key: 'templates',
            label: 'Message Templates',
            children: (
              <Card>
                <Alert
                  message="WhatsApp Message Templates"
                  description="Templates must be approved by Meta before use. Create templates in the Meta Business Suite."
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
                <Table
                  columns={templateColumns}
                  dataSource={templates}
                  rowKey="name"
                  pagination={false}
                />
              </Card>
            ),
          },
          {
            key: 'settings',
            label: 'Settings',
            children: (
              <Card>
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  <div>
                    <Text strong>Webhook URL</Text>
                    <Input
                      value="https://your-api.com/api/v1/integrations/whatsapp/webhook"
                      readOnly
                      addonAfter={
                        <Button
                          type="link"
                          size="small"
                          onClick={() => {
                            navigator.clipboard.writeText('https://your-api.com/api/v1/integrations/whatsapp/webhook');
                            message.success('Copied to clipboard');
                          }}
                        >
                          Copy
                        </Button>
                      }
                    />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Configure this URL in Meta Business Suite webhook settings
                    </Text>
                  </div>

                  <Divider />

                  <div>
                    <Space>
                      <Text strong>Auto-reply to messages</Text>
                      <Switch defaultChecked />
                    </Space>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Automatically respond to incoming messages with support menu
                    </Text>
                  </div>

                  <div>
                    <Space>
                      <Text strong>Order notifications</Text>
                      <Switch defaultChecked />
                    </Space>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Send automatic order and delivery updates via WhatsApp
                    </Text>
                  </div>
                </Space>
              </Card>
            ),
          },
        ]}
      />

      {/* Send Message Modal */}
      <Modal
        title="Send WhatsApp Message"
        open={sendModalVisible}
        onCancel={() => setSendModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSendMessage}>
          <Form.Item
            name="phone"
            label="Phone Number"
            rules={[{ required: true, message: 'Please enter phone number' }]}
          >
            <Input placeholder="+234XXXXXXXXXX" prefix={<UserOutlined />} />
          </Form.Item>

          <Form.Item
            name="type"
            label="Message Type"
            rules={[{ required: true }]}
            initialValue="template"
          >
            <Select>
              <Select.Option value="text">Text Message</Select.Option>
              <Select.Option value="template">Template Message</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prev, curr) => prev.type !== curr.type}
          >
            {({ getFieldValue }) =>
              getFieldValue('type') === 'template' ? (
                <Form.Item
                  name="template"
                  label="Template"
                  rules={[{ required: true }]}
                >
                  <Select placeholder="Select template">
                    {templates
                      .filter((t) => t.status === 'approved')
                      .map((t) => (
                        <Select.Option key={t.name} value={t.name}>
                          {t.name}
                        </Select.Option>
                      ))}
                  </Select>
                </Form.Item>
              ) : (
                <Form.Item
                  name="message"
                  label="Message"
                  rules={[{ required: true }]}
                >
                  <TextArea rows={4} placeholder="Enter your message..." />
                </Form.Item>
              )
            }
          </Form.Item>

          <Form.Item>
            <Space>
              <Button onClick={() => setSendModalVisible(false)}>Cancel</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                style={{ backgroundColor: '#25D366', borderColor: '#25D366' }}
              >
                Send
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Bulk Send Modal */}
      <Modal
        title="Bulk WhatsApp Campaign"
        open={bulkModalVisible}
        onCancel={() => setBulkModalVisible(false)}
        footer={null}
        width={600}
      >
        <Alert
          message="Bulk campaigns require approved templates"
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Form form={bulkForm} layout="vertical" onFinish={handleBulkSend}>
          <Form.Item
            name="audience"
            label="Target Audience"
            rules={[{ required: true }]}
          >
            <Select placeholder="Select audience">
              <Select.Option value="all_users">All Users</Select.Option>
              <Select.Option value="active_users">Active Users (last 30 days)</Select.Option>
              <Select.Option value="inactive_users">Inactive Users</Select.Option>
              <Select.Option value="farmers">Farmers</Select.Option>
              <Select.Option value="premium_users">Premium Subscribers</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="template"
            label="Template"
            rules={[{ required: true }]}
          >
            <Select placeholder="Select template">
              {templates
                .filter((t) => t.status === 'approved')
                .map((t) => (
                  <Select.Option key={t.name} value={t.name}>
                    {t.name} ({t.category})
                  </Select.Option>
                ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button onClick={() => setBulkModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Queue Campaign
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
