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
  Typography,
  Drawer,
  Descriptions,
  Avatar,
  Divider,
  Switch,
  Rate,
  Statistic,
  Row,
  Col,
  Image,
  Badge,
  App,
  Tabs,
  Modal,
  Alert,
  Tooltip,
  Progress,
  Dropdown,
} from 'antd';
import {
  SearchOutlined,
  PhoneOutlined,
  ShopOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  EyeOutlined,
  StarOutlined,
  EnvironmentOutlined,
  ExportOutlined,
  CheckOutlined,
  CloseOutlined,
  FileImageOutlined,
  BankOutlined,
  IdcardOutlined,
  MailOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  ShoppingOutlined,
  MoreOutlined,
  FilterOutlined,
  SafetyCertificateOutlined,
  StopOutlined,
  UserOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface Farmer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profileImage?: string;
  businessName: string;
  businessDescription?: string;
  businessLogo?: string;
  isVerified: boolean;
  isActive: boolean;
  rating: number;
  totalSales: number;
  totalProducts: number;
  city?: string;
  state?: string;
  address: {
    street: string;
    city: string;
    state: string;
    coordinates?: { lat: number; lng: number };
  };
  createdAt: string;
  revenue: {
    total: number;
    thisMonth: number;
  };
  products: Array<{
    id: string;
    name: string;
    price: number;
    unit: string;
    stock: number;
    image?: string;
    isActive: boolean;
  }>;
}

interface FarmerApplication {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profileImage?: string;
  farmName: string;
  farmType: string;
  farmSize: string;
  farmAddress: string;
  primaryProducts: string;
  yearsOfExperience: string;
  hasTransportation: boolean;
  businessRegistrationNumber?: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  farmerId: string;
  farmPhotos: string;
  applicationStatus: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
  state: string;
  city: string;
}

const formatCurrency = (value: number | null | undefined) => `₦${(value ?? 0).toLocaleString()}`;

export default function FarmersPage() {
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [mainTab, setMainTab] = useState('list');

  // Application states
  const [appPage, setAppPage] = useState(1);
  const [appPageSize, setAppPageSize] = useState(10);
  const [appSearch, setAppSearch] = useState('');
  const [appStatusFilter, setAppStatusFilter] = useState<string | undefined>('pending');
  const [selectedApplication, setSelectedApplication] = useState<FarmerApplication | null>(null);
  const [applicationDrawerVisible, setApplicationDrawerVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Fetch dashboard stats
  const { data: dashboardData } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await adminApi.getDashboard();
      return response.data?.data || response.data;
    },
  });

  // Fetch farmers
  const { data: farmersData, isLoading, refetch } = useQuery({
    queryKey: ['farmers', page, pageSize, search, statusFilter],
    queryFn: async () => {
      const params: Record<string, string | number | undefined> = {
        page,
        limit: pageSize,
        search,
        status: statusFilter,
        role: 'farmer',
      };
      const response = await adminApi.getUsers(params);
      return response.data?.data || response.data;
    },
  });

  // Fetch farmer applications
  const { data: applicationsData, isLoading: applicationsLoading, refetch: refetchApplications } = useQuery({
    queryKey: ['farmer-applications', appPage, appPageSize, appSearch, appStatusFilter],
    queryFn: async () => {
      const params: Record<string, string | number | undefined> = {
        page: appPage,
        limit: appPageSize,
        search: appSearch,
        status: appStatusFilter,
      };
      const response = await adminApi.getFarmerApplications(params);
      return response.data?.data || response.data;
    },
  });

  // Toggle farmer status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: ({ farmerId, isActive }: { farmerId: string; isActive: boolean }) =>
      adminApi.updateUser(farmerId, { isActive }),
    onSuccess: () => {
      message.success('Farmer status updated');
      queryClient.invalidateQueries({ queryKey: ['farmers'] });
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      message.error(error.response?.data?.message || 'Failed to update farmer');
    },
  });

  // Verify farmer mutation
  const verifyMutation = useMutation({
    mutationFn: (farmerId: string) => adminApi.verifyFarmer(farmerId),
    onSuccess: () => {
      message.success('Farmer verified successfully');
      queryClient.invalidateQueries({ queryKey: ['farmers'] });
      if (selectedFarmer) {
        setSelectedFarmer({ ...selectedFarmer, isVerified: true });
      }
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      message.error(error.response?.data?.message || 'Failed to verify farmer');
    },
  });

  // Approve farmer application mutation
  const approveApplicationMutation = useMutation({
    mutationFn: (applicationId: string) => adminApi.approveFarmerApplication(applicationId),
    onSuccess: () => {
      message.success('Farmer application approved! They can now list products.');
      queryClient.invalidateQueries({ queryKey: ['farmer-applications'] });
      queryClient.invalidateQueries({ queryKey: ['farmers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setApplicationDrawerVisible(false);
      setSelectedApplication(null);
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      message.error(error.response?.data?.message || 'Failed to approve application');
    },
  });

  // Reject farmer application mutation
  const rejectApplicationMutation = useMutation({
    mutationFn: ({ applicationId, reason }: { applicationId: string; reason: string }) =>
      adminApi.rejectFarmerApplication(applicationId, reason),
    onSuccess: () => {
      message.success('Farmer application rejected');
      queryClient.invalidateQueries({ queryKey: ['farmer-applications'] });
      setRejectModalVisible(false);
      setRejectionReason('');
      setApplicationDrawerVisible(false);
      setSelectedApplication(null);
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      message.error(error.response?.data?.message || 'Failed to reject application');
    },
  });

  const handleViewFarmer = (farmer: Farmer) => {
    setSelectedFarmer(farmer);
    setDrawerVisible(true);
    setActiveTab('details');
  };

  const handleViewApplication = (application: FarmerApplication) => {
    setSelectedApplication(application);
    setApplicationDrawerVisible(true);
  };

  const handleDeactivateFarmer = (farmer: Farmer) => {
    modal.confirm({
      title: farmer.isActive ? 'Deactivate Farmer' : 'Activate Farmer',
      content: farmer.isActive
        ? `Are you sure you want to deactivate ${farmer.businessName}? Their products will no longer be visible to customers.`
        : `Are you sure you want to activate ${farmer.businessName}?`,
      okText: farmer.isActive ? 'Deactivate' : 'Activate',
      okType: farmer.isActive ? 'danger' : 'primary',
      onOk: () => toggleStatusMutation.mutate({ farmerId: farmer.id, isActive: !farmer.isActive }),
    });
  };

  // Stats
  const farmers = farmersData?.items || farmersData?.users || [];
  const total = farmersData?.total || dashboardData?.totalFarmers || 0;
  const applications = applicationsData?.applications || applicationsData?.items || [];
  const applicationsTotal = applicationsData?.total || 0;
  const pendingApplicationsCount = applications.filter((a: FarmerApplication) => a.applicationStatus === 'pending').length;
  
  const verifiedCount = farmers.filter((f: Farmer) => f.isVerified).length;
  const activeCount = farmers.filter((f: Farmer) => f.isActive).length;
  const totalProducts = farmers.reduce((sum: number, f: Farmer) => sum + (f.totalProducts || 0), 0);

  // Calculate verification rate
  const verificationRate = farmers.length > 0 ? Math.round((verifiedCount / farmers.length) * 100) : 0;

  // Application table columns
  const applicationColumns: ColumnsType<FarmerApplication> = [
    {
      title: 'Applicant',
      key: 'applicant',
      width: 220,
      render: (_, record) => (
        <Space>
          <Avatar size={40} src={record.profileImage} icon={<ShopOutlined />} style={{ backgroundColor: '#52c41a' }} />
          <div>
            <Text strong>
              {record.firstName} {record.lastName}
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              <PhoneOutlined style={{ marginRight: 4 }} />
              {record.phone}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Farm Info',
      key: 'farm',
      width: 200,
      render: (_, record) => (
        <div>
          <Text strong style={{ color: '#52c41a' }}>{record.farmName}</Text>
          <br />
          <Space size={4}>
            <Tag color="green" style={{ margin: 0 }}>{record.farmType}</Tag>
            <Tag color="cyan" style={{ margin: 0 }}>{record.farmSize}</Tag>
          </Space>
        </div>
      ),
    },
    {
      title: 'Location',
      key: 'location',
      width: 150,
      render: (_, record) => (
        <Space>
          <EnvironmentOutlined style={{ color: '#fa8c16' }} />
          <Text>{record.city}, {record.state}</Text>
        </Space>
      ),
    },
    {
      title: 'Products',
      key: 'products',
      width: 150,
      render: (_, record) => (
        <Tooltip title={record.primaryProducts}>
          <Text type="secondary" ellipsis style={{ maxWidth: 140 }}>
            {record.primaryProducts}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: 'Experience',
      key: 'experience',
      width: 100,
      render: (_, record) => (
        <Tag color="blue">{record.yearsOfExperience} yrs</Tag>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 110,
      render: (_, record) => {
        const statusConfig = {
          pending: { color: 'orange', icon: <ClockCircleOutlined /> },
          approved: { color: 'green', icon: <CheckCircleOutlined /> },
          rejected: { color: 'red', icon: <CloseOutlined /> },
        };
        const config = statusConfig[record.applicationStatus];
        return (
          <Tag icon={config.icon} color={config.color}>
            {record.applicationStatus.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: 'Applied',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 110,
      render: (date: string) => (
        <Tooltip title={dayjs(date).format('MMM DD, YYYY HH:mm')}>
          <Text>{dayjs(date).format('MMM DD, YYYY')}</Text>
        </Tooltip>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewApplication(record)}
            />
          </Tooltip>
          {record.applicationStatus === 'pending' && (
            <>
              <Tooltip title="Approve">
                <Button
                  type="text"
                  icon={<CheckOutlined />}
                  style={{ color: '#10b981' }}
                  onClick={() => {
                    modal.confirm({
                      title: 'Approve Application',
                      content: `Approve ${record.firstName} ${record.lastName}'s farmer application?`,
                      okText: 'Approve',
                      okButtonProps: { style: { backgroundColor: '#10b981' } },
                      onOk: () => approveApplicationMutation.mutate(record.id),
                    });
                  }}
                  loading={approveApplicationMutation.isPending}
                />
              </Tooltip>
              <Tooltip title="Reject">
                <Button
                  type="text"
                  icon={<CloseOutlined />}
                  style={{ color: '#ef4444' }}
                  onClick={() => {
                    setSelectedApplication(record);
                    setRejectModalVisible(true);
                  }}
                />
              </Tooltip>
            </>
          )}
        </Space>
      ),
    },
  ];

  const columns: ColumnsType<Farmer> = [
    {
      title: 'Farmer',
      key: 'farmer',
      width: 250,
      render: (_, record) => (
        <Space>
          <Badge dot status={record.isActive ? 'success' : 'default'} offset={[-5, 35]}>
            <Avatar
              size={45}
              src={record.profileImage || record.businessLogo}
              icon={<ShopOutlined />}
              style={{ backgroundColor: '#52c41a' }}
            />
          </Badge>
          <div>
            <Text strong style={{ color: '#4f46e5', cursor: 'pointer' }} onClick={() => handleViewFarmer(record)}>
              {record.businessName}
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              <UserOutlined style={{ marginRight: 4 }} />
              {record.firstName} {record.lastName}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Contact',
      key: 'contact',
      width: 180,
      render: (_, record) => (
        <Space orientation="vertical" size={0}>
          <Text copyable={{ text: record.phone }} style={{ fontSize: 13 }}>
            <PhoneOutlined style={{ marginRight: 4, color: '#06b6d4' }} />
            {record.phone}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            <MailOutlined style={{ marginRight: 4 }} />
            {record.email}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Location',
      key: 'location',
      width: 150,
      render: (_, record) => (
        <Space>
          <EnvironmentOutlined style={{ color: '#fa8c16' }} />
          <Text>
            {record.address?.city || record.city || 'N/A'}, {record.address?.state || record.state || 'N/A'}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Products',
      key: 'totalProducts',
      width: 90,
      align: 'center',
      render: (_, record) => (
        <Badge count={record.totalProducts || 0} style={{ backgroundColor: '#52c41a' }} showZero />
      ),
      sorter: true,
    },
    {
      title: 'Sales',
      key: 'totalSales',
      width: 90,
      align: 'center',
      render: (_, record) => (
        <Badge count={record.totalSales || 0} style={{ backgroundColor: '#4f46e5' }} showZero />
      ),
      sorter: true,
    },
    {
      title: 'Rating',
      key: 'rating',
      width: 100,
      render: (_, record) => (
        <Space>
          <StarOutlined style={{ color: '#fadb14' }} />
          <Text strong>{record.rating != null ? Number(record.rating).toFixed(1) : 'N/A'}</Text>
        </Space>
      ),
      sorter: true,
    },
    {
      title: 'Status',
      key: 'status',
      width: 130,
      render: (_, record) => (
        <Space orientation="vertical" size={4}>
          <Tag icon={record.isVerified ? <SafetyCertificateOutlined /> : <ClockCircleOutlined />} color={record.isVerified ? 'green' : 'orange'}>
            {record.isVerified ? 'VERIFIED' : 'UNVERIFIED'}
          </Tag>
          <Tag icon={record.isActive ? <CheckCircleOutlined /> : <StopOutlined />} color={record.isActive ? 'blue' : 'default'}>
            {record.isActive ? 'ACTIVE' : 'INACTIVE'}
          </Tag>
        </Space>
      ),
    },
    {
      title: 'Active',
      key: 'isActive',
      width: 80,
      render: (_, record) => (
        <Switch
          checked={record.isActive}
          onChange={(checked) => {
            if (checked !== record.isActive) {
              handleDeactivateFarmer(record);
            }
          }}
          loading={toggleStatusMutation.isPending}
        />
      ),
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
              onClick={() => handleViewFarmer(record)}
            />
          </Tooltip>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'verify',
                  label: 'Verify Farmer',
                  icon: <SafetyCertificateOutlined />,
                  disabled: record.isVerified,
                  onClick: () => {
                    modal.confirm({
                      title: 'Verify Farmer',
                      content: `Are you sure you want to verify ${record.businessName}?`,
                      onOk: () => verifyMutation.mutate(record.id),
                    });
                  },
                },
                { type: 'divider' },
                {
                  key: 'deactivate',
                  label: record.isActive ? 'Deactivate' : 'Activate',
                  icon: record.isActive ? <StopOutlined /> : <CheckCircleOutlined />,
                  danger: record.isActive,
                  onClick: () => handleDeactivateFarmer(record),
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
            <ShopOutlined style={{ marginRight: 12, color: '#52c41a' }} />
            Farmers Management
          </Title>
          <Text type="secondary">Manage farmers, verify accounts, and review applications</Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => { refetch(); refetchApplications(); }}>
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
              title="Total Farmers"
              value={total}
              prefix={<ShopOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="Verified Farmers"
              value={verifiedCount}
              prefix={<SafetyCertificateOutlined style={{ color: '#10b981' }} />}
              styles={{ content: { color: '#10b981' } }}
            />
            <Progress percent={verificationRate} size="small" strokeColor="#10b981" showInfo={false} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="Total Products"
              value={totalProducts}
              prefix={<InboxOutlined style={{ color: '#3b82f6' }} />}
              styles={{ content: { color: '#3b82f6' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="Pending Applications"
              value={pendingApplicationsCount}
              prefix={<IdcardOutlined style={{ color: '#f59e0b' }} />}
              styles={{ content: { color: '#f59e0b' } }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Tabs */}
      <Tabs
        activeKey={mainTab}
        onChange={setMainTab}
        items={[
          {
            key: 'list',
            label: (
              <span>
                <ShopOutlined />
                All Farmers
              </span>
            ),
            children: (
              <>
                {/* Filters */}
                <Card style={{ marginBottom: 16 }}>
                  <Space wrap size="middle">
                    <Input
                      placeholder="Search by name, business, phone..."
                      prefix={<SearchOutlined />}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      style={{ width: 280 }}
                      allowClear
                    />
                    <Select
                      placeholder="Filter by Status"
                      value={statusFilter}
                      onChange={setStatusFilter}
                      style={{ width: 160 }}
                      allowClear
                    >
                      <Select.Option value="verified">
                        <Tag color="green">Verified</Tag>
                      </Select.Option>
                      <Select.Option value="unverified">
                        <Tag color="orange">Unverified</Tag>
                      </Select.Option>
                      <Select.Option value="active">
                        <Tag color="blue">Active</Tag>
                      </Select.Option>
                      <Select.Option value="inactive">
                        <Tag color="default">Inactive</Tag>
                      </Select.Option>
                    </Select>
                    <Button
                      icon={<FilterOutlined />}
                      onClick={() => {
                        setSearch('');
                        setStatusFilter(undefined);
                      }}
                    >
                      Clear Filters
                    </Button>
                  </Space>
                </Card>

                {/* Farmers Table */}
                <Card>
                  <Table
                    columns={columns}
                    dataSource={farmers}
                    rowKey="id"
                    loading={isLoading}
                    scroll={{ x: 1400 }}
                    pagination={{
                      current: page,
                      pageSize,
                      total,
                      showSizeChanger: true,
                      showTotal: (total) => `Total ${total} farmers`,
                      onChange: (p, ps) => {
                        setPage(p);
                        setPageSize(ps);
                      },
                    }}
                  />
                </Card>
              </>
            ),
          },
          {
            key: 'applications',
            label: (
              <Badge count={pendingApplicationsCount} offset={[10, 0]} size="small">
                <span style={{ paddingRight: 8 }}>
                  <IdcardOutlined />
                  Applications
                </span>
              </Badge>
            ),
            children: (
              <>
                {/* Applications Filters */}
                <Card style={{ marginBottom: 16 }}>
                  <Space wrap size="middle">
                    <Input
                      placeholder="Search applications..."
                      prefix={<SearchOutlined />}
                      value={appSearch}
                      onChange={(e) => setAppSearch(e.target.value)}
                      style={{ width: 280 }}
                      allowClear
                    />
                    <Select
                      placeholder="Filter by Status"
                      value={appStatusFilter}
                      onChange={setAppStatusFilter}
                      style={{ width: 160 }}
                      allowClear
                    >
                      <Select.Option value="pending">
                        <Tag color="orange">Pending</Tag>
                      </Select.Option>
                      <Select.Option value="approved">
                        <Tag color="green">Approved</Tag>
                      </Select.Option>
                      <Select.Option value="rejected">
                        <Tag color="red">Rejected</Tag>
                      </Select.Option>
                    </Select>
                    <Button icon={<ReloadOutlined />} onClick={() => refetchApplications()}>
                      Refresh
                    </Button>
                  </Space>
                </Card>

                {/* Applications Table */}
                <Card>
                  <Table
                    columns={applicationColumns}
                    dataSource={applications}
                    rowKey="id"
                    loading={applicationsLoading}
                    scroll={{ x: 1200 }}
                    pagination={{
                      current: appPage,
                      pageSize: appPageSize,
                      total: applicationsTotal,
                      showSizeChanger: true,
                      showTotal: (total) => `Total ${total} applications`,
                      onChange: (p, ps) => {
                        setAppPage(p);
                        setAppPageSize(ps);
                      },
                    }}
                  />
                </Card>
              </>
            ),
          },
        ]}
      />

      {/* Farmer Details Drawer */}
      <Drawer
        title={
          <Space>
            <ShopOutlined style={{ color: '#52c41a' }} />
            <span>Farmer Details</span>
            {selectedFarmer && (
              <>
                <Tag icon={selectedFarmer.isVerified ? <SafetyCertificateOutlined /> : <ClockCircleOutlined />} color={selectedFarmer.isVerified ? 'green' : 'orange'}>
                  {selectedFarmer.isVerified ? 'VERIFIED' : 'UNVERIFIED'}
                </Tag>
                <Tag color={selectedFarmer.isActive ? 'blue' : 'default'}>
                  {selectedFarmer.isActive ? 'ACTIVE' : 'INACTIVE'}
                </Tag>
              </>
            )}
          </Space>
        }
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        size="large"
        extra={
          selectedFarmer && (
            <Space>
              {!selectedFarmer.isVerified && (
                <Button
                  type="primary"
                  icon={<SafetyCertificateOutlined />}
                  onClick={() => {
                    modal.confirm({
                      title: 'Verify Farmer',
                      content: `Are you sure you want to verify ${selectedFarmer.businessName}?`,
                      onOk: () => verifyMutation.mutate(selectedFarmer.id),
                    });
                  }}
                  loading={verifyMutation.isPending}
                  style={{ backgroundColor: '#10b981' }}
                >
                  Verify
                </Button>
              )}
              <Button
                type={selectedFarmer.isActive ? 'default' : 'primary'}
                danger={selectedFarmer.isActive}
                onClick={() => handleDeactivateFarmer(selectedFarmer)}
                loading={toggleStatusMutation.isPending}
              >
                {selectedFarmer.isActive ? 'Deactivate' : 'Activate'}
              </Button>
            </Space>
          )
        }
      >
        {selectedFarmer && (
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: 'details',
                label: 'Profile',
                icon: <UserOutlined />,
                children: (
                  <Space orientation="vertical" size="large" style={{ width: '100%' }}>
                    {/* Business Header */}
                    <Card size="small">
                      <div style={{ textAlign: 'center', padding: '16px 0' }}>
                        <Avatar
                          size={80}
                          src={selectedFarmer.businessLogo || selectedFarmer.profileImage}
                          icon={<ShopOutlined />}
                          style={{ backgroundColor: '#52c41a' }}
                        />
                        <Title level={4} style={{ marginTop: 12, marginBottom: 4 }}>
                          {selectedFarmer.businessName}
                        </Title>
                        <Text type="secondary">{selectedFarmer.firstName} {selectedFarmer.lastName}</Text>
                        {selectedFarmer.businessDescription && (
                          <Paragraph type="secondary" style={{ marginTop: 8 }}>
                            {selectedFarmer.businessDescription}
                          </Paragraph>
                        )}
                      </div>
                    </Card>

                    {/* Contact Info */}
                    <Card size="small" title="Contact Information">
                      <Descriptions column={1} size="small">
                        <Descriptions.Item label="Phone">
                          <Text copyable>{selectedFarmer.phone}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Email">
                          <Text copyable>{selectedFarmer.email}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Location">
                          <Space>
                            <EnvironmentOutlined style={{ color: '#fa8c16' }} />
                            {selectedFarmer.address?.street || 'N/A'}, {selectedFarmer.address?.city || selectedFarmer.city || 'N/A'}, {selectedFarmer.address?.state || selectedFarmer.state || 'N/A'}
                          </Space>
                        </Descriptions.Item>
                        <Descriptions.Item label="Joined">
                          {dayjs(selectedFarmer.createdAt).format('MMM DD, YYYY')}
                        </Descriptions.Item>
                      </Descriptions>
                    </Card>

                    {/* Stats */}
                    <Card size="small" title="Performance">
                      <Row gutter={16}>
                        <Col span={8}>
                          <Statistic
                            title="Rating"
                            value={selectedFarmer.rating || 0}
                            prefix={<StarOutlined style={{ color: '#fadb14' }} />}
                            precision={1}
                          />
                        </Col>
                        <Col span={8}>
                          <Statistic
                            title="Products"
                            value={selectedFarmer.totalProducts || 0}
                            prefix={<InboxOutlined style={{ color: '#52c41a' }} />}
                          />
                        </Col>
                        <Col span={8}>
                          <Statistic
                            title="Sales"
                            value={selectedFarmer.totalSales || 0}
                            prefix={<ShoppingOutlined style={{ color: '#4f46e5' }} />}
                          />
                        </Col>
                      </Row>
                    </Card>

                    {/* Revenue */}
                    {selectedFarmer.revenue && (
                      <Card size="small" title={<><DollarOutlined style={{ marginRight: 8 }} /> Revenue</>}>
                        <Row gutter={16}>
                          <Col span={12}>
                            <Statistic
                              title="Total Revenue"
                              value={selectedFarmer.revenue.total || 0}
                              formatter={(v) => formatCurrency(Number(v))}
                            />
                          </Col>
                          <Col span={12}>
                            <Statistic
                              title="This Month"
                              value={selectedFarmer.revenue.thisMonth || 0}
                              formatter={(v) => formatCurrency(Number(v))}
                              styles={{ content: { color: '#52c41a' } }}
                            />
                          </Col>
                        </Row>
                      </Card>
                    )}
                  </Space>
                ),
              },
              {
                key: 'products',
                label: `Products (${selectedFarmer.products?.length || 0})`,
                icon: <InboxOutlined />,
                children: (
                  <Table
                    dataSource={selectedFarmer.products || []}
                    rowKey="id"
                    size="small"
                    pagination={false}
                    columns={[
                      {
                        title: 'Product',
                        key: 'product',
                        render: (_, record) => (
                          <Space>
                            <Image
                              src={record.image || '/placeholder-product.png'}
                              alt={record.name}
                              width={40}
                              height={40}
                              style={{ borderRadius: 4, objectFit: 'cover' }}
                              fallback="/placeholder-product.png"
                            />
                            <Text>{record.name}</Text>
                          </Space>
                        ),
                      },
                      {
                        title: 'Price',
                        key: 'price',
                        render: (_, record) => (
                          <Text strong style={{ color: '#52c41a' }}>
                            {formatCurrency(record.price)}/{record.unit}
                          </Text>
                        ),
                      },
                      {
                        title: 'Stock',
                        dataIndex: 'stock',
                        render: (stock: number) => (
                          <Badge
                            status={stock > 10 ? 'success' : stock > 0 ? 'warning' : 'error'}
                            text={stock}
                          />
                        ),
                      },
                      {
                        title: 'Status',
                        dataIndex: 'isActive',
                        render: (isActive: boolean) => (
                          <Tag color={isActive ? 'green' : 'default'}>
                            {isActive ? 'Active' : 'Inactive'}
                          </Tag>
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

      {/* Application Details Drawer */}
      <Drawer
        title={
          <Space>
            <IdcardOutlined style={{ color: '#f59e0b' }} />
            <span>Farmer Application</span>
            {selectedApplication && (
              <Tag
                icon={
                  selectedApplication.applicationStatus === 'pending' ? <ClockCircleOutlined /> :
                  selectedApplication.applicationStatus === 'approved' ? <CheckCircleOutlined /> :
                  <CloseOutlined />
                }
                color={
                  selectedApplication.applicationStatus === 'pending' ? 'orange' :
                  selectedApplication.applicationStatus === 'approved' ? 'green' : 'red'
                }
              >
                {selectedApplication.applicationStatus.toUpperCase()}
              </Tag>
            )}
          </Space>
        }
        open={applicationDrawerVisible}
        onClose={() => {
          setApplicationDrawerVisible(false);
          setSelectedApplication(null);
        }}
        size="large"
        extra={
          selectedApplication && selectedApplication.applicationStatus === 'pending' && (
            <Space>
              <Button
                type="primary"
                icon={<CheckOutlined />}
                onClick={() => approveApplicationMutation.mutate(selectedApplication.id)}
                loading={approveApplicationMutation.isPending}
                style={{ background: '#10b981' }}
              >
                Approve
              </Button>
              <Button
                danger
                icon={<CloseOutlined />}
                onClick={() => setRejectModalVisible(true)}
              >
                Reject
              </Button>
            </Space>
          )
        }
      >
        {selectedApplication && (
          <Space orientation="vertical" size="large" style={{ width: '100%' }}>
            {/* Status Banner */}
            {selectedApplication.applicationStatus === 'pending' && (
              <Alert
                message="Pending Review"
                description="This farmer application is awaiting admin review. Once approved, they can start listing products."
                type="warning"
                showIcon
              />
            )}
            {selectedApplication.applicationStatus === 'rejected' && (
              <Alert
                message="Application Rejected"
                description={selectedApplication.rejectionReason || 'No reason provided'}
                type="error"
                showIcon
              />
            )}
            {selectedApplication.applicationStatus === 'approved' && (
              <Alert
                message="Application Approved"
                description="This farmer has been approved and can now list products."
                type="success"
                showIcon
              />
            )}

            {/* Applicant Info */}
            <Card size="small">
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <Avatar size={80} src={selectedApplication.profileImage} icon={<ShopOutlined />} style={{ backgroundColor: '#52c41a' }} />
                <Title level={4} style={{ marginTop: 12, marginBottom: 4 }}>
                  {selectedApplication.firstName} {selectedApplication.lastName}
                </Title>
                <Text type="secondary">{selectedApplication.email}</Text>
              </div>
            </Card>

            {/* Contact */}
            <Card size="small" title="Contact Information">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Phone">
                  <Text copyable>{selectedApplication.phone}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Email">
                  <Text copyable>{selectedApplication.email}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Location">
                  <Space>
                    <EnvironmentOutlined style={{ color: '#fa8c16' }} />
                    {selectedApplication.city}, {selectedApplication.state}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="Applied On">
                  {dayjs(selectedApplication.createdAt).format('MMM DD, YYYY')}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Farm Info */}
            <Card size="small" title="Farm Information">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Farm Name">
                  <Text strong style={{ color: '#52c41a' }}>{selectedApplication.farmName}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Farm Type">
                  <Tag color="green">{selectedApplication.farmType}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Farm Size">
                  <Tag color="cyan">{selectedApplication.farmSize}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Farm Address">{selectedApplication.farmAddress}</Descriptions.Item>
                <Descriptions.Item label="Primary Products">{selectedApplication.primaryProducts}</Descriptions.Item>
                <Descriptions.Item label="Experience">
                  <Tag color="blue">{selectedApplication.yearsOfExperience} years</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Has Transportation">
                  <Tag color={selectedApplication.hasTransportation ? 'green' : 'orange'}>
                    {selectedApplication.hasTransportation ? 'Yes' : 'No'}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Bank Details */}
            <Card size="small" title={<><BankOutlined style={{ marginRight: 8 }} /> Bank Details</>}>
              <Descriptions column={1} size="small">
                {selectedApplication.businessRegistrationNumber && (
                  <Descriptions.Item label="Business Reg. No">
                    {selectedApplication.businessRegistrationNumber}
                  </Descriptions.Item>
                )}
                <Descriptions.Item label="Bank Name">{selectedApplication.bankName}</Descriptions.Item>
                <Descriptions.Item label="Account Number">
                  <Text copyable>{selectedApplication.bankAccountNumber}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Account Name">{selectedApplication.bankAccountName}</Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Documents */}
            <Card size="small" title={<><FileImageOutlined style={{ marginRight: 8 }} /> Verification Documents</>}>
              <Row gutter={16}>
                <Col span={12}>
                  <Card size="small" title="ID Document" style={{ textAlign: 'center' }}>
                    <Image
                      src={selectedApplication.farmerId}
                      alt="ID Document"
                      width="100%"
                      style={{ borderRadius: 8 }}
                    />
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small" title="Farm Photo" style={{ textAlign: 'center' }}>
                    <Image
                      src={selectedApplication.farmPhotos}
                      alt="Farm Photo"
                      width="100%"
                      style={{ borderRadius: 8 }}
                    />
                  </Card>
                </Col>
              </Row>
            </Card>
          </Space>
        )}
      </Drawer>

      {/* Rejection Modal */}
      <Modal
        title={<><CloseOutlined style={{ color: '#ef4444', marginRight: 8 }} /> Reject Farmer Application</>}
        open={rejectModalVisible}
        onCancel={() => {
          setRejectModalVisible(false);
          setRejectionReason('');
        }}
        onOk={() => {
          if (selectedApplication && rejectionReason.trim()) {
            rejectApplicationMutation.mutate({
              applicationId: selectedApplication.id,
              reason: rejectionReason,
            });
          } else {
            message.warning('Please provide a reason for rejection');
          }
        }}
        okText="Reject Application"
        okButtonProps={{
          danger: true,
          loading: rejectApplicationMutation.isPending,
        }}
      >
        <Alert
          type="warning"
          message="This action cannot be undone"
          description="The applicant will be notified of the rejection and the reason provided."
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Text>Please provide a reason for rejecting this application:</Text>
        <TextArea
          rows={4}
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          placeholder="Enter rejection reason..."
          style={{ marginTop: 12 }}
        />
      </Modal>
    </div>
  );
}
