'use client';

import { useState } from 'react';
import {
  Card,
  Table,
  Tag,
  Space,
  Typography,
  Row,
  Col,
  Statistic,
  Tabs,
  Input,
  Select,
  Avatar,
  Badge,
  List,
} from 'antd';
import {
  SearchOutlined,
  CrownOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  ShopOutlined,
  CarOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  StarOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;

interface FarmerSubscription {
  id: string;
  farmerId: string;
  tier: string;
  isActive: boolean;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  paymentReference?: string;
  farmer?: {
    id: string;
    user?: {
      name: string;
      email: string;
      phone: string;
      avatar?: string;
    };
    farmName?: string;
  };
}

interface RiderSubscription {
  id: string;
  riderId: string;
  tier: string;
  isActive: boolean;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  paymentReference?: string;
  rider?: {
    id: string;
    user?: {
      name: string;
      phone: string;
      avatar?: string;
    };
  };
}

interface SubscriptionDashboard {
  farmerStats: {
    total: number;
    active: number;
    totalRevenue: number;
    expiringSoon: number;
    byTier: { basic: number; verified: number; premium: number };
  };
  riderStats: {
    total: number;
    active: number;
    totalRevenue: number;
    expiringSoon: number;
    byTier: { basic: number; standard: number; premium: number };
  };
}

const formatCurrency = (value: number) => `₦${value.toLocaleString()}`;

const getTierColor = (tier: string) => {
  const colors: Record<string, string> = {
    basic: 'blue',
    verified: 'gold',
    premium: 'purple',
    standard: 'cyan',
  };
  return colors[tier.toLowerCase()] || 'default';
};

const getTierIcon = (tier: string) => {
  switch (tier.toLowerCase()) {
    case 'premium':
      return <CrownOutlined />;
    case 'verified':
      return <SafetyCertificateOutlined />;
    default:
      return <StarOutlined />;
  }
};

export default function SubscriptionsPage() {
  const [activeTab, setActiveTab] = useState('farmers');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [tierFilter, setTierFilter] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Fetch dashboard stats
  const { data: dashboardData } = useQuery({
    queryKey: ['subscriptions-dashboard'],
    queryFn: async () => {
      const response = await adminApi.getSubscriptionsDashboard();
      return response.data.data as SubscriptionDashboard;
    },
  });

  // Fetch farmer subscriptions
  const { data: farmerSubsData, isLoading: farmerLoading } = useQuery({
    queryKey: ['farmer-subscriptions', { search, status: statusFilter, tier: tierFilter, page, pageSize }],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, limit: pageSize };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (tierFilter) params.tier = tierFilter;
      const response = await adminApi.getFarmerSubscriptions(params);
      return response.data.data;
    },
    enabled: activeTab === 'farmers',
  });

  // Fetch rider subscriptions
  const { data: riderSubsData, isLoading: riderLoading } = useQuery({
    queryKey: ['rider-subscriptions', { search, status: statusFilter, tier: tierFilter, page, pageSize }],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, limit: pageSize };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (tierFilter) params.tier = tierFilter;
      const response = await adminApi.getRiderSubscriptions(params);
      return response.data.data;
    },
    enabled: activeTab === 'riders',
  });

  // Fetch recent subscriptions
  const { data: recentSubsData } = useQuery({
    queryKey: ['recent-subscriptions'],
    queryFn: async () => {
      const response = await adminApi.getRecentSubscriptions({ limit: 10 });
      return response.data.data;
    },
  });

  // Fetch revenue chart
  const { data: revenueChartData } = useQuery({
    queryKey: ['subscription-revenue-chart'],
    queryFn: async () => {
      const response = await adminApi.getSubscriptionRevenueChart({ days: 30 });
      return response.data.data;
    },
  });

  const farmerColumns: ColumnsType<FarmerSubscription> = [
    {
      title: 'Farmer',
      key: 'farmer',
      render: (_, record) => (
        <Space>
          <Avatar 
            src={record.farmer?.user?.avatar} 
            icon={<ShopOutlined />} 
            style={{ backgroundColor: '#52c41a' }}
          />
          <div>
            <Text strong>{record.farmer?.user?.name || 'Unknown'}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.farmer?.farmName || record.farmer?.user?.phone}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Tier',
      dataIndex: 'tier',
      key: 'tier',
      render: (tier: string) => (
        <Tag color={getTierColor(tier)} icon={getTierIcon(tier)}>
          {tier.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => {
        const isExpiring = dayjs(record.endDate).diff(dayjs(), 'days') <= 7 && record.isActive;
        const isExpired = dayjs(record.endDate).isBefore(dayjs());
        
        return (
          <Space direction="vertical" size={0}>
            <Badge
              status={record.isActive && !isExpired ? 'success' : 'error'}
              text={record.isActive && !isExpired ? 'Active' : 'Expired'}
            />
            {isExpiring && !isExpired && (
              <Text type="warning" style={{ fontSize: 11 }}>
                <WarningOutlined /> Expiring soon
              </Text>
            )}
            {record.autoRenew && (
              <Text type="secondary" style={{ fontSize: 11 }}>
                <CheckCircleOutlined style={{ color: '#52c41a' }} /> Auto-renew
              </Text>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Start Date',
      dataIndex: 'startDate',
      key: 'startDate',
      render: (date: string) => dayjs(date).format('MMM DD, YYYY'),
    },
    {
      title: 'End Date',
      dataIndex: 'endDate',
      key: 'endDate',
      render: (date: string) => {
        const isExpired = dayjs(date).isBefore(dayjs());
        const daysRemaining = dayjs(date).diff(dayjs(), 'days');
        
        return (
          <Space direction="vertical" size={0}>
            <Text>{dayjs(date).format('MMM DD, YYYY')}</Text>
            <Text type={isExpired ? 'danger' : daysRemaining <= 7 ? 'warning' : 'secondary'} style={{ fontSize: 11 }}>
              {isExpired ? 'Expired' : `${daysRemaining} days left`}
            </Text>
          </Space>
        );
      },
    },
  ];

  const riderColumns: ColumnsType<RiderSubscription> = [
    {
      title: 'Rider',
      key: 'rider',
      render: (_, record) => (
        <Space>
          <Avatar 
            src={record.rider?.user?.avatar} 
            icon={<CarOutlined />}
            style={{ backgroundColor: '#fa8c16' }}
          />
          <div>
            <Text strong>{record.rider?.user?.name || 'Unknown'}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.rider?.user?.phone}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Tier',
      dataIndex: 'tier',
      key: 'tier',
      render: (tier: string) => (
        <Tag color={getTierColor(tier)} icon={getTierIcon(tier)}>
          {tier.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => {
        const isExpiring = dayjs(record.endDate).diff(dayjs(), 'days') <= 7 && record.isActive;
        const isExpired = dayjs(record.endDate).isBefore(dayjs());
        
        return (
          <Space direction="vertical" size={0}>
            <Badge
              status={record.isActive && !isExpired ? 'success' : 'error'}
              text={record.isActive && !isExpired ? 'Active' : 'Expired'}
            />
            {isExpiring && !isExpired && (
              <Text type="warning" style={{ fontSize: 11 }}>
                <WarningOutlined /> Expiring soon
              </Text>
            )}
            {record.autoRenew && (
              <Text type="secondary" style={{ fontSize: 11 }}>
                <CheckCircleOutlined style={{ color: '#52c41a' }} /> Auto-renew
              </Text>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Start Date',
      dataIndex: 'startDate',
      key: 'startDate',
      render: (date: string) => dayjs(date).format('MMM DD, YYYY'),
    },
    {
      title: 'End Date',
      dataIndex: 'endDate',
      key: 'endDate',
      render: (date: string) => {
        const isExpired = dayjs(date).isBefore(dayjs());
        const daysRemaining = dayjs(date).diff(dayjs(), 'days');
        
        return (
          <Space direction="vertical" size={0}>
            <Text>{dayjs(date).format('MMM DD, YYYY')}</Text>
            <Text type={isExpired ? 'danger' : daysRemaining <= 7 ? 'warning' : 'secondary'} style={{ fontSize: 11 }}>
              {isExpired ? 'Expired' : `${daysRemaining} days left`}
            </Text>
          </Space>
        );
      },
    },
  ];

  const farmerSubscriptions = farmerSubsData?.subscriptions || [];
  const farmerTotal = farmerSubsData?.total || 0;
  const riderSubscriptions = riderSubsData?.subscriptions || [];
  const riderTotal = riderSubsData?.total || 0;

  const farmerStats = dashboardData?.farmerStats;
  const riderStats = dashboardData?.riderStats;

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setPage(1);
    setSearch('');
    setStatusFilter(undefined);
    setTierFilter(undefined);
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          <CrownOutlined style={{ marginRight: 8 }} />
          Subscriptions Management
        </Title>
        <Text type="secondary">Track and manage farmer and rider subscriptions</Text>
      </div>

      {/* Stats Overview */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Farmer Subscriptions"
              value={farmerStats?.total || 0}
              prefix={<ShopOutlined style={{ color: '#52c41a' }} />}
              suffix={
                <Tag color="green" style={{ marginLeft: 8 }}>
                  {farmerStats?.active || 0} active
                </Tag>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Rider Subscriptions"
              value={riderStats?.total || 0}
              prefix={<CarOutlined style={{ color: '#fa8c16' }} />}
              suffix={
                <Tag color="orange" style={{ marginLeft: 8 }}>
                  {riderStats?.active || 0} active
                </Tag>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Revenue"
              value={(farmerStats?.totalRevenue || 0) + (riderStats?.totalRevenue || 0)}
              prefix={<DollarOutlined style={{ color: '#4f46e5' }} />}
              formatter={(value) => formatCurrency(value as number)}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Expiring Soon"
              value={(farmerStats?.expiringSoon || 0) + (riderStats?.expiringSoon || 0)}
              prefix={<WarningOutlined style={{ color: '#f5222d' }} />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Tier Breakdown */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={12}>
          <Card title="Farmer Subscription Tiers">
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title={<Tag color="blue">BASIC</Tag>}
                  value={farmerStats?.byTier?.basic || 0}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title={<Tag color="gold">VERIFIED</Tag>}
                  value={farmerStats?.byTier?.verified || 0}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title={<Tag color="purple">PREMIUM</Tag>}
                  value={farmerStats?.byTier?.premium || 0}
                />
              </Col>
            </Row>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Rider Subscription Tiers">
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title={<Tag color="blue">BASIC</Tag>}
                  value={riderStats?.byTier?.basic || 0}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title={<Tag color="cyan">STANDARD</Tag>}
                  value={riderStats?.byTier?.standard || 0}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title={<Tag color="purple">PREMIUM</Tag>}
                  value={riderStats?.byTier?.premium || 0}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Revenue Chart and Recent Activity */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={16}>
          <Card title="Subscription Revenue (Last 30 Days)">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueChartData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(value) => `₦${(value / 1000).toFixed(0)}k`} />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#4f46e5" 
                  fill="#4f46e580" 
                  name="Revenue"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="Recent Subscriptions" style={{ height: '100%' }}>
            <List
              dataSource={recentSubsData || []}
              renderItem={(item: { type: string; name: string; tier: string; date: string }) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Avatar 
                        icon={item.type === 'farmer' ? <ShopOutlined /> : <CarOutlined />}
                        style={{ backgroundColor: item.type === 'farmer' ? '#52c41a' : '#fa8c16' }}
                      />
                    }
                    title={
                      <Space>
                        <Text>{item.name}</Text>
                        <Tag color={getTierColor(item.tier)} style={{ fontSize: 10 }}>
                          {item.tier}
                        </Tag>
                      </Space>
                    }
                    description={
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        <ClockCircleOutlined style={{ marginRight: 4 }} />
                        {dayjs(item.date).fromNow()}
                      </Text>
                    }
                  />
                </List.Item>
              )}
              locale={{ emptyText: 'No recent subscriptions' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Subscription Tables */}
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={[
            {
              key: 'farmers',
              label: (
                <span>
                  <ShopOutlined />
                  Farmer Subscriptions
                </span>
              ),
            },
            {
              key: 'riders',
              label: (
                <span>
                  <CarOutlined />
                  Rider Subscriptions
                </span>
              ),
            },
          ]}
        />

        <Space style={{ marginBottom: 16 }} wrap>
          <Input
            placeholder={`Search ${activeTab === 'farmers' ? 'farmers' : 'riders'}...`}
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 250 }}
            allowClear
          />
          <Select
            placeholder="Filter by status"
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 140 }}
            allowClear
            options={[
              { label: 'All Status', value: undefined },
              { label: 'Active', value: 'active' },
              { label: 'Expired', value: 'expired' },
            ]}
          />
          <Select
            placeholder="Filter by tier"
            value={tierFilter}
            onChange={setTierFilter}
            style={{ width: 140 }}
            allowClear
            options={
              activeTab === 'farmers'
                ? [
                    { label: 'All Tiers', value: undefined },
                    { label: 'Basic', value: 'basic' },
                    { label: 'Verified', value: 'verified' },
                    { label: 'Premium', value: 'premium' },
                  ]
                : [
                    { label: 'All Tiers', value: undefined },
                    { label: 'Basic', value: 'basic' },
                    { label: 'Standard', value: 'standard' },
                    { label: 'Premium', value: 'premium' },
                  ]
            }
          />
        </Space>

        {activeTab === 'farmers' ? (
          <Table
            columns={farmerColumns}
            dataSource={farmerSubscriptions}
            rowKey="id"
            loading={farmerLoading}
            pagination={{
              current: page,
              pageSize: pageSize,
              total: farmerTotal,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} subscriptions`,
              onChange: (p, ps) => {
                setPage(p);
                setPageSize(ps);
              },
            }}
          />
        ) : (
          <Table
            columns={riderColumns}
            dataSource={riderSubscriptions}
            rowKey="id"
            loading={riderLoading}
            pagination={{
              current: page,
              pageSize: pageSize,
              total: riderTotal,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} subscriptions`,
              onChange: (p, ps) => {
                setPage(p);
                setPageSize(ps);
              },
            }}
          />
        )}
      </Card>
    </div>
  );
}
