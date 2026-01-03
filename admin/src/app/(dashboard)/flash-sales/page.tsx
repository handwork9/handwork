'use client';

import { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Input, Select, Space, Statistic, Row, Col, Progress, message, Modal, Image } from 'antd';
import { SearchOutlined, ReloadOutlined, ThunderboltOutlined, ClockCircleOutlined, EyeOutlined, DeleteOutlined, DollarOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import api from '@/lib/api';

interface FlashSale {
  id: string;
  title: string;
  description: string;
  product: {
    id: string;
    title: string;
    images: string[];
    category: string;
  };
  farmer: {
    id: string;
    name: string;
  };
  originalPrice: string;
  salePrice: string;
  discountPercent: number;
  totalQuantity: number;
  soldQuantity: number;
  remainingQuantity: number;
  startTime: string;
  endTime: string;
  timeRemainingMs: number;
  status: 'scheduled' | 'active' | 'ended' | 'cancelled';
  isFeatured: boolean;
  views: number;
}

export default function FlashSalesPage() {
  const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    scheduled: 0,
    totalRevenue: 0,
  });

  const fetchFlashSales = async () => {
    try {
      setLoading(true);
      const response = await api.get('/flash-sales', {
        params: { 
          limit: 100,
          status: statusFilter !== 'all' ? statusFilter : undefined,
        },
      });
      const data = response.data?.data?.data || response.data?.data || [];
      setFlashSales(data);
      
      const active = data.filter((s: FlashSale) => s.status === 'active').length;
      const scheduled = data.filter((s: FlashSale) => s.status === 'scheduled').length;
      const revenue = data.reduce((sum: number, s: FlashSale) => 
        sum + (s.soldQuantity * parseFloat(s.salePrice)), 0);
      
      setStats({ total: data.length, active, scheduled, totalRevenue: revenue });
    } catch (error) {
      console.error('Error fetching flash sales:', error);
      message.error('Failed to load flash sales');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlashSales();
  }, [statusFilter]);

  const formatTimeRemaining = (ms: number) => {
    if (ms <= 0) return 'Ended';
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const handleCancelSale = async (id: string) => {
    Modal.confirm({
      title: 'Cancel Flash Sale',
      content: 'Are you sure you want to cancel this flash sale?',
      onOk: async () => {
        try {
          await api.put(`/flash-sales/${id}`, { status: 'cancelled' });
          message.success('Flash sale cancelled');
          fetchFlashSales();
        } catch (error) {
          message.error('Failed to cancel flash sale');
        }
      },
    });
  };

  const columns: ColumnsType<FlashSale> = [
    {
      title: 'Product',
      key: 'product',
      render: (_, record) => (
        <Space>
          {record.product?.images?.[0] && (
            <Image 
              src={record.product.images[0]} 
              alt={record.product.title}
              width={40}
              height={40}
              style={{ borderRadius: 4, objectFit: 'cover' }}
            />
          )}
          <div>
            <div style={{ fontWeight: 500 }}>{record.title}</div>
            <div style={{ fontSize: 12, color: '#888' }}>{record.product?.title}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Farmer',
      dataIndex: ['farmer', 'name'],
      key: 'farmer',
    },
    {
      title: 'Discount',
      key: 'discount',
      render: (_, record) => (
        <div>
          <Tag color="green">{record.discountPercent}% OFF</Tag>
          <div style={{ fontSize: 11, color: '#888' }}>
            ₦{parseFloat(record.originalPrice).toLocaleString()} → ₦{parseFloat(record.salePrice).toLocaleString()}
          </div>
        </div>
      ),
    },
    {
      title: 'Stock',
      key: 'stock',
      render: (_, record) => (
        <div>
          <div>{record.soldQuantity}/{record.totalQuantity}</div>
          <Progress 
            percent={(record.soldQuantity / record.totalQuantity) * 100} 
            size="small" 
            showInfo={false}
            strokeColor="#52c41a"
          />
        </div>
      ),
    },
    {
      title: 'Time Left',
      key: 'timeLeft',
      render: (_, record) => (
        <Space>
          <ClockCircleOutlined />
          {formatTimeRemaining(record.timeRemainingMs)}
        </Space>
      ),
    },
    {
      title: 'Views',
      key: 'views',
      render: (_, record) => (
        <Space>
          <EyeOutlined />
          {record.views}
        </Space>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => {
        const colors: Record<string, string> = {
          active: 'green',
          scheduled: 'blue',
          ended: 'default',
          cancelled: 'red',
        };
        return <Tag color={colors[record.status]}>{record.status}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {record.status === 'active' && (
            <Button 
              size="small" 
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleCancelSale(record.id)}
            />
          )}
        </Space>
      ),
    },
  ];

  const filteredSales = flashSales.filter(sale =>
    sale.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sale.product?.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>Flash Sales</h1>
        <p style={{ color: '#888' }}>Manage flash sales and limited-time deals</p>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic title="Total Sales" value={stats.total} prefix={<ThunderboltOutlined style={{ color: '#faad14' }} />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Active Now" value={stats.active} valueStyle={{ color: '#52c41a' }} prefix={<ClockCircleOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Scheduled" value={stats.scheduled} valueStyle={{ color: '#1890ff' }} prefix={<ClockCircleOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Total Revenue" value={stats.totalRevenue} prefix={<DollarOutlined />} formatter={(v) => `₦${Number(v).toLocaleString()}`} />
          </Card>
        </Col>
      </Row>

      <Card title="Flash Sales List">
        <Space style={{ marginBottom: 16 }}>
          <Input
            placeholder="Search flash sales..."
            prefix={<SearchOutlined />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: 300 }}
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 150 }}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'scheduled', label: 'Scheduled' },
              { value: 'ended', label: 'Ended' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
          />
          <Button icon={<ReloadOutlined />} onClick={fetchFlashSales}>
            Refresh
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={filteredSales}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
}
