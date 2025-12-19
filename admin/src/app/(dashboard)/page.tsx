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
  Avatar,
  Space,
  Select,
  DatePicker,
  Progress,
  Badge,
} from 'antd';
import {
  ShoppingCartOutlined,
  UserOutlined,
  DollarOutlined,
  RiseOutlined,
  FallOutlined,
  CarOutlined,
  ShopOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import {
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

// Format currency
const formatCurrency = (value: number) => `₦${value.toLocaleString()}`;

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [period, setPeriod] = useState('today');

  // Fetch dashboard data
  const { data: dashboardData } = useQuery({
    queryKey: ['dashboard', period, dateRange],
    queryFn: async () => {
      const params: { period: string; startDate?: string; endDate?: string } = { period };
      if (dateRange) {
        params.startDate = dateRange[0].format('YYYY-MM-DD');
        params.endDate = dateRange[1].format('YYYY-MM-DD');
      }
      const response = await adminApi.getDashboard(params);
      return response.data.data;
    },
  });

  // Mock data for development
  const stats = dashboardData?.stats || {
    totalOrders: 1284,
    ordersChange: 12.5,
    totalRevenue: 8456000,
    revenueChange: 8.2,
    activeRiders: 45,
    ridersChange: 5.0,
    activeFarmers: 128,
    farmersChange: 3.4,
    pendingOrders: 23,
    avgDeliveryTime: 35,
    cancelRate: 2.3,
  };

  const revenueData = dashboardData?.revenueChart || [
    { date: 'Mon', revenue: 1200000, orders: 45 },
    { date: 'Tue', revenue: 1450000, orders: 52 },
    { date: 'Wed', revenue: 1100000, orders: 38 },
    { date: 'Thu', revenue: 1680000, orders: 61 },
    { date: 'Fri', revenue: 1950000, orders: 73 },
    { date: 'Sat', revenue: 2200000, orders: 85 },
    { date: 'Sun', revenue: 1400000, orders: 48 },
  ];

  const ordersByCategory = dashboardData?.categoryChart || [
    { name: 'Vegetables', value: 35 },
    { name: 'Fruits', value: 25 },
    { name: 'Grains', value: 20 },
    { name: 'Dairy', value: 12 },
    { name: 'Others', value: 8 },
  ];

  const recentOrders = dashboardData?.recentOrders || [
    {
      id: 'ORD-2024-001',
      customer: 'Amina Bello',
      total: 15500,
      status: 'delivered',
      time: '10 mins ago',
    },
    {
      id: 'ORD-2024-002',
      customer: 'Chidi Okonkwo',
      total: 28000,
      status: 'in_transit',
      time: '25 mins ago',
    },
    {
      id: 'ORD-2024-003',
      customer: 'Fatima Yusuf',
      total: 12300,
      status: 'processing',
      time: '1 hour ago',
    },
    {
      id: 'ORD-2024-004',
      customer: 'Emeka Eze',
      total: 45000,
      status: 'pending',
      time: '2 hours ago',
    },
  ];

  const topRiders = dashboardData?.topRiders || [
    { name: 'John Adamu', deliveries: 156, rating: 4.9 },
    { name: 'Ibrahim Musa', deliveries: 142, rating: 4.8 },
    { name: 'Chukwu Emmanuel', deliveries: 128, rating: 4.7 },
    { name: 'Yusuf Aliyu', deliveries: 115, rating: 4.8 },
  ];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'orange',
      processing: 'blue',
      in_transit: 'cyan',
      delivered: 'green',
      cancelled: 'red',
    };
    return colors[status] || 'default';
  };

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <div>
          <Title level={2} style={{ margin: 0 }}>
            Dashboard
          </Title>
          <Text type="secondary">Welcome back! Here&apos;s what&apos;s happening.</Text>
        </div>
        <Space>
          <Select
            value={period}
            onChange={setPeriod}
            style={{ width: 120 }}
            options={[
              { value: 'today', label: 'Today' },
              { value: 'week', label: 'This Week' },
              { value: 'month', label: 'This Month' },
              { value: 'year', label: 'This Year' },
            ]}
          />
          <RangePicker
            onChange={(dates) =>
              setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)
            }
          />
        </Space>
      </div>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Orders"
              value={stats.totalOrders}
              prefix={<ShoppingCartOutlined style={{ color: '#4f46e5' }} />}
              suffix={
                <span
                  style={{
                    fontSize: 14,
                    color: stats.ordersChange >= 0 ? '#10b981' : '#ef4444',
                  }}
                >
                  {stats.ordersChange >= 0 ? <RiseOutlined /> : <FallOutlined />}
                  {Math.abs(stats.ordersChange)}%
                </span>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Revenue"
              value={stats.totalRevenue}
              precision={0}
              prefix={<DollarOutlined style={{ color: '#10b981' }} />}
              formatter={(value) => `₦${Number(value).toLocaleString()}`}
              suffix={
                <span
                  style={{
                    fontSize: 14,
                    color: stats.revenueChange >= 0 ? '#10b981' : '#ef4444',
                  }}
                >
                  {stats.revenueChange >= 0 ? <RiseOutlined /> : <FallOutlined />}
                  {Math.abs(stats.revenueChange)}%
                </span>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Riders"
              value={stats.activeRiders}
              prefix={<CarOutlined style={{ color: '#06b6d4' }} />}
              suffix={
                <span
                  style={{
                    fontSize: 14,
                    color: stats.ridersChange >= 0 ? '#10b981' : '#ef4444',
                  }}
                >
                  {stats.ridersChange >= 0 ? <RiseOutlined /> : <FallOutlined />}
                  {Math.abs(stats.ridersChange)}%
                </span>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Farmers"
              value={stats.activeFarmers}
              prefix={<ShopOutlined style={{ color: '#f59e0b' }} />}
              suffix={
                <span
                  style={{
                    fontSize: 14,
                    color: stats.farmersChange >= 0 ? '#10b981' : '#ef4444',
                  }}
                >
                  {stats.farmersChange >= 0 ? <RiseOutlined /> : <FallOutlined />}
                  {Math.abs(stats.farmersChange)}%
                </span>
              }
            />
          </Card>
        </Col>
      </Row>

      {/* Quick Stats Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Space>
              <Badge count={stats.pendingOrders} color="#f59e0b">
                <ClockCircleOutlined
                  style={{ fontSize: 24, color: '#f59e0b' }}
                />
              </Badge>
              <div>
                <Text strong>{stats.pendingOrders}</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Pending Orders
                </Text>
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Space>
              <CheckCircleOutlined style={{ fontSize: 24, color: '#10b981' }} />
              <div>
                <Text strong>{stats.avgDeliveryTime} mins</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Avg Delivery Time
                </Text>
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Space>
              <WarningOutlined style={{ fontSize: 24, color: '#ef4444' }} />
              <div>
                <Text strong>{stats.cancelRate}%</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Cancel Rate
                </Text>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Charts Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <Card title="Revenue & Orders Trend">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis
                  yAxisId="left"
                  tickFormatter={(value) => `₦${(value / 1000000).toFixed(1)}M`}
                />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    name === 'revenue' ? formatCurrency(value) : value,
                    name === 'revenue' ? 'Revenue' : 'Orders',
                  ]}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#4f46e5"
                  fill="#4f46e5"
                  fillOpacity={0.2}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="orders"
                  stroke="#10b981"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Orders by Category">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={ordersByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${((percent || 0) * 100).toFixed(0)}%`
                  }
                >
                  {ordersByCategory.map((entry: { name: string; value: number }, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Tables Row */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card
            title="Recent Orders"
            extra={<a href="/orders">View All</a>}
          >
            <Table
              dataSource={recentOrders}
              rowKey="id"
              pagination={false}
              size="small"
              columns={[
                {
                  title: 'Order ID',
                  dataIndex: 'id',
                  render: (id: string) => (
                    <Text strong style={{ color: '#4f46e5' }}>
                      {id}
                    </Text>
                  ),
                },
                {
                  title: 'Customer',
                  dataIndex: 'customer',
                  render: (name: string) => (
                    <Space>
                      <Avatar size="small" icon={<UserOutlined />} />
                      {name}
                    </Space>
                  ),
                },
                {
                  title: 'Total',
                  dataIndex: 'total',
                  render: (value: number) => formatCurrency(value),
                },
                {
                  title: 'Status',
                  dataIndex: 'status',
                  render: (status: string) => (
                    <Tag color={getStatusColor(status)}>
                      {status.replace('_', ' ').toUpperCase()}
                    </Tag>
                  ),
                },
                {
                  title: 'Time',
                  dataIndex: 'time',
                  render: (time: string) => (
                    <Text type="secondary">{time}</Text>
                  ),
                },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="Top Riders This Week" extra={<a href="/riders">View All</a>}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {topRiders.map((rider: { name: string; deliveries: number; rating: number }, index: number) => (
                <div key={rider.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Space>
                    <Badge
                      count={index + 1}
                      color={index === 0 ? 'gold' : index === 1 ? 'silver' : '#cd7f32'}
                      offset={[-5, 5]}
                    >
                      <Avatar icon={<UserOutlined />} />
                    </Badge>
                    <div>
                      <Text strong>{rider.name}</Text>
                      <br />
                      <Space>
                        <Text type="secondary">{rider.deliveries} deliveries</Text>
                        <Text type="warning">★ {rider.rating}</Text>
                      </Space>
                    </div>
                  </Space>
                  <Progress
                    percent={Math.round((rider.deliveries / 156) * 100)}
                    size="small"
                    style={{ width: 80 }}
                    showInfo={false}
                  />
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
