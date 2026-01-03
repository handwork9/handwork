'use client';

import React, { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Typography,
  Row,
  Col,
  Statistic,
  Input,
  DatePicker,
  Select,
  Avatar,
  Tooltip,
  Badge,
} from 'antd';
import {
  FallOutlined,
  SearchOutlined,
  ReloadOutlined,
  UserOutlined,
  ShoppingOutlined,
  BellOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useAuthStore } from '@/store/auth';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface PriceAlert {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  productId: string;
  productName: string;
  productImage: string | null;
  originalPrice: number;
  currentPrice: number;
  dropPercentage: number;
  notified: boolean;
  notifiedAt: string | null;
  createdAt: string;
}

interface PriceHistory {
  id: string;
  productId: string;
  productName: string;
  oldPrice: number;
  newPrice: number;
  changePercentage: number;
  changedAt: string;
}

export default function PriceAlertsPage() {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  // Fetch price alerts
  const { data: alertsData, isLoading: alertsLoading } = useQuery({
    queryKey: ['price-alerts'],
    queryFn: async () => {
      const res = await fetch(`${apiUrl}/price-alerts/admin/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch price alerts');
      return res.json();
    },
  });

  // Fetch price history
  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['price-history'],
    queryFn: async () => {
      const res = await fetch(`${apiUrl}/price-alerts/admin/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch price history');
      return res.json();
    },
  });

  const alerts: PriceAlert[] = alertsData || [];
  const history: PriceHistory[] = historyData || [];

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch =
      alert.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.userName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === 'all' ||
      (filterStatus === 'notified' && alert.notified) ||
      (filterStatus === 'pending' && !alert.notified);
    return matchesSearch && matchesFilter;
  });

  const alertColumns = [
    {
      title: 'Product',
      key: 'product',
      render: (_: any, record: PriceAlert) => (
        <Space>
          <Avatar
            src={record.productImage}
            icon={<ShoppingOutlined />}
            shape="square"
            size={48}
          />
          <div>
            <Text strong>{record.productName}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              ID: {record.productId?.slice(0, 8)}...
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'User',
      key: 'user',
      render: (_: any, record: PriceAlert) => (
        <Space>
          <Avatar src={record.userAvatar} icon={<UserOutlined />} />
          <Text>{record.userName}</Text>
        </Space>
      ),
    },
    {
      title: 'Price Change',
      key: 'priceChange',
      render: (_: any, record: PriceAlert) => (
        <div>
          <Text delete type="secondary">₦{record.originalPrice?.toLocaleString()}</Text>
          <br />
          <Text strong style={{ color: '#52c41a' }}>₦{record.currentPrice?.toLocaleString()}</Text>
        </div>
      ),
    },
    {
      title: 'Drop',
      dataIndex: 'dropPercentage',
      key: 'dropPercentage',
      sorter: (a: PriceAlert, b: PriceAlert) => b.dropPercentage - a.dropPercentage,
      render: (drop: number) => (
        <Tag color="green" icon={<FallOutlined />}>
          -{drop?.toFixed(1)}%
        </Tag>
      ),
    },
    {
      title: 'Notification',
      key: 'notification',
      render: (_: any, record: PriceAlert) => (
        <Space direction="vertical" size={0}>
          {record.notified ? (
            <>
              <Badge status="success" text="Sent" />
              <Text type="secondary" style={{ fontSize: 11 }}>
                {dayjs(record.notifiedAt).format('MMM D, HH:mm')}
              </Text>
            </>
          ) : (
            <Badge status="processing" text="Pending" />
          )}
        </Space>
      ),
    },
    {
      title: 'Tracked Since',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('MMM D, YYYY'),
    },
  ];

  const historyColumns = [
    {
      title: 'Product',
      dataIndex: 'productName',
      key: 'productName',
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: 'Old Price',
      dataIndex: 'oldPrice',
      key: 'oldPrice',
      render: (price: number) => <Text type="secondary">₦{price?.toLocaleString()}</Text>,
    },
    {
      title: 'New Price',
      dataIndex: 'newPrice',
      key: 'newPrice',
      render: (price: number) => <Text strong>₦{price?.toLocaleString()}</Text>,
    },
    {
      title: 'Change',
      dataIndex: 'changePercentage',
      key: 'changePercentage',
      render: (change: number) => {
        const isDecrease = change < 0;
        return (
          <Tag color={isDecrease ? 'green' : 'red'}>
            {isDecrease ? <FallOutlined /> : '↑'} {Math.abs(change)?.toFixed(1)}%
          </Tag>
        );
      },
    },
    {
      title: 'Changed At',
      dataIndex: 'changedAt',
      key: 'changedAt',
      render: (date: string) => dayjs(date).format('MMM D, YYYY HH:mm'),
    },
  ];

  const totalAlerts = alerts.length;
  const notifiedCount = alerts.filter(a => a.notified).length;
  const pendingCount = alerts.filter(a => !a.notified).length;
  const avgDrop = alerts.length > 0
    ? (alerts.reduce((sum, a) => sum + (a.dropPercentage || 0), 0) / alerts.length).toFixed(1)
    : 0;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          <FallOutlined style={{ marginRight: 12, color: '#52c41a' }} />
          Price Drop Alerts
        </Title>
        <Text type="secondary">Monitor product price changes and user notifications</Text>
      </div>

      {/* Stats */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Alerts"
              value={totalAlerts}
              prefix={<BellOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Notifications Sent"
              value={notifiedCount}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Pending"
              value={pendingCount}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Avg Drop"
              value={avgDrop}
              suffix="%"
              prefix={<FallOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Price Alerts Table */}
      <Card
        title="User Price Alerts"
        style={{ marginBottom: 24 }}
        extra={
          <Space>
            <Input
              placeholder="Search products or users..."
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: 250 }}
            />
            <Select
              value={filterStatus}
              onChange={setFilterStatus}
              style={{ width: 120 }}
              options={[
                { value: 'all', label: 'All' },
                { value: 'notified', label: 'Notified' },
                { value: 'pending', label: 'Pending' },
              ]}
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={() => queryClient.invalidateQueries({ queryKey: ['price-alerts'] })}
            >
              Refresh
            </Button>
          </Space>
        }
      >
        <Table
          columns={alertColumns}
          dataSource={filteredAlerts}
          rowKey="id"
          loading={alertsLoading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Price History Table */}
      <Card
        title="Recent Price Changes"
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={() => queryClient.invalidateQueries({ queryKey: ['price-history'] })}
          >
            Refresh
          </Button>
        }
      >
        <Table
          columns={historyColumns}
          dataSource={history}
          rowKey="id"
          loading={historyLoading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
}
