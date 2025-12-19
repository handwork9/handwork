'use client';

import { useState } from 'react';
import {
  Card,
  Typography,
  Form,
  Input,
  Select,
  Button,
  Space,
  Table,
  Tag,
  Tabs,
  Modal,
  message,
  Avatar,
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  SendOutlined,
  BellOutlined,
  TeamOutlined,
  HistoryOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'promo';
  targetAudience: 'all' | 'buyers' | 'farmers' | 'riders';
  targetCount: number;
  sentCount: number;
  readCount: number;
  createdAt: string;
  createdBy: string;
}

interface NotificationForm {
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'promo';
  targetAudience: 'all' | 'buyers' | 'farmers' | 'riders';
}

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [previewModal, setPreviewModal] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Fetch notification history
  const { data: notificationsData, isLoading, refetch } = useQuery({
    queryKey: ['admin-notifications', page, pageSize],
    queryFn: async () => {
      const response = await adminApi.getNotificationHistory({ page, limit: pageSize });
      return response.data.data;
    },
  });

  // Send notification mutation
  const sendMutation = useMutation({
    mutationFn: (data: NotificationForm) =>
      adminApi.sendBroadcastNotification(data),
    onSuccess: () => {
      message.success('Notification sent successfully');
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      message.error(error.response?.data?.message || 'Failed to send notification');
    },
  });

  const handleSend = () => {
    form.validateFields().then((values) => {
      Modal.confirm({
        title: 'Confirm Send',
        content: (
          <div>
            <p>You are about to send a notification to:</p>
            <Tag color="blue">{values.targetAudience.toUpperCase()}</Tag>
            <p style={{ marginTop: 16 }}>
              <strong>Title:</strong> {values.title}
            </p>
            <p>
              <strong>Message:</strong> {values.message}
            </p>
          </div>
        ),
        okText: 'Send Now',
        onOk: () => {
          sendMutation.mutate(values);
        },
      });
    });
  };

  const handlePreview = () => {
    form.validateFields().then(() => {
      setPreviewModal(true);
    });
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      info: 'blue',
      warning: 'orange',
      success: 'green',
      promo: 'purple',
    };
    return colors[type] || 'default';
  };

  const getAudienceColor = (audience: string) => {
    const colors: Record<string, string> = {
      all: 'geekblue',
      buyers: 'cyan',
      farmers: 'green',
      riders: 'purple',
    };
    return colors[audience] || 'default';
  };

  // Mock data for development
  const mockNotifications: Notification[] = [
    {
      id: '1',
      title: 'Weekend Discount!',
      message: 'Enjoy 20% off on all deliveries this weekend!',
      type: 'promo',
      targetAudience: 'all',
      targetCount: 5000,
      sentCount: 4850,
      readCount: 2340,
      createdAt: new Date().toISOString(),
      createdBy: 'Admin User',
    },
    {
      id: '2',
      title: 'System Maintenance',
      message: 'Scheduled maintenance on Sunday 2am-4am. Services may be unavailable.',
      type: 'warning',
      targetAudience: 'all',
      targetCount: 5000,
      sentCount: 5000,
      readCount: 4120,
      createdAt: '2024-12-14T10:00:00.000Z',
      createdBy: 'Admin User',
    },
    {
      id: '3',
      title: 'New Payment Method',
      message: 'Bank transfer payments are now available for all orders!',
      type: 'info',
      targetAudience: 'buyers',
      targetCount: 3200,
      sentCount: 3200,
      readCount: 1890,
      createdAt: '2024-12-13T10:00:00.000Z',
      createdBy: 'Admin User',
    },
  ];

  const notifications = notificationsData?.items || mockNotifications;
  const total = notificationsData?.total || mockNotifications.length;

  const columns: ColumnsType<Notification> = [
    {
      title: 'Notification',
      key: 'notification',
      render: (_, record) => (
        <div>
          <Space>
            <Tag color={getTypeColor(record.type)}>{record.type.toUpperCase()}</Tag>
            <Text strong>{record.title}</Text>
          </Space>
          <br />
          <Text type="secondary" ellipsis style={{ maxWidth: 400 }}>
            {record.message}
          </Text>
        </div>
      ),
    },
    {
      title: 'Audience',
      dataIndex: 'targetAudience',
      key: 'targetAudience',
      render: (audience: string) => (
        <Tag color={getAudienceColor(audience)}>{audience.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Sent',
      key: 'sent',
      render: (_, record) => (
        <div>
          <Text>{record.sentCount.toLocaleString()}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            of {record.targetCount.toLocaleString()}
          </Text>
        </div>
      ),
    },
    {
      title: 'Read',
      key: 'read',
      render: (_, record) => (
        <div>
          <Text>{record.readCount.toLocaleString()}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {Math.round((record.readCount / record.sentCount) * 100)}%
          </Text>
        </div>
      ),
    },
    {
      title: 'Sent At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('MMM DD, YYYY HH:mm'),
    },
    {
      title: 'Sent By',
      dataIndex: 'createdBy',
      key: 'createdBy',
    },
  ];

  const formValues = form.getFieldsValue();

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <div>
          <Title level={2} style={{ margin: 0 }}>
            Notifications
          </Title>
          <Text type="secondary">Send broadcast notifications to users</Text>
        </div>
      </div>

      {/* Stats */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Sent (30 days)"
              value={12500}
              prefix={<SendOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Read"
              value={8320}
              styles={{ content: { color: '#10b981' } }}
              prefix={<BellOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Read Rate"
              value={66.5}
              suffix="%"
              precision={1}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Active Users"
              value={5000}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Tabs
        defaultActiveKey="compose"
        destroyOnHidden={false}
        items={[
          {
            key: 'compose',
            label: (
              <span>
                <SendOutlined />
                Compose
              </span>
            ),
            children: (
              <Row gutter={24}>
                <Col xs={24} lg={14}>
                  <Card title="New Notification">
                    <Form
                      form={form}
                      layout="vertical"
                      initialValues={{
                        type: 'info',
                        targetAudience: 'all',
                      }}
                    >
                      <Form.Item
                        name="type"
                        label="Notification Type"
                        rules={[{ required: true }]}
                      >
                        <Select
                          options={[
                            { value: 'info', label: '📢 Info' },
                            { value: 'success', label: '✅ Success' },
                            { value: 'warning', label: '⚠️ Warning' },
                            { value: 'promo', label: '🎉 Promotion' },
                          ]}
                        />
                      </Form.Item>

                      <Form.Item
                        name="targetAudience"
                        label="Target Audience"
                        rules={[{ required: true }]}
                      >
                        <Select
                          options={[
                            { value: 'all', label: 'All Users' },
                            { value: 'buyers', label: 'Buyers Only' },
                            { value: 'farmers', label: 'Farmers Only' },
                            { value: 'riders', label: 'Riders Only' },
                          ]}
                        />
                      </Form.Item>

                      <Form.Item
                        name="title"
                        label="Title"
                        rules={[
                          { required: true, message: 'Please enter a title' },
                          { max: 50, message: 'Title must be 50 characters or less' },
                        ]}
                      >
                        <Input placeholder="Enter notification title" maxLength={50} showCount />
                      </Form.Item>

                      <Form.Item
                        name="message"
                        label="Message"
                        rules={[
                          { required: true, message: 'Please enter a message' },
                          { max: 200, message: 'Message must be 200 characters or less' },
                        ]}
                      >
                        <Input.TextArea
                          rows={4}
                          placeholder="Enter notification message"
                          maxLength={200}
                          showCount
                        />
                      </Form.Item>

                      <Form.Item>
                        <Space>
                          <Button onClick={handlePreview}>Preview</Button>
                          <Button
                            type="primary"
                            icon={<SendOutlined />}
                            onClick={handleSend}
                            loading={sendMutation.isPending}
                          >
                            Send Notification
                          </Button>
                        </Space>
                      </Form.Item>
                    </Form>
                  </Card>
                </Col>

                <Col xs={24} lg={10}>
                  <Card title="Preview">
                    <div
                      style={{
                        background: '#f5f5f5',
                        borderRadius: 12,
                        padding: 16,
                        maxWidth: 320,
                        margin: '0 auto',
                      }}
                    >
                      <div
                        style={{
                          background: 'white',
                          borderRadius: 8,
                          padding: 12,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        }}
                      >
                        <Space align="start">
                          <Avatar
                            size={40}
                            style={{ background: '#4f46e5' }}
                            icon={<BellOutlined />}
                          />
                          <div style={{ flex: 1 }}>
                            <Text strong style={{ display: 'block' }}>
                              {formValues?.title || 'Notification Title'}
                            </Text>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {formValues?.message || 'Your notification message will appear here...'}
                            </Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              Just now
                            </Text>
                          </div>
                        </Space>
                      </div>
                    </div>

                    <div style={{ marginTop: 24 }}>
                      <Text type="secondary">
                        This notification will be sent to{' '}
                        <Tag color={getAudienceColor(formValues?.targetAudience || 'all')}>
                          {(formValues?.targetAudience || 'all').toUpperCase()}
                        </Tag>
                        users as a{' '}
                        <Tag color={getTypeColor(formValues?.type || 'info')}>
                          {(formValues?.type || 'info').toUpperCase()}
                        </Tag>
                        notification.
                      </Text>
                    </div>
                  </Card>

                  <Card title="Quick Templates" style={{ marginTop: 16 }}>
                    <Space orientation="vertical" style={{ width: '100%' }}>
                      <Button
                        block
                        onClick={() => {
                          form.setFieldsValue({
                            type: 'promo',
                            title: 'Weekend Special!',
                            message: 'Enjoy 20% off on all deliveries this weekend. Use code WEEKEND20.',
                          });
                        }}
                      >
                        🎉 Weekend Promo
                      </Button>
                      <Button
                        block
                        onClick={() => {
                          form.setFieldsValue({
                            type: 'warning',
                            title: 'Scheduled Maintenance',
                            message: 'Our services will be temporarily unavailable for scheduled maintenance.',
                          });
                        }}
                      >
                        ⚠️ Maintenance Notice
                      </Button>
                      <Button
                        block
                        onClick={() => {
                          form.setFieldsValue({
                            type: 'info',
                            title: 'New Feature Available',
                            message: 'Check out our latest feature update! We\'ve added new functionality.',
                          });
                        }}
                      >
                        📢 Feature Announcement
                      </Button>
                    </Space>
                  </Card>
                </Col>
              </Row>
            ),
          },
          {
            key: 'history',
            label: (
              <span>
                <HistoryOutlined />
                History
              </span>
            ),
            children: (
              <Card
                extra={
                  <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
                    Refresh
                  </Button>
                }
              >
                <Table
                  columns={columns}
                  dataSource={notifications}
                  rowKey="id"
                  loading={isLoading}
                  pagination={{
                    current: page,
                    pageSize,
                    total,
                    showSizeChanger: true,
                    showTotal: (total) => `Total ${total} notifications`,
                    onChange: (p, ps) => {
                      setPage(p);
                      setPageSize(ps);
                    },
                  }}
                />
              </Card>
            ),
          },
        ]}
      />

      {/* Preview Modal */}
      <Modal
        title="Notification Preview"
        open={previewModal}
        onCancel={() => setPreviewModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setPreviewModal(false)}>
            Close
          </Button>,
          <Button
            key="send"
            type="primary"
            icon={<SendOutlined />}
            onClick={() => {
              setPreviewModal(false);
              handleSend();
            }}
          >
            Send Now
          </Button>,
        ]}
      >
        <div style={{ textAlign: 'center', padding: 24 }}>
          <Avatar
            size={64}
            style={{ background: '#4f46e5', marginBottom: 16 }}
            icon={<BellOutlined />}
          />
          <Title level={4}>{formValues?.title}</Title>
          <Text>{formValues?.message}</Text>
          <div style={{ marginTop: 24 }}>
            <Space>
              <Tag color={getTypeColor(formValues?.type || 'info')}>
                {(formValues?.type || 'info').toUpperCase()}
              </Tag>
              <Tag color={getAudienceColor(formValues?.targetAudience || 'all')}>
                {(formValues?.targetAudience || 'all').toUpperCase()}
              </Tag>
            </Space>
          </div>
        </div>
      </Modal>
    </div>
  );
}
