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
  Progress,
  Avatar,
  List,
  Descriptions,
  Badge,
  message,
} from 'antd';
import {
  SearchOutlined,
  TeamOutlined,
  ShoppingOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  ReloadOutlined,
  UserOutlined,
  DollarOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { adminApi, normalizeImageUrl } from '@/lib/api';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

// Types
interface GroupBuyingSession {
  id: string;
  product: {
    id: string;
    title: string;
    images?: string[];
    price: number;
  };
  organizer: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  targetParticipants: number;
  currentParticipants: number;
  discountPercentage: number;
  status: 'open' | 'filled' | 'expired' | 'completed' | 'cancelled';
  expiresAt: string;
  shareCode: string;
  participants?: GroupBuyingParticipant[];
  createdAt: string;
}

interface GroupBuyingParticipant {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  quantity: number;
  hasPaid: boolean;
  joinedAt: string;
}

// Color mappings
const statusColors: Record<string, string> = {
  open: 'processing',
  filled: 'warning',
  expired: 'default',
  completed: 'success',
  cancelled: 'error',
};

const statusLabels: Record<string, string> = {
  open: 'Open',
  filled: 'Filled - Awaiting Payment',
  expired: 'Expired',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export default function GroupBuyingPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal state
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<GroupBuyingSession | null>(null);

  // Queries
  const { data: sessionsData, isLoading, refetch } = useQuery({
    queryKey: ['groupBuyingSessions', page, pageSize, statusFilter],
    queryFn: async () => {
      const response = await adminApi.getGroupBuyingSessions({
        page,
        limit: pageSize,
        status: statusFilter,
      });
      return response.data;
    },
  });

  const { data: statsData } = useQuery({
    queryKey: ['groupBuyingStats'],
    queryFn: async () => {
      try {
        const response = await adminApi.getGroupBuyingStats();
        return response.data;
      } catch {
        return null;
      }
    },
  });

  const handleViewDetails = async (session: GroupBuyingSession) => {
    try {
      const response = await adminApi.getGroupBuyingSession(session.id);
      setSelectedSession(response.data);
      setDetailModalOpen(true);
    } catch {
      message.error('Failed to load session details');
    }
  };

  const sessions = sessionsData?.sessions || sessionsData?.data || [];
  const total = sessionsData?.total || sessions.length;

  // Calculate stats
  const stats = statsData || {
    totalSessions: total,
    activeSessions: sessions.filter((s: GroupBuyingSession) => s.status === 'open').length,
    completedSessions: sessions.filter((s: GroupBuyingSession) => s.status === 'completed').length,
    totalParticipants: sessions.reduce(
      (acc: number, s: GroupBuyingSession) => acc + (s.currentParticipants || 0),
      0
    ),
  };

  const columns: ColumnsType<GroupBuyingSession> = [
    {
      title: 'Product',
      key: 'product',
      render: (_, record) => (
        <Space>
          <Avatar
            src={normalizeImageUrl(record.product?.images?.[0])}
            shape="square"
            size={48}
            icon={<ShoppingOutlined />}
          />
          <Space direction="vertical" size={0}>
            <Text strong ellipsis style={{ maxWidth: 200 }}>
              {record.product?.title}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              ₦{record.product?.price?.toLocaleString()}
            </Text>
          </Space>
        </Space>
      ),
    },
    {
      title: 'Organizer',
      key: 'organizer',
      render: (_, record) => (
        <Space>
          <Avatar
            src={normalizeImageUrl(record.organizer?.avatar)}
            icon={<UserOutlined />}
          />
          <Space direction="vertical" size={0}>
            <Text>{record.organizer?.name}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.organizer?.email}
            </Text>
          </Space>
        </Space>
      ),
    },
    {
      title: 'Participants',
      key: 'participants',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>
            {record.currentParticipants} / {record.targetParticipants}
          </Text>
          <Progress
            percent={Math.round((record.currentParticipants / record.targetParticipants) * 100)}
            size="small"
            showInfo={false}
            status={record.status === 'completed' ? 'success' : 'active'}
          />
        </Space>
      ),
    },
    {
      title: 'Discount',
      dataIndex: 'discountPercentage',
      key: 'discountPercentage',
      render: (discount: number) => (
        <Tag color="green" style={{ fontWeight: 'bold' }}>
          {discount}% OFF
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Badge status={statusColors[status] as 'processing' | 'warning' | 'default' | 'success' | 'error'} text={statusLabels[status]} />
      ),
    },
    {
      title: 'Expires',
      dataIndex: 'expiresAt',
      key: 'expiresAt',
      render: (date: string, record) => {
        const isExpired = dayjs(date).isBefore(dayjs());
        const isActive = record.status === 'open';
        return (
          <Space direction="vertical" size={0}>
            <Text type={isExpired && isActive ? 'danger' : undefined}>
              {dayjs(date).format('MMM D, YYYY')}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {dayjs(date).format('h:mm A')}
            </Text>
            {isActive && !isExpired && (
              <Text type="warning" style={{ fontSize: 12 }}>
                <ClockCircleOutlined /> {dayjs(date).fromNow()}
              </Text>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Share Code',
      dataIndex: 'shareCode',
      key: 'shareCode',
      render: (code: string) => (
        <Text copyable style={{ fontFamily: 'monospace' }}>
          {code}
        </Text>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="text"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetails(record)}
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
          <TeamOutlined style={{ marginRight: 8 }} />
          Group Buying
        </Title>
        <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Sessions"
              value={stats.totalSessions}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Active Sessions"
              value={stats.activeSessions}
              valueStyle={{ color: '#1890ff' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Completed"
              value={stats.completedSessions}
              valueStyle={{ color: '#3f8600' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Participants"
              value={stats.totalParticipants}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="Search sessions..."
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
            style={{ width: 180 }}
            options={[
              { label: 'Open', value: 'open' },
              { label: 'Filled', value: 'filled' },
              { label: 'Completed', value: 'completed' },
              { label: 'Expired', value: 'expired' },
              { label: 'Cancelled', value: 'cancelled' },
            ]}
          />
        </Space>
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={sessions}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (t) => `Total ${t} sessions`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        title={
          <Space>
            <TeamOutlined />
            Group Buying Session Details
          </Space>
        }
        open={detailModalOpen}
        onCancel={() => {
          setDetailModalOpen(false);
          setSelectedSession(null);
        }}
        footer={null}
        width={800}
      >
        {selectedSession && (
          <div>
            <Descriptions bordered column={2} style={{ marginBottom: 24 }}>
              <Descriptions.Item label="Product" span={2}>
                <Space>
                  <Avatar
                    src={normalizeImageUrl(selectedSession.product?.images?.[0])}
                    shape="square"
                    size={64}
                  />
                  <div>
                    <Text strong>{selectedSession.product?.title}</Text>
                    <br />
                    <Text type="secondary">
                      Original: ₦{selectedSession.product?.price?.toLocaleString()}
                    </Text>
                    <br />
                    <Text style={{ color: '#52c41a' }}>
                      Group Price: ₦
                      {Math.round(
                        selectedSession.product?.price *
                          (1 - selectedSession.discountPercentage / 100)
                      ).toLocaleString()}
                    </Text>
                  </div>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Badge
                  status={statusColors[selectedSession.status] as 'processing' | 'warning' | 'default' | 'success' | 'error'}
                  text={statusLabels[selectedSession.status]}
                />
              </Descriptions.Item>
              <Descriptions.Item label="Discount">
                <Tag color="green">{selectedSession.discountPercentage}% OFF</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Participants">
                {selectedSession.currentParticipants} / {selectedSession.targetParticipants}
              </Descriptions.Item>
              <Descriptions.Item label="Share Code">
                <Text copyable style={{ fontFamily: 'monospace' }}>
                  {selectedSession.shareCode}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Created">
                {dayjs(selectedSession.createdAt).format('MMM D, YYYY h:mm A')}
              </Descriptions.Item>
              <Descriptions.Item label="Expires">
                {dayjs(selectedSession.expiresAt).format('MMM D, YYYY h:mm A')}
              </Descriptions.Item>
            </Descriptions>

            <Title level={5}>
              <UserOutlined style={{ marginRight: 8 }} />
              Participants ({selectedSession.participants?.length || 0})
            </Title>
            <List
              itemLayout="horizontal"
              dataSource={selectedSession.participants || []}
              renderItem={(participant: GroupBuyingParticipant) => (
                <List.Item
                  extra={
                    <Space>
                      <Text>Qty: {participant.quantity}</Text>
                      {participant.hasPaid ? (
                        <Tag color="success" icon={<CheckCircleOutlined />}>
                          Paid
                        </Tag>
                      ) : (
                        <Tag color="warning" icon={<ClockCircleOutlined />}>
                          Pending Payment
                        </Tag>
                      )}
                    </Space>
                  }
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        src={normalizeImageUrl(participant.user?.avatar)}
                        icon={<UserOutlined />}
                      />
                    }
                    title={participant.user?.name}
                    description={
                      <Space direction="vertical" size={0}>
                        <Text type="secondary">{participant.user?.email}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Joined {dayjs(participant.joinedAt).fromNow()}
                        </Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
              locale={{ emptyText: 'No participants yet' }}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
