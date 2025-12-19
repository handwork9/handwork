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
  message,
  Tabs,
  Modal,
  Alert,
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
  farmerId: string; // ID document image URL
  farmPhotos: string; // Farm photo URL
  applicationStatus: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
  state: string;
  city: string;
}

const formatCurrency = (value: number) => `₦${value.toLocaleString()}`;

export default function FarmersPage() {
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
      return response.data.data;
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
      return response.data.data;
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

  // Application table columns
  const applicationColumns: ColumnsType<FarmerApplication> = [
    {
      title: 'Applicant',
      key: 'applicant',
      render: (_, record) => (
        <Space>
          <Avatar size={40} src={record.profileImage} icon={<ShopOutlined />} />
          <div>
            <Text strong>
              {record.firstName} {record.lastName}
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.phone}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Farm Info',
      key: 'farm',
      render: (_, record) => (
        <div>
          <Text strong>{record.farmName}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.farmType} • {record.farmSize}
          </Text>
        </div>
      ),
    },
    {
      title: 'Location',
      key: 'location',
      render: (_, record) => (
        <Space>
          <EnvironmentOutlined />
          <Text>{record.city}, {record.state}</Text>
        </Space>
      ),
    },
    {
      title: 'Products',
      key: 'products',
      render: (_, record) => (
        <Text type="secondary">{record.primaryProducts}</Text>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => {
        const statusColors = {
          pending: 'orange',
          approved: 'green',
          rejected: 'red',
        };
        return (
          <Tag color={statusColors[record.applicationStatus]}>
            {record.applicationStatus.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: 'Applied',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleViewApplication(record)}
          />
          {record.applicationStatus === 'pending' && (
            <>
              <Button
                type="text"
                icon={<CheckOutlined />}
                style={{ color: '#10b981' }}
                onClick={() => approveApplicationMutation.mutate(record.id)}
                loading={approveApplicationMutation.isPending}
              />
              <Button
                type="text"
                icon={<CloseOutlined />}
                style={{ color: '#ef4444' }}
                onClick={() => {
                  setSelectedApplication(record);
                  setRejectModalVisible(true);
                }}
              />
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
      render: (_, record) => (
        <Space>
          <Avatar
            size={40}
            src={record.profileImage || record.businessLogo}
            icon={<ShopOutlined />}
          />
          <div>
            <Text strong>{record.businessName}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.firstName} {record.lastName}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (_, record) => (
        <div>
          <Text>{record.phone}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.email}
          </Text>
        </div>
      ),
    },
    {
      title: 'Location',
      key: 'location',
      render: (_, record) => (
        <Space>
          <EnvironmentOutlined />
          <Text>
            {record.address.city}, {record.address.state}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Products',
      dataIndex: 'totalProducts',
      key: 'totalProducts',
      sorter: true,
    },
    {
      title: 'Sales',
      dataIndex: 'totalSales',
      key: 'totalSales',
      sorter: true,
    },
    {
      title: 'Rating',
      dataIndex: 'rating',
      key: 'rating',
      render: (rating: number) => (
        <Space>
          <StarOutlined style={{ color: '#fadb14' }} />
          <Text>{rating.toFixed(1)}</Text>
        </Space>
      ),
      sorter: true,
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <Space orientation="vertical" size={0}>
          <Tag color={record.isVerified ? 'green' : 'orange'}>
            {record.isVerified ? 'VERIFIED' : 'UNVERIFIED'}
          </Tag>
          <Tag color={record.isActive ? 'blue' : 'default'}>
            {record.isActive ? 'ACTIVE' : 'INACTIVE'}
          </Tag>
        </Space>
      ),
    },
    {
      title: 'Active',
      key: 'isActive',
      render: (_, record) => (
        <Switch
          checked={record.isActive}
          onChange={(checked) =>
            toggleStatusMutation.mutate({
              farmerId: record.id,
              isActive: checked,
            })
          }
          loading={toggleStatusMutation.isPending}
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleViewFarmer(record)}
          />
        </Space>
      ),
    },
  ];

  // Mock data for development
  const mockFarmers: Farmer[] = [
    {
      id: '1',
      firstName: 'Adebayo',
      lastName: 'Ogundimu',
      email: 'adebayo@freshfarm.com',
      phone: '+234 802 987 6543',
      businessName: 'Fresh Farm Produce',
      businessDescription: 'We provide fresh organic vegetables and fruits directly from our farm in Ogun State.',
      isVerified: true,
      isActive: true,
      rating: 4.8,
      totalSales: 342,
      totalProducts: 24,
      address: {
        street: '15 Farm Road',
        city: 'Abeokuta',
        state: 'Ogun',
      },
      createdAt: '2024-01-10',
      revenue: { total: 4500000, thisMonth: 850000 },
      products: [
        { id: 'p1', name: 'Fresh Tomatoes', price: 2000, unit: 'kg', stock: 150, isActive: true },
        { id: 'p2', name: 'Red Onions', price: 1500, unit: 'kg', stock: 200, isActive: true },
        { id: 'p3', name: 'Green Peppers', price: 1800, unit: 'kg', stock: 80, isActive: true },
      ],
    },
    {
      id: '2',
      firstName: 'Funke',
      lastName: 'Adeyemi',
      email: 'funke@organicgardens.com',
      phone: '+234 808 876 5432',
      businessName: 'Organic Gardens',
      businessDescription: 'Premium organic vegetables grown with love and care.',
      isVerified: true,
      isActive: true,
      rating: 4.9,
      totalSales: 256,
      totalProducts: 18,
      address: {
        street: '23 Green Lane',
        city: 'Ibadan',
        state: 'Oyo',
      },
      createdAt: '2024-02-05',
      revenue: { total: 3200000, thisMonth: 620000 },
      products: [
        { id: 'p4', name: 'Organic Carrots', price: 3000, unit: 'kg', stock: 100, isActive: true },
        { id: 'p5', name: 'Fresh Lettuce', price: 2500, unit: 'bunch', stock: 50, isActive: true },
      ],
    },
    {
      id: '3',
      firstName: 'Emeka',
      lastName: 'Nwosu',
      email: 'emeka@harvest.ng',
      phone: '+234 805 432 1098',
      businessName: 'Harvest Nigeria',
      businessDescription: 'Quality grains and tubers from the heart of Nigeria.',
      isVerified: false,
      isActive: true,
      rating: 4.5,
      totalSales: 89,
      totalProducts: 12,
      address: {
        street: '8 Market Road',
        city: 'Enugu',
        state: 'Enugu',
      },
      createdAt: '2024-03-01',
      revenue: { total: 980000, thisMonth: 280000 },
      products: [
        { id: 'p6', name: 'Local Rice', price: 35000, unit: 'bag', stock: 30, isActive: true },
        { id: 'p7', name: 'Yam Tubers', price: 5000, unit: 'tuber', stock: 45, isActive: true },
      ],
    },
  ];

  // Mock farmer applications data
  const mockFarmerApplications: FarmerApplication[] = [
    {
      id: 'fapp-1',
      firstName: 'Chijioke',
      lastName: 'Okoro',
      email: 'chijioke@email.com',
      phone: '+234 803 456 7890',
      farmName: 'Okoro Farms',
      farmType: 'Crop Farm',
      farmSize: '5 hectares',
      farmAddress: '15 Farm Settlement, Nsukka',
      primaryProducts: 'Maize, Cassava, Vegetables',
      yearsOfExperience: '8',
      hasTransportation: true,
      businessRegistrationNumber: 'BN-2024-123456',
      bankName: 'First Bank',
      bankAccountNumber: '3012345678',
      bankAccountName: 'Chijioke Okoro',
      farmerId: 'https://via.placeholder.com/300x200?text=NIN+Card',
      farmPhotos: 'https://via.placeholder.com/300x200?text=Farm+Photo',
      applicationStatus: 'pending',
      createdAt: '2024-03-15',
      state: 'Enugu',
      city: 'Nsukka',
    },
    {
      id: 'fapp-2',
      firstName: 'Fatimah',
      lastName: 'Abdullahi',
      email: 'fatimah@email.com',
      phone: '+234 806 789 0123',
      farmName: 'Fatimah Poultry & Eggs',
      farmType: 'Poultry',
      farmSize: '2 hectares',
      farmAddress: 'KM 5 Zaria Road, Kaduna',
      primaryProducts: 'Eggs, Chicken, Turkey',
      yearsOfExperience: '5',
      hasTransportation: false,
      bankName: 'Jaiz Bank',
      bankAccountNumber: '0012345678',
      bankAccountName: 'Fatimah Abdullahi',
      farmerId: 'https://via.placeholder.com/300x200?text=Voters+Card',
      farmPhotos: 'https://via.placeholder.com/300x200?text=Poultry+Farm',
      applicationStatus: 'pending',
      createdAt: '2024-03-18',
      state: 'Kaduna',
      city: 'Kaduna',
    },
  ];

  const farmers = farmersData?.items || mockFarmers;
  const total = farmersData?.total || mockFarmers.length;
  const applications = applicationsData?.items || mockFarmerApplications;
  const applicationsTotal = applicationsData?.total || mockFarmerApplications.length;
  const pendingApplicationsCount = applications.filter((a: FarmerApplication) => a.applicationStatus === 'pending').length;

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
            Farmers
          </Title>
          <Text type="secondary">Manage farmers and their products</Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
            Refresh
          </Button>
          <Button icon={<ExportOutlined />}>Export</Button>
        </Space>
      </div>

      {/* Stats */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Farmers"
              value={total}
              prefix={<ShopOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Verified"
              value={farmers.filter((f: Farmer) => f.isVerified).length}
              styles={{ content: { color: '#10b981' } }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Products"
              value={farmers.reduce((sum: number, f: Farmer) => sum + f.totalProducts, 0)}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Pending Applications"
              value={pendingApplicationsCount}
              styles={{ content: { color: '#f59e0b' } }}
              prefix={<IdcardOutlined />}
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
            label: 'All Farmers',
            children: (
              <>
                {/* Filters */}
                <Card style={{ marginBottom: 16 }}>
                  <Space wrap>
                    <Input
                      placeholder="Search farmers..."
                      prefix={<SearchOutlined />}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      style={{ width: 250 }}
                      allowClear
                    />
                    <Select
                      placeholder="All Statuses"
                      value={statusFilter}
                      onChange={setStatusFilter}
                      style={{ width: 150 }}
                      allowClear
                      options={[
                        { value: 'verified', label: 'Verified' },
                        { value: 'unverified', label: 'Unverified' },
                        { value: 'active', label: 'Active' },
                        { value: 'inactive', label: 'Inactive' },
                      ]}
                    />
                    <Select
                      placeholder="All States"
                      style={{ width: 150 }}
                      allowClear
                      options={[
                        { value: 'lagos', label: 'Lagos' },
                        { value: 'ogun', label: 'Ogun' },
                        { value: 'oyo', label: 'Oyo' },
                        { value: 'enugu', label: 'Enugu' },
                      ]}
                    />
                  </Space>
                </Card>

                {/* Farmers Table */}
                <Card>
                  <Table
                    columns={columns}
                    dataSource={farmers}
                    rowKey="id"
                    loading={isLoading}
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
                Applications
              </Badge>
            ),
            children: (
              <>
                {/* Applications Filters */}
                <Card style={{ marginBottom: 16 }}>
                  <Space wrap>
                    <Input
                      placeholder="Search applications..."
                      prefix={<SearchOutlined />}
                      value={appSearch}
                      onChange={(e) => setAppSearch(e.target.value)}
                      style={{ width: 250 }}
                      allowClear
                    />
                    <Select
                      placeholder="All Statuses"
                      value={appStatusFilter}
                      onChange={setAppStatusFilter}
                      style={{ width: 150 }}
                      allowClear
                      options={[
                        { value: 'pending', label: 'Pending' },
                        { value: 'approved', label: 'Approved' },
                        { value: 'rejected', label: 'Rejected' },
                      ]}
                    />
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
        title="Farmer Details"
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        size="large"
      >
        {selectedFarmer && (
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: 'details',
                label: 'Details',
                children: (
                  <>
                    <div style={{ textAlign: 'center', marginBottom: 24 }}>
                      <Avatar
                        size={80}
                        src={selectedFarmer.businessLogo || selectedFarmer.profileImage}
                        icon={<ShopOutlined />}
                      />
                      <Title level={4} style={{ marginTop: 12, marginBottom: 4 }}>
                        {selectedFarmer.businessName}
                      </Title>
                      <Space>
                        <Tag color={selectedFarmer.isVerified ? 'green' : 'orange'}>
                          {selectedFarmer.isVerified ? 'VERIFIED' : 'UNVERIFIED'}
                        </Tag>
                        <Tag color={selectedFarmer.isActive ? 'blue' : 'default'}>
                          {selectedFarmer.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </Tag>
                      </Space>
                    </div>

                    {selectedFarmer.businessDescription && (
                      <Paragraph type="secondary" style={{ textAlign: 'center' }}>
                        {selectedFarmer.businessDescription}
                      </Paragraph>
                    )}

                    <Descriptions column={1} bordered size="small">
                      <Descriptions.Item label="Owner">
                        {selectedFarmer.firstName} {selectedFarmer.lastName}
                      </Descriptions.Item>
                      <Descriptions.Item label="Phone">
                        <Space>
                          <PhoneOutlined />
                          {selectedFarmer.phone}
                        </Space>
                      </Descriptions.Item>
                      <Descriptions.Item label="Email">{selectedFarmer.email}</Descriptions.Item>
                      <Descriptions.Item label="Location">
                        {selectedFarmer.address.street}, {selectedFarmer.address.city},{' '}
                        {selectedFarmer.address.state}
                      </Descriptions.Item>
                      <Descriptions.Item label="Rating">
                        <Rate disabled defaultValue={selectedFarmer.rating} style={{ fontSize: 14 }} />
                        <Text style={{ marginLeft: 8 }}>({selectedFarmer.rating})</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Total Sales">
                        {selectedFarmer.totalSales}
                      </Descriptions.Item>
                      <Descriptions.Item label="Joined">
                        {dayjs(selectedFarmer.createdAt).format('MMM DD, YYYY')}
                      </Descriptions.Item>
                    </Descriptions>

                    <Divider>Revenue</Divider>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Statistic
                          title="Total Revenue"
                          value={selectedFarmer.revenue.total}
                          formatter={(v) => formatCurrency(Number(v))}
                        />
                      </Col>
                      <Col span={12}>
                        <Statistic
                          title="This Month"
                          value={selectedFarmer.revenue.thisMonth}
                          formatter={(v) => formatCurrency(Number(v))}
                        />
                      </Col>
                    </Row>

                    <Divider />
                    <Space style={{ width: '100%', justifyContent: 'center' }}>
                      {!selectedFarmer.isVerified && (
                        <Button
                          type="primary"
                          icon={<CheckCircleOutlined />}
                          onClick={() => {
                            Modal.confirm({
                              title: 'Verify Farmer',
                              content: `Are you sure you want to verify ${selectedFarmer.businessName}?`,
                              onOk: () => verifyMutation.mutate(selectedFarmer.id),
                            });
                          }}
                          loading={verifyMutation.isPending}
                        >
                          Verify Farmer
                        </Button>
                      )}
                      <Button
                        type={selectedFarmer.isActive ? 'default' : 'primary'}
                        danger={selectedFarmer.isActive}
                        onClick={() =>
                          toggleStatusMutation.mutate({
                            farmerId: selectedFarmer.id,
                            isActive: !selectedFarmer.isActive,
                          })
                        }
                        loading={toggleStatusMutation.isPending}
                      >
                        {selectedFarmer.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </Space>
                  </>
                ),
              },
              {
                key: 'products',
                label: `Products (${selectedFarmer.products.length})`,
                children: (
                  <Table
                    dataSource={selectedFarmer.products}
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
                          <Text>
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
        title="Farmer Application Details"
        open={applicationDrawerVisible}
        onClose={() => {
          setApplicationDrawerVisible(false);
          setSelectedApplication(null);
        }}
        size="large"
      >
        {selectedApplication && (
          <>
            {/* Application Status Banner */}
            {selectedApplication.applicationStatus === 'pending' && (
              <Alert
                title="Pending Review"
                description="This farmer application is awaiting admin review. Once approved, they can start listing products."
                type="warning"
                showIcon
                style={{ marginBottom: 24 }}
              />
            )}
            {selectedApplication.applicationStatus === 'rejected' && (
              <Alert
                title="Application Rejected"
                description={selectedApplication.rejectionReason || 'No reason provided'}
                type="error"
                showIcon
                style={{ marginBottom: 24 }}
              />
            )}
            {selectedApplication.applicationStatus === 'approved' && (
              <Alert
                title="Application Approved"
                description="This farmer has been approved and can now list products."
                type="success"
                showIcon
                style={{ marginBottom: 24 }}
              />
            )}

            {/* Applicant Info */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Avatar size={80} src={selectedApplication.profileImage} icon={<ShopOutlined />} />
              <Title level={4} style={{ marginTop: 12, marginBottom: 4 }}>
                {selectedApplication.firstName} {selectedApplication.lastName}
              </Title>
              <Text type="secondary">{selectedApplication.email}</Text>
            </div>

            <Descriptions column={1} bordered size="small" title="Contact Information">
              <Descriptions.Item label="Phone">
                <Space>
                  <PhoneOutlined />
                  {selectedApplication.phone}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Email">{selectedApplication.email}</Descriptions.Item>
              <Descriptions.Item label="Location">
                <Space>
                  <EnvironmentOutlined />
                  {selectedApplication.city}, {selectedApplication.state}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Applied On">{selectedApplication.createdAt}</Descriptions.Item>
            </Descriptions>

            <Divider />

            <Descriptions column={1} bordered size="small" title="Farm Information">
              <Descriptions.Item label="Farm Name">{selectedApplication.farmName}</Descriptions.Item>
              <Descriptions.Item label="Farm Type">{selectedApplication.farmType}</Descriptions.Item>
              <Descriptions.Item label="Farm Size">{selectedApplication.farmSize}</Descriptions.Item>
              <Descriptions.Item label="Farm Address">{selectedApplication.farmAddress}</Descriptions.Item>
              <Descriptions.Item label="Primary Products">{selectedApplication.primaryProducts}</Descriptions.Item>
              <Descriptions.Item label="Experience">{selectedApplication.yearsOfExperience} years</Descriptions.Item>
              <Descriptions.Item label="Has Transportation">
                <Tag color={selectedApplication.hasTransportation ? 'green' : 'orange'}>
                  {selectedApplication.hasTransportation ? 'Yes' : 'No'}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Descriptions column={1} bordered size="small" title="Business & Bank Details">
              {selectedApplication.businessRegistrationNumber && (
                <Descriptions.Item label="Business Reg. No">
                  {selectedApplication.businessRegistrationNumber}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Bank Name">
                <Space>
                  <BankOutlined />
                  {selectedApplication.bankName}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Account Number">{selectedApplication.bankAccountNumber}</Descriptions.Item>
              <Descriptions.Item label="Account Name">{selectedApplication.bankAccountName}</Descriptions.Item>
            </Descriptions>

            <Divider />

            <Title level={5}>
              <FileImageOutlined style={{ marginRight: 8 }} />
              Verification Documents
            </Title>

            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={12}>
                <Card size="small" title="ID Document">
                  <Image
                    src={selectedApplication.farmerId}
                    alt="ID Document"
                    width="100%"
                    style={{ borderRadius: 8 }}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="Farm Photo">
                  <Image
                    src={selectedApplication.farmPhotos}
                    alt="Farm Photo"
                    width="100%"
                    style={{ borderRadius: 8 }}
                  />
                </Card>
              </Col>
            </Row>

            <Divider />

            {/* Action Buttons */}
            {selectedApplication.applicationStatus === 'pending' && (
              <Space style={{ width: '100%', justifyContent: 'center' }}>
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={() => approveApplicationMutation.mutate(selectedApplication.id)}
                  loading={approveApplicationMutation.isPending}
                  style={{ background: '#10b981' }}
                >
                  Approve Application
                </Button>
                <Button
                  danger
                  icon={<CloseOutlined />}
                  onClick={() => setRejectModalVisible(true)}
                >
                  Reject Application
                </Button>
              </Space>
            )}
          </>
        )}
      </Drawer>

      {/* Rejection Modal */}
      <Modal
        title="Reject Farmer Application"
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
