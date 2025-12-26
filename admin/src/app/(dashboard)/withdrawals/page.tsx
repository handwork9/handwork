'use client';

import React, { useState } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Input,
  Select,
  DatePicker,
  Drawer,
  App,
  Statistic,
  Row,
  Col,
  Typography,
  Descriptions,
  Tooltip,
  Badge,
  Popconfirm,
  Tabs,
  Timeline,
  Avatar,
  Divider,
  Progress,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  UndoOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  BankOutlined,
  UserOutlined,
  WalletOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  ShopOutlined,
  CarOutlined,
  SafetyCertificateOutlined,
  FieldTimeOutlined,
  ThunderboltOutlined,
  SyncOutlined,
  InfoCircleOutlined,
  CopyOutlined,
  PhoneOutlined,
  MailOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;

interface Withdrawal {
  id: string;
  reference: string;
  amount: number;
  fee: number;
  netAmount: number;
  status: string;
  ownerType: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
  } | null;
  bankAccount: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  transferCode?: string;
  createdAt: string;
  updatedAt?: string;
  processedAt?: string;
  failureReason?: string;
}

interface WithdrawalStats {
  total: { amount: number; count: number };
  today: { amount: number; count: number };
  thisWeek: { amount: number; count: number };
  byOwnerType: Array<{ ownerType: string; amount: number; count: number }>;
  byStatus: Array<{ status: string; amount: number; count: number }>;
}

export default function WithdrawalsPage() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string | undefined>();
  const [ownerType, setOwnerType] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [refundReason, setRefundReason] = useState('');

  // Fetch withdrawals
  const { data: withdrawalsData, isLoading, refetch } = useQuery({
    queryKey: ['admin-withdrawals', page, pageSize, search, status, ownerType, dateRange?.map(d => d.format('YYYY-MM-DD'))],
    queryFn: async () => {
      const params: Record<string, unknown> = { page, limit: pageSize };
      if (search) params.search = search;
      if (status) params.status = status;
      if (ownerType) params.ownerType = ownerType;
      if (dateRange) {
        params.startDate = dateRange[0].format('YYYY-MM-DD');
        params.endDate = dateRange[1].format('YYYY-MM-DD');
      }
      const response = await adminApi.getWithdrawals(params as Parameters<typeof adminApi.getWithdrawals>[0]);
      return response.data?.data || response.data;
    },
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['admin-withdrawal-stats'],
    queryFn: async () => {
      const response = await adminApi.getWithdrawalStats();
      return (response.data?.data || response.data) as WithdrawalStats;
    },
  });

  // Retry mutation
  const retryMutation = useMutation({
    mutationFn: (id: string) => adminApi.retryWithdrawal(id),
    onSuccess: () => {
      message.success('Withdrawal retry initiated');
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] });
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      message.error(error.response?.data?.message || 'Failed to retry withdrawal');
    },
  });

  // Refund mutation
  const refundMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => adminApi.refundWithdrawal(id, reason),
    onSuccess: () => {
      message.success('Withdrawal refunded successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawal-stats'] });
      setDrawerOpen(false);
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      message.error(error.response?.data?.message || 'Failed to refund withdrawal');
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: string; reason?: string }) =>
      adminApi.updateWithdrawalStatus(id, { status, reason }),
    onSuccess: () => {
      message.success('Status updated');
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawal-stats'] });
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      message.error(error.response?.data?.message || 'Failed to update status');
    },
  });

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed': return { color: 'green', icon: <CheckCircleOutlined />, bg: '#f6ffed' };
      case 'processing': return { color: 'blue', icon: <SyncOutlined spin />, bg: '#e6f7ff' };
      case 'pending': return { color: 'orange', icon: <ClockCircleOutlined />, bg: '#fff7e6' };
      case 'failed': return { color: 'red', icon: <CloseCircleOutlined />, bg: '#fff2f0' };
      case 'refunded': return { color: 'purple', icon: <UndoOutlined />, bg: '#f9f0ff' };
      default: return { color: 'default', icon: <InfoCircleOutlined />, bg: '#fafafa' };
    }
  };

  const getOwnerTypeConfig = (type: string) => {
    switch (type) {
      case 'buyer': return { color: 'cyan', icon: <UserOutlined />, label: 'Buyer' };
      case 'farmer': return { color: 'green', icon: <ShopOutlined />, label: 'Farmer' };
      case 'rider': return { color: 'orange', icon: <CarOutlined />, label: 'Rider' };
      default: return { color: 'default', icon: <UserOutlined />, label: type };
    }
  };

  const formatCurrency = (value: number) => `₦${value.toLocaleString()}`;

  // Get stats by status
  const getStatusCount = (statusName: string) => {
    return stats?.byStatus?.find(s => s.status === statusName)?.count || 0;
  };

  const totalCount = stats?.total?.count || 0;
  const completedCount = getStatusCount('completed');
  const pendingCount = getStatusCount('pending');
  const processingCount = getStatusCount('processing');
  const failedCount = getStatusCount('failed');
  const successRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const columns: ColumnsType<Withdrawal> = [
    {
      title: 'Reference',
      dataIndex: 'reference',
      key: 'reference',
      width: 180,
      render: (ref: string) => (
        <Space>
          <BankOutlined style={{ color: '#1890ff' }} />
          <Text copyable={{ text: ref, icon: <CopyOutlined style={{ fontSize: 12 }} /> }} style={{ fontFamily: 'monospace', fontSize: 12 }}>
            {ref.length > 16 ? `${ref.substring(0, 16)}...` : ref}
          </Text>
        </Space>
      ),
    },
    {
      title: 'User',
      key: 'user',
      width: 200,
      render: (_: unknown, record: Withdrawal) => {
        const typeConfig = getOwnerTypeConfig(record.ownerType);
        return (
          <Space>
            <Avatar 
              icon={typeConfig.icon} 
              style={{ backgroundColor: record.ownerType === 'farmer' ? '#52c41a' : record.ownerType === 'rider' ? '#fa8c16' : '#13c2c2' }}
              size="small"
            />
            <div>
              <Text strong style={{ display: 'block' }}>{record.user?.name || 'N/A'}</Text>
              <Text type="secondary" style={{ fontSize: 11 }}>
                <PhoneOutlined style={{ marginRight: 4 }} />
                {record.user?.phone || 'N/A'}
              </Text>
            </div>
          </Space>
        );
      },
    },
    {
      title: 'Type',
      dataIndex: 'ownerType',
      key: 'ownerType',
      width: 100,
      render: (type: string) => {
        const config = getOwnerTypeConfig(type);
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.label}
          </Tag>
        );
      },
    },
    {
      title: 'Amount',
      key: 'amount',
      width: 150,
      render: (_: unknown, record: Withdrawal) => (
        <div>
          <Text strong style={{ color: '#52c41a', fontSize: 14 }}>
            <DollarOutlined style={{ marginRight: 4 }} />
            ₦{record.amount.toLocaleString()}
          </Text>
          {record.fee > 0 && (
            <div>
              <Text type="secondary" style={{ fontSize: 11 }}>
                Fee: ₦{record.fee.toLocaleString()}
              </Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Bank Details',
      key: 'bank',
      width: 180,
      render: (_: unknown, record: Withdrawal) => (
        <div>
          <Text style={{ fontSize: 13 }}>
            <BankOutlined style={{ marginRight: 4, color: '#722ed1' }} />
            {record.bankAccount?.bankName}
          </Text>
          <div>
            <Text type="secondary" style={{ fontSize: 12, fontFamily: 'monospace' }}>
              {record.bankAccount?.accountNumber}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        const config = getStatusConfig(status);
        return (
          <Tag 
            color={config.color} 
            icon={config.icon}
            style={{ textTransform: 'capitalize' }}
          >
            {status}
          </Tag>
        );
      },
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
      render: (date: string) => (
        <Tooltip title={dayjs(date).format('DD MMM YYYY, HH:mm:ss')}>
          <Space orientation="vertical" size={0}>
            <Text style={{ fontSize: 13 }}>{dayjs(date).format('DD MMM YYYY')}</Text>
            <Text type="secondary" style={{ fontSize: 11 }}>
              <FieldTimeOutlined style={{ marginRight: 4 }} />
              {dayjs(date).fromNow()}
            </Text>
          </Space>
        </Tooltip>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_: unknown, record: Withdrawal) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button
              type="primary"
              ghost
              size="small"
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedWithdrawal(record);
                setActiveTab('details');
                setDrawerOpen(true);
              }}
            />
          </Tooltip>
          {record.status === 'failed' && (
            <>
              <Tooltip title="Retry Transfer">
                <Popconfirm
                  title="Retry Withdrawal"
                  description="Retry this withdrawal transfer?"
                  onConfirm={() => retryMutation.mutate(record.id)}
                  okText="Retry"
                  okButtonProps={{ icon: <ThunderboltOutlined /> }}
                >
                  <Button
                    size="small"
                    icon={<ReloadOutlined />}
                    loading={retryMutation.isPending}
                  />
                </Popconfirm>
              </Tooltip>
              <Tooltip title="Refund to Wallet">
                <Popconfirm
                  title="Refund Withdrawal"
                  description="Refund this amount back to user's wallet?"
                  onConfirm={() => refundMutation.mutate({ id: record.id, reason: 'Transfer failed' })}
                  okText="Refund"
                  okButtonProps={{ style: { backgroundColor: '#722ed1' } }}
                >
                  <Button
                    size="small"
                    icon={<UndoOutlined />}
                    style={{ color: '#722ed1', borderColor: '#722ed1' }}
                    loading={refundMutation.isPending}
                  />
                </Popconfirm>
              </Tooltip>
            </>
          )}
        </Space>
      ),
    },
  ];

  const handleOpenDrawer = (withdrawal: Withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setActiveTab('details');
    setRefundReason('');
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedWithdrawal(null);
    setRefundReason('');
  };

  // Build timeline for withdrawal
  const buildTimeline = (withdrawal: Withdrawal) => {
    const items = [
      {
        color: 'blue',
        dot: <ClockCircleOutlined />,
        content: (
          <div>
            <Text strong>Withdrawal Requested</Text>
            <div><Text type="secondary">{dayjs(withdrawal.createdAt).format('DD MMM YYYY, HH:mm:ss')}</Text></div>
          </div>
        ),
      },
    ];

    if (withdrawal.status === 'processing' || withdrawal.status === 'completed') {
      items.push({
        color: 'blue',
        dot: <SyncOutlined />,
        content: (
          <div>
            <Text strong>Processing Started</Text>
            <div><Text type="secondary">Transfer initiated to bank</Text></div>
          </div>
        ),
      });
    }

    if (withdrawal.status === 'completed') {
      items.push({
        color: 'green',
        dot: <CheckCircleOutlined />,
        content: (
          <div>
            <Text strong>Completed Successfully</Text>
            <div><Text type="secondary">{withdrawal.processedAt ? dayjs(withdrawal.processedAt).format('DD MMM YYYY, HH:mm:ss') : 'Transfer completed'}</Text></div>
          </div>
        ),
      });
    }

    if (withdrawal.status === 'failed') {
      items.push({
        color: 'red',
        dot: <CloseCircleOutlined />,
        content: (
          <div>
            <Text strong>Transfer Failed</Text>
            <div><Text type="secondary">{withdrawal.failureReason || 'An error occurred during transfer'}</Text></div>
          </div>
        ),
      });
    }

    if (withdrawal.status === 'refunded') {
      items.push({
        color: 'purple',
        dot: <UndoOutlined />,
        content: (
          <div>
            <Text strong>Refunded to Wallet</Text>
            <div><Text type="secondary">Amount returned to user wallet</Text></div>
          </div>
        ),
      });
    }

    return items;
  };

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>
            <WalletOutlined style={{ marginRight: 12, color: '#1890ff' }} />
            Withdrawal Management
          </Title>
          <Text type="secondary">Manage and track all withdrawal requests</Text>
        </div>
        <Button 
          icon={<ReloadOutlined />} 
          onClick={() => refetch()}
          loading={isLoading}
        >
          Refresh
        </Button>
      </div>

      {/* Enhanced Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title={
                <Space>
                  <DollarOutlined style={{ color: '#1890ff' }} />
                  <span>Total Withdrawals</span>
                </Space>
              }
              value={stats?.total?.amount || 0}
              prefix="₦"
              styles={{ content: { color: '#1890ff' } }}
              formatter={(value) => Number(value).toLocaleString()}
            />
            <Divider style={{ margin: '12px 0' }} />
            <Text type="secondary">
              <Badge status="processing" />
              {stats?.total?.count || 0} transactions
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title={
                <Space>
                  <ThunderboltOutlined style={{ color: '#52c41a' }} />
                  <span>Today&apos;s Withdrawals</span>
                </Space>
              }
              value={stats?.today?.amount || 0}
              prefix="₦"
              styles={{ content: { color: '#52c41a' } }}
              formatter={(value) => Number(value).toLocaleString()}
            />
            <Divider style={{ margin: '12px 0' }} />
            <Text type="secondary">
              <Badge status="success" />
              {stats?.today?.count || 0} transactions today
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title={
                <Space>
                  <FieldTimeOutlined style={{ color: '#722ed1' }} />
                  <span>This Week</span>
                </Space>
              }
              value={stats?.thisWeek?.amount || 0}
              prefix="₦"
              styles={{ content: { color: '#722ed1' } }}
              formatter={(value) => Number(value).toLocaleString()}
            />
            <Divider style={{ margin: '12px 0' }} />
            <Text type="secondary">
              <Badge status="default" color="#722ed1" />
              {stats?.thisWeek?.count || 0} transactions
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <div style={{ marginBottom: 8 }}>
              <Text type="secondary">
                <SafetyCertificateOutlined style={{ marginRight: 4, color: '#52c41a' }} />
                Success Rate
              </Text>
            </div>
            <Progress 
              percent={successRate} 
              status={successRate >= 80 ? 'success' : successRate >= 50 ? 'normal' : 'exception'}
              strokeColor={successRate >= 80 ? '#52c41a' : successRate >= 50 ? '#1890ff' : '#ff4d4f'}
            />
            <Divider style={{ margin: '12px 0' }} />
            <Space separator={<Divider orientation="vertical" />} wrap>
              <Tooltip title="Completed">
                <Badge status="success" text={<Text style={{ fontSize: 12 }}>{completedCount}</Text>} />
              </Tooltip>
              <Tooltip title="Pending">
                <Badge status="warning" text={<Text style={{ fontSize: 12 }}>{pendingCount}</Text>} />
              </Tooltip>
              <Tooltip title="Processing">
                <Badge status="processing" text={<Text style={{ fontSize: 12 }}>{processingCount}</Text>} />
              </Tooltip>
              <Tooltip title="Failed">
                <Badge status="error" text={<Text style={{ fontSize: 12 }}>{failedCount}</Text>} />
              </Tooltip>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* User Type Breakdown */}
      {stats?.byOwnerType && stats.byOwnerType.length > 0 && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {stats.byOwnerType.map((item) => {
            const config = getOwnerTypeConfig(item.ownerType);
            return (
              <Col xs={24} sm={8} key={item.ownerType}>
                <Card size="small">
                  <Space>
                    <Avatar 
                      icon={config.icon} 
                      style={{ 
                        backgroundColor: item.ownerType === 'farmer' ? '#52c41a' : 
                                        item.ownerType === 'rider' ? '#fa8c16' : '#13c2c2' 
                      }}
                    />
                    <div>
                      <Text type="secondary">{config.label} Withdrawals</Text>
                      <div>
                        <Text strong style={{ fontSize: 16 }}>{formatCurrency(item.amount)}</Text>
                        <Text type="secondary" style={{ marginLeft: 8 }}>({item.count})</Text>
                      </div>
                    </div>
                  </Space>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap size="middle">
          <Input
            placeholder="Search reference, account..."
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 280 }}
            allowClear
          />
          <Select
            placeholder="Status"
            value={status}
            onChange={setStatus}
            style={{ width: 150 }}
            allowClear
            options={[
              { value: 'pending', label: <Space><ClockCircleOutlined style={{ color: '#fa8c16' }} />Pending</Space> },
              { value: 'processing', label: <Space><SyncOutlined style={{ color: '#1890ff' }} />Processing</Space> },
              { value: 'completed', label: <Space><CheckCircleOutlined style={{ color: '#52c41a' }} />Completed</Space> },
              { value: 'failed', label: <Space><CloseCircleOutlined style={{ color: '#ff4d4f' }} />Failed</Space> },
              { value: 'refunded', label: <Space><UndoOutlined style={{ color: '#722ed1' }} />Refunded</Space> },
            ]}
          />
          <Select
            placeholder="User Type"
            value={ownerType}
            onChange={setOwnerType}
            style={{ width: 140 }}
            allowClear
            options={[
              { value: 'buyer', label: <Space><UserOutlined style={{ color: '#13c2c2' }} />Buyer</Space> },
              { value: 'farmer', label: <Space><ShopOutlined style={{ color: '#52c41a' }} />Farmer</Space> },
              { value: 'rider', label: <Space><CarOutlined style={{ color: '#fa8c16' }} />Rider</Space> },
            ]}
          />
          <RangePicker
            value={dateRange}
            onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
            style={{ width: 260 }}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              setSearch('');
              setStatus(undefined);
              setOwnerType(undefined);
              setDateRange(null);
              setPage(1);
            }}
          >
            Reset Filters
          </Button>
        </Space>
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={withdrawalsData?.withdrawals || []}
          rowKey="id"
          loading={isLoading}
          scroll={{ x: 1200 }}
          onRow={(record) => ({
            onClick: () => handleOpenDrawer(record),
            style: { cursor: 'pointer' },
          })}
          pagination={{
            current: page,
            pageSize,
            total: withdrawalsData?.total || 0,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} withdrawals`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
        />
      </Card>

      {/* Details Drawer */}
      <Drawer
        title={
          <Space>
            <Avatar 
              icon={<BankOutlined />} 
              style={{ backgroundColor: '#1890ff' }}
            />
            <div>
              <Text strong>Withdrawal Details</Text>
              {selectedWithdrawal && (
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {selectedWithdrawal.reference}
                  </Text>
                </div>
              )}
            </div>
          </Space>
        }
        placement="right"
        size="large"
        onClose={handleCloseDrawer}
        open={drawerOpen}
        extra={
          selectedWithdrawal && (
            <Tag 
              color={getStatusConfig(selectedWithdrawal.status).color}
              icon={getStatusConfig(selectedWithdrawal.status).icon}
              style={{ textTransform: 'capitalize' }}
            >
              {selectedWithdrawal.status}
            </Tag>
          )
        }
      >
        {selectedWithdrawal && (
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: 'details',
                label: (
                  <span>
                    <InfoCircleOutlined />
                    Details
                  </span>
                ),
                children: (
                  <div>
                    {/* Amount Card */}
                    <Card 
                      size="small" 
                      style={{ 
                        marginBottom: 16, 
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        border: 'none'
                      }}
                    >
                      <Row align="middle" justify="space-between">
                        <Col>
                          <Text style={{ color: 'rgba(255,255,255,0.8)' }}>Withdrawal Amount</Text>
                          <Title level={2} style={{ color: '#fff', margin: 0 }}>
                            ₦{selectedWithdrawal.amount.toLocaleString()}
                          </Title>
                        </Col>
                        <Col>
                          <WalletOutlined style={{ fontSize: 48, color: 'rgba(255,255,255,0.3)' }} />
                        </Col>
                      </Row>
                      {selectedWithdrawal.fee > 0 && (
                        <div style={{ marginTop: 8 }}>
                          <Text style={{ color: 'rgba(255,255,255,0.7)' }}>
                            Fee: ₦{selectedWithdrawal.fee.toLocaleString()} | 
                            Net: ₦{(selectedWithdrawal.amount - selectedWithdrawal.fee).toLocaleString()}
                          </Text>
                        </div>
                      )}
                    </Card>

                    {/* Details */}
                    <Descriptions bordered column={1} size="small">
                      <Descriptions.Item label={<><BankOutlined /> Reference</>}>
                        <Text copyable style={{ fontFamily: 'monospace' }}>
                          {selectedWithdrawal.reference}
                        </Text>
                      </Descriptions.Item>
                      <Descriptions.Item label={<><UserOutlined /> User Type</>}>
                        <Tag 
                          color={getOwnerTypeConfig(selectedWithdrawal.ownerType).color}
                          icon={getOwnerTypeConfig(selectedWithdrawal.ownerType).icon}
                        >
                          {getOwnerTypeConfig(selectedWithdrawal.ownerType).label}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label={<><ClockCircleOutlined /> Requested At</>}>
                        {dayjs(selectedWithdrawal.createdAt).format('DD MMM YYYY, HH:mm:ss')}
                        <Text type="secondary" style={{ marginLeft: 8 }}>
                          ({dayjs(selectedWithdrawal.createdAt).fromNow()})
                        </Text>
                      </Descriptions.Item>
                      {selectedWithdrawal.transferCode && (
                        <Descriptions.Item label={<><SafetyCertificateOutlined /> Transfer Code</>}>
                          <Text copyable style={{ fontFamily: 'monospace' }}>
                            {selectedWithdrawal.transferCode}
                          </Text>
                        </Descriptions.Item>
                      )}
                    </Descriptions>

                    {/* Bank Details */}
                    <Card size="small" title={<><BankOutlined /> Bank Account Details</>} style={{ marginTop: 16 }}>
                      <Descriptions column={1} size="small">
                        <Descriptions.Item label="Bank Name">
                          {selectedWithdrawal.bankAccount?.bankName}
                        </Descriptions.Item>
                        <Descriptions.Item label="Account Number">
                          <Text copyable style={{ fontFamily: 'monospace' }}>
                            {selectedWithdrawal.bankAccount?.accountNumber}
                          </Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Account Name">
                          {selectedWithdrawal.bankAccount?.accountName}
                        </Descriptions.Item>
                      </Descriptions>
                    </Card>

                    {/* User Details */}
                    {selectedWithdrawal.user && (
                      <Card size="small" title={<><UserOutlined /> User Information</>} style={{ marginTop: 16 }}>
                        <Space orientation="vertical" style={{ width: '100%' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <Avatar 
                              size={48}
                              icon={getOwnerTypeConfig(selectedWithdrawal.ownerType).icon}
                              style={{ 
                                backgroundColor: selectedWithdrawal.ownerType === 'farmer' ? '#52c41a' : 
                                                selectedWithdrawal.ownerType === 'rider' ? '#fa8c16' : '#13c2c2' 
                              }}
                            />
                            <div>
                              <Text strong style={{ fontSize: 16 }}>{selectedWithdrawal.user.name}</Text>
                              <div>
                                <Space split={<Divider type="vertical" />}>
                                  <Text type="secondary">
                                    <PhoneOutlined /> {selectedWithdrawal.user.phone}
                                  </Text>
                                  {selectedWithdrawal.user.email && (
                                    <Text type="secondary">
                                      <MailOutlined /> {selectedWithdrawal.user.email}
                                    </Text>
                                  )}
                                </Space>
                              </div>
                            </div>
                          </div>
                        </Space>
                      </Card>
                    )}

                    {/* Failure Reason */}
                    {selectedWithdrawal.status === 'failed' && selectedWithdrawal.failureReason && (
                      <Card 
                        size="small" 
                        title={<><ExclamationCircleOutlined style={{ color: '#ff4d4f' }} /> Failure Reason</>} 
                        style={{ marginTop: 16, borderColor: '#ffccc7' }}
                      >
                        <Text type="danger">{selectedWithdrawal.failureReason}</Text>
                      </Card>
                    )}
                  </div>
                ),
              },
              {
                key: 'timeline',
                label: (
                  <span>
                    <FieldTimeOutlined />
                    Timeline
                  </span>
                ),
                children: (
                  <Timeline items={buildTimeline(selectedWithdrawal)} />
                ),
              },
              {
                key: 'actions',
                label: (
                  <span>
                    <ThunderboltOutlined />
                    Actions
                  </span>
                ),
                children: (
                  <Space orientation="vertical" style={{ width: '100%' }} size="large">
                    {selectedWithdrawal.status === 'failed' && (
                      <>
                        <Card size="small" title="Failed Withdrawal Actions">
                          <Paragraph type="secondary">
                            This withdrawal failed. You can either retry the transfer or refund the amount back to the user&apos;s wallet.
                          </Paragraph>
                          <Input.TextArea
                            placeholder="Reason for refund (optional)"
                            value={refundReason}
                            onChange={(e) => setRefundReason(e.target.value)}
                            rows={2}
                            style={{ marginBottom: 16 }}
                          />
                          <Space wrap>
                            <Button
                              type="primary"
                              icon={<ReloadOutlined />}
                              onClick={() => retryMutation.mutate(selectedWithdrawal.id)}
                              loading={retryMutation.isPending}
                            >
                              Retry Transfer
                            </Button>
                            <Button
                              icon={<UndoOutlined />}
                              style={{ borderColor: '#722ed1', color: '#722ed1' }}
                              onClick={() => refundMutation.mutate({ 
                                id: selectedWithdrawal.id, 
                                reason: refundReason || 'Transfer failed' 
                              })}
                              loading={refundMutation.isPending}
                            >
                              Refund to Wallet
                            </Button>
                            <Popconfirm
                              title="Mark as Completed"
                              description="Only do this if you have confirmed the transfer was successful."
                              onConfirm={() => updateStatusMutation.mutate({
                                id: selectedWithdrawal.id,
                                status: 'completed',
                                reason: 'Manually verified by admin',
                              })}
                            >
                              <Button 
                                icon={<CheckCircleOutlined />} 
                                style={{ borderColor: '#52c41a', color: '#52c41a' }}
                              >
                                Mark Completed
                              </Button>
                            </Popconfirm>
                          </Space>
                        </Card>
                      </>
                    )}

                    {selectedWithdrawal.status === 'processing' && (
                      <Card size="small" title="Processing Withdrawal Actions">
                        <Paragraph type="secondary">
                          This withdrawal is currently being processed. You can manually update the status if needed.
                        </Paragraph>
                        <Space wrap>
                          <Popconfirm
                            title="Mark as Completed"
                            description="Confirm this transfer has been completed successfully?"
                            onConfirm={() => updateStatusMutation.mutate({
                              id: selectedWithdrawal.id,
                              status: 'completed',
                            })}
                          >
                            <Button icon={<CheckCircleOutlined />} type="primary">
                              Mark Completed
                            </Button>
                          </Popconfirm>
                          <Popconfirm
                            title="Mark as Failed"
                            description="This will mark the transfer as failed."
                            onConfirm={() => updateStatusMutation.mutate({
                              id: selectedWithdrawal.id,
                              status: 'failed',
                              reason: 'Marked failed by admin',
                            })}
                          >
                            <Button icon={<CloseCircleOutlined />} danger>
                              Mark Failed
                            </Button>
                          </Popconfirm>
                        </Space>
                      </Card>
                    )}

                    {selectedWithdrawal.status === 'pending' && (
                      <Card size="small" title="Pending Withdrawal Actions">
                        <Paragraph type="secondary">
                          This withdrawal is pending. You can process it or cancel it.
                        </Paragraph>
                        <Space wrap>
                          <Popconfirm
                            title="Process Withdrawal"
                            description="Start processing this withdrawal?"
                            onConfirm={() => updateStatusMutation.mutate({
                              id: selectedWithdrawal.id,
                              status: 'processing',
                            })}
                          >
                            <Button icon={<SyncOutlined />} type="primary">
                              Start Processing
                            </Button>
                          </Popconfirm>
                          <Popconfirm
                            title="Cancel Withdrawal"
                            description="Cancel and refund this withdrawal?"
                            onConfirm={() => refundMutation.mutate({
                              id: selectedWithdrawal.id,
                              reason: 'Cancelled by admin',
                            })}
                          >
                            <Button icon={<CloseCircleOutlined />} danger>
                              Cancel & Refund
                            </Button>
                          </Popconfirm>
                        </Space>
                      </Card>
                    )}

                    {(selectedWithdrawal.status === 'completed' || selectedWithdrawal.status === 'refunded') && (
                      <Card size="small">
                        <div style={{ textAlign: 'center', padding: 24 }}>
                          {selectedWithdrawal.status === 'completed' ? (
                            <>
                              <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }} />
                              <Title level={4} style={{ color: '#52c41a' }}>Withdrawal Completed</Title>
                              <Text type="secondary">This withdrawal has been successfully completed.</Text>
                            </>
                          ) : (
                            <>
                              <UndoOutlined style={{ fontSize: 48, color: '#722ed1', marginBottom: 16 }} />
                              <Title level={4} style={{ color: '#722ed1' }}>Withdrawal Refunded</Title>
                              <Text type="secondary">This withdrawal has been refunded to the user&apos;s wallet.</Text>
                            </>
                          )}
                        </div>
                      </Card>
                    )}
                  </Space>
                ),
              },
            ]}
          />
        )}
      </Drawer>
    </div>
  );
}
