'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { adminApi, normalizeImageUrl } from '@/lib/api';
import { 
  useSupportSocketStore, 
  SupportTicket, 
} from '@/lib/supportSocket';
import {
  Input,
  Select,
  Badge,
  Avatar,
  Button,
  Spin,
  Empty,
  Tag,
  Space,
  Card,
  Row,
  Col,
  Statistic,
  Divider,
  Typography,
  Tooltip,
  Drawer,
  Descriptions,
  Timeline,
  Tabs,
  Popconfirm,
  Rate,
  Dropdown,
  App,
  Upload,
  Modal,
  Image,
} from 'antd';
import type { UploadFile, RcFile } from 'antd/es/upload';
import {
  SendOutlined,
  SearchOutlined,
  FilterOutlined,
  UserOutlined,
  MessageOutlined,
  ReloadOutlined,
  CloseOutlined,
  CustomerServiceOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  FireOutlined,
  InboxOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  StarOutlined,
  InfoCircleOutlined,
  HistoryOutlined,
  PhoneOutlined,
  MailOutlined,
  SettingOutlined,
  PictureOutlined,
  FileOutlined,
  SyncOutlined,
  EyeOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Text, Title } = Typography;

const statusColors: Record<string, { color: string; bgColor: string; icon: React.ReactNode }> = {
  open: { color: '#faad14', bgColor: '#fffbe6', icon: <InboxOutlined /> },
  assigned: { color: '#1890ff', bgColor: '#e6f7ff', icon: <TeamOutlined /> },
  in_progress: { color: '#722ed1', bgColor: '#f9f0ff', icon: <SyncOutlined spin /> },
  waiting_user: { color: '#fa8c16', bgColor: '#fff7e6', icon: <ClockCircleOutlined /> },
  resolved: { color: '#52c41a', bgColor: '#f6ffed', icon: <CheckCircleOutlined /> },
  closed: { color: '#8c8c8c', bgColor: '#fafafa', icon: <CloseOutlined /> },
};

const priorityConfig: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  low: { color: 'default', label: 'Low', icon: null },
  medium: { color: 'blue', label: 'Medium', icon: null },
  high: { color: 'orange', label: 'High', icon: <ExclamationCircleOutlined /> },
  urgent: { color: 'red', label: 'Urgent', icon: <FireOutlined /> },
};

const categoryConfig: Record<string, { icon: string; label: string; color: string }> = {
  order: { icon: '📦', label: 'Order', color: '#1890ff' },
  payment: { icon: '💳', label: 'Payment', color: '#52c41a' },
  delivery: { icon: '🚚', label: 'Delivery', color: '#fa8c16' },
  account: { icon: '👤', label: 'Account', color: '#722ed1' },
  product: { icon: '🛍️', label: 'Product', color: '#eb2f96' },
  refund: { icon: '💰', label: 'Refund', color: '#13c2c2' },
  technical: { icon: '🔧', label: 'Technical', color: '#595959' },
  other: { icon: '❓', label: 'Other', color: '#8c8c8c' },
};

const quickReplies = [
  "Thank you for reaching out! I'm looking into this for you.",
  "Could you please provide more details about your issue?",
  "I've resolved the issue. Is there anything else I can help with?",
  "I'm escalating this to our technical team for further investigation.",
  "Your refund has been processed and should reflect within 3-5 business days.",
  "I apologize for the inconvenience. We're working to resolve this.",
];

export default function SupportPage() {
  const { message } = App.useApp();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState('details');
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [showTeamPanel, setShowTeamPanel] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    connect,
    isConnected,
    tickets,
    activeTicket,
    messages,
    typingUsers,
    setTickets,
    setActiveTicket,
    setMessages,
    joinTicket,
    leaveTicket,
    sendTyping,
  } = useSupportSocketStore();

  // Fetch support team members
  const { data: teamData = [], isLoading: loadingTeam, error: teamError } = useQuery({
    queryKey: ['support-team'],
    queryFn: async () => {
      try {
        const response = await adminApi.getSupportTeam();
        console.log('Support team response:', response.data);
        return response.data?.data || [];
      } catch (err) {
        console.error('Failed to fetch support team:', err);
        return [];
      }
    },
  });

  // Log team data for debugging
  useEffect(() => {
    console.log('Team data:', teamData, 'Loading:', loadingTeam, 'Error:', teamError);
  }, [teamData, loadingTeam, teamError]);

  // Fetch statistics
  const { data: statsData } = useQuery({
    queryKey: ['support-stats'],
    queryFn: async () => {
      const response = await adminApi.getSupportStatistics();
      return response.data.data || response.data;
    },
  });

  // Fetch tickets on mount
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const params: Record<string, string> = {};
        if (statusFilter) params.status = statusFilter;
        if (priorityFilter) params.priority = priorityFilter;
        if (categoryFilter) params.category = categoryFilter;
        if (searchQuery) params.search = searchQuery;

        const response = await adminApi.getSupportTickets(params);
        setTickets(response.data.data?.tickets || response.data.tickets || []);
      } catch (error) {
        console.error('Failed to fetch tickets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [statusFilter, priorityFilter, categoryFilter, searchQuery, setTickets]);

  // Connect to socket
  useEffect(() => {
    connect();
  }, [connect]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Select ticket
  const handleSelectTicket = useCallback(async (ticket: SupportTicket) => {
    if (activeTicket?.id) {
      leaveTicket(activeTicket.id);
    }

    setActiveTicket(ticket);
    joinTicket(ticket.id);

    try {
      const response = await adminApi.getSupportMessages(ticket.id);
      setMessages(response.data.data?.messages || response.data.messages || []);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  }, [activeTicket, leaveTicket, setActiveTicket, joinTicket, setMessages]);

  // Send message
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !activeTicket || sending) return;

    setSending(true);
    try {
      await adminApi.sendSupportMessage(activeTicket.id, messageInput.trim());
      setMessageInput('');
      sendTyping(activeTicket.id, false);
      setShowQuickReplies(false);
    } catch (error) {
      console.error('Failed to send message:', error);
      message.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Handle image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeTicket) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      message.error('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      message.error('Image size must be less than 5MB');
      return;
    }

    setUploadingImage(true);
    try {
      // Convert to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Upload image
      const uploadResponse = await adminApi.uploadImage(base64, 'support');
      const imageUrl = uploadResponse.data?.data?.url || uploadResponse.data?.url;

      if (!imageUrl) {
        throw new Error('Failed to get image URL');
      }

      // Send image message
      await adminApi.sendSupportMessage(
        activeTicket.id,
        imageUrl,
        'image',
        [{
          url: imageUrl,
          type: file.type,
          name: file.name,
          size: file.size,
        }]
      );

      message.success('Image sent successfully');
    } catch (error) {
      console.error('Failed to upload image:', error);
      message.error('Failed to send image');
    } finally {
      setUploadingImage(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle typing
  const handleTyping = (value: string) => {
    setMessageInput(value);
    if (activeTicket) {
      sendTyping(activeTicket.id, value.length > 0);
    }
  };

  // Send quick reply
  const handleQuickReply = (reply: string) => {
    setMessageInput(reply);
    setShowQuickReplies(false);
  };

  // Assign ticket to self
  const handleAssignToSelf = async () => {
    if (!activeTicket) return;

    try {
      await adminApi.assignSupportTicket(activeTicket.id);
      message.success('Ticket assigned to you');
    } catch (error) {
      console.error('Failed to assign ticket:', error);
      message.error('Failed to assign ticket');
    }
  };

  // Assign ticket to specific team member
  const handleAssignToMember = async (memberId: string, memberName: string) => {
    if (!activeTicket) return;

    try {
      await adminApi.assignSupportTicket(activeTicket.id, memberId);
      message.success(`Ticket assigned to ${memberName}`);
      setShowTeamPanel(false);
    } catch (error) {
      console.error('Failed to assign ticket:', error);
      message.error('Failed to assign ticket');
    }
  };

  // Update ticket status
  const handleUpdateStatus = async (status: string) => {
    if (!activeTicket) return;

    try {
      await adminApi.updateSupportTicketStatus(activeTicket.id, status);
      message.success('Status updated');
    } catch (error) {
      console.error('Failed to update status:', error);
      message.error('Failed to update status');
    }
  };

  // Filter tickets
  const filteredTickets = tickets.filter((ticket) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        ticket.ticketNumber.toLowerCase().includes(query) ||
        ticket.subject.toLowerCase().includes(query) ||
        ticket.user?.name?.toLowerCase().includes(query) ||
        ticket.user?.email?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }
    return true;
  });

  // Calculate stats from data or use defaults
  const stats = {
    total: statsData?.totalTickets || tickets.length,
    open: statsData?.openTickets || tickets.filter(t => t.status === 'open').length,
    inProgress: statsData?.inProgressTickets || tickets.filter(t => ['assigned', 'in_progress'].includes(t.status)).length,
    resolved: statsData?.resolvedTickets || tickets.filter(t => t.status === 'resolved').length,
    avgResponseTime: statsData?.avgResponseTime || '< 5 min',
    satisfactionRate: statsData?.satisfactionRate || 94,
  };

  // Format time
  const formatTime = (date: string) => {
    const d = dayjs(date);
    const now = dayjs();
    if (now.diff(d, 'day') < 1) {
      return d.format('HH:mm');
    }
    if (now.diff(d, 'day') < 7) {
      return d.format('ddd HH:mm');
    }
    return d.format('MMM D');
  };

  // Is user typing
  const isUserTyping = Object.values(typingUsers).some(Boolean);

  // Get ticket counts by status
  const getStatusCount = (status: string) => tickets.filter(t => t.status === status).length;

  return (
    <div style={{ margin: -24 }}>
      {/* Stats Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '24px 24px 80px 24px',
        marginBottom: -56,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ 
              width: 48, 
              height: 48, 
              borderRadius: 12, 
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <CustomerServiceOutlined style={{ fontSize: 24, color: '#fff' }} />
            </div>
            <div>
              <Title level={3} style={{ color: '#fff', margin: 0 }}>Support Center</Title>
              <Text style={{ color: 'rgba(255,255,255,0.8)' }}>Manage customer support tickets</Text>
            </div>
          </div>
          <Badge 
            status={isConnected ? 'success' : 'error'} 
            text={<span style={{ color: '#fff' }}>{isConnected ? 'Live' : 'Disconnected'}</span>} 
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ padding: '0 24px', marginBottom: 24 }}>
        <Row gutter={16}>
          <Col xs={12} sm={8} md={4}>
            <Card 
              size="small" 
              style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              styles={{ body: { padding: 16 } }}
            >
              <Statistic 
                title={<Text type="secondary" style={{ fontSize: 12 }}>Total</Text>}
                value={stats.total}
                prefix={<InboxOutlined style={{ color: '#1890ff' }} />}
                styles={{ content: { fontSize: 24 } }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Card 
              size="small" 
              style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              styles={{ body: { padding: 16 } }}
            >
              <Statistic 
                title={<Text type="secondary" style={{ fontSize: 12 }}>Open</Text>}
                value={stats.open}
                prefix={<ExclamationCircleOutlined style={{ color: '#faad14' }} />}
                styles={{ content: { fontSize: 24, color: '#faad14' } }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Card 
              size="small" 
              style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              styles={{ body: { padding: 16 } }}
            >
              <Statistic 
                title={<Text type="secondary" style={{ fontSize: 12 }}>In Progress</Text>}
                value={stats.inProgress}
                prefix={<SyncOutlined style={{ color: '#722ed1' }} />}
                styles={{ content: { fontSize: 24, color: '#722ed1' } }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Card 
              size="small" 
              style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              styles={{ body: { padding: 16 } }}
            >
              <Statistic 
                title={<Text type="secondary" style={{ fontSize: 12 }}>Resolved</Text>}
                value={stats.resolved}
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                styles={{ content: { fontSize: 24, color: '#52c41a' } }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Card 
              size="small" 
              style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              styles={{ body: { padding: 16 } }}
            >
              <Statistic 
                title={<Text type="secondary" style={{ fontSize: 12 }}>Avg Response</Text>}
                value={typeof stats.avgResponseTime === 'string' ? stats.avgResponseTime : `${stats.avgResponseTime}m`}
                prefix={<ClockCircleOutlined style={{ color: '#13c2c2' }} />}
                styles={{ content: { fontSize: 20 } }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Card 
              size="small" 
              style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              styles={{ body: { padding: 16 } }}
            >
              <Statistic 
                title={<Text type="secondary" style={{ fontSize: 12 }}>Satisfaction</Text>}
                value={stats.satisfactionRate}
                suffix="%"
                prefix={<StarOutlined style={{ color: '#eb2f96' }} />}
                styles={{ content: { fontSize: 24, color: '#eb2f96' } }}
              />
            </Card>
          </Col>
        </Row>
      </div>

      {/* Main Chat Interface */}
      <div style={{ padding: '0 24px 24px 24px' }}>
        <Card 
          style={{ borderRadius: 16, overflow: 'hidden', height: 'calc(100vh - 340px)', minHeight: 500 }}
          styles={{ body: { padding: 0, height: '100%', display: 'flex' } }}
        >
          {/* Ticket List Sidebar */}
          <div style={{ 
            width: 360, 
            minWidth: 360, 
            borderRight: '1px solid #f0f0f0', 
            display: 'flex', 
            flexDirection: 'column',
            backgroundColor: '#fafafa',
            height: '100%'
          }}>
            {/* Sidebar Header */}
            <div style={{ padding: 16, borderBottom: '1px solid #f0f0f0', background: '#fff' }}>
              {/* Search */}
              <Input
                prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ marginBottom: 12, borderRadius: 8 }}
                allowClear
              />

              {/* Quick Status Filters */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Tag 
                  color={!statusFilter ? 'purple' : 'default'} 
                  onClick={() => setStatusFilter('')}
                  style={{ cursor: 'pointer', borderRadius: 12, margin: 0 }}
                >
                  All ({tickets.length})
                </Tag>
                <Tag 
                  color={statusFilter === 'open' ? 'warning' : 'default'} 
                  onClick={() => setStatusFilter(statusFilter === 'open' ? '' : 'open')}
                  style={{ cursor: 'pointer', borderRadius: 12, margin: 0 }}
                >
                  Open ({getStatusCount('open')})
                </Tag>
                <Tag 
                  color={statusFilter === 'in_progress' ? 'purple' : 'default'} 
                  onClick={() => setStatusFilter(statusFilter === 'in_progress' ? '' : 'in_progress')}
                  style={{ cursor: 'pointer', borderRadius: 12, margin: 0 }}
                >
                  Active ({getStatusCount('in_progress') + getStatusCount('assigned')})
                </Tag>
                <Button
                  type="text"
                  size="small"
                  icon={<FilterOutlined />}
                  onClick={() => setShowFilters(!showFilters)}
                  style={{ marginLeft: 'auto' }}
                >
                  More
                </Button>
              </div>

              {/* Extended Filters */}
              {showFilters && (
                <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                  <Select
                    value={priorityFilter || undefined}
                    onChange={setPriorityFilter}
                    placeholder="Priority"
                    allowClear
                    size="small"
                    style={{ flex: 1 }}
                    options={[
                      { value: 'urgent', label: '🔥 Urgent' },
                      { value: 'high', label: '⚠️ High' },
                      { value: 'medium', label: '📋 Medium' },
                      { value: 'low', label: '📝 Low' },
                    ]}
                  />
                  <Select
                    value={categoryFilter || undefined}
                    onChange={setCategoryFilter}
                    placeholder="Category"
                    allowClear
                    size="small"
                    style={{ flex: 1 }}
                    options={Object.entries(categoryConfig).map(([key, { icon, label }]) => ({
                      value: key,
                      label: `${icon} ${label}`,
                    }))}
                  />
                </div>
              )}
            </div>

            {/* Ticket List */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
                  <Spin />
                </div>
              ) : filteredTickets.length === 0 ? (
                <Empty 
                  description="No tickets found" 
                  style={{ marginTop: 60 }}
                  image={Empty.PRESENTED_IMAGE_SIMPLE} 
                />
              ) : (
                filteredTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    onClick={() => handleSelectTicket(ticket)}
                    style={{
                      padding: '12px 16px',
                      cursor: 'pointer',
                      backgroundColor: activeTicket?.id === ticket.id ? '#f0e6ff' : 'transparent',
                      borderLeft: activeTicket?.id === ticket.id ? '3px solid #722ed1' : '3px solid transparent',
                      borderBottom: '1px solid #f0f0f0',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => { 
                      if (activeTicket?.id !== ticket.id) {
                        e.currentTarget.style.backgroundColor = '#f5f5f5';
                      }
                    }}
                    onMouseLeave={(e) => { 
                      if (activeTicket?.id !== ticket.id) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', gap: 12 }}>
                      {/* Avatar with badge */}
                      <Badge count={ticket.unreadCount} size="small" offset={[-4, 4]}>
                        <Avatar
                          src={normalizeImageUrl(ticket.user?.avatar)}
                          icon={!ticket.user?.avatar && <UserOutlined />}
                          size={44}
                          style={{ 
                            backgroundColor: ticket.priority === 'urgent' ? '#fff1f0' : '#f0e6ff', 
                            color: ticket.priority === 'urgent' ? '#ff4d4f' : '#722ed1',
                            border: ticket.priority === 'urgent' ? '2px solid #ff4d4f' : 'none',
                          }}
                        />
                      </Badge>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                          <Text strong style={{ fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {ticket.user?.name || 'Unknown User'}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 11, flexShrink: 0 }}>
                            {ticket.lastMessageAt ? formatTime(ticket.lastMessageAt) : formatTime(ticket.createdAt)}
                          </Text>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <Text type="secondary" style={{ fontSize: 11 }}>#{ticket.ticketNumber}</Text>
                          <span style={{ fontSize: 12 }}>{categoryConfig[ticket.category]?.icon}</span>
                          {ticket.priority === 'urgent' && (
                            <FireOutlined style={{ color: '#ff4d4f', fontSize: 12 }} />
                          )}
                          {ticket.priority === 'high' && (
                            <ExclamationCircleOutlined style={{ color: '#fa8c16', fontSize: 12 }} />
                          )}
                        </div>
                        
                        <Text 
                          style={{ 
                            fontSize: 13, 
                            color: '#595959',
                            display: 'block',
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis', 
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {ticket.lastMessage || ticket.subject}
                        </Text>

                        <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                          <Tag 
                            style={{ 
                              fontSize: 10, 
                              borderRadius: 10, 
                              margin: 0,
                              padding: '0 6px',
                              background: statusColors[ticket.status]?.bgColor,
                              color: statusColors[ticket.status]?.color,
                              border: 'none',
                            }}
                          >
                            {ticket.status.replace('_', ' ')}
                          </Tag>
                          {ticket.assignedTo && (
                            <Tag style={{ fontSize: 10, borderRadius: 10, margin: 0, padding: '0 6px' }}>
                              {ticket.assignedTo.name?.split(' ')[0]}
                            </Tag>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div style={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            backgroundColor: '#fff',
            minWidth: 0,
            height: '100%',
            overflow: 'hidden'
          }}>
            {activeTicket ? (
              <>
                {/* Chat Header */}
                <div style={{ 
                  padding: '12px 20px', 
                  backgroundColor: '#fff', 
                  borderBottom: '1px solid #f0f0f0',
                  flexShrink: 0
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Avatar
                        src={normalizeImageUrl(activeTicket.user?.avatar)}
                        icon={!activeTicket.user?.avatar && <UserOutlined />}
                        size={44}
                        style={{ backgroundColor: '#f0e6ff', color: '#722ed1' }}
                      />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Text strong style={{ fontSize: 15 }}>
                            {activeTicket.user?.name || 'Unknown User'}
                          </Text>
                          <Tag color="purple" style={{ borderRadius: 10, margin: 0, fontSize: 11 }}>
                            {activeTicket.user?.role}
                          </Tag>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {categoryConfig[activeTicket.category]?.icon} #{activeTicket.ticketNumber}
                          </Text>
                          <Tag 
                            style={{ 
                              fontSize: 10, 
                              borderRadius: 10, 
                              margin: 0,
                              background: statusColors[activeTicket.status]?.bgColor,
                              color: statusColors[activeTicket.status]?.color,
                              border: 'none',
                            }}
                          >
                            {activeTicket.status.replace('_', ' ')}
                          </Tag>
                          <Tag 
                            color={priorityConfig[activeTicket.priority]?.color}
                            style={{ fontSize: 10, borderRadius: 10, margin: 0 }}
                          >
                            {priorityConfig[activeTicket.priority]?.icon}
                            {activeTicket.priority}
                          </Tag>
                        </div>
                      </div>
                    </div>

                    <Space size={8}>
                      {/* Status Dropdown */}
                      <Select
                        value={activeTicket.status}
                        onChange={handleUpdateStatus}
                        size="small"
                        style={{ width: 130 }}
                        options={[
                          { value: 'open', label: '📥 Open' },
                          { value: 'assigned', label: '👤 Assigned' },
                          { value: 'in_progress', label: '🔄 In Progress' },
                          { value: 'waiting_user', label: '⏳ Waiting' },
                          { value: 'resolved', label: '✅ Resolved' },
                          { value: 'closed', label: '🔒 Closed' },
                        ]}
                      />

                      {/* Assign Button with Dropdown */}
                      <Dropdown
                        trigger={['click']}
                        menu={{
                          onClick: ({ key }) => {
                            if (key === 'take') {
                              handleAssignToSelf();
                            } else if (key !== 'team-header' && Array.isArray(teamData)) {
                              const member = teamData.find((m: { id: string }) => m.id === key);
                              if (member) {
                                handleAssignToMember(member.id, member.name);
                              }
                            }
                          },
                          items: [
                            {
                              key: 'take',
                              label: 'Take this ticket',
                              icon: <UserOutlined />,
                            },
                            { type: 'divider' },
                            {
                              key: 'team-header',
                              label: <Text strong style={{ fontSize: 12 }}>Assign to team member</Text>,
                              disabled: true,
                            },
                            ...(Array.isArray(teamData) ? teamData.map((member: { id: string; name: string; role: string; activeTickets: number; avatar?: string }) => ({
                              key: member.id,
                              label: (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: 180 }}>
                                  <Space size={8}>
                                    <Avatar src={normalizeImageUrl(member.avatar)} size={24} icon={<UserOutlined />} />
                                    <div>
                                      <Text style={{ fontSize: 13 }}>{member.name}</Text>
                                      <br />
                                      <Text type="secondary" style={{ fontSize: 11 }}>{member.role}</Text>
                                    </div>
                                  </Space>
                                  <Badge count={member.activeTickets} style={{ backgroundColor: member.activeTickets > 5 ? '#ff4d4f' : '#52c41a' }} />
                                </div>
                              ),
                            })) : []),
                          ],
                        }}
                      >
                        <Button 
                          type="primary" 
                          size="small"
                          icon={<TeamOutlined />}
                          style={{ background: '#722ed1', borderColor: '#722ed1' }}
                        >
                          {activeTicket.assignedToId ? 'Reassign' : 'Assign'}
                        </Button>
                      </Dropdown>

                      {/* Team Panel Toggle */}
                      <Button
                        type={showTeamPanel ? 'primary' : 'text'}
                        size="small"
                        icon={<TeamOutlined />}
                        onClick={() => setShowTeamPanel(!showTeamPanel)}
                        style={showTeamPanel ? { background: '#722ed1', borderColor: '#722ed1' } : {}}
                      />

                      {/* Info Button */}
                      <Button
                        type="text"
                        size="small"
                        icon={<InfoCircleOutlined />}
                        onClick={() => setDetailsDrawerOpen(true)}
                      />

                      {/* Close Button */}
                      <Button
                        type="text"
                        size="small"
                        icon={<CloseOutlined />}
                        onClick={() => {
                          if (activeTicket) leaveTicket(activeTicket.id);
                          setActiveTicket(null);
                          setMessages([]);
                        }}
                      />
                    </Space>
                  </div>
                </div>

                {/* Messages */}
                <div style={{ 
                  flex: 1, 
                  overflowY: 'auto', 
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  background: 'linear-gradient(180deg, #f8f9fa 0%, #fff 100%)'
                }}>
                  {/* Initial ticket info */}
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '12px 20px', 
                    background: '#f0f0f0', 
                    borderRadius: 12,
                    margin: '0 auto 8px auto',
                  }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Ticket created on {dayjs(activeTicket.createdAt).format('MMMM D, YYYY [at] h:mm A')}
                    </Text>
                    <br />
                    <Text strong style={{ fontSize: 13 }}>{activeTicket.subject}</Text>
                  </div>

                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      style={{ 
                        display: 'flex', 
                        justifyContent: msg.senderType === 'agent' ? 'flex-end' : 'flex-start',
                        alignItems: 'flex-end',
                        gap: 8
                      }}
                    >
                      {/* Avatar for user messages */}
                      {msg.senderType === 'user' && (
                        <Avatar 
                          src={normalizeImageUrl(msg.sender?.avatar)} 
                          icon={!msg.sender?.avatar && <UserOutlined />}
                          size={32}
                          style={{ backgroundColor: '#f0e6ff', color: '#722ed1', flexShrink: 0 }}
                        />
                      )}
                      
                      {/* System message */}
                      {msg.senderType === 'system' ? (
                        <div style={{ 
                          width: '100%',
                          textAlign: 'center',
                          padding: '8px 16px',
                        }}>
                          <Tag style={{ borderRadius: 12, background: '#f0f0f0', border: 'none' }}>
                            <SettingOutlined style={{ marginRight: 4 }} />
                            {msg.content}
                          </Tag>
                        </div>
                      ) : (
                        <div
                          style={{
                            maxWidth: '65%',
                            padding: '10px 14px',
                            borderRadius: 16,
                            ...(msg.senderType === 'agent' ? {
                              background: 'linear-gradient(135deg, #722ed1 0%, #9254de 100%)',
                              color: '#fff',
                              borderBottomRightRadius: 4,
                              boxShadow: '0 2px 8px rgba(114, 46, 209, 0.25)'
                            } : {
                              backgroundColor: '#fff',
                              color: '#262626',
                              borderBottomLeftRadius: 4,
                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                              border: '1px solid #f0f0f0'
                            })
                          }}
                        >
                          {msg.senderType === 'user' && (
                            <Text style={{ fontSize: 11, color: '#722ed1', fontWeight: 600, display: 'block', marginBottom: 2 }}>
                              {msg.sender?.name}
                            </Text>
                          )}
                          
                          {/* Image message - content is the image URL */}
                          {msg.type === 'image' && msg.content?.startsWith('http') && (
                            <div 
                              style={{ 
                                marginBottom: 4,
                                cursor: 'pointer',
                              }}
                              onClick={() => setPreviewImage(msg.content)}
                            >
                              <img
                                src={msg.content}
                                alt="Image"
                                style={{
                                  maxWidth: 200,
                                  maxHeight: 200,
                                  borderRadius: 8,
                                  objectFit: 'cover',
                                  display: 'block',
                                }}
                              />
                            </div>
                          )}
                          
                          {/* Attachments - Images displayed inline */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div style={{ marginBottom: msg.type === 'image' ? 0 : 8 }}>
                              {msg.attachments.map((att, idx) => (
                                att.type?.includes('image') ? (
                                  <div 
                                    key={idx} 
                                    style={{ 
                                      marginBottom: 4,
                                      cursor: 'pointer',
                                    }}
                                    onClick={() => setPreviewImage(att.url)}
                                  >
                                    <img
                                      src={att.url}
                                      alt={att.name || 'Image'}
                                      style={{
                                        maxWidth: 200,
                                        maxHeight: 200,
                                        borderRadius: 8,
                                        objectFit: 'cover',
                                        display: 'block',
                                      }}
                                    />
                                  </div>
                                ) : (
                                  <div key={idx} style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: 8, 
                                    padding: '6px 10px',
                                    background: msg.senderType === 'agent' ? 'rgba(255,255,255,0.15)' : '#f5f5f5',
                                    borderRadius: 8,
                                    marginBottom: 4,
                                  }}>
                                    <FileOutlined />
                                    <a 
                                      href={att.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      style={{ color: msg.senderType === 'agent' ? '#fff' : '#722ed1', fontSize: 12 }}
                                    >
                                      {att.name}
                                    </a>
                                  </div>
                                )
                              ))}
                            </div>
                          )}
                          
                          {/* Only show text content if not an image-only message */}
                          {msg.type !== 'image' && (
                            <Text style={{ 
                              whiteSpace: 'pre-wrap', 
                              wordBreak: 'break-word', 
                              fontSize: 14, 
                              lineHeight: 1.5,
                              color: msg.senderType === 'agent' ? '#fff' : '#262626',
                            }}>
                              {msg.content}
                            </Text>
                          )}
                          <Text style={{ 
                            fontSize: 10, 
                            marginTop: 4, 
                            display: 'block',
                            color: msg.senderType === 'agent' ? 'rgba(255,255,255,0.7)' : '#bfbfbf',
                            textAlign: msg.senderType === 'agent' ? 'right' : 'left'
                          }}>
                            {dayjs(msg.createdAt).format('HH:mm')}
                            {msg.senderType === 'agent' && msg.isRead && (
                              <CheckCircleOutlined style={{ marginLeft: 4 }} />
                            )}
                          </Text>
                        </div>
                      )}
                      
                      {/* Avatar for agent messages */}
                      {msg.senderType === 'agent' && (
                        <Avatar 
                          icon={<CustomerServiceOutlined />}
                          size={32}
                          style={{ 
                            background: 'linear-gradient(135deg, #722ed1 0%, #9254de 100%)', 
                            color: '#fff', 
                            flexShrink: 0 
                          }}
                        />
                      )}
                    </div>
                  ))}
                  
                  {/* Typing Indicator */}
                  {isUserTyping && (
                    <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-end', gap: 8 }}>
                      <Avatar 
                        icon={<UserOutlined />}
                        size={32}
                        style={{ backgroundColor: '#f0e6ff', color: '#722ed1', flexShrink: 0 }}
                      />
                      <div style={{ 
                        backgroundColor: '#fff', 
                        borderRadius: 16, 
                        borderBottomLeftRadius: 4,
                        padding: '12px 16px', 
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                        border: '1px solid #f0f0f0'
                      }}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <span style={{ 
                            width: 8, 
                            height: 8, 
                            backgroundColor: '#bfbfbf', 
                            borderRadius: '50%',
                            animation: 'bounce 1.4s infinite ease-in-out both',
                            animationDelay: '0ms'
                          }} />
                          <span style={{ 
                            width: 8, 
                            height: 8, 
                            backgroundColor: '#bfbfbf', 
                            borderRadius: '50%',
                            animation: 'bounce 1.4s infinite ease-in-out both',
                            animationDelay: '160ms'
                          }} />
                          <span style={{ 
                            width: 8, 
                            height: 8, 
                            backgroundColor: '#bfbfbf', 
                            borderRadius: '50%',
                            animation: 'bounce 1.4s infinite ease-in-out both',
                            animationDelay: '320ms'
                          }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Replies */}
                {showQuickReplies && (
                  <div style={{ 
                    padding: '12px 20px', 
                    backgroundColor: '#fafafa', 
                    borderTop: '1px solid #f0f0f0',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 8,
                  }}>
                    {quickReplies.map((reply, index) => (
                      <Tag
                        key={index}
                        onClick={() => handleQuickReply(reply)}
                        style={{ 
                          cursor: 'pointer', 
                          borderRadius: 12, 
                          padding: '4px 10px',
                          fontSize: 12,
                          background: '#fff',
                          border: '1px solid #d9d9d9',
                        }}
                      >
                        {reply.length > 40 ? reply.substring(0, 40) + '...' : reply}
                      </Tag>
                    ))}
                  </div>
                )}

                {/* Input Area */}
                <div style={{ 
                  padding: 16, 
                  backgroundColor: '#fff', 
                  borderTop: '1px solid #f0f0f0',
                  flexShrink: 0
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'flex-end', 
                    gap: 8,
                    backgroundColor: '#f5f5f5',
                    borderRadius: 24,
                    padding: '6px 6px 6px 16px',
                  }}>
                    {/* Quick reply toggle */}
                    <Tooltip title="Quick Replies">
                      <Button
                        type="text"
                        size="small"
                        icon={<ThunderboltOutlined style={{ color: showQuickReplies ? '#722ed1' : '#8c8c8c' }} />}
                        onClick={() => setShowQuickReplies(!showQuickReplies)}
                        style={{ marginBottom: 4 }}
                      />
                    </Tooltip>

                    {/* Image upload button */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleImageUpload}
                    />
                    <Tooltip title="Send Image">
                      <Button
                        type="text"
                        size="small"
                        icon={uploadingImage ? <ReloadOutlined spin /> : <PictureOutlined style={{ color: '#8c8c8c' }} />}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage}
                        style={{ marginBottom: 4 }}
                      />
                    </Tooltip>

                    <Input.TextArea
                      value={messageInput}
                      onChange={(e) => handleTyping(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Type a message..."
                      autoSize={{ minRows: 1, maxRows: 4 }}
                      variant="borderless"
                      style={{ 
                        flex: 1, 
                        resize: 'none', 
                        lineHeight: '1.5',
                        backgroundColor: 'transparent',
                        padding: '4px 0'
                      }}
                    />
                    
                    <Button
                      type="primary"
                      shape="circle"
                      icon={sending ? <ReloadOutlined spin /> : <SendOutlined />}
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim() || sending}
                      style={{ 
                        flexShrink: 0,
                        background: 'linear-gradient(135deg, #722ed1 0%, #9254de 100%)',
                        border: 'none',
                        boxShadow: '0 2px 8px rgba(114, 46, 209, 0.3)'
                      }}
                    />
                  </div>
                </div>
              </>
            ) : (
              /* Empty State */
              <div style={{ 
                flex: 1, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: 'linear-gradient(180deg, #f8f9fa 0%, #fff 100%)'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    width: 80, 
                    height: 80, 
                    borderRadius: 20, 
                    background: 'linear-gradient(135deg, #f0e6ff 0%, #e6d6ff 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px auto',
                  }}>
                    <MessageOutlined style={{ fontSize: 36, color: '#722ed1' }} />
                  </div>
                  <Title level={4} style={{ margin: 0, color: '#262626' }}>Select a Conversation</Title>
                  <Text type="secondary" style={{ marginTop: 8, display: 'block' }}>
                    Choose a ticket from the list to start helping customers
                  </Text>
                </div>
              </div>
            )}
          </div>

          {/* Team Panel */}
          {showTeamPanel && (
            <div style={{ 
              width: 280, 
              minWidth: 280, 
              borderLeft: '1px solid #f0f0f0', 
              display: 'flex', 
              flexDirection: 'column',
              backgroundColor: '#fafafa',
              height: '100%'
            }}>
              {/* Team Panel Header */}
              <div style={{ 
                padding: '16px', 
                borderBottom: '1px solid #f0f0f0', 
                background: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <Space>
                  <TeamOutlined style={{ color: '#722ed1' }} />
                  <Text strong>Support Team</Text>
                </Space>
                <Button
                  type="text"
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={() => setShowTeamPanel(false)}
                />
              </div>

              {/* Team Members List */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
                {loadingTeam ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 100 }}>
                    <Spin size="small" />
                  </div>
                ) : Array.isArray(teamData) && teamData.length > 0 ? (
                  teamData.map((member: { id: string; name: string; email: string; role: string; activeTickets: number; avatar?: string }) => (
                    <Card 
                      key={member.id}
                      size="small"
                      style={{ 
                        marginBottom: 8, 
                        borderRadius: 8,
                        cursor: activeTicket ? 'pointer' : 'default',
                        transition: 'all 0.2s',
                      }}
                      styles={{ body: { padding: 12 } }}
                      hoverable={!!activeTicket}
                      onClick={() => activeTicket && handleAssignToMember(member.id, member.name)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Badge dot status="success" offset={[-4, 32]}>
                          <Avatar 
                            src={normalizeImageUrl(member.avatar)} 
                            icon={<UserOutlined />} 
                            size={40}
                            style={{ backgroundColor: '#f0e6ff', color: '#722ed1' }}
                          />
                        </Badge>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Text strong style={{ display: 'block', fontSize: 13 }}>{member.name}</Text>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            {member.role === 'superadmin' ? 'Super Admin' : 
                             member.role === 'admin' ? 'Admin' : 
                             member.role === 'support' ? 'Support' : member.role}
                          </Text>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <Badge 
                            count={member.activeTickets} 
                            style={{ 
                              backgroundColor: member.activeTickets === 0 ? '#d9d9d9' : 
                                              member.activeTickets > 5 ? '#ff4d4f' : '#52c41a' 
                            }} 
                          />
                          <Text type="secondary" style={{ display: 'block', fontSize: 10, marginTop: 2 }}>
                            {member.activeTickets === 0 ? 'Available' : 'Active'}
                          </Text>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <Empty 
                    description="No team members" 
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    style={{ marginTop: 40 }} 
                  />
                )}
              </div>

              {/* Team Stats */}
              <div style={{ 
                padding: '12px 16px', 
                borderTop: '1px solid #f0f0f0', 
                background: '#fff'
              }}>
                <Row gutter={8}>
                  <Col span={12}>
                    <Statistic 
                      title={<Text type="secondary" style={{ fontSize: 11 }}>Online</Text>}
                      value={Array.isArray(teamData) ? teamData.length : 0}
                      prefix={<Badge status="success" />}
                      styles={{ content: { fontSize: 18 } }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic 
                      title={<Text type="secondary" style={{ fontSize: 11 }}>Active Tickets</Text>}
                      value={Array.isArray(teamData) ? teamData.reduce((sum: number, m: { activeTickets: number }) => sum + m.activeTickets, 0) : 0}
                      styles={{ content: { fontSize: 18 } }}
                    />
                  </Col>
                </Row>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Ticket Details Drawer */}
      <Drawer
        title={
          <Space>
            <InfoCircleOutlined style={{ color: '#722ed1' }} />
            <span>Ticket Details</span>
          </Space>
        }
        open={detailsDrawerOpen}
        onClose={() => setDetailsDrawerOpen(false)}
        size="default"
        styles={{ body: { width: 420 } }}
      >
        {activeTicket && (
          <Tabs 
            activeKey={drawerTab} 
            onChange={setDrawerTab}
            items={[
              {
                key: 'details',
                label: <span><EyeOutlined /> Details</span>,
                children: (
                  <>
                    {/* User Card */}
                    <Card size="small" style={{ marginBottom: 16, borderRadius: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Avatar 
                          src={normalizeImageUrl(activeTicket.user?.avatar)}
                          icon={!activeTicket.user?.avatar && <UserOutlined />}
                          size={56}
                          style={{ backgroundColor: '#f0e6ff', color: '#722ed1' }}
                        />
                        <div>
                          <Text strong style={{ fontSize: 16 }}>{activeTicket.user?.name || 'Unknown'}</Text>
                          <br />
                          <Tag color="purple" style={{ marginTop: 4 }}>{activeTicket.user?.role}</Tag>
                        </div>
                      </div>
                      <Divider style={{ margin: '12px 0' }} />
                      <Space orientation="vertical" size={8} style={{ width: '100%' }}>
                        {activeTicket.user?.email && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <MailOutlined style={{ color: '#8c8c8c' }} />
                            <Text copyable>{activeTicket.user.email}</Text>
                          </div>
                        )}
                        {activeTicket.user?.phone && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <PhoneOutlined style={{ color: '#8c8c8c' }} />
                            <Text copyable>{activeTicket.user.phone}</Text>
                          </div>
                        )}
                      </Space>
                    </Card>

                    {/* Ticket Info */}
                    <Descriptions column={1} size="small" bordered>
                      <Descriptions.Item label="Ticket #">
                        <Text copyable>{activeTicket.ticketNumber}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Subject">
                        {activeTicket.subject}
                      </Descriptions.Item>
                      <Descriptions.Item label="Category">
                        <Tag color={categoryConfig[activeTicket.category]?.color} style={{ borderRadius: 10 }}>
                          {categoryConfig[activeTicket.category]?.icon} {categoryConfig[activeTicket.category]?.label}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Priority">
                        <Tag color={priorityConfig[activeTicket.priority]?.color} style={{ borderRadius: 10 }}>
                          {priorityConfig[activeTicket.priority]?.icon}
                          {priorityConfig[activeTicket.priority]?.label}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Status">
                        <Tag 
                          style={{ 
                            borderRadius: 10,
                            background: statusColors[activeTicket.status]?.bgColor,
                            color: statusColors[activeTicket.status]?.color,
                            border: 'none',
                          }}
                        >
                          {statusColors[activeTicket.status]?.icon} {activeTicket.status.replace('_', ' ')}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Created">
                        {dayjs(activeTicket.createdAt).format('MMM D, YYYY h:mm A')}
                      </Descriptions.Item>
                      {activeTicket.assignedTo && (
                        <Descriptions.Item label="Assigned To">
                          <Space>
                            <Avatar size="small" src={normalizeImageUrl(activeTicket.assignedTo.avatar)} icon={<UserOutlined />} />
                            {activeTicket.assignedTo.name}
                          </Space>
                        </Descriptions.Item>
                      )}
                      {activeTicket.orderId && (
                        <Descriptions.Item label="Related Order">
                          <Text copyable style={{ color: '#722ed1' }}>#{activeTicket.orderId}</Text>
                        </Descriptions.Item>
                      )}
                    </Descriptions>

                    {/* Rating */}
                    {activeTicket.rating && (
                      <Card size="small" style={{ marginTop: 16, borderRadius: 12 }}>
                        <Text type="secondary" style={{ marginBottom: 8, display: 'block' }}>Customer Rating</Text>
                        <Rate disabled value={activeTicket.rating} />
                        {activeTicket.feedback && (
                          <Text type="secondary" style={{ marginTop: 8, display: 'block', fontStyle: 'italic' }}>
                            &quot;{activeTicket.feedback}&quot;
                          </Text>
                        )}
                      </Card>
                    )}
                  </>
                ),
              },
              {
                key: 'timeline',
                label: <span><HistoryOutlined /> Timeline</span>,
                children: (
                  <Timeline
                    items={[
                      {
                        color: 'purple',
                        dot: <InboxOutlined style={{ fontSize: 16 }} />,
                        children: (
                          <div>
                            <Text strong>Ticket Created</Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {dayjs(activeTicket.createdAt).format('MMM D, YYYY h:mm A')}
                            </Text>
                          </div>
                        ),
                      },
                      ...(activeTicket.assignedTo ? [{
                        color: 'blue' as const,
                        dot: <TeamOutlined style={{ fontSize: 16 }} />,
                        children: (
                          <div>
                            <Text strong>Assigned to {activeTicket.assignedTo.name}</Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              Ticket taken by agent
                            </Text>
                          </div>
                        ),
                      }] : []),
                      ...(activeTicket.status === 'resolved' || activeTicket.status === 'closed' ? [{
                        color: 'green' as const,
                        dot: <CheckCircleOutlined style={{ fontSize: 16 }} />,
                        children: (
                          <div>
                            <Text strong>Ticket {activeTicket.status}</Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {dayjs(activeTicket.updatedAt).format('MMM D, YYYY h:mm A')}
                            </Text>
                          </div>
                        ),
                      }] : []),
                    ]}
                  />
                ),
              },
              {
                key: 'actions',
                label: <span><SettingOutlined /> Actions</span>,
                children: (
                  <Space orientation="vertical" size={12} style={{ width: '100%' }}>
                    <Button 
                      block 
                      icon={<TeamOutlined />}
                      onClick={handleAssignToSelf}
                      disabled={!!activeTicket.assignedToId}
                    >
                      {activeTicket.assignedToId ? 'Already Assigned' : 'Assign to Me'}
                    </Button>
                    
                    <Divider style={{ margin: '8px 0' }} />
                    
                    <Text type="secondary" style={{ fontSize: 12 }}>Change Status</Text>
                    <Space wrap>
                      {Object.entries(statusColors).map(([status, config]) => (
                        <Button
                          key={status}
                          size="small"
                          onClick={() => handleUpdateStatus(status)}
                          disabled={activeTicket.status === status}
                          style={{ 
                            borderRadius: 12,
                            background: activeTicket.status === status ? config.bgColor : undefined,
                            borderColor: activeTicket.status === status ? config.color : undefined,
                            color: activeTicket.status === status ? config.color : undefined,
                          }}
                        >
                          {status.replace('_', ' ')}
                        </Button>
                      ))}
                    </Space>

                    <Divider style={{ margin: '8px 0' }} />

                    <Popconfirm
                      title="Close this ticket?"
                      description="This will mark the ticket as closed."
                      onConfirm={() => handleUpdateStatus('closed')}
                      okText="Yes, close"
                      cancelText="Cancel"
                    >
                      <Button block danger icon={<CloseOutlined />} disabled={activeTicket.status === 'closed'}>
                        Close Ticket
                      </Button>
                    </Popconfirm>
                  </Space>
                ),
              },
            ]}
          />
        )}
      </Drawer>

      {/* Image Preview Modal */}
      <Modal
        open={!!previewImage}
        footer={null}
        onCancel={() => setPreviewImage(null)}
        width={800}
        centered
        styles={{
          body: { padding: 0, textAlign: 'center' },
        }}
      >
        {previewImage && (
          <img
            src={previewImage}
            alt="Preview"
            style={{
              maxWidth: '100%',
              maxHeight: '80vh',
              objectFit: 'contain',
            }}
          />
        )}
      </Modal>

      {/* CSS for bounce animation */}
      <style jsx global>{`
        @keyframes bounce {
          0%, 80%, 100% { 
            transform: scale(0);
          } 
          40% { 
            transform: scale(1.0);
          }
        }
      `}</style>
    </div>
  );
}
