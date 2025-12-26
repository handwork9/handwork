'use client';

import React, { useState } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Input,
  Select,
  Modal,
  App,
  Statistic,
  Row,
  Col,
  Typography,
  Descriptions,
  Tooltip,
  Avatar,
  Tabs,
  InputNumber,
  Popconfirm,
  Progress,
  Divider,
  Badge,
  Drawer,
  Timeline,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  CrownOutlined,
  UserOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  GiftOutlined,
  StopOutlined,
  SwapOutlined,
  CalendarOutlined,
  RiseOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  PhoneOutlined,
  MailOutlined,
  WalletOutlined,
  TrophyOutlined,
  FieldTimeOutlined,
  ThunderboltOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;

interface Subscriber {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  tier: string;
  expiresAt: string;
  status: string;
  daysRemaining: number;
  walletBalance: number;
  joinedAt: string;
}

interface Transaction {
  id: string;
  amount: number;
  tier: string;
  duration: string;
  paymentReference: string;
  status: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
  } | null;
  createdAt: string;
}

interface Stats {
  totalPremium: number;
  byTier: {
    basic: number;
    gold: number;
    platinum: number;
  };
  expiringSoon: number;
  expired: number;
  revenue: {
    total: number;
    totalCount: number;
    today: number;
    todayCount: number;
    thisMonth: number;
    thisMonthCount: number;
  };
  pricing: Record<string, Record<string, number>>;
}

const getTierColor = (tier: string) => {
  switch (tier) {
    case 'basic': return 'blue';
    case 'gold': return 'gold';
    case 'platinum': return 'purple';
    default: return 'default';
  }
};

const getTierGradient = (tier: string) => {
  switch (tier) {
    case 'basic': return 'linear-gradient(135deg, #667eea 0%, #4facfe 100%)';
    case 'gold': return 'linear-gradient(135deg, #f5af19 0%, #f12711 100%)';
    case 'platinum': return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    default: return 'linear-gradient(135deg, #667eea 0%, #4facfe 100%)';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'green';
    case 'expiring': return 'orange';
    case 'expired': return 'red';
    default: return 'default';
  }
};

export default function BuyerPremiumPage() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('subscribers');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [selectedSubscriber, setSelectedSubscriber] = useState<Subscriber | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState('details');
  const [extendDays, setExtendDays] = useState(30);
  const [extendReason, setExtendReason] = useState('');
  const [newTier, setNewTier] = useState<string>('');

  // Fetch stats
  const { data: stats, refetch } = useQuery({
    queryKey: ['admin-buyer-premium-stats'],
    queryFn: async () => {
      const response = await adminApi.getBuyerPremiumStats();
      return (response.data?.data || response.data) as Stats;
    },
  });

  // Fetch subscribers
  const { data: subscribersData, isLoading: subscribersLoading } = useQuery({
    queryKey: ['admin-buyer-premium-subscribers', page, pageSize, search, tierFilter, statusFilter],
    queryFn: async () => {
      const params: Record<string, unknown> = { page, limit: pageSize };
      if (search) params.search = search;
      if (tierFilter) params.tier = tierFilter;
      if (statusFilter) params.status = statusFilter;
      const response = await adminApi.getBuyerPremiumSubscribers(params as Parameters<typeof adminApi.getBuyerPremiumSubscribers>[0]);
      return response.data?.data || response.data;
    },
    enabled: activeTab === 'subscribers',
  });

  // Fetch transactions
  const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
    queryKey: ['admin-buyer-premium-transactions', page, pageSize, tierFilter],
    queryFn: async () => {
      const params: Record<string, unknown> = { page, limit: pageSize };
      if (tierFilter) params.tier = tierFilter;
      const response = await adminApi.getBuyerPremiumTransactions(params as Parameters<typeof adminApi.getBuyerPremiumTransactions>[0]);
      return response.data?.data || response.data;
    },
    enabled: activeTab === 'transactions',
  });

  // Extend mutation
  const extendMutation = useMutation({
    mutationFn: ({ id, days, reason }: { id: string; days: number; reason?: string }) =>
      adminApi.extendBuyerPremium(id, days, reason),
    onSuccess: () => {
      message.success('Premium extended successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-buyer-premium'] });
      setDrawerOpen(false);
      setExtendDays(30);
      setExtendReason('');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      message.error(error.response?.data?.message || 'Failed to extend premium');
    },
  });

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      adminApi.cancelBuyerPremium(id, reason),
    onSuccess: () => {
      message.success('Premium cancelled');
      queryClient.invalidateQueries({ queryKey: ['admin-buyer-premium'] });
      setDrawerOpen(false);
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      message.error(error.response?.data?.message || 'Failed to cancel premium');
    },
  });

  // Change tier mutation
  const changeTierMutation = useMutation({
    mutationFn: ({ id, tier, reason }: { id: string; tier: string; reason?: string }) =>
      adminApi.changeBuyerPremiumTier(id, tier, reason),
    onSuccess: () => {
      message.success('Tier changed successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-buyer-premium'] });
      setDrawerOpen(false);
      setNewTier('');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      message.error(error.response?.data?.message || 'Failed to change tier');
    },
  });

  const handleViewDetails = (record: Subscriber) => {
    setSelectedSubscriber(record);
    setDrawerTab('details');
    setDrawerOpen(true);
  };

  const subscriberColumns = [
    {
      title: 'User',
      key: 'user',
      render: (_: unknown, record: Subscriber) => (
        <Space>
          <Avatar 
            src={record.avatar} 
            icon={<UserOutlined />} 
            size="large"
            style={{ backgroundColor: '#1890ff' }}
          />
          <div>
            <Text strong style={{ display: 'block' }}>{record.name}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              <PhoneOutlined style={{ marginRight: 4 }} />
              {record.phone}
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
          icon={<CrownOutlined />} 
          style={{ 
            textTransform: 'capitalize',
            padding: '4px 12px',
            borderRadius: 16,
            fontWeight: 600,
          }}
        >
          {tier}
        </Tag>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: unknown, record: Subscriber) => (
        <Space orientation="vertical" size={0}>
          <Badge
            status={record.status === 'active' ? 'success' : record.status === 'expiring' ? 'warning' : 'error'}
            text={
              <Text strong style={{ 
                color: record.status === 'active' ? '#52c41a' : record.status === 'expiring' ? '#faad14' : '#ff4d4f',
                textTransform: 'capitalize',
              }}>
                {record.status}
              </Text>
            }
          />
          {record.status === 'expiring' && (
            <Tag color="warning" icon={<WarningOutlined />} style={{ marginTop: 4, fontSize: 10 }}>
              {record.daysRemaining} days left
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Expires',
      key: 'expires',
      render: (_: unknown, record: Subscriber) => {
        const progress = record.daysRemaining > 30 ? 100 : Math.max(0, (record.daysRemaining / 30) * 100);
        return (
          <div style={{ minWidth: 100 }}>
            <Text style={{ fontSize: 12 }}>{dayjs(record.expiresAt).format('DD MMM YYYY')}</Text>
            <Progress 
              percent={progress} 
              size="small" 
              showInfo={false}
              strokeColor={record.daysRemaining > 7 ? '#52c41a' : record.daysRemaining > 0 ? '#faad14' : '#ff4d4f'}
              style={{ marginTop: 4 }}
            />
          </div>
        );
      },
    },
    {
      title: 'Wallet',
      dataIndex: 'walletBalance',
      key: 'walletBalance',
      render: (balance: number) => (
        <Space>
          <WalletOutlined style={{ color: '#52c41a' }} />
          <Text strong style={{ color: '#52c41a' }}>₦{balance.toLocaleString()}</Text>
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_: unknown, record: Subscriber) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(record)}
            />
          </Tooltip>
          <Tooltip title="Quick Extend (30 days)">
            <Popconfirm
              title="Extend premium by 30 days?"
              onConfirm={() => extendMutation.mutate({ id: record.id, days: 30, reason: 'Quick extend' })}
            >
              <Button type="text" icon={<GiftOutlined />} style={{ color: '#52c41a' }} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const transactionColumns = [
    {
      title: 'Reference',
      dataIndex: 'paymentReference',
      key: 'paymentReference',
      render: (ref: string) => (
        <Text copyable={{ text: ref }} code style={{ fontSize: 11 }}>
          {ref.substring(0, 16)}...
        </Text>
      ),
    },
    {
      title: 'User',
      key: 'user',
      render: (_: unknown, record: Transaction) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
          <div>
            <Text strong style={{ display: 'block', fontSize: 13 }}>{record.user?.name || 'N/A'}</Text>
            <Text type="secondary" style={{ fontSize: 11 }}>{record.user?.phone}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Tier',
      dataIndex: 'tier',
      key: 'tier',
      render: (tier: string) => (
        <Tag color={getTierColor(tier)} icon={<CrownOutlined />} style={{ textTransform: 'capitalize' }}>
          {tier}
        </Tag>
      ),
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration: string) => (
        <Tag icon={<ClockCircleOutlined />} style={{ textTransform: 'capitalize' }}>{duration}</Tag>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => (
        <Text strong style={{ color: '#52c41a', fontSize: 14 }}>₦{amount.toLocaleString()}</Text>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => (
        <Tooltip title={dayjs(date).format('DD MMM YYYY, HH:mm:ss')}>
          <Text type="secondary">{dayjs(date).fromNow()}</Text>
        </Tooltip>
      ),
    },
  ];

  const totalSubscribers = stats?.totalPremium || 0;
  const activeRate = totalSubscribers > 0 
    ? ((totalSubscribers - (stats?.expired || 0)) / totalSubscribers) * 100 
    : 0;

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
              background: 'linear-gradient(135deg, #f5af19 0%, #f12711 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <CrownOutlined style={{ fontSize: 24, color: '#fff' }} />
            </div>
            Buyer Premium Management
          </Title>
          <Text type="secondary" style={{ marginTop: 8, display: 'block' }}>
            Manage premium buyer subscriptions and monitor revenue
          </Text>
        </div>
        <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card variant="borderless" style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <Text type="secondary">Active Premium Buyers</Text>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#1890ff', marginTop: 4 }}>
                  {stats?.totalPremium || 0}
                </div>
              </div>
              <div style={{ 
                width: 48, 
                height: 48, 
                borderRadius: 12, 
                background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <CrownOutlined style={{ fontSize: 22, color: '#fff' }} />
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
                <Text type="secondary">Total Revenue</Text>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#52c41a', marginTop: 4 }}>
                  ₦{(stats?.revenue.total || 0).toLocaleString()}
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
                <DollarOutlined style={{ fontSize: 22, color: '#fff' }} />
              </div>
            </div>
            <Divider style={{ margin: '12px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Total Subscriptions</Text>
              <Badge count={stats?.revenue.totalCount || 0} style={{ backgroundColor: '#52c41a' }} />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card variant="borderless" style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <Text type="secondary">This Month</Text>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#722ed1', marginTop: 4 }}>
                  ₦{(stats?.revenue.thisMonth || 0).toLocaleString()}
                </div>
              </div>
              <div style={{ 
                width: 48, 
                height: 48, 
                borderRadius: 12, 
                background: 'linear-gradient(135deg, #722ed1 0%, #531dab 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <RiseOutlined style={{ fontSize: 22, color: '#fff' }} />
              </div>
            </div>
            <Divider style={{ margin: '12px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Monthly Subs</Text>
              <Badge count={stats?.revenue.thisMonthCount || 0} style={{ backgroundColor: '#722ed1' }} />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card variant="borderless" style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <Row gutter={16}>
              <Col span={12}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: 10, 
                    background: 'linear-gradient(135deg, #faad14 0%, #d48806 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 8px',
                  }}>
                    <WarningOutlined style={{ fontSize: 18, color: '#fff' }} />
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{stats?.expiringSoon || 0}</div>
                  <Text type="secondary" style={{ fontSize: 11 }}>Expiring</Text>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: 10, 
                    background: 'linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 8px',
                  }}>
                    <ClockCircleOutlined style={{ fontSize: 18, color: '#fff' }} />
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{stats?.expired || 0}</div>
                  <Text type="secondary" style={{ fontSize: 11 }}>Expired</Text>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Tier Breakdown */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {['basic', 'gold', 'platinum'].map((tier) => (
          <Col xs={24} sm={8} key={tier}>
            <Card 
              variant="borderless"
              style={{ 
                borderRadius: 12, 
                background: getTierGradient(tier),
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
            >
              <div style={{ textAlign: 'center', color: '#fff' }}>
                <CrownOutlined style={{ fontSize: 32, marginBottom: 8 }} />
                <div style={{ fontSize: 32, fontWeight: 700 }}>
                  {stats?.byTier?.[tier as keyof typeof stats.byTier] || 0}
                </div>
                <div style={{ textTransform: 'uppercase', fontSize: 14, opacity: 0.9, marginTop: 4 }}>
                  {tier} Members
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Tabs */}
      <Card variant="borderless" style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <Tabs
          activeKey={activeTab}
          onChange={(key) => {
            setActiveTab(key);
            setPage(1);
          }}
          items={[
            {
              key: 'subscribers',
              label: (
                <span>
                  <UserOutlined />
                  Subscribers
                  <Badge count={stats?.totalPremium || 0} style={{ marginLeft: 8 }} />
                </span>
              ),
              children: (
                <>
                  {/* Filters */}
                  <Card size="small" style={{ marginBottom: 16, background: '#fafafa', borderRadius: 8 }}>
                    <Space wrap>
                      <Input
                        placeholder="Search name, email, phone..."
                        prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ width: 250, borderRadius: 8 }}
                        allowClear
                      />
                      <Select
                        placeholder="Tier"
                        value={tierFilter}
                        onChange={setTierFilter}
                        style={{ width: 120 }}
                        allowClear
                        options={[
                          { value: 'basic', label: 'Basic' },
                          { value: 'gold', label: 'Gold' },
                          { value: 'platinum', label: 'Platinum' },
                        ]}
                      />
                      <Select
                        placeholder="Status"
                        value={statusFilter}
                        onChange={setStatusFilter}
                        style={{ width: 120 }}
                        allowClear
                        options={[
                          { value: 'active', label: 'Active' },
                          { value: 'expiring', label: 'Expiring' },
                          { value: 'expired', label: 'Expired' },
                        ]}
                      />
                      <Button
                        icon={<ReloadOutlined />}
                        onClick={() => {
                          setSearch('');
                          setTierFilter(undefined);
                          setStatusFilter(undefined);
                          setPage(1);
                        }}
                      >
                        Reset
                      </Button>
                    </Space>
                  </Card>

                  <Table
                    columns={subscriberColumns}
                    dataSource={subscribersData?.subscribers || []}
                    rowKey="id"
                    loading={subscribersLoading}
                    pagination={{
                      current: page,
                      pageSize,
                      total: subscribersData?.total || 0,
                      showSizeChanger: true,
                      showTotal: (total) => `Total ${total} subscribers`,
                      onChange: (p, ps) => {
                        setPage(p);
                        setPageSize(ps);
                      },
                    }}
                  />
                </>
              ),
            },
            {
              key: 'transactions',
              label: (
                <span>
                  <DollarOutlined />
                  Transactions
                </span>
              ),
              children: (
                <>
                  <Card size="small" style={{ marginBottom: 16, background: '#fafafa', borderRadius: 8 }}>
                    <Space wrap>
                      <Select
                        placeholder="Tier"
                        value={tierFilter}
                        onChange={setTierFilter}
                        style={{ width: 120 }}
                        allowClear
                        options={[
                          { value: 'basic', label: 'Basic' },
                          { value: 'gold', label: 'Gold' },
                          { value: 'platinum', label: 'Platinum' },
                        ]}
                      />
                    </Space>
                  </Card>

                  <Table
                    columns={transactionColumns}
                    dataSource={transactionsData?.transactions || []}
                    rowKey="id"
                    loading={transactionsLoading}
                    pagination={{
                      current: page,
                      pageSize,
                      total: transactionsData?.total || 0,
                      showSizeChanger: true,
                      showTotal: (total) => `Total ${total} transactions`,
                      onChange: (p, ps) => {
                        setPage(p);
                        setPageSize(ps);
                      },
                    }}
                  />
                </>
              ),
            },
            {
              key: 'pricing',
              label: (
                <span>
                  <RiseOutlined />
                  Pricing
                </span>
              ),
              children: (
                <Row gutter={16}>
                  {stats?.pricing && Object.entries(stats.pricing).map(([tier, prices]) => (
                    <Col xs={24} sm={8} key={tier}>
                      <Card
                        variant="borderless"
                        style={{ 
                          borderRadius: 12,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                        }}
                        title={
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ 
                              width: 50, 
                              height: 50, 
                              borderRadius: 25, 
                              background: getTierGradient(tier),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              margin: '0 auto 8px',
                            }}>
                              <CrownOutlined style={{ fontSize: 24, color: '#fff' }} />
                            </div>
                            <span style={{ textTransform: 'capitalize', fontSize: 16 }}>{tier}</span>
                          </div>
                        }
                      >
                        {Object.entries(prices as Record<string, number>).map(([duration, price], index, arr) => (
                          <div 
                            key={duration}
                            style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center',
                              padding: '12px 0',
                              borderBottom: index < arr.length - 1 ? '1px solid #f0f0f0' : 'none'
                            }}
                          >
                            <Tag icon={<CalendarOutlined />} style={{ textTransform: 'capitalize' }}>
                              {duration}
                            </Tag>
                            <Text strong style={{ color: '#52c41a', fontSize: 16 }}>
                              ₦{(price as number).toLocaleString()}
                            </Text>
                          </div>
                        ))}
                      </Card>
                    </Col>
                  ))}
                </Row>
              ),
            },
          ]}
        />
      </Card>

      {/* Details Drawer */}
      <Drawer
        title={
          <Space>
            <div style={{ 
              width: 40, 
              height: 40, 
              borderRadius: 10, 
              background: getTierGradient(selectedSubscriber?.tier || 'basic'),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <CrownOutlined style={{ fontSize: 20, color: '#fff' }} />
            </div>
            <div>
              <div>Subscriber Details</div>
              <Text type="secondary" style={{ fontSize: 12, fontWeight: 'normal' }}>
                {selectedSubscriber?.tier?.toUpperCase()} Member
              </Text>
            </div>
          </Space>
        }
        placement="right"
        size="large"
        onClose={() => {
          setDrawerOpen(false);
          setSelectedSubscriber(null);
          setExtendDays(30);
          setExtendReason('');
          setNewTier('');
        }}
        open={drawerOpen}
      >
        {selectedSubscriber && (
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
                          src={selectedSubscriber.avatar}
                          icon={<UserOutlined />}
                          style={{ backgroundColor: '#1890ff' }}
                        />
                        <div>
                          <Text strong style={{ fontSize: 16, display: 'block' }}>
                            {selectedSubscriber.name}
                          </Text>
                          <Space style={{ marginTop: 8 }}>
                            <Tag color={getTierColor(selectedSubscriber.tier)} icon={<CrownOutlined />}>
                              {selectedSubscriber.tier.toUpperCase()}
                            </Tag>
                            <Badge
                              status={getStatusColor(selectedSubscriber.status) as 'success' | 'warning' | 'error' | 'default'}
                              text={selectedSubscriber.status}
                            />
                          </Space>
                        </div>
                      </Space>
                    </Card>

                    {/* Subscription Details */}
                    <Descriptions bordered column={1} size="small">
                      <Descriptions.Item label="User ID">
                        <Text copyable code>{selectedSubscriber.id}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Contact">
                        <Space orientation="vertical" size={0}>
                          {selectedSubscriber.email && (
                            <Text>
                              <MailOutlined style={{ marginRight: 8 }} />
                              {selectedSubscriber.email}
                            </Text>
                          )}
                          <Text>
                            <PhoneOutlined style={{ marginRight: 8 }} />
                            {selectedSubscriber.phone}
                          </Text>
                        </Space>
                      </Descriptions.Item>
                      <Descriptions.Item label="Expires">
                        <CalendarOutlined style={{ marginRight: 8 }} />
                        {dayjs(selectedSubscriber.expiresAt).format('MMMM DD, YYYY HH:mm')}
                      </Descriptions.Item>
                      <Descriptions.Item label="Days Remaining">
                        <Tag color={selectedSubscriber.daysRemaining > 7 ? 'success' : selectedSubscriber.daysRemaining > 0 ? 'warning' : 'error'}>
                          {selectedSubscriber.daysRemaining > 0 
                            ? `${selectedSubscriber.daysRemaining} days` 
                            : `Expired ${Math.abs(selectedSubscriber.daysRemaining)} days ago`}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Wallet Balance">
                        <Space>
                          <WalletOutlined style={{ color: '#52c41a' }} />
                          <Text strong style={{ color: '#52c41a' }}>
                            ₦{selectedSubscriber.walletBalance.toLocaleString()}
                          </Text>
                        </Space>
                      </Descriptions.Item>
                      <Descriptions.Item label="Member Since">
                        {dayjs(selectedSubscriber.joinedAt).format('MMMM DD, YYYY')}
                      </Descriptions.Item>
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
                            <Text strong>Joined Premium</Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {dayjs(selectedSubscriber.joinedAt).format('MMMM DD, YYYY HH:mm')}
                            </Text>
                          </div>
                        ),
                      },
                      {
                        color: 'blue',
                        dot: <TrophyOutlined />,
                        content: (
                          <div>
                            <Text strong>Tier: {selectedSubscriber.tier.toUpperCase()}</Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              Premium tier assigned
                            </Text>
                          </div>
                        ),
                      },
                      {
                        color: selectedSubscriber.status === 'active' ? 'green' : selectedSubscriber.status === 'expiring' ? 'orange' : 'red',
                        dot: selectedSubscriber.status === 'active' ? <CheckCircleOutlined /> : <ClockCircleOutlined />,
                        content: (
                          <div>
                            <Text strong style={{ textTransform: 'capitalize' }}>
                              Status: {selectedSubscriber.status}
                            </Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              Expires: {dayjs(selectedSubscriber.expiresAt).format('MMMM DD, YYYY')}
                            </Text>
                          </div>
                        ),
                      },
                    ]}
                  />
                ),
              },
              {
                key: 'actions',
                label: <span><ThunderboltOutlined /> Actions</span>,
                children: (
                  <Space orientation="vertical" size="large" style={{ width: '100%' }}>
                    {/* Extend Premium */}
                    <Card size="small" title={<><GiftOutlined style={{ color: '#52c41a', marginRight: 8 }} />Extend Premium</>}>
                      <Space orientation="vertical" style={{ width: '100%' }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <InputNumber
                            min={1}
                            max={365}
                            value={extendDays}
                            onChange={(v) => setExtendDays(v || 30)}
                            style={{ width: 100 }}
                            addonAfter="days"
                          />
                        </div>
                        <Input
                          placeholder="Reason (optional)"
                          value={extendReason}
                          onChange={(e) => setExtendReason(e.target.value)}
                        />
                        <Button
                          type="primary"
                          icon={<GiftOutlined />}
                          onClick={() => extendMutation.mutate({
                            id: selectedSubscriber.id,
                            days: extendDays,
                            reason: extendReason,
                          })}
                          loading={extendMutation.isPending}
                          block
                        >
                          Extend Premium
                        </Button>
                      </Space>
                    </Card>

                    {/* Change Tier */}
                    <Card size="small" title={<><SwapOutlined style={{ color: '#1890ff', marginRight: 8 }} />Change Tier</>}>
                      <Space orientation="vertical" style={{ width: '100%' }}>
                        <Select
                          placeholder="Select new tier"
                          value={newTier || undefined}
                          onChange={setNewTier}
                          style={{ width: '100%' }}
                          options={[
                            { value: 'basic', label: 'Basic' },
                            { value: 'gold', label: 'Gold' },
                            { value: 'platinum', label: 'Platinum' },
                          ].filter(o => o.value !== selectedSubscriber.tier)}
                        />
                        <Button
                          icon={<SwapOutlined />}
                          onClick={() => changeTierMutation.mutate({
                            id: selectedSubscriber.id,
                            tier: newTier,
                          })}
                          loading={changeTierMutation.isPending}
                          disabled={!newTier}
                          block
                        >
                          Change Tier
                        </Button>
                      </Space>
                    </Card>

                    {/* Cancel Premium */}
                    {selectedSubscriber.status !== 'expired' && (
                      <Card size="small" title={<><StopOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />Cancel Premium</>}>
                        <Popconfirm
                          title="Cancel this premium subscription?"
                          description="This will immediately revoke premium access."
                          onConfirm={() => cancelMutation.mutate({ id: selectedSubscriber.id })}
                          okText="Yes, Cancel"
                          okButtonProps={{ danger: true }}
                        >
                          <Button
                            danger
                            icon={<StopOutlined />}
                            loading={cancelMutation.isPending}
                            block
                          >
                            Cancel Premium
                          </Button>
                        </Popconfirm>
                      </Card>
                    )}
                  </Space>
                ),
              },
            ]}
          />
        )}
      </Drawer>
    </div>
  );
}
