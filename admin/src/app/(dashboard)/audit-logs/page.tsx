'use client';

import { useState } from 'react';
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
} from '@ant-design/icons';
import { adminApi } from '@/lib/api';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// Action display mapping
const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  user_create: { label: 'User Created', color: 'green' },
  user_update: { label: 'User Updated', color: 'blue' },
  user_delete: { label: 'User Deleted', color: 'red' },
  user_suspend: { label: 'User Suspended', color: 'orange' },
  user_unsuspend: { label: 'User Unsuspended', color: 'cyan' },
  farmer_verify: { label: 'Farmer Verified', color: 'green' },
  farmer_reject: { label: 'Farmer Rejected', color: 'red' },
  rider_approve: { label: 'Rider Approved', color: 'green' },
  rider_reject: { label: 'Rider Rejected', color: 'red' },
  rider_update: { label: 'Rider Updated', color: 'blue' },
  product_create: { label: 'Product Created', color: 'green' },
  product_update: { label: 'Product Updated', color: 'blue' },
  product_delete: { label: 'Product Deleted', color: 'red' },
  product_approve: { label: 'Product Approved', color: 'green' },
  product_reject: { label: 'Product Rejected', color: 'red' },
  order_update: { label: 'Order Updated', color: 'blue' },
  order_cancel: { label: 'Order Cancelled', color: 'red' },
  order_assign_rider: { label: 'Rider Assigned', color: 'purple' },
  admin_login: { label: 'Admin Login', color: 'cyan' },
  admin_logout: { label: 'Admin Logout', color: 'default' },
  settings_update: { label: 'Settings Updated', color: 'gold' },
  dispatch_create: { label: 'Dispatch Created', color: 'green' },
  dispatch_update: { label: 'Dispatch Updated', color: 'blue' },
  support_ticket_update: { label: 'Ticket Updated', color: 'blue' },
  support_ticket_close: { label: 'Ticket Closed', color: 'green' },
};

// Category display mapping
const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  user: { label: 'User', icon: <UserOutlined />, color: 'blue' },
  farmer: { label: 'Farmer', icon: <TeamOutlined />, color: 'green' },
  rider: { label: 'Rider', icon: <CarOutlined />, color: 'purple' },
  product: { label: 'Product', icon: <ShoppingOutlined />, color: 'orange' },
  order: { label: 'Order', icon: <ShoppingOutlined />, color: 'cyan' },
  system: { label: 'System', icon: <SettingOutlined />, color: 'default' },
  dispatch: { label: 'Dispatch', icon: <CarOutlined />, color: 'magenta' },
  support: { label: 'Support', icon: <CustomerServiceOutlined />, color: 'gold' },
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

  // Fetch audit logs
  const { data: logsData, isLoading, refetch } = useQuery({
    queryKey: ['auditLogs', filters],
    queryFn: async () => {
      const response = await adminApi.getAuditLogs(filters);
      // Handle different API response formats
      const result = response.data;
      
      // Default empty response
      const emptyResponse = {
        data: [] as AuditLog[],
        total: 0,
        page: filters.page,
        limit: filters.limit,
        totalPages: 1,
      };
      
      if (!result) return emptyResponse;
      
      // Check if result has data property that is an array
      if (result.data && Array.isArray(result.data)) {
        return {
          data: result.data,
          total: result.total || result.data.length,
          page: result.page || filters.page,
          limit: result.limit || filters.limit,
          totalPages: result.totalPages || 1,
        };
      }
      
      // If result itself is an array
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
      // Handle potential nested data or direct response
      const result = response.data;
      return result?.data || result || { totalLogs: 0, byCategory: {}, byAction: {}, recentActivity: [] };
    },
  });

  // Fetch admins for filter
  const { data: adminsData } = useQuery({
    queryKey: ['adminsDropdown'],
    queryFn: async () => {
      const response = await adminApi.getAdminsForDropdown();
      // Handle potential nested data or direct response
      const result = response.data;
      return Array.isArray(result) ? result : (result?.data || []);
    },
  });

  const handleViewDetails = (record: AuditLog) => {
    setSelectedLog(record);
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
          <Text>{dayjs(date).fromNow()}</Text>
        </Tooltip>
      ),
    },
    {
      title: 'Admin',
      dataIndex: 'admin',
      key: 'admin',
      width: 150,
      render: (admin: AuditLog['admin']) => (
        <Space>
          <UserOutlined />
          <Text>{admin?.name || 'System'}</Text>
        </Space>
      ),
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      width: 150,
      render: (action: string) => {
        const config = ACTION_LABELS[action] || { label: action, color: 'default' };
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category: string) => {
        const config = CATEGORY_CONFIG[category] || { label: category, icon: <SettingOutlined />, color: 'default' };
        return (
          <Tag icon={config.icon} color={config.color}>
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
        <Text type="secondary">{description || '-'}</Text>
      ),
    },
    {
      title: 'Target',
      key: 'target',
      width: 150,
      render: (_: unknown, record: AuditLog) => (
        record.targetId ? (
          <Text code style={{ fontSize: 12 }}>
            {record.targetType}: {record.targetId.substring(0, 8)}...
          </Text>
        ) : (
          <Text type="secondary">-</Text>
        )
      ),
    },
    {
      title: 'IP Address',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 130,
      render: (ip: string) => (
        <Text type="secondary">{ip || '-'}</Text>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      fixed: 'right' as const,
      render: (_: unknown, record: AuditLog) => (
        <Button
          type="text"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetails(record)}
        />
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

  return (
    <div style={{ padding: 24 }}>
      <Space orientation="vertical" size="large" style={{ width: '100%' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={2} style={{ margin: 0 }}>
              <SafetyOutlined style={{ marginRight: 12 }} />
              Audit Logs
            </Title>
            <Text type="secondary">Track all administrative actions and changes</Text>
          </div>
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
            Refresh
          </Button>
        </div>

        {/* Statistics */}
        {statsData && (
          <Row gutter={16}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Total Logs"
                  value={statsData.totalLogs}
                  prefix={<SafetyOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="User Actions"
                  value={statsData.byCategory?.user || 0}
                  prefix={<UserOutlined />}
                  styles={{ content: { color: '#1890ff' } }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Product Actions"
                  value={statsData.byCategory?.product || 0}
                  prefix={<ShoppingOutlined />}
                  styles={{ content: { color: '#fa8c16' } }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Order Actions"
                  value={statsData.byCategory?.order || 0}
                  prefix={<ShoppingOutlined />}
                  styles={{ content: { color: '#52c41a' } }}
                />
              </Card>
            </Col>
          </Row>
        )}

        {/* Filters */}
        <Card>
          <Space wrap size="middle">
            <Input.Search
              placeholder="Search description..."
              allowClear
              style={{ width: 250 }}
              prefix={<SearchOutlined />}
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
                label: config.label,
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
        <Card>
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
      </Space>

      {/* Details Drawer */}
      <Drawer
        title="Audit Log Details"
        placement="right"
        size="large"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
      >
        {selectedLog && (
          <Space orientation="vertical" size="large" style={{ width: '100%' }}>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="ID">
                <Text code>{selectedLog.id}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Timestamp">
                {dayjs(selectedLog.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="Admin">
                <Space>
                  <UserOutlined />
                  {selectedLog.admin?.name || 'System'}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Action">
                <Tag color={ACTION_LABELS[selectedLog.action]?.color || 'default'}>
                  {ACTION_LABELS[selectedLog.action]?.label || selectedLog.action}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Category">
                <Tag
                  icon={CATEGORY_CONFIG[selectedLog.category]?.icon}
                  color={CATEGORY_CONFIG[selectedLog.category]?.color}
                >
                  {CATEGORY_CONFIG[selectedLog.category]?.label || selectedLog.category}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Description">
                {selectedLog.description || '-'}
              </Descriptions.Item>
              {selectedLog.targetId && (
                <Descriptions.Item label="Target ID">
                  <Text code>{selectedLog.targetId}</Text>
                </Descriptions.Item>
              )}
              {selectedLog.targetType && (
                <Descriptions.Item label="Target Type">
                  {selectedLog.targetType}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="IP Address">
                {selectedLog.ipAddress || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="User Agent">
                <Text style={{ fontSize: 12, wordBreak: 'break-all' }}>
                  {selectedLog.userAgent || '-'}
                </Text>
              </Descriptions.Item>
            </Descriptions>

            {selectedLog.oldValues && Object.keys(selectedLog.oldValues).length > 0 && (
              <Card title="Previous Values" size="small">
                <pre style={{ 
                  background: '#f5f5f5', 
                  padding: 12, 
                  borderRadius: 4,
                  fontSize: 12,
                  overflow: 'auto',
                  maxHeight: 200,
                }}>
                  {JSON.stringify(selectedLog.oldValues, null, 2)}
                </pre>
              </Card>
            )}

            {selectedLog.newValues && Object.keys(selectedLog.newValues).length > 0 && (
              <Card title="New Values" size="small">
                <pre style={{ 
                  background: '#f5f5f5', 
                  padding: 12, 
                  borderRadius: 4,
                  fontSize: 12,
                  overflow: 'auto',
                  maxHeight: 200,
                }}>
                  {JSON.stringify(selectedLog.newValues, null, 2)}
                </pre>
              </Card>
            )}

            {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
              <Card title="Additional Metadata" size="small">
                <pre style={{ 
                  background: '#f5f5f5', 
                  padding: 12, 
                  borderRadius: 4,
                  fontSize: 12,
                  overflow: 'auto',
                  maxHeight: 200,
                }}>
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </Card>
            )}
          </Space>
        )}
      </Drawer>
    </div>
  );
}
