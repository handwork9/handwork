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
  Avatar,
  Typography,
  Badge,
  Dropdown,
  Drawer,
  Descriptions,
  App,
  Row,
  Col,
  Statistic,
  Divider,
  Tooltip,
  Progress,
  Tabs,
  Modal,
  Alert,
} from 'antd';
import {
  SearchOutlined,
  UserOutlined,
  MoreOutlined,
  CheckCircleOutlined,
  StopOutlined,
  EyeOutlined,
  PhoneOutlined,
  MailOutlined,
  WalletOutlined,
  CalendarOutlined,
  ReloadOutlined,
  ExportOutlined,
  FilterOutlined,
  TeamOutlined,
  ShopOutlined,
  CarOutlined,
  CrownOutlined,
  SafetyCertificateOutlined,
  ClockCircleOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  EnvironmentOutlined,
  StarOutlined,
  GiftOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface User {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone: string;
  role: string;
  avatar?: string;
  profileImage?: string;
  isActive: boolean;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  walletBalance: string;
  createdAt: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
  };
  city?: string;
  state?: string;
  totalOrders?: number;
  totalSpent?: number;
  referralCode?: string;
  referredBy?: string;
  isPremium?: boolean;
  premiumExpiry?: string;
}

const formatCurrency = (value: number | string | null | undefined) => {
  const num = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
  return `₦${num.toLocaleString()}`;
};

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerTab, setDrawerTab] = useState('details');
  const queryClient = useQueryClient();
  const { message, modal } = App.useApp();

  // Fetch dashboard stats
  const { data: dashboardData } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await adminApi.getDashboard();
      return response.data?.data || response.data;
    },
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['users', { search, role: roleFilter, status: statusFilter, page, pageSize }],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, limit: pageSize };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;
      const response = await adminApi.getUsers(params);
      return response.data?.data || response.data;
    },
  });

  const suspendMutation = useMutation({
    mutationFn: (userId: string) => adminApi.suspendUser(userId),
    onSuccess: () => {
      message.success('User suspended successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: () => {
      message.error('Failed to suspend user');
    },
  });

  const unsuspendMutation = useMutation({
    mutationFn: (userId: string) => adminApi.unsuspendUser(userId),
    onSuccess: () => {
      message.success('User activated successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: () => {
      message.error('Failed to activate user');
    },
  });

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'purple',
      buyer: 'blue',
      farmer: 'green',
      rider: 'cyan',
    };
    return colors[role] || 'default';
  };

  const getRoleIcon = (role: string) => {
    const icons: Record<string, React.ReactNode> = {
      admin: <CrownOutlined />,
      buyer: <ShoppingCartOutlined />,
      farmer: <ShopOutlined />,
      rider: <CarOutlined />,
    };
    return icons[role] || <UserOutlined />;
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setDrawerVisible(true);
    setDrawerTab('details');
  };

  const handleSuspendUser = (user: User) => {
    modal.confirm({
      title: user.isActive ? 'Suspend User' : 'Activate User',
      content: user.isActive
        ? `Are you sure you want to suspend ${user.name || user.phone}? They will not be able to access their account.`
        : `Are you sure you want to activate ${user.name || user.phone}?`,
      okText: user.isActive ? 'Suspend' : 'Activate',
      okType: user.isActive ? 'danger' : 'primary',
      onOk: () => {
        if (user.isActive) {
          suspendMutation.mutate(user.id);
        } else {
          unsuspendMutation.mutate(user.id);
        }
      },
    });
  };

  const columns: ColumnsType<User> = [
    {
      title: 'User',
      key: 'user',
      width: 280,
      render: (_, record) => (
        <Space>
          <Badge dot status={record.isActive ? 'success' : 'error'} offset={[-5, 35]}>
            <Avatar 
              size={45} 
              src={record.avatar || record.profileImage} 
              icon={<UserOutlined />}
              style={{ backgroundColor: getRoleColor(record.role) === 'blue' ? '#4f46e5' : undefined }}
            />
          </Badge>
          <div>
            <Text strong style={{ color: '#4f46e5', cursor: 'pointer' }} onClick={() => handleViewUser(record)}>
              {record.name || `${record.firstName || ''} ${record.lastName || ''}`.trim() || 'N/A'}
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              <MailOutlined style={{ marginRight: 4 }} />
              {record.email || 'No email'}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Phone',
      key: 'phone',
      width: 150,
      render: (_, record) => (
        <Space orientation="vertical" size={0}>
          <Text copyable={{ text: record.phone }}>{record.phone}</Text>
          {record.isPhoneVerified && (
            <Text type="secondary" style={{ fontSize: 11 }}>
              <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 4 }} />
              Verified
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      render: (role: string) => (
        <Tag icon={getRoleIcon(role)} color={getRoleColor(role)}>
          {role?.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 130,
      render: (_, record) => (
        <Space orientation="vertical" size={4}>
          <Tag 
            icon={record.isActive ? <CheckCircleOutlined /> : <StopOutlined />} 
            color={record.isActive ? 'success' : 'error'}
          >
            {record.isActive ? 'ACTIVE' : 'SUSPENDED'}
          </Tag>
          {record.isPremium && (
            <Tag icon={<CrownOutlined />} color="gold">
              PREMIUM
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Wallet',
      key: 'walletBalance',
      width: 130,
      render: (_, record) => (
        <Tooltip title="Wallet Balance">
          <Text strong style={{ color: '#52c41a' }}>
            <WalletOutlined style={{ marginRight: 4 }} />
            {formatCurrency(record.walletBalance)}
          </Text>
        </Tooltip>
      ),
      sorter: true,
    },
    {
      title: 'Joined',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => (
        <Tooltip title={dayjs(date).format('MMM DD, YYYY HH:mm')}>
          <Text>{dayjs(date).format('MMM DD, YYYY')}</Text>
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
              onClick={() => handleViewUser(record)}
            />
          </Tooltip>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'view',
                  label: 'View Details',
                  icon: <EyeOutlined />,
                  onClick: () => handleViewUser(record),
                },
                { type: 'divider' },
                {
                  key: 'toggle',
                  label: record.isActive ? 'Suspend User' : 'Activate User',
                  icon: record.isActive ? <StopOutlined /> : <CheckCircleOutlined />,
                  danger: record.isActive,
                  onClick: () => handleSuspendUser(record),
                },
              ],
            }}
            trigger={['click']}
          >
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      ),
    },
  ];

  const users = data?.users || data?.items || [];
  const total = data?.total || users.length;

  // Calculate stats
  const buyersCount = users.filter((u: User) => u.role === 'buyer').length;
  const farmersCount = users.filter((u: User) => u.role === 'farmer').length;
  const ridersCount = users.filter((u: User) => u.role === 'rider').length;
  const activeCount = users.filter((u: User) => u.isActive).length;
  const activeRate = users.length > 0 ? Math.round((activeCount / users.length) * 100) : 0;

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
            <TeamOutlined style={{ marginRight: 12, color: '#4f46e5' }} />
            Users Management
          </Title>
          <Text type="secondary">Manage all platform users - buyers, farmers, riders, and admins</Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
            Refresh
          </Button>
          <Button icon={<ExportOutlined />}>Export</Button>
        </Space>
      </div>

      {/* Stats Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="Total Users"
              value={dashboardData?.totalUsers || total}
              prefix={<TeamOutlined style={{ color: '#4f46e5' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="Active Users"
              value={activeCount}
              prefix={<CheckCircleOutlined style={{ color: '#10b981' }} />}
              styles={{ content: { color: '#10b981' } }}
            />
            <Progress percent={activeRate} size="small" strokeColor="#10b981" showInfo={false} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="Buyers"
              value={dashboardData?.totalBuyers || buyersCount}
              prefix={<ShoppingCartOutlined style={{ color: '#3b82f6' }} />}
              styles={{ content: { color: '#3b82f6' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Space separator={<span style={{ borderLeft: '1px solid #d9d9d9', height: '1em', margin: '0 8px' }} />}>
              <Statistic
                title="Farmers"
                value={dashboardData?.totalFarmers || farmersCount}
                prefix={<ShopOutlined style={{ color: '#52c41a' }} />}
                styles={{ content: { color: '#52c41a', fontSize: 20 } }}
              />
              <Statistic
                title="Riders"
                value={dashboardData?.totalRiders || ridersCount}
                prefix={<CarOutlined style={{ color: '#06b6d4' }} />}
                styles={{ content: { color: '#06b6d4', fontSize: 20 } }}
              />
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap size="middle">
          <Input
            placeholder="Search by name, email, or phone..."
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />
          <Select
            placeholder="Filter by Role"
            value={roleFilter}
            onChange={setRoleFilter}
            style={{ width: 160 }}
            allowClear
          >
            <Select.Option value="buyer">
              <Tag icon={<ShoppingCartOutlined />} color="blue">Buyer</Tag>
            </Select.Option>
            <Select.Option value="farmer">
              <Tag icon={<ShopOutlined />} color="green">Farmer</Tag>
            </Select.Option>
            <Select.Option value="rider">
              <Tag icon={<CarOutlined />} color="cyan">Rider</Tag>
            </Select.Option>
            <Select.Option value="admin">
              <Tag icon={<CrownOutlined />} color="purple">Admin</Tag>
            </Select.Option>
          </Select>
          <Select
            placeholder="Filter by Status"
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 160 }}
            allowClear
          >
            <Select.Option value="active">
              <Tag color="success">Active</Tag>
            </Select.Option>
            <Select.Option value="suspended">
              <Tag color="error">Suspended</Tag>
            </Select.Option>
          </Select>
          <Button
            icon={<FilterOutlined />}
            onClick={() => {
              setSearch('');
              setRoleFilter(undefined);
              setStatusFilter(undefined);
            }}
          >
            Clear Filters
          </Button>
        </Space>
      </Card>

      {/* Users Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={isLoading}
          scroll={{ x: 1100 }}
          pagination={{
            current: page,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} users`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
        />
      </Card>

      {/* User Details Drawer */}
      <Drawer
        title={
          <Space>
            <UserOutlined style={{ color: '#4f46e5' }} />
            <span>User Details</span>
            {selectedUser && (
              <>
                <Tag icon={getRoleIcon(selectedUser.role)} color={getRoleColor(selectedUser.role)}>
                  {selectedUser.role?.toUpperCase()}
                </Tag>
                <Tag 
                  icon={selectedUser.isActive ? <CheckCircleOutlined /> : <StopOutlined />} 
                  color={selectedUser.isActive ? 'success' : 'error'}
                >
                  {selectedUser.isActive ? 'ACTIVE' : 'SUSPENDED'}
                </Tag>
              </>
            )}
          </Space>
        }
        open={drawerVisible}
        onClose={() => {
          setDrawerVisible(false);
          setSelectedUser(null);
        }}
        size="large"
        extra={
          selectedUser && (
            <Button
              type={selectedUser.isActive ? 'default' : 'primary'}
              danger={selectedUser.isActive}
              icon={selectedUser.isActive ? <StopOutlined /> : <CheckCircleOutlined />}
              onClick={() => {
                handleSuspendUser(selectedUser);
                setDrawerVisible(false);
              }}
              loading={suspendMutation.isPending || unsuspendMutation.isPending}
            >
              {selectedUser.isActive ? 'Suspend' : 'Activate'}
            </Button>
          )
        }
      >
        {selectedUser && (
          <Tabs
            activeKey={drawerTab}
            onChange={setDrawerTab}
            items={[
              {
                key: 'details',
                label: 'Profile',
                icon: <UserOutlined />,
                children: (
                  <Space orientation="vertical" size="large" style={{ width: '100%' }}>
                    {/* User Header */}
                    <Card size="small">
                      <div style={{ textAlign: 'center', padding: '16px 0' }}>
                        <Badge dot status={selectedUser.isActive ? 'success' : 'error'} offset={[-10, 70]}>
                          <Avatar 
                            size={80} 
                            src={selectedUser.avatar || selectedUser.profileImage} 
                            icon={<UserOutlined />}
                            style={{ backgroundColor: '#4f46e5' }}
                          />
                        </Badge>
                        <Title level={4} style={{ marginTop: 12, marginBottom: 4 }}>
                          {selectedUser.name || `${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim() || 'N/A'}
                        </Title>
                        <Space wrap style={{ justifyContent: 'center' }}>
                          <Tag icon={getRoleIcon(selectedUser.role)} color={getRoleColor(selectedUser.role)}>
                            {selectedUser.role?.toUpperCase()}
                          </Tag>
                          {selectedUser.isPremium && (
                            <Tag icon={<CrownOutlined />} color="gold">
                              PREMIUM
                            </Tag>
                          )}
                        </Space>
                      </div>
                    </Card>

                    {/* Premium Status */}
                    {selectedUser.isPremium && selectedUser.premiumExpiry && (
                      <Alert
                        type="success"
                        title="Premium Member"
                        description={`Premium subscription expires on ${dayjs(selectedUser.premiumExpiry).format('MMM DD, YYYY')}`}
                        showIcon
                        icon={<CrownOutlined />}
                      />
                    )}

                    {/* Contact Info */}
                    <Card size="small" title="Contact Information">
                      <Descriptions column={1} size="small">
                        <Descriptions.Item label={<><MailOutlined style={{ marginRight: 8 }} /> Email</>}>
                          <Space>
                            <Text copyable={selectedUser.email ? { text: selectedUser.email } : false}>
                              {selectedUser.email || 'N/A'}
                            </Text>
                            {selectedUser.isEmailVerified && (
                              <Tag color="green" icon={<SafetyCertificateOutlined />}>Verified</Tag>
                            )}
                          </Space>
                        </Descriptions.Item>
                        <Descriptions.Item label={<><PhoneOutlined style={{ marginRight: 8 }} /> Phone</>}>
                          <Space>
                            <Text copyable={selectedUser.phone ? { text: selectedUser.phone } : false}>
                              {selectedUser.phone || 'N/A'}
                            </Text>
                            {selectedUser.isPhoneVerified && (
                              <Tag color="green" icon={<SafetyCertificateOutlined />}>Verified</Tag>
                            )}
                          </Space>
                        </Descriptions.Item>
                        {(selectedUser.address || selectedUser.city || selectedUser.state) && (
                          <Descriptions.Item label={<><EnvironmentOutlined style={{ marginRight: 8 }} /> Location</>}>
                            {selectedUser.address?.street && `${selectedUser.address.street}, `}
                            {selectedUser.address?.city || selectedUser.city || 'N/A'}, {selectedUser.address?.state || selectedUser.state || 'N/A'}
                          </Descriptions.Item>
                        )}
                        <Descriptions.Item label={<><CalendarOutlined style={{ marginRight: 8 }} /> Joined</>}>
                          {dayjs(selectedUser.createdAt).format('MMMM DD, YYYY')}
                        </Descriptions.Item>
                      </Descriptions>
                    </Card>

                    {/* Wallet & Activity */}
                    <Card size="small" title={<><WalletOutlined style={{ marginRight: 8 }} /> Wallet & Activity</>}>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Statistic
                            title="Wallet Balance"
                            value={parseFloat(selectedUser.walletBalance || '0')}
                            formatter={(v) => formatCurrency(Number(v))}
                            prefix={<WalletOutlined />}
                            styles={{ content: { color: '#52c41a' } }}
                          />
                        </Col>
                        {selectedUser.totalOrders !== undefined && (
                          <Col span={12}>
                            <Statistic
                              title="Total Orders"
                              value={selectedUser.totalOrders || 0}
                              prefix={<ShoppingCartOutlined />}
                              styles={{ content: { color: '#4f46e5' } }}
                            />
                          </Col>
                        )}
                      </Row>
                      {selectedUser.totalSpent !== undefined && (
                        <>
                          <Divider style={{ margin: '16px 0' }} />
                          <Statistic
                            title="Total Spent"
                            value={selectedUser.totalSpent || 0}
                            formatter={(v) => formatCurrency(Number(v))}
                            prefix={<DollarOutlined />}
                          />
                        </>
                      )}
                    </Card>

                    {/* Referral Info */}
                    {(selectedUser.referralCode || selectedUser.referredBy) && (
                      <Card size="small" title={<><GiftOutlined style={{ marginRight: 8 }} /> Referral Information</>}>
                        <Descriptions column={1} size="small">
                          {selectedUser.referralCode && (
                            <Descriptions.Item label="Referral Code">
                              <Text copyable strong style={{ color: '#4f46e5' }}>
                                {selectedUser.referralCode}
                              </Text>
                            </Descriptions.Item>
                          )}
                          {selectedUser.referredBy && (
                            <Descriptions.Item label="Referred By">
                              {selectedUser.referredBy}
                            </Descriptions.Item>
                          )}
                        </Descriptions>
                      </Card>
                    )}
                  </Space>
                ),
              },
              {
                key: 'actions',
                label: 'Quick Actions',
                icon: <StarOutlined />,
                children: (
                  <Space orientation="vertical" size="large" style={{ width: '100%' }}>
                    <Alert
                      type="info"
                      title="User Management"
                      description="Use these actions to manage this user's account status and permissions."
                      showIcon
                    />

                    <Card size="small" title="Account Status">
                      <Space orientation="vertical" style={{ width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <Text strong>Account Status</Text>
                            <br />
                            <Text type="secondary">
                              {selectedUser.isActive 
                                ? 'This user can access the platform normally.' 
                                : 'This user is suspended and cannot access their account.'}
                            </Text>
                          </div>
                          <Button
                            type={selectedUser.isActive ? 'default' : 'primary'}
                            danger={selectedUser.isActive}
                            icon={selectedUser.isActive ? <StopOutlined /> : <CheckCircleOutlined />}
                            onClick={() => handleSuspendUser(selectedUser)}
                            loading={suspendMutation.isPending || unsuspendMutation.isPending}
                          >
                            {selectedUser.isActive ? 'Suspend User' : 'Activate User'}
                          </Button>
                        </div>
                      </Space>
                    </Card>

                    {selectedUser.role === 'buyer' && (
                      <Card size="small" title="Buyer Actions">
                        <Space wrap>
                          <Button icon={<ShoppingCartOutlined />} disabled>
                            View Orders
                          </Button>
                          <Button icon={<WalletOutlined />} disabled>
                            Wallet History
                          </Button>
                          <Button icon={<CrownOutlined />} disabled>
                            Manage Premium
                          </Button>
                        </Space>
                      </Card>
                    )}

                    {selectedUser.role === 'farmer' && (
                      <Card size="small" title="Farmer Actions">
                        <Space wrap>
                          <Button icon={<ShopOutlined />} disabled>
                            View Products
                          </Button>
                          <Button icon={<ShoppingCartOutlined />} disabled>
                            View Orders
                          </Button>
                          <Button icon={<SafetyCertificateOutlined />} disabled>
                            Verify Farmer
                          </Button>
                        </Space>
                      </Card>
                    )}

                    {selectedUser.role === 'rider' && (
                      <Card size="small" title="Rider Actions">
                        <Space wrap>
                          <Button icon={<CarOutlined />} disabled>
                            View Deliveries
                          </Button>
                          <Button icon={<WalletOutlined />} disabled>
                            Earnings History
                          </Button>
                          <Button icon={<SafetyCertificateOutlined />} disabled>
                            Verify Rider
                          </Button>
                        </Space>
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
