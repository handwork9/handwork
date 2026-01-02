'use client';

import { useState } from 'react';
import {
  Row,
  Col,
  Card,
  Statistic,
  Typography,
  Table,
  Tag,
  Space,
  Button,
  Select,
  DatePicker,
  Modal,
  Input,
  Image,
  Tabs,
  Avatar,
  Badge,
  Tooltip,
  message,
  Descriptions,
  Timeline,
} from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  UserOutlined,
  WarningOutlined,
  FileTextOutlined,
  PictureOutlined,
  CommentOutlined,
  ShopOutlined,
  ReloadOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import dayjs from 'dayjs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const COLORS = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6'];

const CONTENT_TYPE_LABELS: Record<string, string> = {
  product: 'Product',
  review: 'Review',
  social_post: 'Social Post',
  farm_story: 'Farm Story',
  comment: 'Comment',
  user_profile: 'User Profile',
  chat_message: 'Chat Message',
};

const CONTENT_TYPE_ICONS: Record<string, React.ReactNode> = {
  product: <ShopOutlined />,
  review: <CommentOutlined />,
  social_post: <FileTextOutlined />,
  farm_story: <PictureOutlined />,
  comment: <CommentOutlined />,
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'blue',
  approved: 'green',
  rejected: 'red',
  flagged: 'orange',
  under_review: 'purple',
  auto_approved: 'cyan',
  auto_rejected: 'magenta',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: 'default',
  medium: 'blue',
  high: 'orange',
  urgent: 'red',
};

const REASON_LABELS: Record<string, string> = {
  inappropriate_content: 'Inappropriate Content',
  spam: 'Spam',
  misleading: 'Misleading',
  offensive_language: 'Offensive Language',
  fake_product: 'Fake Product',
  price_gouging: 'Price Gouging',
  prohibited_item: 'Prohibited Item',
  harassment: 'Harassment',
  hate_speech: 'Hate Speech',
  violence: 'Violence',
  copyright: 'Copyright',
  adult_content: 'Adult Content',
  scam: 'Scam',
  policy_violation: 'Policy Violation',
  other: 'Other',
};

export default function ContentModerationPage() {
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [contentTypeFilter, setContentTypeFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [priorityFilter, setPriorityFilter] = useState<string | undefined>();
  const [rejectReason, setRejectReason] = useState<string>('');
  const [rejectNotes, setRejectNotes] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  const getDateParams = () => {
    if (dateRange) {
      return {
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD'),
      };
    }
    return {};
  };

  // Fetch stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['moderation-stats', dateRange],
    queryFn: async () => {
      const params = getDateParams();
      const response = await api.get('/admin/moderation/stats', { params });
      return response.data;
    },
  });

  // Fetch queue
  const { data: queueData, isLoading: queueLoading } = useQuery({
    queryKey: ['moderation-queue', page, contentTypeFilter, statusFilter, priorityFilter],
    queryFn: async () => {
      const response = await api.get('/admin/moderation/queue', {
        params: {
          page,
          limit: 20,
          contentType: contentTypeFilter,
          status: statusFilter,
          priority: priorityFilter,
        },
      });
      return response.data;
    },
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const response = await api.put(`/admin/moderation/items/${id}/approve`, { notes });
      return response.data;
    },
    onSuccess: () => {
      message.success('Content approved');
      queryClient.invalidateQueries({ queryKey: ['moderation-queue'] });
      queryClient.invalidateQueries({ queryKey: ['moderation-stats'] });
      setDetailsModalOpen(false);
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason, notes, removeContent, warnUser, suspendUser }: any) => {
      const response = await api.put(`/admin/moderation/items/${id}/reject`, {
        reason,
        notes,
        removeContent,
        warnUser,
        suspendUser,
      });
      return response.data;
    },
    onSuccess: () => {
      message.success('Content rejected');
      queryClient.invalidateQueries({ queryKey: ['moderation-queue'] });
      queryClient.invalidateQueries({ queryKey: ['moderation-stats'] });
      setRejectModalOpen(false);
      setDetailsModalOpen(false);
    },
  });

  // Bulk approve mutation
  const bulkApproveMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await api.post('/admin/moderation/bulk/approve', { ids });
      return response.data;
    },
    onSuccess: (data) => {
      message.success(`Approved ${data.success} items`);
      queryClient.invalidateQueries({ queryKey: ['moderation-queue'] });
      queryClient.invalidateQueries({ queryKey: ['moderation-stats'] });
      setSelectedIds([]);
    },
  });

  // Bulk reject mutation
  const bulkRejectMutation = useMutation({
    mutationFn: async ({ ids, reason }: { ids: string[]; reason: string }) => {
      const response = await api.post('/admin/moderation/bulk/reject', { ids, reason });
      return response.data;
    },
    onSuccess: (data) => {
      message.success(`Rejected ${data.success} items`);
      queryClient.invalidateQueries({ queryKey: ['moderation-queue'] });
      queryClient.invalidateQueries({ queryKey: ['moderation-stats'] });
      setSelectedIds([]);
    },
  });

  const columns = [
    {
      title: 'Content',
      key: 'content',
      render: (_: any, record: any) => (
        <Space>
          <Avatar icon={CONTENT_TYPE_ICONS[record.contentType] || <FileTextOutlined />} />
          <Space direction="vertical" size={0}>
            <Text strong>{record.title || 'Untitled'}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {CONTENT_TYPE_LABELS[record.contentType] || record.contentType}
            </Text>
          </Space>
        </Space>
      ),
    },
    {
      title: 'Preview',
      dataIndex: 'contentPreview',
      key: 'preview',
      render: (preview: string) => (
        <Paragraph ellipsis={{ rows: 2 }} style={{ margin: 0, maxWidth: 200 }}>
          {preview || '-'}
        </Paragraph>
      ),
    },
    {
      title: 'Author',
      key: 'author',
      render: (_: any, record: any) => (
        <Space>
          <UserOutlined />
          <Text>{record.author?.fullName || 'Unknown'}</Text>
        </Space>
      ),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => (
        <Tag color={PRIORITY_COLORS[priority]}>{priority.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={STATUS_COLORS[status]}>{status.replace('_', ' ').toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Reports',
      key: 'reports',
      render: (_: any, record: any) => (
        <Badge count={record.metadata?.reportCount || 0} showZero color={record.metadata?.reportCount > 0 ? 'red' : 'default'} />
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('MMM D, HH:mm'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              icon={<EyeOutlined />}
              size="small"
              onClick={() => {
                setSelectedItem(record);
                setDetailsModalOpen(true);
              }}
            />
          </Tooltip>
          {(record.status === 'pending' || record.status === 'flagged') && (
            <>
              <Tooltip title="Approve">
                <Button
                  icon={<CheckOutlined />}
                  size="small"
                  type="primary"
                  ghost
                  onClick={() => approveMutation.mutate({ id: record.id })}
                />
              </Tooltip>
              <Tooltip title="Reject">
                <Button
                  icon={<CloseOutlined />}
                  size="small"
                  danger
                  onClick={() => {
                    setSelectedItem(record);
                    setRejectModalOpen(true);
                  }}
                />
              </Tooltip>
            </>
          )}
        </Space>
      ),
    },
  ];

  const pieData = stats?.itemsByType?.map((item: any) => ({
    name: CONTENT_TYPE_LABELS[item.type] || item.type,
    value: parseInt(item.count),
  })) || [];

  const trendData = stats?.moderationTrend?.map((item: any) => ({
    date: dayjs(item.date).format('MMM D'),
    approved: parseInt(item.approved),
    rejected: parseInt(item.rejected),
  })) || [];

  return (
    <div style={{ padding: 24 }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            <WarningOutlined /> Content Moderation
          </Title>
        </Col>
        <Col>
          <Space>
            <RangePicker
              value={dateRange}
              onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={() => queryClient.invalidateQueries({ queryKey: ['moderation-queue'] })}
            >
              Refresh
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic
              title="Total Items"
              value={stats?.totalItems || 0}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic
              title="Pending"
              value={stats?.pendingItems || 0}
              valueStyle={{ color: '#3b82f6' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic
              title="Flagged"
              value={stats?.flaggedItems || 0}
              valueStyle={{ color: '#f59e0b' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic
              title="Approved"
              value={stats?.approvedItems || 0}
              valueStyle={{ color: '#10b981' }}
              prefix={<CheckOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic
              title="Rejected"
              value={stats?.rejectedItems || 0}
              valueStyle={{ color: '#ef4444' }}
              prefix={<CloseOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic
              title="Today"
              value={(stats?.approvedItems || 0) + (stats?.rejectedItems || 0)}
              suffix="reviewed"
            />
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={16}>
          <Card title="Moderation Trend">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <RechartsTooltip />
                <Bar dataKey="approved" name="Approved" fill="#10b981" />
                <Bar dataKey="rejected" name="Rejected" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="By Content Type">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  dataKey="value"
                  label={({ name }) => name}
                >
                  {pieData.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Moderation Queue */}
      <Card
        title="Moderation Queue"
        extra={
          <Space>
            {selectedIds.length > 0 && (
              <>
                <Button
                  type="primary"
                  ghost
                  onClick={() => bulkApproveMutation.mutate(selectedIds)}
                  loading={bulkApproveMutation.isPending}
                >
                  Approve Selected ({selectedIds.length})
                </Button>
                <Button
                  danger
                  onClick={() => {
                    Modal.confirm({
                      title: 'Reject Selected Items',
                      content: (
                        <Select
                          placeholder="Select reason"
                          style={{ width: '100%', marginTop: 8 }}
                          onChange={setRejectReason}
                          options={Object.entries(REASON_LABELS).map(([value, label]) => ({ value, label }))}
                        />
                      ),
                      onOk: () => {
                        if (rejectReason) {
                          bulkRejectMutation.mutate({ ids: selectedIds, reason: rejectReason });
                        }
                      },
                    });
                  }}
                >
                  Reject Selected
                </Button>
              </>
            )}
            <Select
              placeholder="Content Type"
              allowClear
              style={{ width: 140 }}
              onChange={setContentTypeFilter}
              options={Object.entries(CONTENT_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
            />
            <Select
              placeholder="Status"
              allowClear
              style={{ width: 140 }}
              onChange={setStatusFilter}
              options={[
                { label: 'Pending', value: 'pending' },
                { label: 'Flagged', value: 'flagged' },
                { label: 'Approved', value: 'approved' },
                { label: 'Rejected', value: 'rejected' },
              ]}
            />
            <Select
              placeholder="Priority"
              allowClear
              style={{ width: 120 }}
              onChange={setPriorityFilter}
              options={[
                { label: 'Urgent', value: 'urgent' },
                { label: 'High', value: 'high' },
                { label: 'Medium', value: 'medium' },
                { label: 'Low', value: 'low' },
              ]}
            />
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={queueData?.items || []}
          rowKey="id"
          loading={queueLoading}
          rowSelection={{
            selectedRowKeys: selectedIds,
            onChange: (keys) => setSelectedIds(keys as string[]),
          }}
          pagination={{
            current: page,
            total: queueData?.total || 0,
            pageSize: 20,
            onChange: setPage,
            showTotal: (total) => `Total ${total} items`,
          }}
        />
      </Card>

      {/* Details Modal */}
      <Modal
        title="Content Details"
        open={detailsModalOpen}
        onCancel={() => setDetailsModalOpen(false)}
        width={800}
        footer={
          selectedItem?.status === 'pending' || selectedItem?.status === 'flagged' ? (
            <Space>
              <Button onClick={() => setDetailsModalOpen(false)}>Close</Button>
              <Button
                type="primary"
                ghost
                onClick={() => approveMutation.mutate({ id: selectedItem.id })}
                loading={approveMutation.isPending}
              >
                Approve
              </Button>
              <Button
                danger
                onClick={() => setRejectModalOpen(true)}
              >
                Reject
              </Button>
            </Space>
          ) : null
        }
      >
        {selectedItem && (
          <Tabs
            items={[
              {
                key: 'details',
                label: 'Details',
                children: (
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Descriptions column={2} bordered size="small">
                      <Descriptions.Item label="Type">
                        {CONTENT_TYPE_LABELS[selectedItem.contentType]}
                      </Descriptions.Item>
                      <Descriptions.Item label="Status">
                        <Tag color={STATUS_COLORS[selectedItem.status]}>
                          {selectedItem.status.replace('_', ' ').toUpperCase()}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Priority">
                        <Tag color={PRIORITY_COLORS[selectedItem.priority]}>
                          {selectedItem.priority.toUpperCase()}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Reports">
                        {selectedItem.metadata?.reportCount || 0}
                      </Descriptions.Item>
                      <Descriptions.Item label="Author">
                        {selectedItem.author?.fullName || 'Unknown'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Auto Detected">
                        {selectedItem.autoDetected ? <Tag color="blue">Yes</Tag> : <Tag>No</Tag>}
                      </Descriptions.Item>
                      <Descriptions.Item label="Title" span={2}>
                        {selectedItem.title || '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Content Preview" span={2}>
                        <Paragraph>{selectedItem.contentPreview || '-'}</Paragraph>
                      </Descriptions.Item>
                      {selectedItem.reason && (
                        <Descriptions.Item label="Reason" span={2}>
                          <Tag color="red">{REASON_LABELS[selectedItem.reason] || selectedItem.reason}</Tag>
                        </Descriptions.Item>
                      )}
                      {selectedItem.reportReason && (
                        <Descriptions.Item label="Report Reason" span={2}>
                          {selectedItem.reportReason}
                        </Descriptions.Item>
                      )}
                    </Descriptions>
                  </Space>
                ),
              },
              {
                key: 'history',
                label: 'History',
                children: (
                  <Timeline
                    items={selectedItem.history?.map((item: any) => ({
                      color: item.action === 'approved' ? 'green' : item.action === 'rejected' ? 'red' : 'blue',
                      children: (
                        <div>
                          <Text strong>{item.performedByName}</Text>
                          <Text type="secondary" style={{ marginLeft: 8 }}>
                            {dayjs(item.timestamp).format('MMM D, HH:mm')}
                          </Text>
                          <div>{item.details}</div>
                        </div>
                      ),
                    })) || []}
                  />
                ),
              },
              {
                key: 'snapshot',
                label: 'Content Snapshot',
                children: (
                  <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4, fontSize: 12, maxHeight: 400, overflow: 'auto' }}>
                    {JSON.stringify(selectedItem.contentSnapshot, null, 2)}
                  </pre>
                ),
              },
            ]}
          />
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal
        title="Reject Content"
        open={rejectModalOpen}
        onCancel={() => setRejectModalOpen(false)}
        onOk={() => {
          if (!rejectReason) {
            message.error('Please select a reason');
            return;
          }
          rejectMutation.mutate({
            id: selectedItem?.id,
            reason: rejectReason,
            notes: rejectNotes,
            removeContent: true,
          });
        }}
        confirmLoading={rejectMutation.isPending}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text strong>Reason *</Text>
            <Select
              placeholder="Select rejection reason"
              style={{ width: '100%', marginTop: 4 }}
              value={rejectReason}
              onChange={setRejectReason}
              options={Object.entries(REASON_LABELS).map(([value, label]) => ({ value, label }))}
            />
          </div>
          <div>
            <Text strong>Notes</Text>
            <TextArea
              placeholder="Add notes (optional)"
              rows={3}
              style={{ marginTop: 4 }}
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
            />
          </div>
        </Space>
      </Modal>
    </div>
  );
}
