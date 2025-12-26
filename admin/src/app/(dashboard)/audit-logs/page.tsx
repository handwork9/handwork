'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Table,
  Card,
  Space,
  Tag,
  Typography,
  Input,
  Select,
  DatePicker,
  Button,
  Drawer,
  Descriptions,
  Tooltip,
  Statistic,
  Row,
  Col,
  Empty,
  Divider,
  Badge,
  Avatar,
  Tabs,
  Timeline,
  Progress,
} from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  ReloadOutlined,
  EyeOutlined,
  UserOutlined,
  ShoppingOutlined,
  CarOutlined,
  SettingOutlined,
  TeamOutlined,
  SafetyOutlined,
  CustomerServiceOutlined,
  FieldTimeOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  GlobalOutlined,
  DesktopOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SyncOutlined,
  AuditOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import { adminApi } from '@/lib/api';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// Action display mapping
const ACTION_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  user_create: { label: 'User Created', color: 'green', icon: <PlusOutlined /> },
  user_update: { label: 'User Updated', color: 'blue', icon: <EditOutlined /> },
  user_delete: { label: 'User Deleted', color: 'red', icon: <DeleteOutlined /> },
  user_suspend: { label: 'User Suspended', color: 'orange', icon: <WarningOutlined /> },
  user_unsuspend: { label: 'User Unsuspended', color: 'cyan', icon: <CheckCircleOutlined /> },
  farmer_verify: { label: 'Farmer Verified', color: 'green', icon: <CheckCircleOutlined /> },
  farmer_reject: { label: 'Farmer Rejected', color: 'red', icon: <ClockCircleOutlined /> },
  rider_approve: { label: 'Rider Approved', color: 'green', icon: <CheckCircleOutlined /> },
  rider_reject: { label: 'Rider Rejected', color: 'red', icon: <ClockCircleOutlined /> },
  rider_update: { label: 'Rider Updated', color: 'blue', icon: <EditOutlined /> },
  product_create: { label: 'Product Created', color: 'green', icon: <PlusOutlined /> },
  product_update: { label: 'Product Updated', color: 'blue', icon: <EditOutlined /> },
  product_delete: { label: 'Product Deleted', color: 'red', icon: <DeleteOutlined /> },
  product_approve: { label: 'Product Approved', color: 'green', icon: <CheckCircleOutlined /> },
  product_reject: { label: 'Product Rejected', color: 'red', icon: <ClockCircleOutlined /> },
  order_update: { label: 'Order Updated', color: 'blue', icon: <EditOutlined /> },
  order_cancel: { label: 'Order Cancelled', color: 'red', icon: <ClockCircleOutlined /> },
  order_assign_rider: { label: 'Rider Assigned', color: 'purple', icon: <CarOutlined /> },
  admin_login: { label: 'Admin Login', color: 'cyan', icon: <UserOutlined /> },
  admin_logout: { label: 'Admin Logout', color: 'default', icon: <UserOutlined /> },
  settings_update: { label: 'Settings Updated', color: 'gold', icon: <SettingOutlined /> },
  dispatch_create: { label: 'Dispatch Created', color: 'green', icon: <PlusOutlined /> },
  dispatch_update: { label: 'Dispatch Updated', color: 'blue', icon: <EditOutlined /> },
  support_ticket_update: { label: 'Ticket Updated', color: 'blue', icon: <EditOutlined /> },
  support_ticket_close: { label: 'Ticket Closed', color: 'green', icon: <CheckCircleOutlined /> },
};

// Category display mapping
const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; gradient: string }> = {
  user: { label: 'User', icon: <UserOutlined />, color: 'blue', gradient: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)' },
  farmer: { label: 'Farmer', icon: <TeamOutlined />, color: 'green', gradient: 'linear-gradient(135deg, #52c41a 0%, #237804 100%)' },
  rider: { label: 'Rider', icon: <CarOutlined />, color: 'purple', gradient: 'linear-gradient(135deg, #722ed1 0%, #531dab 100%)' },
  product: { label: 'Product', icon: <ShoppingOutlined />, color: 'orange', gradient: 'linear-gradient(135deg, #fa8c16 0%, #d46b08 100%)' },
  order: { label: 'Order', icon: <ShoppingOutlined />, color: 'cyan', gradient: 'linear-gradient(135deg, #13c2c2 0%, #006d75 100%)' },
  system: { label: 'System', icon: <SettingOutlined />, color: 'default', gradient: 'linear-gradient(135deg, #8c8c8c 0%, #595959 100%)' },
  dispatch: { label: 'Dispatch', icon: <CarOutlined />, color: 'magenta', gradient: 'linear-gradient(135deg, #eb2f96 0%, #c41d7f 100%)' },
  support: { label: 'Support', icon: <CustomerServiceOutlined />, color: 'gold', gradient: 'linear-gradient(135deg, #faad14 0%, #d48806 100%)' },
};

interface AuditLog {
  id: string;
  action: string;
  category: string;
  targetId?: string;
  targetType?: string;
  description?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  adminId?: string;
  admin?: {
    id: string;
    name: string;
    email?: string;
  };
  createdAt: string;
}

interface AuditLogFilters {
  page: number;
  limit: number;
  search?: string;
  action?: string;
  category?: string;
  adminId?: string;
  startDate?: string;
  endDate?: string;
}

export default function AuditLogsPage() {
  const [filters, setFilters] = useState<AuditLogFilters>({
    page: 1,
    limit: 20,
  });
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState('details');

  // Fetch audit logs
  const { data: logsData, isLoading, refetch } = useQuery({
    queryKey: ['auditLogs', filters],
    queryFn: async () => {
      const response = await adminApi.getAuditLogs(filters);
      const result = response.data?.data || response.data;
      
      const emptyResponse = {
        data: [] as AuditLog[],
        total: 0,
        page: filters.page,
        limit: filters.limit,
        totalPages: 1,
      };
      
      if (!result) return emptyResponse;
      
      if (result.data && Array.isArray(result.data)) {
        return {
          data: result.data,
          total: result.total || result.data.length,
          page: result.page || filters.page,
          limit: result.limit || filters.limit,
          totalPages: result.totalPages || 1,
        };
      }
      
      if (Array.isArray(result)) {
        return {
          data: result,
          total: result.length,
          page: filters.page,
          limit: filters.limit,
          totalPages: 1,
        };
      }
      
      return emptyResponse;
    },
  });

  // Fetch stats
  const { data: statsData } = useQuery({
    queryKey: ['auditLogStats', filters.startDate, filters.endDate],
    queryFn: async () => {
      const response = await adminApi.getAuditLogStats({
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
      const result = response.data;
      return result?.data || result || { totalLogs: 0, byCategory: {}, byAction: {}, recentActivity: [] };
    },
  });

  // Fetch admins for filter
  const { data: adminsData } = useQuery({
    queryKey: ['adminsDropdown'],
    queryFn: async () => {
      const response = await adminApi.getAdminsForDropdown();
      const result = response.data;
      return Array.isArray(result) ? result : (result?.data || []);
    },
  });

  const handleViewDetails = (record: AuditLog) => {
    setSelectedLog(record);
    setDrawerTab('details');
    setDrawerOpen(true);
  };

  const columns = [
    {
      title: 'Timestamp',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => (
        <Tooltip title={dayjs(date).format('YYYY-MM-DD HH:mm:ss')}>
          <Space orientation="vertical" size={0}>
            <Text>{dayjs(date).format('MMM DD, YYYY')}</Text>
            <Text type="secondary" style={{ fontSize: 11 }}>
              <ClockCircleOutlined style={{ marginRight: 4 }} />
              {dayjs(date).format('HH:mm:ss')}
            </Text>
          </Space>
        </Tooltip>
      ),
    },
    {
      title: 'Admin',
      dataIndex: 'admin',
      key: 'admin',
      width: 180,
      render: (admin: AuditLog['admin']) => (
        <Space>
          <Avatar 
            size="small" 
            icon={<UserOutlined />}
            style={{ backgroundColor: admin ? '#1890ff' : '#8c8c8c' }}
          />
          <div>
            <Text strong style={{ display: 'block', fontSize: 13 }}>{admin?.name || 'System'}</Text>
            {admin?.email && (
              <Text type="secondary" style={{ fontSize: 11 }}>{admin.email}</Text>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      width: 180,
      render: (action: string) => {
        const config = ACTION_LABELS[action] || { label: action, color: 'default', icon: <InfoCircleOutlined /> };
        return (
          <Tag color={config.color} icon={config.icon} style={{ padding: '4px 8px' }}>
            {config.label}
          </Tag>
        );
      },
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 130,
      render: (category: string) => {
        const config = CATEGORY_CONFIG[category] || { label: category, icon: <SettingOutlined />, color: 'default' };
        return (
          <Tag icon={config.icon} color={config.color} style={{ padding: '4px 8px' }}>
            {config.label}
          </Tag>
        );
      },
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (description: string) => (
        <Tooltip title={description}>
          <Text type="secondary" style={{ fontSize: 13 }}>{description || '-'}</Text>
        </Tooltip>
      ),
    },
    {
      title: 'Target',
      key: 'target',
      width: 160,
      render: (_: unknown, record: AuditLog) => (
        record.targetId ? (
          <Space orientation="vertical" size={0}>
            <Text type="secondary" style={{ fontSize: 11, textTransform: 'capitalize' }}>
              {record.targetType}
            </Text>
            <Text code style={{ fontSize: 11 }}>
              {record.targetId.substring(0, 8)}...
            </Text>
          </Space>
        ) : (
          <Text type="secondary">-</Text>
        )
      ),
    },
    {
      title: 'IP',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 130,
      render: (ip: string) => (
        ip ? (
          <Tooltip title={ip}>
            <Space>
              <GlobalOutlined style={{ color: '#8c8c8c' }} />
              <Text type="secondary" style={{ fontSize: 12 }}>{ip}</Text>
            </Space>
          </Tooltip>
        ) : (
          <Text type="secondary">-</Text>
        )
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      fixed: 'right' as const,
      render: (_: unknown, record: AuditLog) => (
        <Tooltip title="View Details">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          />
        </Tooltip>
      ),
    },
  ];

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value, page: 1 }));
  };

  const handleDateChange = (dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null) => {
    setFilters((prev) => ({
      ...prev,
      startDate: dates?.[0]?.format('YYYY-MM-DD'),
      endDate: dates?.[1]?.format('YYYY-MM-DD'),
      page: 1,
    }));
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
    });
  };

  // Calculate category percentages for progress bars
  const totalCategoryLogs = Object.values(statsData?.byCategory || {}).reduce((a: number, b: unknown) => a + (b as number), 0) as number;

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ 
              width: 48, 
              height: 48, 
              borderRadius: 12, 
              background: 'linear-gradient(135deg, #722ed1 0%, #531dab 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <AuditOutlined style={{ fontSize: 24, color: '#fff' }} />
            </div>
            Audit Logs
          </Title>
          <Text type="secondary" style={{ marginTop: 8, display: 'block' }}>
            Track all administrative actions and system changes
          </Text>
        </div>
        <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
          Refresh
        </Button>
      </div>

      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card variant="borderless" style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <Text type="secondary">Total Logs</Text>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#722ed1', marginTop: 4 }}>
                  {statsData?.totalLogs?.toLocaleString() || 0}
                </div>
              </div>
              <div style={{ 
                width: 48, 
                height: 48, 
                borderRadius: 12, 
                background: 'linear-gradient(135deg, #722ed1 0%, #531dab 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <SafetyOutlined style={{ fontSize: 22, color: '#fff' }} />
              </div>
            </div>
            <Divider style={{ margin: '12px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>All Time</Text>
              <Tag color="purple">Comprehensive</Tag>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card variant="borderless" style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <Text type="secondary">User Actions</Text>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#1890ff', marginTop: 4 }}>
                  {statsData?.byCategory?.user || 0}
                </div>
              </div>
              <div style={{ 
                width: 48, 
                height: 48, 
                borderRadius: 12, 
                background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <UserOutlined style={{ fontSize: 22, color: '#fff' }} />
              </div>
            </div>
            <Divider style={{ margin: '12px 0' }} />
            <Progress 
              percent={totalCategoryLogs ? ((statsData?.byCategory?.user || 0) / totalCategoryLogs) * 100 : 0} 
              size="small" 
              showInfo={false}
              strokeColor="#1890ff"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card variant="borderless" style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <Text type="secondary">Product Actions</Text>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#fa8c16', marginTop: 4 }}>
                  {statsData?.byCategory?.product || 0}
                </div>
              </div>
              <div style={{ 
                width: 48, 
                height: 48, 
                borderRadius: 12, 
                background: 'linear-gradient(135deg, #fa8c16 0%, #d46b08 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <ShoppingOutlined style={{ fontSize: 22, color: '#fff' }} />
              </div>
            </div>
            <Divider style={{ margin: '12px 0' }} />
            <Progress 
              percent={totalCategoryLogs ? ((statsData?.byCategory?.product || 0) / totalCategoryLogs) * 100 : 0} 
              size="small" 
              showInfo={false}
              strokeColor="#fa8c16"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card variant="borderless" style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <Text type="secondary">Order Actions</Text>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#52c41a', marginTop: 4 }}>
                  {statsData?.byCategory?.order || 0}
                </div>
              </div>
              <div style={{ 
                width: 48, 
                height: 48, 
                borderRadius: 12, 
                background: 'linear-gradient(135deg, #52c41a 0%, #237804 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <ShoppingOutlined style={{ fontSize: 22, color: '#fff' }} />
              </div>
            </div>
            <Divider style={{ margin: '12px 0' }} />
            <Progress 
              percent={totalCategoryLogs ? ((statsData?.byCategory?.order || 0) / totalCategoryLogs) * 100 : 0} 
              size="small" 
              showInfo={false}
              strokeColor="#52c41a"
            />
          </Card>
        </Col>
      </Row>

      {/* Category Breakdown */}
      <Card 
        variant="borderless"
        style={{ marginBottom: 24, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
        title={
          <Space>
            <HistoryOutlined style={{ color: '#722ed1' }} />
            <span>Activity by Category</span>
          </Space>
        }
      >
        <Row gutter={[16, 16]}>
          {Object.entries(CATEGORY_CONFIG).slice(0, 6).map(([key, config]) => {
            const count = statsData?.byCategory?.[key] || 0;
            const percent = totalCategoryLogs ? (count / totalCategoryLogs) * 100 : 0;
            return (
              <Col xs={12} sm={8} md={4} key={key}>
                <Card 
                  size="small" 
                  style={{ 
                    textAlign: 'center', 
                    borderRadius: 8,
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                  }}
                  hoverable
                  onClick={() => setFilters(prev => ({ ...prev, category: key, page: 1 }))}
                >
                  <div style={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: 10, 
                    background: config.gradient,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 8px',
                    fontSize: 18,
                    color: '#fff',
                  }}>
                    {config.icon}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{count}</div>
                  <Text type="secondary" style={{ fontSize: 11 }}>{config.label}</Text>
                  <Progress 
                    percent={percent} 
                    size="small" 
                    showInfo={false}
                    strokeColor={config.gradient}
                    style={{ marginTop: 8 }}
                  />
                </Card>
              </Col>
            );
          })}
        </Row>
      </Card>

      {/* Filters */}
      <Card 
        size="small" 
        style={{ marginBottom: 16, background: '#fafafa', borderRadius: 8 }}
      >
        <Space wrap size="middle">
          <Input.Search
            placeholder="Search description..."
            allowClear
            style={{ width: 250 }}
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            onSearch={handleSearch}
          />
          
          <Select
            placeholder="Category"
            allowClear
            style={{ width: 150 }}
            value={filters.category}
            onChange={(value) => setFilters((prev) => ({ ...prev, category: value, page: 1 }))}
            options={Object.entries(CATEGORY_CONFIG).map(([key, config]) => ({
              value: key,
              label: (
                <Space>
                  {config.icon}
                  {config.label}
                </Space>
              ),
            }))}
          />

          <Select
            placeholder="Action"
            allowClear
            style={{ width: 180 }}
            value={filters.action}
            onChange={(value) => setFilters((prev) => ({ ...prev, action: value, page: 1 }))}
            options={Object.entries(ACTION_LABELS).map(([key, config]) => ({
              value: key,
              label: config.label,
            }))}
          />

          <Select
            placeholder="Admin"
            allowClear
            style={{ width: 180 }}
            value={filters.adminId}
            onChange={(value) => setFilters((prev) => ({ ...prev, adminId: value, page: 1 }))}
            options={Array.isArray(adminsData) ? adminsData.map((admin: { id: string; name: string }) => ({
              value: admin.id,
              label: admin.name,
            })) : []}
          />

          <RangePicker
            onChange={handleDateChange}
            value={
              filters.startDate && filters.endDate
                ? [dayjs(filters.startDate), dayjs(filters.endDate)]
                : null
            }
          />

          <Button icon={<FilterOutlined />} onClick={clearFilters}>
            Clear Filters
          </Button>
        </Space>
      </Card>

      {/* Table */}
      <Card variant="borderless" style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <Table
          columns={columns}
          dataSource={Array.isArray(logsData?.data) ? logsData.data : []}
          rowKey="id"
          loading={isLoading}
          scroll={{ x: 1200 }}
          pagination={{
            current: filters.page,
            pageSize: filters.limit,
            total: logsData?.total || 0,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} logs`,
            onChange: (page, pageSize) => {
              setFilters((prev) => ({ ...prev, page, limit: pageSize }));
            },
          }}
          locale={{
            emptyText: (
              <Empty
                description="No audit logs found"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ),
          }}
        />
      </Card>

      {/* Details Drawer */}
      <Drawer
        title={
          <Space>
            <div style={{ 
              width: 40, 
              height: 40, 
              borderRadius: 10, 
              background: CATEGORY_CONFIG[selectedLog?.category || 'system']?.gradient || 'linear-gradient(135deg, #8c8c8c 0%, #595959 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <AuditOutlined style={{ fontSize: 20, color: '#fff' }} />
            </div>
            <div>
              <div>Audit Log Details</div>
              <Text type="secondary" style={{ fontSize: 12, fontWeight: 'normal' }}>
                {selectedLog?.id?.substring(0, 8)}...
              </Text>
            </div>
          </Space>
        }
        placement="right"
        size="large"
        onClose={() => {
          setDrawerOpen(false);
          setSelectedLog(null);
        }}
        open={drawerOpen}
      >
        {selectedLog && (
          <Tabs 
            activeKey={drawerTab} 
            onChange={setDrawerTab}
            items={[
              {
                key: 'details',
                label: <span><EyeOutlined /> Details</span>,
                children: (
                  <>
                    {/* Action Summary Card */}
                    <Card 
                      size="small" 
                      style={{ marginBottom: 16, borderRadius: 8, background: '#fafafa' }}
                    >
                      <Space align="start">
                        <Avatar 
                          size={48} 
                          icon={CATEGORY_CONFIG[selectedLog.category]?.icon || <SettingOutlined />}
                          style={{ 
                            background: CATEGORY_CONFIG[selectedLog.category]?.gradient || 'linear-gradient(135deg, #8c8c8c 0%, #595959 100%)'
                          }}
                        />
                        <div>
                          <Tag 
                            color={ACTION_LABELS[selectedLog.action]?.color || 'default'}
                            icon={ACTION_LABELS[selectedLog.action]?.icon}
                            style={{ marginBottom: 4, padding: '4px 8px' }}
                          >
                            {ACTION_LABELS[selectedLog.action]?.label || selectedLog.action}
                          </Tag>
                          <br />
                          <Text type="secondary">{selectedLog.description || 'No description'}</Text>
                        </div>
                      </Space>
                    </Card>

                    <Descriptions bordered column={1} size="small">
                      <Descriptions.Item label="Log ID">
                        <Text copyable code>{selectedLog.id}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Timestamp">
                        <ClockCircleOutlined style={{ marginRight: 8 }} />
                        {dayjs(selectedLog.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                      </Descriptions.Item>
                      <Descriptions.Item label="Admin">
                        <Space>
                          <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
                          {selectedLog.admin?.name || 'System'}
                        </Space>
                      </Descriptions.Item>
                      <Descriptions.Item label="Category">
                        <Tag
                          icon={CATEGORY_CONFIG[selectedLog.category]?.icon}
                          color={CATEGORY_CONFIG[selectedLog.category]?.color}
                        >
                          {CATEGORY_CONFIG[selectedLog.category]?.label || selectedLog.category}
                        </Tag>
                      </Descriptions.Item>
                      {selectedLog.targetId && (
                        <Descriptions.Item label="Target ID">
                          <Text copyable code>{selectedLog.targetId}</Text>
                        </Descriptions.Item>
                      )}
                      {selectedLog.targetType && (
                        <Descriptions.Item label="Target Type">
                          <Tag style={{ textTransform: 'capitalize' }}>{selectedLog.targetType}</Tag>
                        </Descriptions.Item>
                      )}
                      <Descriptions.Item label="IP Address">
                        <Space>
                          <GlobalOutlined />
                          {selectedLog.ipAddress || '-'}
                        </Space>
                      </Descriptions.Item>
                      <Descriptions.Item label="User Agent">
                        <Tooltip title={selectedLog.userAgent}>
                          <Space>
                            <DesktopOutlined />
                            <Text style={{ fontSize: 12 }} ellipsis>
                              {selectedLog.userAgent?.substring(0, 50) || '-'}
                              {selectedLog.userAgent && selectedLog.userAgent.length > 50 && '...'}
                            </Text>
                          </Space>
                        </Tooltip>
                      </Descriptions.Item>
                    </Descriptions>
                  </>
                ),
              },
              {
                key: 'changes',
                label: <span><SyncOutlined /> Changes</span>,
                children: (
                  <Space orientation="vertical" size="large" style={{ width: '100%' }}>
                    {selectedLog.oldValues && Object.keys(selectedLog.oldValues).length > 0 && (
                      <Card 
                        title={
                          <Space>
                            <div style={{ width: 8, height: 8, borderRadius: 4, background: '#ff4d4f' }} />
                            Previous Values
                          </Space>
                        }
                        size="small"
                        style={{ borderRadius: 8 }}
                      >
                        <pre style={{ 
                          background: '#fff1f0', 
                          padding: 12, 
                          borderRadius: 8,
                          fontSize: 12,
                          overflow: 'auto',
                          maxHeight: 200,
                          border: '1px solid #ffccc7',
                        }}>
                          {JSON.stringify(selectedLog.oldValues, null, 2)}
                        </pre>
                      </Card>
                    )}

                    {selectedLog.newValues && Object.keys(selectedLog.newValues).length > 0 && (
                      <Card 
                        title={
                          <Space>
                            <div style={{ width: 8, height: 8, borderRadius: 4, background: '#52c41a' }} />
                            New Values
                          </Space>
                        }
                        size="small"
                        style={{ borderRadius: 8 }}
                      >
                        <pre style={{ 
                          background: '#f6ffed', 
                          padding: 12, 
                          borderRadius: 8,
                          fontSize: 12,
                          overflow: 'auto',
                          maxHeight: 200,
                          border: '1px solid #b7eb8f',
                        }}>
                          {JSON.stringify(selectedLog.newValues, null, 2)}
                        </pre>
                      </Card>
                    )}

                    {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                      <Card 
                        title={
                          <Space>
                            <div style={{ width: 8, height: 8, borderRadius: 4, background: '#1890ff' }} />
                            Additional Metadata
                          </Space>
                        }
                        size="small"
                        style={{ borderRadius: 8 }}
                      >
                        <pre style={{ 
                          background: '#e6f7ff', 
                          padding: 12, 
                          borderRadius: 8,
                          fontSize: 12,
                          overflow: 'auto',
                          maxHeight: 200,
                          border: '1px solid #91d5ff',
                        }}>
                          {JSON.stringify(selectedLog.metadata, null, 2)}
                        </pre>
                      </Card>
                    )}

                    {!selectedLog.oldValues && !selectedLog.newValues && !selectedLog.metadata && (
                      <Empty description="No change data available" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                    )}
                  </Space>
                ),
              },
              {
                key: 'timeline',
                label: <span><FieldTimeOutlined /> Timeline</span>,
                children: (
                  <Timeline
                    items={[
                      {
                        color: 'blue',
                        dot: <UserOutlined />,
                        content: (
                          <div>
                            <Text strong>Admin Action</Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {selectedLog.admin?.name || 'System'} performed this action
                            </Text>
                          </div>
                        ),
                      },
                      {
                        color: ACTION_LABELS[selectedLog.action]?.color || 'default',
                        dot: ACTION_LABELS[selectedLog.action]?.icon || <InfoCircleOutlined />,
                        content: (
                          <div>
                            <Text strong>{ACTION_LABELS[selectedLog.action]?.label || selectedLog.action}</Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {selectedLog.description || 'Action performed'}
                            </Text>
                          </div>
                        ),
                      },
                      {
                        color: 'green',
                        dot: <CheckCircleOutlined />,
                        content: (
                          <div>
                            <Text strong>Logged Successfully</Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {dayjs(selectedLog.createdAt).format('MMMM DD, YYYY HH:mm:ss')}
                            </Text>
                          </div>
                        ),
                      },
                    ]}
                  />
                ),
              },
            ]}
          />
        )}
      </Drawer>
    </div>
  );
}
