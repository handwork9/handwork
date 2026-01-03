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
  Modal,
  Form,
  Input,
  InputNumber,
  TimePicker,
  Switch,
  message,
  Tooltip,
  Popconfirm,
  Select,
} from 'antd';
import {
  ClockCircleOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined,
  ThunderboltOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useAuthStore } from '@/store/authStore';

const { Title, Text } = Typography;

interface DeliverySlot {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  maxOrders: number;
  currentOrders: number;
  isActive: boolean;
  isExpress: boolean;
  extraFee: number;
  daysAvailable: string[];
  createdAt: string;
}

interface ScheduledDelivery {
  id: string;
  orderId: string;
  orderNumber: string;
  slotId: string;
  slotName: string;
  scheduledDate: string;
  status: string;
  buyerName: string;
  createdAt: string;
}

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
];

export default function DeliverySchedulingPage() {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<DeliverySlot | null>(null);
  const [form] = Form.useForm();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  // Fetch delivery slots
  const { data: slotsData, isLoading: slotsLoading } = useQuery({
    queryKey: ['delivery-slots'],
    queryFn: async () => {
      const res = await fetch(`${apiUrl}/delivery-scheduling/slots`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch slots');
      return res.json();
    },
  });

  // Fetch scheduled deliveries
  const { data: scheduledData, isLoading: scheduledLoading } = useQuery({
    queryKey: ['scheduled-deliveries'],
    queryFn: async () => {
      const res = await fetch(`${apiUrl}/delivery-scheduling/scheduled`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch scheduled deliveries');
      return res.json();
    },
  });

  // Create/Update slot mutation
  const slotMutation = useMutation({
    mutationFn: async (values: any) => {
      const url = editingSlot
        ? `${apiUrl}/delivery-scheduling/slots/${editingSlot.id}`
        : `${apiUrl}/delivery-scheduling/slots`;
      const method = editingSlot ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          startTime: values.timeRange[0].format('HH:mm'),
          endTime: values.timeRange[1].format('HH:mm'),
        }),
      });
      if (!res.ok) throw new Error('Failed to save slot');
      return res.json();
    },
    onSuccess: () => {
      message.success(editingSlot ? 'Slot updated successfully' : 'Slot created successfully');
      queryClient.invalidateQueries({ queryKey: ['delivery-slots'] });
      setIsSlotModalOpen(false);
      setEditingSlot(null);
      form.resetFields();
    },
    onError: () => {
      message.error('Failed to save slot');
    },
  });

  // Delete slot mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${apiUrl}/delivery-scheduling/slots/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete slot');
    },
    onSuccess: () => {
      message.success('Slot deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['delivery-slots'] });
    },
  });

  // Toggle slot active status
  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await fetch(`${apiUrl}/delivery-scheduling/slots/${id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) throw new Error('Failed to update slot');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-slots'] });
    },
  });

  const slots: DeliverySlot[] = slotsData || [];
  const scheduledDeliveries: ScheduledDelivery[] = scheduledData || [];

  const handleEditSlot = (slot: DeliverySlot) => {
    setEditingSlot(slot);
    form.setFieldsValue({
      name: slot.name,
      timeRange: [dayjs(slot.startTime, 'HH:mm'), dayjs(slot.endTime, 'HH:mm')],
      maxOrders: slot.maxOrders,
      isExpress: slot.isExpress,
      extraFee: slot.extraFee,
      daysAvailable: slot.daysAvailable,
    });
    setIsSlotModalOpen(true);
  };

  const handleCreateSlot = () => {
    setEditingSlot(null);
    form.resetFields();
    form.setFieldsValue({
      maxOrders: 50,
      isExpress: false,
      extraFee: 0,
      daysAvailable: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    });
    setIsSlotModalOpen(true);
  };

  const slotColumns = [
    {
      title: 'Slot Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: DeliverySlot) => (
        <Space>
          {record.isExpress ? (
            <ThunderboltOutlined style={{ color: '#f59e0b' }} />
          ) : (
            <ClockCircleOutlined style={{ color: '#6366f1' }} />
          )}
          <Text strong>{name}</Text>
          {record.isExpress && <Tag color="orange">Express</Tag>}
        </Space>
      ),
    },
    {
      title: 'Time Window',
      key: 'time',
      render: (_: any, record: DeliverySlot) => (
        <Text>{record.startTime} - {record.endTime}</Text>
      ),
    },
    {
      title: 'Capacity',
      key: 'capacity',
      render: (_: any, record: DeliverySlot) => (
        <Space>
          <Text>{record.currentOrders || 0} / {record.maxOrders}</Text>
          {(record.currentOrders || 0) >= record.maxOrders && (
            <Tag color="red">Full</Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Extra Fee',
      dataIndex: 'extraFee',
      key: 'extraFee',
      render: (fee: number) => fee > 0 ? `₦${fee.toLocaleString()}` : '-',
    },
    {
      title: 'Days Available',
      dataIndex: 'daysAvailable',
      key: 'daysAvailable',
      render: (days: string[]) => (
        <Space wrap>
          {days?.slice(0, 3).map(day => (
            <Tag key={day}>{day.slice(0, 3).toUpperCase()}</Tag>
          ))}
          {days?.length > 3 && <Tag>+{days.length - 3}</Tag>}
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean, record: DeliverySlot) => (
        <Switch
          checked={isActive}
          onChange={(checked) => toggleMutation.mutate({ id: record.id, isActive: checked })}
          checkedChildren="Active"
          unCheckedChildren="Inactive"
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: DeliverySlot) => (
        <Space>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEditSlot(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Delete this slot?"
            onConfirm={() => deleteMutation.mutate(record.id)}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const scheduledColumns = [
    {
      title: 'Order',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render: (orderNumber: string) => (
        <Text strong style={{ color: '#4f46e5' }}>{orderNumber}</Text>
      ),
    },
    {
      title: 'Customer',
      dataIndex: 'buyerName',
      key: 'buyerName',
    },
    {
      title: 'Slot',
      dataIndex: 'slotName',
      key: 'slotName',
      render: (name: string) => <Tag color="purple">{name}</Tag>,
    },
    {
      title: 'Scheduled Date',
      dataIndex: 'scheduledDate',
      key: 'scheduledDate',
      render: (date: string) => dayjs(date).format('MMM D, YYYY'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors: Record<string, string> = {
          pending: 'blue',
          confirmed: 'cyan',
          out_for_delivery: 'orange',
          delivered: 'green',
          cancelled: 'red',
        };
        return <Tag color={colors[status] || 'default'}>{status.replace(/_/g, ' ').toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('MMM D, HH:mm'),
    },
  ];

  const activeSlots = slots.filter(s => s.isActive).length;
  const todayDeliveries = scheduledDeliveries.filter(
    d => dayjs(d.scheduledDate).isSame(dayjs(), 'day')
  ).length;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>
            <CalendarOutlined style={{ marginRight: 12 }} />
            Delivery Scheduling
          </Title>
          <Text type="secondary">Manage delivery time slots and scheduled deliveries</Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreateSlot}
        >
          Add Slot
        </Button>
      </div>

      {/* Stats */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Slots"
              value={slots.length}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Active Slots"
              value={activeSlots}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Today's Scheduled"
              value={todayDeliveries}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Scheduled"
              value={scheduledDeliveries.length}
            />
          </Card>
        </Col>
      </Row>

      {/* Delivery Slots Table */}
      <Card
        title="Delivery Time Slots"
        style={{ marginBottom: 24 }}
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={() => queryClient.invalidateQueries({ queryKey: ['delivery-slots'] })}
          >
            Refresh
          </Button>
        }
      >
        <Table
          columns={slotColumns}
          dataSource={slots}
          rowKey="id"
          loading={slotsLoading}
          pagination={false}
        />
      </Card>

      {/* Scheduled Deliveries Table */}
      <Card title="Scheduled Deliveries">
        <Table
          columns={scheduledColumns}
          dataSource={scheduledDeliveries}
          rowKey="id"
          loading={scheduledLoading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Slot Modal */}
      <Modal
        title={editingSlot ? 'Edit Delivery Slot' : 'Create Delivery Slot'}
        open={isSlotModalOpen}
        onCancel={() => {
          setIsSlotModalOpen(false);
          setEditingSlot(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={slotMutation.isPending}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => slotMutation.mutate(values)}
        >
          <Form.Item
            name="name"
            label="Slot Name"
            rules={[{ required: true, message: 'Please enter slot name' }]}
          >
            <Input placeholder="e.g., Morning Delivery" />
          </Form.Item>

          <Form.Item
            name="timeRange"
            label="Time Window"
            rules={[{ required: true, message: 'Please select time range' }]}
          >
            <TimePicker.RangePicker format="HH:mm" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="maxOrders"
            label="Max Orders Per Day"
            rules={[{ required: true, message: 'Please enter max orders' }]}
          >
            <InputNumber min={1} max={1000} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="daysAvailable"
            label="Available Days"
            rules={[{ required: true, message: 'Please select days' }]}
          >
            <Select
              mode="multiple"
              placeholder="Select days"
              options={DAYS_OF_WEEK}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="isExpress"
                label="Express Delivery"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="extraFee"
                label="Extra Fee (₦)"
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
