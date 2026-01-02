'use client';

import React, { useState } from 'react';
import {
  Card,
  Table,
  Tag,
  Space,
  Button,
  Input,
  Select,
  Typography,
  Modal,
  Form,
  InputNumber,
  Switch,
  Row,
  Col,
  Statistic,
  App,
  Descriptions,
  Drawer,
  Badge,
  Tooltip,
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
  ReloadOutlined,
  ExportOutlined,
  EyeOutlined,
  ShopOutlined,
  InboxOutlined,
  BankOutlined,
  HomeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface PickupLocation {
  id: string;
  name: string;
  code: string;
  type: 'locker' | 'pickup_point' | 'partner_store' | 'hub';
  status: 'active' | 'inactive' | 'maintenance';
  address: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  operatingHours?: {
    monday?: { open: string; close: string };
    tuesday?: { open: string; close: string };
    wednesday?: { open: string; close: string };
    thursday?: { open: string; close: string };
    friday?: { open: string; close: string };
    saturday?: { open: string; close: string };
    sunday?: { open: string; close: string };
  };
  capacity?: number;
  currentOccupancy?: number;
  supportsRefrigeration?: boolean;
  deliveryDiscount?: number;
  rating?: number;
  totalOrders?: number;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  total?: number;
}

const PICKUP_TYPES = [
  { value: 'locker', label: 'Smart Locker', icon: <InboxOutlined /> },
  { value: 'pickup_point', label: 'Pickup Point', icon: <EnvironmentOutlined /> },
  { value: 'partner_store', label: 'Partner Store', icon: <ShopOutlined /> },
  { value: 'hub', label: 'Distribution Hub', icon: <BankOutlined /> },
];

const STATUSES = [
  { value: 'active', label: 'Active', color: 'success' },
  { value: 'inactive', label: 'Inactive', color: 'default' },
  { value: 'maintenance', label: 'Maintenance', color: 'warning' },
];

export default function PickupLocationsPage() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  
  // State
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<PickupLocation | null>(null);
  const [editMode, setEditMode] = useState(false);

  // Fetch pickup locations
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['pickup-locations', page, pageSize, searchText, typeFilter, statusFilter, cityFilter],
    queryFn: async () => {
      const params: Record<string, string | number> = {
        page,
        limit: pageSize,
      };
      if (searchText) params.search = searchText;
      if (typeFilter !== 'all') params.type = typeFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (cityFilter !== 'all') params.city = cityFilter;
      
      const response = await adminApi.getPickupLocations(params as any);
      // Handle both wrapped and unwrapped responses
      const responseData = response.data;
      // API returns { success, data: { success, data, pagination } } - unwrap it
      const actualData = responseData?.data || responseData;
      return {
        data: actualData?.data || actualData || [],
        pagination: actualData?.pagination || responseData?.pagination || { total: 0, page: 1, limit: pageSize, totalPages: 0 },
      };
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (values: any) => {
      const response = await adminApi.createPickupLocation(values);
      return response.data;
    },
    onSuccess: () => {
      message.success('Pickup location created successfully');
      queryClient.invalidateQueries({ queryKey: ['pickup-locations'] });
      setShowCreateModal(false);
      form.resetFields();
    },
    onError: (error: Error) => {
      message.error(error.message || 'Failed to create pickup location');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<PickupLocation> }) => {
      const response = await adminApi.updatePickupLocation(id, values);
      return response.data;
    },
    onSuccess: () => {
      message.success('Pickup location updated successfully');
      queryClient.invalidateQueries({ queryKey: ['pickup-locations'] });
      setEditMode(false);
      setShowDetailDrawer(false);
      setShowCreateModal(false);
    },
    onError: (error: Error) => {
      message.error(error.message || 'Failed to update pickup location');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await adminApi.deletePickupLocation(id);
    },
    onSuccess: () => {
      message.success('Pickup location deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['pickup-locations'] });
    },
    onError: (error: Error) => {
      message.error(error.message || 'Failed to delete pickup location');
    },
  });

  const handleDelete = (id: string, name: string) => {
    Modal.confirm({
      title: 'Delete Pickup Location',
      content: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      onOk: () => deleteMutation.mutate(id),
    });
  };

  const handleViewDetail = (record: PickupLocation) => {
    setSelectedLocation(record);
    setShowDetailDrawer(true);
    setEditMode(false);
  };

  const handleEdit = (record: PickupLocation) => {
    setSelectedLocation(record);
    setEditMode(true);
    form.setFieldsValue({
      ...record,
    });
    setShowCreateModal(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (editMode && selectedLocation) {
        updateMutation.mutate({ id: selectedLocation.id, values });
      } else {
        createMutation.mutate(values);
      }
    } catch (error) {
      console.error('Validation error:', error);
    }
  };

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'locker':
        return { icon: <InboxOutlined />, color: 'purple', label: 'Smart Locker' };
      case 'pickup_point':
        return { icon: <EnvironmentOutlined />, color: 'blue', label: 'Pickup Point' };
      case 'partner_store':
        return { icon: <ShopOutlined />, color: 'green', label: 'Partner Store' };
      case 'hub':
        return { icon: <BankOutlined />, color: 'orange', label: 'Hub' };
      default:
        return { icon: <EnvironmentOutlined />, color: 'default', label: type };
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return { icon: <CheckCircleOutlined />, color: 'success', label: 'Active' };
      case 'inactive':
        return { icon: <StopOutlined />, color: 'default', label: 'Inactive' };
      case 'maintenance':
        return { icon: <ClockCircleOutlined />, color: 'warning', label: 'Maintenance' };
      default:
        return { icon: <CheckCircleOutlined />, color: 'default', label: status };
    }
  };

  // Get unique cities for filter
  const cities = React.useMemo(() => {
    const citySet = new Set<string>();
    const locations = Array.isArray(data?.data) ? data.data : [];
    locations.forEach((location: PickupLocation) => {
      if (location.city) citySet.add(location.city);
    });
    return Array.from(citySet).sort();
  }, [data]);

  // Stats
  const stats = React.useMemo(() => {
    const locations = Array.isArray(data?.data) ? data.data : [];
    return {
      total: data?.pagination?.total || locations.length,
      active: locations.filter((l: PickupLocation) => l.status === 'active').length,
      lockers: locations.filter((l: PickupLocation) => l.type === 'locker').length,
      pickupPoints: locations.filter((l: PickupLocation) => l.type === 'pickup_point').length,
    };
  }, [data]);

  const columns: ColumnsType<PickupLocation> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record) => (
        <Space>
          {getTypeConfig(record.type).icon}
          <div>
            <Text strong>{name}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>{record.code}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const config = getTypeConfig(type);
        return <Tag color={config.color} icon={config.icon}>{config.label}</Tag>;
      },
    },
    {
      title: 'Location',
      key: 'location',
      render: (_: unknown, record: PickupLocation) => (
        <div>
          <Text>{record.address}</Text>
          <br />
          <Text type="secondary">{record.city}, {record.state}</Text>
        </div>
      ),
    },
    {
      title: 'Capacity',
      key: 'capacity',
      render: (_: unknown, record: PickupLocation) => {
        if (!record.capacity) return '-';
        const occupancy = record.currentOccupancy || 0;
        const percentage = Math.round((occupancy / record.capacity) * 100);
        return (
          <Tooltip title={`${occupancy}/${record.capacity} occupied`}>
            <Badge 
              status={percentage >= 90 ? 'error' : percentage >= 70 ? 'warning' : 'success'} 
              text={`${percentage}%`} 
            />
          </Tooltip>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config = getStatusConfig(status);
        return <Tag color={config.color} icon={config.icon}>{config.label}</Tag>;
      },
    },
    {
      title: 'Rating',
      dataIndex: 'rating',
      key: 'rating',
      render: (rating?: number) => rating ? `${rating.toFixed(1)} ⭐` : '-',
    },
    {
      title: 'Orders',
      dataIndex: 'totalOrders',
      key: 'totalOrders',
      render: (orders?: number) => orders?.toLocaleString() || '0',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: PickupLocation) => (
        <Space>
          <Tooltip title="View Details">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              onClick={() => handleViewDetail(record)} 
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => handleEdit(record)} 
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button 
              type="text" 
              danger 
              icon={<DeleteOutlined />} 
              onClick={() => handleDelete(record.id, record.name)} 
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Pickup Locations</Title>
          <Text type="secondary">Manage pickup points, lockers, and partner stores</Text>
        </div>
        <Space>
          <Button icon={<ExportOutlined />}>Export</Button>
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>Refresh</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => {
            setEditMode(false);
            setSelectedLocation(null);
            form.resetFields();
            setShowCreateModal(true);
          }}>
            Add Location
          </Button>
        </Space>
      </div>

      {/* Stats */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Locations"
              value={stats.total}
              prefix={<EnvironmentOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Active"
              value={stats.active}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Smart Lockers"
              value={stats.lockers}
              prefix={<InboxOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Pickup Points"
              value={stats.pickupPoints}
              prefix={<HomeOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="Search by name, code, address..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 250 }}
            allowClear
          />
          <Select
            value={typeFilter}
            onChange={setTypeFilter}
            style={{ width: 150 }}
            options={[
              { value: 'all', label: 'All Types' },
              ...PICKUP_TYPES.map(t => ({ value: t.value, label: t.label })),
            ]}
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 150 }}
            options={[
              { value: 'all', label: 'All Statuses' },
              ...STATUSES.map(s => ({ value: s.value, label: s.label })),
            ]}
          />
          <Select
            value={cityFilter}
            onChange={setCityFilter}
            style={{ width: 150 }}
            placeholder="Filter by city"
            options={[
              { value: 'all', label: 'All Cities' },
              ...cities.map(c => ({ value: c, label: c })),
            ]}
          />
        </Space>
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={Array.isArray(data?.data) ? data.data : []}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: page,
            pageSize,
            total: data?.pagination?.total || 0,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} locations`,
          }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editMode ? 'Edit Pickup Location' : 'Add Pickup Location'}
        open={showCreateModal}
        onCancel={() => {
          setShowCreateModal(false);
          form.resetFields();
        }}
        onOk={handleSubmit}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        width={700}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Location Name"
                rules={[{ required: true, message: 'Please enter name' }]}
              >
                <Input placeholder="e.g., Lagos Island Locker A" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="code"
                label="Location Code"
                rules={[{ required: true, message: 'Please enter code' }]}
              >
                <Input placeholder="e.g., LIS-001" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="type"
                label="Type"
                rules={[{ required: true, message: 'Please select type' }]}
              >
                <Select options={PICKUP_TYPES.map(t => ({ value: t.value, label: t.label }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="Status"
                initialValue="active"
              >
                <Select options={STATUSES.map(s => ({ value: s.value, label: s.label }))} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="address"
            label="Address"
            rules={[{ required: true, message: 'Please enter address' }]}
          >
            <Input.TextArea rows={2} placeholder="Full street address" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="city"
                label="City"
                rules={[{ required: true, message: 'Please enter city' }]}
              >
                <Input placeholder="e.g., Lagos" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="state"
                label="State"
                rules={[{ required: true, message: 'Please enter state' }]}
              >
                <Input placeholder="e.g., Lagos" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="capacity"
                label="Capacity"
              >
                <InputNumber min={1} style={{ width: '100%' }} placeholder="Optional" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="latitude"
                label="Latitude"
                rules={[{ required: true, message: 'Please enter latitude' }]}
              >
                <InputNumber style={{ width: '100%' }} step={0.000001} placeholder="e.g., 6.4541" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="longitude"
                label="Longitude"
                rules={[{ required: true, message: 'Please enter longitude' }]}
              >
                <InputNumber style={{ width: '100%' }} step={0.000001} placeholder="e.g., 3.3947" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="deliveryDiscount"
                label="Delivery Discount (%)"
              >
                <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="0" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="supportsRefrigeration"
                label="Refrigeration"
                valuePropName="checked"
              >
                <Switch checkedChildren="Yes" unCheckedChildren="No" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Detail Drawer */}
      <Drawer
        title="Pickup Location Details"
        open={showDetailDrawer}
        onClose={() => setShowDetailDrawer(false)}
        width={500}
      >
        {selectedLocation && (
          <>
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Name">{selectedLocation.name}</Descriptions.Item>
              <Descriptions.Item label="Code">{selectedLocation.code}</Descriptions.Item>
              <Descriptions.Item label="Type">
                <Tag color={getTypeConfig(selectedLocation.type).color}>
                  {getTypeConfig(selectedLocation.type).label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={getStatusConfig(selectedLocation.status).color}>
                  {getStatusConfig(selectedLocation.status).label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Address">{selectedLocation.address}</Descriptions.Item>
              <Descriptions.Item label="City">{selectedLocation.city}</Descriptions.Item>
              <Descriptions.Item label="State">{selectedLocation.state}</Descriptions.Item>
              <Descriptions.Item label="Coordinates">
                {selectedLocation.latitude}, {selectedLocation.longitude}
              </Descriptions.Item>
              {selectedLocation.capacity && (
                <Descriptions.Item label="Capacity">
                  {selectedLocation.currentOccupancy || 0}/{selectedLocation.capacity}
                </Descriptions.Item>
              )}
              {selectedLocation.deliveryDiscount && (
                <Descriptions.Item label="Delivery Discount">
                  {selectedLocation.deliveryDiscount}%
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Refrigeration">
                {selectedLocation.supportsRefrigeration ? 'Yes' : 'No'}
              </Descriptions.Item>
              {selectedLocation.rating && (
                <Descriptions.Item label="Rating">
                  {selectedLocation.rating.toFixed(1)} ⭐
                </Descriptions.Item>
              )}
              {selectedLocation.totalOrders !== undefined && (
                <Descriptions.Item label="Total Orders">
                  {selectedLocation.totalOrders.toLocaleString()}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Created">
                {dayjs(selectedLocation.createdAt).format('DD MMM YYYY, HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="Updated">
                {dayjs(selectedLocation.updatedAt).format('DD MMM YYYY, HH:mm')}
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 16 }}>
              <Space>
                <Button 
                  type="primary" 
                  icon={<EditOutlined />} 
                  onClick={() => {
                    setShowDetailDrawer(false);
                    handleEdit(selectedLocation);
                  }}
                >
                  Edit
                </Button>
                <Button 
                  danger 
                  icon={<DeleteOutlined />} 
                  onClick={() => {
                    setShowDetailDrawer(false);
                    handleDelete(selectedLocation.id, selectedLocation.name);
                  }}
                >
                  Delete
                </Button>
              </Space>
            </div>
          </>
        )}
      </Drawer>
    </div>
  );
}
