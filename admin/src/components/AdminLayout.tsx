'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Layout, Menu, Avatar, Dropdown, Badge, message, Empty, Typography, ConfigProvider, Button } from 'antd';
import {
  DashboardOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  CarOutlined,
  ShopOutlined,
  SettingOutlined,
  BellOutlined,
  LogoutOutlined,
  AuditOutlined,
  SendOutlined,
  FileTextOutlined,
  TeamOutlined,
  CustomerServiceOutlined,
  DollarOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  GiftOutlined,
  MessageOutlined,
  CrownOutlined,
  DeleteOutlined,
  WalletOutlined,
  MailOutlined,
  SafetyOutlined,
  TagOutlined,
  UnorderedListOutlined,
  InboxOutlined,
  ApiOutlined,
  WhatsAppOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  FallOutlined,
  StarOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useAuthStore, hasPermission, PERMISSIONS } from '@/store/auth';
import { useSocketStore } from '@/lib/socket';
import { useSupportSocketStore } from '@/lib/supportSocket';
import { useNotificationStore, AdminNotification } from '@/lib/notificationStore';
import { normalizeImageUrl } from '@/lib/api';
import type { MenuProps } from 'antd';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Header, Sider, Content } = Layout;

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { connect, disconnect, isConnected, recentOrders } = useSocketStore();
  const { connect: connectSupport, disconnect: disconnectSupport } = useSupportSocketStore();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationStore();
  
  // Track if component has mounted (client-side)
  const [hasMounted, setHasMounted] = useState(false);
  
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Redirect to login if not authenticated (only after component mounts on client)
  useEffect(() => {
    if (hasMounted && !isAuthenticated && pathname !== '/login') {
      router.push('/login');
    }
  }, [isAuthenticated, pathname, router, hasMounted]);

  useEffect(() => {
    if (isAuthenticated) {
      connect();
      connectSupport();
      
      // Request notification permission
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
    return () => {
      disconnect();
      disconnectSupport();
    };
  }, [isAuthenticated, connect, disconnect, connectSupport, disconnectSupport]);

  const handleLogout = () => {
    logout();
    message.success('Logged out successfully');
    router.push('/login');
  };

  const menuItems: MenuProps['items'] = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    // Operations Group
    {
      type: 'group',
      label: 'OPERATIONS',
      children: [
        {
          key: '/orders',
          icon: <ShoppingCartOutlined />,
          label: 'Orders',
          disabled: !hasPermission(user, PERMISSIONS.VIEW_ORDERS),
        },
        {
          key: '/dispatch',
          icon: <SendOutlined />,
          label: 'Dispatch',
          disabled: !hasPermission(user, PERMISSIONS.VIEW_DISPATCH),
        },
        {
          key: '/support',
          icon: <CustomerServiceOutlined />,
          label: 'Support Chat',
        },
        {
          key: '/support/reports',
          icon: <FileTextOutlined />,
          label: 'User Reports',
        },
        {
          key: '/disputes',
          icon: <SafetyOutlined />,
          label: 'Disputes',
        },
        {
          key: '/fraud-detection',
          icon: <SafetyOutlined />,
          label: 'Fraud Detection',
        },
        {
          key: '/content-moderation',
          icon: <FileTextOutlined />,
          label: 'Content Moderation',
        },
        {
          key: '/pickup-locations',
          icon: <EnvironmentOutlined />,
          label: 'Pickup Locations',
        },
        {
          key: '/delivery-scheduling',
          icon: <ClockCircleOutlined />,
          label: 'Delivery Scheduling',
        },
      ],
    },
    // Engagement Group
    {
      type: 'group',
      label: 'ENGAGEMENT',
      children: [
        {
          key: '/price-alerts',
          icon: <FallOutlined />,
          label: 'Price Drop Alerts',
        },
        {
          key: '/ratings',
          icon: <StarOutlined />,
          label: 'Ratings & Reviews',
        },
      ],
    },
    // User Management Group
    {
      type: 'group',
      label: 'USER MANAGEMENT',
      children: [
        {
          key: '/farmers',
          icon: <ShopOutlined />,
          label: 'Farmers',
          disabled: !hasPermission(user, PERMISSIONS.VIEW_USERS),
        },
        {
          key: '/riders',
          icon: <CarOutlined />,
          label: 'Riders',
          disabled: !hasPermission(user, PERMISSIONS.VIEW_RIDERS),
        },
        {
          key: '/users',
          icon: <UserOutlined />,
          label: 'Buyers',
          disabled: !hasPermission(user, PERMISSIONS.VIEW_USERS),
        },
        {
          key: '/account-deletions',
          icon: <DeleteOutlined />,
          label: 'Account Deletions',
          disabled: !hasPermission(user, PERMISSIONS.VIEW_USERS),
        },
      ],
    },
    // Catalog Group
    {
      type: 'group',
      label: 'CATALOG',
      children: [
        {
          key: '/products',
          icon: <ShopOutlined />,
          label: 'Products',
          disabled: !hasPermission(user, PERMISSIONS.VIEW_PRODUCTS),
        },
      ],
    },
    // Marketing Group
    {
      type: 'group',
      label: 'MARKETING',
      children: [
        {
          key: '/flash-sales',
          icon: <ThunderboltOutlined />,
          label: 'Flash Sales',
        },
        {
          key: '/bundles',
          icon: <AppstoreOutlined />,
          label: 'Product Bundles',
        },
        {
          key: '/coupons',
          icon: <TagOutlined />,
          label: 'Coupons',
        },
        {
          key: '/group-buying',
          icon: <TeamOutlined />,
          label: 'Group Buying',
        },
        {
          key: '/subscription-boxes',
          icon: <InboxOutlined />,
          label: 'Subscription Boxes',
        },
        {
          key: '/shopping-lists',
          icon: <UnorderedListOutlined />,
          label: 'Shopping Lists',
        },
      ],
    },
    // Analytics Group
    {
      type: 'group',
      label: 'ANALYTICS',
      children: [
        {
          key: '/reports',
          icon: <FileTextOutlined />,
          label: 'Reports',
        },
        {
          key: '/revenue',
          icon: <DollarOutlined />,
          label: 'Revenue',
          disabled: !hasPermission(user, PERMISSIONS.VIEW_FINANCE),
        },
        {
          key: '/withdrawals',
          icon: <WalletOutlined />,
          label: 'Withdrawals',
          disabled: !hasPermission(user, PERMISSIONS.VIEW_FINANCE),
        },
        {
          key: '/referrals',
          icon: <GiftOutlined />,
          label: 'Referrals',
        },
        {
          key: '/subscriptions',
          icon: <CrownOutlined />,
          label: 'Farmer/Rider Subs',
        },
        {
          key: '/buyer-premium',
          icon: <CrownOutlined />,
          label: 'Buyer Premium',
        },
      ],
    },
    // Communication Group
    {
      type: 'group',
      label: 'COMMUNICATION',
      children: [
        {
          key: '/notifications',
          icon: <BellOutlined />,
          label: 'Notifications',
          disabled: !hasPermission(user, PERMISSIONS.SEND_NOTIFICATIONS),
        },
        {
          key: '/promotional-emails',
          icon: <MailOutlined />,
          label: 'Promotional Emails',
          disabled: !hasPermission(user, PERMISSIONS.SEND_NOTIFICATIONS),
        },
      ],
    },
    // Integrations Group
    {
      type: 'group',
      label: 'INTEGRATIONS',
      children: [
        {
          key: '/integrations',
          icon: <SettingOutlined />,
          label: 'Overview',
        },
        {
          key: '/integrations/whatsapp',
          icon: <WhatsAppOutlined />,
          label: 'WhatsApp',
        },
        {
          key: '/integrations/email-marketing',
          icon: <MailOutlined />,
          label: 'Email Marketing',
        },
        {
          key: '/integrations/analytics',
          icon: <BarChartOutlined />,
          label: 'Analytics',
        },
      ],
    },
    // System Group
    {
      type: 'group',
      label: 'SYSTEM',
      children: [
        {
          key: '/team',
          icon: <TeamOutlined />,
          label: 'Team Management',
          disabled: !hasPermission(user, PERMISSIONS.MANAGE_ADMINS),
        },
        {
          key: '/audit-logs',
          icon: <AuditOutlined />,
          label: 'Audit Logs',
          disabled: !hasPermission(user, PERMISSIONS.VIEW_AUDIT_LOGS),
        },
        {
          key: '/settings',
          icon: <SettingOutlined />,
          label: 'Settings',
          disabled: !hasPermission(user, PERMISSIONS.MANAGE_CONFIG),
        },
      ],
    },
  ];

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
      onClick: () => router.push('/profile'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      danger: true,
      onClick: handleLogout,
    },
  ];

  // Skip auth checks for development
  // if (isLoading) {
  //   return (
  //     <div className="h-screen w-screen flex items-center justify-center">
  //       <Spin size="large" />
  //     </div>
  //   );
  // }

  // if (!isAuthenticated) {
  //   return null;
  // }

  const newOrdersCount = recentOrders.filter((o) => o.status === 'pending').length;
  const totalUnreadCount = unreadCount + newOrdersCount;

  const handleNotificationClick = (notification: AdminNotification) => {
    markAsRead(notification.id);
    if (notification.type === 'support_ticket' || notification.type === 'support_message') {
      router.push(`/support?ticket=${notification.data?.ticketId}`);
    } else if (notification.type === 'order') {
      router.push(`/orders?id=${notification.data?.id || notification.data?.orderId}`);
    } else if (notification.type === 'premium') {
      router.push('/revenue');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'support_ticket':
        return <CustomerServiceOutlined style={{ color: '#9333ea' }} />;
      case 'support_message':
        return <MessageOutlined style={{ color: '#3b82f6' }} />;
      case 'order':
        return <ShoppingCartOutlined style={{ color: '#f59e0b' }} />;
      case 'premium':
        return <GiftOutlined style={{ color: '#10b981' }} />;
      default:
        return <BellOutlined style={{ color: '#6b7280' }} />;
    }
  };

  const notificationMenuItems: MenuProps['items'] = [
    {
      key: 'header',
      type: 'group',
      label: (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography.Text strong>Notifications</Typography.Text>
          {unreadCount > 0 && (
            <Button type="link" size="small" onClick={(e) => { e.stopPropagation(); markAllAsRead(); }}>
              Mark all read
            </Button>
          )}
        </div>
      ),
    },
    ...(notifications.length > 0
      ? notifications.slice(0, 8).map((notification) => ({
          key: notification.id,
          label: (
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: 12,
                background: notification.isRead ? 'transparent' : '#f0f9ff',
                margin: '-8px -12px',
                padding: '8px 12px',
                borderRadius: 6,
              }}
            >
              <div style={{ 
                width: 36, 
                height: 36, 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: notification.type === 'support_ticket' ? '#f3e8ff' 
                  : notification.type === 'support_message' ? '#dbeafe' 
                  : notification.type === 'premium' ? '#d1fae5'
                  : notification.type === 'order' ? '#fef3c7'
                  : '#f3f4f6',
                flexShrink: 0,
              }}>
                {getNotificationIcon(notification.type)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Typography.Text strong style={{ fontSize: 13, display: 'block' }}>
                  {notification.title}
                </Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block' }} ellipsis>
                  {notification.message}
                </Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                  {dayjs(notification.createdAt).fromNow()}
                </Typography.Text>
              </div>
              {!notification.isRead && (
                <div style={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%', 
                  background: '#3b82f6',
                  flexShrink: 0,
                  marginTop: 4,
                }} />
              )}
            </div>
          ),
          onClick: () => handleNotificationClick(notification),
        }))
      : [
          {
            key: 'empty',
            label: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No notifications"
                style={{ padding: '16px 0' }}
              />
            ),
            disabled: true,
          },
        ]),
    ...(notifications.length > 0 ? [
      { type: 'divider' as const },
      {
        key: 'viewAll',
        label: (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography.Link onClick={() => router.push('/support')}>
              View Support
            </Typography.Link>
            <Typography.Link onClick={() => router.push('/orders')}>
              View Orders
            </Typography.Link>
          </div>
        ),
      },
    ] : []),
  ];

  return (
    <ConfigProvider
      theme={{
        components: {
          Menu: {
            itemHeight: 40,
            itemMarginInline: 8,
            itemBorderRadius: 10,
            subMenuItemBorderRadius: 10,
            itemSelectedBg: 'rgba(34, 197, 94, 0.12)',
            itemSelectedColor: '#15803d',
            itemHoverBg: 'rgba(0, 0, 0, 0.04)',
            itemHoverColor: '#111827',
            itemColor: '#1f2937',
            iconSize: 20,
            collapsedIconSize: 20,
            groupTitleFontSize: 11,
            groupTitleColor: '#8e8e93',
            itemBg: 'transparent',
            subMenuItemBg: 'transparent',
          },
        },
      }}
    >
    {/* Show loading while hydrating auth state */}
    {!hasMounted ? (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#f8fafc'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="ant-spin ant-spin-lg ant-spin-spinning">
            <span className="ant-spin-dot ant-spin-dot-spin">
              <i className="ant-spin-dot-item"></i>
              <i className="ant-spin-dot-item"></i>
              <i className="ant-spin-dot-item"></i>
              <i className="ant-spin-dot-item"></i>
            </span>
          </div>
          <p style={{ marginTop: 16, color: '#6b7280' }}>Loading...</p>
        </div>
      </div>
    ) : (
    <Layout className="min-h-screen">
      <Sider
        theme="light"
        width={280}
        style={{ 
          position: 'fixed', 
          height: '100vh', 
          left: 0, 
          top: 0, 
          bottom: 0,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderRight: '1px solid rgba(0, 0, 0, 0.08)',
          zIndex: 100,
        }}
      >
        {/* Logo Section - iOS Style */}
        <div style={{ 
          height: 100, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 50%, #4ade80 100%)',
          borderRadius: '0 0 24px 0',
          margin: '0 0 8px 0',
          boxShadow: '0 4px 24px rgba(34, 197, 94, 0.25), inset 0 1px 0 rgba(255,255,255,0.2)',
          padding: '16px 24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.95)',
              borderRadius: 18,
              padding: 8,
              boxShadow: '0 8px 24px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.4) inset',
            }}>
              <img 
                src="/logo.png" 
                alt="Handwork Logo" 
                style={{ 
                  width: 44, 
                  height: 44, 
                  objectFit: 'contain',
                  display: 'block',
                }} 
              />
            </div>
            <div>
              <div style={{ 
                fontSize: 24, 
                fontWeight: 700, 
                color: '#fff', 
                lineHeight: 1.1, 
                letterSpacing: '-0.5px',
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
              }}>Handwork</div>
              <div style={{ 
                fontSize: 11, 
                color: 'rgba(255,255,255,0.9)', 
                letterSpacing: '1.5px', 
                fontWeight: 600, 
                marginTop: 4,
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              }}>ADMIN PANEL</div>
            </div>
          </div>
        </div>

        {/* Menu Section - iOS Style */}
        <div style={{ 
          height: 'calc(100vh - 100px - 160px)', 
          overflow: 'auto', 
          padding: '8px 12px 120px 12px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}>
          <style>{`
            .ios-sidebar-menu::-webkit-scrollbar { display: none; }
            
            /* iOS Group Titles */
            .ios-sidebar-menu .ant-menu-item-group-title {
              font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif !important;
              font-size: 11px !important;
              font-weight: 600 !important;
              letter-spacing: 0.5px !important;
              color: #8e8e93 !important;
              padding: 20px 16px 8px 16px !important;
              text-transform: uppercase !important;
            }
            
            /* iOS Menu Items */
            .ios-sidebar-menu .ant-menu-item {
              transition: all 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
              font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif !important;
              font-weight: 400 !important;
              font-size: 15px !important;
              letter-spacing: -0.2px !important;
              color: #1c1c1e !important;
              margin: 2px 0 !important;
              padding-left: 16px !important;
              border-radius: 10px !important;
            }
            
            .ios-sidebar-menu .ant-menu-item .ant-menu-title-content {
              color: #1c1c1e !important;
            }
            
            .ios-sidebar-menu .ant-menu-item .anticon {
              color: #8e8e93 !important;
              font-size: 18px !important;
            }
            
            .ios-sidebar-menu .ant-menu-item:hover {
              background: rgba(0, 0, 0, 0.04) !important;
            }
            
            .ios-sidebar-menu .ant-menu-item:active {
              transform: scale(0.98) !important;
              background: rgba(0, 0, 0, 0.08) !important;
            }
            
            /* iOS Selected State */
            .ios-sidebar-menu .ant-menu-item-selected {
              font-weight: 500 !important;
              background: rgba(34, 197, 94, 0.1) !important;
            }
            
            .ios-sidebar-menu .ant-menu-item-selected .ant-menu-title-content {
              color: #16a34a !important;
            }
            
            .ios-sidebar-menu .ant-menu-item-selected .anticon {
              color: #16a34a !important;
            }
            
            .ios-sidebar-menu .ant-menu-item-selected::before {
              content: '';
              position: absolute;
              left: 0;
              top: 50%;
              transform: translateY(-50%);
              width: 3px;
              height: 20px;
              background: #16a34a;
              border-radius: 0 3px 3px 0;
            }
            
            /* iOS Group List Container */
            .ios-sidebar-menu .ant-menu-item-group-list {
              background: #ffffff !important;
              border-radius: 12px !important;
              margin: 0 4px 12px 4px !important;
              padding: 4px !important;
              box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0, 0, 0, 0.04) !important;
            }
            
            /* Disabled Items */
            .ios-sidebar-menu .ant-menu-item-disabled {
              opacity: 0.4 !important;
            }
          `}</style>
          <Menu
            className="ios-sidebar-menu"
            mode="inline"
            selectedKeys={[pathname || '/']}
            items={menuItems}
            onClick={({ key }) => {
              router.push(key);
            }}
            style={{ 
              borderRight: 'none',
              background: 'transparent',
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
            }}
          />
        </div>

        {/* Status Section - iOS Style */}
        <div style={{ 
          padding: '16px 16px 24px', 
          background: 'rgba(248, 248, 248, 0.95)',
          backdropFilter: 'blur(10px)',
          borderTop: '0.5px solid rgba(0, 0, 0, 0.08)',
          position: 'absolute', 
          bottom: 0, 
          left: 0, 
          right: 0,
          borderRadius: '20px 20px 0 0',
        }}>
          {/* Connection Status - iOS Pill */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 10, 
            padding: '12px 16px', 
            borderRadius: 14, 
            background: isConnected 
              ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(74, 222, 128, 0.08) 100%)'
              : 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(248, 113, 113, 0.08) 100%)',
            border: isConnected 
              ? '1px solid rgba(34, 197, 94, 0.2)' 
              : '1px solid rgba(239, 68, 68, 0.2)',
            marginBottom: 16,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
          }}>
            <div style={{ 
              width: 10, 
              height: 10, 
              borderRadius: '50%', 
              background: isConnected 
                ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' 
                : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              boxShadow: isConnected 
                ? '0 0 12px rgba(34, 197, 94, 0.6)' 
                : '0 0 12px rgba(239, 68, 68, 0.6)',
              animation: 'pulse 2s infinite',
            }} />
            <style>{`
              @keyframes pulse {
                0%, 100% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.7; transform: scale(1.1); }
              }
            `}</style>
            <span style={{ 
              fontSize: 13, 
              color: isConnected ? '#16a34a' : '#dc2626', 
              fontWeight: 600,
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              letterSpacing: '-0.2px',
            }}>
              {isConnected ? 'System Online' : 'Reconnecting...'}
            </span>
          </div>
          
          {/* Quick Stats - iOS Card Style */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: 12,
          }}>
            <div style={{ 
              padding: '14px 16px', 
              background: 'rgba(255, 255, 255, 0.9)',
              borderRadius: 16,
              textAlign: 'center',
              boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
              border: '0.5px solid rgba(0, 0, 0, 0.04)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              cursor: 'pointer',
            }}>
              <div style={{ 
                fontSize: 28, 
                fontWeight: 700, 
                color: '#1e293b',
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                letterSpacing: '-1px',
              }}>{newOrdersCount}</div>
              <div style={{ 
                fontSize: 11, 
                color: '#8e8e93', 
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginTop: 2,
              }}>Pending</div>
            </div>
            <div style={{ 
              padding: '14px 16px', 
              background: 'rgba(255, 255, 255, 0.9)',
              borderRadius: 16,
              textAlign: 'center',
              boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
              border: '0.5px solid rgba(0, 0, 0, 0.04)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              cursor: 'pointer',
            }}>
              <div style={{ 
                fontSize: 28, 
                fontWeight: 700, 
                color: '#1e293b',
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                letterSpacing: '-1px',
              }}>{recentOrders.length}</div>
              <div style={{ 
                fontSize: 11, 
                color: '#8e8e93', 
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginTop: 2,
              }}>Recent</div>
            </div>
          </div>
        </div>
      </Sider>
      <Layout style={{ marginLeft: 280, background: '#f2f2f7' }}>
        <Header 
          style={{ 
            background: '#ffffff', 
            padding: '0 24px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            borderBottom: '1px solid #e5e5ea',
            position: 'sticky', 
            top: 0, 
            zIndex: 10, 
            height: 64,
          }}
        >
          {/* Left Section - Greeting & Role */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ 
                color: '#8e8e93', 
                fontSize: 12,
                fontWeight: 500,
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              }}>Welcome back</span>
              <span style={{ 
                color: '#1c1c1e', 
                fontSize: 16,
                fontWeight: 600,
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
              }}>{user?.name || 'Admin'}</span>
            </div>
            <span style={{ 
              padding: '4px 10px', 
              background: '#e8f5e9',
              color: '#16a34a', 
              borderRadius: 6, 
              fontSize: 12, 
              textTransform: 'capitalize',
              fontWeight: 600,
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
            }}>
              {user?.role || 'admin'}
            </span>
          </div>

          {/* Right Section - Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Notifications */}
            <Dropdown 
              menu={{ items: notificationMenuItems }} 
              placement="bottomRight"
              trigger={['click']}
              styles={{ root: { minWidth: 360, borderRadius: 12 } }}
            >
              <Badge count={totalUnreadCount} size="small" offset={[-2, 2]}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: totalUnreadCount > 0 ? '#ffebee' : '#f5f5f5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
                >
                  <BellOutlined style={{ fontSize: 20, color: totalUnreadCount > 0 ? '#ff3b30' : '#6b7280' }} />
                </div>
              </Badge>
            </Dropdown>

            {/* User Profile */}
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 12px 6px 6px',
                borderRadius: 12,
                background: '#f5f5f5',
                cursor: 'pointer',
              }}>
                <div style={{
                  padding: '2px',
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #34d399 0%, #16a34a 100%)',
                }}>
                  <Avatar
                    src={normalizeImageUrl(user?.avatar)}
                    icon={!user?.avatar && <UserOutlined />}
                    style={{ 
                      cursor: 'pointer',
                      border: '2px solid #fff',
                      background: '#e5e5ea',
                    }}
                    size={32}
                  />
                </div>
                <span style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#1c1c1e',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                }}>Account</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8e8e93" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content style={{ 
          margin: 20, 
          padding: 24, 
          background: '#fff', 
          borderRadius: 16, 
          minHeight: 'calc(100vh - 96px)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          border: '0.5px solid rgba(0, 0, 0, 0.06)',
        }}>
          {children}
        </Content>
      </Layout>
    </Layout>
    )}
    </ConfigProvider>
  );
}
