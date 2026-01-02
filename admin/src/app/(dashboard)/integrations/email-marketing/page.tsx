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
  Progress,
  DatePicker,
  Switch,
} from 'antd';
import {
  MailOutlined,
  SendOutlined,
  UserOutlined,
  TeamOutlined,
  FileTextOutlined,
  SettingOutlined,
  ReloadOutlined,
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  ScheduleOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { format } from 'date-fns';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface Campaign {
  id: string;
  name: string;
  type: 'newsletter' | 'promotional' | 'abandoned_cart' | 'welcome' | 're_engagement';
  status: 'draft' | 'scheduled' | 'sent' | 'sending';
  recipients: number;
  openRate: number;
  clickRate: number;
  scheduledAt?: string;
  sentAt?: string;
  createdAt: string;
}

interface Subscriber {
  id: string;
  email: string;
  name: string;
  status: 'active' | 'unsubscribed' | 'bounced';
  newsletterOptIn: boolean;
  promotionalOptIn: boolean;
  createdAt: string;
}

// Mock data
const mockCampaigns: Campaign[] = [
  {
    id: '1',
    name: 'Weekly Fresh Deals - Jan 2026',
    type: 'newsletter',
    status: 'sent',
    recipients: 2500,
    openRate: 45.2,
    clickRate: 12.8,
    sentAt: new Date(Date.now() - 86400000).toISOString(),
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: '2',
    name: 'New Year Special Offers',
    type: 'promotional',
    status: 'scheduled',
    recipients: 3200,
    openRate: 0,
    clickRate: 0,
    scheduledAt: new Date(Date.now() + 86400000).toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Abandoned Cart Reminder',
    type: 'abandoned_cart',
    status: 'sending',
    recipients: 150,
    openRate: 38.5,
    clickRate: 22.1,
    createdAt: new Date().toISOString(),
  },
];

const mockSubscribers: Subscriber[] = [
  {
    id: '1',
    email: 'john@example.com',
    name: 'John Doe',
    status: 'active',
    newsletterOptIn: true,
    promotionalOptIn: true,
    createdAt: new Date(Date.now() - 2592000000).toISOString(),
  },
  {
    id: '2',
    email: 'jane@example.com',
    name: 'Jane Smith',
    status: 'active',
    newsletterOptIn: true,
    promotionalOptIn: false,
    createdAt: new Date(Date.now() - 1728000000).toISOString(),
  },
];

export default function EmailMarketingPage() {
  const [loading, setLoading] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>(mockCampaigns);
  const [subscribers, setSubscribers] = useState<Subscriber[]>(mockSubscribers);
  const [campaignModalVisible, setCampaignModalVisible] = useState(false);
  const [form] = Form.useForm();

  const stats = {
    totalSubscribers: 5420,
    activeSubscribers: 4850,
    totalCampaigns: 48,
    avgOpenRate: 42.5,
    avgClickRate: 15.2,
  };

  const handleCreateCampaign = async (values: any) => {
    setLoading(true);
    try {
      message.success('Campaign created successfully!');
      setCampaignModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  const handleSendNow = async (campaignId: string) => {
    Modal.confirm({
      title: 'Send Campaign Now?',
      content: 'This will immediately send the campaign to all recipients.',
      onOk: async () => {
        message.success('Campaign is being sent...');
      },
    });
  };

  const campaignColumns: ColumnsType<Campaign> = [
    {
      title: 'Campaign',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{name}</Text>
          <Tag color={
            record.type === 'newsletter' ? 'blue' :
            record.type === 'promotional' ? 'purple' :
            record.type === 'abandoned_cart' ? 'orange' :
            record.type === 'welcome' ? 'green' : 'cyan'
          }>
            {record.type.replace('_', ' ').toUpperCase()}
          </Tag>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors: Record<string, string> = {
          draft: 'default',
          scheduled: 'processing',
          sending: 'warning',
          sent: 'success',
        };
        return <Tag color={colors[status]}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Recipients',
      dataIndex: 'recipients',
      key: 'recipients',
      render: (val) => val.toLocaleString(),
    },
    {
      title: 'Open Rate',
      dataIndex: 'openRate',
      key: 'openRate',
      render: (rate) => (
        <Space>
          <Progress
            percent={rate}
            size="small"
            style={{ width: 80 }}
            format={() => ''}
          />
          <Text>{rate}%</Text>
        </Space>
      ),
    },
    {
      title: 'Click Rate',
      dataIndex: 'clickRate',
      key: 'clickRate',
      render: (rate) => (
        <Space>
          <Progress
            percent={rate}
            size="small"
            style={{ width: 80 }}
            strokeColor="#52c41a"
            format={() => ''}
          />
          <Text>{rate}%</Text>
        </Space>
      ),
    },
    {
      title: 'Scheduled/Sent',
      key: 'date',
      render: (_, record) => (
        record.sentAt
          ? format(new Date(record.sentAt), 'MMM d, yyyy HH:mm')
          : record.scheduledAt
            ? format(new Date(record.scheduledAt), 'MMM d, yyyy HH:mm')
            : '-'
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} />
          {record.status === 'draft' && (
            <>
              <Button size="small" icon={<EditOutlined />} />
              <Button
                size="small"
                type="primary"
                icon={<SendOutlined />}
                onClick={() => handleSendNow(record.id)}
              >
                Send
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  const subscriberColumns: ColumnsType<Subscriber> = [
    {
      title: 'Subscriber',
      key: 'subscriber',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.name}</Text>
          <Text type="secondary">{record.email}</Text>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors: Record<string, string> = {
          active: 'success',
          unsubscribed: 'default',
          bounced: 'error',
        };
        return <Tag color={colors[status]}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Newsletter',
      dataIndex: 'newsletterOptIn',
      key: 'newsletterOptIn',
      render: (val) => val ? <Tag color="green">Yes</Tag> : <Tag>No</Tag>,
    },
    {
      title: 'Promotional',
      dataIndex: 'promotionalOptIn',
      key: 'promotionalOptIn',
      render: (val) => val ? <Tag color="green">Yes</Tag> : <Tag>No</Tag>,
    },
    {
      title: 'Subscribed',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => format(new Date(date), 'MMM d, yyyy'),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 24 }}>
        <Space align="center" style={{ marginBottom: 8 }}>
          <MailOutlined style={{ fontSize: 32, color: '#1890ff' }} />
          <Title level={2} style={{ margin: 0 }}>Email Marketing</Title>
        </Space>
        <Paragraph type="secondary">
          Manage email campaigns, newsletters, and subscriber lists
        </Paragraph>
      </div>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic
              title="Subscribers"
              value={stats.totalSubscribers}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic
              title="Active"
              value={stats.activeSubscribers}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic
              title="Campaigns"
              value={stats.totalCampaigns}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card>
            <Statistic
              title="Avg Open Rate"
              value={stats.avgOpenRate}
              suffix="%"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card>
            <Statistic
              title="Avg Click Rate"
              value={stats.avgClickRate}
              suffix="%"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Action Buttons */}
      <Space style={{ marginBottom: 24 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setCampaignModalVisible(true)}
        >
          New Campaign
        </Button>
        <Button icon={<ReloadOutlined />} onClick={() => message.info('Refreshing data...')}>
          Refresh
        </Button>
      </Space>

      {/* Tabs */}
      <Tabs
        items={[
          {
            key: 'campaigns',
            label: 'Campaigns',
            children: (
              <Card>
                <Table
                  columns={campaignColumns}
                  dataSource={campaigns}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                />
              </Card>
            ),
          },
          {
            key: 'subscribers',
            label: 'Subscribers',
            children: (
              <Card>
                <Table
                  columns={subscriberColumns}
                  dataSource={subscribers}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                />
              </Card>
            ),
          },
          {
            key: 'automation',
            label: 'Automation',
            children: (
              <Card>
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  <Alert
                    message="Automated Email Campaigns"
                    description="These campaigns run automatically based on triggers and schedules."
                    type="info"
                    showIcon
                  />

                  <Card type="inner" title="Welcome Series" extra={<Switch defaultChecked />}>
                    <Paragraph type="secondary">
                      Automatically send a series of welcome emails to new users over 7 days.
                    </Paragraph>
                    <ul>
                      <li>Day 0: Welcome email with getting started guide</li>
                      <li>Day 2: Feature highlights and tips</li>
                      <li>Day 5: First order discount offer</li>
                      <li>Day 7: Community and support introduction</li>
                    </ul>
                  </Card>

                  <Card type="inner" title="Abandoned Cart Reminders" extra={<Switch defaultChecked />}>
                    <Paragraph type="secondary">
                      Send reminders to users who added items to cart but didn&apos;t complete purchase.
                    </Paragraph>
                    <Text type="secondary">Runs every 4 hours</Text>
                  </Card>

                  <Card type="inner" title="Weekly Deals Newsletter" extra={<Switch defaultChecked />}>
                    <Paragraph type="secondary">
                      Automatically curate and send weekly deals to subscribers.
                    </Paragraph>
                    <Text type="secondary">Sent every Monday at 9:00 AM</Text>
                  </Card>

                  <Card type="inner" title="Re-engagement Campaign" extra={<Switch defaultChecked />}>
                    <Paragraph type="secondary">
                      Reach out to users who haven&apos;t been active in the past 30 days.
                    </Paragraph>
                    <Text type="secondary">Runs every Sunday at 10:00 AM</Text>
                  </Card>
                </Space>
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
                    <Text strong>Sender Name</Text>
                    <Input defaultValue="Handwork Farm" style={{ maxWidth: 400 }} />
                  </div>
                  <div>
                    <Text strong>Sender Email</Text>
                    <Input defaultValue="hello@handwork.farm" style={{ maxWidth: 400 }} />
                  </div>
                  <Divider />
                  <div>
                    <Space>
                      <Text strong>Double Opt-in</Text>
                      <Switch />
                    </Space>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Require subscribers to confirm their email address
                    </Text>
                  </div>
                  <div>
                    <Space>
                      <Text strong>Unsubscribe Link</Text>
                      <Switch defaultChecked disabled />
                    </Space>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Required by law - always included in marketing emails
                    </Text>
                  </div>
                </Space>
              </Card>
            ),
          },
        ]}
      />

      {/* Create Campaign Modal */}
      <Modal
        title="Create Email Campaign"
        open={campaignModalVisible}
        onCancel={() => setCampaignModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateCampaign}>
          <Form.Item
            name="name"
            label="Campaign Name"
            rules={[{ required: true, message: 'Please enter campaign name' }]}
          >
            <Input placeholder="e.g., Weekly Fresh Deals - January 2026" />
          </Form.Item>

          <Form.Item
            name="type"
            label="Campaign Type"
            rules={[{ required: true }]}
          >
            <Select placeholder="Select type">
              <Select.Option value="newsletter">Newsletter</Select.Option>
              <Select.Option value="promotional">Promotional</Select.Option>
              <Select.Option value="announcement">Announcement</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="subject"
            label="Email Subject"
            rules={[{ required: true, message: 'Please enter email subject' }]}
          >
            <Input placeholder="e.g., 🥬 Fresh Deals This Week!" />
          </Form.Item>

          <Form.Item
            name="audience"
            label="Target Audience"
            rules={[{ required: true }]}
          >
            <Select placeholder="Select audience">
              <Select.Option value="all">All Subscribers</Select.Option>
              <Select.Option value="newsletter">Newsletter Opt-in</Select.Option>
              <Select.Option value="promotional">Promotional Opt-in</Select.Option>
              <Select.Option value="active">Active Users (30 days)</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="scheduledAt" label="Schedule (optional)">
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button onClick={() => setCampaignModalVisible(false)}>Cancel</Button>
              <Button htmlType="submit">Save as Draft</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Create & Schedule
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
