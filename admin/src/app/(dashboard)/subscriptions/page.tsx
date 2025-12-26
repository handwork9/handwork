'use client';

import React, { useState } from 'react';
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
  Empty,
  Button,
  Divider,
  Progress,
  Drawer,
  Descriptions,
  Timeline,
  Tooltip,
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
  ReloadOutlined,
  EyeOutlined,
  RiseOutlined,
  ThunderboltOutlined,
  CalendarOutlined,
  PhoneOutlined,
  MailOutlined,
  FieldTimeOutlined,
  TrophyOutlined,
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
  Tooltip as RechartsTooltip,
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

const getTierGradient = (tier: string) => {
  switch (tier.toLowerCase()) {
    case 'premium':
      return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    case 'verified':
      return 'linear-gradient(135deg, #f5af19 0%, #f12711 100%)';
    default:
      return 'linear-gradient(135deg, #667eea 0%, #4facfe 100%)';
  }
};

export default function SubscriptionsPage() {
  const [activeTab, setActiveTab] = useState('farmers');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [tierFilter, setTierFilter] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedSubscription, setSelectedSubscription] = useState<FarmerSubscription | RiderSubscription | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState('details');

  // Fetch dashboard stats
  const { data: dashboardData, refetch } = useQuery({
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

  const handleViewDetails = (record: FarmerSubscription | RiderSubscription) => {
    setSelectedSubscription(record);
    setDrawerTab('details');
    setDrawerOpen(true);
  };

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
            size="large"
          />
          <div>
            <Text strong style={{ display: 'block' }}>{record.farmer?.user?.name || 'Unknown'}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              <ShopOutlined style={{ marginRight: 4 }} />
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
        <Tag 
          color={getTierColor(tier)} 
          icon={getTierIcon(tier)}
          style={{ 
            padding: '4px 12px',
            borderRadius: 16,
            fontWeight: 600,
          }}
        >
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
          <Space orientation="vertical" size={0}>
            <Badge
              status={record.isActive && !isExpired ? 'success' : 'error'}
              text={
                <Text strong style={{ color: record.isActive && !isExpired ? '#52c41a' : '#ff4d4f' }}>
                  {record.isActive && !isExpired ? 'Active' : 'Expired'}
                </Text>
              }
            />
            {isExpiring && !isExpired && (
              <Tag color="warning" icon={<WarningOutlined />} style={{ marginTop: 4 }}>
                Expiring soon
              </Tag>
            )}
            {record.autoRenew && (
              <Tag color="success" icon={<CheckCircleOutlined />} style={{ marginTop: 4 }}>
                Auto-renew
              </Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Duration',
      key: 'duration',
      render: (_, record) => {
        const isExpired = dayjs(record.endDate).isBefore(dayjs());
        const daysRemaining = dayjs(record.endDate).diff(dayjs(), 'days');
        const totalDays = dayjs(record.endDate).diff(dayjs(record.startDate), 'days');
        const elapsed = totalDays - daysRemaining;
        const progress = Math.max(0, Math.min(100, (elapsed / totalDays) * 100));
        
        return (
          <div style={{ minWidth: 120 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text type="secondary" style={{ fontSize: 11 }}>
                {dayjs(record.startDate).format('MMM DD')}
              </Text>
              <Text type="secondary" style={{ fontSize: 11 }}>
                {dayjs(record.endDate).format('MMM DD')}
              </Text>
            </div>
            <Progress 
              percent={progress} 
              size="small" 
              showInfo={false}
              strokeColor={isExpired ? '#ff4d4f' : daysRemaining <= 7 ? '#faad14' : '#52c41a'}
            />
            <Text 
              type={isExpired ? 'danger' : daysRemaining <= 7 ? 'warning' : 'secondary'} 
              style={{ fontSize: 11, display: 'block', textAlign: 'center', marginTop: 2 }}
            >
              {isExpired ? 'Expired' : `${daysRemaining} days left`}
            </Text>
          </div>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <Tooltip title="View Details">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          />
        </Tooltip>
      ),
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
            size="large"
          />
          <div>
            <Text strong style={{ display: 'block' }}>{record.rider?.user?.name || 'Unknown'}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              <PhoneOutlined style={{ marginRight: 4 }} />
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
        <Tag 
          color={getTierColor(tier)} 
          icon={getTierIcon(tier)}
          style={{ 
            padding: '4px 12px',
            borderRadius: 16,
            fontWeight: 600,
          }}
        >
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
          <Space orientation="vertical" size={0}>
            <Badge
              status={record.isActive && !isExpired ? 'success' : 'error'}
              text={
                <Text strong style={{ color: record.isActive && !isExpired ? '#52c41a' : '#ff4d4f' }}>
                  {record.isActive && !isExpired ? 'Active' : 'Expired'}
                </Text>
              }
            />
            {isExpiring && !isExpired && (
              <Tag color="warning" icon={<WarningOutlined />} style={{ marginTop: 4 }}>
                Expiring soon
              </Tag>
            )}
            {record.autoRenew && (
              <Tag color="success" icon={<CheckCircleOutlined />} style={{ marginTop: 4 }}>
                Auto-renew
              </Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Duration',
      key: 'duration',
      render: (_, record) => {
        const isExpired = dayjs(record.endDate).isBefore(dayjs());
        const daysRemaining = dayjs(record.endDate).diff(dayjs(), 'days');
        const totalDays = dayjs(record.endDate).diff(dayjs(record.startDate), 'days');
        const elapsed = totalDays - daysRemaining;
        const progress = Math.max(0, Math.min(100, (elapsed / totalDays) * 100));
        
        return (
          <div style={{ minWidth: 120 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text type="secondary" style={{ fontSize: 11 }}>
                {dayjs(record.startDate).format('MMM DD')}
              </Text>
              <Text type="secondary" style={{ fontSize: 11 }}>
                {dayjs(record.endDate).format('MMM DD')}
              </Text>
            </div>
            <Progress 
              percent={progress} 
              size="small" 
              showInfo={false}
              strokeColor={isExpired ? '#ff4d4f' : daysRemaining <= 7 ? '#faad14' : '#52c41a'}
            />
            <Text 
              type={isExpired ? 'danger' : daysRemaining <= 7 ? 'warning' : 'secondary'} 
              style={{ fontSize: 11, display: 'block', textAlign: 'center', marginTop: 2 }}
            >
              {isExpired ? 'Expired' : `${daysRemaining} days left`}
            </Text>
          </div>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <Tooltip title="View Details">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          />
        </Tooltip>
      ),
    },
  ];

  const farmerSubscriptions = farmerSubsData?.subscriptions || [];
  const farmerTotal = farmerSubsData?.total || 0;
  const riderSubscriptions = riderSubsData?.subscriptions || [];
  const riderTotal = riderSubsData?.total || 0;

  const farmerStats = dashboardData?.farmerStats;
  const riderStats = dashboardData?.riderStats;

  const totalRevenue = (farmerStats?.totalRevenue || 0) + (riderStats?.totalRevenue || 0);
  const totalActive = (farmerStats?.active || 0) + (riderStats?.active || 0);
  const totalSubscriptions = (farmerStats?.total || 0) + (riderStats?.total || 0);
  const activeRate = totalSubscriptions > 0 ? (totalActive / totalSubscriptions) * 100 : 0;

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setPage(1);
    setSearch('');
    setStatusFilter(undefined);
    setTierFilter(undefined);
  };

  const isFarmerSub = (sub: FarmerSubscription | RiderSubscription): sub is FarmerSubscription => {
    return 'farmer' in sub;
  };

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ 
              width: 48, 
              height: 48, 
              borderRadius: 12, 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <CrownOutlined style={{ fontSize: 24, color: '#fff' }} />
            </div>
            Subscriptions Management
          </Title>
          <Text type="secondary" style={{ marginTop: 8, display: 'block' }}>
            Track and manage farmer and rider subscription plans
          </Text>
        </div>
        <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
          Refresh
        </Button>
      </div>

      {/* Stats Overview */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card variant="borderless" style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <Text type="secondary">Farmer Subscriptions</Text>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#52c41a', marginTop: 4 }}>
                  {farmerStats?.total || 0}
                </div>
              </div>
              <div style={{ 
                width: 48, 
                height: 48, 
                borderRadius: 12, 
                background: 'linear-gradient(135deg, #52c41a 0%, #237804 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <ShopOutlined style={{ fontSize: 22, color: '#fff' }} />
              </div>
            </div>
            <Divider style={{ margin: '12px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Active</Text>
              <Badge status="success" text={<Text style={{ fontSize: 12 }}>{farmerStats?.active || 0}</Text>} />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card variant="borderless" style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <Text type="secondary">Rider Subscriptions</Text>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#fa8c16', marginTop: 4 }}>
                  {riderStats?.total || 0}
                </div>
              </div>
              <div style={{ 
                width: 48, 
                height: 48, 
                borderRadius: 12, 
                background: 'linear-gradient(135deg, #fa8c16 0%, #d46b08 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <CarOutlined style={{ fontSize: 22, color: '#fff' }} />
              </div>
            </div>
            <Divider style={{ margin: '12px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Active</Text>
              <Badge status="success" text={<Text style={{ fontSize: 12 }}>{riderStats?.active || 0}</Text>} />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card variant="borderless" style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <Text type="secondary">Total Revenue</Text>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#4f46e5', marginTop: 4 }}>
                  {formatCurrency(totalRevenue)}
                </div>
              </div>
              <div style={{ 
                width: 48, 
                height: 48, 
                borderRadius: 12, 
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <DollarOutlined style={{ fontSize: 22, color: '#fff' }} />
              </div>
            </div>
            <Divider style={{ margin: '12px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Active Rate</Text>
              <Text style={{ fontSize: 12, color: '#52c41a' }}>{activeRate.toFixed(1)}%</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card variant="borderless" style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <Text type="secondary">Expiring Soon</Text>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#f5222d', marginTop: 4 }}>
                  {(farmerStats?.expiringSoon || 0) + (riderStats?.expiringSoon || 0)}
                </div>
              </div>
              <div style={{ 
                width: 48, 
                height: 48, 
                borderRadius: 12, 
                background: 'linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <WarningOutlined style={{ fontSize: 22, color: '#fff' }} />
              </div>
            </div>
            <Divider style={{ margin: '12px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Within 7 days</Text>
              <Tag color="error" style={{ fontSize: 10 }}>Needs Attention</Tag>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Tier Breakdown */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={12}>
          <Card 
            title={
              <Space>
                <ShopOutlined style={{ color: '#52c41a' }} />
                <span>Farmer Tiers</span>
              </Space>
            }
            variant="borderless"
            style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
          >
            <Row gutter={16}>
              {['basic', 'verified', 'premium'].map((tier) => (
                <Col span={8} key={tier}>
                  <Card 
                    size="small" 
                    style={{ 
                      textAlign: 'center', 
                      background: getTierGradient(tier),
                      border: 'none',
                      borderRadius: 8,
                    }}
                  >
                    <div style={{ color: '#fff' }}>
                      {getTierIcon(tier)}
                      <div style={{ fontSize: 24, fontWeight: 700, margin: '8px 0' }}>
                        {farmerStats?.byTier?.[tier as keyof typeof farmerStats.byTier] || 0}
                      </div>
                      <div style={{ textTransform: 'uppercase', fontSize: 11, opacity: 0.9 }}>
                        {tier}
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card 
            title={
              <Space>
                <CarOutlined style={{ color: '#fa8c16' }} />
                <span>Rider Tiers</span>
              </Space>
            }
            variant="borderless"
            style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
          >
            <Row gutter={16}>
              {['basic', 'standard', 'premium'].map((tier) => (
                <Col span={8} key={tier}>
                  <Card 
                    size="small" 
                    style={{ 
                      textAlign: 'center', 
                      background: getTierGradient(tier),
                      border: 'none',
                      borderRadius: 8,
                    }}
                  >
                    <div style={{ color: '#fff' }}>
                      {getTierIcon(tier)}
                      <div style={{ fontSize: 24, fontWeight: 700, margin: '8px 0' }}>
                        {riderStats?.byTier?.[tier as keyof typeof riderStats.byTier] || 0}
                      </div>
                      <div style={{ textTransform: 'uppercase', fontSize: 11, opacity: 0.9 }}>
                        {tier}
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Revenue Chart and Recent Activity */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={16}>
          <Card 
            title={
              <Space>
                <RiseOutlined style={{ color: '#4f46e5' }} />
                <span>Revenue Trend (Last 30 Days)</span>
              </Space>
            }
            variant="borderless"
            style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
          >
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueChartData || []}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(value) => `₦${(value / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                <RechartsTooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                  labelFormatter={(label) => `Date: ${label}`}
                  contentStyle={{ borderRadius: 8, border: '1px solid #f0f0f0' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#4f46e5" 
                  fillOpacity={1}
                  fill="url(#colorRevenue)" 
                  name="Revenue"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card 
            title={
              <Space>
                <ThunderboltOutlined style={{ color: '#faad14' }} />
                <span>Recent Subscriptions</span>
              </Space>
            }
            variant="borderless"
            style={{ height: '100%', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
            styles={{ body: { maxHeight: 340, overflow: 'auto' } }}
          >
            {recentSubsData && recentSubsData.length > 0 ? (
              <div>
                {recentSubsData.map((item: { type: string; name: string; tier: string; date: string }, index: number) => (
                  <div 
                    key={index} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      padding: '12px 0',
                      borderBottom: index < recentSubsData.length - 1 ? '1px solid #f0f0f0' : 'none'
                    }}
                  >
                    <Avatar 
                      icon={item.type === 'farmer' ? <ShopOutlined /> : <CarOutlined />}
                      style={{ 
                        backgroundColor: item.type === 'farmer' ? '#52c41a' : '#fa8c16',
                        marginRight: 12
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Text strong style={{ fontSize: 13 }}>{item.name}</Text>
                        <Tag 
                          color={getTierColor(item.tier)} 
                          style={{ fontSize: 10, padding: '0 6px', borderRadius: 10 }}
                        >
                          {item.tier.toUpperCase()}
                        </Tag>
                      </div>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        <ClockCircleOutlined style={{ marginRight: 4 }} />
                        {dayjs(item.date).fromNow()}
                      </Text>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Empty description="No recent subscriptions" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </Col>
      </Row>

      {/* Subscription Tables */}
      <Card variant="borderless" style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
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
                  <Badge count={farmerStats?.active || 0} style={{ marginLeft: 8 }} />
                </span>
              ),
            },
            {
              key: 'riders',
              label: (
                <span>
                  <CarOutlined />
                  Rider Subscriptions
                  <Badge count={riderStats?.active || 0} style={{ marginLeft: 8 }} />
                </span>
              ),
            },
          ]}
        />

        {/* Filters */}
        <Card size="small" style={{ marginBottom: 16, background: '#fafafa', borderRadius: 8 }}>
          <Space wrap>
            <Input
              placeholder={`Search ${activeTab === 'farmers' ? 'farmers' : 'riders'}...`}
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 250, borderRadius: 8 }}
              allowClear
            />
            <Select
              placeholder="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 130 }}
              allowClear
              options={[
                { label: 'Active', value: 'active' },
                { label: 'Expired', value: 'expired' },
              ]}
            />
            <Select
              placeholder="Tier"
              value={tierFilter}
              onChange={setTierFilter}
              style={{ width: 130 }}
              allowClear
              options={
                activeTab === 'farmers'
                  ? [
                      { label: 'Basic', value: 'basic' },
                      { label: 'Verified', value: 'verified' },
                      { label: 'Premium', value: 'premium' },
                    ]
                  : [
                      { label: 'Basic', value: 'basic' },
                      { label: 'Standard', value: 'standard' },
                      { label: 'Premium', value: 'premium' },
                    ]
              }
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                setSearch('');
                setStatusFilter(undefined);
                setTierFilter(undefined);
              }}
            >
              Reset
            </Button>
          </Space>
        </Card>

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

      {/* Details Drawer */}
      <Drawer
        title={
          <Space>
            <div style={{ 
              width: 40, 
              height: 40, 
              borderRadius: 10, 
              background: selectedSubscription && isFarmerSub(selectedSubscription) 
                ? 'linear-gradient(135deg, #52c41a 0%, #237804 100%)'
                : 'linear-gradient(135deg, #fa8c16 0%, #d46b08 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {selectedSubscription && isFarmerSub(selectedSubscription) 
                ? <ShopOutlined style={{ fontSize: 20, color: '#fff' }} />
                : <CarOutlined style={{ fontSize: 20, color: '#fff' }} />
              }
            </div>
            <div>
              <div>Subscription Details</div>
              <Text type="secondary" style={{ fontSize: 12, fontWeight: 'normal' }}>
                {selectedSubscription?.id.substring(0, 8)}...
              </Text>
            </div>
          </Space>
        }
        placement="right"
        size="large"
        onClose={() => {
          setDrawerOpen(false);
          setSelectedSubscription(null);
        }}
        open={drawerOpen}
      >
        {selectedSubscription && (
          <Tabs 
            activeKey={drawerTab} 
            onChange={setDrawerTab}
            items={[
              {
                key: 'details',
                label: <span><EyeOutlined /> Details</span>,
                children: (
                  <>
                    {/* User Info Card */}
                    <Card 
                      size="small" 
                      style={{ marginBottom: 16, borderRadius: 8, background: '#fafafa' }}
                    >
                      <Space align="start">
                        <Avatar 
                          size={64} 
                          icon={isFarmerSub(selectedSubscription) ? <ShopOutlined /> : <CarOutlined />}
                          style={{ 
                            backgroundColor: isFarmerSub(selectedSubscription) ? '#52c41a' : '#fa8c16' 
                          }}
                        />
                        <div>
                          <Text strong style={{ fontSize: 16, display: 'block' }}>
                            {isFarmerSub(selectedSubscription) 
                              ? selectedSubscription.farmer?.user?.name 
                              : (selectedSubscription as RiderSubscription).rider?.user?.name || 'Unknown'}
                          </Text>
                          {isFarmerSub(selectedSubscription) && selectedSubscription.farmer?.farmName && (
                            <Text type="secondary" style={{ display: 'block' }}>
                              <ShopOutlined style={{ marginRight: 4 }} />
                              {selectedSubscription.farmer.farmName}
                            </Text>
                          )}
                          <Space style={{ marginTop: 8 }}>
                            <Tag color={getTierColor(selectedSubscription.tier)} icon={getTierIcon(selectedSubscription.tier)}>
                              {selectedSubscription.tier.toUpperCase()}
                            </Tag>
                            <Badge
                              status={selectedSubscription.isActive ? 'success' : 'error'}
                              text={selectedSubscription.isActive ? 'Active' : 'Expired'}
                            />
                          </Space>
                        </div>
                      </Space>
                    </Card>

                    {/* Subscription Details */}
                    <Descriptions bordered column={1} size="small">
                      <Descriptions.Item label="Subscription ID">
                        <Text copyable code>{selectedSubscription.id}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Contact">
                        <Space orientation="vertical" size={0}>
                          {isFarmerSub(selectedSubscription) && selectedSubscription.farmer?.user?.email && (
                            <Text>
                              <MailOutlined style={{ marginRight: 8 }} />
                              {selectedSubscription.farmer.user.email}
                            </Text>
                          )}
                          <Text>
                            <PhoneOutlined style={{ marginRight: 8 }} />
                            {isFarmerSub(selectedSubscription) 
                              ? selectedSubscription.farmer?.user?.phone 
                              : (selectedSubscription as RiderSubscription).rider?.user?.phone || '-'}
                          </Text>
                        </Space>
                      </Descriptions.Item>
                      <Descriptions.Item label="Start Date">
                        <CalendarOutlined style={{ marginRight: 8 }} />
                        {dayjs(selectedSubscription.startDate).format('MMMM DD, YYYY')}
                      </Descriptions.Item>
                      <Descriptions.Item label="End Date">
                        <FieldTimeOutlined style={{ marginRight: 8 }} />
                        {dayjs(selectedSubscription.endDate).format('MMMM DD, YYYY')}
                      </Descriptions.Item>
                      <Descriptions.Item label="Days Remaining">
                        {(() => {
                          const daysRemaining = dayjs(selectedSubscription.endDate).diff(dayjs(), 'days');
                          const isExpired = daysRemaining < 0;
                          return (
                            <Tag color={isExpired ? 'error' : daysRemaining <= 7 ? 'warning' : 'success'}>
                              {isExpired ? `Expired ${Math.abs(daysRemaining)} days ago` : `${daysRemaining} days left`}
                            </Tag>
                          );
                        })()}
                      </Descriptions.Item>
                      <Descriptions.Item label="Auto Renew">
                        {selectedSubscription.autoRenew ? (
                          <Tag color="success" icon={<CheckCircleOutlined />}>Enabled</Tag>
                        ) : (
                          <Tag color="default">Disabled</Tag>
                        )}
                      </Descriptions.Item>
                      {selectedSubscription.paymentReference && (
                        <Descriptions.Item label="Payment Reference">
                          <Text copyable code style={{ fontSize: 12 }}>
                            {selectedSubscription.paymentReference}
                          </Text>
                        </Descriptions.Item>
                      )}
                    </Descriptions>
                  </>
                ),
              },
              {
                key: 'timeline',
                label: <span><FieldTimeOutlined /> Timeline</span>,
                children: (
                  <Timeline
                    items={[
                      {
                        color: 'green',
                        dot: <CheckCircleOutlined />,
                        content: (
                          <div>
                            <Text strong>Subscription Started</Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {dayjs(selectedSubscription.startDate).format('MMMM DD, YYYY HH:mm')}
                            </Text>
                          </div>
                        ),
                      },
                      {
                        color: 'blue',
                        dot: <TrophyOutlined />,
                        content: (
                          <div>
                            <Text strong>Tier: {selectedSubscription.tier.toUpperCase()}</Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              Subscription tier assigned
                            </Text>
                          </div>
                        ),
                      },
                      {
                        color: selectedSubscription.isActive ? 'green' : 'red',
                        dot: selectedSubscription.isActive ? <CheckCircleOutlined /> : <ClockCircleOutlined />,
                        content: (
                          <div>
                            <Text strong>
                              {selectedSubscription.isActive ? 'Currently Active' : 'Subscription Ended'}
                            </Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              Expires: {dayjs(selectedSubscription.endDate).format('MMMM DD, YYYY')}
                            </Text>
                          </div>
                        ),
                      },
                    ]}
                  />
                ),
              },
            ]}
          />
        )}
      </Drawer>
    </div>
  );
}
