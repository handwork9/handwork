'use client';

import React, { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  DatePicker,
  Select,
  Typography,
  Space,
  Spin,
  Progress,
  Segmented,
  Divider,
  Badge,
  Avatar,
  Tooltip,
  Button,
} from 'antd';
import {
  DollarOutlined,
  RiseOutlined,
  ShopOutlined,
  CarOutlined,
  PercentageOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  TrophyOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
  FieldTimeOutlined,
  BankOutlined,
  CrownOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import dayjs, { Dayjs } from 'dayjs';
import { adminApi } from '@/lib/api';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface RevenueBreakdown {
  type: string;
  amount: number;
  count: number;
  percentage: number;
}

interface TopContributor {
  userId: string;
  userName: string;
  userType: string;
  totalRevenue: number;
  transactionCount: number;
}

interface RevenueTransaction {
  id: string;
  type: string;
  amount: number;
  orderId: string;
  sourceUserType: string;
  rateApplied: number;
  grossAmount: number;
  status: string;
  createdAt: string;
}

interface RevenueDashboard {
  totalRevenue: number;
  totalTransactions: number;
  averageRevenue: number;
  breakdown: RevenueBreakdown[];
  topContributors: TopContributor[];
  recentTransactions: RevenueTransaction[];
}

interface RevenueSummary {
  period: string;
  currentPeriod: {
    total: number;
    breakdown: Record<string, number>;
  };
  previousPeriod: {
    total: number;
    breakdown: Record<string, number>;
  };
  percentageChange: number;
}

const revenueTypeLabels: Record<string, string> = {
  farmer_commission: 'Farmer Commission',
  rider_commission: 'Rider Commission',
  service_fee: 'Service Fee',
  subscription: 'Subscription',
  featured_listing: 'Featured Listing',
  other: 'Other',
};

const revenueTypeColors: Record<string, string> = {
  farmer_commission: 'green',
  rider_commission: 'blue',
  service_fee: 'purple',
  subscription: 'gold',
  featured_listing: 'orange',
  other: 'default',
};

const revenueTypeIcons: Record<string, React.ReactNode> = {
  farmer_commission: <ShopOutlined />,
  rider_commission: <CarOutlined />,
  service_fee: <PercentageOutlined />,
  subscription: <CrownOutlined />,
  featured_listing: <StarOutlined />,
};

export default function RevenuePage() {
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [revenueType, setRevenueType] = useState<string | undefined>(undefined);
  const [summaryPeriod, setSummaryPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Fetch revenue dashboard
  const { data: dashboard, isLoading: dashboardLoading, refetch } = useQuery<RevenueDashboard>({
    queryKey: ['revenue-dashboard', dateRange?.map(d => d.format('YYYY-MM-DD'))],
    queryFn: async () => {
      const params: { startDate?: string; endDate?: string } = {};
      if (dateRange) {
        params.startDate = dateRange[0].format('YYYY-MM-DD');
        params.endDate = dateRange[1].format('YYYY-MM-DD');
      }
      const response = await adminApi.getRevenueDashboard(params);
      return response.data;
    },
  });

  // Fetch revenue transactions
  const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
    queryKey: ['revenue-transactions', page, pageSize, revenueType, dateRange?.map(d => d.format('YYYY-MM-DD'))],
    queryFn: async () => {
      const params: { 
        page: number; 
        limit: number; 
        type?: string; 
        startDate?: string; 
        endDate?: string;
      } = {
        page,
        limit: pageSize,
      };
      if (revenueType) params.type = revenueType;
      if (dateRange) {
        params.startDate = dateRange[0].format('YYYY-MM-DD');
        params.endDate = dateRange[1].format('YYYY-MM-DD');
      }
      const response = await adminApi.getRevenueTransactions(params);
      return response.data;
    },
  });

  // Fetch revenue summary
  const { data: summary, isLoading: summaryLoading } = useQuery<RevenueSummary>({
    queryKey: ['revenue-summary', summaryPeriod],
    queryFn: async () => {
      const response = await adminApi.getRevenueSummary({ period: summaryPeriod });
      return response.data;
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const transactionColumns: ColumnsType<RevenueTransaction> = [
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => (
        <Tooltip title={dayjs(date).format('DD MMM YYYY, HH:mm:ss')}>
          <Space orientation="vertical" size={0}>
            <Text>{dayjs(date).format('MMM DD, YYYY')}</Text>
            <Text type="secondary" style={{ fontSize: 11 }}>
              <FieldTimeOutlined style={{ marginRight: 4 }} />
              {dayjs(date).format('HH:mm')}
            </Text>
          </Space>
        </Tooltip>
      ),
      width: 140,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={revenueTypeColors[type]} icon={revenueTypeIcons[type]}>
          {revenueTypeLabels[type] || type}
        </Tag>
      ),
      width: 180,
    },
    {
      title: 'Gross Amount',
      dataIndex: 'grossAmount',
      key: 'grossAmount',
      render: (amount: number) => (
        <Text type="secondary">{formatCurrency(amount)}</Text>
      ),
      width: 140,
      align: 'right',
    },
    {
      title: 'Rate',
      dataIndex: 'rateApplied',
      key: 'rateApplied',
      render: (rate: number) => (
        <Tag color="blue">{rate}%</Tag>
      ),
      width: 80,
      align: 'center',
    },
    {
      title: 'Revenue',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => (
        <Text strong style={{ color: '#52c41a', fontSize: 14 }}>
          <DollarOutlined style={{ marginRight: 4 }} />
          {formatCurrency(amount)}
        </Text>
      ),
      width: 150,
      align: 'right',
    },
    {
      title: 'Source',
      dataIndex: 'sourceUserType',
      key: 'sourceUserType',
      render: (type: string) => (
        <Tag icon={type === 'farmer' ? <ShopOutlined /> : <CarOutlined />} color={type === 'farmer' ? 'green' : 'orange'}>
          {type === 'farmer' ? 'Farmer' : type === 'rider' ? 'Rider' : type}
        </Tag>
      ),
      width: 100,
    },
    {
      title: 'Order ID',
      dataIndex: 'orderId',
      key: 'orderId',
      render: (orderId: string) => (
        <Text copyable={{ text: orderId }} style={{ fontFamily: 'monospace', fontSize: 11 }}>
          {orderId?.slice(0, 8)}...
        </Text>
      ),
      width: 120,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Badge 
          status={status === 'completed' ? 'success' : status === 'pending' ? 'processing' : 'error'} 
          text={<Text style={{ textTransform: 'capitalize' }}>{status}</Text>}
        />
      ),
      width: 100,
    },
  ];

  if (dashboardLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>
            <DollarOutlined style={{ marginRight: 12, color: '#52c41a' }} />
            Platform Revenue
          </Title>
          <Text type="secondary">Track and analyze platform earnings from commissions and fees</Text>
        </div>
        <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={dashboardLoading}>
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: 24 }}>
        <Space wrap size="middle">
          <div>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>Date Range</Text>
            <RangePicker
              value={dateRange}
              onChange={(dates) => setDateRange(dates as [Dayjs, Dayjs] | null)}
              placeholder={['Start Date', 'End Date']}
              presets={[
                { label: 'Today', value: [dayjs(), dayjs()] },
                { label: 'This Week', value: [dayjs().startOf('week'), dayjs()] },
                { label: 'This Month', value: [dayjs().startOf('month'), dayjs()] },
                { label: 'Last 30 Days', value: [dayjs().subtract(30, 'day'), dayjs()] },
              ]}
            />
          </div>
          <div>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>Revenue Type</Text>
            <Select
              placeholder="All Types"
              allowClear
              style={{ width: 200 }}
              value={revenueType}
              onChange={setRevenueType}
              options={Object.entries(revenueTypeLabels).map(([value, label]) => ({
                value,
                label: (
                  <Space>
                    {revenueTypeIcons[value]}
                    {label}
                  </Space>
                ),
              }))}
            />
          </div>
        </Space>
      </Card>

      {/* Enhanced Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title={
                <Space>
                  <DollarOutlined style={{ color: '#52c41a' }} />
                  <span>Total Revenue</span>
                </Space>
              }
              value={dashboard?.totalRevenue || 0}
              precision={0}
              prefix="₦"
              styles={{ content: { color: '#52c41a' } }}
              formatter={(value) => value?.toLocaleString()}
            />
            <Divider style={{ margin: '12px 0' }} />
            <Badge status="success" text={<Text type="secondary">All time earnings</Text>} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title={
                <Space>
                  <ThunderboltOutlined style={{ color: '#1890ff' }} />
                  <span>Total Transactions</span>
                </Space>
              }
              value={dashboard?.totalTransactions || 0}
              styles={{ content: { color: '#1890ff' } }}
            />
            <Divider style={{ margin: '12px 0' }} />
            <Badge status="processing" text={<Text type="secondary">Revenue generating</Text>} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title={
                <Space>
                  <BankOutlined style={{ color: '#722ed1' }} />
                  <span>Average per Transaction</span>
                </Space>
              }
              value={dashboard?.averageRevenue || 0}
              precision={0}
              prefix="₦"
              styles={{ content: { color: '#722ed1' } }}
              formatter={(value) => value?.toLocaleString()}
            />
            <Divider style={{ margin: '12px 0' }} />
            <Text type="secondary" style={{ fontSize: 12 }}>Per completed transaction</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title={
                <Space>
                  <RiseOutlined style={{ color: summary?.percentageChange && summary.percentageChange >= 0 ? '#52c41a' : '#ff4d4f' }} />
                  <span>{summaryPeriod.charAt(0).toUpperCase() + summaryPeriod.slice(1)} Change</span>
                </Space>
              }
              value={summary?.percentageChange || 0}
              precision={1}
              prefix={summary?.percentageChange && summary.percentageChange >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
              suffix="%"
              styles={{ content: { color: summary?.percentageChange && summary.percentageChange >= 0 ? '#52c41a' : '#ff4d4f' } }}
              loading={summaryLoading}
            />
            <Divider style={{ margin: '12px 0' }} />
            <Tag color={summary?.percentageChange && summary.percentageChange >= 0 ? 'green' : 'red'}>
              {summary?.percentageChange && summary.percentageChange >= 0 ? 'Growing' : 'Declining'}
            </Tag>
          </Card>
        </Col>
      </Row>

      {/* Revenue Breakdown & Period Comparison */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card 
            title={
              <Space>
                <PercentageOutlined style={{ color: '#722ed1' }} />
                Revenue Breakdown by Type
              </Space>
            }
          >
            {dashboard?.breakdown?.map((item) => (
              <div key={item.type} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Space>
                    <Avatar 
                      size="small" 
                      icon={revenueTypeIcons[item.type]} 
                      style={{ 
                        backgroundColor: item.type === 'farmer_commission' ? '#52c41a' : 
                                        item.type === 'rider_commission' ? '#1890ff' : 
                                        item.type === 'service_fee' ? '#722ed1' : '#faad14' 
                      }}
                    />
                    <Text>{revenueTypeLabels[item.type] || item.type}</Text>
                  </Space>
                  <Text strong>{formatCurrency(item.amount)}</Text>
                </div>
                <Progress
                  percent={item.percentage}
                  strokeColor={
                    item.type === 'farmer_commission' ? '#52c41a' :
                    item.type === 'rider_commission' ? '#1890ff' :
                    item.type === 'service_fee' ? '#722ed1' : '#faad14'
                  }
                  format={() => <Tag>{item.count} txns</Tag>}
                />
              </div>
            ))}
            {(!dashboard?.breakdown || dashboard.breakdown.length === 0) && (
              <Text type="secondary">No revenue data available for the selected period</Text>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card 
            title={
              <Space>
                <FieldTimeOutlined style={{ color: '#1890ff' }} />
                Period Comparison
              </Space>
            }
            extra={
              <Segmented
                size="small"
                options={[
                  { label: 'Daily', value: 'daily' },
                  { label: 'Weekly', value: 'weekly' },
                  { label: 'Monthly', value: 'monthly' },
                  { label: 'Yearly', value: 'yearly' },
                ]}
                value={summaryPeriod}
                onChange={(value) => setSummaryPeriod(value as typeof summaryPeriod)}
              />
            }
          >
            {summaryLoading ? (
              <Spin />
            ) : summary?.currentPeriod ? (
              <>
                <Row gutter={16} style={{ marginBottom: 24 }}>
                  <Col span={12}>
                    <Card size="small" style={{ background: 'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)', border: 'none' }}>
                      <Statistic
                        title={<Text style={{ color: '#237804' }}>Current {summaryPeriod}</Text>}
                        value={summary.currentPeriod.total || 0}
                        precision={0}
                        prefix="₦"
                        styles={{ content: { color: '#237804', fontSize: 20 } }}
                        formatter={(value) => value?.toLocaleString()}
                      />
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card size="small" style={{ background: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)', border: 'none' }}>
                      <Statistic
                        title={<Text style={{ color: '#595959' }}>Previous {summaryPeriod}</Text>}
                        value={summary.previousPeriod?.total || 0}
                        precision={0}
                        prefix="₦"
                        styles={{ content: { color: '#595959', fontSize: 20 } }}
                        formatter={(value) => value?.toLocaleString()}
                      />
                    </Card>
                  </Col>
                </Row>
                <div style={{ textAlign: 'center' }}>
                  <Text type="secondary">Breakdown by type for current {summaryPeriod}:</Text>
                  <div style={{ marginTop: 12 }}>
                    <Space wrap>
                      {Object.entries(summary.currentPeriod.breakdown || {}).map(([type, amount]) => (
                        <Tag key={type} color={revenueTypeColors[type]} icon={revenueTypeIcons[type]}>
                          {revenueTypeLabels[type]}: {formatCurrency(amount as number)}
                        </Tag>
                      ))}
                    </Space>
                  </div>
                </div>
              </>
            ) : (
              <Text type="secondary">No summary data available</Text>
            )}
          </Card>
        </Col>
      </Row>

      {/* Top Contributors */}
      {dashboard?.topContributors && dashboard.topContributors.length > 0 && (
        <Card 
          title={
            <Space>
              <TrophyOutlined style={{ color: '#faad14' }} />
              Top Revenue Contributors
            </Space>
          }
          style={{ marginBottom: 24 }}
        >
          <Row gutter={[16, 16]}>
            {dashboard.topContributors.slice(0, 5).map((contributor, index) => (
              <Col xs={24} sm={12} lg={4} key={contributor.userId}>
                <Card 
                  size="small" 
                  hoverable
                  style={{ textAlign: 'center' }}
                >
                  <Avatar 
                    size={48}
                    style={{ 
                      background: index === 0 ? 'linear-gradient(135deg, #faad14 0%, #ffc53d 100%)' : 
                                 index === 1 ? 'linear-gradient(135deg, #bfbfbf 0%, #d9d9d9 100%)' : 
                                 index === 2 ? 'linear-gradient(135deg, #d48806 0%, #fa8c16 100%)' : '#f0f0f0',
                      color: index < 3 ? '#fff' : '#8c8c8c',
                      marginBottom: 8,
                    }}
                  >
                    {index + 1}
                  </Avatar>
                  <Text strong style={{ display: 'block' }}>{contributor.userName || 'Unknown'}</Text>
                  <Tag 
                    color={contributor.userType === 'farmer' ? 'green' : 'orange'} 
                    icon={contributor.userType === 'farmer' ? <ShopOutlined /> : <CarOutlined />}
                    style={{ marginTop: 4 }}
                  >
                    {contributor.userType}
                  </Tag>
                  <Divider style={{ margin: '12px 0' }} />
                  <Text strong style={{ color: '#52c41a', fontSize: 16 }}>{formatCurrency(contributor.totalRevenue)}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>{contributor.transactionCount} transactions</Text>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      {/* Transactions Table */}
      <Card 
        title={
          <Space>
            <BankOutlined style={{ color: '#1890ff' }} />
            Revenue Transactions
          </Space>
        }
        extra={<Badge count={transactionsData?.total || 0} style={{ backgroundColor: '#1890ff' }} overflowCount={9999} />}
      >
        <Table
          columns={transactionColumns}
          dataSource={Array.isArray(transactionsData?.data) ? transactionsData.data : Array.isArray(transactionsData) ? transactionsData : []}
          rowKey="id"
          loading={transactionsLoading}
          pagination={{
            current: page,
            pageSize: pageSize,
            total: transactionsData?.total || 0,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} transactions`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  );
}
