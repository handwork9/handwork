'use client';

import { useState } from 'react';
import {
  Card,
  Table,
  Tag,
  Space,
  Button,
  Select,
  Typography,
  message,
  Avatar,
  Drawer,
  Descriptions,
  Modal,
  Input,
  Statistic,
  Row,
  Col,
  Timeline,
  Alert,
} from 'antd';
import {
  DeleteOutlined,
  UserOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  EyeOutlined,
  MailOutlined,
  PhoneOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface DeletionRequest {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    avatar?: string;
    createdAt: string;
  };
  reason: string;
  additionalInfo?: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  reviewedBy?: string;
  reviewedAt?: string;
  adminNotes?: string;
  scheduledDeletionDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface DeletionStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  completed: number;
}

const statusColors: Record<string, string> = {
  pending: 'orange',
  approved: 'green',
  rejected: 'red',
  completed: 'default',
};

const statusIcons: Record<string, React.ReactNode> = {
  pending: <ClockCircleOutlined />,
  approved: <CheckCircleOutlined />,
  rejected: <CloseCircleOutlined />,
  completed: <DeleteOutlined />,
};

const reasonLabels: Record<string, string> = {
  not_using: 'Not using the app anymore',
  privacy_concerns: 'Privacy concerns',
  found_alternative: 'Found a better alternative',
  poor_experience: 'Poor user experience',
  too_many_notifications: 'Too many notifications',
  security_concerns: 'Security concerns',
  other: 'Other reason',
};

const getRoleColor = (role: string) => {
  const colors: Record<string, string> = {
    admin: 'purple',
    buyer: 'blue',
    farmer: 'green',
    rider: 'orange',
  };
  return colors[role] || 'default';
};

export default function AccountDeletionsPage() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedRequest, setSelectedRequest] = useState<DeletionRequest | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [adminNotes, setAdminNotes] = useState('');
  const queryClient = useQueryClient();

  // Fetch deletion requests
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['deletion-requests', { status: statusFilter, page, pageSize }],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, limit: pageSize };
      if (statusFilter) params.status = statusFilter;
      const response = await adminApi.getDeletionRequests(params);
      return response.data.data;
    },
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['deletion-requests-stats'],
    queryFn: async () => {
      const response = await adminApi.getDeletionRequestStats();
      return response.data.data as DeletionStats;
    },
  });

  // Review mutation
  const reviewMutation = useMutation({
    mutationFn: ({ requestId, action, adminNotes }: { requestId: string; action: 'approve' | 'reject'; adminNotes?: string }) =>
      adminApi.reviewDeletionRequest(requestId, { action, adminNotes }),
    onSuccess: (_, variables) => {
      message.success(`Request ${variables.action === 'approve' ? 'approved' : 'rejected'} successfully`);
      queryClient.invalidateQueries({ queryKey: ['deletion-requests'] });
      queryClient.invalidateQueries({ queryKey: ['deletion-requests-stats'] });
      setReviewModalVisible(false);
      setDrawerVisible(false);
      setAdminNotes('');
    },
    onError: () => {
      message.error('Failed to process request');
    },
  });

  const handleViewRequest = (request: DeletionRequest) => {
    setSelectedRequest(request);
    setDrawerVisible(true);
  };

  const handleReview = (action: 'approve' | 'reject') => {
    setReviewAction(action);
    setReviewModalVisible(true);
  };

  const confirmReview = () => {
    if (!selectedRequest) return;
    reviewMutation.mutate({
      requestId: selectedRequest.id,
      action: reviewAction,
      adminNotes: adminNotes || undefined,
    });
  };

  const columns: ColumnsType<DeletionRequest> = [
    {
      title: 'User',
      key: 'user',
      render: (_, record) => (
        <Space>
          <Avatar 
            src={record.user?.avatar} 
            icon={<UserOutlined />}
            style={{ backgroundColor: getRoleColor(record.user?.role) === 'default' ? '#1890ff' : undefined }}
          />
          <div>
            <Text strong>{record.user?.name || 'Unknown User'}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.user?.email}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Role',
      key: 'role',
      render: (_, record) => (
        <Tag color={getRoleColor(record.user?.role)}>
          {record.user?.role?.toUpperCase() || 'N/A'}
        </Tag>
      ),
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      render: (reason: string) => (
        <Text>{reasonLabels[reason] || reason}</Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag icon={statusIcons[status]} color={statusColors[status]}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Requested',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => (
        <div>
          <Text>{dayjs(date).format('MMM DD, YYYY')}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {dayjs(date).fromNow()}
          </Text>
        </div>
      ),
      sorter: true,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleViewRequest(record)}
          />
          {record.status === 'pending' && (
            <>
              <Button
                type="text"
                icon={<CheckCircleOutlined />}
                style={{ color: '#52c41a' }}
                onClick={() => {
                  setSelectedRequest(record);
                  handleReview('approve');
                }}
              />
              <Button
                type="text"
                icon={<CloseCircleOutlined />}
                danger
                onClick={() => {
                  setSelectedRequest(record);
                  handleReview('reject');
                }}
              />
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>
          <DeleteOutlined style={{ marginRight: 12, color: '#ff4d4f' }} />
          Account Deletion Requests
        </Title>
        <Text type="secondary">
          Review and manage account deletion requests from users
        </Text>
      </div>

      {/* Stats Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Requests"
              value={stats?.total || 0}
              prefix={<DeleteOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Pending"
              value={stats?.pending || 0}
              valueStyle={{ color: '#faad14' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Approved"
              value={stats?.approved || 0}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Rejected"
              value={stats?.rejected || 0}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 24 }}>
        <Space wrap>
          <Select
            placeholder="Filter by status"
            allowClear
            style={{ width: 160 }}
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}
            options={[
              { value: 'pending', label: 'Pending' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' },
              { value: 'completed', label: 'Completed' },
            ]}
          />
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
            Refresh
          </Button>
        </Space>
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={data?.items || []}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: page,
            pageSize,
            total: data?.total || 0,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} requests`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
        />
      </Card>

      {/* Details Drawer */}
      <Drawer
        title="Deletion Request Details"
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        width={500}
        extra={
          selectedRequest?.status === 'pending' && (
            <Space>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => handleReview('approve')}
              >
                Approve
              </Button>
              <Button
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => handleReview('reject')}
              >
                Reject
              </Button>
            </Space>
          )
        }
      >
        {selectedRequest && (
          <>
            <Alert
              message={`Status: ${selectedRequest.status.toUpperCase()}`}
              type={
                selectedRequest.status === 'pending'
                  ? 'warning'
                  : selectedRequest.status === 'approved'
                  ? 'success'
                  : selectedRequest.status === 'rejected'
                  ? 'error'
                  : 'info'
              }
              showIcon
              style={{ marginBottom: 24 }}
            />

            <Descriptions column={1} bordered size="small" title="User Information">
              <Descriptions.Item label="Name">
                <Space>
                  <Avatar src={selectedRequest.user?.avatar} icon={<UserOutlined />} />
                  {selectedRequest.user?.name}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                <Space>
                  <MailOutlined />
                  {selectedRequest.user?.email}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Phone">
                <Space>
                  <PhoneOutlined />
                  {selectedRequest.user?.phone}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Role">
                <Tag color={getRoleColor(selectedRequest.user?.role)}>
                  {selectedRequest.user?.role?.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Member Since">
                {dayjs(selectedRequest.user?.createdAt).format('MMM DD, YYYY')}
              </Descriptions.Item>
            </Descriptions>

            <Descriptions column={1} bordered size="small" title="Request Details" style={{ marginTop: 24 }}>
              <Descriptions.Item label="Reason">
                <Tag color="red">{reasonLabels[selectedRequest.reason] || selectedRequest.reason}</Tag>
              </Descriptions.Item>
              {selectedRequest.additionalInfo && (
                <Descriptions.Item label="Additional Info">
                  <Paragraph style={{ margin: 0 }}>{selectedRequest.additionalInfo}</Paragraph>
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Requested On">
                {dayjs(selectedRequest.createdAt).format('MMM DD, YYYY HH:mm')}
              </Descriptions.Item>
            </Descriptions>

            {(selectedRequest.status === 'approved' || selectedRequest.status === 'rejected') && (
              <Descriptions column={1} bordered size="small" title="Review Details" style={{ marginTop: 24 }}>
                <Descriptions.Item label="Reviewed On">
                  {selectedRequest.reviewedAt
                    ? dayjs(selectedRequest.reviewedAt).format('MMM DD, YYYY HH:mm')
                    : 'N/A'}
                </Descriptions.Item>
                {selectedRequest.adminNotes && (
                  <Descriptions.Item label="Admin Notes">
                    <Paragraph style={{ margin: 0 }}>{selectedRequest.adminNotes}</Paragraph>
                  </Descriptions.Item>
                )}
                {selectedRequest.scheduledDeletionDate && (
                  <Descriptions.Item label="Scheduled Deletion">
                    <Text type="danger">
                      {dayjs(selectedRequest.scheduledDeletionDate).format('MMM DD, YYYY')}
                    </Text>
                  </Descriptions.Item>
                )}
              </Descriptions>
            )}

            <div style={{ marginTop: 24 }}>
              <Title level={5}>Timeline</Title>
              <Timeline
                items={[
                  {
                    color: 'blue',
                    children: (
                      <>
                        <Text strong>Request Submitted</Text>
                        <br />
                        <Text type="secondary">
                          {dayjs(selectedRequest.createdAt).format('MMM DD, YYYY HH:mm')}
                        </Text>
                      </>
                    ),
                  },
                  ...(selectedRequest.status !== 'pending'
                    ? [
                        {
                          color: selectedRequest.status === 'approved' ? 'green' : 'red',
                          children: (
                            <>
                              <Text strong>
                                {selectedRequest.status === 'approved' ? 'Approved' : 'Rejected'} by Admin
                              </Text>
                              <br />
                              <Text type="secondary">
                                {selectedRequest.reviewedAt
                                  ? dayjs(selectedRequest.reviewedAt).format('MMM DD, YYYY HH:mm')
                                  : 'N/A'}
                              </Text>
                            </>
                          ),
                        },
                      ]
                    : []),
                  ...(selectedRequest.status === 'completed'
                    ? [
                        {
                          color: 'gray',
                          children: (
                            <>
                              <Text strong>Account Deleted</Text>
                              <br />
                              <Text type="secondary">
                                {selectedRequest.scheduledDeletionDate
                                  ? dayjs(selectedRequest.scheduledDeletionDate).format('MMM DD, YYYY')
                                  : 'N/A'}
                              </Text>
                            </>
                          ),
                        },
                      ]
                    : []),
                ]}
              />
            </div>
          </>
        )}
      </Drawer>

      {/* Review Modal */}
      <Modal
        title={
          <Space>
            {reviewAction === 'approve' ? (
              <CheckCircleOutlined style={{ color: '#52c41a' }} />
            ) : (
              <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
            )}
            {reviewAction === 'approve' ? 'Approve Deletion Request' : 'Reject Deletion Request'}
          </Space>
        }
        open={reviewModalVisible}
        onCancel={() => {
          setReviewModalVisible(false);
          setAdminNotes('');
        }}
        onOk={confirmReview}
        confirmLoading={reviewMutation.isPending}
        okText={reviewAction === 'approve' ? 'Approve' : 'Reject'}
        okButtonProps={{
          danger: reviewAction === 'reject',
        }}
      >
        {reviewAction === 'approve' ? (
          <Alert
            message="Warning"
            description="Approving this request will schedule the user's account for permanent deletion. This action cannot be undone."
            type="warning"
            showIcon
            icon={<ExclamationCircleOutlined />}
            style={{ marginBottom: 16 }}
          />
        ) : (
          <Alert
            message="Rejection"
            description="The user will be notified that their deletion request has been rejected."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <div>
          <Text strong>Admin Notes (optional)</Text>
          <TextArea
            rows={4}
            placeholder={
              reviewAction === 'approve'
                ? 'Add any notes about this approval...'
                : 'Provide a reason for rejection...'
            }
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            style={{ marginTop: 8 }}
          />
        </div>
      </Modal>
    </div>
  );
}
