'use client';

import React, { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Avatar,
  Modal,
  Form,
  Input,
  Select,
  Typography,
  Tabs,
  Popconfirm,
  Tooltip,
  Badge,
  Dropdown,
  Empty,
  App,
} from 'antd';
import {
  UserAddOutlined,
  MailOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  TeamOutlined,
  SendOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  StopOutlined,
  CrownOutlined,
  SafetyCertificateOutlined,
  CustomerServiceOutlined,
  DollarOutlined,
  SettingOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;

interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PendingInvite {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  invitedBy: {
    id: string;
    name: string;
    email: string;
  };
}

const ROLE_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode; description: string }> = {
  superadmin: {
    label: 'Super Admin',
    color: 'purple',
    icon: <CrownOutlined />,
    description: 'Full access to all features and settings',
  },
  admin: {
    label: 'Administrator',
    color: 'blue',
    icon: <SafetyCertificateOutlined />,
    description: 'Full access to all features and settings',
  },
  operations: {
    label: 'Operations',
    color: 'green',
    icon: <SettingOutlined />,
    description: 'Manage orders, dispatch, riders, and products',
  },
  finance: {
    label: 'Finance',
    color: 'gold',
    icon: <DollarOutlined />,
    description: 'View financial data and process refunds',
  },
  support: {
    label: 'Support',
    color: 'cyan',
    icon: <CustomerServiceOutlined />,
    description: 'Handle customer support and view orders',
  },
};

export default function TeamPage() {
  const { message } = App.useApp();
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const queryClient = useQueryClient();

  // Fetch team members
  const { data: teamData = [], isLoading: loadingTeam } = useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      const res = await adminApi.getTeamMembers();
      return (res.data?.data || []) as TeamMember[];
    },
  });

  // Fetch pending invites
  const { data: invitesData = [], isLoading: loadingInvites } = useQuery({
    queryKey: ['pending-invites'],
    queryFn: async () => {
      const res = await adminApi.getPendingInvites();
      return (res.data?.data || []) as PendingInvite[];
    },
  });

  // Invite mutation
  const inviteMutation = useMutation({
    mutationFn: (data: { email: string; role: string }) => adminApi.inviteTeamMember(data),
    onSuccess: () => {
      message.success('Invitation sent successfully');
      setInviteModalOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['pending-invites'] });
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      message.error(err.response?.data?.message || 'Failed to send invitation');
    },
  });

  // Update member mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { role?: string; isActive?: boolean } }) =>
      adminApi.updateTeamMember(id, data),
    onSuccess: () => {
      message.success('Team member updated');
      setEditModalOpen(false);
      setSelectedMember(null);
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      message.error(err.response?.data?.message || 'Failed to update team member');
    },
  });

  // Remove member mutation
  const removeMutation = useMutation({
    mutationFn: (id: string) => adminApi.removeTeamMember(id),
    onSuccess: () => {
      message.success('Team member removed');
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      message.error(err.response?.data?.message || 'Failed to remove team member');
    },
  });

  // Resend invite mutation
  const resendMutation = useMutation({
    mutationFn: (inviteId: string) => adminApi.resendInvite(inviteId),
    onSuccess: () => {
      message.success('Invitation resent');
      queryClient.invalidateQueries({ queryKey: ['pending-invites'] });
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      message.error(err.response?.data?.message || 'Failed to resend invitation');
    },
  });

  // Cancel invite mutation
  const cancelInviteMutation = useMutation({
    mutationFn: (inviteId: string) => adminApi.cancelInvite(inviteId),
    onSuccess: () => {
      message.success('Invitation cancelled');
      queryClient.invalidateQueries({ queryKey: ['pending-invites'] });
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      message.error(err.response?.data?.message || 'Failed to cancel invitation');
    },
  });

  const handleInvite = (values: { email: string; role: string }) => {
    inviteMutation.mutate(values);
  };

  const handleEdit = (member: TeamMember) => {
    setSelectedMember(member);
    editForm.setFieldsValue({
      role: member.role,
      isActive: member.isActive,
    });
    setEditModalOpen(true);
  };

  const handleUpdate = (values: { role: string; isActive: boolean }) => {
    if (selectedMember) {
      updateMutation.mutate({
        id: selectedMember.id,
        data: values,
      });
    }
  };

  const teamColumns = [
    {
      title: 'Member',
      key: 'member',
      render: (_: unknown, record: TeamMember) => (
        <Space>
          <Avatar
            src={record.avatar}
            style={{ backgroundColor: record.isActive ? '#16a34a' : '#9ca3af' }}
          >
            {record.name?.charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <Text strong>{record.name}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>{record.email}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => {
        const config = ROLE_CONFIG[role] || { label: role, color: 'default', icon: null };
        return (
          <Tooltip title={config.description}>
            <Tag color={config.color} icon={config.icon}>
              {config.label}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: unknown, record: TeamMember) => (
        <Badge
          status={record.isActive ? 'success' : 'error'}
          text={record.isActive ? 'Active' : 'Inactive'}
        />
      ),
    },
    {
      title: 'Joined',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => (
        <Tooltip title={dayjs(date).format('MMM DD, YYYY HH:mm')}>
          <Text type="secondary">{dayjs(date).fromNow()}</Text>
        </Tooltip>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: TeamMember) => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'edit',
                icon: <EditOutlined />,
                label: 'Edit Role',
                onClick: () => handleEdit(record),
              },
              {
                type: 'divider',
              },
              {
                key: 'remove',
                icon: <DeleteOutlined />,
                label: 'Remove from Team',
                danger: true,
                onClick: () => {
                  Modal.confirm({
                    title: 'Remove Team Member',
                    content: `Are you sure you want to remove ${record.name} from the team? They will lose admin access.`,
                    okText: 'Remove',
                    okType: 'danger',
                    onOk: () => removeMutation.mutate(record.id),
                  });
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

  const inviteColumns = [
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (email: string) => (
        <Space>
          <MailOutlined style={{ color: '#6b7280' }} />
          <Text>{email}</Text>
        </Space>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => {
        const config = ROLE_CONFIG[role] || { label: role, color: 'default', icon: null };
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.label}
          </Tag>
        );
      },
    },
    {
      title: 'Invited By',
      key: 'invitedBy',
      render: (_: unknown, record: PendingInvite) => (
        <Text type="secondary">{record.invitedBy?.name || 'Unknown'}</Text>
      ),
    },
    {
      title: 'Expires',
      dataIndex: 'expiresAt',
      key: 'expiresAt',
      render: (date: string) => {
        const isExpired = dayjs(date).isBefore(dayjs());
        return (
          <Space>
            <ClockCircleOutlined style={{ color: isExpired ? '#ef4444' : '#6b7280' }} />
            <Text type={isExpired ? 'danger' : 'secondary'}>
              {isExpired ? 'Expired' : dayjs(date).fromNow()}
            </Text>
          </Space>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: PendingInvite) => (
        <Space>
          <Tooltip title="Resend Invite">
            <Button
              type="text"
              size="small"
              icon={<ReloadOutlined />}
              onClick={() => resendMutation.mutate(record.id)}
              loading={resendMutation.isPending}
            />
          </Tooltip>
          <Popconfirm
            title="Cancel this invitation?"
            onConfirm={() => cancelInviteMutation.mutate(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Cancel Invite">
              <Button type="text" size="small" danger icon={<StopOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'members',
      label: (
        <Space>
          <TeamOutlined />
          Team Members
          <Badge count={Array.isArray(teamData) ? teamData.length : 0} style={{ backgroundColor: '#16a34a' }} />
        </Space>
      ),
      children: (
        <Table
          columns={teamColumns}
          dataSource={Array.isArray(teamData) ? teamData : []}
          rowKey="id"
          loading={loadingTeam}
          pagination={{ pageSize: 10 }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No team members yet"
              >
                <Button type="primary" icon={<UserAddOutlined />} onClick={() => setInviteModalOpen(true)}>
                  Invite Team Member
                </Button>
              </Empty>
            ),
          }}
        />
      ),
    },
    {
      key: 'invites',
      label: (
        <Space>
          <SendOutlined />
          Pending Invites
          <Badge count={invitesData?.length || 0} style={{ backgroundColor: '#f59e0b' }} />
        </Space>
      ),
      children: (
        <Table
          columns={inviteColumns}
          dataSource={invitesData || []}
          rowKey="id"
          loading={loadingInvites}
          pagination={{ pageSize: 10 }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No pending invites"
              />
            ),
          }}
        />
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Team Management</Title>
          <Text type="secondary">Manage your admin team members and their access levels</Text>
        </div>
        <Button
          type="primary"
          icon={<UserAddOutlined />}
          onClick={() => setInviteModalOpen(true)}
          size="large"
        >
          Invite Member
        </Button>
      </div>

      {/* Role Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {Object.entries(ROLE_CONFIG).map(([key, config]) => {
          const count = Array.isArray(teamData) ? teamData.filter(m => m.role === key).length : 0;
          return (
            <Card key={key} size="small" style={{ borderLeft: `3px solid ${config.color === 'purple' ? '#9333ea' : config.color === 'blue' ? '#3b82f6' : config.color === 'green' ? '#16a34a' : config.color === 'gold' ? '#f59e0b' : '#06b6d4'}` }}>
              <Space>
                <div style={{ fontSize: 24, color: config.color === 'purple' ? '#9333ea' : config.color === 'blue' ? '#3b82f6' : config.color === 'green' ? '#16a34a' : config.color === 'gold' ? '#f59e0b' : '#06b6d4' }}>
                  {config.icon}
                </div>
                <div>
                  <Text strong>{config.label}</Text>
                  <br />
                  <Text type="secondary">{count} member{count !== 1 ? 's' : ''}</Text>
                </div>
              </Space>
            </Card>
          );
        })}
      </div>

      <Card>
        <Tabs items={tabItems} />
      </Card>

      {/* Invite Modal */}
      <Modal
        title={
          <Space>
            <UserAddOutlined />
            Invite Team Member
          </Space>
        }
        open={inviteModalOpen}
        onCancel={() => {
          setInviteModalOpen(false);
          form.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleInvite}>
          <Form.Item
            name="email"
            label="Email Address"
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Please enter a valid email' },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="team@handwork.ng" size="large" />
          </Form.Item>

          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: 'Please select a role' }]}
          >
            <Select placeholder="Select role" size="large">
              {Object.entries(ROLE_CONFIG).map(([key, config]) => (
                <Select.Option key={key} value={key}>
                  <Space>
                    {config.icon}
                    <span>{config.label}</span>
                  </Space>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>{config.description}</Text>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <div style={{ marginTop: 16, padding: 12, background: '#f8fafc', borderRadius: 8 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              <CheckCircleOutlined style={{ marginRight: 8 }} />
              An invitation email will be sent with a link to set up their account.
              The link expires in 7 days.
            </Text>
          </div>

          <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setInviteModalOpen(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={inviteMutation.isPending}>
                Send Invitation
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        title={
          <Space>
            <EditOutlined />
            Edit Team Member
          </Space>
        }
        open={editModalOpen}
        onCancel={() => {
          setEditModalOpen(false);
          setSelectedMember(null);
          editForm.resetFields();
        }}
        footer={null}
        width={500}
      >
        {selectedMember && (
          <Form form={editForm} layout="vertical" onFinish={handleUpdate}>
            <div style={{ marginBottom: 16, padding: 12, background: '#f8fafc', borderRadius: 8 }}>
              <Space>
                <Avatar src={selectedMember.avatar} style={{ backgroundColor: '#16a34a' }}>
                  {selectedMember.name?.charAt(0).toUpperCase()}
                </Avatar>
                <div>
                  <Text strong>{selectedMember.name}</Text>
                  <br />
                  <Text type="secondary">{selectedMember.email}</Text>
                </div>
              </Space>
            </div>

            <Form.Item
              name="role"
              label="Role"
              rules={[{ required: true, message: 'Please select a role' }]}
            >
              <Select placeholder="Select role" size="large">
                {Object.entries(ROLE_CONFIG).map(([key, config]) => (
                  <Select.Option key={key} value={key}>
                    <Space>
                      {config.icon}
                      <span>{config.label}</span>
                    </Space>
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="isActive"
              label="Status"
              valuePropName="checked"
            >
              <Select size="large">
                <Select.Option value={true}>
                  <Badge status="success" text="Active" />
                </Select.Option>
                <Select.Option value={false}>
                  <Badge status="error" text="Inactive" />
                </Select.Option>
              </Select>
            </Form.Item>

            <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button onClick={() => setEditModalOpen(false)}>Cancel</Button>
                <Button type="primary" htmlType="submit" loading={updateMutation.isPending}>
                  Update
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
}
