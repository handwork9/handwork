'use client';

import { useState } from 'react';
import {
  Card,
  Table,
  Tag,
  Space,
  Button,
  Input,
  Select,
  DatePicker,
  Typography,
  Drawer,
  Descriptions,
  Timeline,
  Avatar,
  Divider,
  Modal,
  App,
  Dropdown,
  Alert,
  Row,
  Col,
  Statistic,
  Tabs,
  Badge,
  Tooltip,
  Progress,
} from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  EyeOutlined,
  CarOutlined,
  MoreOutlined,
  ReloadOutlined,
  ExportOutlined,
  UserOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  ShoppingCartOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  DollarOutlined,
  GiftOutlined,
  ScheduleOutlined,
  ThunderboltOutlined,
  InfoCircleOutlined,
  ShopOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface Order {
  id: string;
  orderNumber: string;
  buyer: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
  seller: {
    id: string;
    businessName: string;
    phone: string;
  };
  rider?: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    unit: string;
  }>;
  status: string;
  paymentStatus?: string;
  totalAmount: number;
  deliveryFee: number;
  serviceFee?: number;
  deliveryType?: 'ASAP' | 'SCHEDULED';
  scheduledDeliveryTime?: string;
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    coordinates?: { lat: number; lng: number };
  };
  riderNote?: string;
  farmerMessage?: string;
  isGift?: boolean;
  giftDetails?: {
    recipientName: string;
    recipientPhone: string;
    message?: string;
  };
  customerNotes?: string;
  pickupState?: string;
  deliveryState?: string;
  pickupPoint?: {
    address: string;
    city: string;
    state: string;
    lat?: number;
    lng?: number;
  };
  createdAt: string;
  updatedAt: string;
  cancellationReason?: string;
  statusHistory: Array<{
    status: string;
    timestamp: string;
    note?: string;
  }>;
}

const formatCurrency = (value: number | null | undefined) => `₦${(value ?? 0).toLocaleString()}`;

const statusColors: Record<string, string> = {
  pending: 'orange',
  created: 'gold',
  confirmed: 'blue',
  processing: 'cyan',
  preparing: 'cyan',
  assigned: 'purple',
  ready_for_pickup: 'purple',
  rider_assigned: 'purple',
  picked_up: 'geekblue',
  in_transit: 'processing',
  delivered: 'success',
  cancelled: 'error',
  refunded: 'default',
};

const statusIcons: Record<string, React.ReactNode> = {
  pending: <ClockCircleOutlined />,
  created: <ShoppingCartOutlined />,
  confirmed: <CheckCircleOutlined />,
  processing: <SyncOutlined spin />,
  preparing: <SyncOutlined spin />,
  assigned: <CarOutlined />,
  ready_for_pickup: <CarOutlined />,
  rider_assigned: <CarOutlined />,
  picked_up: <CarOutlined />,
  in_transit: <CarOutlined />,
  delivered: <CheckCircleOutlined />,
  cancelled: <CloseCircleOutlined />,
  refunded: <DollarOutlined />,
};

export default function OrdersPage() {
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [assignRiderModal, setAssignRiderModal] = useState(false);
  const [selectedRider, setSelectedRider] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState('details');

  // Fetch dashboard stats for order counts
  const { data: dashboardData } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await adminApi.getDashboard();
      return response.data?.data || response.data;
    },
  });

  // Fetch orders
  const { data: ordersData, isLoading, refetch } = useQuery({
    queryKey: ['orders', page, pageSize, search, status, dateRange],
    queryFn: async () => {
      const params: Record<string, string | number | undefined> = {
        page,
        limit: pageSize,
        search,
        status,
      };
      if (dateRange) {
        params.startDate = dateRange[0].format('YYYY-MM-DD');
        params.endDate = dateRange[1].format('YYYY-MM-DD');
      }
      const response = await adminApi.getOrders(params);
      const data = response.data?.data || response.data;
      const orders = (data.orders || data.items || []).map((order: Order & { assignedRider?: { id?: string; user?: { name?: string; phone?: string } } }) => ({
        ...order,
        rider: order.rider || (order.assignedRider?.user ? {
          id: order.assignedRider.id || '',
          firstName: order.assignedRider.user.name?.split(' ')[0] || '',
          lastName: order.assignedRider.user.name?.split(' ').slice(1).join(' ') || '',
          phone: order.assignedRider.user.phone || '',
        } : undefined),
      }));
      return {
        items: orders,
        total: data.total || 0,
      };
    },
  });

  // Fetch available riders for assignment - filtered by order's pickup state
  const { data: ridersData } = useQuery({
    queryKey: ['riders', 'available', selectedOrder?.pickupState],
    queryFn: async () => {
      // Pass the order's pickup state to only get riders operating in that state
      const response = await adminApi.getAvailableRiders({ 
        limit: 100,
        state: selectedOrder?.pickupState,
      });
      const data = response.data?.data || response.data;
      return data.items || [];
    },
    enabled: assignRiderModal && !!selectedOrder,
  });

  // Assign rider mutation
  const assignRiderMutation = useMutation({
    mutationFn: ({ orderId, riderId }: { orderId: string; riderId: string }) =>
      adminApi.assignRider(orderId, riderId),
    onSuccess: () => {
      message.success('Rider assigned successfully');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setAssignRiderModal(false);
      setSelectedRider(undefined);
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      message.error(error.response?.data?.message || 'Failed to assign rider');
    },
  });

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status, reason }: { orderId: string; status: string; reason?: string }) =>
      adminApi.updateOrderStatus(orderId, status, reason),
    onSuccess: () => {
      message.success('Order status updated');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setDrawerVisible(false);
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      message.error(error.response?.data?.message || 'Failed to update status');
    },
  });

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setDrawerVisible(true);
    setActiveTab('details');
  };

  const handleAssignRider = () => {
    if (selectedOrder && selectedRider) {
      assignRiderMutation.mutate({
        orderId: selectedOrder.id,
        riderId: selectedRider,
      });
    }
  };

  const handleCancelOrder = (order: Order) => {
    let cancelReason = '';
    const isPaid = ['confirmed', 'preparing', 'assigned', 'rider_assigned', 'picked_up', 'in_transit'].includes(order.status);
    modal.confirm({
      title: 'Cancel Order',
      content: (
        <div>
          <p>Are you sure you want to cancel order {order.orderNumber}?</p>
          {isPaid && (
            <Alert
              type="info"
              title="Refund Notice"
              description={`A refund of ${formatCurrency(order.totalAmount)} will be credited to the buyer's wallet.`}
              showIcon
              style={{ marginTop: 12 }}
            />
          )}
          <Input.TextArea
            placeholder="Cancellation reason (optional)"
            rows={3}
            style={{ marginTop: 12 }}
            onChange={(e) => { cancelReason = e.target.value; }}
          />
        </div>
      ),
      okText: isPaid ? 'Cancel & Refund' : 'Yes, Cancel',
      okType: 'danger',
      onOk: () => {
        updateStatusMutation.mutate({
          orderId: order.id,
          status: 'cancelled',
          reason: cancelReason || undefined,
        });
      },
    });
  };

  // Calculate order stats
  const orderStats = {
    total: dashboardData?.totalOrders || 0,
    pending: dashboardData?.pendingOrders || 0,
    completed: dashboardData?.completedOrders || 0,
    cancelled: dashboardData?.cancelledOrders || 0,
    inProgress: (dashboardData?.totalOrders || 0) - (dashboardData?.pendingOrders || 0) - (dashboardData?.completedOrders || 0) - (dashboardData?.cancelledOrders || 0),
  };

  const completionRate = orderStats.total > 0 
    ? Math.round((orderStats.completed / orderStats.total) * 100) 
    : 0;

  const columns: ColumnsType<Order> = [
    {
      title: 'Order',
      key: 'order',
      width: 180,
      render: (_, record) => (
        <div>
          <Text strong style={{ color: '#4f46e5', cursor: 'pointer' }} onClick={() => handleViewOrder(record)}>
            {record.orderNumber}
          </Text>
          <div style={{ marginTop: 4 }}>
            <Space size={4}>
              {record.deliveryType === 'SCHEDULED' ? (
                <Tooltip title="Scheduled Delivery">
                  <Tag color="purple" style={{ margin: 0 }}><ScheduleOutlined /></Tag>
                </Tooltip>
              ) : (
                <Tooltip title="ASAP Delivery">
                  <Tag color="blue" style={{ margin: 0 }}><ThunderboltOutlined /></Tag>
                </Tooltip>
              )}
              {record.isGift && (
                <Tooltip title="Gift Order">
                  <Tag color="pink" style={{ margin: 0 }}><GiftOutlined /></Tag>
                </Tooltip>
              )}
            </Space>
          </div>
        </div>
      ),
    },
    {
      title: 'Customer',
      key: 'buyer',
      width: 200,
      render: (_, record) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: '#4f46e5' }} />
          <div>
            <Text>{record.buyer.firstName} {record.buyer.lastName}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              <PhoneOutlined style={{ marginRight: 4 }} />
              {record.buyer.phone}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Seller',
      key: 'seller',
      width: 150,
      render: (_, record) => (
        <Space>
          <ShopOutlined style={{ color: '#52c41a' }} />
          <Text>{record.seller?.businessName || 'N/A'}</Text>
        </Space>
      ),
    },
    {
      title: 'Items',
      key: 'items',
      width: 80,
      align: 'center',
      render: (_, record) => (
        <Badge count={record.items?.length || 0} style={{ backgroundColor: '#4f46e5' }} />
      ),
    },
    {
      title: 'Amount',
      key: 'amount',
      width: 130,
      render: (_, record) => (
        <div>
          <Text strong>{formatCurrency(record.totalAmount)}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 11 }}>
            + {formatCurrency(record.deliveryFee)} delivery
          </Text>
        </div>
      ),
      sorter: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: string) => (
        <Tag icon={statusIcons[status]} color={statusColors[status]}>
          {status.replace(/_/g, ' ').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Rider',
      key: 'rider',
      width: 150,
      render: (_, record) =>
        record.rider ? (
          <Space>
            <Avatar size="small" icon={<CarOutlined />} style={{ backgroundColor: '#06b6d4' }} />
            <Text>{record.rider.firstName} {record.rider.lastName}</Text>
          </Space>
        ) : (
          <Text type="secondary">
            {['confirmed', 'created', 'pending', 'preparing', 'ready_for_pickup'].includes(record.status) ? (
              <Button 
                type="link" 
                size="small" 
                icon={<CarOutlined />}
                onClick={() => {
                  setSelectedOrder(record);
                  setAssignRiderModal(true);
                }}
              >
                Assign
              </Button>
            ) : (
              'Not assigned'
            )}
          </Text>
        ),
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
      render: (date: string) => (
        <Tooltip title={dayjs(date).format('MMM DD, YYYY HH:mm:ss')}>
          <Text>{dayjs(date).format('MMM DD, HH:mm')}</Text>
        </Tooltip>
      ),
      sorter: true,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewOrder(record)}
            />
          </Tooltip>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'assign',
                  label: 'Assign Rider',
                  icon: <CarOutlined />,
                  disabled: !!record.rider || !['confirmed', 'created', 'pending', 'preparing', 'ready_for_pickup'].includes(record.status),
                  onClick: () => {
                    setSelectedOrder(record);
                    setAssignRiderModal(true);
                  },
                },
                { type: 'divider' },
                {
                  key: 'cancel',
                  label: 'Cancel Order',
                  danger: true,
                  icon: <CloseCircleOutlined />,
                  disabled: ['delivered', 'cancelled', 'refunded'].includes(record.status),
                  onClick: () => handleCancelOrder(record),
                },
              ],
            }}
          >
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      ),
    },
  ];

  const orders = ordersData?.items || [];
  const total = ordersData?.total || 0;

  // Status filter options with counts
  const statusOptions = [
    { value: 'pending', label: 'Pending', color: 'orange' },
    { value: 'confirmed', label: 'Confirmed', color: 'blue' },
    { value: 'preparing', label: 'Preparing', color: 'cyan' },
    { value: 'assigned', label: 'Assigned', color: 'purple' },
    { value: 'picked_up', label: 'Picked Up', color: 'geekblue' },
    { value: 'in_transit', label: 'In Transit', color: 'processing' },
    { value: 'delivered', label: 'Delivered', color: 'success' },
    { value: 'cancelled', label: 'Cancelled', color: 'error' },
  ];

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
            <ShoppingCartOutlined style={{ marginRight: 12 }} />
            Orders Management
          </Title>
          <Text type="secondary">Track and manage all marketplace orders</Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
            Refresh
          </Button>
          <Button icon={<ExportOutlined />}>Export</Button>
        </Space>
      </div>

      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="Total Orders"
              value={orderStats.total}
              prefix={<ShoppingCartOutlined style={{ color: '#4f46e5' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="Pending Orders"
              value={orderStats.pending}
              prefix={<ClockCircleOutlined style={{ color: '#fa8c16' }} />}
              styles={{ content: { color: '#fa8c16' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="Completed Orders"
              value={orderStats.completed}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              styles={{ content: { color: '#52c41a' } }}
            />
            <Progress percent={completionRate} size="small" strokeColor="#52c41a" showInfo={false} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="Cancelled Orders"
              value={orderStats.cancelled}
              prefix={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
              styles={{ content: { color: '#ff4d4f' } }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap size="middle">
          <Input
            placeholder="Search by order ID, customer..."
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 280 }}
            allowClear
          />
          <Select
            placeholder="Filter by Status"
            value={status}
            onChange={setStatus}
            style={{ width: 180 }}
            allowClear
          >
            {statusOptions.map(opt => (
              <Select.Option key={opt.value} value={opt.value}>
                <Tag color={opt.color} style={{ marginRight: 4 }}>{opt.label}</Tag>
              </Select.Option>
            ))}
          </Select>
          <RangePicker
            value={dateRange}
            onChange={(dates) =>
              setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)
            }
            placeholder={['Start Date', 'End Date']}
          />
          <Button 
            icon={<FilterOutlined />} 
            onClick={() => {
              setSearch('');
              setStatus(undefined);
              setDateRange(null);
            }}
          >
            Clear Filters
          </Button>
        </Space>
      </Card>

      {/* Orders Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={orders}
          rowKey="id"
          loading={isLoading}
          scroll={{ x: 1400 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} orders`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
          rowClassName={(record) => 
            record.status === 'pending' ? 'ant-table-row-warning' : ''
          }
        />
      </Card>

      {/* Order Details Drawer */}
      <Drawer
        title={
          <Space>
            <ShoppingCartOutlined />
            <span>Order {selectedOrder?.orderNumber}</span>
            {selectedOrder && (
              <Tag icon={statusIcons[selectedOrder.status]} color={statusColors[selectedOrder.status]}>
                {selectedOrder.status.replace(/_/g, ' ').toUpperCase()}
              </Tag>
            )}
          </Space>
        }
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        size="large"
        extra={
          selectedOrder && !['delivered', 'cancelled', 'refunded'].includes(selectedOrder.status) && (
            <Space>
              {!selectedOrder.rider && ['confirmed', 'created', 'pending', 'preparing', 'ready_for_pickup'].includes(selectedOrder.status) && (
                <Button 
                  type="primary"
                  icon={<CarOutlined />}
                  onClick={() => {
                    setAssignRiderModal(true);
                  }}
                >
                  Assign Rider
                </Button>
              )}
              <Button 
                danger
                onClick={() => selectedOrder && handleCancelOrder(selectedOrder)}
              >
                Cancel Order
              </Button>
            </Space>
          )
        }
      >
        {selectedOrder && (
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: 'details',
                label: 'Order Details',
                icon: <InfoCircleOutlined />,
                children: (
                  <Space orientation="vertical" size="large" style={{ width: '100%' }}>
                    {/* Order Summary */}
                    <Card size="small" title="Order Summary">
                      <Descriptions column={2} size="small">
                        <Descriptions.Item label="Order ID" span={2}>
                          <Text copyable strong>{selectedOrder.orderNumber}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Delivery Type">
                          <Tag color={selectedOrder.deliveryType === 'SCHEDULED' ? 'purple' : 'blue'}>
                            {selectedOrder.deliveryType === 'SCHEDULED' ? '📅 Scheduled' : '⚡ ASAP'}
                          </Tag>
                        </Descriptions.Item>
                        {selectedOrder.scheduledDeliveryTime && (
                          <Descriptions.Item label="Scheduled Time">
                            <Text strong style={{ color: '#722ed1' }}>
                              {dayjs(selectedOrder.scheduledDeliveryTime).format('MMM DD, YYYY HH:mm')}
                            </Text>
                          </Descriptions.Item>
                        )}
                        <Descriptions.Item label="Subtotal">
                          {formatCurrency(selectedOrder.totalAmount - selectedOrder.deliveryFee - (selectedOrder.serviceFee || 0))}
                        </Descriptions.Item>
                        <Descriptions.Item label="Delivery Fee">
                          {formatCurrency(selectedOrder.deliveryFee)}
                        </Descriptions.Item>
                        {selectedOrder.serviceFee !== undefined && selectedOrder.serviceFee > 0 && (
                          <Descriptions.Item label="Service Fee">
                            {formatCurrency(selectedOrder.serviceFee)}
                          </Descriptions.Item>
                        )}
                        <Descriptions.Item label="Total Amount">
                          <Text strong style={{ fontSize: 16, color: '#4f46e5' }}>
                            {formatCurrency(selectedOrder.totalAmount)}
                          </Text>
                        </Descriptions.Item>
                        {selectedOrder.paymentStatus && (
                          <Descriptions.Item label="Payment Status">
                            <Tag color={selectedOrder.paymentStatus === 'completed' ? 'success' : selectedOrder.paymentStatus === 'refunded' ? 'purple' : 'orange'}>
                              {selectedOrder.paymentStatus.toUpperCase()}
                            </Tag>
                          </Descriptions.Item>
                        )}
                        <Descriptions.Item label="Created">
                          {dayjs(selectedOrder.createdAt).format('MMM DD, YYYY HH:mm')}
                        </Descriptions.Item>
                      </Descriptions>
                    </Card>

                    {/* Gift Details */}
                    {selectedOrder.isGift && selectedOrder.giftDetails && (
                      <Card size="small" title={<><GiftOutlined /> Gift Details</>}>
                        <Descriptions column={1} size="small">
                          <Descriptions.Item label="Recipient Name">
                            {selectedOrder.giftDetails.recipientName}
                          </Descriptions.Item>
                          <Descriptions.Item label="Recipient Phone">
                            {selectedOrder.giftDetails.recipientPhone}
                          </Descriptions.Item>
                          {selectedOrder.giftDetails.message && (
                            <Descriptions.Item label="Gift Message">
                              <Text italic>&quot;{selectedOrder.giftDetails.message}&quot;</Text>
                            </Descriptions.Item>
                          )}
                        </Descriptions>
                      </Card>
                    )}

                    {/* Order Items */}
                    <Card size="small" title="Order Items">
                      <Table
                        size="small"
                        dataSource={selectedOrder.items}
                        rowKey="productId"
                        pagination={false}
                        columns={[
                          { title: 'Product', dataIndex: 'productName', key: 'product' },
                          { title: 'Qty', dataIndex: 'quantity', key: 'qty', width: 60 },
                          { title: 'Unit', dataIndex: 'unit', key: 'unit', width: 60 },
                          {
                            title: 'Price',
                            dataIndex: 'price',
                            key: 'price',
                            width: 100,
                            render: (v: number) => formatCurrency(v),
                          },
                          {
                            title: 'Subtotal',
                            key: 'subtotal',
                            width: 100,
                            render: (_, item) => formatCurrency(item.price * item.quantity),
                          },
                        ]}
                      />
                    </Card>

                    {/* Notes */}
                    {(selectedOrder.customerNotes || selectedOrder.riderNote || selectedOrder.farmerMessage) && (
                      <Card size="small" title="Notes & Messages">
                        <Descriptions column={1} size="small">
                          {selectedOrder.customerNotes && (
                            <Descriptions.Item label="Customer Notes">
                              {selectedOrder.customerNotes}
                            </Descriptions.Item>
                          )}
                          {selectedOrder.riderNote && (
                            <Descriptions.Item label="Note for Rider">
                              <Text style={{ color: '#06b6d4' }}>{selectedOrder.riderNote}</Text>
                            </Descriptions.Item>
                          )}
                          {selectedOrder.farmerMessage && (
                            <Descriptions.Item label="Message for Farmer">
                              <Text style={{ color: '#52c41a' }}>{selectedOrder.farmerMessage}</Text>
                            </Descriptions.Item>
                          )}
                        </Descriptions>
                      </Card>
                    )}

                    {/* Cancellation Reason */}
                    {selectedOrder.status === 'cancelled' && selectedOrder.cancellationReason && (
                      <Alert
                        type="error"
                        title="Order Cancelled"
                        description={selectedOrder.cancellationReason}
                        showIcon
                      />
                    )}
                  </Space>
                ),
              },
              {
                key: 'parties',
                label: 'Parties',
                icon: <UserOutlined />,
                children: (
                  <Space orientation="vertical" size="large" style={{ width: '100%' }}>
                    {/* Customer */}
                    <Card size="small" title={<><UserOutlined /> Customer</>}>
                      <Space orientation="vertical" style={{ width: '100%' }}>
                        <Space>
                          <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#4f46e5' }} />
                          <div>
                            <Text strong>{selectedOrder.buyer.firstName} {selectedOrder.buyer.lastName}</Text>
                            <br />
                            <Text type="secondary">{selectedOrder.buyer.email}</Text>
                          </div>
                        </Space>
                        <Divider style={{ margin: '12px 0' }} />
                        <Space>
                          <PhoneOutlined />
                          <Text copyable>{selectedOrder.buyer.phone}</Text>
                        </Space>
                        <Space>
                          <EnvironmentOutlined />
                          <Text>
                            {selectedOrder.deliveryAddress.street}, {selectedOrder.deliveryAddress.city},{' '}
                            {selectedOrder.deliveryAddress.state}
                          </Text>
                        </Space>
                      </Space>
                    </Card>

                    {/* Seller */}
                    <Card size="small" title={<><ShopOutlined /> Seller</>}>
                      <Space orientation="vertical" style={{ width: '100%' }}>
                        <Space>
                          <Avatar icon={<ShopOutlined />} style={{ backgroundColor: '#52c41a' }} />
                          <Text strong>{selectedOrder.seller?.businessName || 'N/A'}</Text>
                        </Space>
                        <Space>
                          <PhoneOutlined />
                          <Text copyable>{selectedOrder.seller?.phone || 'N/A'}</Text>
                        </Space>
                      </Space>
                    </Card>

                    {/* Rider */}
                    {selectedOrder.rider && (
                      <Card size="small" title={<><CarOutlined /> Assigned Rider</>}>
                        <Space orientation="vertical" style={{ width: '100%' }}>
                          <Space>
                            <Avatar icon={<CarOutlined />} style={{ backgroundColor: '#06b6d4' }} />
                            <Text strong>
                              {selectedOrder.rider.firstName} {selectedOrder.rider.lastName}
                            </Text>
                          </Space>
                          <Space>
                            <PhoneOutlined />
                            <Text copyable>{selectedOrder.rider.phone}</Text>
                          </Space>
                        </Space>
                      </Card>
                    )}
                  </Space>
                ),
              },
              {
                key: 'timeline',
                label: 'Timeline',
                icon: <ClockCircleOutlined />,
                children: (
                  <Timeline
                    mode="left"
                    items={(selectedOrder.statusHistory || []).map((item) => ({
                      color:
                        item.status === selectedOrder.status
                          ? 'blue'
                          : item.status === 'cancelled'
                          ? 'red'
                          : 'green',
                      dot: statusIcons[item.status],
                      label: dayjs(item.timestamp).format('MMM DD, HH:mm'),
                      content: (
                        <div>
                          <Text strong>{item.status.replace(/_/g, ' ').toUpperCase()}</Text>
                          {item.note && (
                            <>
                              <br />
                              <Text type="secondary">{item.note}</Text>
                            </>
                          )}
                        </div>
                      ),
                    }))}
                  />
                ),
              },
              {
                key: 'tracking',
                label: 'Live Tracking',
                icon: <EnvironmentOutlined />,
                disabled: !['rider_assigned', 'picked_up', 'in_transit'].includes(selectedOrder.status),
                children: (
                  <Space orientation="vertical" size="large" style={{ width: '100%' }}>
                    {/* Live Tracking Map */}
                    {['rider_assigned', 'picked_up', 'in_transit'].includes(selectedOrder.status) && selectedOrder.deliveryAddress?.coordinates ? (
                      <>
                        <Alert
                          type="info"
                          message="Live Rider Tracking"
                          description="The map below shows the real-time location of the rider and the delivery route."
                          showIcon
                          icon={<CarOutlined />}
                        />
                        <Card 
                          size="small" 
                          title={
                            <Space>
                              <span style={{ 
                                width: 8, 
                                height: 8, 
                                borderRadius: '50%', 
                                backgroundColor: '#52c41a',
                                display: 'inline-block',
                                animation: 'pulse 1.5s infinite'
                              }} />
                              Live Map
                            </Space>
                          }
                          styles={{ body: { padding: 0 } }}
                        >
                          <div style={{ height: 400, position: 'relative' }}>
                            <iframe
                              width="100%"
                              height="100%"
                              style={{ border: 0 }}
                              loading="lazy"
                              src={`https://api.mapbox.com/styles/v1/mapbox/streets-v12.html?title=false&access_token=pk.eyJ1IjoiYnVsbGlvbjkiLCJhIjoiY21qZm1rNmM3MG5iZDNlczZ3Y3ZyODgzdCJ9.IGVGBctIjRag8D3Crma1ow#14/${selectedOrder.deliveryAddress.coordinates.lat}/${selectedOrder.deliveryAddress.coordinates.lng}`}
                            />
                            <div style={{
                              position: 'absolute',
                              bottom: 16,
                              left: 16,
                              right: 16,
                              background: 'white',
                              borderRadius: 8,
                              padding: 12,
                              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                            }}>
                              <Space orientation="vertical" style={{ width: '100%' }}>
                                <Space>
                                  <EnvironmentOutlined style={{ color: '#4CAF50' }} />
                                  <Text strong>Delivery:</Text>
                                  <Text>{selectedOrder.deliveryAddress.street}, {selectedOrder.deliveryAddress.city}</Text>
                                </Space>
                                {selectedOrder.rider && (
                                  <Space>
                                    <CarOutlined style={{ color: '#2196F3' }} />
                                    <Text strong>Rider:</Text>
                                    <Text>{selectedOrder.rider.firstName} {selectedOrder.rider.lastName}</Text>
                                    <Text type="secondary">({selectedOrder.rider.phone})</Text>
                                  </Space>
                                )}
                              </Space>
                            </div>
                          </div>
                        </Card>
                        <Row gutter={16}>
                          <Col span={12}>
                            <Card size="small">
                              <Statistic
                                title="Order Status"
                                value={selectedOrder.status.replace(/_/g, ' ').toUpperCase()}
                                prefix={<CarOutlined style={{ color: '#2196F3' }} />}
                              />
                            </Card>
                          </Col>
                          <Col span={12}>
                            <Card size="small">
                              <Statistic
                                title="Assigned Rider"
                                value={selectedOrder.rider ? `${selectedOrder.rider.firstName} ${selectedOrder.rider.lastName}` : 'Not Assigned'}
                                prefix={<UserOutlined style={{ color: '#52c41a' }} />}
                              />
                            </Card>
                          </Col>
                        </Row>
                      </>
                    ) : (
                      <Alert
                        type="warning"
                        message="Tracking Not Available"
                        description={
                          !['rider_assigned', 'picked_up', 'in_transit'].includes(selectedOrder.status)
                            ? "Live tracking is only available when the order is in transit (rider assigned, picked up, or in transit)."
                            : "Location coordinates are not available for this order."
                        }
                        showIcon
                      />
                    )}
                  </Space>
                ),
              },
            ]}
          />
        )}
      </Drawer>

      {/* Assign Rider Modal */}
      <Modal
        title={<><CarOutlined /> Assign Rider</>}
        open={assignRiderModal}
        onOk={handleAssignRider}
        onCancel={() => {
          setAssignRiderModal(false);
          setSelectedRider(undefined);
        }}
        confirmLoading={assignRiderMutation.isPending}
        okButtonProps={{ disabled: !selectedRider }}
        okText="Assign Rider"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
          <Alert
            type="info"
            title={`Assigning rider to order ${selectedOrder?.orderNumber}`}
            showIcon
          />
          {(ridersData || []).length === 0 ? (
            <Alert
              type="warning"
              title="No Online Riders Available"
              description="There are no riders currently online. Riders must be online to be assigned to orders."
              showIcon
            />
          ) : (
            <Select
              placeholder="Select an online rider"
              value={selectedRider}
              onChange={setSelectedRider}
              style={{ width: '100%' }}
              showSearch
              optionFilterProp="label"
              size="large"
            >
              {(ridersData || []).map((rider: { id: string; name?: string; firstName?: string; lastName?: string; phone: string; isOnline?: boolean; rating?: number }) => (
                <Select.Option key={rider.id} value={rider.id} label={rider.name || `${rider.firstName || ''} ${rider.lastName || ''}`.trim()}>
                  <Space>
                    <span style={{ 
                      width: 10, 
                      height: 10, 
                      borderRadius: '50%', 
                      backgroundColor: rider.isOnline ? '#52c41a' : '#d9d9d9',
                      display: 'inline-block'
                    }} />
                    <Avatar size="small" icon={<CarOutlined />} style={{ backgroundColor: '#06b6d4' }} />
                    <span>{rider.name || `${rider.firstName || ''} ${rider.lastName || ''}`.trim()}</span>
                    <Text type="secondary">- {rider.phone}</Text>
                    {rider.rating && <Tag color="gold">★ {Number(rider.rating).toFixed(1)}</Tag>}
                  </Space>
                </Select.Option>
              ))}
            </Select>
          )}
          <Text type="secondary" style={{ fontSize: 12 }}>
            <InfoCircleOutlined style={{ marginRight: 4 }} />
            Only online riders are shown. Offline riders cannot be assigned to orders.
          </Text>
        </div>
      </Modal>
    </div>
  );
}
