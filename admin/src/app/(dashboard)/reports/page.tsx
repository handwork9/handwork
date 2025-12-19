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
  message,
  Spin,
} from 'antd';
import {
  FileExcelOutlined,
  FilePdfOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  CarOutlined,
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
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const formatCurrency = (value: number) => `₦${value.toLocaleString()}`;

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'day'),
    dayjs(),
  ]);
  const [reportType, setReportType] = useState('overview');

  // Fetch report data
  const { data: reportData, isLoading } = useQuery({
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
      
      // In production, this would call the API to generate the export
      const response = await adminApi.exportReport({
        type: reportType,
        format,
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD'),
      });

      // Create download link
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

  // Mock data for development
  const mockOverview = {
    summary: {
      totalRevenue: 8456000,
      totalOrders: 1284,
      avgOrderValue: 6585,
      totalDeliveries: 1180,
      avgDeliveryTime: 35,
      cancellationRate: 2.3,
    },
    revenueByDay: [
      { date: '2024-01-01', revenue: 280000, orders: 42 },
      { date: '2024-01-02', revenue: 320000, orders: 48 },
      { date: '2024-01-03', revenue: 290000, orders: 44 },
      { date: '2024-01-04', revenue: 350000, orders: 52 },
      { date: '2024-01-05', revenue: 410000, orders: 62 },
      { date: '2024-01-06', revenue: 450000, orders: 68 },
      { date: '2024-01-07', revenue: 380000, orders: 57 },
    ],
    ordersByCategory: [
      { category: 'Vegetables', orders: 450, revenue: 2250000 },
      { category: 'Fruits', orders: 320, revenue: 1920000 },
      { category: 'Grains', orders: 280, revenue: 2520000 },
      { category: 'Dairy', orders: 150, revenue: 1050000 },
      { category: 'Others', orders: 84, revenue: 716000 },
    ],
    topFarmers: [
      { name: 'Fresh Farm Produce', orders: 156, revenue: 1248000 },
      { name: 'Organic Gardens', orders: 128, revenue: 960000 },
      { name: 'Harvest Nigeria', orders: 95, revenue: 665000 },
      { name: 'Green Acres', orders: 82, revenue: 574000 },
      { name: 'Farm Direct', orders: 71, revenue: 497000 },
    ],
    topRiders: [
      { name: 'John Adamu', deliveries: 156, earnings: 234000 },
      { name: 'Ibrahim Musa', deliveries: 142, earnings: 213000 },
      { name: 'Chukwu Emmanuel', deliveries: 128, earnings: 192000 },
      { name: 'Yusuf Aliyu', deliveries: 115, earnings: 172500 },
    ],
  };

  const data = reportData || mockOverview;

  return (
    <div>
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
            Reports
          </Title>
          <Text type="secondary">Analytics and export reports</Text>
        </div>
        <Space>
          <Button
            icon={<FileExcelOutlined />}
            onClick={() => handleExport('csv')}
          >
            Export CSV
          </Button>
          <Button
            icon={<FilePdfOutlined />}
            onClick={() => handleExport('pdf')}
          >
            Export PDF
          </Button>
        </Space>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: 24 }}>
        <Space wrap>
          <Select
            value={reportType}
            onChange={setReportType}
            style={{ width: 200 }}
            options={[
              { value: 'overview', label: 'Overview Report' },
              { value: 'revenue', label: 'Revenue Report' },
              { value: 'orders', label: 'Orders Report' },
              { value: 'riders', label: 'Riders Report' },
              { value: 'farmers', label: 'Farmers Report' },
            ]}
          />
          <RangePicker
            value={dateRange}
            onChange={(dates) => {
              if (dates) {
                setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs]);
              }
            }}
          />
        </Space>
      </Card>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 100 }}>
          <Spin size="large" />
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={4}>
              <Card>
                <Statistic
                  title="Total Revenue"
                  value={data.summary.totalRevenue}
                  formatter={(v) => formatCurrency(Number(v))}
                  prefix={<DollarOutlined />}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic
                  title="Total Orders"
                  value={data.summary.totalOrders}
                  prefix={<ShoppingCartOutlined />}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic
                  title="Avg Order Value"
                  value={data.summary.avgOrderValue}
                  formatter={(v) => formatCurrency(Number(v))}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic
                  title="Deliveries"
                  value={data.summary.totalDeliveries}
                  prefix={<CarOutlined />}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic
                  title="Avg Delivery Time"
                  value={data.summary.avgDeliveryTime}
                  suffix="mins"
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic
                  title="Cancel Rate"
                  value={data.summary.cancellationRate}
                  suffix="%"
                  precision={1}
                  styles={{
                    content: {
                      color: data.summary.cancellationRate > 5 ? '#ef4444' : '#10b981',
                    },
                  }}
                />
              </Card>
            </Col>
          </Row>

          {/* Charts */}
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={16}>
              <Card title="Revenue & Orders Trend">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.revenueByDay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(date) => dayjs(date).format('MMM DD')}
                    />
                    <YAxis
                      yAxisId="left"
                      tickFormatter={(value) => `₦${(value / 1000)}k`}
                    />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip
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
                      strokeWidth={2}
                      name="Revenue"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="orders"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Orders"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col span={8}>
              <Card title="Orders by Category">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.ordersByCategory} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="category" type="category" width={80} />
                    <Tooltip
                      formatter={(value: number) => [value, 'Orders']}
                    />
                    <Bar dataKey="orders" fill="#4f46e5" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>

          {/* Tables */}
          <Row gutter={16}>
            <Col span={12}>
              <Card title="Top Farmers">
                <Table
                  dataSource={data.topFarmers}
                  rowKey="name"
                  pagination={false}
                  size="small"
                  columns={[
                    {
                      title: '#',
                      render: (_, __, index) => index + 1,
                      width: 40,
                    },
                    {
                      title: 'Farmer',
                      dataIndex: 'name',
                    },
                    {
                      title: 'Orders',
                      dataIndex: 'orders',
                      align: 'right',
                    },
                    {
                      title: 'Revenue',
                      dataIndex: 'revenue',
                      render: (v: number) => formatCurrency(v),
                      align: 'right',
                    },
                  ]}
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card title="Top Riders">
                <Table
                  dataSource={data.topRiders}
                  rowKey="name"
                  pagination={false}
                  size="small"
                  columns={[
                    {
                      title: '#',
                      render: (_, __, index) => index + 1,
                      width: 40,
                    },
                    {
                      title: 'Rider',
                      dataIndex: 'name',
                    },
                    {
                      title: 'Deliveries',
                      dataIndex: 'deliveries',
                      align: 'right',
                    },
                    {
                      title: 'Earnings',
                      dataIndex: 'earnings',
                      render: (v: number) => formatCurrency(v),
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
