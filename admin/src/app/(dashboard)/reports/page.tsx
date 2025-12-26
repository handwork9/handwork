'use client';

import { useState } from 'react';
import {
  Card,
  Typography,
  DatePicker,
  Select,
  Button,
  Space,
  Table,
  Row,
  Col,
  Statistic,
  App,
  Spin,
  Divider,
  Tag,
  Badge,
  Avatar,
  Tooltip,
  Progress,
} from 'antd';
import {
  FileExcelOutlined,
  FilePdfOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  CarOutlined,
  BarChartOutlined,
  RiseOutlined,
  FallOutlined,
  ShopOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  TrophyOutlined,
  ThunderboltOutlined,
  PercentageOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const formatCurrency = (value: number) => `₦${value.toLocaleString()}`;

export default function ReportsPage() {
  const { message } = App.useApp();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'day'),
    dayjs(),
  ]);
  const [reportType, setReportType] = useState('overview');

  // Fetch report data
  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ['report', reportType, dateRange],
    queryFn: async () => {
      const params = {
        type: reportType,
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD'),
      };
      const response = await adminApi.getReport(params);
      return response.data.data;
    },
  });

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      message.loading(`Generating ${format.toUpperCase()} report...`);
      
      const response = await adminApi.exportReport({
        type: reportType,
        format,
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD'),
      });

      const blob = new Blob([response.data], {
        type: format === 'csv' ? 'text/csv' : 'application/pdf',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}-report-${dateRange[0].format('YYYY-MM-DD')}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);

      message.success(`${format.toUpperCase()} report downloaded`);
    } catch {
      message.error('Failed to export report');
    }
  };

  const data = reportData || {
    summary: {
      totalRevenue: 0,
      totalOrders: 0,
      avgOrderValue: 0,
      totalDeliveries: 0,
      avgDeliveryTime: 0,
      cancellationRate: 0,
    },
    revenueByDay: [],
    ordersByCategory: [],
    topFarmers: [],
    topRiders: [],
  };

  // Calculate growth percentages (mock - would come from API in real app)
  const revenueGrowth = 12.5;
  const ordersGrowth = 8.3;
  const deliveryGrowth = 15.2;

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>
            <BarChartOutlined style={{ marginRight: 12, color: '#4f46e5' }} />
            Reports & Analytics
          </Title>
          <Text type="secondary">Comprehensive analytics and exportable reports</Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isLoading}>
            Refresh
          </Button>
          <Button icon={<FileExcelOutlined />} onClick={() => handleExport('csv')}>
            Export CSV
          </Button>
          <Button type="primary" icon={<FilePdfOutlined />} onClick={() => handleExport('pdf')}>
            Export PDF
          </Button>
        </Space>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: 24 }}>
        <Space wrap size="middle">
          <div>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>Report Type</Text>
            <Select
              value={reportType}
              onChange={setReportType}
              style={{ width: 200 }}
              options={[
                { value: 'overview', label: <Space><BarChartOutlined />Overview Report</Space> },
                { value: 'revenue', label: <Space><DollarOutlined />Revenue Report</Space> },
                { value: 'orders', label: <Space><ShoppingCartOutlined />Orders Report</Space> },
                { value: 'riders', label: <Space><CarOutlined />Riders Report</Space> },
                { value: 'farmers', label: <Space><ShopOutlined />Farmers Report</Space> },
              ]}
            />
          </div>
          <div>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>Date Range</Text>
            <RangePicker
              value={dateRange}
              onChange={(dates) => {
                if (dates) {
                  setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs]);
                }
              }}
              presets={[
                { label: 'Last 7 Days', value: [dayjs().subtract(7, 'day'), dayjs()] },
                { label: 'Last 30 Days', value: [dayjs().subtract(30, 'day'), dayjs()] },
                { label: 'Last 90 Days', value: [dayjs().subtract(90, 'day'), dayjs()] },
                { label: 'This Year', value: [dayjs().startOf('year'), dayjs()] },
              ]}
            />
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <Tag color="blue" icon={<CalendarOutlined />}>
              {dateRange[0].format('MMM DD')} - {dateRange[1].format('MMM DD, YYYY')}
            </Tag>
          </div>
        </Space>
      </Card>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 100 }}>
          <Spin size="large" />
        </div>
      ) : (
        <>
          {/* Enhanced Summary Stats */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} lg={4}>
              <Card hoverable>
                <Statistic
                  title={
                    <Space>
                      <DollarOutlined style={{ color: '#4f46e5' }} />
                      <span>Total Revenue</span>
                    </Space>
                  }
                  value={data.summary.totalRevenue}
                  formatter={(v) => formatCurrency(Number(v))}
                  styles={{ content: { color: '#4f46e5' } }}
                />
                <Divider style={{ margin: '12px 0' }} />
                <Space>
                  {revenueGrowth >= 0 ? (
                    <Tag color="green" icon={<RiseOutlined />}>{revenueGrowth}%</Tag>
                  ) : (
                    <Tag color="red" icon={<FallOutlined />}>{Math.abs(revenueGrowth)}%</Tag>
                  )}
                  <Text type="secondary" style={{ fontSize: 12 }}>vs last period</Text>
                </Space>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={4}>
              <Card hoverable>
                <Statistic
                  title={
                    <Space>
                      <ShoppingCartOutlined style={{ color: '#10b981' }} />
                      <span>Total Orders</span>
                    </Space>
                  }
                  value={data.summary.totalOrders}
                  styles={{ content: { color: '#10b981' } }}
                />
                <Divider style={{ margin: '12px 0' }} />
                <Space>
                  {ordersGrowth >= 0 ? (
                    <Tag color="green" icon={<RiseOutlined />}>{ordersGrowth}%</Tag>
                  ) : (
                    <Tag color="red" icon={<FallOutlined />}>{Math.abs(ordersGrowth)}%</Tag>
                  )}
                  <Text type="secondary" style={{ fontSize: 12 }}>vs last period</Text>
                </Space>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={4}>
              <Card hoverable>
                <Statistic
                  title={
                    <Space>
                      <ThunderboltOutlined style={{ color: '#f59e0b' }} />
                      <span>Avg Order Value</span>
                    </Space>
                  }
                  value={data.summary.avgOrderValue}
                  formatter={(v) => formatCurrency(Number(v))}
                  styles={{ content: { color: '#f59e0b' } }}
                />
                <Divider style={{ margin: '12px 0' }} />
                <Text type="secondary" style={{ fontSize: 12 }}>Per transaction</Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={4}>
              <Card hoverable>
                <Statistic
                  title={
                    <Space>
                      <CarOutlined style={{ color: '#8b5cf6' }} />
                      <span>Deliveries</span>
                    </Space>
                  }
                  value={data.summary.totalDeliveries}
                  styles={{ content: { color: '#8b5cf6' } }}
                />
                <Divider style={{ margin: '12px 0' }} />
                <Space>
                  <Tag color="green" icon={<RiseOutlined />}>{deliveryGrowth}%</Tag>
                  <Text type="secondary" style={{ fontSize: 12 }}>growth</Text>
                </Space>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={4}>
              <Card hoverable>
                <Statistic
                  title={
                    <Space>
                      <ClockCircleOutlined style={{ color: '#06b6d4' }} />
                      <span>Avg Delivery Time</span>
                    </Space>
                  }
                  value={data.summary.avgDeliveryTime}
                  suffix="mins"
                  styles={{ content: { color: '#06b6d4' } }}
                />
                <Divider style={{ margin: '12px 0' }} />
                <Progress 
                  percent={100 - (data.summary.avgDeliveryTime / 60 * 100)} 
                  size="small" 
                  showInfo={false}
                  strokeColor="#06b6d4"
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={4}>
              <Card hoverable>
                <Statistic
                  title={
                    <Space>
                      <PercentageOutlined style={{ color: data.summary.cancellationRate > 5 ? '#ef4444' : '#10b981' }} />
                      <span>Cancel Rate</span>
                    </Space>
                  }
                  value={data.summary.cancellationRate}
                  suffix="%"
                  precision={1}
                  styles={{
                    content: {
                      color: data.summary.cancellationRate > 5 ? '#ef4444' : '#10b981',
                    },
                  }}
                />
                <Divider style={{ margin: '12px 0' }} />
                <Badge 
                  status={data.summary.cancellationRate > 5 ? 'error' : 'success'} 
                  text={<Text style={{ fontSize: 12 }}>{data.summary.cancellationRate > 5 ? 'Needs attention' : 'Healthy'}</Text>}
                />
              </Card>
            </Col>
          </Row>

          {/* Charts */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} lg={16}>
              <Card 
                title={
                  <Space>
                    <RiseOutlined style={{ color: '#4f46e5' }} />
                    Revenue & Orders Trend
                  </Space>
                }
                extra={<Tag color="blue">{dateRange[1].diff(dateRange[0], 'day')} days</Tag>}
              >
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={data.revenueByDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(date) => dayjs(date).format('MMM DD')}
                      stroke="#8c8c8c"
                    />
                    <YAxis
                      yAxisId="left"
                      tickFormatter={(value) => `₦${(value / 1000)}k`}
                      stroke="#8c8c8c"
                    />
                    <YAxis yAxisId="right" orientation="right" stroke="#8c8c8c" />
                    <RechartsTooltip
                      contentStyle={{ borderRadius: 8, border: '1px solid #f0f0f0' }}
                      formatter={(value: number, name: string) => [
                        name === 'revenue' ? formatCurrency(value) : value,
                        name === 'revenue' ? 'Revenue' : 'Orders',
                      ]}
                      labelFormatter={(date) => dayjs(date).format('MMM DD, YYYY')}
                    />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="revenue"
                      stroke="#4f46e5"
                      strokeWidth={3}
                      dot={{ fill: '#4f46e5', r: 4 }}
                      name="Revenue"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="orders"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ fill: '#10b981', r: 4 }}
                      name="Orders"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card 
                title={
                  <Space>
                    <ShoppingCartOutlined style={{ color: '#f59e0b' }} />
                    Orders by Category
                  </Space>
                }
              >
                <ResponsiveContainer width="100%" height={320}>
                  {data.ordersByCategory.length > 0 ? (
                    <PieChart>
                      <Pie
                        data={data.ordersByCategory}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="orders"
                        nameKey="category"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {data.ordersByCategory.map((entry: { category: string; orders: number }, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value: number) => [value, 'Orders']} />
                    </PieChart>
                  ) : (
                    <BarChart data={data.ordersByCategory} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="category" type="category" width={80} />
                      <RechartsTooltip formatter={(value: number) => [value, 'Orders']} />
                      <Bar dataKey="orders" fill="#4f46e5" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>

          {/* Top Performers Tables */}
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card 
                title={
                  <Space>
                    <TrophyOutlined style={{ color: '#f59e0b' }} />
                    Top Farmers
                  </Space>
                }
                extra={<Badge count={data.topFarmers?.length || 0} style={{ backgroundColor: '#52c41a' }} />}
              >
                <Table
                  dataSource={data.topFarmers}
                  rowKey="name"
                  pagination={false}
                  size="small"
                  columns={[
                    {
                      title: '#',
                      render: (_, __, index) => (
                        <Avatar 
                          size="small" 
                          style={{ 
                            backgroundColor: index === 0 ? '#faad14' : index === 1 ? '#bfbfbf' : index === 2 ? '#d48806' : '#f0f0f0',
                            color: index < 3 ? '#fff' : '#8c8c8c'
                          }}
                        >
                          {index + 1}
                        </Avatar>
                      ),
                      width: 50,
                    },
                    {
                      title: 'Farmer',
                      dataIndex: 'name',
                      render: (name: string) => (
                        <Space>
                          <ShopOutlined style={{ color: '#52c41a' }} />
                          <Text strong>{name}</Text>
                        </Space>
                      ),
                    },
                    {
                      title: 'Orders',
                      dataIndex: 'orders',
                      align: 'right',
                      render: (orders: number) => <Tag color="blue">{orders}</Tag>,
                    },
                    {
                      title: 'Revenue',
                      dataIndex: 'revenue',
                      render: (v: number) => <Text strong style={{ color: '#52c41a' }}>{formatCurrency(v)}</Text>,
                      align: 'right',
                    },
                  ]}
                />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card 
                title={
                  <Space>
                    <TrophyOutlined style={{ color: '#f59e0b' }} />
                    Top Riders
                  </Space>
                }
                extra={<Badge count={data.topRiders?.length || 0} style={{ backgroundColor: '#1890ff' }} />}
              >
                <Table
                  dataSource={data.topRiders}
                  rowKey="name"
                  pagination={false}
                  size="small"
                  columns={[
                    {
                      title: '#',
                      render: (_, __, index) => (
                        <Avatar 
                          size="small" 
                          style={{ 
                            backgroundColor: index === 0 ? '#faad14' : index === 1 ? '#bfbfbf' : index === 2 ? '#d48806' : '#f0f0f0',
                            color: index < 3 ? '#fff' : '#8c8c8c'
                          }}
                        >
                          {index + 1}
                        </Avatar>
                      ),
                      width: 50,
                    },
                    {
                      title: 'Rider',
                      dataIndex: 'name',
                      render: (name: string) => (
                        <Space>
                          <CarOutlined style={{ color: '#fa8c16' }} />
                          <Text strong>{name}</Text>
                        </Space>
                      ),
                    },
                    {
                      title: 'Deliveries',
                      dataIndex: 'deliveries',
                      align: 'right',
                      render: (deliveries: number) => <Tag color="orange">{deliveries}</Tag>,
                    },
                    {
                      title: 'Earnings',
                      dataIndex: 'earnings',
                      render: (v: number) => <Text strong style={{ color: '#1890ff' }}>{formatCurrency(v)}</Text>,
                      align: 'right',
                    },
                  ]}
                />
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
}
