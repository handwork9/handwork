'use client';

import { useState, useEffect, useRef } from 'react';
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
  Badge,
  App,
  Tabs,
  Modal,
  Image,
  Alert,
} from 'antd';
import {
  SearchOutlined,
  UserOutlined,
  PhoneOutlined,
  CarOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
  IdcardOutlined,
  HomeOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import type { ColumnsType } from 'antd/es/table';
import mapboxgl from 'mapbox-gl';

// Mapbox CSS loaded via CDN in layout to avoid type issues
// import 'mapbox-gl/dist/mapbox-gl.css';

const { Title, Text } = Typography;
const { TextArea } = Input;

// Set Mapbox access token (you'll need to configure this)
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface Rider {
  id: string;
  name: string;  // Backend uses single name field
  firstName?: string;  // For backwards compat with mock data
  lastName?: string;
  email: string;
  phone: string;
  profileImage?: string;
  avatar?: string;
  isVerified: boolean;
  isActive: boolean;
  isOnline?: boolean;
  rating?: number;
  totalDeliveries?: number;
  vehicleType?: string;
  vehiclePlate?: string;
  currentLocation?: {
    lat: number;
    lng: number;
  };
  createdAt: string;
  earnings?: {
    today: number;
    week: number;
    month: number;
  };
  rider?: {  // Rider profile from relation
    vehicleType?: string;
    vehiclePlate?: string;
    isOnline?: boolean;
    rating?: number;
    totalDeliveries?: number;
  };
}

interface RiderGuarantor {
  id: string;
  name: string;
  phone: string;
  address: string;
  occupation: string;
  relationship: string;
  idImage: string;
  isVerified: boolean;
}

interface RiderApplication {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profileImage?: string;
  vehicleType: string;
  vehiclePlate: string;
  vehicleColor: string;
  vehicleModel: string;
  vehicleYear: string;
  driversLicenseImage: string;
  applicationStatus: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  guarantors: RiderGuarantor[];
  createdAt: string;
}

const formatCurrency = (value: number) => `₦${value.toLocaleString()}`;

// Mock data for development (defined at module scope to avoid dependency issues)
const mockRiders: Rider[] = [
  {
    id: '1',
    name: 'John Adamu',
    firstName: 'John',
    lastName: 'Adamu',
    email: 'john@example.com',
    phone: '+234 806 555 1234',
    isVerified: true,
    isActive: true,
    isOnline: true,
    rating: 4.9,
    totalDeliveries: 156,
    vehicleType: 'Motorcycle',
    vehiclePlate: 'LAG-234-AB',
    currentLocation: { lat: 6.4541, lng: 3.3947 },
    createdAt: '2024-01-15',
    earnings: { today: 12500, week: 85000, month: 320000 },
  },
  {
    id: '2',
    name: 'Ibrahim Musa',
    firstName: 'Ibrahim',
    lastName: 'Musa',
    email: 'ibrahim@example.com',
    phone: '+234 807 666 2345',
    isVerified: true,
    isActive: true,
    isOnline: true,
    rating: 4.8,
    totalDeliveries: 142,
    vehicleType: 'Motorcycle',
    vehiclePlate: 'LAG-567-CD',
    currentLocation: { lat: 6.4301, lng: 3.4219 },
    createdAt: '2024-02-01',
    earnings: { today: 9800, week: 72000, month: 285000 },
  },
  {
    id: '3',
    name: 'Chukwu Emmanuel',
    firstName: 'Chukwu',
    lastName: 'Emmanuel',
    email: 'chukwu@example.com',
    phone: '+234 808 777 3456',
    isVerified: true,
    isActive: true,
    isOnline: false,
    rating: 4.7,
    totalDeliveries: 128,
    vehicleType: 'Bicycle',
    vehiclePlate: 'N/A',
    createdAt: '2024-02-15',
    earnings: { today: 0, week: 45000, month: 195000 },
  },
];

// Mock applications data for development
const mockApplications: RiderApplication[] = [
  {
    id: 'app-1',
    firstName: 'Adebayo',
    lastName: 'Olakunle',
    email: 'adebayo@example.com',
    phone: '+234 809 888 4567',
    vehicleType: 'Motorcycle',
    vehiclePlate: 'LAG-789-EF',
    vehicleColor: 'Red',
    vehicleModel: 'Honda CG 125',
    vehicleYear: '2022',
    driversLicenseImage: 'https://via.placeholder.com/300x200?text=License',
    applicationStatus: 'pending',
    guarantors: [
      {
        id: 'g1',
        name: 'Tunde Bakare',
        phone: '+234 801 111 2222',
        address: '15 Marina Street, Lagos Island',
        occupation: 'Shop Owner',
        relationship: 'Uncle',
        idImage: 'https://via.placeholder.com/300x200?text=ID+Card+1',
        isVerified: false,
      },
      {
        id: 'g2',
        name: 'Ngozi Okonkwo',
        phone: '+234 802 333 4444',
        address: '42 Adeniran Ogunsanya, Surulere',
        occupation: 'Teacher',
        relationship: 'Family Friend',
        idImage: 'https://via.placeholder.com/300x200?text=ID+Card+2',
        isVerified: false,
      },
    ],
    createdAt: '2024-03-10',
  },
  {
    id: 'app-2',
    firstName: 'Yusuf',
    lastName: 'Mohammed',
    email: 'yusuf@example.com',
    phone: '+234 810 999 5678',
    vehicleType: 'Motorcycle',
    vehiclePlate: 'KAN-456-GH',
    vehicleColor: 'Black',
    vehicleModel: 'Bajaj Boxer',
    vehicleYear: '2023',
    driversLicenseImage: 'https://via.placeholder.com/300x200?text=License',
    applicationStatus: 'pending',
    guarantors: [
      {
        id: 'g3',
        name: 'Abubakar Sani',
        phone: '+234 803 555 6666',
        address: '8 Zoo Road, Kano',
        occupation: 'Business Man',
        relationship: 'Neighbor',
        idImage: 'https://via.placeholder.com/300x200?text=ID+Card+3',
        isVerified: false,
      },
      {
        id: 'g4',
        name: 'Fatima Bello',
        phone: '+234 804 777 8888',
        address: '23 Ahmadu Bello Way, Kano',
        occupation: 'Nurse',
        relationship: 'Sister',
        idImage: 'https://via.placeholder.com/300x200?text=ID+Card+4',
        isVerified: false,
      },
    ],
    createdAt: '2024-03-12',
  },
];

export default function RidersPage() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [selectedRider, setSelectedRider] = useState<Rider | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('list');
  
  // Application states
  const [appPage, setAppPage] = useState(1);
  const [appPageSize, setAppPageSize] = useState(10);
  const [appSearch, setAppSearch] = useState('');
  const [appStatusFilter, setAppStatusFilter] = useState<string | undefined>('pending');
  const [selectedApplication, setSelectedApplication] = useState<RiderApplication | null>(null);
  const [applicationDrawerVisible, setApplicationDrawerVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Fetch riders
  const { data: ridersData, isLoading, refetch } = useQuery({
    queryKey: ['riders', page, pageSize, search, statusFilter],
    queryFn: async () => {
      const params: Record<string, string | number | undefined> = {
        page,
        limit: pageSize,
        search,
        status: statusFilter,
      };
      const response = await adminApi.getRiders(params);
      // Backend returns { users, total, pages } - map to { items, total }
      const data = response.data.data || response.data;
      const users = data.users || data.items || [];
      // Map riderProfile to rider for frontend compatibility
      const items = users.map((user: Rider & { riderProfile?: Rider['rider'] }) => ({
        ...user,
        rider: user.riderProfile || user.rider,
      }));
      return {
        items,
        total: data.total || 0,
      };
    },
  });

  // Fetch rider applications
  const { data: applicationsData, isLoading: applicationsLoading, refetch: refetchApplications } = useQuery({
    queryKey: ['rider-applications', appPage, appPageSize, appSearch, appStatusFilter],
    queryFn: async () => {
      const params: Record<string, string | number | undefined> = {
        page: appPage,
        limit: appPageSize,
        search: appSearch,
        status: appStatusFilter,
      };
      const response = await adminApi.getRiderApplications(params);
      return response.data.data;
    },
  });

  // Toggle rider status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: ({ riderId, isActive }: { riderId: string; isActive: boolean }) =>
      adminApi.updateRider(riderId, { isActive }),
    onSuccess: () => {
      message.success('Rider status updated');
      queryClient.invalidateQueries({ queryKey: ['riders'] });
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      message.error(error.response?.data?.message || 'Failed to update rider');
    },
  });

  // Approve application mutation
  const approveApplicationMutation = useMutation({
    mutationFn: (applicationId: string) => adminApi.approveRiderApplication(applicationId),
    onSuccess: () => {
      message.success('Rider application approved successfully!');
      queryClient.invalidateQueries({ queryKey: ['rider-applications'] });
      queryClient.invalidateQueries({ queryKey: ['riders'] });
      setApplicationDrawerVisible(false);
      setSelectedApplication(null);
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      message.error(error.response?.data?.message || 'Failed to approve application');
    },
  });

  // Reject application mutation
  const rejectApplicationMutation = useMutation({
    mutationFn: ({ applicationId, reason }: { applicationId: string; reason: string }) =>
      adminApi.rejectRiderApplication(applicationId, reason),
    onSuccess: () => {
      message.success('Rider application rejected');
      queryClient.invalidateQueries({ queryKey: ['rider-applications'] });
      setRejectModalVisible(false);
      setRejectionReason('');
      setApplicationDrawerVisible(false);
      setSelectedApplication(null);
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      message.error(error.response?.data?.message || 'Failed to reject application');
    },
  });

  // Initialize map
  useEffect(() => {
    if (activeTab === 'map' && mapContainer.current && !map.current && mapboxgl.accessToken) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [3.3792, 6.5244], // Lagos
        zoom: 11,
      });

      map.current.addControl(new mapboxgl.NavigationControl());
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [activeTab]);

  // Update markers when riders data changes
  useEffect(() => {
    if (!map.current || activeTab !== 'map') return;

    // Clear existing markers
    markers.current.forEach((marker) => marker.remove());
    markers.current = [];

    // Add new markers
    const riders = ridersData?.items || mockRiders;
    riders.forEach((rider: Rider) => {
      if (rider.currentLocation && rider.isOnline) {
        const el = document.createElement('div');
        el.className = 'rider-marker';
        el.innerHTML = `
          <div style="
            background: ${rider.isOnline ? '#10b981' : '#6b7280'};
            padding: 8px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
          ">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
            </svg>
          </div>
        `;

        const marker = new mapboxgl.Marker(el)
          .setLngLat([rider.currentLocation.lng, rider.currentLocation.lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }).setHTML(`
              <strong>${rider.name || (rider.firstName + ' ' + rider.lastName)}</strong><br/>
              <small>${rider.vehicleType} - ${rider.vehiclePlate}</small><br/>
              <small>★ ${rider.rating} • ${rider.totalDeliveries} deliveries</small>
            `)
          )
          .addTo(map.current!);

        markers.current.push(marker);
      }
    });
  }, [ridersData, activeTab]);

  const handleViewRider = (rider: Rider) => {
    setSelectedRider(rider);
    setDrawerVisible(true);
  };

  // Helper to get display name from rider record
  const getRiderName = (record: Rider) => {
    if (record.name) return record.name;
    if (record.firstName || record.lastName) return `${record.firstName || ''} ${record.lastName || ''}`.trim();
    return 'Unknown';
  };

  const columns: ColumnsType<Rider> = [
    {
      title: 'Rider',
      key: 'rider',
      render: (_, record) => (
        <Space>
          <Badge dot status={record.isOnline || record.rider?.isOnline ? 'success' : 'default'} offset={[-5, 35]}>
            <Avatar
              size={40}
              src={record.profileImage || record.avatar}
              icon={<UserOutlined />}
            />
          </Badge>
          <div>
            <Text strong>
              {getRiderName(record)}
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
      title: 'Vehicle',
      key: 'vehicle',
      render: (_, record) => (
        <Space>
          <CarOutlined style={{ color: '#06b6d4' }} />
          <div>
            <Text>{record.vehicleType || record.rider?.vehicleType || 'N/A'}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.vehiclePlate || record.rider?.vehiclePlate || 'N/A'}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Rating',
      key: 'rating',
      render: (_, record) => {
        const rating = record.rating || record.rider?.rating || 0;
        return (
          <Space>
            <Rate disabled defaultValue={rating} style={{ fontSize: 14 }} />
            <Text>({rating})</Text>
          </Space>
        );
      },
      sorter: true,
    },
    {
      title: 'Deliveries',
      key: 'totalDeliveries',
      render: (_, record) => record.totalDeliveries || record.rider?.totalDeliveries || 0,
      sorter: true,
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <Space orientation="vertical" size={0}>
          <Tag color={record.isOnline ? 'green' : 'default'}>
            {record.isOnline ? 'ONLINE' : 'OFFLINE'}
          </Tag>
          <Tag color={record.isVerified ? 'blue' : 'orange'}>
            {record.isVerified ? 'VERIFIED' : 'PENDING'}
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
              riderId: record.id,
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
        <Button
          type="text"
          icon={<EyeOutlined />}
          onClick={() => handleViewRider(record)}
        />
      ),
    },
  ];

  // Application table columns
  const applicationColumns: ColumnsType<RiderApplication> = [
    {
      title: 'Applicant',
      key: 'applicant',
      render: (_, record) => (
        <Space>
          <Avatar size={40} src={record.profileImage} icon={<UserOutlined />} />
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
      title: 'Vehicle Info',
      key: 'vehicle',
      render: (_, record) => (
        <Space>
          <CarOutlined style={{ color: '#06b6d4' }} />
          <div>
            <Text>{record.vehicleModel}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.vehiclePlate} • {record.vehicleColor}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Guarantors',
      key: 'guarantors',
      render: (_, record) => (
        <Space>
          <TeamOutlined style={{ color: '#8b5cf6' }} />
          <Text>{record.guarantors.length} guarantor(s)</Text>
        </Space>
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

  const handleViewApplication = (application: RiderApplication) => {
    setSelectedApplication(application);
    setApplicationDrawerVisible(true);
  };

  const riders = ridersData?.items || mockRiders;
  const total = ridersData?.total || mockRiders.length;
  const applications = applicationsData?.items || mockApplications;
  const applicationsTotal = applicationsData?.total || mockApplications.length;
  const pendingCount = applications.filter((a: RiderApplication) => a.applicationStatus === 'pending').length;

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
            Riders
          </Title>
          <Text type="secondary">Manage delivery riders and track locations</Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
            Refresh
          </Button>
        </Space>
      </div>

      {/* Stats */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Riders"
              value={total}
              prefix={<CarOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Online Now"
              value={riders.filter((r: Rider) => r.isOnline).length}
              styles={{ content: { color: '#10b981' } }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Verified"
              value={riders.filter((r: Rider) => r.isVerified).length}
              styles={{ content: { color: '#3b82f6' } }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Pending Applications"
              value={pendingCount}
              styles={{ content: { color: '#f59e0b' } }}
              prefix={<IdcardOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Tabs for List/Map/Applications view */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'list',
            label: 'List View',
            children: (
              <>
                {/* Filters */}
                <Card style={{ marginBottom: 16 }}>
                  <Space wrap>
                    <Input
                      placeholder="Search riders..."
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
                        { value: 'online', label: 'Online' },
                        { value: 'offline', label: 'Offline' },
                        { value: 'verified', label: 'Verified' },
                        { value: 'pending', label: 'Pending' },
                      ]}
                    />
                  </Space>
                </Card>

                {/* Riders Table */}
                <Card>
                  <Table
                    columns={columns}
                    dataSource={riders}
                    rowKey="id"
                    loading={isLoading}
                    pagination={{
                      current: page,
                      pageSize,
                      total,
                      showSizeChanger: true,
                      showTotal: (total) => `Total ${total} riders`,
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
              <Badge count={pendingCount} offset={[10, 0]} size="small">
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
          {
            key: 'map',
            label: 'Live Map',
            children: (
              <Card>
                {mapboxgl.accessToken ? (
                  <div
                    ref={mapContainer}
                    style={{ height: 600, borderRadius: 8 }}
                  />
                ) : (
                  <div
                    style={{
                      height: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#f5f5f5',
                      borderRadius: 8,
                    }}
                  >
                    <Text type="secondary">
                      Configure NEXT_PUBLIC_MAPBOX_TOKEN to enable the live map
                    </Text>
                  </div>
                )}
              </Card>
            ),
          },
        ]}
      />

      {/* Rider Details Drawer */}
      <Drawer
        title="Rider Details"
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        size="large"
      >
        {selectedRider && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Badge dot status={selectedRider.isOnline || selectedRider.rider?.isOnline ? 'success' : 'default'} offset={[-10, 70]}>
                <Avatar
                  size={80}
                  src={selectedRider.profileImage || selectedRider.avatar}
                  icon={<UserOutlined />}
                />
              </Badge>
              <Title level={4} style={{ marginTop: 12, marginBottom: 4 }}>
                {getRiderName(selectedRider)}
              </Title>
              <Space>
                <Tag color={selectedRider.isOnline || selectedRider.rider?.isOnline ? 'green' : 'default'}>
                  {selectedRider.isOnline || selectedRider.rider?.isOnline ? 'ONLINE' : 'OFFLINE'}
                </Tag>
                <Tag color={selectedRider.isVerified ? 'blue' : 'orange'}>
                  {selectedRider.isVerified ? 'VERIFIED' : 'PENDING'}
                </Tag>
              </Space>
            </div>

            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Phone">
                <Space>
                  <PhoneOutlined />
                  {selectedRider.phone}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Email">{selectedRider.email}</Descriptions.Item>
              <Descriptions.Item label="Vehicle">
                {selectedRider.vehicleType || selectedRider.rider?.vehicleType || 'N/A'} - {selectedRider.vehiclePlate || selectedRider.rider?.vehiclePlate || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Rating">
                <Rate disabled defaultValue={selectedRider.rating || selectedRider.rider?.rating || 0} style={{ fontSize: 14 }} />
                <Text style={{ marginLeft: 8 }}>({selectedRider.rating || selectedRider.rider?.rating || 0})</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Total Deliveries">
                {selectedRider.totalDeliveries || selectedRider.rider?.totalDeliveries || 0}
              </Descriptions.Item>
              <Descriptions.Item label="Joined">
                {selectedRider.createdAt}
              </Descriptions.Item>
            </Descriptions>

            <Divider>Earnings</Divider>
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title="Today"
                  value={selectedRider.earnings?.today ?? 0}
                  formatter={(v) => formatCurrency(Number(v))}
                  styles={{ content: { fontSize: 16 } }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="This Week"
                  value={selectedRider.earnings?.week ?? 0}
                  formatter={(v) => formatCurrency(Number(v))}
                  styles={{ content: { fontSize: 16 } }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="This Month"
                  value={selectedRider.earnings?.month ?? 0}
                  formatter={(v) => formatCurrency(Number(v))}
                  styles={{ content: { fontSize: 16 } }}
                />
              </Col>
            </Row>

            <Divider />
            <Space style={{ width: '100%', justifyContent: 'center' }}>
              <Button
                type={selectedRider.isActive ? 'default' : 'primary'}
                danger={selectedRider.isActive}
                onClick={() =>
                  toggleStatusMutation.mutate({
                    riderId: selectedRider.id,
                    isActive: !selectedRider.isActive,
                  })
                }
                loading={toggleStatusMutation.isPending}
              >
                {selectedRider.isActive ? 'Deactivate Rider' : 'Activate Rider'}
              </Button>
            </Space>
          </>
        )}
      </Drawer>

      {/* Application Details Drawer */}
      <Drawer
        title="Rider Application Details"
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
                description="This application is awaiting admin review and approval."
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
                description="This rider has been approved and activated."
                type="success"
                showIcon
                style={{ marginBottom: 24 }}
              />
            )}

            {/* Applicant Info */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Avatar size={80} src={selectedApplication.profileImage} icon={<UserOutlined />} />
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
              <Descriptions.Item label="Applied On">{selectedApplication.createdAt}</Descriptions.Item>
            </Descriptions>

            <Divider />

            <Descriptions column={1} bordered size="small" title="Vehicle Information">
              <Descriptions.Item label="Vehicle Type">{selectedApplication.vehicleType}</Descriptions.Item>
              <Descriptions.Item label="Model">{selectedApplication.vehicleModel}</Descriptions.Item>
              <Descriptions.Item label="Year">{selectedApplication.vehicleYear}</Descriptions.Item>
              <Descriptions.Item label="Color">{selectedApplication.vehicleColor}</Descriptions.Item>
              <Descriptions.Item label="Plate Number">{selectedApplication.vehiclePlate}</Descriptions.Item>
              <Descriptions.Item label="Driver's License">
                <Image
                  src={selectedApplication.driversLicenseImage}
                  alt="Driver's License"
                  width={200}
                  style={{ borderRadius: 8 }}
                />
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            {/* Guarantors */}
            <Title level={5}>
              <TeamOutlined style={{ marginRight: 8 }} />
              Guarantors ({selectedApplication.guarantors.length})
            </Title>

            {selectedApplication.guarantors.map((guarantor, index) => (
              <Card
                key={guarantor.id}
                size="small"
                title={`Guarantor ${index + 1}: ${guarantor.name}`}
                style={{ marginBottom: 16 }}
              >
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Relationship">{guarantor.relationship}</Descriptions.Item>
                  <Descriptions.Item label="Phone">
                    <Space>
                      <PhoneOutlined />
                      {guarantor.phone}
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Occupation">{guarantor.occupation}</Descriptions.Item>
                  <Descriptions.Item label="Address">
                    <Space>
                      <HomeOutlined />
                      {guarantor.address}
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="ID Document">
                    <Image
                      src={guarantor.idImage}
                      alt={`${guarantor.name}'s ID`}
                      width={150}
                      style={{ borderRadius: 8 }}
                    />
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            ))}

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
        title="Reject Rider Application"
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
