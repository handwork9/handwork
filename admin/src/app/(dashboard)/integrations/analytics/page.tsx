'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Button,
  Table,
  Space,
  Tag,
  Statistic,
  Tabs,
  Alert,
  Divider,
  Select,
  DatePicker,
  Progress,
  Empty,
} from 'antd';
import {
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  UserOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  MobileOutlined,
  DesktopOutlined,
  ReloadOutlined,
  DownloadOutlined,
  RiseOutlined,
  FallOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { format, subDays } from 'date-fns';

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;

interface EventStats {
  eventName: string;
  count: number;
  uniqueUsers: number;
  change: number;
}

interface PageView {
  screenName: string;
  views: number;
  uniqueViews: number;
  avgTime: string;
}

interface EcommerceData {
  totalRevenue: number;
  transactions: number;
  avgOrderValue: number;
  conversionRate: number;
  topProducts: { name: string; revenue: number; quantity: number }[];
}

// Mock data
const mockEventStats: EventStats[] = [
  { eventName: 'page_view', count: 45230, uniqueUsers: 8420, change: 12.5 },
  { eventName: 'view_item', count: 12450, uniqueUsers: 5230, change: 8.2 },
  { eventName: 'add_to_cart', count: 4520, uniqueUsers: 2850, change: 15.3 },
  { eventName: 'begin_checkout', count: 2150, uniqueUsers: 1820, change: -2.1 },
  { eventName: 'purchase', count: 1250, uniqueUsers: 1180, change: 22.4 },
  { eventName: 'sign_up', count: 420, uniqueUsers: 420, change: 18.7 },
  { eventName: 'login', count: 8540, uniqueUsers: 3250, change: 5.4 },
];

const mockPageViews: PageView[] = [
  { screenName: 'HomeScreen', views: 15230, uniqueViews: 8420, avgTime: '2m 15s' },
  { screenName: 'ProductDetails', views: 12450, uniqueViews: 5230, avgTime: '3m 42s' },
  { screenName: 'CategoryScreen', views: 8920, uniqueViews: 4120, avgTime: '1m 58s' },
  { screenName: 'CartScreen', views: 4520, uniqueViews: 2850, avgTime: '2m 30s' },
  { screenName: 'CheckoutScreen', views: 2150, uniqueViews: 1820, avgTime: '4m 15s' },
  { screenName: 'ProfileScreen', views: 3840, uniqueViews: 2450, avgTime: '1m 22s' },
  { screenName: 'OrdersScreen', views: 2920, uniqueViews: 1850, avgTime: '2m 05s' },
];

const mockEcommerceData: EcommerceData = {
  totalRevenue: 2450000,
  transactions: 1250,
  avgOrderValue: 1960,
  conversionRate: 2.8,
  topProducts: [
    { name: 'Fresh Tomatoes (1kg)', revenue: 245000, quantity: 1250 },
    { name: 'Organic Spinach Bundle', revenue: 189000, quantity: 980 },
    { name: 'Farm Fresh Eggs (Crate)', revenue: 156000, quantity: 650 },
    { name: 'Local Honey (500ml)', revenue: 142000, quantity: 420 },
    { name: 'Cassava Flour (5kg)', revenue: 128000, quantity: 380 },
  ],
};

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<[any, any] | null>(null);
  const [eventStats, setEventStats] = useState<EventStats[]>(mockEventStats);
  const [pageViews, setPageViews] = useState<PageView[]>(mockPageViews);
  const [ecommerceData, setEcommerceData] = useState<EcommerceData>(mockEcommerceData);

  const overviewStats = {
    totalUsers: 12450,
    activeUsers: 3850,
    sessions: 28420,
    bounceRate: 42.5,
    avgSessionDuration: '3m 28s',
  };

  const platformBreakdown = [
    { platform: 'iOS', users: 5420, percentage: 43.5 },
    { platform: 'Android', users: 6230, percentage: 50.1 },
    { platform: 'Web', users: 800, percentage: 6.4 },
  ];

  const eventColumns: ColumnsType<EventStats> = [
    {
      title: 'Event Name',
      dataIndex: 'eventName',
      key: 'eventName',
      render: (name) => <Text code>{name}</Text>,
    },
    {
      title: 'Total Count',
      dataIndex: 'count',
      key: 'count',
      render: (val) => val.toLocaleString(),
      sorter: (a, b) => a.count - b.count,
    },
    {
      title: 'Unique Users',
      dataIndex: 'uniqueUsers',
      key: 'uniqueUsers',
      render: (val) => val.toLocaleString(),
    },
    {
      title: 'Change',
      dataIndex: 'change',
      key: 'change',
      render: (change) => (
        <Space>
          {change >= 0 ? (
            <RiseOutlined style={{ color: '#52c41a' }} />
          ) : (
            <FallOutlined style={{ color: '#ff4d4f' }} />
          )}
          <Text style={{ color: change >= 0 ? '#52c41a' : '#ff4d4f' }}>
            {change >= 0 ? '+' : ''}{change}%
          </Text>
        </Space>
      ),
      sorter: (a, b) => a.change - b.change,
    },
  ];

  const pageViewColumns: ColumnsType<PageView> = [
    {
      title: 'Screen Name',
      dataIndex: 'screenName',
      key: 'screenName',
      render: (name) => <Text strong>{name}</Text>,
    },
    {
      title: 'Page Views',
      dataIndex: 'views',
      key: 'views',
      render: (val) => val.toLocaleString(),
      sorter: (a, b) => a.views - b.views,
    },
    {
      title: 'Unique Views',
      dataIndex: 'uniqueViews',
      key: 'uniqueViews',
      render: (val) => val.toLocaleString(),
    },
    {
      title: 'Avg. Time on Page',
      dataIndex: 'avgTime',
      key: 'avgTime',
    },
  ];

  const productColumns: ColumnsType<{ name: string; revenue: number; quantity: number }> = [
    {
      title: 'Product',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Revenue',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (val) => `₦${val.toLocaleString()}`,
      sorter: (a, b) => a.revenue - b.revenue,
    },
    {
      title: 'Quantity Sold',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (val) => val.toLocaleString(),
    },
  ];

  // Initialize date range on client side to avoid hydration mismatch
  useEffect(() => {
    setDateRange([subDays(new Date(), 30), new Date()]);
  }, []);

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 24 }}>
        <Space align="center" style={{ marginBottom: 8 }}>
          <BarChartOutlined style={{ fontSize: 32, color: '#F9AB00' }} />
          <Title level={2} style={{ margin: 0 }}>Google Analytics</Title>
        </Space>
        <Paragraph type="secondary">
          Track user behavior, conversions, and e-commerce performance
        </Paragraph>
      </div>

      {/* Configuration Alert */}
      <Alert
        message="Configuration Required"
        description={
          <Space direction="vertical">
            <Text>Ensure these environment variables are set in your backend:</Text>
            <Text code>GA_MEASUREMENT_ID=G-XXXXXXXXXX</Text>
            <Text code>GA_API_SECRET=your_api_secret</Text>
          </Space>
        }
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      {/* Date Range Selector */}
      <Space style={{ marginBottom: 24 }}>
        <RangePicker
          value={dateRange}
          onChange={(dates) => setDateRange(dates as [any, any])}
        />
        <Select defaultValue="all" style={{ width: 150 }}>
          <Select.Option value="all">All Platforms</Select.Option>
          <Select.Option value="ios">iOS</Select.Option>
          <Select.Option value="android">Android</Select.Option>
          <Select.Option value="web">Web</Select.Option>
        </Select>
        <Button icon={<ReloadOutlined />} onClick={() => setLoading(true)}>
          Refresh
        </Button>
        <Button icon={<DownloadOutlined />}>
          Export
        </Button>
      </Space>

      {/* Overview Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic
              title="Total Users"
              value={overviewStats.totalUsers}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic
              title="Active Users"
              value={overviewStats.activeUsers}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic
              title="Sessions"
              value={overviewStats.sessions}
              prefix={<LineChartOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card>
            <Statistic
              title="Bounce Rate"
              value={overviewStats.bounceRate}
              suffix="%"
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card>
            <Statistic
              title="Avg Session"
              value={overviewStats.avgSessionDuration}
            />
          </Card>
        </Col>
      </Row>

      {/* Platform Breakdown */}
      <Card title="Platform Breakdown" style={{ marginBottom: 24 }}>
        <Row gutter={24}>
          {platformBreakdown.map((platform) => (
            <Col key={platform.platform} xs={24} sm={8}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Space>
                  {platform.platform === 'iOS' ? (
                    <MobileOutlined style={{ color: '#999' }} />
                  ) : platform.platform === 'Android' ? (
                    <MobileOutlined style={{ color: '#3DDC84' }} />
                  ) : (
                    <DesktopOutlined style={{ color: '#1890ff' }} />
                  )}
                  <Text strong>{platform.platform}</Text>
                </Space>
                <Progress
                  percent={platform.percentage}
                  format={() => `${platform.users.toLocaleString()} users`}
                />
              </Space>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Tabs */}
      <Tabs
        items={[
          {
            key: 'events',
            label: 'Events',
            children: (
              <Card>
                <Table
                  columns={eventColumns}
                  dataSource={eventStats}
                  rowKey="eventName"
                  pagination={false}
                />
              </Card>
            ),
          },
          {
            key: 'pages',
            label: 'Page Views',
            children: (
              <Card>
                <Table
                  columns={pageViewColumns}
                  dataSource={pageViews}
                  rowKey="screenName"
                  pagination={false}
                />
              </Card>
            ),
          },
          {
            key: 'ecommerce',
            label: 'E-commerce',
            children: (
              <Card>
                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                  <Col xs={12} sm={6}>
                    <Statistic
                      title="Total Revenue"
                      value={ecommerceData.totalRevenue}
                      prefix="₦"
                      valueStyle={{ color: '#52c41a' }}
                    />
                  </Col>
                  <Col xs={12} sm={6}>
                    <Statistic
                      title="Transactions"
                      value={ecommerceData.transactions}
                      prefix={<ShoppingCartOutlined />}
                    />
                  </Col>
                  <Col xs={12} sm={6}>
                    <Statistic
                      title="Avg Order Value"
                      value={ecommerceData.avgOrderValue}
                      prefix="₦"
                    />
                  </Col>
                  <Col xs={12} sm={6}>
                    <Statistic
                      title="Conversion Rate"
                      value={ecommerceData.conversionRate}
                      suffix="%"
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Col>
                </Row>

                <Divider>Top Products by Revenue</Divider>

                <Table
                  columns={productColumns}
                  dataSource={ecommerceData.topProducts}
                  rowKey="name"
                  pagination={false}
                />
              </Card>
            ),
          },
          {
            key: 'realtime',
            label: 'Real-time',
            children: (
              <Card>
                <Empty
                  description={
                    <Space direction="vertical">
                      <Text>Real-time analytics coming soon</Text>
                      <Text type="secondary">
                        View live user activity on your app
                      </Text>
                    </Space>
                  }
                />
              </Card>
            ),
          },
          {
            key: 'custom',
            label: 'Custom Events',
            children: (
              <Card>
                <Alert
                  message="Custom Event Tracking"
                  description="Track custom events specific to your business like farmer signups, rider assignments, and more."
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
                <Table
                  columns={[
                    { title: 'Event', dataIndex: 'event', key: 'event', render: (v) => <Text code>{v}</Text> },
                    { title: 'Count', dataIndex: 'count', key: 'count' },
                    { title: 'Description', dataIndex: 'description', key: 'description' },
                  ]}
                  dataSource={[
                    { event: 'farmer_signup', count: 45, description: 'New farmer registrations' },
                    { event: 'farmer_verified', count: 38, description: 'Farmers completing verification' },
                    { event: 'rider_assignment', count: 1250, description: 'Orders assigned to riders' },
                    { event: 'delivery_complete', count: 1180, description: 'Successful deliveries' },
                    { event: 'group_buy_join', count: 320, description: 'Users joining group buys' },
                    { event: 'subscription_box_order', count: 85, description: 'Subscription box orders' },
                  ]}
                  rowKey="event"
                  pagination={false}
                />
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
}
