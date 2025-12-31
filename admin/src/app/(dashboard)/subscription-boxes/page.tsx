'use client';

import { useState } from 'react';
import {
  Card,
  Table,
  Tag,
  Space,
  Input,
  Select,
  Typography,
  Statistic,
  Row,
  Col,
  Button,
  Modal,
  Form,
  InputNumber,
  Switch,
  message,
  Tabs,
  Avatar,
  Descriptions,
  Popconfirm,
  Badge,
} from 'antd';
import {
  SearchOutlined,
  GiftOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined,
  CalendarOutlined,
  UserOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import { AxiosError } from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, normalizeImageUrl } from '@/lib/api';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

// Types
interface SubscriptionBoxTemplate {
  id: string;
  name: string;
  description: string;
  price: number;
  frequency: 'weekly' | 'bi-weekly' | 'monthly';
  contents?: string;
  imageUrl?: string;
  category?: string;
  isActive: boolean;
  subscriberCount?: number;
  createdAt: string;
}

interface BoxSubscription {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  template: SubscriptionBoxTemplate;
  status: 'active' | 'paused' | 'cancelled';
  nextDeliveryDate?: string;
  deliveryCount: number;
  totalSpent: number;
  createdAt: string;
}

// Color mappings
const frequencyColors: Record<string, string> = {
  weekly: 'blue',
  'bi-weekly': 'cyan',
  monthly: 'purple',
};

const statusColors: Record<string, string> = {
  active: 'success',
  paused: 'warning',
  cancelled: 'error',
};

export default function SubscriptionBoxesPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('templates');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal states
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SubscriptionBoxTemplate | null>(null);
  const [selectedSubscription, setSelectedSubscription] = useState<BoxSubscription | null>(null);

  const [templateForm] = Form.useForm();

  // Queries
  const { data: templatesData, isLoading: templatesLoading, refetch: refetchTemplates } = useQuery({
    queryKey: ['subscriptionBoxTemplates', page, pageSize],
    queryFn: async () => {
      try {
        const response = await adminApi.getSubscriptionBoxTemplates({
          page,
          limit: pageSize,
        });
        return response.data?.data || response.data;
      } catch (error) {
        console.error('Failed to fetch templates:', error);
        return { templates: [], total: 0 };
      }
    },
    enabled: activeTab === 'templates',
  });

  const { data: subscriptionsData, isLoading: subscriptionsLoading, refetch: refetchSubscriptions } = useQuery({
    queryKey: ['boxSubscriptions', page, pageSize, statusFilter],
    queryFn: async () => {
      try {
        const response = await adminApi.getSubscriptionBoxSubscriptions({
          page,
          limit: pageSize,
          status: statusFilter,
        });
        return response.data?.data || response.data;
      } catch (error) {
        console.error('Failed to fetch subscriptions:', error);
        return { subscriptions: [], total: 0 };
      }
    },
    enabled: activeTab === 'subscriptions',
  });

  const { data: statsData } = useQuery({
    queryKey: ['subscriptionBoxStats'],
    queryFn: async () => {
      try {
        const response = await adminApi.getSubscriptionBoxStats();
        return response.data;
      } catch {
        return null;
      }
    },
  });

  // Mutations
  const createTemplateMutation = useMutation({
    mutationFn: (data: Parameters<typeof adminApi.createSubscriptionBoxTemplate>[0]) =>
      adminApi.createSubscriptionBoxTemplate(data),
    onSuccess: () => {
      message.success('Template created successfully');
      setTemplateModalOpen(false);
      templateForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['subscriptionBoxTemplates'] });
    },
    onError: (error: AxiosError<{ message: string }>) => {
      message.error(error.response?.data?.message || 'Failed to create template');
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      adminApi.updateSubscriptionBoxTemplate(id, data),
    onSuccess: () => {
      message.success('Template updated successfully');
      setTemplateModalOpen(false);
      setEditingTemplate(null);
      templateForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['subscriptionBoxTemplates'] });
    },
    onError: (error: AxiosError<{ message: string }>) => {
      message.error(error.response?.data?.message || 'Failed to update template');
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteSubscriptionBoxTemplate(id),
    onSuccess: () => {
      message.success('Template deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['subscriptionBoxTemplates'] });
    },
    onError: (error: AxiosError<{ message: string }>) => {
      message.error(error.response?.data?.message || 'Failed to delete template');
    },
  });

  const handleCreateOrUpdate = async (values: Record<string, unknown>) => {
    if (editingTemplate) {
      updateTemplateMutation.mutate({ id: editingTemplate.id, data: values });
    } else {
      createTemplateMutation.mutate(values as Parameters<typeof adminApi.createSubscriptionBoxTemplate>[0]);
    }
  };

  const handleEditTemplate = (template: SubscriptionBoxTemplate) => {
    setEditingTemplate(template);
    templateForm.setFieldsValue(template);
    setTemplateModalOpen(true);
  };

  const handleViewSubscription = (subscription: BoxSubscription) => {
    setSelectedSubscription(subscription);
    setDetailModalOpen(true);
  };

  const templates = templatesData?.templates || templatesData?.data || [];
  const totalTemplates = templatesData?.total || templates.length;

  const subscriptions = subscriptionsData?.subscriptions || subscriptionsData?.data || [];
  const totalSubscriptions = subscriptionsData?.total || subscriptions.length;

  // Calculate stats
  const stats = statsData || {
    totalTemplates: totalTemplates,
    activeSubscriptions: subscriptions.filter((s: BoxSubscription) => s.status === 'active').length,
    totalRevenue: subscriptions.reduce((acc: number, s: BoxSubscription) => acc + (s.totalSpent || 0), 0),
    totalDeliveries: subscriptions.reduce((acc: number, s: BoxSubscription) => acc + (s.deliveryCount || 0), 0),
  };

  const templateColumns: ColumnsType<SubscriptionBoxTemplate> = [
    {
      title: 'Template',
      key: 'template',
      render: (_, record) => (
        <Space>
          <Avatar
            src={normalizeImageUrl(record.imageUrl)}
            shape="square"
            size={48}
            icon={<InboxOutlined />}
          />
          <Space direction="vertical" size={0}>
            <Text strong>{record.name}</Text>
            <Text type="secondary" ellipsis style={{ maxWidth: 200, fontSize: 12 }}>
              {record.description}
            </Text>
          </Space>
        </Space>
      ),
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => (
        <Text strong>₦{price?.toLocaleString()}</Text>
      ),
    },
    {
      title: 'Frequency',
      dataIndex: 'frequency',
      key: 'frequency',
      render: (frequency: string) => (
        <Tag color={frequencyColors[frequency]}>
          {frequency?.replace('-', ' ').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category?: string) => category || '-',
    },
    {
      title: 'Subscribers',
      dataIndex: 'subscriberCount',
      key: 'subscriberCount',
      render: (count?: number) => count || 0,
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag
          icon={isActive ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
          color={isActive ? 'success' : 'default'}
        >
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEditTemplate(record)}
          />
          <Popconfirm
            title="Delete this template?"
            description="This will not affect existing subscriptions."
            onConfirm={() => deleteTemplateMutation.mutate(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const subscriptionColumns: ColumnsType<BoxSubscription> = [
    {
      title: 'Subscriber',
      key: 'user',
      render: (_, record) => (
        <Space>
          <Avatar
            src={normalizeImageUrl(record.user?.avatar)}
            icon={<UserOutlined />}
          />
          <Space direction="vertical" size={0}>
            <Text strong>{record.user?.name}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.user?.email}
            </Text>
          </Space>
        </Space>
      ),
    },
    {
      title: 'Box Template',
      key: 'template',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.template?.name}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            ₦{record.template?.price?.toLocaleString()} / {record.template?.frequency}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Badge status={statusColors[status] as 'success' | 'warning' | 'error'} text={status?.charAt(0).toUpperCase() + status?.slice(1)} />
      ),
    },
    {
      title: 'Deliveries',
      dataIndex: 'deliveryCount',
      key: 'deliveryCount',
      render: (count: number) => count || 0,
    },
    {
      title: 'Total Spent',
      dataIndex: 'totalSpent',
      key: 'totalSpent',
      render: (amount: number) => (
        <Text strong style={{ color: '#52c41a' }}>
          ₦{amount?.toLocaleString() || 0}
        </Text>
      ),
    },
    {
      title: 'Next Delivery',
      dataIndex: 'nextDeliveryDate',
      key: 'nextDeliveryDate',
      render: (date?: string) =>
        date ? dayjs(date).format('MMM D, YYYY') : '-',
    },
    {
      title: 'Started',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('MMM D, YYYY'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="text"
          icon={<EyeOutlined />}
          onClick={() => handleViewSubscription(record)}
        >
          View
        </Button>
      ),
    },
  ];

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
        <Title level={2} style={{ margin: 0 }}>
          <GiftOutlined style={{ marginRight: 8 }} />
          Subscription Boxes
        </Title>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              refetchTemplates();
              refetchSubscriptions();
            }}
          >
            Refresh
          </Button>
          {activeTab === 'templates' && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingTemplate(null);
                templateForm.resetFields();
                setTemplateModalOpen(true);
              }}
            >
              Create Template
            </Button>
          )}
        </Space>
      </div>

      {/* Stats */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Box Templates"
              value={stats.totalTemplates}
              prefix={<InboxOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Active Subscriptions"
              value={stats.activeSubscriptions}
              valueStyle={{ color: '#3f8600' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Deliveries"
              value={stats.totalDeliveries}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Revenue"
              value={stats.totalRevenue}
              prefix="₦"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'templates',
            label: (
              <span>
                <InboxOutlined /> Box Templates
              </span>
            ),
          },
          {
            key: 'subscriptions',
            label: (
              <span>
                <UserOutlined /> Subscriptions
              </span>
            ),
          },
        ]}
      />

      {/* Content based on active tab */}
      {activeTab === 'templates' && (
        <Card>
          <Table
            columns={templateColumns}
            dataSource={templates}
            rowKey="id"
            loading={templatesLoading}
            pagination={{
              current: page,
              pageSize,
              total: totalTemplates,
              showSizeChanger: true,
              showTotal: (t) => `Total ${t} templates`,
              onChange: (p, ps) => {
                setPage(p);
                setPageSize(ps);
              },
            }}
          />
        </Card>
      )}

      {activeTab === 'subscriptions' && (
        <>
          <Card style={{ marginBottom: 16 }}>
            <Space wrap>
              <Input
                placeholder="Search subscribers..."
                prefix={<SearchOutlined />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: 200 }}
              />
              <Select
                placeholder="Status"
                allowClear
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: 150 }}
                options={[
                  { label: 'Active', value: 'active' },
                  { label: 'Paused', value: 'paused' },
                  { label: 'Cancelled', value: 'cancelled' },
                ]}
              />
            </Space>
          </Card>
          <Card>
            <Table
              columns={subscriptionColumns}
              dataSource={subscriptions}
              rowKey="id"
              loading={subscriptionsLoading}
              pagination={{
                current: page,
                pageSize,
                total: totalSubscriptions,
                showSizeChanger: true,
                showTotal: (t) => `Total ${t} subscriptions`,
                onChange: (p, ps) => {
                  setPage(p);
                  setPageSize(ps);
                },
              }}
            />
          </Card>
        </>
      )}

      {/* Create/Edit Template Modal */}
      <Modal
        title={editingTemplate ? 'Edit Box Template' : 'Create Box Template'}
        open={templateModalOpen}
        onCancel={() => {
          setTemplateModalOpen(false);
          setEditingTemplate(null);
          templateForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={templateForm}
          layout="vertical"
          onFinish={handleCreateOrUpdate}
          initialValues={{
            frequency: 'monthly',
            isActive: true,
          }}
        >
          <Form.Item
            name="name"
            label="Template Name"
            rules={[{ required: true, message: 'Please enter template name' }]}
          >
            <Input placeholder="Fresh Veggie Box" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <TextArea rows={3} placeholder="A curated selection of fresh vegetables..." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="price"
                label="Price (₦)"
                rules={[{ required: true, message: 'Please enter price' }]}
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => Number(value!.replace(/,/g, '')) as any}
                  placeholder="5000"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="frequency"
                label="Delivery Frequency"
                rules={[{ required: true }]}
              >
                <Select
                  options={[
                    { label: 'Weekly', value: 'weekly' },
                    { label: 'Bi-Weekly', value: 'bi-weekly' },
                    { label: 'Monthly', value: 'monthly' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="category" label="Category">
            <Select
              allowClear
              placeholder="Select category"
              options={[
                { label: 'Vegetables', value: 'vegetables' },
                { label: 'Fruits', value: 'fruits' },
                { label: 'Mixed', value: 'mixed' },
                { label: 'Organic', value: 'organic' },
                { label: 'Premium', value: 'premium' },
              ]}
            />
          </Form.Item>

          <Form.Item name="contents" label="Box Contents">
            <TextArea
              rows={3}
              placeholder="Describe what's typically included in this box..."
            />
          </Form.Item>

          <Form.Item name="imageUrl" label="Image URL">
            <Input placeholder="https://example.com/image.jpg" />
          </Form.Item>

          <Form.Item name="isActive" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={createTemplateMutation.isPending || updateTemplateMutation.isPending}
              >
                {editingTemplate ? 'Update' : 'Create'}
              </Button>
              <Button onClick={() => setTemplateModalOpen(false)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Subscription Detail Modal */}
      <Modal
        title="Subscription Details"
        open={detailModalOpen}
        onCancel={() => {
          setDetailModalOpen(false);
          setSelectedSubscription(null);
        }}
        footer={null}
        width={600}
      >
        {selectedSubscription && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Subscriber">
              <Space>
                <Avatar
                  src={normalizeImageUrl(selectedSubscription.user?.avatar)}
                  icon={<UserOutlined />}
                />
                <div>
                  <Text strong>{selectedSubscription.user?.name}</Text>
                  <br />
                  <Text type="secondary">{selectedSubscription.user?.email}</Text>
                </div>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Box Template">
              {selectedSubscription.template?.name}
            </Descriptions.Item>
            <Descriptions.Item label="Price">
              ₦{selectedSubscription.template?.price?.toLocaleString()} / {selectedSubscription.template?.frequency}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Badge status={statusColors[selectedSubscription.status] as 'success' | 'warning' | 'error'} text={selectedSubscription.status?.charAt(0).toUpperCase() + selectedSubscription.status?.slice(1)} />
            </Descriptions.Item>
            <Descriptions.Item label="Deliveries Made">
              {selectedSubscription.deliveryCount}
            </Descriptions.Item>
            <Descriptions.Item label="Total Spent">
              ₦{selectedSubscription.totalSpent?.toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="Next Delivery">
              {selectedSubscription.nextDeliveryDate
                ? dayjs(selectedSubscription.nextDeliveryDate).format('MMM D, YYYY')
                : 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Started">
              {dayjs(selectedSubscription.createdAt).format('MMM D, YYYY h:mm A')}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
