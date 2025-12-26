'use client';

import { useState, useMemo } from 'react';
import { adminApi } from '@/lib/api';
import {
  Input,
  Select,
  Avatar,
  Button,
  Spin,
  Empty,
  Tag,
  Space,
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Drawer,
  Descriptions,
  Modal,
  Form,
  InputNumber,
  App,
  Image,
  Badge,
  Tooltip,
  Divider,
  Segmented,
  Table,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  SendOutlined,
  SearchOutlined,
  UserOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
  FireOutlined,
  InboxOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  SyncOutlined,
  WarningOutlined,
  SafetyOutlined,
  CloseOutlined,
  DollarOutlined,
  ShoppingOutlined,
  MessageOutlined,
  PictureOutlined,
  FieldTimeOutlined,
  UnorderedListOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;

// Types
interface Dispute {
  id: string;
  disputeNumber: string;
  userId: string;
  orderId: string;
  type: string;
  status: string;
  priority: string;
  subject: string;
  description: string;
  images?: string[];
  requestedAmount?: number;
  resolution?: string;
  refundedAmount?: number;
  resolutionNotes?: string;
  adminNotes?: string;
  assignedTo?: { id: string; name: string; avatar?: string };
  user?: { id: string; name: string; email?: string; phone?: string; avatar?: string };
  order?: { id: string; orderNumber: string; total: number; status: string; items: any[] };
  messages?: DisputeMessage[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

interface DisputeMessage {
  id: string;
  disputeId: string;
  senderId: string;
  senderType: 'user' | 'admin' | 'system';
  content: string;
  attachments?: string[];
  isRead: boolean;
  createdAt: string;
  sender?: { id: string; name: string; avatar?: string };
}

interface DisputeStats {
  total: number;
  open: number;
  underReview: number;
  resolved: number;
  avgResolutionTime: number;
  totalRefunded: number;
}

// Config constants
const STATUS_CONFIG: Record<string, { color: string; icon: React.ReactNode; bgColor: string }> = {
  open: { color: 'warning', icon: <InboxOutlined />, bgColor: '#fffbe6' },
  under_review: { color: 'processing', icon: <EyeOutlined />, bgColor: '#e6f7ff' },
  awaiting_response: { color: 'purple', icon: <ClockCircleOutlined />, bgColor: '#f9f0ff' },
  resolved: { color: 'success', icon: <CheckCircleOutlined />, bgColor: '#f6ffed' },
  closed: { color: 'default', icon: <CloseOutlined />, bgColor: '#fafafa' },
  escalated: { color: 'error', icon: <WarningOutlined />, bgColor: '#fff2f0' },
};

const PRIORITY_CONFIG: Record<string, { color: string; label: string; weight: number }> = {
  low: { color: 'default', label: 'Low', weight: 1 },
  medium: { color: 'blue', label: 'Medium', weight: 2 },
  high: { color: 'orange', label: 'High', weight: 3 },
  urgent: { color: 'red', label: 'Urgent', weight: 4 },
};

const TYPE_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  product_quality: { icon: '🥬', label: 'Product Quality', color: 'green' },
  missing_items: { icon: '📦', label: 'Missing Items', color: 'orange' },
  wrong_items: { icon: '🔄', label: 'Wrong Items', color: 'blue' },
  late_delivery: { icon: '⏰', label: 'Late Delivery', color: 'purple' },
  damaged_products: { icon: '💔', label: 'Damaged Products', color: 'red' },
  refund_request: { icon: '💰', label: 'Refund Request', color: 'cyan' },
  overcharge: { icon: '💳', label: 'Overcharge', color: 'magenta' },
  rider_issue: { icon: '🚴', label: 'Rider Issue', color: 'volcano' },
  farmer_issue: { icon: '👨‍🌾', label: 'Farmer Issue', color: 'lime' },
  other: { icon: '❓', label: 'Other', color: 'default' },
};

const RESOLUTION_OPTIONS = [
  { value: 'full_refund', label: 'Full Refund', icon: '💯' },
  { value: 'partial_refund', label: 'Partial Refund', icon: '💵' },
  { value: 'replacement', label: 'Replacement', icon: '🔄' },
  { value: 'credit', label: 'Wallet Credit', icon: '👛' },
  { value: 'no_action', label: 'No Action Required', icon: '✓' },
  { value: 'other', label: 'Other', icon: '📝' },
];

// Utility functions
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount);

const getAgeBadge = (createdAt: string) => {
  const hours = dayjs().diff(dayjs(createdAt), 'hour');
  if (hours < 24) return { color: 'green', text: 'New' };
  if (hours < 48) return { color: 'orange', text: '1+ day' };
  if (hours < 72) return { color: 'red', text: '2+ days' };
  return { color: 'volcano', text: `${Math.floor(hours / 24)}d old` };
};

export default function DisputesPage() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [priorityFilter, setPriorityFilter] = useState<string | undefined>();
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Fetch disputes
  const {
    data: disputesResponse,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin-disputes', statusFilter, priorityFilter],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      const response = await adminApi.getDisputes(params);
      return response.data;
    },
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  // Fetch stats
  const { data: statsResponse } = useQuery({
    queryKey: ['admin-dispute-stats'],
    queryFn: async () => {
      const response = await adminApi.getDisputeStats();
      return response.data;
    },
    staleTime: 60000,
  });

  // Mutations
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await adminApi.updateDispute(id, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-disputes'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dispute-stats'] });
      message.success('Dispute updated successfully');
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Failed to update dispute');
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await adminApi.resolveDispute(id, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-disputes'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dispute-stats'] });
      setResolveModalOpen(false);
      setDrawerOpen(false);
      setSelectedDispute(null);
      form.resetFields();
      message.success('Dispute resolved successfully');
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Failed to resolve dispute');
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const response = await adminApi.sendDisputeMessage(id, content);
      return response.data?.data || response.data;
    },
    onSuccess: (newMessage) => {
      setMessageInput('');
      if (selectedDispute && newMessage) {
        setSelectedDispute({
          ...selectedDispute,
          messages: [...(selectedDispute.messages || []), newMessage],
        });
      }
      queryClient.invalidateQueries({ queryKey: ['admin-disputes'] });
      message.success('Message sent');
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Failed to send message');
    },
  });

  // Extract data - handle double-nested response
  const disputes: Dispute[] = useMemo(() => {
    if (!disputesResponse) return [];
    if (disputesResponse.data?.data && Array.isArray(disputesResponse.data.data)) {
      return disputesResponse.data.data;
    }
    if (Array.isArray(disputesResponse.data)) {
      return disputesResponse.data;
    }
    if (Array.isArray(disputesResponse)) {
      return disputesResponse;
    }
    return [];
  }, [disputesResponse]);

  const stats: DisputeStats | undefined = useMemo(() => {
    if (!statsResponse) return undefined;
    if (statsResponse.data?.data && typeof statsResponse.data.data === 'object') {
      return statsResponse.data.data;
    }
    if (statsResponse.data && typeof statsResponse.data === 'object' && !Array.isArray(statsResponse.data)) {
      return statsResponse.data;
    }
    return undefined;
  }, [statsResponse]);

  // Filter disputes
  const filteredDisputes = useMemo(() => {
    return disputes.filter((dispute) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          dispute.disputeNumber?.toLowerCase().includes(query) ||
          dispute.subject?.toLowerCase().includes(query) ||
          dispute.user?.name?.toLowerCase().includes(query) ||
          dispute.order?.orderNumber?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }
      // Type filter
      if (typeFilter && dispute.type !== typeFilter) return false;
      return true;
    }).sort((a, b) => {
      // Sort by priority (urgent first) then by date
      const priorityA = PRIORITY_CONFIG[a.priority]?.weight || 0;
      const priorityB = PRIORITY_CONFIG[b.priority]?.weight || 0;
      if (priorityB !== priorityA) return priorityB - priorityA;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [disputes, searchQuery, typeFilter]);

  // Computed stats
  const computedStats = useMemo(() => {
    const urgent = disputes.filter((d) => d.priority === 'urgent' && !['resolved', 'closed'].includes(d.status)).length;
    const needsAttention = disputes.filter((d) => {
      const hours = dayjs().diff(dayjs(d.createdAt), 'hour');
      return hours > 48 && !['resolved', 'closed'].includes(d.status);
    }).length;
    return { urgent, needsAttention };
  }, [disputes]);

  // Handlers
  const handleViewDispute = (dispute: Dispute) => {
    setSelectedDispute(dispute);
    setDrawerOpen(true);
  };

  const handleStatusChange = (disputeId: string, status: string) => {
    updateMutation.mutate({ id: disputeId, data: { status } });
  };

  const handlePriorityChange = (disputeId: string, priority: string) => {
    updateMutation.mutate({ id: disputeId, data: { priority } });
  };

  const handleResolve = (values: any) => {
    if (!selectedDispute) return;
    resolveMutation.mutate({ id: selectedDispute.id, data: values });
  };

  const handleSendMessage = () => {
    if (!selectedDispute || !messageInput.trim()) return;
    sendMessageMutation.mutate({ id: selectedDispute.id, content: messageInput.trim() });
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedDispute(null);
  };

  // Table columns
  const columns: ColumnsType<Dispute> = [
    {
      title: 'Dispute',
      key: 'dispute',
      render: (_, record) => {
        const typeInfo = TYPE_CONFIG[record.type] || TYPE_CONFIG.other;
        const ageBadge = getAgeBadge(record.createdAt);
        return (
          <div className="flex items-center gap-3">
            <Avatar src={record.user?.avatar} icon={<UserOutlined />} />
            <div>
              <div className="flex items-center gap-2">
                <Text strong>#{record.disputeNumber}</Text>
                <Tag color={ageBadge.color} className="text-xs">{ageBadge.text}</Tag>
              </div>
              <Text className="text-sm block" ellipsis style={{ maxWidth: 250 }}>{record.subject}</Text>
              <Text type="secondary" className="text-xs">
                {record.user?.name} • {typeInfo.icon} {typeInfo.label}
              </Text>
            </div>
          </div>
        );
      },
    },
    {
      title: 'Order',
      dataIndex: ['order', 'orderNumber'],
      render: (orderNumber, record) => (
        <div>
          <Text className="text-sm">#{orderNumber || 'N/A'}</Text>
          {record.order?.total && (
            <Text type="secondary" className="text-xs block">
              {formatCurrency(record.order.total)}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (status) => {
        const statusInfo = STATUS_CONFIG[status] || STATUS_CONFIG.open;
        return (
          <Tag color={statusInfo.color} icon={statusInfo.icon}>
            {status.replace('_', ' ').toUpperCase()}
          </Tag>
        );
      },
      filters: Object.keys(STATUS_CONFIG).map((key) => ({ text: key.replace('_', ' ').toUpperCase(), value: key })),
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      render: (priority) => {
        const priorityInfo = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
        return (
          <Tag color={priorityInfo.color}>
            {priority === 'urgent' && <FireOutlined className="mr-1" />}
            {priority === 'high' && <ExclamationCircleOutlined className="mr-1" />}
            {priorityInfo.label}
          </Tag>
        );
      },
      sorter: (a, b) => (PRIORITY_CONFIG[b.priority]?.weight || 0) - (PRIORITY_CONFIG[a.priority]?.weight || 0),
    },
    {
      title: 'Amount',
      dataIndex: 'requestedAmount',
      render: (amount) => amount ? formatCurrency(amount) : '-',
      sorter: (a, b) => (a.requestedAmount || 0) - (b.requestedAmount || 0),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      render: (date) => (
        <Tooltip title={dayjs(date).format('MMM D, YYYY h:mm A')}>
          {dayjs(date).fromNow()}
        </Tooltip>
      ),
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button type="primary" size="small" icon={<EyeOutlined />} onClick={() => handleViewDispute(record)}>
          View
        </Button>
      ),
    },
  ];

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen flex-col gap-3">
        <Spin size="large" />
        <Text type="secondary">Loading disputes...</Text>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Title level={2} className="!mb-1 flex items-center gap-3">
            <SafetyOutlined />
            Dispute Management
          </Title>
          <Text type="secondary">Monitor and resolve customer disputes efficiently</Text>
        </div>
        <Space>
          {computedStats.urgent > 0 && (
            <Badge count={computedStats.urgent} overflowCount={99}>
              <Tag color="error" icon={<FireOutlined />} className="px-3 py-1">
                Urgent
              </Tag>
            </Badge>
          )}
          {computedStats.needsAttention > 0 && (
            <Badge count={computedStats.needsAttention} overflowCount={99}>
              <Tag color="warning" icon={<ClockCircleOutlined />} className="px-3 py-1">
                Needs Attention
              </Tag>
            </Badge>
          )}
        </Space>
      </div>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card className="h-full" hoverable>
            <Statistic
              title={<span className="text-gray-500">Total Disputes</span>}
              value={stats?.total || disputes.length || 0}
              prefix={<FileTextOutlined className="text-blue-500" />}
            />
            <div className="mt-2">
              <Text type="secondary" className="text-xs">All time</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="h-full border-l-4 border-l-yellow-400" hoverable>
            <Statistic
              title={<span className="text-gray-500">Open Disputes</span>}
              value={stats?.open || disputes.filter(d => d.status === 'open').length || 0}
              prefix={<InboxOutlined className="text-yellow-500" />}
              styles={{ content: { color: '#faad14' } }}
            />
            <div className="mt-2">
              <Text type="secondary" className="text-xs">Awaiting action</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="h-full border-l-4 border-l-blue-400" hoverable>
            <Statistic
              title={<span className="text-gray-500">Under Review</span>}
              value={stats?.underReview || disputes.filter(d => ['under_review', 'awaiting_response'].includes(d.status)).length || 0}
              prefix={<SyncOutlined spin className="text-blue-500" />}
              styles={{ content: { color: '#1890ff' } }}
            />
            <div className="mt-2">
              <Text type="secondary" className="text-xs">In progress</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="h-full border-l-4 border-l-green-400" hoverable>
            <Statistic
              title={<span className="text-gray-500">Total Refunded</span>}
              value={stats?.totalRefunded || 0}
              prefix={<DollarOutlined className="text-green-500" />}
              styles={{ content: { color: '#52c41a' } }}
              formatter={(value) => `₦${Number(value).toLocaleString()}`}
            />
            <div className="mt-2">
              <Text type="secondary" className="text-xs">Customer refunds</Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Filters & View Toggle */}
      <Card className="mb-6">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={8}>
            <Input
              placeholder="Search disputes..."
              prefix={<SearchOutlined className="text-gray-400" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
              size="large"
            />
          </Col>
          <Col xs={24} md={16}>
            <div className="flex flex-wrap items-center gap-3 justify-end">
              <Select
                placeholder="Status"
                style={{ width: 150 }}
                allowClear
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: 'open', label: '🟡 Open' },
                  { value: 'under_review', label: '🔵 Under Review' },
                  { value: 'awaiting_response', label: '🟣 Awaiting Response' },
                  { value: 'escalated', label: '🔴 Escalated' },
                  { value: 'resolved', label: '🟢 Resolved' },
                  { value: 'closed', label: '⚫ Closed' },
                ]}
              />
              <Select
                placeholder="Priority"
                style={{ width: 130 }}
                allowClear
                value={priorityFilter}
                onChange={setPriorityFilter}
                options={[
                  { value: 'urgent', label: '🔥 Urgent' },
                  { value: 'high', label: '⚠️ High' },
                  { value: 'medium', label: '📋 Medium' },
                  { value: 'low', label: '📄 Low' },
                ]}
              />
              <Select
                placeholder="Type"
                style={{ width: 160 }}
                allowClear
                value={typeFilter}
                onChange={setTypeFilter}
                options={Object.entries(TYPE_CONFIG).map(([key, config]) => ({
                  value: key,
                  label: `${config.icon} ${config.label}`,
                }))}
              />
              <span className="inline-block w-px h-8 bg-gray-300 mx-2" />
              <Segmented
                value={viewMode}
                onChange={(value) => setViewMode(value as 'cards' | 'table')}
                options={[
                  { value: 'cards', icon: <AppstoreOutlined /> },
                  { value: 'table', icon: <UnorderedListOutlined /> },
                ]}
              />
              <Button
                icon={<ReloadOutlined spin={isFetching} />}
                onClick={() => refetch()}
              >
                Refresh
              </Button>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Results Summary */}
      <div className="mb-4 flex items-center justify-between">
        <Text type="secondary">
          Showing <Text strong>{filteredDisputes.length}</Text> of <Text strong>{disputes.length}</Text> disputes
        </Text>
        {(statusFilter || priorityFilter || typeFilter || searchQuery) && (
          <Button
            type="link"
            size="small"
            onClick={() => {
              setStatusFilter(undefined);
              setPriorityFilter(undefined);
              setTypeFilter(undefined);
              setSearchQuery('');
            }}
          >
            Clear all filters
          </Button>
        )}
      </div>

      {/* Disputes List */}
      <Card styles={{ body: { padding: viewMode === 'table' ? 0 : undefined } }}>
        {error ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Space orientation="vertical" align="center">
                <Text type="danger">Error loading disputes</Text>
                <Text type="secondary">
                  {(error as any)?.response?.status === 401
                    ? 'Please log in to view disputes'
                    : (error as any)?.response?.data?.message || 'An error occurred'}
                </Text>
                <Button type="primary" onClick={() => refetch()}>
                  Try Again
                </Button>
              </Space>
            }
          />
        ) : filteredDisputes.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Space orientation="vertical" align="center">
                <Text type="secondary">
                  {disputes.length === 0 ? 'No disputes yet' : 'No matching disputes found'}
                </Text>
                {(statusFilter || priorityFilter || typeFilter || searchQuery) && (
                  <Button
                    type="link"
                    onClick={() => {
                      setStatusFilter(undefined);
                      setPriorityFilter(undefined);
                      setTypeFilter(undefined);
                      setSearchQuery('');
                    }}
                  >
                    Clear filters
                  </Button>
                )}
              </Space>
            }
          />
        ) : viewMode === 'table' ? (
          <Table
            dataSource={filteredDisputes}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `${total} disputes` }}
            onRow={(record) => ({ onClick: () => handleViewDispute(record), style: { cursor: 'pointer' } })}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredDisputes.map((dispute) => {
              const typeInfo = TYPE_CONFIG[dispute.type] || TYPE_CONFIG.other;
              const statusInfo = STATUS_CONFIG[dispute.status] || STATUS_CONFIG.open;
              const priorityInfo = PRIORITY_CONFIG[dispute.priority] || PRIORITY_CONFIG.medium;
              const ageBadge = getAgeBadge(dispute.createdAt);

              return (
                <Card
                  key={dispute.id}
                  hoverable
                  onClick={() => handleViewDispute(dispute)}
                  className="cursor-pointer transition-all hover:shadow-lg"
                  style={{ borderLeft: `4px solid ${statusInfo.color === 'warning' ? '#faad14' : statusInfo.color === 'processing' ? '#1890ff' : statusInfo.color === 'success' ? '#52c41a' : statusInfo.color === 'error' ? '#ff4d4f' : '#d9d9d9'}` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Avatar src={dispute.user?.avatar} icon={<UserOutlined />} size={40} />
                      <div>
                        <Text strong className="block">#{dispute.disputeNumber}</Text>
                        <Text type="secondary" className="text-xs">{dispute.user?.name || 'Unknown'}</Text>
                      </div>
                    </div>
                    <Tag color={ageBadge.color} className="text-xs">{ageBadge.text}</Tag>
                  </div>

                  <div className="mb-3">
                    <Text className="block mb-1 font-medium" ellipsis>{dispute.subject}</Text>
                    <Space size={[4, 4]} wrap>
                      <Tag color={typeInfo.color} className="text-xs">
                        {typeInfo.icon} {typeInfo.label}
                      </Tag>
                      <Tag color={statusInfo.color} icon={statusInfo.icon} className="text-xs">
                        {dispute.status.replace('_', ' ').toUpperCase()}
                      </Tag>
                      <Tag color={priorityInfo.color} className="text-xs">
                        {dispute.priority === 'urgent' && <FireOutlined className="mr-1" />}
                        {priorityInfo.label}
                      </Tag>
                    </Space>
                  </div>

                  <Divider className="my-3" />

                  <div className="flex items-center justify-between text-xs">
                    <Space separator={<span className="inline-block w-px h-3 bg-gray-300" />}>
                      <Tooltip title="Order">
                        <Text type="secondary">
                          <ShoppingOutlined className="mr-1" />
                          #{dispute.order?.orderNumber || 'N/A'}
                        </Text>
                      </Tooltip>
                      {dispute.requestedAmount && (
                        <Tooltip title="Requested Amount">
                          <Text type="secondary">
                            <DollarOutlined className="mr-1" />
                            {formatCurrency(dispute.requestedAmount)}
                          </Text>
                        </Tooltip>
                      )}
                      {dispute.messages && dispute.messages.length > 0 && (
                        <Tooltip title="Messages">
                          <Text type="secondary">
                            <MessageOutlined className="mr-1" />
                            {dispute.messages.length}
                          </Text>
                        </Tooltip>
                      )}
                      {dispute.images && dispute.images.length > 0 && (
                        <Tooltip title="Attachments">
                          <Text type="secondary">
                            <PictureOutlined className="mr-1" />
                            {dispute.images.length}
                          </Text>
                        </Tooltip>
                      )}
                    </Space>
                    <Tooltip title={dayjs(dispute.createdAt).format('MMM D, YYYY h:mm A')}>
                      <Text type="secondary">
                        <FieldTimeOutlined className="mr-1" />
                        {dayjs(dispute.createdAt).fromNow()}
                      </Text>
                    </Tooltip>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Card>

      {/* Dispute Detail Drawer */}
      <Drawer
        title={
          <div className="flex items-center gap-3">
            <SafetyOutlined className="text-xl" />
            <div>
              <Text strong className="block">Dispute #{selectedDispute?.disputeNumber}</Text>
              <Text type="secondary" className="text-xs">{dayjs(selectedDispute?.createdAt).format('MMM D, YYYY h:mm A')}</Text>
            </div>
          </div>
        }
        placement="right"
        size="large"
        open={drawerOpen}
        onClose={closeDrawer}
        extra={
          selectedDispute && !['resolved', 'closed'].includes(selectedDispute.status) && (
            <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => setResolveModalOpen(true)}>
              Resolve Dispute
            </Button>
          )
        }
      >
        {selectedDispute && (
          <div className="space-y-4">
            {/* Status Banner */}
            {['resolved', 'closed'].includes(selectedDispute.status) && (
              <div
                className="p-4 rounded-lg text-center"
                style={{ backgroundColor: STATUS_CONFIG[selectedDispute.status]?.bgColor }}
              >
                <Tag color={STATUS_CONFIG[selectedDispute.status]?.color} icon={STATUS_CONFIG[selectedDispute.status]?.icon} className="text-base px-4 py-1">
                  {selectedDispute.status.replace('_', ' ').toUpperCase()}
                </Tag>
                {selectedDispute.resolvedAt && (
                  <Text type="secondary" className="block mt-2 text-xs">
                    Resolved on {dayjs(selectedDispute.resolvedAt).format('MMM D, YYYY h:mm A')}
                  </Text>
                )}
              </div>
            )}

            {/* Status & Priority Controls */}
            {!['resolved', 'closed'].includes(selectedDispute.status) && (
              <Card size="small" title="Quick Actions">
                <Row gutter={16}>
                  <Col span={12}>
                    <Text type="secondary" className="block mb-2 text-xs">Status</Text>
                    <Select
                      value={selectedDispute.status}
                      onChange={(value) => handleStatusChange(selectedDispute.id, value)}
                      style={{ width: '100%' }}
                      loading={updateMutation.isPending}
                      options={[
                        { value: 'open', label: '🟡 Open' },
                        { value: 'under_review', label: '🔵 Under Review' },
                        { value: 'awaiting_response', label: '🟣 Awaiting Response' },
                        { value: 'escalated', label: '🔴 Escalated' },
                      ]}
                    />
                  </Col>
                  <Col span={12}>
                    <Text type="secondary" className="block mb-2 text-xs">Priority</Text>
                    <Select
                      value={selectedDispute.priority}
                      onChange={(value) => handlePriorityChange(selectedDispute.id, value)}
                      style={{ width: '100%' }}
                      loading={updateMutation.isPending}
                      options={[
                        { value: 'urgent', label: '🔥 Urgent' },
                        { value: 'high', label: '⚠️ High' },
                        { value: 'medium', label: '📋 Medium' },
                        { value: 'low', label: '📄 Low' },
                      ]}
                    />
                  </Col>
                </Row>
              </Card>
            )}

            {/* Customer Info */}
            <Card size="small" title={<><UserOutlined className="mr-2" />Customer Information</>}>
              <div className="flex items-center gap-4">
                <Avatar src={selectedDispute.user?.avatar} icon={<UserOutlined />} size={56} />
                <div className="flex-1">
                  <Text strong className="text-base block">{selectedDispute.user?.name || 'Unknown'}</Text>
                  <Text type="secondary" className="block">{selectedDispute.user?.email}</Text>
                  <Text type="secondary">{selectedDispute.user?.phone}</Text>
                </div>
              </div>
            </Card>

            {/* Order Info */}
            {selectedDispute.order && (
              <Card size="small" title={<><ShoppingOutlined className="mr-2" />Related Order</>}>
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="Order #">
                    <Text strong>#{selectedDispute.order.orderNumber}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Total">
                    <Text strong type="success">{formatCurrency(selectedDispute.order.total)}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Status">
                    <Tag>{selectedDispute.order.status?.toUpperCase()}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Items">
                    {selectedDispute.order.items?.length || 0} items
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            )}

            {/* Dispute Details */}
            <Card size="small" title={<><FileTextOutlined className="mr-2" />Dispute Details</>}>
              <div className="space-y-3">
                <div>
                  <Text type="secondary" className="text-xs block mb-1">Type</Text>
                  <Tag color={TYPE_CONFIG[selectedDispute.type]?.color} className="text-sm">
                    {TYPE_CONFIG[selectedDispute.type]?.icon} {TYPE_CONFIG[selectedDispute.type]?.label}
                  </Tag>
                </div>
                <div>
                  <Text type="secondary" className="text-xs block mb-1">Subject</Text>
                  <Text strong>{selectedDispute.subject}</Text>
                </div>
                <div>
                  <Text type="secondary" className="text-xs block mb-1">Description</Text>
                  <Paragraph className="!mb-0 p-3 bg-gray-50 rounded-lg">{selectedDispute.description}</Paragraph>
                </div>
                {selectedDispute.requestedAmount && (
                  <div>
                    <Text type="secondary" className="text-xs block mb-1">Requested Amount</Text>
                    <Text strong className="text-lg text-green-600">{formatCurrency(selectedDispute.requestedAmount)}</Text>
                  </div>
                )}
              </div>
            </Card>

            {/* Images */}
            {selectedDispute.images && selectedDispute.images.length > 0 && (
              <Card size="small" title={<><PictureOutlined className="mr-2" />Attached Evidence ({selectedDispute.images.length})</>}>
                <Image.PreviewGroup>
                  <div className="grid grid-cols-4 gap-2">
                    {selectedDispute.images.map((img, idx) => (
                      <Image
                        key={idx}
                        src={img}
                        width="100%"
                        height={80}
                        style={{ objectFit: 'cover', borderRadius: 8 }}
                        fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgesAKnwNlR8FAAAJ"
                      />
                    ))}
                  </div>
                </Image.PreviewGroup>
              </Card>
            )}

            {/* Resolution (if resolved) */}
            {selectedDispute.resolution && (
              <Card size="small" title={<><CheckCircleOutlined className="mr-2 text-green-500" />Resolution</>} style={{ backgroundColor: '#f6ffed', borderColor: '#b7eb8f' }}>
                <div className="space-y-3">
                  <div>
                    <Text type="secondary" className="text-xs block mb-1">Resolution Type</Text>
                    <Tag color="green" className="text-sm">
                      {RESOLUTION_OPTIONS.find((r) => r.value === selectedDispute.resolution)?.icon}{' '}
                      {RESOLUTION_OPTIONS.find((r) => r.value === selectedDispute.resolution)?.label}
                    </Tag>
                  </div>
                  {selectedDispute.refundedAmount !== undefined && selectedDispute.refundedAmount > 0 && (
                    <div>
                      <Text type="secondary" className="text-xs block mb-1">Refunded Amount</Text>
                      <Text strong className="text-lg text-green-600">{formatCurrency(selectedDispute.refundedAmount)}</Text>
                    </div>
                  )}
                  {selectedDispute.resolutionNotes && (
                    <div>
                      <Text type="secondary" className="text-xs block mb-1">Resolution Notes</Text>
                      <Paragraph className="!mb-0 p-3 bg-green-50 rounded-lg">{selectedDispute.resolutionNotes}</Paragraph>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Messages */}
            <Card
              size="small"
              title={<><MessageOutlined className="mr-2" />Conversation ({selectedDispute.messages?.length || 0})</>}
              styles={{ body: { maxHeight: 300, overflowY: 'auto' } }}
            >
              {selectedDispute.messages && selectedDispute.messages.length > 0 ? (
                <div className="space-y-3">
                  {selectedDispute.messages.map((msg, index) => (
                    <div
                      key={msg.id || `msg-${index}`}
                      className={`p-3 rounded-lg ${
                        msg.senderType === 'admin'
                          ? 'bg-blue-50 ml-8'
                          : msg.senderType === 'system'
                          ? 'bg-gray-100 mx-4 text-center'
                          : 'bg-green-50 mr-8'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Text strong className="text-sm">
                          {msg.senderType === 'system'
                            ? '🤖 System'
                            : msg.senderType === 'admin'
                            ? '👨‍💼 Support'
                            : `👤 ${msg.sender?.name || 'Customer'}`}
                        </Text>
                        <Text type="secondary" className="text-xs">
                          {dayjs(msg.createdAt).format('MMM D, h:mm A')}
                        </Text>
                      </div>
                      <Text>{msg.content}</Text>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty description="No messages yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </Card>

            {/* Send Message */}
            {!['resolved', 'closed'].includes(selectedDispute.status) && (
              <Card size="small" title="Send Message">
                <div className="flex gap-2">
                  <TextArea
                    placeholder="Type your message to the customer..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    autoSize={{ minRows: 2, maxRows: 4 }}
                    className="flex-1"
                    onPressEnter={(e) => {
                      if (!e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handleSendMessage}
                    loading={sendMessageMutation.isPending}
                    disabled={!messageInput.trim()}
                  >
                    Send
                  </Button>
                </div>
                <Text type="secondary" className="text-xs mt-1 block">Press Enter to send, Shift+Enter for new line</Text>
              </Card>
            )}
          </div>
        )}
      </Drawer>

      {/* Resolve Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <CheckCircleOutlined className="text-green-500" />
            Resolve Dispute #{selectedDispute?.disputeNumber}
          </div>
        }
        open={resolveModalOpen}
        onCancel={() => {
          setResolveModalOpen(false);
          form.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleResolve}>
          <Form.Item
            name="resolution"
            label="Resolution Type"
            rules={[{ required: true, message: 'Please select how this dispute was resolved' }]}
          >
            <Select
              placeholder="Select resolution type"
              options={RESOLUTION_OPTIONS.map((opt) => ({
                value: opt.value,
                label: (
                  <span>
                    {opt.icon} {opt.label}
                  </span>
                ),
              }))}
            />
          </Form.Item>

          <Form.Item
            name="refundedAmount"
            label="Refund Amount"
            extra="Enter the amount refunded to the customer (if applicable)"
          >
            <InputNumber
              prefix="₦"
              style={{ width: '100%' }}
              min={0}
              max={selectedDispute?.order?.total || selectedDispute?.requestedAmount || 1000000}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => Number(value?.replace(/,/g, '') || 0)}
              placeholder="0"
            />
          </Form.Item>

          <Form.Item
            name="resolutionNotes"
            label="Resolution Notes"
            rules={[
              { required: true, message: 'Please explain how this dispute was resolved' },
              { min: 20, message: 'Please provide more detail (at least 20 characters)' },
            ]}
          >
            <TextArea
              rows={4}
              placeholder="Describe the resolution, actions taken, and any relevant details for record keeping..."
              showCount
              maxLength={1000}
            />
          </Form.Item>

          <Divider />

          <Form.Item className="!mb-0">
            <div className="flex justify-end gap-2">
              <Button onClick={() => setResolveModalOpen(false)}>Cancel</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={resolveMutation.isPending}
                icon={<CheckCircleOutlined />}
              >
                Mark as Resolved
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
