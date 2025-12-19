'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { adminApi } from '@/lib/api';
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
} from 'antd';
import {
  SendOutlined,
  SearchOutlined,
  FilterOutlined,
  UserOutlined,
  MessageOutlined,
  ReloadOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const statusColors: Record<string, { color: string }> = {
  open: { color: 'warning' },
  assigned: { color: 'processing' },
  in_progress: { color: 'purple' },
  waiting_user: { color: 'orange' },
  resolved: { color: 'success' },
  closed: { color: 'default' },
};

const priorityColors: Record<string, { color: string }> = {
  low: { color: 'default' },
  medium: { color: 'blue' },
  high: { color: 'orange' },
  urgent: { color: 'red' },
};

const categoryIcons: Record<string, string> = {
  order: '📦',
  payment: '💳',
  delivery: '🚚',
  account: '👤',
  product: '🛍️',
  refund: '💰',
  technical: '🔧',
  other: '❓',
};

export default function SupportPage() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
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

  // Fetch tickets on mount
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const params: Record<string, string> = {};
        if (statusFilter) params.status = statusFilter;
        if (priorityFilter) params.priority = priorityFilter;
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
  }, [statusFilter, priorityFilter, searchQuery, setTickets]);

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
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  // Handle typing
  const handleTyping = (value: string) => {
    setMessageInput(value);
    if (activeTicket) {
      sendTyping(activeTicket.id, value.length > 0);
    }
  };

  // Assign ticket to self
  const handleAssignToSelf = async () => {
    if (!activeTicket) return;

    try {
      await adminApi.assignSupportTicket(activeTicket.id);
      // Ticket will be updated via socket
    } catch (error) {
      console.error('Failed to assign ticket:', error);
    }
  };

  // Update ticket status
  const handleUpdateStatus = async (status: string) => {
    if (!activeTicket) return;

    try {
      await adminApi.updateSupportTicketStatus(activeTicket.id, status);
    } catch (error) {
      console.error('Failed to update status:', error);
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

  // Format time
  const formatTime = (date: string) => {
    const d = dayjs(date);
    const now = dayjs();
    if (now.diff(d, 'day') < 1) {
      return d.format('HH:mm');
    }
    return d.format('MMM D');
  };

  // Is user typing
  const isUserTyping = Object.values(typingUsers).some(Boolean);

  return (
    <div 
      style={{ 
        display: 'flex',
        margin: -24, 
        height: 'calc(100vh - 64px)',
        backgroundColor: '#fff',
        borderRadius: 8,
        overflow: 'hidden'
      }}
    >
      {/* Ticket List Sidebar */}
      <div style={{ 
        width: 320, 
        minWidth: 320, 
        borderRight: '1px solid #e5e7eb', 
        display: 'flex', 
        flexDirection: 'column',
        backgroundColor: '#fff',
        height: '100%'
      }}>
        {/* Header */}
        <div style={{ padding: 16, borderBottom: '1px solid #e5e7eb', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h1 style={{ fontSize: 18, fontWeight: 600, color: '#111827', margin: 0 }}>Support Chat</h1>
            <Badge status={isConnected ? 'success' : 'error'} text={isConnected ? 'Connected' : 'Disconnected'} />
          </div>

          {/* Search */}
          <Input
            prefix={<SearchOutlined className="text-gray-400" />}
            placeholder="Search tickets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-2"
          />

          {/* Filter Toggle */}
          <Button
            type="text"
            icon={<FilterOutlined />}
            onClick={() => setShowFilters(!showFilters)}
            className="text-gray-600"
          >
            Filters
            {(statusFilter || priorityFilter) && (
              <Badge count={[statusFilter, priorityFilter].filter(Boolean).length} size="small" className="ml-2" />
            )}
          </Button>

          {/* Filters */}
          {showFilters && (
            <div className="mt-3 space-y-2">
              <Select
                value={statusFilter || undefined}
                onChange={setStatusFilter}
                placeholder="All Status"
                allowClear
                className="w-full"
                options={[
                  { value: 'open', label: 'Open' },
                  { value: 'assigned', label: 'Assigned' },
                  { value: 'in_progress', label: 'In Progress' },
                  { value: 'waiting_user', label: 'Waiting for User' },
                  { value: 'resolved', label: 'Resolved' },
                  { value: 'closed', label: 'Closed' },
                ]}
              />
              <Select
                value={priorityFilter || undefined}
                onChange={setPriorityFilter}
                placeholder="All Priority"
                allowClear
                className="w-full"
                options={[
                  { value: 'urgent', label: 'Urgent' },
                  { value: 'high', label: 'High' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'low', label: 'Low' },
                ]}
              />
            </div>
          )}
        </div>

        {/* Ticket List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 128 }}>
              <Spin />
            </div>
          ) : filteredTickets.length === 0 ? (
            <Empty description="No tickets found" style={{ marginTop: 32 }} image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => handleSelectTicket(ticket)}
                style={{
                  padding: 12,
                  cursor: 'pointer',
                }}
              >
                <div 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    gap: 12,
                    padding: 12,
                    backgroundColor: activeTicket?.id === ticket.id ? '#f3e8ff' : '#fff',
                    borderRadius: 16,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    border: activeTicket?.id === ticket.id ? '2px solid #9333ea' : '1px solid #e5e7eb',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => { 
                    if (activeTicket?.id !== ticket.id) {
                      e.currentTarget.style.backgroundColor = '#faf5ff';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                    }
                  }}
                  onMouseLeave={(e) => { 
                    if (activeTicket?.id !== ticket.id) {
                      e.currentTarget.style.backgroundColor = '#fff';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                    }
                  }}
                >
                  {/* Avatar */}
                  <Badge count={ticket.unreadCount} size="small">
                    <Avatar
                      src={ticket.user?.avatar}
                      icon={!ticket.user?.avatar && <UserOutlined />}
                      size={44}
                      style={{ backgroundColor: '#f3e8ff', color: '#9333ea' }}
                    />
                  </Badge>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{ fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, fontSize: 14 }}>
                        {ticket.user?.name || 'Unknown User'}
                      </span>
                      <span style={{ fontSize: 11, color: '#9ca3af', flexShrink: 0 }}>
                        {ticket.lastMessageAt ? formatTime(ticket.lastMessageAt) : formatTime(ticket.createdAt)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <span style={{ fontSize: 11, color: '#9ca3af' }}>#{ticket.ticketNumber}</span>
                      <span style={{ fontSize: 11 }}>{categoryIcons[ticket.category]}</span>
                    </div>
                    {/* Message bubble */}
                    <div style={{ 
                      backgroundColor: '#f3f4f6', 
                      borderRadius: 12, 
                      borderTopLeftRadius: 4,
                      padding: '8px 12px', 
                      marginTop: 8,
                      maxWidth: '100%'
                    }}>
                      <p style={{ 
                        fontSize: 13, 
                        color: '#374151', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap', 
                        margin: 0,
                        lineHeight: 1.4
                      }} title={ticket.lastMessage || ticket.subject}>
                        {ticket.lastMessage || ticket.subject}
                      </p>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                      <Tag color={statusColors[ticket.status]?.color} style={{ fontSize: 11, borderRadius: 10, margin: 0 }}>
                        {ticket.status.replace('_', ' ')}
                      </Tag>
                      <Tag color={priorityColors[ticket.priority]?.color} style={{ fontSize: 11, borderRadius: 10, margin: 0 }}>
                        {ticket.priority}
                      </Tag>
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
        backgroundColor: '#f9fafb',
        minWidth: 0,
        height: '100%',
        overflow: 'hidden'
      }}>
        {activeTicket ? (
          <>
            {/* Chat Header */}
            <div style={{ 
              padding: 16, 
              backgroundColor: '#fff', 
              borderBottom: '1px solid #e5e7eb',
              flexShrink: 0
            }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar
                    src={activeTicket.user?.avatar}
                    icon={!activeTicket.user?.avatar && <UserOutlined />}
                    size={40}
                    className="bg-purple-100 text-purple-600"
                  />
                  <div>
                    <h2 className="font-semibold text-gray-900">
                      {activeTicket.user?.name || 'Unknown User'}
                    </h2>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span className="capitalize">{activeTicket.user?.role}</span>
                      {activeTicket.user?.email && (
                        <>
                          <span>•</span>
                          <span>{activeTicket.user.email}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <Space>
                  {/* Status Dropdown */}
                  <Select
                    value={activeTicket.status}
                    onChange={handleUpdateStatus}
                    className="w-36"
                    options={[
                      { value: 'open', label: 'Open' },
                      { value: 'assigned', label: 'Assigned' },
                      { value: 'in_progress', label: 'In Progress' },
                      { value: 'waiting_user', label: 'Waiting for User' },
                      { value: 'resolved', label: 'Resolved' },
                      { value: 'closed', label: 'Closed' },
                    ]}
                  />

                  {/* Assign Button */}
                  {!activeTicket.assignedToId && (
                    <Button type="primary" onClick={handleAssignToSelf}>
                      Assign to Me
                    </Button>
                  )}

                  {/* Close Chat Button */}
                  <Button
                    type="text"
                    icon={<CloseOutlined />}
                    onClick={() => {
                      if (activeTicket) leaveTicket(activeTicket.id);
                      setActiveTicket(null);
                      setMessages([]);
                    }}
                  />
                </Space>
              </div>

              {/* Ticket Info Bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12, fontSize: 13, color: '#6b7280' }}>
                <span>#{activeTicket.ticketNumber}</span>
                <span>•</span>
                <span>{categoryIcons[activeTicket.category]} {activeTicket.category}</span>
                <span>•</span>
                <Tag color={priorityColors[activeTicket.priority]?.color} style={{ borderRadius: 10, margin: 0 }}>
                  {activeTicket.priority} priority
                </Tag>
                {activeTicket.assignedTo && (
                  <>
                    <span>•</span>
                    <span>Assigned to: {activeTicket.assignedTo.name}</span>
                  </>
                )}
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
              backgroundColor: '#f8fafc'
            }}>
              {messages.map((message) => (
                <div
                  key={message.id}
                  style={{ 
                    display: 'flex', 
                    justifyContent: message.senderType === 'agent' ? 'flex-end' : 'flex-start',
                    alignItems: 'flex-end',
                    gap: 8
                  }}
                >
                  {/* Avatar for user messages */}
                  {message.senderType === 'user' && (
                    <Avatar 
                      src={message.sender?.avatar} 
                      icon={!message.sender?.avatar && <UserOutlined />}
                      size={32}
                      style={{ backgroundColor: '#f3e8ff', color: '#9333ea', flexShrink: 0 }}
                    />
                  )}
                  
                  <div
                    style={{
                      maxWidth: '70%',
                      padding: '12px 16px',
                      borderRadius: 18,
                      ...(message.senderType === 'agent' ? {
                        backgroundColor: '#9333ea',
                        color: '#fff',
                        borderBottomRightRadius: 4,
                        boxShadow: '0 2px 8px rgba(147, 51, 234, 0.25)'
                      } : message.senderType === 'system' ? {
                        backgroundColor: '#e5e7eb',
                        color: '#6b7280',
                        textAlign: 'center' as const,
                        margin: '0 auto',
                        fontSize: 13
                      } : {
                        backgroundColor: '#fff',
                        color: '#111827',
                        borderBottomLeftRadius: 4,
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                        border: '1px solid #e5e7eb'
                      })
                    }}
                  >
                    {message.senderType === 'user' && (
                      <p style={{ fontSize: 12, color: '#9333ea', fontWeight: 600, marginBottom: 4 }}>
                        {message.sender?.name}
                      </p>
                    )}
                    <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                      {message.content}
                    </p>
                    <p style={{ 
                      fontSize: 11, 
                      marginTop: 6, 
                      marginBottom: 0,
                      color: message.senderType === 'agent' ? 'rgba(255,255,255,0.7)' : '#9ca3af',
                      textAlign: message.senderType === 'agent' ? 'right' as const : 'left' as const
                    }}>
                      {dayjs(message.createdAt).format('HH:mm')}
                    </p>
                  </div>
                  
                  {/* Avatar for agent messages */}
                  {message.senderType === 'agent' && (
                    <Avatar 
                      icon={<UserOutlined />}
                      size={32}
                      style={{ backgroundColor: '#9333ea', color: '#fff', flexShrink: 0 }}
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
                    style={{ backgroundColor: '#f3e8ff', color: '#9333ea', flexShrink: 0 }}
                  />
                  <div style={{ 
                    backgroundColor: '#fff', 
                    borderRadius: 18, 
                    borderBottomLeftRadius: 4,
                    padding: '12px 16px', 
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                    border: '1px solid #e5e7eb'
                  }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <span className="animate-bounce" style={{ width: 8, height: 8, backgroundColor: '#9ca3af', borderRadius: '50%', animationDelay: '0ms' }} />
                      <span className="animate-bounce" style={{ width: 8, height: 8, backgroundColor: '#9ca3af', borderRadius: '50%', animationDelay: '150ms' }} />
                      <span className="animate-bounce" style={{ width: 8, height: 8, backgroundColor: '#9ca3af', borderRadius: '50%', animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div style={{ 
              padding: 16, 
              backgroundColor: '#fff', 
              borderTop: '1px solid #e5e7eb',
              flexShrink: 0
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'flex-end', 
                gap: 12,
                backgroundColor: '#f8fafc',
                borderRadius: 24,
                padding: '8px 8px 8px 16px',
                border: '1px solid #e5e7eb'
              }}>
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
                  bordered={false}
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
                  size="large"
                  icon={sending ? <ReloadOutlined spin /> : <SendOutlined />}
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() || sending}
                  style={{ 
                    flexShrink: 0,
                    backgroundColor: '#9333ea',
                    borderColor: '#9333ea',
                    boxShadow: '0 2px 8px rgba(147, 51, 234, 0.3)'
                  }}
                />
              </div>
            </div>
          </>
        ) : (
          /* Empty State */
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Empty
              image={<MessageOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />}
              description={
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 500, color: '#111827', margin: 0 }}>No chat selected</h3>
                  <p style={{ color: '#6b7280', marginTop: 4 }}>Select a ticket from the list to start chatting</p>
                </div>
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
