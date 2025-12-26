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
  DatePicker,
  Drawer,
  Descriptions,
  Avatar,
  Divider,
  Badge,
  Button,
  Tooltip,
  Tabs,
  Timeline,
  Progress,
} from 'antd';
import {
  SearchOutlined,
  GiftOutlined,
  UserAddOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  EyeOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  DollarOutlined,
  TrophyOutlined,
  FieldTimeOutlined,
  ShareAltOutlined,
  TeamOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface Referral {
  id: string;
  referrer: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  referredUser?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  referredPhone?: string;
  referredName?: string;
  status: string;
  referrerReward: number;
  referredReward: number;
  completedAt?: string;
  expiresAt?: string;
  createdAt: string;
}

interface ReferralStats {
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  totalRewardsGiven: number;
  conversionRate?: number;
  topReferrers?: Array<{ name: string; count: number; rewards: number }>;
}

const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  completed: { color: 'green', icon: <CheckCircleOutlined />, label: 'Completed' },
  joined: { color: 'blue', icon: <UserAddOutlined />, label: 'Joined' },
  pending: { color: 'orange', icon: <ClockCircleOutlined />, label: 'Pending' },
  expired: { color: 'default', icon: <ExclamationCircleOutlined />, label: 'Expired' },
};

export default function ReferralsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['referral-stats'],
    queryFn: async () => {
      const response = await adminApi.getReferralStats();
      return response.data as ReferralStats;
    },
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['referrals', { search, status: statusFilter, dateRange, page, pageSize }],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, limit: pageSize };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (dateRange?.[0]) params.startDate = dateRange[0].format('YYYY-MM-DD');
      if (dateRange?.[1]) params.endDate = dateRange[1].format('YYYY-MM-DD');
      const response = await adminApi.getReferrals(params);
      const responseData = response.data?.data || response.data;
      return responseData;
    },
  });

  const handleRefresh = () => {
    refetch();
    refetchStats();
  };

  const handleOpenDrawer = (referral: Referral) => {
    setSelectedReferral(referral);
    setActiveTab('details');
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedReferral(null);
  };

  const conversionRate = stats?.totalReferrals 
    ? Math.round((stats.completedReferrals / stats.totalReferrals) * 100) 
    : 0;

  const columns: ColumnsType<Referral> = [
    {
      title: 'Referrer',
      dataIndex: 'referrer',
      key: 'referrer',
      render: (referrer) => (
        <Space>
          <Avatar style={{ backgroundColor: '#52c41a' }} icon={<UserOutlined />} size="small" />
          <div>
            <Text strong style={{ display: 'block' }}>{referrer.name}</Text>
            <Text type="secondary" style={{ fontSize: 11 }}>
              <MailOutlined style={{ marginRight: 4 }} />
              {referrer.email}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Referred User',
      dataIndex: 'referredUser',
      key: 'referredUser',
      render: (referredUser, record) => (
        <Space>
          <Avatar 
            style={{ backgroundColor: referredUser ? '#1890ff' : '#d9d9d9' }} 
            icon={<UserAddOutlined />} 
            size="small" 
          />
          <div>
            {referredUser ? (
              <>
                <Text strong style={{ display: 'block' }}>{referredUser.name}</Text>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  <MailOutlined style={{ marginRight: 4 }} />
                  {referredUser.email}
                </Text>
              </>
            ) : (
              <>
                <Text style={{ display: 'block' }}>{record.referredName || 'Pending'}</Text>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  <PhoneOutlined style={{ marginRight: 4 }} />
                  {record.referredPhone || 'Invite sent'}
                </Text>
              </>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        const config = statusConfig[status] || statusConfig.pending;
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.label}
          </Tag>
        );
      },
    },
    {
      title: 'Rewards',
      key: 'rewards',
      width: 140,
      render: (_, record) => (
        <div>
          {record.status === 'completed' ? (
            <Space orientation="vertical" size={0}>
              <Text strong style={{ color: '#52c41a' }}>
                <DollarOutlined style={{ marginRight: 4 }} />
                ₦{(record.referrerReward + record.referredReward).toLocaleString()}
              </Text>
              <Text type="secondary" style={{ fontSize: 11 }}>
                Total rewards paid
              </Text>
            </Space>
          ) : (
            <Text type="secondary">
              <ClockCircleOutlined style={{ marginRight: 4 }} />
              Pending
            </Text>
          )}
        </div>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
      render: (date: string) => (
        <Tooltip title={dayjs(date).format('DD MMM YYYY, HH:mm:ss')}>
          <Space orientation="vertical" size={0}>
            <Text>{dayjs(date).format('MMM D, YYYY')}</Text>
            <Text type="secondary" style={{ fontSize: 11 }}>
              <FieldTimeOutlined style={{ marginRight: 4 }} />
              {dayjs(date).fromNow()}
            </Text>
          </Space>
        </Tooltip>
      ),
    },
    {
      title: 'Completed',
      dataIndex: 'completedAt',
      key: 'completedAt',
      width: 120,
      render: (date: string) => (
        date ? (
          <Tag color="green" icon={<CheckCircleOutlined />}>
            {dayjs(date).format('MMM D')}
          </Tag>
        ) : (
          <Text type="secondary">-</Text>
        )
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      fixed: 'right',
      render: (_, record) => (
        <Tooltip title="View Details">
          <Button
            type="primary"
            ghost
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleOpenDrawer(record)}
          />
        </Tooltip>
      ),
    },
  ];

  // Build timeline for referral
  const buildTimeline = (referral: Referral) => {
    const items = [
      {
        color: 'blue',
        dot: <ShareAltOutlined />,
        content: (
          <div>
            <Text strong>Referral Created</Text>
            <div><Text type="secondary">{dayjs(referral.createdAt).format('DD MMM YYYY, HH:mm')}</Text></div>
          </div>
        ),
      },
    ];

    if (referral.status === 'joined' || referral.status === 'completed') {
      items.push({
        color: 'blue',
        dot: <UserAddOutlined />,
        content: (
          <div>
            <Text strong>User Joined</Text>
            <div><Text type="secondary">{referral.referredUser?.name || 'New user registered'}</Text></div>
          </div>
        ),
      });
    }

    if (referral.status === 'completed') {
      items.push({
        color: 'green',
        dot: <GiftOutlined />,
        content: (
          <div>
            <Text strong>Rewards Distributed</Text>
            <div><Text type="secondary">{referral.completedAt ? dayjs(referral.completedAt).format('DD MMM YYYY, HH:mm') : 'Completed'}</Text></div>
          </div>
        ),
      });
    }

    if (referral.status === 'expired') {
      items.push({
        color: 'gray',
        dot: <ExclamationCircleOutlined />,
        content: (
          <div>
            <Text strong>Referral Expired</Text>
            <div><Text type="secondary">{referral.expiresAt ? dayjs(referral.expiresAt).format('DD MMM YYYY') : 'Expired'}</Text></div>
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
            <GiftOutlined style={{ marginRight: 12, color: '#eb2f96' }} />
            Referral Program
          </Title>
          <Text type="secondary">Track referrals and reward distributions</Text>
        </div>
        <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={isLoading}>
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
                  <TeamOutlined style={{ color: '#1890ff' }} />
                  <span>Total Referrals</span>
                </Space>
              }
              value={stats?.totalReferrals || 0}
              loading={statsLoading}
              styles={{ content: { color: '#1890ff' } }}
            />
            <Divider style={{ margin: '12px 0' }} />
            <Text type="secondary" style={{ fontSize: 12 }}>All time referrals</Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title={
                <Space>
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  <span>Completed</span>
                </Space>
              }
              value={stats?.completedReferrals || 0}
              styles={{ content: { color: '#52c41a' } }}
              loading={statsLoading}
            />
            <Divider style={{ margin: '12px 0' }} />
            <Progress 
              percent={conversionRate} 
              size="small" 
              status="success"
              format={(p) => `${p}% conversion`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title={
                <Space>
                  <ClockCircleOutlined style={{ color: '#faad14' }} />
                  <span>Pending</span>
                </Space>
              }
              value={stats?.pendingReferrals || 0}
              styles={{ content: { color: '#faad14' } }}
              loading={statsLoading}
            />
            <Divider style={{ margin: '12px 0' }} />
            <Badge status="warning" text={<Text type="secondary" style={{ fontSize: 12 }}>Awaiting completion</Text>} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title={
                <Space>
                  <DollarOutlined style={{ color: '#eb2f96' }} />
                  <span>Total Rewards Given</span>
                </Space>
              }
              value={stats?.totalRewardsGiven || 0}
              precision={0}
              prefix="₦"
              styles={{ content: { color: '#eb2f96' } }}
              loading={statsLoading}
            />
            <Divider style={{ margin: '12px 0' }} />
            <Badge status="processing" text={<Text type="secondary" style={{ fontSize: 12 }}>Distributed to users</Text>} />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap size="middle">
          <Input
            placeholder="Search by name, email, or phone"
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />
          <Select
            placeholder="Filter by Status"
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 160 }}
            allowClear
            options={[
              { value: 'completed', label: <Space><CheckCircleOutlined style={{ color: '#52c41a' }} />Completed</Space> },
              { value: 'joined', label: <Space><UserAddOutlined style={{ color: '#1890ff' }} />Joined</Space> },
              { value: 'pending', label: <Space><ClockCircleOutlined style={{ color: '#faad14' }} />Pending</Space> },
              { value: 'expired', label: <Space><ExclamationCircleOutlined style={{ color: '#8c8c8c' }} />Expired</Space> },
            ]}
          />
          <RangePicker
            value={dateRange}
            onChange={(dates) => setDateRange(dates)}
            style={{ width: 280 }}
            presets={[
              { label: 'Last 7 Days', value: [dayjs().subtract(7, 'day'), dayjs()] },
              { label: 'Last 30 Days', value: [dayjs().subtract(30, 'day'), dayjs()] },
              { label: 'This Month', value: [dayjs().startOf('month'), dayjs()] },
            ]}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              setSearch('');
              setStatusFilter(undefined);
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
          dataSource={Array.isArray(data?.data) ? data.data : []}
          rowKey="id"
          loading={isLoading}
          scroll={{ x: 1000 }}
          onRow={(record) => ({
            onClick: () => handleOpenDrawer(record),
            style: { cursor: 'pointer' },
          })}
          pagination={{
            current: page,
            pageSize,
            total: data?.meta?.total || 0,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} referrals`,
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
            <Avatar style={{ backgroundColor: '#eb2f96' }} icon={<GiftOutlined />} />
            <div>
              <Text strong>Referral Details</Text>
              {selectedReferral && (
                <div>
                  <Tag 
                    color={statusConfig[selectedReferral.status]?.color}
                    icon={statusConfig[selectedReferral.status]?.icon}
                  >
                    {statusConfig[selectedReferral.status]?.label}
                  </Tag>
                </div>
              )}
            </div>
          </Space>
        }
        placement="right"
        size="large"
        onClose={handleCloseDrawer}
        open={drawerOpen}
      >
        {selectedReferral && (
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
                    {/* Reward Summary Card */}
                    {selectedReferral.status === 'completed' && (
                      <Card 
                        size="small" 
                        style={{ 
                          marginBottom: 16, 
                          background: 'linear-gradient(135deg, #eb2f96 0%, #f759ab 100%)',
                          border: 'none'
                        }}
                      >
                        <Row align="middle" justify="space-between">
                          <Col>
                            <Text style={{ color: 'rgba(255,255,255,0.8)' }}>Total Rewards</Text>
                            <Title level={2} style={{ color: '#fff', margin: 0 }}>
                              ₦{(selectedReferral.referrerReward + selectedReferral.referredReward).toLocaleString()}
                            </Title>
                          </Col>
                          <Col>
                            <TrophyOutlined style={{ fontSize: 48, color: 'rgba(255,255,255,0.3)' }} />
                          </Col>
                        </Row>
                      </Card>
                    )}

                    {/* Referrer Info */}
                    <Card size="small" title={<><UserOutlined /> Referrer</>} style={{ marginBottom: 16 }}>
                      <Space orientation="vertical" style={{ width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <Avatar size={48} style={{ backgroundColor: '#52c41a' }} icon={<UserOutlined />} />
                          <div>
                            <Text strong style={{ fontSize: 16 }}>{selectedReferral.referrer.name}</Text>
                            <div>
                              <Space split={<Divider type="vertical" />}>
                                <Text type="secondary">
                                  <MailOutlined /> {selectedReferral.referrer.email}
                                </Text>
                              </Space>
                            </div>
                          </div>
                        </div>
                        {selectedReferral.status === 'completed' && (
                          <div style={{ marginTop: 8, padding: 8, background: '#f6ffed', borderRadius: 4 }}>
                            <Text type="success">
                              <GiftOutlined style={{ marginRight: 4 }} />
                              Reward: ₦{selectedReferral.referrerReward.toLocaleString()}
                            </Text>
                          </div>
                        )}
                      </Space>
                    </Card>

                    {/* Referred User Info */}
                    <Card size="small" title={<><UserAddOutlined /> Referred User</>} style={{ marginBottom: 16 }}>
                      {selectedReferral.referredUser ? (
                        <Space orientation="vertical" style={{ width: '100%' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <Avatar size={48} style={{ backgroundColor: '#1890ff' }} icon={<UserAddOutlined />} />
                            <div>
                              <Text strong style={{ fontSize: 16 }}>{selectedReferral.referredUser.name}</Text>
                              <div>
                                <Space split={<Divider type="vertical" />}>
                                  <Text type="secondary">
                                    <MailOutlined /> {selectedReferral.referredUser.email}
                                  </Text>
                                </Space>
                              </div>
                            </div>
                          </div>
                          {selectedReferral.status === 'completed' && (
                            <div style={{ marginTop: 8, padding: 8, background: '#e6f7ff', borderRadius: 4 }}>
                              <Text style={{ color: '#1890ff' }}>
                                <GiftOutlined style={{ marginRight: 4 }} />
                                Reward: ₦{selectedReferral.referredReward.toLocaleString()}
                              </Text>
                            </div>
                          )}
                        </Space>
                      ) : (
                        <div style={{ textAlign: 'center', padding: 24 }}>
                          <ClockCircleOutlined style={{ fontSize: 32, color: '#faad14', marginBottom: 8 }} />
                          <div>
                            <Text strong>{selectedReferral.referredName || 'Pending'}</Text>
                          </div>
                          <Text type="secondary">{selectedReferral.referredPhone || 'Invite sent - waiting to join'}</Text>
                        </div>
                      )}
                    </Card>

                    {/* Details */}
                    <Descriptions bordered column={1} size="small">
                      <Descriptions.Item label={<><ClockCircleOutlined /> Created At</>}>
                        {dayjs(selectedReferral.createdAt).format('DD MMM YYYY, HH:mm:ss')}
                        <Text type="secondary" style={{ marginLeft: 8 }}>
                          ({dayjs(selectedReferral.createdAt).fromNow()})
                        </Text>
                      </Descriptions.Item>
                      {selectedReferral.completedAt && (
                        <Descriptions.Item label={<><CheckCircleOutlined /> Completed At</>}>
                          {dayjs(selectedReferral.completedAt).format('DD MMM YYYY, HH:mm:ss')}
                        </Descriptions.Item>
                      )}
                      {selectedReferral.expiresAt && (
                        <Descriptions.Item label={<><ExclamationCircleOutlined /> Expires At</>}>
                          {dayjs(selectedReferral.expiresAt).format('DD MMM YYYY')}
                        </Descriptions.Item>
                      )}
                    </Descriptions>
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
                  <Timeline items={buildTimeline(selectedReferral)} />
                ),
              },
            ]}
          />
        )}
      </Drawer>
    </div>
  );
}
