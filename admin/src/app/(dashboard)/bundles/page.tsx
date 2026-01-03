'use client';

import { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Input, Select, Space, Statistic, Row, Col, message, Modal, Image, InputNumber, Form } from 'antd';
import { SearchOutlined, ReloadOutlined, GiftOutlined, EditOutlined, DeleteOutlined, PlusOutlined, EyeOutlined, DollarOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import api from '@/lib/api';

interface BundleProduct {
  id: string;
  productId: string;
  quantity: number;
  product: {
    id: string;
    title: string;
    price: string;
    images: string[];
  };
}

interface Bundle {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  originalPrice: string;
  bundlePrice: string;
  discountPercent: number;
  isActive: boolean;
  stock: number;
  soldCount: number;
  validFrom: string;
  validUntil: string;
  products: BundleProduct[];
  createdAt: string;
  farmer: {
    id: string;
    name: string;
  };
}

export default function BundlesPage() {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedBundle, setSelectedBundle] = useState<Bundle | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    totalSold: 0,
    totalRevenue: 0,
  });

  const fetchBundles = async () => {
    try {
      setLoading(true);
      const response = await api.get('/bundles', {
        params: { 
          limit: 100,
          ...(statusFilter !== 'all' && { isActive: statusFilter === 'active' }),
        },
      });
      const data = response.data?.data?.data || response.data?.data || response.data || [];
      const bundlesList = Array.isArray(data) ? data : [];
      setBundles(bundlesList);
      
      const active = bundlesList.filter((b: Bundle) => b.isActive).length;
      const totalSold = bundlesList.reduce((sum: number, b: Bundle) => sum + (b.soldCount || 0), 0);
      const revenue = bundlesList.reduce((sum: number, b: Bundle) => 
        sum + ((b.soldCount || 0) * parseFloat(b.bundlePrice || '0')), 0);
      
      setStats({ total: bundlesList.length, active, totalSold, totalRevenue: revenue });
    } catch (error) {
      console.error('Error fetching bundles:', error);
      message.error('Failed to load bundles');
      setBundles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBundles();
  }, [statusFilter]);

  const handleToggleStatus = async (bundle: Bundle) => {
    try {
      await api.patch(`/bundles/${bundle.id}`, { isActive: !bundle.isActive });
      message.success(`Bundle ${bundle.isActive ? 'deactivated' : 'activated'}`);
      fetchBundles();
    } catch (error) {
      message.error('Failed to update bundle status');
    }
  };

  const handleDeleteBundle = (bundle: Bundle) => {
    Modal.confirm({
      title: 'Delete Bundle',
      content: `Are you sure you want to delete "${bundle.name}"?`,
      okType: 'danger',
      onOk: async () => {
        try {
          await api.delete(`/bundles/${bundle.id}`);
          message.success('Bundle deleted');
          fetchBundles();
        } catch (error) {
          message.error('Failed to delete bundle');
        }
      },
    });
  };

  const columns: ColumnsType<Bundle> = [
    {
      title: 'Bundle',
      key: 'bundle',
      render: (_, record) => (
        <Space>
          {record.imageUrl && (
            <Image 
              src={record.imageUrl} 
              alt={record.name}
              width={50}
              height={50}
              style={{ borderRadius: 8, objectFit: 'cover' }}
            />
          )}
          <div>
            <div style={{ fontWeight: 500 }}>{record.name}</div>
            <div style={{ fontSize: 12, color: '#888' }}>
              {record.products?.length || 0} products
            </div>
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
      title: 'Price',
      key: 'price',
      render: (_, record) => (
        <div>
          <Tag color="green">{record.discountPercent?.toFixed(0) || 0}% OFF</Tag>
          <div style={{ fontSize: 12, marginTop: 4 }}>
            <span style={{ textDecoration: 'line-through', color: '#888' }}>
              ₦{parseFloat(record.originalPrice || '0').toLocaleString()}
            </span>
            <span style={{ color: '#52c41a', marginLeft: 8, fontWeight: 500 }}>
              ₦{parseFloat(record.bundlePrice || '0').toLocaleString()}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: 'Stock',
      key: 'stock',
      render: (_, record) => (
        <div>
          <div>{record.stock || 0} available</div>
          <div style={{ fontSize: 12, color: '#888' }}>
            {record.soldCount || 0} sold
          </div>
        </div>
      ),
    },
    {
      title: 'Validity',
      key: 'validity',
      render: (_, record) => (
        <div style={{ fontSize: 12 }}>
          {record.validFrom && (
            <div>From: {new Date(record.validFrom).toLocaleDateString()}</div>
          )}
          {record.validUntil && (
            <div>Until: {new Date(record.validUntil).toLocaleDateString()}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <Tag color={record.isActive ? 'green' : 'default'}>
          {record.isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedBundle(record);
              setDetailModalVisible(true);
            }}
          />
          <Button 
            size="small"
            type={record.isActive ? 'default' : 'primary'}
            onClick={() => handleToggleStatus(record)}
          >
            {record.isActive ? 'Deactivate' : 'Activate'}
          </Button>
          <Button 
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteBundle(record)}
          />
        </Space>
      ),
    },
  ];

  const filteredBundles = bundles.filter(bundle =>
    bundle.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bundle.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>Product Bundles</h1>
        <p style={{ color: '#888' }}>Manage product bundles and package deals</p>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Total Bundles" 
              value={stats.total} 
              prefix={<GiftOutlined style={{ color: '#722ed1' }} />} 
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Active Bundles" 
              value={stats.active} 
              valueStyle={{ color: '#52c41a' }} 
              prefix={<GiftOutlined />} 
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Total Sold" 
              value={stats.totalSold} 
              prefix={<GiftOutlined />} 
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Total Revenue" 
              value={stats.totalRevenue} 
              prefix={<DollarOutlined />} 
              formatter={(v) => `₦${Number(v).toLocaleString()}`} 
            />
          </Card>
        </Col>
      </Row>

      <Card title="Bundles List">
        <Space style={{ marginBottom: 16 }}>
          <Input
            placeholder="Search bundles..."
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
              { value: 'inactive', label: 'Inactive' },
            ]}
          />
          <Button icon={<ReloadOutlined />} onClick={fetchBundles}>
            Refresh
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={filteredBundles}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Bundle Detail Modal */}
      <Modal
        title={selectedBundle?.name}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>,
        ]}
        width={600}
      >
        {selectedBundle && (
          <div>
            <p style={{ color: '#666', marginBottom: 16 }}>{selectedBundle.description}</p>
            
            <div style={{ marginBottom: 16 }}>
              <strong>Products in Bundle:</strong>
              <Table
                size="small"
                dataSource={selectedBundle.products}
                rowKey="id"
                pagination={false}
                columns={[
                  {
                    title: 'Product',
                    key: 'product',
                    render: (_, item) => (
                      <Space>
                        {item.product?.images?.[0] && (
                          <Image 
                            src={item.product.images[0]} 
                            width={30} 
                            height={30}
                            style={{ borderRadius: 4 }}
                          />
                        )}
                        <span>{item.product?.title}</span>
                      </Space>
                    ),
                  },
                  {
                    title: 'Quantity',
                    dataIndex: 'quantity',
                  },
                  {
                    title: 'Price',
                    render: (_, item) => `₦${parseFloat(item.product?.price || '0').toLocaleString()}`,
                  },
                ]}
              />
            </div>

            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="Original Price"
                  value={parseFloat(selectedBundle.originalPrice || '0')}
                  prefix="₦"
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Bundle Price"
                  value={parseFloat(selectedBundle.bundlePrice || '0')}
                  prefix="₦"
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
}
