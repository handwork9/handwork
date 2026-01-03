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
  App,
  Avatar,
  Row,
  Col,
  Statistic,
  Modal,
  Upload,
  Tooltip,
  Badge,
  Progress,
} from 'antd';
import {
  SendOutlined,
  BellOutlined,
  TeamOutlined,
  HistoryOutlined,
  ReloadOutlined,
  PictureOutlined,
  DeleteOutlined,
  UserOutlined,
  NotificationOutlined,
  RiseOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, normalizeImageUrl } from '@/lib/api';
import type { ColumnsType } from 'antd/es/table';
import type { UploadFile, UploadChangeParam } from 'antd/es/upload';
import dayjs from 'dayjs';
import Image from 'next/image';

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
  imageUrl?: string;
  actionUrl?: string;
  actionType?: 'product' | 'order' | 'wallet' | 'promo' | 'external';
}

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  avatar?: string;
}

interface IndividualNotificationForm {
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'promo';
  imageUrl?: string;
}

export default function NotificationsPage() {
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [individualForm] = Form.useForm();
  const [previewModal, setPreviewModal] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Watch form values reactively
  const formType = Form.useWatch('type', form);
  const formTitle = Form.useWatch('title', form);
  const formMessage = Form.useWatch('message', form);
  const formTargetAudience = Form.useWatch('targetAudience', form);
  const formImageUrl = Form.useWatch('imageUrl', form);
  
  // Watch individual form values
  const indFormType = Form.useWatch('type', individualForm);
  const indFormTitle = Form.useWatch('title', individualForm);
  const indFormMessage = Form.useWatch('message', individualForm);
  const indFormImageUrl = Form.useWatch('imageUrl', individualForm);
  
  const [page, setPage] = useState(1);
  const [imageUploading, setImageUploading] = useState(false);
  const [indImageUploading, setIndImageUploading] = useState(false);
  const [pageSize, setPageSize] = useState(10);

  // Handle image upload
  const handleImageUpload = async (info: UploadChangeParam<UploadFile>) => {
    const { status, originFileObj } = info.file;
    
    if (status === 'uploading') {
      setImageUploading(true);
      return;
    }
    
    if (status === 'done' || originFileObj) {
      try {
        // Create FormData for upload
        const formData = new FormData();
        formData.append('file', originFileObj as Blob);
        formData.append('folder', 'notifications');
        const response = await adminApi.uploadNotificationImage(formData);
        const imageUrl = response.data.url || response.data.data?.url;
        form.setFieldValue('imageUrl', imageUrl);
        message.success('Image uploaded successfully');
      } catch {
        message.error('Failed to upload image');
      } finally {
        setImageUploading(false);
      }
    }
    
    if (status === 'error') {
      setImageUploading(false);
      message.error('Image upload failed');
    }
  };

  const handleRemoveImage = () => {
    form.setFieldValue('imageUrl', undefined);
  };

  const handleRemoveIndImage = () => {
    individualForm.setFieldValue('imageUrl', undefined);
  };

  // Handle individual image upload
  const handleIndImageUpload = async (info: UploadChangeParam<UploadFile>) => {
    const { status, originFileObj } = info.file;
    
    if (status === 'uploading') {
      setIndImageUploading(true);
      return;
    }
    
    if (status === 'done' || originFileObj) {
      try {
        // Create FormData for upload
        const formData = new FormData();
        formData.append('file', originFileObj as Blob);
        formData.append('folder', 'notifications');
        const response = await adminApi.uploadNotificationImage(formData);
        const imageUrl = response.data.url || response.data.data?.url;
        individualForm.setFieldValue('imageUrl', imageUrl);
        message.success('Image uploaded successfully');
      } catch {
        message.error('Failed to upload image');
      } finally {
        setIndImageUploading(false);
      }
    }
    
    if (status === 'error') {
      setIndImageUploading(false);
      message.error('Image upload failed');
    }
  };

  // Fetch all users for individual notification dropdown
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      const response = await adminApi.getUsers({ limit: 1000 });
      return response.data.data;
    },
  });

  // Fetch notification history
  const { data: notificationsData, isLoading, refetch } = useQuery({
    queryKey: ['admin-notifications', page, pageSize],
    queryFn: async () => {
      const response = await adminApi.getNotificationHistory({ page, limit: pageSize });
      return response.data.data;
    },
  });

  // Send broadcast notification mutation
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

  // Send individual notification mutation
  const sendIndividualMutation = useMutation({
    mutationFn: (data: IndividualNotificationForm) =>
      adminApi.sendIndividualNotification({
        userId: data.userId,
        title: data.title,
        body: data.message,
        type: data.type,
        imageUrl: data.imageUrl,
      }),
    onSuccess: () => {
      message.success('Notification sent successfully');
      individualForm.resetFields();
      setSelectedUser(null);
      setUserSearch('');
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      message.error(error.response?.data?.message || 'Failed to send notification');
    },
  });

  const handleSend = () => {
    form.validateFields().then((values) => {
      modal.confirm({
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
          sendMutation.mutate({ ...values, imageUrl: formImageUrl });
        },
      });
    });
  };

  const handleSendIndividual = () => {
    if (!selectedUser) {
      message.error('Please select a user');
      return;
    }
    
    individualForm.validateFields().then((values) => {
      modal.confirm({
        title: 'Confirm Send',
        content: (
          <div>
            <p>You are about to send a notification to:</p>
            <Space>
              <Avatar src={selectedUser.avatar} icon={<UserOutlined />} />
              <div>
                <Text strong>{selectedUser.name}</Text>
                <br />
                <Text type="secondary">{selectedUser.email}</Text>
              </div>
            </Space>
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
          sendIndividualMutation.mutate({
            userId: selectedUser.id,
            title: values.title,
            message: values.message,
            type: values.type,
            imageUrl: indFormImageUrl,
          });
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

  // Get role color for tags
  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      buyer: 'cyan',
      farmer: 'green',
      rider: 'purple',
      admin: 'red',
    };
    return colors[role?.toLowerCase()] || 'default';
  };

  // User dropdown options with name and role
  const userOptions = (usersData?.users || []).map((user: User) => ({
    value: user.id,
    label: (
      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <Space>
          <Avatar size="small" src={user.avatar} icon={<UserOutlined />} />
          <Text>{user.name}</Text>
        </Space>
        <Tag color={getRoleColor(user.role)}>{user.role?.toUpperCase()}</Tag>
      </Space>
    ),
    user,
  }));

  // Use API data - show empty state if no notifications
  const notifications = notificationsData?.items || [];
  const total = notificationsData?.total || 0;

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

  return (
    <div style={{ margin: -24 }}>
      {/* Gradient Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
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
              <NotificationOutlined style={{ fontSize: 24, color: '#fff' }} />
            </div>
            <div>
              <Title level={3} style={{ color: '#fff', margin: 0 }}>Notifications</Title>
              <Text style={{ color: 'rgba(255,255,255,0.8)' }}>Send broadcast notifications to users</Text>
            </div>
          </div>
          <Tooltip title="Refresh history">
            <Button 
              icon={<ReloadOutlined />} 
              onClick={() => refetch()}
              style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff' }}
            />
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
                title={<Text type="secondary" style={{ fontSize: 12 }}>Total Sent (30 days)</Text>}
                value={12500}
                prefix={<SendOutlined style={{ color: '#f59e0b' }} />}
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
                title={<Text type="secondary" style={{ fontSize: 12 }}>Total Read</Text>}
                value={8320}
                prefix={<EyeOutlined style={{ color: '#10b981' }} />}
                styles={{ content: { fontSize: 24, color: '#10b981' } }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card 
              size="small" 
              style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              styles={{ body: { padding: 16 } }}
            >
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Read Rate</Text>
                <div style={{ marginTop: 8 }}>
                  <Progress 
                    percent={66.5} 
                    strokeColor="#8b5cf6" 
                    size="small"
                    format={(percent) => <Text strong style={{ fontSize: 18 }}>{percent}%</Text>}
                  />
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card 
              size="small" 
              style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              styles={{ body: { padding: 16 } }}
            >
              <Statistic
                title={<Text type="secondary" style={{ fontSize: 12 }}>Active Users</Text>}
                value={5000}
                prefix={<TeamOutlined style={{ color: '#3b82f6' }} />}
                styles={{ content: { fontSize: 24 } }}
              />
            </Card>
          </Col>
        </Row>
      </div>

      {/* Main Content */}
      <div style={{ padding: '0 24px 24px' }}>

      <Tabs
        defaultActiveKey="compose"
        destroyOnHidden={false}
        type="card"
        style={{ background: '#fff', borderRadius: 12, padding: 16 }}
        items={[
          {
            key: 'compose',
            label: (
              <span>
                <SendOutlined />
                Broadcast
              </span>
            ),
            children: (
              <Row gutter={24}>
                <Col xs={24} lg={14}>
                  <Card 
                    title={
                      <Space>
                        <ThunderboltOutlined style={{ color: '#f59e0b' }} />
                        <span>New Broadcast Notification</span>
                      </Space>
                    }
                    style={{ borderRadius: 12 }}
                    styles={{ body: { padding: 20 } }}
                  >
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

                      <Form.Item
                        label="Image (Optional)"
                        extra="Add an image to make your notification more engaging"
                      >
                        {formImageUrl ? (
                          <div style={{ position: 'relative', width: 200 }}>
                            <Image
                              src={normalizeImageUrl(formImageUrl)}
                              alt="Notification"
                              width={200}
                              height={120}
                              style={{ borderRadius: 8, objectFit: 'cover' }}
                            />
                            <Button
                              type="primary"
                              danger
                              size="small"
                              icon={<DeleteOutlined />}
                              onClick={handleRemoveImage}
                              style={{ position: 'absolute', top: 8, right: 8 }}
                            />
                          </div>
                        ) : (
                          <Upload
                            accept="image/*"
                            showUploadList={false}
                            customRequest={({ onSuccess }) => {
                              setTimeout(() => onSuccess?.('ok'), 0);
                            }}
                            onChange={handleImageUpload}
                          >
                            <Button
                              icon={<PictureOutlined />}
                              loading={imageUploading}
                            >
                              {imageUploading ? 'Uploading...' : 'Upload Image'}
                            </Button>
                          </Upload>
                        )}
                      </Form.Item>

                      <Form.Item
                        name="actionType"
                        label="Deep Link Action (Optional)"
                        extra="Navigate users to a specific screen when they tap the notification"
                      >
                        <Select
                          allowClear
                          placeholder="Select action type"
                          options={[
                            { value: 'product', label: '🛒 View Product' },
                            { value: 'order', label: '📦 View Order' },
                            { value: 'wallet', label: '💰 Open Wallet' },
                            { value: 'promo', label: '🎉 View Promotion' },
                            { value: 'external', label: '🔗 External URL' },
                          ]}
                        />
                      </Form.Item>

                      <Form.Item
                        noStyle
                        shouldUpdate={(prev, curr) => prev.actionType !== curr.actionType}
                      >
                        {({ getFieldValue }) => {
                          const actionType = getFieldValue('actionType');
                          if (!actionType) return null;
                          
                          if (actionType === 'external') {
                            return (
                              <Form.Item
                                name="actionUrl"
                                label="External URL"
                                rules={[{ type: 'url', message: 'Please enter a valid URL' }]}
                              >
                                <Input placeholder="https://example.com/promo" />
                              </Form.Item>
                            );
                          }
                          
                          if (actionType === 'product') {
                            return (
                              <Form.Item
                                name="actionUrl"
                                label="Product ID"
                              >
                                <Input placeholder="Enter product ID" />
                              </Form.Item>
                            );
                          }
                          
                          if (actionType === 'order') {
                            return (
                              <Form.Item
                                name="actionUrl"
                                label="Order ID"
                              >
                                <Input placeholder="Enter order ID" />
                              </Form.Item>
                            );
                          }
                          
                          return null;
                        }}
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
                  <Card 
                    title={
                      <Space>
                        <EyeOutlined style={{ color: '#8b5cf6' }} />
                        <span>Live Preview</span>
                      </Space>
                    }
                    style={{ borderRadius: 12 }}
                    styles={{ body: { padding: 20 } }}
                  >
                    <div
                      style={{
                        background: 'linear-gradient(135deg, #f5f5f5 0%, #e5e5e5 100%)',
                        borderRadius: 16,
                        padding: 20,
                        maxWidth: 340,
                        margin: '0 auto',
                      }}
                    >
                      <div
                        style={{
                          background: 'white',
                          borderRadius: 12,
                          overflow: 'hidden',
                          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                        }}
                      >
                        {formImageUrl && (
                          <Image
                            src={normalizeImageUrl(formImageUrl)}
                            alt="Notification"
                            width={320}
                            height={160}
                            style={{ width: '100%', height: 160, objectFit: 'cover' }}
                          />
                        )}
                        <div style={{ padding: 16 }}>
                          <Space align="start">
                            <Avatar
                              size={44}
                              style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)' }}
                              icon={<BellOutlined />}
                            />
                            <div style={{ flex: 1 }}>
                              <Text strong style={{ display: 'block', fontSize: 15 }}>
                                {formTitle || 'Notification Title'}
                              </Text>
                              <Text type="secondary" style={{ fontSize: 13 }}>
                                {formMessage || 'Your notification message will appear here...'}
                              </Text>
                              <br />
                              <Text type="secondary" style={{ fontSize: 11 }}>
                                Just now
                              </Text>
                            </div>
                          </Space>
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: 24, padding: 16, background: '#fafafa', borderRadius: 12 }}>
                      <Text type="secondary">
                        This notification will be sent to{' '}
                        <Tag color={getAudienceColor(formTargetAudience || 'all')}>
                          {(formTargetAudience || 'all').toUpperCase()}
                        </Tag>
                        users as a{' '}
                        <Tag color={getTypeColor(formType || 'info')}>
                          {(formType || 'info').toUpperCase()}
                        </Tag>
                        notification.
                        {formImageUrl && (
                          <>
                            <br />
                            <Tag color="cyan" style={{ marginTop: 8 }}>
                              <PictureOutlined /> Image attached
                            </Tag>
                          </>
                        )}
                      </Text>
                    </div>
                  </Card>

                  <Card 
                    title={
                      <Space>
                        <ThunderboltOutlined style={{ color: '#10b981' }} />
                        <span>Quick Templates</span>
                      </Space>
                    }
                    style={{ marginTop: 16, borderRadius: 12 }}
                    styles={{ body: { padding: 16 } }}
                  >
                    <Space orientation="vertical" style={{ width: '100%' }}>
                      <Button
                        block
                        style={{ height: 'auto', padding: '12px 16px', textAlign: 'left' }}
                        onClick={() => {
                          form.setFieldsValue({
                            type: 'promo',
                            title: 'Weekend Special!',
                            message: 'Enjoy 20% off on all deliveries this weekend. Use code WEEKEND20.',
                          });
                        }}
                      >
                        <div>
                          <Text strong>🎉 Weekend Promo</Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: 12 }}>Promotional discount template</Text>
                        </div>
                      </Button>
                      <Button
                        block
                        style={{ height: 'auto', padding: '12px 16px', textAlign: 'left' }}
                        onClick={() => {
                          form.setFieldsValue({
                            type: 'warning',
                            title: 'Scheduled Maintenance',
                            message: 'Our services will be temporarily unavailable for scheduled maintenance.',
                          });
                        }}
                      >
                        <div>
                          <Text strong>⚠️ Maintenance Notice</Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: 12 }}>Service interruption template</Text>
                        </div>
                      </Button>
                      <Button
                        block
                        style={{ height: 'auto', padding: '12px 16px', textAlign: 'left' }}
                        onClick={() => {
                          form.setFieldsValue({
                            type: 'info',
                            title: 'New Feature Available',
                            message: 'Check out our latest feature update! We\'ve added new functionality.',
                          });
                        }}
                      >
                        <div>
                          <Text strong>📢 Feature Announcement</Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: 12 }}>New feature rollout template</Text>
                        </div>
                      </Button>
                    </Space>
                  </Card>
                </Col>
              </Row>
            ),
          },
          {
            key: 'individual',
            label: (
              <span>
                <UserOutlined />
                Individual
              </span>
            ),
            children: (
              <Row gutter={24}>
                <Col xs={24} lg={14}>
                  <Card 
                    title={
                      <Space>
                        <UserOutlined style={{ color: '#3b82f6' }} />
                        <span>Send to Specific User</span>
                      </Space>
                    }
                    style={{ borderRadius: 12 }}
                    styles={{ body: { padding: 20 } }}
                  >
                    <Form
                      form={individualForm}
                      layout="vertical"
                      initialValues={{
                        type: 'info',
                      }}
                    >
                      <Form.Item
                        label="Select User"
                        required
                        validateStatus={selectedUser ? 'success' : undefined}
                      >
                        <Select
                          showSearch
                          placeholder="Select a user..."
                          filterOption={(input, option) => {
                            const opt = option as { user?: User };
                            if (!opt.user) return false;
                            const searchText = `${opt.user.name} ${opt.user.email} ${opt.user.phone || ''} ${opt.user.role}`.toLowerCase();
                            return searchText.includes(input.toLowerCase());
                          }}
                          onChange={(_, option) => {
                            const opt = option as { user: User };
                            setSelectedUser(opt.user);
                          }}
                          loading={usersLoading}
                          options={userOptions}
                          value={selectedUser?.id}
                          notFoundContent={usersLoading ? 'Loading users...' : 'No users found'}
                          style={{ width: '100%' }}
                          optionLabelProp="label"
                          styles={{ popup: { root: { maxHeight: 400 } } }}
                        />
                        {selectedUser && (
                          <div style={{ marginTop: 12, padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
                            <Space>
                              <Avatar src={selectedUser.avatar} icon={<UserOutlined />} size={48} />
                              <div>
                                <Text strong>{selectedUser.name}</Text>
                                <br />
                                <Text type="secondary">{selectedUser.email}</Text>
                                <br />
                                <Tag color={getAudienceColor(selectedUser.role)}>{selectedUser.role.toUpperCase()}</Tag>
                              </div>
                            </Space>
                          </div>
                        )}
                      </Form.Item>

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

                      <Form.Item
                        label="Image (Optional)"
                        extra="Add an image to make your notification more engaging"
                      >
                        {indFormImageUrl ? (
                          <div style={{ position: 'relative', width: 200 }}>
                            <Image
                              src={normalizeImageUrl(indFormImageUrl)}
                              alt="Notification"
                              width={200}
                              height={120}
                              style={{ borderRadius: 8, objectFit: 'cover' }}
                            />
                            <Button
                              type="primary"
                              danger
                              size="small"
                              icon={<DeleteOutlined />}
                              onClick={handleRemoveIndImage}
                              style={{ position: 'absolute', top: 8, right: 8 }}
                            />
                          </div>
                        ) : (
                          <Upload
                            accept="image/*"
                            showUploadList={false}
                            customRequest={({ onSuccess }) => {
                              setTimeout(() => onSuccess?.('ok'), 0);
                            }}
                            onChange={handleIndImageUpload}
                          >
                            <Button
                              icon={<PictureOutlined />}
                              loading={indImageUploading}
                            >
                              {indImageUploading ? 'Uploading...' : 'Upload Image'}
                            </Button>
                          </Upload>
                        )}
                      </Form.Item>

                      <Form.Item>
                        <Button
                          type="primary"
                          icon={<SendOutlined />}
                          onClick={handleSendIndividual}
                          loading={sendIndividualMutation.isPending}
                          disabled={!selectedUser}
                        >
                          Send to {selectedUser?.name || 'User'}
                        </Button>
                      </Form.Item>
                    </Form>
                  </Card>
                </Col>

                <Col xs={24} lg={10}>
                  <Card 
                    title={
                      <Space>
                        <EyeOutlined style={{ color: '#8b5cf6' }} />
                        <span>Live Preview</span>
                      </Space>
                    }
                    style={{ borderRadius: 12 }}
                    styles={{ body: { padding: 20 } }}
                  >
                    <div
                      style={{
                        background: 'linear-gradient(135deg, #f5f5f5 0%, #e5e5e5 100%)',
                        borderRadius: 16,
                        padding: 20,
                        maxWidth: 340,
                        margin: '0 auto',
                      }}
                    >
                      <div
                        style={{
                          background: 'white',
                          borderRadius: 12,
                          overflow: 'hidden',
                          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                        }}
                      >
                        {indFormImageUrl && (
                          <Image
                            src={normalizeImageUrl(indFormImageUrl)}
                            alt="Notification"
                            width={320}
                            height={160}
                            style={{ width: '100%', height: 160, objectFit: 'cover' }}
                          />
                        )}
                        <div style={{ padding: 16 }}>
                          <Space align="start">
                            <Avatar
                              size={44}
                              style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)' }}
                              icon={<BellOutlined />}
                            />
                            <div style={{ flex: 1 }}>
                              <Text strong style={{ display: 'block', fontSize: 15 }}>
                                {indFormTitle || 'Notification Title'}
                              </Text>
                              <Text type="secondary" style={{ fontSize: 13 }}>
                                {indFormMessage || 'Your notification message will appear here...'}
                              </Text>
                              <br />
                              <Text type="secondary" style={{ fontSize: 11 }}>
                                Just now
                              </Text>
                            </div>
                          </Space>
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: 24, padding: 16, background: '#fafafa', borderRadius: 12 }}>
                      <Text type="secondary">
                        This notification will be sent to{' '}
                        {selectedUser ? (
                          <Tag color="blue">{selectedUser.name}</Tag>
                        ) : (
                          <Tag>No user selected</Tag>
                        )}
                        {' '}as a{' '}
                        <Tag color={getTypeColor(indFormType || 'info')}>
                          {(indFormType || 'info').toUpperCase()}
                        </Tag>
                        notification.
                        {indFormImageUrl && (
                          <>
                            <br />
                            <Tag color="cyan" style={{ marginTop: 8 }}>
                              <PictureOutlined /> Image attached
                            </Tag>
                          </>
                        )}
                      </Text>
                    </div>
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
                style={{ borderRadius: 12 }}
                styles={{ body: { padding: 0 } }}
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
      </div>

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
          <Title level={4}>{formTitle}</Title>
          <Text>{formMessage}</Text>
          <div style={{ marginTop: 24 }}>
            <Space>
              <Tag color={getTypeColor(formType || 'info')}>
                {(formType || 'info').toUpperCase()}
              </Tag>
              <Tag color={getAudienceColor(formTargetAudience || 'all')}>
                {(formTargetAudience || 'all').toUpperCase()}
              </Tag>
            </Space>
          </div>
        </div>
      </Modal>
    </div>
  );
}
