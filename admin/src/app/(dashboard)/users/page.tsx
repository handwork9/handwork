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
  message,
  Badge,
  Dropdown,
} from 'antd';
import {
  SearchOutlined,
  UserOutlined,
  MoreOutlined,
  CheckCircleOutlined,
  StopOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  avatar?: string;
  isActive: boolean;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  walletBalance: string;
  createdAt: string;
}

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['users', { search, role: roleFilter, status: statusFilter, page, pageSize }],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, limit: pageSize };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;
      const response = await adminApi.getUsers(params);
      return response.data.data;
    },
  });

  const suspendMutation = useMutation({
    mutationFn: (userId: string) => adminApi.suspendUser(userId),
    onSuccess: () => {
      message.success('User suspended successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
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
      rider: 'orange',
    };
    return colors[role] || 'default';
  };

  const columns: ColumnsType<User> = [
    {
      title: 'User',
      key: 'user',
      render: (_, record) => (
        <Space>
          <Avatar src={record.avatar} icon={<UserOutlined />} />
          <div>
            <Text strong>{record.name || 'N/A'}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.email || record.phone}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={getRoleColor(role)}>{role.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <Space orientation="vertical" size={0}>
          <Badge
            status={record.isActive ? 'success' : 'error'}
            text={record.isActive ? 'Active' : 'Suspended'}
          />
          {record.isPhoneVerified && (
            <Text type="secondary" style={{ fontSize: 11 }}>
              <CheckCircleOutlined style={{ color: '#52c41a' }} /> Phone verified
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Wallet',
      dataIndex: 'walletBalance',
      key: 'walletBalance',
      render: (balance: string) => `₦${parseFloat(balance || '0').toLocaleString()}`,
    },
    {
      title: 'Joined',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('MMM DD, YYYY'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'view',
                label: 'View Details',
                icon: <EyeOutlined />,
              },
              {
                key: 'toggle',
                label: record.isActive ? 'Suspend User' : 'Activate User',
                icon: record.isActive ? <StopOutlined /> : <CheckCircleOutlined />,
                danger: record.isActive,
                onClick: () => {
                  if (record.isActive) {
                    suspendMutation.mutate(record.id);
                  } else {
                    unsuspendMutation.mutate(record.id);
                  }
                },
              },
            ],
          }}
          trigger={['click']}
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  const users = data?.users || data || [];
  const total = data?.total || users.length;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          Users Management
        </Title>
        <Text type="secondary">Manage all platform users</Text>
      </div>

      <Card>
        <Space style={{ marginBottom: 16 }} wrap>
          <Input
            placeholder="Search by name, email, or phone"
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 280 }}
            allowClear
          />
          <Select
            placeholder="Filter by role"
            value={roleFilter}
            onChange={setRoleFilter}
            style={{ width: 150 }}
            allowClear
            options={[
              { label: 'All Roles', value: undefined },
              { label: 'Admin', value: 'admin' },
              { label: 'Buyer', value: 'buyer' },
              { label: 'Farmer', value: 'farmer' },
              { label: 'Rider', value: 'rider' },
            ]}
          />
          <Select
            placeholder="Filter by status"
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 150 }}
            allowClear
            options={[
              { label: 'All Status', value: undefined },
              { label: 'Active', value: 'active' },
              { label: 'Suspended', value: 'suspended' },
            ]}
          />
        </Space>

        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={isLoading}
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
    </div>
  );
}
