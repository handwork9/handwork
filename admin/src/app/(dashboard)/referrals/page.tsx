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
  DatePicker,
} from 'antd';
import {
  SearchOutlined,
  GiftOutlined,
  UserAddOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title } = Typography;
const { RangePicker } = DatePicker;

interface Referral {
  id: string;
  referrer: {
    id: string;
    name: string;
    email: string;
  };
  referredUser?: {
    id: string;
    name: string;
    email: string;
  };
  referredPhone?: string;
  referredName?: string;
  status: string;
  referrerReward: number;
  referredReward: number;
  completedAt?: string;
  expiresAt?: string;
  createdAt: string;
}

interface ReferralStats {
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  totalRewardsGiven: number;
}

const statusColors: Record<string, string> = {
  completed: 'green',
  joined: 'blue',
  pending: 'orange',
  expired: 'default',
};

const statusLabels: Record<string, string> = {
  completed: 'Completed',
  joined: 'Joined',
  pending: 'Pending',
  expired: 'Expired',
};

export default function ReferralsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['referral-stats'],
    queryFn: async () => {
      const response = await adminApi.getReferralStats();
      return response.data as ReferralStats;
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['referrals', { search, status: statusFilter, dateRange, page, pageSize }],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, limit: pageSize };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (dateRange?.[0]) params.startDate = dateRange[0].format('YYYY-MM-DD');
      if (dateRange?.[1]) params.endDate = dateRange[1].format('YYYY-MM-DD');
      const response = await adminApi.getReferrals(params);
      // Handle nested response from ResponseInterceptor: { success, data: { data, meta } }
      const responseData = response.data?.data || response.data;
      return responseData;
    },
  });

  const columns: ColumnsType<Referral> = [
    {
      title: 'Referrer',
      dataIndex: 'referrer',
      key: 'referrer',
      render: (referrer) => (
        <div>
          <div style={{ fontWeight: 500 }}>{referrer.name}</div>
          <div style={{ fontSize: 12, color: '#666' }}>{referrer.email}</div>
        </div>
      ),
    },
    {
      title: 'Referred User',
      dataIndex: 'referredUser',
      key: 'referredUser',
      render: (referredUser, record) => (
        <div>
          {referredUser ? (
            <>
              <div style={{ fontWeight: 500 }}>{referredUser.name}</div>
              <div style={{ fontSize: 12, color: '#666' }}>{referredUser.email}</div>
            </>
          ) : (
            <>
              <div style={{ fontWeight: 500 }}>{record.referredName || 'N/A'}</div>
              <div style={{ fontSize: 12, color: '#666' }}>{record.referredPhone || 'Invite sent'}</div>
            </>
          )}
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColors[status] || 'default'}>
          {statusLabels[status] || status}
        </Tag>
      ),
      filters: [
        { text: 'Completed', value: 'completed' },
        { text: 'Joined', value: 'joined' },
        { text: 'Pending', value: 'pending' },
        { text: 'Expired', value: 'expired' },
      ],
    },
    {
      title: 'Rewards',
      key: 'rewards',
      render: (_, record) => (
        <div>
          {record.status === 'completed' ? (
            <Tag color="green">₦{(record.referrerReward + record.referredReward).toLocaleString()}</Tag>
          ) : (
            <span style={{ color: '#999' }}>Pending</span>
          )}
        </div>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('MMM D, YYYY'),
      sorter: true,
    },
    {
      title: 'Completed',
      dataIndex: 'completedAt',
      key: 'completedAt',
      render: (date: string) => date ? dayjs(date).format('MMM D, YYYY') : '-',
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={2} style={{ marginBottom: 24 }}>
        <GiftOutlined style={{ marginRight: 12 }} />
        Referrals
      </Title>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Referrals"
              value={stats?.totalReferrals || 0}
              prefix={<UserAddOutlined />}
              loading={statsLoading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Completed"
              value={stats?.completedReferrals || 0}
              styles={{ content: { color: '#3f8600' } }}
              prefix={<GiftOutlined />}
              loading={statsLoading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Pending"
              value={stats?.pendingReferrals || 0}
              styles={{ content: { color: '#faad14' } }}
              prefix={<ClockCircleOutlined />}
              loading={statsLoading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Rewards Given"
              value={stats?.totalRewardsGiven || 0}
              precision={0}
              prefix="₦"
              styles={{ content: { color: '#1890ff' } }}
              loading={statsLoading}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap size="middle">
          <Input
            placeholder="Search by name, email, or code"
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 280 }}
            allowClear
          />
          <Select
            placeholder="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 140 }}
            allowClear
            options={[
              { value: 'completed', label: 'Completed' },
              { value: 'joined', label: 'Joined' },
              { value: 'pending', label: 'Pending' },
              { value: 'expired', label: 'Expired' },
            ]}
          />
          <RangePicker
            value={dateRange}
            onChange={(dates) => setDateRange(dates)}
            style={{ width: 280 }}
          />
        </Space>
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={Array.isArray(data?.data) ? data.data : []}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: page,
            pageSize,
            total: data?.meta?.total || 0,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} referrals`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
        />
      </Card>
    </div>
  );
}
