'use client';

import React, { useEffect } from 'react';
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
  const { user, isAuthenticated, logout, _hasHydrated } = useAuthStore();
  const { connect, disconnect, isConnected, recentOrders } = useSocketStore();
  const { connect: connectSupport, disconnect: disconnectSupport } = useSupportSocketStore();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationStore();

  // Redirect to login if not authenticated (only after hydration is complete)
  useEffect(() => {
    if (_hasHydrated && !isAuthenticated && pathname !== '/login') {
      router.push('/login');
    }
  }, [isAuthenticated, pathname, router, _hasHydrated]);

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
    {
      type: 'divider',
    },
    {
      key: 'operations',
      icon: <AppstoreOutlined />,
      label: 'Operations',
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
      ],
    },
    {
      key: 'users-management',
      icon: <TeamOutlined />,
      label: 'User Management',
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
    {
      key: 'catalog',
      icon: <ShopOutlined />,
      label: 'Catalog',
      children: [
        {
          key: '/products',
          icon: <ShopOutlined />,
          label: 'Products',
          disabled: !hasPermission(user, PERMISSIONS.VIEW_PRODUCTS),
        },
      ],
    },
    {
      key: 'marketing',
      icon: <GiftOutlined />,
      label: 'Marketing',
      children: [
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
    {
      type: 'divider',
    },
    {
      key: 'analytics',
      icon: <BarChartOutlined />,
      label: 'Analytics',
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
    {
      type: 'divider',
    },
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
            itemHeight: 44,
            itemMarginInline: 8,
            itemBorderRadius: 8,
            subMenuItemBorderRadius: 8,
            itemSelectedBg: '#f0fdf4',
            itemSelectedColor: '#16a34a',
            itemHoverBg: '#f8fafc',
            itemHoverColor: '#1e293b',
            itemColor: '#374151',
            iconSize: 16,
            collapsedIconSize: 16,
            groupTitleFontSize: 11,
            groupTitleColor: '#94a3b8',
            itemBg: '#fff',
            subMenuItemBg: '#fff',
          },
        },
      }}
    >
    {/* Show loading while hydrating auth state */}
    {!_hasHydrated ? (
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
        width={260}
        style={{ 
          position: 'fixed', 
          height: '100vh', 
          left: 0, 
          top: 0, 
          bottom: 0,
          boxShadow: '2px 0 8px rgba(0,0,0,0.06)',
          background: '#fff',
          zIndex: 100,
        }}
      >
        {/* Logo Section */}
        <div style={{ 
          height: 88, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          background: 'linear-gradient(145deg, #0f7335 0%, #16a34a 50%, #22c55e 100%)',
          padding: '16px 20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              background: '#fff',
              borderRadius: 14,
              padding: 6,
              boxShadow: '0 4px 14px rgba(0,0,0,0.2), 0 0 0 2px rgba(255,255,255,0.3)',
            }}>
              <img 
                src="/logo.png" 
                alt="Handwork Logo" 
                style={{ 
                  width: 48, 
                  height: 48, 
                  objectFit: 'contain',
                  display: 'block',
                }} 
              />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1.1, textShadow: '0 1px 2px rgba(0,0,0,0.15)' }}>Handwork</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.95)', letterSpacing: 2.5, fontWeight: 600, marginTop: 2 }}>ADMIN PANEL</div>
            </div>
          </div>
        </div>

        {/* Menu Section */}
        <div style={{ height: 'calc(100vh - 64px - 140px)', overflow: 'auto', padding: '8px 0', background: '#fff' }}>
          <Menu
            mode="inline"
            selectedKeys={[pathname || '/']}
            defaultOpenKeys={['operations', 'users-management', 'catalog', 'analytics']}
            items={menuItems}
            onClick={({ key }) => {
              if (!key.startsWith('operations') && !key.startsWith('users') && !key.startsWith('analytics') && !key.startsWith('catalog')) {
                router.push(key);
              }
            }}
            style={{ 
              borderRight: 'none',
              background: '#fff',
              color: '#1e293b',
            }}
          />
        </div>

        {/* Status Section */}
        <div style={{ padding: 16, borderTop: '1px solid #f0f0f0', background: '#fff', position: 'absolute', bottom: 0, left: 0, right: 0 }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 8, 
            padding: '10px 12px', 
            borderRadius: 8, 
            background: isConnected ? '#f0fdf4' : '#fef2f2',
            marginBottom: 12,
          }}>
            <div style={{ 
              width: 8, 
              height: 8, 
              borderRadius: '50%', 
              background: isConnected ? '#22c55e' : '#ef4444',
              boxShadow: isConnected ? '0 0 8px #22c55e' : '0 0 8px #ef4444',
            }} />
            <span style={{ fontSize: 12, color: isConnected ? '#16a34a' : '#dc2626', fontWeight: 500 }}>
              {isConnected ? 'System Online' : 'Reconnecting...'}
            </span>
          </div>
          
          {/* Quick Stats */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: 8,
          }}>
            <div style={{ 
              padding: '8px 12px', 
              background: '#f8fafc', 
              borderRadius: 6,
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#1e293b' }}>{newOrdersCount}</div>
              <div style={{ fontSize: 10, color: '#64748b' }}>Pending</div>
            </div>
            <div style={{ 
              padding: '8px 12px', 
              background: '#f8fafc', 
              borderRadius: 6,
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#1e293b' }}>{recentOrders.length}</div>
              <div style={{ fontSize: 10, color: '#64748b' }}>Recent</div>
            </div>
          </div>
        </div>
      </Sider>
      <Layout style={{ marginLeft: 260 }}>
        <Header 
          style={{ 
            background: '#fff', 
            padding: '0 24px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            position: 'sticky', 
            top: 0, 
            zIndex: 10, 
            height: 64,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ color: '#4b5563', fontSize: 14 }}>Welcome back, {user?.name || 'Admin'}</span>
            <span style={{ padding: '4px 8px', background: '#dbeafe', color: '#2563eb', borderRadius: 4, fontSize: 12, textTransform: 'uppercase' }}>
              {user?.role || 'admin'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Dropdown 
              menu={{ items: notificationMenuItems }} 
              placement="bottomRight"
              trigger={['click']}
              styles={{ root: { minWidth: 340 } }}
            >
              <Badge count={totalUnreadCount} size="small">
                <BellOutlined 
                  style={{ fontSize: 20, cursor: 'pointer', color: '#4b5563' }}
                />
              </Badge>
            </Dropdown>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Avatar
                src={normalizeImageUrl(user?.avatar)}
                icon={!user?.avatar && <UserOutlined />}
                style={{ cursor: 'pointer' }}
              />
            </Dropdown>
          </div>
        </Header>
        <Content style={{ margin: 24, padding: 24, background: '#fff', borderRadius: 8, minHeight: 'calc(100vh - 112px)' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
    )}
    </ConfigProvider>
  );
}
