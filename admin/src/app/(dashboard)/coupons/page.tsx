'use client';

import { useState } from 'react';
import {
  Card,
  Table,
  Tag,
  Space,
  Input,
  Select,
  Typography,
  Statistic,
  Row,
  Col,
  Button,
  Modal,
  Form,
  InputNumber,
  Switch,
  message,
  Tabs,
  DatePicker,
  Tooltip,
  Popconfirm,
  Progress,
} from 'antd';
import {
  SearchOutlined,
  TagOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  PercentageOutlined,
  DollarOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import { AxiosError } from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

// Types
interface Coupon {
  id: string;
  code: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minimumOrderAmount?: number;
  maximumDiscount?: number;
  usageLimit?: number;
  usageLimitPerUser?: number;
  usageCount: number;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  type: 'general' | 'first_order' | 'referral' | 'loyalty' | 'seasonal' | 'flash';
  applicableCategories?: string[];
  applicableProducts?: string[];
  createdAt: string;
}

interface CouponUsage {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  order: {
    id: string;
    orderNumber: string;
    total: number;
  };
  discountApplied: number;
  usedAt: string;
}

// Color mappings
const typeColors: Record<string, string> = {
  general: 'blue',
  first_order: 'green',
  referral: 'purple',
  loyalty: 'gold',
  seasonal: 'orange',
  flash: 'red',
};

const discountTypeColors: Record<string, string> = {
  percentage: 'cyan',
  fixed: 'green',
};

export default function CouponsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('coupons');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal states
  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [usageModalOpen, setUsageModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [selectedCouponId, setSelectedCouponId] = useState<string | null>(null);

  const [couponForm] = Form.useForm();

  // Queries
  const { data: couponsData, isLoading: couponsLoading, refetch } = useQuery({
    queryKey: ['coupons', page, pageSize, statusFilter, typeFilter],
    queryFn: async () => {
      const response = await adminApi.getCoupons({
        page,
        limit: pageSize,
        status: statusFilter,
        type: typeFilter,
      });
      return response.data;
    },
  });

  const { data: usageData, isLoading: usageLoading } = useQuery({
    queryKey: ['couponUsage', selectedCouponId],
    queryFn: async () => {
      if (!selectedCouponId) return null;
      const response = await adminApi.getCouponUsage(selectedCouponId);
      return response.data;
    },
    enabled: !!selectedCouponId,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof adminApi.createCoupon>[0]) =>
      adminApi.createCoupon(data),
    onSuccess: () => {
      message.success('Coupon created successfully');
      setCouponModalOpen(false);
      couponForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
    },
    onError: (error: AxiosError<{ message: string }>) => {
      message.error(error.response?.data?.message || 'Failed to create coupon');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      adminApi.updateCoupon(id, data),
    onSuccess: () => {
      message.success('Coupon updated successfully');
      setCouponModalOpen(false);
      setEditingCoupon(null);
      couponForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
    },
    onError: (error: AxiosError<{ message: string }>) => {
      message.error(error.response?.data?.message || 'Failed to update coupon');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteCoupon(id),
    onSuccess: () => {
      message.success('Coupon deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
    },
    onError: (error: AxiosError<{ message: string }>) => {
      message.error(error.response?.data?.message || 'Failed to delete coupon');
    },
  });

  const handleCreateOrUpdate = async (values: Record<string, unknown>) => {
    const data = {
      ...values,
      startDate: values.dateRange?.[0]?.toISOString(),
      endDate: values.dateRange?.[1]?.toISOString(),
    };
    delete data.dateRange;

    if (editingCoupon) {
      updateMutation.mutate({ id: editingCoupon.id, data });
    } else {
      createMutation.mutate(data as Parameters<typeof adminApi.createCoupon>[0]);
    }
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    couponForm.setFieldsValue({
      ...coupon,
      dateRange:
        coupon.startDate && coupon.endDate
          ? [dayjs(coupon.startDate), dayjs(coupon.endDate)]
          : undefined,
    });
    setCouponModalOpen(true);
  };

  const handleViewUsage = (couponId: string) => {
    setSelectedCouponId(couponId);
    setUsageModalOpen(true);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    message.success('Coupon code copied!');
  };

  // Calculate stats from coupons data
  const coupons = couponsData?.coupons || couponsData?.data || [];
  const totalCoupons = couponsData?.total || coupons.length;
  const activeCoupons = coupons.filter((c: Coupon) => c.isActive).length;
  const totalUsage = coupons.reduce((acc: number, c: Coupon) => acc + (c.usageCount || 0), 0);

  const columns: ColumnsType<Coupon> = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      render: (code: string) => (
        <Space>
          <Text strong style={{ fontFamily: 'monospace', fontSize: 14 }}>
            {code}
          </Text>
          <Button
            type="text"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => copyCode(code)}
          />
        </Space>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={typeColors[type] || 'default'}>
          {type?.replace('_', ' ').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Discount',
      key: 'discount',
      render: (_, record) => (
        <Space>
          <Tag color={discountTypeColors[record.discountType]}>
            {record.discountType === 'percentage' ? (
              <>
                <PercentageOutlined /> {record.discountValue}%
              </>
            ) : (
              <>
                <DollarOutlined /> ₦{record.discountValue.toLocaleString()}
              </>
            )}
          </Tag>
          {record.maximumDiscount && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              (max ₦{record.maximumDiscount.toLocaleString()})
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Min Order',
      dataIndex: 'minimumOrderAmount',
      key: 'minimumOrderAmount',
      render: (amount?: number) =>
        amount ? `₦${amount.toLocaleString()}` : '-',
    },
    {
      title: 'Usage',
      key: 'usage',
      render: (_, record) => {
        const used = record.usageCount || 0;
        const limit = record.usageLimit;
        const percent = limit ? (used / limit) * 100 : 0;
        return (
          <Space direction="vertical" size={0}>
            <Text>
              {used} {limit ? `/ ${limit}` : ''} uses
            </Text>
            {limit && <Progress percent={percent} size="small" showInfo={false} />}
          </Space>
        );
      },
    },
    {
      title: 'Validity',
      key: 'validity',
      render: (_, record) => {
        if (!record.startDate && !record.endDate) return <Text type="secondary">No limit</Text>;
        const isExpired = record.endDate && dayjs(record.endDate).isBefore(dayjs());
        const isNotStarted = record.startDate && dayjs(record.startDate).isAfter(dayjs());
        return (
          <Space direction="vertical" size={0}>
            {record.startDate && (
              <Text style={{ fontSize: 12 }}>
                From: {dayjs(record.startDate).format('MMM D, YYYY')}
              </Text>
            )}
            {record.endDate && (
              <Text
                style={{ fontSize: 12 }}
                type={isExpired ? 'danger' : undefined}
              >
                To: {dayjs(record.endDate).format('MMM D, YYYY')}
              </Text>
            )}
            {isExpired && <Tag color="red">Expired</Tag>}
            {isNotStarted && <Tag color="orange">Not Started</Tag>}
          </Space>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag
          icon={isActive ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
          color={isActive ? 'success' : 'default'}
        >
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="View Usage">
            <Button
              type="text"
              icon={<HistoryOutlined />}
              onClick={() => handleViewUsage(record.id)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Delete this coupon?"
            onConfirm={() => deleteMutation.mutate(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const usageColumns: ColumnsType<CouponUsage> = [
    {
      title: 'User',
      key: 'user',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.user?.name}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.user?.email}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Order',
      key: 'order',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.order?.orderNumber}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            ₦{record.order?.total?.toLocaleString()}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Discount Applied',
      dataIndex: 'discountApplied',
      key: 'discountApplied',
      render: (amount: number) => (
        <Text strong style={{ color: '#52c41a' }}>
          -₦{amount?.toLocaleString()}
        </Text>
      ),
    },
    {
      title: 'Used At',
      dataIndex: 'usedAt',
      key: 'usedAt',
      render: (date: string) => dayjs(date).format('MMM D, YYYY h:mm A'),
    },
  ];

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
        <Title level={2} style={{ margin: 0 }}>
          <TagOutlined style={{ marginRight: 8 }} />
          Coupons Management
        </Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingCoupon(null);
              couponForm.resetFields();
              setCouponModalOpen(true);
            }}
          >
            Create Coupon
          </Button>
        </Space>
      </div>

      {/* Stats */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Coupons"
              value={totalCoupons}
              prefix={<TagOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Active Coupons"
              value={activeCoupons}
              valueStyle={{ color: '#3f8600' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Usage"
              value={totalUsage}
              prefix={<HistoryOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Usage Rate"
              value={totalCoupons > 0 ? Math.round((totalUsage / totalCoupons) * 100) / 100 : 0}
              suffix="per coupon"
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="Search by code..."
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 200 }}
          />
          <Select
            placeholder="Status"
            allowClear
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 120 }}
            options={[
              { label: 'Active', value: 'active' },
              { label: 'Inactive', value: 'inactive' },
            ]}
          />
          <Select
            placeholder="Type"
            allowClear
            value={typeFilter}
            onChange={setTypeFilter}
            style={{ width: 150 }}
            options={[
              { label: 'General', value: 'general' },
              { label: 'First Order', value: 'first_order' },
              { label: 'Referral', value: 'referral' },
              { label: 'Loyalty', value: 'loyalty' },
              { label: 'Seasonal', value: 'seasonal' },
              { label: 'Flash', value: 'flash' },
            ]}
          />
        </Space>
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={coupons.filter((c: Coupon) =>
            search ? c.code.toLowerCase().includes(search.toLowerCase()) : true
          )}
          rowKey="id"
          loading={couponsLoading}
          pagination={{
            current: page,
            pageSize,
            total: totalCoupons,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} coupons`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingCoupon ? 'Edit Coupon' : 'Create Coupon'}
        open={couponModalOpen}
        onCancel={() => {
          setCouponModalOpen(false);
          setEditingCoupon(null);
          couponForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={couponForm}
          layout="vertical"
          onFinish={handleCreateOrUpdate}
          initialValues={{
            discountType: 'percentage',
            type: 'general',
            isActive: true,
            usageLimitPerUser: 1,
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="code"
                label="Coupon Code"
                rules={[{ required: true, message: 'Please enter coupon code' }]}
              >
                <Input
                  placeholder="SUMMER2024"
                  style={{ textTransform: 'uppercase' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="type" label="Type">
                <Select
                  options={[
                    { label: 'General', value: 'general' },
                    { label: 'First Order', value: 'first_order' },
                    { label: 'Referral', value: 'referral' },
                    { label: 'Loyalty', value: 'loyalty' },
                    { label: 'Seasonal', value: 'seasonal' },
                    { label: 'Flash Sale', value: 'flash' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Description">
            <TextArea rows={2} placeholder="Coupon description..." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="discountType"
                label="Discount Type"
                rules={[{ required: true }]}
              >
                <Select
                  options={[
                    { label: 'Percentage (%)', value: 'percentage' },
                    { label: 'Fixed Amount (₦)', value: 'fixed' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="discountValue"
                label="Discount Value"
                rules={[{ required: true, message: 'Please enter discount value' }]}
              >
                <InputNumber
                  min={0}
                  max={couponForm.getFieldValue('discountType') === 'percentage' ? 100 : undefined}
                  style={{ width: '100%' }}
                  placeholder="10"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="minimumOrderAmount" label="Minimum Order Amount">
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  formatter={(value) => `₦ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value!.replace(/₦\s?|(,*)/g, '')}
                  placeholder="1000"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="maximumDiscount" label="Maximum Discount">
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  formatter={(value) => `₦ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value!.replace(/₦\s?|(,*)/g, '')}
                  placeholder="5000"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="usageLimit" label="Total Usage Limit">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="100" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="usageLimitPerUser" label="Per User Limit">
                <InputNumber min={1} style={{ width: '100%' }} placeholder="1" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="dateRange" label="Validity Period">
            <RangePicker style={{ width: '100%' }} showTime />
          </Form.Item>

          <Form.Item name="isActive" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={createMutation.isPending || updateMutation.isPending}>
                {editingCoupon ? 'Update' : 'Create'}
              </Button>
              <Button onClick={() => setCouponModalOpen(false)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Usage Modal */}
      <Modal
        title="Coupon Usage History"
        open={usageModalOpen}
        onCancel={() => {
          setUsageModalOpen(false);
          setSelectedCouponId(null);
        }}
        footer={null}
        width={800}
      >
        <Table
          columns={usageColumns}
          dataSource={usageData?.usages || usageData || []}
          rowKey="id"
          loading={usageLoading}
          pagination={{ pageSize: 10 }}
        />
      </Modal>
    </div>
  );
}
