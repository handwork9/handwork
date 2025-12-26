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
  Tooltip,
  Progress,
  Dropdown,
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
  MailOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  StarOutlined,
  MoreOutlined,
  FilterOutlined,
  SafetyCertificateOutlined,
  StopOutlined,
  EnvironmentOutlined,
  ThunderboltOutlined,
  ExportOutlined,
  WifiOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import type { ColumnsType } from 'antd/es/table';
import mapboxgl from 'mapbox-gl';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

// Set Mapbox access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface Rider {
  id: string;
  name: string;
  firstName?: string;
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
  // Subscription/Premium fields
  currentTier?: 'BASIC' | 'SILVER' | 'GOLD' | 'PLATINUM';
  isPremium?: boolean;
  subscriptionExpiresAt?: string;
  // Manual boost fields
  manualBoost?: number;
  manualBoostExpiresAt?: string;
  manualBoostReason?: string;
  rider?: {
    vehicleType?: string;
    vehiclePlate?: string;
    isOnline?: boolean;
    rating?: number;
    totalDeliveries?: number;
    currentTier?: 'BASIC' | 'SILVER' | 'GOLD' | 'PLATINUM';
    isPremium?: boolean;
    manualBoost?: number;
    manualBoostExpiresAt?: string;
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

const formatCurrency = (value: number | null | undefined) => `₦${(value ?? 0).toLocaleString()}`;

export default function RidersPage() {
  const { message, modal } = App.useApp();
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
  const [drawerTab, setDrawerTab] = useState('details');

  // Application states
  const [appPage, setAppPage] = useState(1);
  const [appPageSize, setAppPageSize] = useState(10);
  const [appSearch, setAppSearch] = useState('');
  const [appStatusFilter, setAppStatusFilter] = useState<string | undefined>('pending');
  const [selectedApplication, setSelectedApplication] = useState<RiderApplication | null>(null);
  const [applicationDrawerVisible, setApplicationDrawerVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Boost modal states
  const [boostModalVisible, setBoostModalVisible] = useState(false);
  const [boostRider, setBoostRider] = useState<Rider | null>(null);
  const [boostValue, setBoostValue] = useState(2.0);
  const [boostDuration, setBoostDuration] = useState<number | undefined>(24);
  const [boostReason, setBoostReason] = useState('');

  // Fetch dashboard stats
  const { data: dashboardData } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await adminApi.getDashboard();
      return response.data?.data || response.data;
    },
  });

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
      const data = response.data?.data || response.data;
      const users = data.users || data.items || [];
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
      return response.data?.data || response.data;
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
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
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

  // Set rider boost mutation
  const setBoostMutation = useMutation({
    mutationFn: ({ riderId, boost, expiresInHours, reason }: { 
      riderId: string; 
      boost: number; 
      expiresInHours?: number; 
      reason: string;
    }) => adminApi.setRiderBoost(riderId, { boost, expiresInHours, reason }),
    onSuccess: () => {
      message.success('Priority boost applied successfully!');
      queryClient.invalidateQueries({ queryKey: ['riders'] });
      setBoostModalVisible(false);
      setBoostRider(null);
      setBoostValue(2.0);
      setBoostDuration(24);
      setBoostReason('');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      message.error(error.response?.data?.message || 'Failed to apply boost');
    },
  });

  // Remove rider boost mutation
  const removeBoostMutation = useMutation({
    mutationFn: (riderId: string) => adminApi.removeRiderBoost(riderId),
    onSuccess: () => {
      message.success('Priority boost removed');
      queryClient.invalidateQueries({ queryKey: ['riders'] });
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      message.error(error.response?.data?.message || 'Failed to remove boost');
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
    const riders = ridersData?.items || [];
    riders.forEach((rider: Rider) => {
      if (rider.currentLocation && (rider.isOnline || rider.rider?.isOnline)) {
        const el = document.createElement('div');
        el.className = 'rider-marker';
        el.innerHTML = `
          <div style="
            background: ${rider.isOnline || rider.rider?.isOnline ? '#10b981' : '#6b7280'};
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

        const riderName = rider.name || `${rider.firstName || ''} ${rider.lastName || ''}`.trim();
        const rating = rider.rating || rider.rider?.rating || 0;
        const deliveries = rider.totalDeliveries || rider.rider?.totalDeliveries || 0;
        const vehicleType = rider.vehicleType || rider.rider?.vehicleType || 'N/A';
        const vehiclePlate = rider.vehiclePlate || rider.rider?.vehiclePlate || 'N/A';

        const marker = new mapboxgl.Marker(el)
          .setLngLat([rider.currentLocation.lng, rider.currentLocation.lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }).setHTML(`
              <strong>${riderName}</strong><br/>
              <small>${vehicleType} - ${vehiclePlate}</small><br/>
              <small>★ ${Number(rating).toFixed(1)} • ${deliveries} deliveries</small>
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
    setDrawerTab('details');
  };

  const handleViewApplication = (application: RiderApplication) => {
    setSelectedApplication(application);
    setApplicationDrawerVisible(true);
  };

  const handleDeactivateRider = (rider: Rider) => {
    modal.confirm({
      title: rider.isActive ? 'Deactivate Rider' : 'Activate Rider',
      content: rider.isActive
        ? `Are you sure you want to deactivate ${getRiderName(rider)}? They will not be able to accept new deliveries.`
        : `Are you sure you want to activate ${getRiderName(rider)}?`,
      okText: rider.isActive ? 'Deactivate' : 'Activate',
      okType: rider.isActive ? 'danger' : 'primary',
      onOk: () => toggleStatusMutation.mutate({ riderId: rider.id, isActive: !rider.isActive }),
    });
  };

  const handleOpenBoostModal = (rider: Rider) => {
    setBoostRider(rider);
    // Pre-fill with existing boost if any
    const currentBoost = rider.manualBoost || rider.rider?.manualBoost || 1.0;
    setBoostValue(currentBoost > 1 ? currentBoost : 2.0);
    setBoostModalVisible(true);
  };

  const handleApplyBoost = () => {
    if (!boostRider) return;
    if (!boostReason.trim()) {
      message.warning('Please provide a reason for the boost');
      return;
    }
    setBoostMutation.mutate({
      riderId: boostRider.id,
      boost: boostValue,
      expiresInHours: boostDuration,
      reason: boostReason,
    });
  };

  const handleRemoveBoost = (rider: Rider) => {
    modal.confirm({
      title: 'Remove Priority Boost',
      content: `Are you sure you want to remove the priority boost for ${getRiderName(rider)}?`,
      okText: 'Remove Boost',
      okType: 'danger',
      onOk: () => removeBoostMutation.mutate(rider.id),
    });
  };

  // Check if rider has active boost
  const hasActiveBoost = (rider: Rider): boolean => {
    const boost = rider.manualBoost || rider.rider?.manualBoost;
    if (!boost || boost <= 1.0) return false;
    const expiresAt = rider.manualBoostExpiresAt || rider.rider?.manualBoostExpiresAt;
    if (!expiresAt) return true; // No expiry means always active
    return new Date() < new Date(expiresAt);
  };

  // Helper to get display name from rider record
  const getRiderName = (record: Rider) => {
    if (record.name) return record.name;
    if (record.firstName || record.lastName) return `${record.firstName || ''} ${record.lastName || ''}`.trim();
    return 'Unknown';
  };

  // Stats
  const riders = ridersData?.items || [];
  const total = ridersData?.total || dashboardData?.totalRiders || 0;
  const applications = applicationsData?.items || [];
  const applicationsTotal = applicationsData?.total || 0;
  const pendingCount = applications.filter((a: RiderApplication) => a.applicationStatus === 'pending').length;

  const onlineCount = riders.filter((r: Rider) => r.isOnline || r.rider?.isOnline).length;
  const verifiedCount = riders.filter((r: Rider) => r.isVerified).length;
  const activeCount = riders.filter((r: Rider) => r.isActive).length;

  // Calculate online rate
  const onlineRate = riders.length > 0 ? Math.round((onlineCount / riders.length) * 100) : 0;

  const columns: ColumnsType<Rider> = [
    {
      title: 'Rider',
      key: 'rider',
      width: 250,
      render: (_, record) => (
        <Space>
          <Badge dot status={record.isOnline || record.rider?.isOnline ? 'success' : 'default'} offset={[-5, 35]}>
            <Avatar
              size={45}
              src={record.profileImage || record.avatar}
              icon={<UserOutlined />}
              style={{ backgroundColor: '#06b6d4' }}
            />
          </Badge>
          <div>
            <Text strong style={{ color: '#4f46e5', cursor: 'pointer' }} onClick={() => handleViewRider(record)}>
              {getRiderName(record)}
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
      title: 'Vehicle',
      key: 'vehicle',
      width: 160,
      render: (_, record) => (
        <Space>
          <CarOutlined style={{ color: '#06b6d4', fontSize: 18 }} />
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
      width: 120,
      render: (_, record) => {
        const rating = record.rating || record.rider?.rating || 0;
        return (
          <Space>
            <StarOutlined style={{ color: '#fadb14' }} />
            <Text strong>{Number(rating).toFixed(1)}</Text>
          </Space>
        );
      },
      sorter: true,
    },
    {
      title: 'Deliveries',
      key: 'totalDeliveries',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <Badge 
          count={record.totalDeliveries || record.rider?.totalDeliveries || 0} 
          style={{ backgroundColor: '#4f46e5' }} 
          showZero
          overflowCount={9999}
        />
      ),
      sorter: true,
    },
    {
      title: 'Status',
      key: 'status',
      width: 140,
      render: (_, record) => (
        <Space orientation="vertical" size={4}>
          <Tag 
            icon={record.isOnline || record.rider?.isOnline ? <WifiOutlined /> : <ClockCircleOutlined />} 
            color={record.isOnline || record.rider?.isOnline ? 'green' : 'default'}
          >
            {record.isOnline || record.rider?.isOnline ? 'ONLINE' : 'OFFLINE'}
          </Tag>
          <Tag 
            icon={record.isVerified ? <SafetyCertificateOutlined /> : <ClockCircleOutlined />} 
            color={record.isVerified ? 'blue' : 'orange'}
          >
            {record.isVerified ? 'VERIFIED' : 'PENDING'}
          </Tag>
        </Space>
      ),
    },
    {
      title: 'Priority',
      key: 'priority',
      width: 100,
      render: (_, record) => {
        const tier = record.currentTier || record.rider?.currentTier;
        const isPremium = record.isPremium || record.rider?.isPremium;
        const hasBoosted = hasActiveBoost(record);
        const boostVal = record.manualBoost || record.rider?.manualBoost || 1.0;
        
        if (hasBoosted) {
          return (
            <Tooltip title={`Manual boost: ${boostVal}x priority`}>
              <Tag icon={<RocketOutlined />} color="magenta">
                {boostVal}x BOOST
              </Tag>
            </Tooltip>
          );
        }
        
        if (isPremium && tier && tier !== 'BASIC') {
          const tierColors: Record<string, string> = {
            SILVER: 'default',
            GOLD: 'gold',
            PLATINUM: 'purple',
          };
          return (
            <Tag icon={<StarOutlined />} color={tierColors[tier] || 'default'}>
              {tier}
            </Tag>
          );
        }
        
        return <Tag color="default">BASIC</Tag>;
      },
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
              handleDeactivateRider(record);
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
              onClick={() => handleViewRider(record)}
            />
          </Tooltip>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'view',
                  label: 'View Details',
                  icon: <EyeOutlined />,
                  onClick: () => handleViewRider(record),
                },
                { type: 'divider' },
                {
                  key: 'boost',
                  label: hasActiveBoost(record) ? 'Modify Boost' : 'Apply Boost',
                  icon: <RocketOutlined />,
                  onClick: () => handleOpenBoostModal(record),
                },
                ...(hasActiveBoost(record) ? [{
                  key: 'remove-boost',
                  label: 'Remove Boost',
                  icon: <CloseOutlined />,
                  danger: true,
                  onClick: () => handleRemoveBoost(record),
                }] : []),
                { type: 'divider' },
                {
                  key: 'deactivate',
                  label: record.isActive ? 'Deactivate' : 'Activate',
                  icon: record.isActive ? <StopOutlined /> : <CheckCircleOutlined />,
                  danger: record.isActive,
                  onClick: () => handleDeactivateRider(record),
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

  // Application table columns
  const applicationColumns: ColumnsType<RiderApplication> = [
    {
      title: 'Applicant',
      key: 'applicant',
      width: 220,
      render: (_, record) => (
        <Space>
          <Avatar size={40} src={record.profileImage} icon={<UserOutlined />} style={{ backgroundColor: '#06b6d4' }} />
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
      title: 'Vehicle Info',
      key: 'vehicle',
      width: 200,
      render: (_, record) => (
        <Space>
          <CarOutlined style={{ color: '#06b6d4', fontSize: 18 }} />
          <div>
            <Text strong>{record.vehicleModel}</Text>
            <br />
            <Space size={4}>
              <Tag color="cyan" style={{ margin: 0 }}>{record.vehiclePlate}</Tag>
              <Tag color="blue" style={{ margin: 0 }}>{record.vehicleColor}</Tag>
            </Space>
          </div>
        </Space>
      ),
    },
    {
      title: 'Guarantors',
      key: 'guarantors',
      width: 120,
      render: (_, record) => (
        <Space>
          <TeamOutlined style={{ color: '#8b5cf6' }} />
          <Badge count={record.guarantors?.length || 0} style={{ backgroundColor: '#8b5cf6' }} />
        </Space>
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
                      content: `Approve ${record.firstName} ${record.lastName}'s rider application?`,
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
            <CarOutlined style={{ marginRight: 12, color: '#06b6d4' }} />
            Riders Management
          </Title>
          <Text type="secondary">Manage delivery riders, track locations, and review applications</Text>
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
              title="Total Riders"
              value={total}
              prefix={<CarOutlined style={{ color: '#06b6d4' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="Online Now"
              value={dashboardData?.onlineRiders || onlineCount}
              prefix={<ThunderboltOutlined style={{ color: '#10b981' }} />}
              styles={{ content: { color: '#10b981' } }}
            />
            <Progress percent={onlineRate} size="small" strokeColor="#10b981" showInfo={false} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="Verified Riders"
              value={verifiedCount}
              prefix={<SafetyCertificateOutlined style={{ color: '#3b82f6' }} />}
              styles={{ content: { color: '#3b82f6' } }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="Pending Applications"
              value={pendingCount}
              prefix={<IdcardOutlined style={{ color: '#f59e0b' }} />}
              styles={{ content: { color: '#f59e0b' } }}
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
            label: (
              <span>
                <CarOutlined />
                All Riders
              </span>
            ),
            children: (
              <>
                {/* Filters */}
                <Card style={{ marginBottom: 16 }}>
                  <Space wrap size="middle">
                    <Input
                      placeholder="Search by name, phone..."
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
                      <Select.Option value="online">
                        <Tag color="green">Online</Tag>
                      </Select.Option>
                      <Select.Option value="offline">
                        <Tag color="default">Offline</Tag>
                      </Select.Option>
                      <Select.Option value="verified">
                        <Tag color="blue">Verified</Tag>
                      </Select.Option>
                      <Select.Option value="pending">
                        <Tag color="orange">Pending</Tag>
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

                {/* Riders Table */}
                <Card>
                  <Table
                    columns={columns}
                    dataSource={riders}
                    rowKey="id"
                    loading={isLoading}
                    scroll={{ x: 1200 }}
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
                    scroll={{ x: 1000 }}
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
            label: (
              <span>
                <EnvironmentOutlined />
                Live Map
              </span>
            ),
            children: (
              <Card>
                {mapboxgl.accessToken ? (
                  <>
                    <Alert
                      type="info"
                      title={`${onlineCount} riders online`}
                      description="Green markers show online riders. Click a marker to see rider details."
                      showIcon
                      style={{ marginBottom: 16 }}
                    />
                    <div
                      ref={mapContainer}
                      style={{ height: 600, borderRadius: 8 }}
                    />
                  </>
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
                    <Space orientation="vertical" align="center">
                      <EnvironmentOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
                      <Text type="secondary">
                        Configure NEXT_PUBLIC_MAPBOX_TOKEN to enable the live map
                      </Text>
                    </Space>
                  </div>
                )}
              </Card>
            ),
          },
        ]}
      />

      {/* Rider Details Drawer */}
      <Drawer
        title={
          <Space>
            <CarOutlined style={{ color: '#06b6d4' }} />
            <span>Rider Details</span>
            {selectedRider && (
              <>
                <Tag 
                  icon={selectedRider.isOnline || selectedRider.rider?.isOnline ? <WifiOutlined /> : <ClockCircleOutlined />} 
                  color={selectedRider.isOnline || selectedRider.rider?.isOnline ? 'green' : 'default'}
                >
                  {selectedRider.isOnline || selectedRider.rider?.isOnline ? 'ONLINE' : 'OFFLINE'}
                </Tag>
                <Tag color={selectedRider.isVerified ? 'blue' : 'orange'}>
                  {selectedRider.isVerified ? 'VERIFIED' : 'PENDING'}
                </Tag>
              </>
            )}
          </Space>
        }
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        size="large"
        extra={
          selectedRider && (
            <Button
              type={selectedRider.isActive ? 'default' : 'primary'}
              danger={selectedRider.isActive}
              onClick={() => handleDeactivateRider(selectedRider)}
              loading={toggleStatusMutation.isPending}
            >
              {selectedRider.isActive ? 'Deactivate' : 'Activate'}
            </Button>
          )
        }
      >
        {selectedRider && (
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
                    {/* Rider Header */}
                    <Card size="small">
                      <div style={{ textAlign: 'center', padding: '16px 0' }}>
                        <Badge dot status={selectedRider.isOnline || selectedRider.rider?.isOnline ? 'success' : 'default'} offset={[-10, 70]}>
                          <Avatar
                            size={80}
                            src={selectedRider.profileImage || selectedRider.avatar}
                            icon={<UserOutlined />}
                            style={{ backgroundColor: '#06b6d4' }}
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
                    </Card>

                    {/* Contact Info */}
                    <Card size="small" title="Contact Information">
                      <Descriptions column={1} size="small">
                        <Descriptions.Item label="Phone">
                          <Text copyable>{selectedRider.phone}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Email">
                          <Text copyable>{selectedRider.email}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Joined">
                          {dayjs(selectedRider.createdAt).format('MMM DD, YYYY')}
                        </Descriptions.Item>
                      </Descriptions>
                    </Card>

                    {/* Vehicle Info */}
                    <Card size="small" title={<><CarOutlined style={{ marginRight: 8 }} /> Vehicle Information</>}>
                      <Descriptions column={1} size="small">
                        <Descriptions.Item label="Vehicle Type">
                          <Tag color="cyan">{selectedRider.vehicleType || selectedRider.rider?.vehicleType || 'N/A'}</Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Plate Number">
                          <Text copyable>{selectedRider.vehiclePlate || selectedRider.rider?.vehiclePlate || 'N/A'}</Text>
                        </Descriptions.Item>
                      </Descriptions>
                    </Card>

                    {/* Stats */}
                    <Card size="small" title="Performance">
                      <Row gutter={16}>
                        <Col span={12}>
                          <Statistic
                            title="Rating"
                            value={selectedRider.rating || selectedRider.rider?.rating || 0}
                            prefix={<StarOutlined style={{ color: '#fadb14' }} />}
                            precision={1}
                          />
                        </Col>
                        <Col span={12}>
                          <Statistic
                            title="Deliveries"
                            value={selectedRider.totalDeliveries || selectedRider.rider?.totalDeliveries || 0}
                            prefix={<ThunderboltOutlined style={{ color: '#4f46e5' }} />}
                          />
                        </Col>
                      </Row>
                    </Card>
                  </Space>
                ),
              },
              {
                key: 'earnings',
                label: 'Earnings',
                icon: <DollarOutlined />,
                children: (
                  <Space orientation="vertical" size="large" style={{ width: '100%' }}>
                    <Card size="small">
                      <Row gutter={16}>
                        <Col span={8}>
                          <Statistic
                            title="Today"
                            value={selectedRider.earnings?.today ?? 0}
                            formatter={(v) => formatCurrency(Number(v))}
                            styles={{ content: { fontSize: 16, color: '#10b981' } }}
                          />
                        </Col>
                        <Col span={8}>
                          <Statistic
                            title="This Week"
                            value={selectedRider.earnings?.week ?? 0}
                            formatter={(v) => formatCurrency(Number(v))}
                            styles={{ content: { fontSize: 16, color: '#3b82f6' } }}
                          />
                        </Col>
                        <Col span={8}>
                          <Statistic
                            title="This Month"
                            value={selectedRider.earnings?.month ?? 0}
                            formatter={(v) => formatCurrency(Number(v))}
                            styles={{ content: { fontSize: 16, color: '#4f46e5' } }}
                          />
                        </Col>
                      </Row>
                    </Card>

                    <Alert
                      type="info"
                      title="Earnings Summary"
                      description="Earnings are calculated based on completed deliveries. Riders receive payment after each successful delivery."
                      showIcon
                    />
                  </Space>
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
            <span>Rider Application</span>
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
                title="Pending Review"
                description="This application is awaiting admin review and approval."
                type="warning"
                showIcon
              />
            )}
            {selectedApplication.applicationStatus === 'rejected' && (
              <Alert
                title="Application Rejected"
                description={selectedApplication.rejectionReason || 'No reason provided'}
                type="error"
                showIcon
              />
            )}
            {selectedApplication.applicationStatus === 'approved' && (
              <Alert
                title="Application Approved"
                description="This rider has been approved and activated."
                type="success"
                showIcon
              />
            )}

            {/* Applicant Info */}
            <Card size="small">
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <Avatar size={80} src={selectedApplication.profileImage} icon={<UserOutlined />} style={{ backgroundColor: '#06b6d4' }} />
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
                <Descriptions.Item label="Applied On">
                  {dayjs(selectedApplication.createdAt).format('MMM DD, YYYY')}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Vehicle Info */}
            <Card size="small" title={<><CarOutlined style={{ marginRight: 8 }} /> Vehicle Information</>}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Vehicle Type">
                  <Tag color="cyan">{selectedApplication.vehicleType}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Model">{selectedApplication.vehicleModel}</Descriptions.Item>
                <Descriptions.Item label="Year">{selectedApplication.vehicleYear}</Descriptions.Item>
                <Descriptions.Item label="Color">
                  <Tag color="blue">{selectedApplication.vehicleColor}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Plate Number">
                  <Text copyable strong>{selectedApplication.vehiclePlate}</Text>
                </Descriptions.Item>
              </Descriptions>
              <Divider style={{ margin: '12px 0' }} />
              <Text strong>Driver&apos;s License</Text>
              <div style={{ marginTop: 8 }}>
                <Image
                  src={selectedApplication.driversLicenseImage}
                  alt="Driver's License"
                  width="100%"
                  style={{ borderRadius: 8 }}
                />
              </div>
            </Card>

            {/* Guarantors */}
            <Card size="small" title={<><TeamOutlined style={{ marginRight: 8 }} /> Guarantors ({selectedApplication.guarantors?.length || 0})</>}>
              {(selectedApplication.guarantors || []).map((guarantor, index) => (
                <Card
                  key={guarantor.id}
                  size="small"
                  title={
                    <Space>
                      <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: '#8b5cf6' }} />
                      {guarantor.name}
                      <Tag color="purple">{guarantor.relationship}</Tag>
                    </Space>
                  }
                  style={{ marginBottom: index < (selectedApplication.guarantors?.length || 0) - 1 ? 12 : 0 }}
                >
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Phone">
                      <Text copyable>{guarantor.phone}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Occupation">{guarantor.occupation}</Descriptions.Item>
                    <Descriptions.Item label="Address">
                      <Space>
                        <HomeOutlined />
                        {guarantor.address}
                      </Space>
                    </Descriptions.Item>
                  </Descriptions>
                  <Divider style={{ margin: '8px 0' }} />
                  <Text strong>ID Document</Text>
                  <div style={{ marginTop: 8 }}>
                    <Image
                      src={guarantor.idImage}
                      alt={`${guarantor.name}'s ID`}
                      width="100%"
                      style={{ borderRadius: 8 }}
                    />
                  </div>
                </Card>
              ))}
            </Card>
          </Space>
        )}
      </Drawer>

      {/* Boost Modal */}
      <Modal
        title={<><RocketOutlined style={{ color: '#ec4899', marginRight: 8 }} /> Apply Priority Boost</>}
        open={boostModalVisible}
        onCancel={() => {
          setBoostModalVisible(false);
          setBoostRider(null);
          setBoostValue(2.0);
          setBoostDuration(24);
          setBoostReason('');
        }}
        onOk={handleApplyBoost}
        okText="Apply Boost"
        okButtonProps={{
          loading: setBoostMutation.isPending,
          style: { backgroundColor: '#ec4899' },
        }}
      >
        {boostRider && (
          <>
            <Alert
              type="info"
              message={`Boosting ${getRiderName(boostRider)}`}
              description="This will temporarily increase the rider's priority in the dispatch algorithm, giving them more delivery opportunities."
              showIcon
              icon={<RocketOutlined />}
              style={{ marginBottom: 16 }}
            />
            
            <div style={{ marginBottom: 16 }}>
              <Text strong>Boost Multiplier:</Text>
              <div style={{ marginTop: 8 }}>
                <Select
                  value={boostValue}
                  onChange={setBoostValue}
                  style={{ width: '100%' }}
                  options={[
                    { value: 1.5, label: '1.5x - Slight Boost' },
                    { value: 2.0, label: '2.0x - Double Priority' },
                    { value: 2.5, label: '2.5x - High Priority' },
                    { value: 3.0, label: '3.0x - Very High Priority' },
                    { value: 4.0, label: '4.0x - Maximum Priority' },
                    { value: 5.0, label: '5.0x - Ultra Priority' },
                  ]}
                />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <Text strong>Duration:</Text>
              <div style={{ marginTop: 8 }}>
                <Select
                  value={boostDuration}
                  onChange={setBoostDuration}
                  style={{ width: '100%' }}
                  options={[
                    { value: 1, label: '1 Hour' },
                    { value: 6, label: '6 Hours' },
                    { value: 12, label: '12 Hours' },
                    { value: 24, label: '24 Hours (1 Day)' },
                    { value: 48, label: '48 Hours (2 Days)' },
                    { value: 72, label: '72 Hours (3 Days)' },
                    { value: 168, label: '1 Week' },
                    { value: undefined, label: 'Permanent (No Expiry)' },
                  ]}
                />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <Text strong>Reason for Boost <Text type="danger">*</Text>:</Text>
              <TextArea
                rows={3}
                value={boostReason}
                onChange={(e) => setBoostReason(e.target.value)}
                placeholder="e.g., Rewarding excellent performance, Compensation for service issue, Promotional campaign..."
                style={{ marginTop: 8 }}
              />
            </div>
          </>
        )}
      </Modal>

      {/* Rejection Modal */}
      <Modal
        title={<><CloseOutlined style={{ color: '#ef4444', marginRight: 8 }} /> Reject Rider Application</>}
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
