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
} from 'antd';
import {
  DollarOutlined,
  RiseOutlined,
  ShopOutlined,
  CarOutlined,
  PercentageOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import dayjs, { Dayjs } from 'dayjs';
import { adminApi } from '@/lib/api';

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
};

export default function RevenuePage() {
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [revenueType, setRevenueType] = useState<string | undefined>(undefined);
  const [summaryPeriod, setSummaryPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Fetch revenue dashboard
  const { data: dashboard, isLoading: dashboardLoading } = useQuery<RevenueDashboard>({
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

  const transactionColumns = [
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('MMM DD, YYYY HH:mm'),
      width: 160,
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
      align: 'right' as const,
    },
    {
      title: 'Rate',
      dataIndex: 'rateApplied',
      key: 'rateApplied',
      render: (rate: number) => `${rate}%`,
      width: 80,
      align: 'center' as const,
    },
    {
      title: 'Revenue',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => (
        <Text strong style={{ color: '#52c41a' }}>{formatCurrency(amount)}</Text>
      ),
      width: 140,
      align: 'right' as const,
    },
    {
      title: 'Source',
      dataIndex: 'sourceUserType',
      key: 'sourceUserType',
      render: (type: string) => (
        <Tag>{type === 'farmer' ? 'Farmer' : type === 'rider' ? 'Rider' : type}</Tag>
      ),
      width: 100,
    },
    {
      title: 'Order ID',
      dataIndex: 'orderId',
      key: 'orderId',
      render: (orderId: string) => (
        <Text code style={{ fontSize: 12 }}>{orderId?.slice(0, 8)}...</Text>
      ),
      width: 120,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'completed' ? 'success' : status === 'pending' ? 'processing' : 'error'}>
          {status}
        </Tag>
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
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          <DollarOutlined style={{ marginRight: 12 }} />
          Platform Revenue
        </Title>
        <Text type="secondary">Track and analyze platform earnings from commissions and fees</Text>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: 24 }}>
        <Space wrap>
          <RangePicker
            value={dateRange}
            onChange={(dates) => setDateRange(dates as [Dayjs, Dayjs] | null)}
            placeholder={['Start Date', 'End Date']}
          />
          <Select
            placeholder="Revenue Type"
            allowClear
            style={{ width: 180 }}
            value={revenueType}
            onChange={setRevenueType}
            options={Object.entries(revenueTypeLabels).map(([value, label]) => ({
              value,
              label,
            }))}
          />
        </Space>
      </Card>

      {/* Summary Cards */}
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Revenue"
              value={dashboard?.totalRevenue || 0}
              precision={0}
              prefix="₦"
              styles={{ content: { color: '#52c41a' } }}
              formatter={(value) => value?.toLocaleString()}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Transactions"
              value={dashboard?.totalTransactions || 0}
              prefix={<RiseOutlined />}
              styles={{ content: { color: '#1890ff' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Average per Transaction"
              value={dashboard?.averageRevenue || 0}
              precision={0}
              prefix="₦"
              formatter={(value) => value?.toLocaleString()}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={`${summaryPeriod.charAt(0).toUpperCase() + summaryPeriod.slice(1)} Change`}
              value={summary?.percentageChange || 0}
              precision={1}
              prefix={summary?.percentageChange && summary.percentageChange >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
              suffix="%"
              styles={{ content: { color: summary?.percentageChange && summary.percentageChange >= 0 ? '#52c41a' : '#ff4d4f' } }}
              loading={summaryLoading}
            />
          </Card>
        </Col>
      </Row>

      {/* Revenue Breakdown & Period Comparison */}
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Revenue Breakdown by Type" extra={<DollarOutlined />}>
            {dashboard?.breakdown?.map((item) => (
              <div key={item.type} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Space>
                    {revenueTypeIcons[item.type]}
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
                  format={() => `${item.count} txns`}
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
            title="Period Comparison" 
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
                    <Card size="small" style={{ background: '#f6ffed' }}>
                      <Statistic
                        title={`Current ${summaryPeriod}`}
                        value={summary.currentPeriod.total || 0}
                        precision={0}
                        prefix="₦"
                        styles={{ content: { color: '#52c41a', fontSize: 20 } }}
                        formatter={(value) => value?.toLocaleString()}
                      />
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card size="small" style={{ background: '#f0f0f0' }}>
                      <Statistic
                        title={`Previous ${summaryPeriod}`}
                        value={summary.previousPeriod?.total || 0}
                        precision={0}
                        prefix="₦"
                        styles={{ content: { color: '#8c8c8c', fontSize: 20 } }}
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
                        <Tag key={type} color={revenueTypeColors[type]}>
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
        <Card title="Top Revenue Contributors" style={{ marginBottom: 24 }}>
          <Row gutter={[16, 16]}>
            {dashboard.topContributors.slice(0, 5).map((contributor, index) => (
              <Col xs={24} sm={12} lg={4} key={contributor.userId}>
                <Card size="small" style={{ textAlign: 'center' }}>
                  <div style={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: '50%', 
                    background: index === 0 ? '#faad14' : index === 1 ? '#bfbfbf' : index === 2 ? '#d48806' : '#f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 8px',
                    color: index < 3 ? '#fff' : '#8c8c8c',
                    fontWeight: 'bold',
                  }}>
                    #{index + 1}
                  </div>
                  <Text strong style={{ display: 'block' }}>{contributor.userName || 'Unknown'}</Text>
                  <Tag style={{ fontSize: 10 }}>{contributor.userType}</Tag>
                  <div style={{ marginTop: 8 }}>
                    <Text type="success" strong>{formatCurrency(contributor.totalRevenue)}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>{contributor.transactionCount} transactions</Text>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      {/* Transactions Table */}
      <Card title="Revenue Transactions">
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
            showTotal: (total) => `Total ${total} transactions`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
          scroll={{ x: 1100 }}
        />
      </Card>
    </div>
  );
}
