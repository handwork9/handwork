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
  message,
  Dropdown,
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
  // New fields
  riderNote?: string;
  farmerMessage?: string;
  isGift?: boolean;
  giftDetails?: {
    recipientName: string;
    recipientPhone: string;
    message?: string;
  };
  customerNotes?: string;
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

// Mock data for development (defined at module scope with fixed timestamps)
const mockOrders: Order[] = [
  {
    id: '1',
    orderNumber: 'ORD-2024-0001',
    buyer: {
      id: 'b1',
      firstName: 'Amina',
      lastName: 'Bello',
      phone: '+234 803 123 4567',
      email: 'amina@example.com',
    },
    seller: {
      id: 's1',
      businessName: 'Fresh Farm Produce',
      phone: '+234 802 987 6543',
    },
    items: [
      { productId: 'p1', productName: 'Fresh Tomatoes', quantity: 5, price: 2000, unit: 'kg' },
      { productId: 'p2', productName: 'Red Onions', quantity: 3, price: 1500, unit: 'kg' },
    ],
    status: 'in_transit',
    totalAmount: 15500,
    deliveryFee: 1000,
    deliveryAddress: {
      street: '23 Marina Road',
      city: 'Lagos Island',
      state: 'Lagos',
    },
    createdAt: '2024-12-15T10:00:00.000Z',
    updatedAt: '2024-12-15T13:00:00.000Z',
    statusHistory: [
      { status: 'pending', timestamp: '2024-12-15T10:00:00.000Z' },
      { status: 'confirmed', timestamp: '2024-12-15T11:00:00.000Z' },
      { status: 'processing', timestamp: '2024-12-15T12:00:00.000Z' },
      { status: 'ready_for_pickup', timestamp: '2024-12-15T12:30:00.000Z' },
      { status: 'picked_up', timestamp: '2024-12-15T12:45:00.000Z' },
      { status: 'in_transit', timestamp: '2024-12-15T13:00:00.000Z' },
    ],
    rider: {
      id: 'r1',
      firstName: 'John',
      lastName: 'Adamu',
      phone: '+234 806 555 1234',
    },
  },
  {
    id: '2',
    orderNumber: 'ORD-2024-0002',
    buyer: {
      id: 'b2',
      firstName: 'Chidi',
      lastName: 'Okonkwo',
      phone: '+234 807 234 5678',
      email: 'chidi@example.com',
    },
    seller: {
      id: 's2',
      businessName: 'Organic Gardens',
      phone: '+234 808 876 5432',
    },
    items: [
      { productId: 'p3', productName: 'Organic Carrots', quantity: 2, price: 3000, unit: 'kg' },
    ],
    status: 'ready_for_pickup',
    totalAmount: 7500,
    deliveryFee: 1500,
    deliveryAddress: {
      street: '45 Adeola Street',
      city: 'Victoria Island',
      state: 'Lagos',
    },
    createdAt: '2024-12-15T09:00:00.000Z',
    updatedAt: '2024-12-15T11:00:00.000Z',
    statusHistory: [
      { status: 'pending', timestamp: '2024-12-15T09:00:00.000Z' },
      { status: 'confirmed', timestamp: '2024-12-15T09:30:00.000Z' },
      { status: 'ready_for_pickup', timestamp: '2024-12-15T11:00:00.000Z' },
    ],
  },
];

export default function OrdersPage() {
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
      const data = response.data.data || response.data;
      // Map backend response { orders, total } to { items, total }
      // Also map assignedRider to rider for frontend compatibility
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

  // Fetch available riders for assignment
  const { data: ridersData } = useQuery({
    queryKey: ['riders', 'available'],
    queryFn: async () => {
      const response = await adminApi.getAvailableRiders({ limit: 100 });
      const data = response.data.data || response.data;
      // Backend returns { items, total } 
      return data.items || [];
    },
    enabled: assignRiderModal,
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
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      message.error(error.response?.data?.message || 'Failed to update status');
    },
  });

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setDrawerVisible(true);
  };

  const handleAssignRider = () => {
    if (selectedOrder && selectedRider) {
      assignRiderMutation.mutate({
        orderId: selectedOrder.id,
        riderId: selectedRider,
      });
    }
  };

  const columns: ColumnsType<Order> = [
    {
      title: 'Order ID',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render: (orderNumber: string) => (
        <Text strong style={{ color: '#4f46e5' }}>
          {orderNumber}
        </Text>
      ),
    },
    {
      title: 'Customer',
      key: 'buyer',
      render: (_, record) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          <div>
            <Text>{record.buyer.firstName} {record.buyer.lastName}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.buyer.phone}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Seller',
      key: 'seller',
      render: (_, record) => (
        <Text>{record.seller?.businessName || 'N/A'}</Text>
      ),
    },
    {
      title: 'Items',
      key: 'items',
      render: (_, record) => (
        <Text>{record.items?.length || 0} item(s)</Text>
      ),
    },
    {
      title: 'Total',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (value: number) => (
        <Text strong>{formatCurrency(value)}</Text>
      ),
      sorter: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColors[status]}>
          {status.replace(/_/g, ' ').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Type',
      key: 'orderType',
      width: 100,
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Tag color={record.deliveryType === 'SCHEDULED' ? 'purple' : 'blue'} style={{ margin: 0 }}>
            {record.deliveryType === 'SCHEDULED' ? '📅' : '⚡'}
          </Tag>
          {record.isGift && <Tag color="pink" style={{ margin: 0 }}>🎁</Tag>}
        </Space>
      ),
    },
    {
      title: 'Delivery',
      key: 'deliveryType',
      render: (_, record) => (
        <div>
          <Tag color={record.deliveryType === 'SCHEDULED' ? 'purple' : 'blue'}>
            {record.deliveryType === 'SCHEDULED' ? '📅 Scheduled' : '⚡ ASAP'}
          </Tag>
          {record.scheduledDeliveryTime && (
            <div style={{ fontSize: 11, color: '#722ed1', marginTop: 2 }}>
              {dayjs(record.scheduledDeliveryTime).format('MMM DD, HH:mm')}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Rider',
      key: 'rider',
      render: (_, record) =>
        record.rider ? (
          <Space>
            <CarOutlined style={{ color: '#06b6d4' }} />
            <Text>{record.rider.firstName} {record.rider.lastName}</Text>
          </Space>
        ) : (
          <Text type="secondary">Not assigned</Text>
        ),
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('MMM DD, YYYY HH:mm'),
      sorter: true,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleViewOrder(record)}
          />
          <Dropdown
            menu={{
              items: [
                {
                  key: 'assign',
                  label: 'Assign Rider',
                  icon: <CarOutlined />,
                  disabled: !!record.rider || !['confirmed', 'created', 'pending'].includes(record.status),
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
                  disabled: ['delivered', 'cancelled', 'refunded'].includes(record.status),
                  onClick: () => {
                    let cancelReason = '';
                    const isPaid = ['confirmed', 'preparing', 'assigned', 'rider_assigned', 'picked_up', 'in_transit'].includes(record.status);
                    Modal.confirm({
                      title: 'Cancel Order',
                      content: (
                        <div>
                          <p>Are you sure you want to cancel order {record.orderNumber}?</p>
                          {isPaid && (
                            <p style={{ color: '#1890ff', marginTop: 8 }}>
                              💰 This order has been paid. A refund of {formatCurrency(record.totalAmount)} will be credited to the buyer&apos;s wallet.
                            </p>
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
                          orderId: record.id,
                          status: 'cancelled',
                          reason: cancelReason || undefined,
                        });
                      },
                    });
                  },
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

  const orders = ordersData?.items || mockOrders;
  const total = ordersData?.total || mockOrders.length;

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
            Orders
          </Title>
          <Text type="secondary">Manage and track all marketplace orders</Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
            Refresh
          </Button>
          <Button icon={<ExportOutlined />}>Export</Button>
        </Space>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="Search orders..."
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 250 }}
            allowClear
          />
          <Select
            placeholder="All Statuses"
            value={status}
            onChange={setStatus}
            style={{ width: 150 }}
            allowClear
            options={[
              { value: 'pending', label: 'Pending' },
              { value: 'created', label: 'Created' },
              { value: 'confirmed', label: 'Confirmed' },
              { value: 'preparing', label: 'Preparing' },
              { value: 'assigned', label: 'Rider Assigned' },
              { value: 'picked_up', label: 'Picked Up' },
              { value: 'in_transit', label: 'In Transit' },
              { value: 'delivered', label: 'Delivered' },
              { value: 'cancelled', label: 'Cancelled' },
              { value: 'refunded', label: 'Refunded' },
            ]}
          />
          <RangePicker
            value={dateRange}
            onChange={(dates) =>
              setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)
            }
          />
          <Button icon={<FilterOutlined />}>More Filters</Button>
        </Space>
      </Card>

      {/* Orders Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={orders}
          rowKey="id"
          loading={isLoading}
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
        />
      </Card>

      {/* Order Details Drawer */}
      <Drawer
        title={`Order Details - ${selectedOrder?.orderNumber}`}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        size="large"
      >
        {selectedOrder && (
          <>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Status">
                <Tag color={statusColors[selectedOrder.status]}>
                  {selectedOrder.status.replace(/_/g, ' ').toUpperCase()}
                </Tag>
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
              <Descriptions.Item label="Total Amount">
                {formatCurrency(selectedOrder.totalAmount)}
              </Descriptions.Item>
              <Descriptions.Item label="Delivery Fee">
                {formatCurrency(selectedOrder.deliveryFee)}
              </Descriptions.Item>
              {selectedOrder.serviceFee !== undefined && selectedOrder.serviceFee > 0 && (
                <Descriptions.Item label="Service Fee">
                  {formatCurrency(selectedOrder.serviceFee)}
                </Descriptions.Item>
              )}
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
              {selectedOrder.status === 'cancelled' && selectedOrder.cancellationReason && (
                <Descriptions.Item label="Cancellation Reason">
                  <Text type="danger">{selectedOrder.cancellationReason}</Text>
                </Descriptions.Item>
              )}
              {selectedOrder.isGift && (
                <Descriptions.Item label="Gift Order">
                  <Tag color="pink">🎁 Gift</Tag>
                </Descriptions.Item>
              )}
            </Descriptions>

            {/* Gift Details Section */}
            {selectedOrder.isGift && selectedOrder.giftDetails && (
              <>
                <Divider>Gift Details</Divider>
                <Descriptions column={1} bordered size="small">
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
              </>
            )}

            <Divider>Customer</Divider>
            <Space orientation="vertical" style={{ width: '100%' }}>
              <Space>
                <UserOutlined />
                <Text>{selectedOrder.buyer.firstName} {selectedOrder.buyer.lastName}</Text>
              </Space>
              <Space>
                <PhoneOutlined />
                <Text>{selectedOrder.buyer.phone}</Text>
              </Space>
              <Space>
                <EnvironmentOutlined />
                <Text>
                  {selectedOrder.deliveryAddress.street}, {selectedOrder.deliveryAddress.city},{' '}
                  {selectedOrder.deliveryAddress.state}
                </Text>
              </Space>
            </Space>

            <Divider>Order Items</Divider>
            <Table
              size="small"
              dataSource={selectedOrder.items}
              rowKey="productId"
              pagination={false}
              columns={[
                { title: 'Product', dataIndex: 'productName' },
                { title: 'Qty', dataIndex: 'quantity' },
                { title: 'Unit', dataIndex: 'unit' },
                {
                  title: 'Price',
                  dataIndex: 'price',
                  render: (v: number) => formatCurrency(v),
                },
              ]}
            />

            {/* Notes Section */}
            {(selectedOrder.customerNotes || selectedOrder.riderNote || selectedOrder.farmerMessage) && (
              <>
                <Divider>Notes & Messages</Divider>
                <Descriptions column={1} bordered size="small">
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
              </>
            )}

            {selectedOrder.rider && (
              <>
                <Divider>Assigned Rider</Divider>
                <Space>
                  <Avatar icon={<CarOutlined />} style={{ backgroundColor: '#06b6d4' }} />
                  <div>
                    <Text strong>
                      {selectedOrder.rider.firstName} {selectedOrder.rider.lastName}
                    </Text>
                    <br />
                    <Text type="secondary">{selectedOrder.rider.phone}</Text>
                  </div>
                </Space>
              </>
            )}

            <Divider>Status Timeline</Divider>
            <Timeline
              items={(selectedOrder.statusHistory || []).map((item) => ({
                color:
                  item.status === selectedOrder.status
                    ? 'blue'
                    : item.status === 'cancelled'
                    ? 'red'
                    : 'green',
                children: (
                  <>
                    <Text strong>{item.status.replace(/_/g, ' ').toUpperCase()}</Text>
                    <br />
                    <Text type="secondary">
                      <ClockCircleOutlined /> {dayjs(item.timestamp).format('MMM DD, HH:mm')}
                    </Text>
                  </>
                ),
              }))}
            />
          </>
        )}
      </Drawer>

      {/* Assign Rider Modal */}
      <Modal
        title="Assign Rider"
        open={assignRiderModal}
        onOk={handleAssignRider}
        onCancel={() => {
          setAssignRiderModal(false);
          setSelectedRider(undefined);
        }}
        confirmLoading={assignRiderMutation.isPending}
        okButtonProps={{ disabled: !selectedRider }}
      >
        <Space orientation="vertical" style={{ width: '100%' }}>
          <Text>Select a rider to assign to order {selectedOrder?.orderNumber}</Text>
          <Select
            placeholder="Select a rider"
            value={selectedRider}
            onChange={setSelectedRider}
            style={{ width: '100%' }}
            showSearch
            optionFilterProp="children"
            options={
              (ridersData || []).map((rider: { id: string; name?: string; firstName?: string; lastName?: string; phone: string }) => ({
                value: rider.id,
                label: `${rider.name || `${rider.firstName || ''} ${rider.lastName || ''}`.trim()} - ${rider.phone}`,
              }))
            }
          />
        </Space>
      </Modal>
    </div>
  );
}
