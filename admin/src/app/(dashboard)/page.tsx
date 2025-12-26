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
  Divider,
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
  ThunderboltOutlined,
  TrophyOutlined,
  FireOutlined,
  StarFilled,
  ArrowRightOutlined,
  CalendarOutlined,
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
import Link from 'next/link';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const COLORS = ['#667eea', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
const GRADIENT_COLORS = {
  purple: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  green: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
  blue: 'linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)',
  orange: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  gold: 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)',
};

// Format currency
const formatCurrency = (value: number) => `₦${value.toLocaleString()}`;

// Helper to calculate time ago
const getTimeAgo = (date: string) => {
  const now = dayjs();
  const orderDate = dayjs(date);
  const diffMins = now.diff(orderDate, 'minute');
  if (diffMins < 60) return `${diffMins} mins ago`;
  const diffHours = now.diff(orderDate, 'hour');
  if (diffHours < 24) return `${diffHours} hours ago`;
  return orderDate.format('MMM D, HH:mm');
};

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [period, setPeriod] = useState('today');

  // Calculate date range based on period
  const getDateRange = () => {
    if (dateRange) {
      return {
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD'),
      };
    }
    const now = dayjs();
    switch (period) {
      case 'today':
        return { startDate: now.format('YYYY-MM-DD'), endDate: now.format('YYYY-MM-DD') };
      case 'week':
        return { startDate: now.subtract(7, 'day').format('YYYY-MM-DD'), endDate: now.format('YYYY-MM-DD') };
      case 'month':
        return { startDate: now.subtract(30, 'day').format('YYYY-MM-DD'), endDate: now.format('YYYY-MM-DD') };
      case 'year':
        return { startDate: now.subtract(365, 'day').format('YYYY-MM-DD'), endDate: now.format('YYYY-MM-DD') };
      default:
        return { startDate: now.subtract(7, 'day').format('YYYY-MM-DD'), endDate: now.format('YYYY-MM-DD') };
    }
  };

  // Fetch dashboard metrics
  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery({
    queryKey: ['dashboard', period, dateRange],
    queryFn: async () => {
      const params: { period: string; startDate?: string; endDate?: string } = { period };
      if (dateRange) {
        params.startDate = dateRange[0].format('YYYY-MM-DD');
        params.endDate = dateRange[1].format('YYYY-MM-DD');
      }
      const response = await adminApi.getDashboard(params);
      // Backend returns { success: true, data: {...} }
      return response.data?.data || response.data;
    },
  });

  // Fetch top farmers
  const { data: topFarmersData } = useQuery({
    queryKey: ['topFarmers'],
    queryFn: async () => {
      const response = await adminApi.getTopFarmers(5);
      return response.data?.data || response.data;
    },
  });

  // Fetch top riders
  const { data: topRidersData } = useQuery({
    queryKey: ['topRiders'],
    queryFn: async () => {
      const response = await adminApi.getTopRiders(5);
      return response.data?.data || response.data;
    },
  });

  // Fetch revenue metrics for chart
  const { startDate, endDate } = getDateRange();
  const { data: revenueMetricsResponse } = useQuery({
    queryKey: ['revenueMetrics', startDate, endDate],
    queryFn: async () => {
      const response = await adminApi.getRevenueMetrics(startDate, endDate);
      return response.data?.data || response.data;
    },
  });

  // Fetch recent orders
  const { data: ordersData } = useQuery({
    queryKey: ['recentOrders'],
    queryFn: async () => {
      const response = await adminApi.getOrders({ limit: 5 });
      return response.data?.data || response.data;
    },
  });

  // Map backend data to stats format
  const stats = {
    totalOrders: dashboardData?.totalOrders || 0,
    ordersChange: 0, // Would need historical comparison from backend
    totalRevenue: dashboardData?.totalRevenue || 0,
    revenueChange: 0,
    activeRiders: dashboardData?.onlineRiders || 0,
    ridersChange: 0,
    activeFarmers: dashboardData?.totalFarmers || 0,
    farmersChange: 0,
    pendingOrders: dashboardData?.pendingOrders || 0,
    avgDeliveryTime: 35, // Would need from dispatch analytics
    cancelRate: dashboardData?.totalOrders > 0 
      ? ((dashboardData?.cancelledOrders || 0) / dashboardData.totalOrders * 100).toFixed(1)
      : 0,
  };

  // Helper to extract array from various API response formats
  const getArrayFromResponse = (data: unknown): unknown[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (typeof data === 'object' && data !== null) {
      const obj = data as Record<string, unknown>;
      if (Array.isArray(obj.data)) return obj.data;
      if (Array.isArray(obj.items)) return obj.items;
      if (Array.isArray(obj.orders)) return obj.orders;
    }
    return [];
  };

  // Extract revenue metrics array from response
  const revenueMetricsArray = getArrayFromResponse(revenueMetricsResponse);

  // Map revenue metrics to chart format
  const revenueData = revenueMetricsArray.map((item) => {
    const i = item as { date: string; revenue: number; paymentCount: number };
    return {
      date: dayjs(i.date).format('ddd'),
      revenue: i.revenue,
      orders: i.paymentCount,
    };
  });

  // Default chart data if no metrics
  const chartData = revenueData.length > 0 ? revenueData : [];

  // Category distribution - would need backend endpoint
  const ordersByCategory = [
    { name: 'Vegetables', value: 35 },
    { name: 'Fruits', value: 25 },
    { name: 'Grains', value: 20 },
    { name: 'Dairy', value: 12 },
    { name: 'Others', value: 8 },
  ];

  const ordersArray = getArrayFromResponse(ordersData);

  // Map recent orders from API
  const recentOrders = ordersArray.slice(0, 5).map((order) => {
    const o = order as { 
      id: string; 
      orderNumber: string; 
      user?: { name: string }; 
      totalAmount: number; 
      status: string; 
      createdAt: string 
    };
    return {
      id: o.orderNumber || o.id,
      customer: o.user?.name || 'Customer',
      total: o.totalAmount || 0,
      status: o.status,
      time: getTimeAgo(o.createdAt),
    };
  });

  // Extract top riders array from response
  const topRidersArray = getArrayFromResponse(topRidersData);

  // Map top riders from API
  const topRiders = topRidersArray.map((rider) => {
    const r = rider as { 
      name?: string; 
      user?: { name: string };
      totalDeliveries?: number;
      rating?: number 
    };
    return {
      name: r.name || r.user?.name || 'Rider',
      deliveries: r.totalDeliveries || 0,
      rating: r.rating || 0,
    };
  });

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

  const getStatusIcon = (status: string) => {
    const icons: Record<string, React.ReactNode> = {
      pending: <ClockCircleOutlined />,
      processing: <ThunderboltOutlined />,
      in_transit: <CarOutlined />,
      delivered: <CheckCircleOutlined />,
      cancelled: <WarningOutlined />,
    };
    return icons[status] || null;
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa' }}>
      {/* Gradient Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '0 0 24px 24px',
          padding: '32px 24px',
          marginBottom: 24,
          boxShadow: '0 10px 40px rgba(102, 126, 234, 0.3)',
        }}
      >
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: 'rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <ThunderboltOutlined style={{ fontSize: 28, color: '#fff' }} />
              </div>
              <div>
                <Title level={2} style={{ margin: 0, color: '#fff', fontWeight: 700 }}>
                  Dashboard
                </Title>
                <Text style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: 15 }}>
                  Welcome back! Here&apos;s what&apos;s happening today.
                </Text>
              </div>
            </div>
          </Col>
          <Col>
            <Space size="middle" wrap>
              <Select
                value={period}
                onChange={setPeriod}
                style={{ width: 140 }}
                options={[
                  { value: 'today', label: '📅 Today' },
                  { value: 'week', label: '📊 This Week' },
                  { value: 'month', label: '📈 This Month' },
                  { value: 'year', label: '🗓️ This Year' },
                ]}
              />
              <RangePicker
                onChange={(dates) =>
                  setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)
                }
                style={{ background: '#fff', borderRadius: 8 }}
              />
            </Space>
          </Col>
        </Row>

        {/* Quick Stats in Header */}
        <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
          <Col xs={12} sm={6}>
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                borderRadius: 12,
                padding: '16px 20px',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <ClockCircleOutlined style={{ color: '#fbbf24', fontSize: 18 }} />
                <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 13 }}>Pending</Text>
              </div>
              <Text style={{ color: '#fff', fontSize: 28, fontWeight: 700 }}>{stats.pendingOrders}</Text>
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                borderRadius: 12,
                padding: '16px 20px',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <CheckCircleOutlined style={{ color: '#34d399', fontSize: 18 }} />
                <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 13 }}>Avg Delivery</Text>
              </div>
              <Text style={{ color: '#fff', fontSize: 28, fontWeight: 700 }}>{stats.avgDeliveryTime}m</Text>
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                borderRadius: 12,
                padding: '16px 20px',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <WarningOutlined style={{ color: '#f87171', fontSize: 18 }} />
                <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 13 }}>Cancel Rate</Text>
              </div>
              <Text style={{ color: '#fff', fontSize: 28, fontWeight: 700 }}>{stats.cancelRate}%</Text>
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                borderRadius: 12,
                padding: '16px 20px',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <FireOutlined style={{ color: '#fb923c', fontSize: 18 }} />
                <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 13 }}>Active Now</Text>
              </div>
              <Text style={{ color: '#fff', fontSize: 28, fontWeight: 700 }}>{stats.activeRiders + stats.activeFarmers}</Text>
            </div>
          </Col>
        </Row>
      </div>

      <div style={{ padding: '0 24px 24px' }}>
        {/* Main Stats Cards */}
        <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card
              style={{
                borderRadius: 16,
                border: 'none',
                boxShadow: '0 4px 20px rgba(102, 126, 234, 0.15)',
                overflow: 'hidden',
              }}
              styles={{ body: { padding: 0 } }}
            >
              <div style={{ background: GRADIENT_COLORS.purple, padding: '20px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <Text style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: 13, display: 'block', marginBottom: 8 }}>
                      Total Orders
                    </Text>
                    <Text style={{ color: '#fff', fontSize: 32, fontWeight: 700 }}>
                      {stats.totalOrders.toLocaleString()}
                    </Text>
                  </div>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: 'rgba(255, 255, 255, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ShoppingCartOutlined style={{ fontSize: 24, color: '#fff' }} />
                  </div>
                </div>
              </div>
              <div style={{ padding: '12px 24px', background: '#fff' }}>
                <Space>
                  {stats.ordersChange >= 0 ? (
                    <Tag color="success" style={{ borderRadius: 20 }}>
                      <RiseOutlined /> +{stats.ordersChange}%
                    </Tag>
                  ) : (
                    <Tag color="error" style={{ borderRadius: 20 }}>
                      <FallOutlined /> {stats.ordersChange}%
                    </Tag>
                  )}
                  <Text type="secondary" style={{ fontSize: 12 }}>vs last period</Text>
                </Space>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card
              style={{
                borderRadius: 16,
                border: 'none',
                boxShadow: '0 4px 20px rgba(16, 185, 129, 0.15)',
                overflow: 'hidden',
              }}
              styles={{ body: { padding: 0 } }}
            >
              <div style={{ background: GRADIENT_COLORS.green, padding: '20px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <Text style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: 13, display: 'block', marginBottom: 8 }}>
                      Total Revenue
                    </Text>
                    <Text style={{ color: '#fff', fontSize: 32, fontWeight: 700 }}>
                      ₦{(stats.totalRevenue / 1000000).toFixed(1)}M
                    </Text>
                  </div>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: 'rgba(255, 255, 255, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <DollarOutlined style={{ fontSize: 24, color: '#fff' }} />
                  </div>
                </div>
              </div>
              <div style={{ padding: '12px 24px', background: '#fff' }}>
                <Space>
                  {stats.revenueChange >= 0 ? (
                    <Tag color="success" style={{ borderRadius: 20 }}>
                      <RiseOutlined /> +{stats.revenueChange}%
                    </Tag>
                  ) : (
                    <Tag color="error" style={{ borderRadius: 20 }}>
                      <FallOutlined /> {stats.revenueChange}%
                    </Tag>
                  )}
                  <Text type="secondary" style={{ fontSize: 12 }}>vs last period</Text>
                </Space>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card
              style={{
                borderRadius: 16,
                border: 'none',
                boxShadow: '0 4px 20px rgba(6, 182, 212, 0.15)',
                overflow: 'hidden',
              }}
              styles={{ body: { padding: 0 } }}
            >
              <div style={{ background: GRADIENT_COLORS.blue, padding: '20px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <Text style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: 13, display: 'block', marginBottom: 8 }}>
                      Active Riders
                    </Text>
                    <Text style={{ color: '#fff', fontSize: 32, fontWeight: 700 }}>
                      {stats.activeRiders}
                    </Text>
                  </div>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: 'rgba(255, 255, 255, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CarOutlined style={{ fontSize: 24, color: '#fff' }} />
                  </div>
                </div>
              </div>
              <div style={{ padding: '12px 24px', background: '#fff' }}>
                <Space>
                  {stats.ridersChange >= 0 ? (
                    <Tag color="success" style={{ borderRadius: 20 }}>
                      <RiseOutlined /> +{stats.ridersChange}%
                    </Tag>
                  ) : (
                    <Tag color="error" style={{ borderRadius: 20 }}>
                      <FallOutlined /> {stats.ridersChange}%
                    </Tag>
                  )}
                  <Text type="secondary" style={{ fontSize: 12 }}>vs last period</Text>
                </Space>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card
              style={{
                borderRadius: 16,
                border: 'none',
                boxShadow: '0 4px 20px rgba(245, 158, 11, 0.15)',
                overflow: 'hidden',
              }}
              styles={{ body: { padding: 0 } }}
            >
              <div style={{ background: GRADIENT_COLORS.gold, padding: '20px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <Text style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: 13, display: 'block', marginBottom: 8 }}>
                      Active Farmers
                    </Text>
                    <Text style={{ color: '#fff', fontSize: 32, fontWeight: 700 }}>
                      {stats.activeFarmers}
                    </Text>
                  </div>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: 'rgba(255, 255, 255, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ShopOutlined style={{ fontSize: 24, color: '#fff' }} />
                  </div>
                </div>
              </div>
              <div style={{ padding: '12px 24px', background: '#fff' }}>
                <Space>
                  {stats.farmersChange >= 0 ? (
                    <Tag color="success" style={{ borderRadius: 20 }}>
                      <RiseOutlined /> +{stats.farmersChange}%
                    </Tag>
                  ) : (
                    <Tag color="error" style={{ borderRadius: 20 }}>
                      <FallOutlined /> {stats.farmersChange}%
                    </Tag>
                  )}
                  <Text type="secondary" style={{ fontSize: 12 }}>vs last period</Text>
                </Space>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Charts Row */}
        <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={16}>
            <Card
              title={
                <Space>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <DollarOutlined style={{ color: '#fff', fontSize: 18 }} />
                  </div>
                  <div>
                    <Text strong style={{ fontSize: 16 }}>Revenue & Orders Trend</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>Performance over time</Text>
                  </div>
                </Space>
              }
              style={{
                borderRadius: 16,
                border: 'none',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              }}
              styles={{ body: { padding: 24 } }}
            >
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#667eea" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#667eea" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#999" fontSize={12} />
                  <YAxis
                    yAxisId="left"
                    tickFormatter={(value) => `₦${(value / 1000000).toFixed(1)}M`}
                    stroke="#999"
                    fontSize={12}
                  />
                  <YAxis yAxisId="right" orientation="right" stroke="#999" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: 'none',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                    }}
                    formatter={(value: number, name: string) => [
                      name === 'revenue' ? formatCurrency(value) : value,
                      name === 'revenue' ? 'Revenue' : 'Orders',
                    ]}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#667eea"
                    strokeWidth={3}
                    fill="url(#colorRevenue)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="orders"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ fill: '#10b981', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card
              title={
                <Space>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ShoppingCartOutlined style={{ color: '#fff', fontSize: 18 }} />
                  </div>
                  <div>
                    <Text strong style={{ fontSize: 16 }}>Orders by Category</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>Distribution breakdown</Text>
                  </div>
                </Space>
              }
              style={{
                borderRadius: 16,
                border: 'none',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              }}
              styles={{ body: { padding: 24 } }}
            >
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={ordersByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {ordersByCategory.map((entry: { name: string; value: number }, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: 'none',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                {ordersByCategory.map((entry: { name: string; value: number }, index: number) => (
                  <Tag
                    key={entry.name}
                    style={{
                      borderRadius: 20,
                      border: 'none',
                      background: `${COLORS[index % COLORS.length]}20`,
                      color: COLORS[index % COLORS.length],
                    }}
                  >
                    {entry.name} {entry.value}%
                  </Tag>
                ))}
              </div>
            </Card>
          </Col>
        </Row>

        {/* Tables Row */}
        <Row gutter={[20, 20]}>
          <Col xs={24} lg={14}>
            <Card
              title={
                <Space>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ClockCircleOutlined style={{ color: '#fff', fontSize: 18 }} />
                  </div>
                  <div>
                    <Text strong style={{ fontSize: 16 }}>Recent Orders</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>Latest transactions</Text>
                  </div>
                </Space>
              }
              extra={
                <Link href="/orders">
                  <Space style={{ color: '#667eea', cursor: 'pointer' }}>
                    View All <ArrowRightOutlined />
                  </Space>
                </Link>
              }
              style={{
                borderRadius: 16,
                border: 'none',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              }}
              styles={{ body: { padding: '0 24px 24px' } }}
            >
              <Table
                dataSource={recentOrders}
                rowKey="id"
                pagination={false}
                size="middle"
                style={{ marginTop: 8 }}
                columns={[
                  {
                    title: 'Order ID',
                    dataIndex: 'id',
                    render: (id: string) => (
                      <Text strong style={{ color: '#667eea' }}>
                        {id}
                      </Text>
                    ),
                  },
                  {
                    title: 'Customer',
                    dataIndex: 'customer',
                    render: (name: string) => (
                      <Space>
                        <Avatar
                          size="small"
                          style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                        >
                          {name.charAt(0)}
                        </Avatar>
                        <Text>{name}</Text>
                      </Space>
                    ),
                  },
                  {
                    title: 'Total',
                    dataIndex: 'total',
                    render: (value: number) => (
                      <Text strong style={{ color: '#10b981' }}>
                        {formatCurrency(value)}
                      </Text>
                    ),
                  },
                  {
                    title: 'Status',
                    dataIndex: 'status',
                    render: (status: string) => (
                      <Tag
                        color={getStatusColor(status)}
                        icon={getStatusIcon(status)}
                        style={{ borderRadius: 20 }}
                      >
                        {status.replace('_', ' ').toUpperCase()}
                      </Tag>
                    ),
                  },
                  {
                    title: 'Time',
                    dataIndex: 'time',
                    render: (time: string) => (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        <CalendarOutlined style={{ marginRight: 4 }} />
                        {time}
                      </Text>
                    ),
                  },
                ]}
              />
            </Card>
          </Col>
          <Col xs={24} lg={10}>
            <Card
              title={
                <Space>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <TrophyOutlined style={{ color: '#fff', fontSize: 18 }} />
                  </div>
                  <div>
                    <Text strong style={{ fontSize: 16 }}>Top Riders This Week</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>Best performers</Text>
                  </div>
                </Space>
              }
              extra={
                <Link href="/riders">
                  <Space style={{ color: '#667eea', cursor: 'pointer' }}>
                    View All <ArrowRightOutlined />
                  </Space>
                </Link>
              }
              style={{
                borderRadius: 16,
                border: 'none',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              }}
              styles={{ body: { padding: 24 } }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {topRiders.map((rider: { name: string; deliveries: number; rating: number }, index: number) => (
                  <div
                    key={rider.name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 16,
                      borderRadius: 12,
                      background: index === 0 
                        ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 193, 7, 0.1) 100%)'
                        : '#f9fafb',
                      border: index === 0 ? '1px solid rgba(255, 215, 0, 0.3)' : '1px solid #f0f0f0',
                    }}
                  >
                    <Space size="middle">
                      <div style={{ position: 'relative' }}>
                        <Avatar
                          size={48}
                          style={{
                            background: index === 0
                              ? 'linear-gradient(135deg, #ffd700 0%, #ffb700 100%)'
                              : index === 1
                              ? 'linear-gradient(135deg, #c0c0c0 0%, #a8a8a8 100%)'
                              : index === 2
                              ? 'linear-gradient(135deg, #cd7f32 0%, #b8860b 100%)'
                              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          }}
                        >
                          {rider.name.charAt(0)}
                        </Avatar>
                        <div
                          style={{
                            position: 'absolute',
                            bottom: -4,
                            right: -4,
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            background: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#667eea',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontSize: 12,
                            fontWeight: 700,
                            border: '2px solid #fff',
                          }}
                        >
                          {index + 1}
                        </div>
                      </div>
                      <div>
                        <Text strong style={{ fontSize: 14, display: 'block' }}>{rider.name}</Text>
                        <Space size={4}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {rider.deliveries} deliveries
                          </Text>
                          <Divider orientation="vertical" style={{ margin: '0 4px' }} />
                          <Space size={2}>
                            <StarFilled style={{ color: '#fbbf24', fontSize: 12 }} />
                            <Text style={{ color: '#f59e0b', fontSize: 12, fontWeight: 600 }}>
                              {rider.rating}
                            </Text>
                          </Space>
                        </Space>
                      </div>
                    </Space>
                    <Progress
                      type="circle"
                      percent={Math.round((rider.deliveries / 156) * 100)}
                      size={50}
                      strokeColor={{
                        '0%': '#667eea',
                        '100%': '#764ba2',
                      }}
                      format={(percent) => (
                        <span style={{ fontSize: 11, fontWeight: 600 }}>{percent}%</span>
                      )}
                    />
                  </div>
                ))}
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
}
