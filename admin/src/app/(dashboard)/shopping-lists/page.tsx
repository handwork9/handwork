'use client';

import { useState } from 'react';
import {
  Card,
  Typography,
  Statistic,
  Row,
  Col,
  Button,
  Empty,
  Spin,
} from 'antd';
import {
  UnorderedListOutlined,
  UserOutlined,
  ShoppingOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  TeamOutlined,
  RiseOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';

const { Title, Text, Paragraph } = Typography;

// This is a read-only analytics page for shopping lists
// Shopping lists are user-created and managed by users themselves

export default function ShoppingListsPage() {
  const { data: statsData, isLoading, refetch, isError } = useQuery({
    queryKey: ['shoppingListsStats'],
    queryFn: async () => {
      try {
        const response = await adminApi.getShoppingListsStats();
        return response.data;
      } catch {
        // Return mock data if endpoint doesn't exist yet
        return {
          totalLists: 0,
          activeLists: 0,
          totalItems: 0,
          purchasedItems: 0,
          sharedLists: 0,
          averageItemsPerList: 0,
          topCategories: [],
          recentActivity: [],
        };
      }
    },
  });

  const stats = statsData || {
    totalLists: 0,
    activeLists: 0,
    totalItems: 0,
    purchasedItems: 0,
    sharedLists: 0,
    averageItemsPerList: 0,
  };

  const purchaseRate = stats.totalItems > 0 
    ? Math.round((stats.purchasedItems / stats.totalItems) * 100) 
    : 0;

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
        <Title level={2} style={{ margin: 0 }}>
          <UnorderedListOutlined style={{ marginRight: 8 }} />
          Shopping Lists Analytics
        </Title>
        <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
          Refresh
        </Button>
      </div>

      {/* Info Card */}
      <Card style={{ marginBottom: 24, background: '#f0f5ff', border: '1px solid #adc6ff' }}>
        <Paragraph style={{ margin: 0 }}>
          <Text strong>Note:</Text> Shopping lists are created and managed by users. 
          This page provides analytics and insights into shopping list usage across the platform.
          Users can create, share, and manage their own shopping lists through the mobile app.
        </Paragraph>
      </Card>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>Loading statistics...</div>
        </div>
      ) : isError ? (
        <Card>
          <Empty
            description="Shopping lists statistics are not available yet"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Text type="secondary">
              The shopping lists feature is active, but detailed analytics will be available soon.
            </Text>
          </Empty>
        </Card>
      ) : (
        <>
          {/* Stats */}
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Total Shopping Lists"
                  value={stats.totalLists}
                  prefix={<UnorderedListOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Active Lists"
                  value={stats.activeLists}
                  valueStyle={{ color: '#3f8600' }}
                  prefix={<CheckCircleOutlined />}
                />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Lists with unpurchased items
                </Text>
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Shared Lists"
                  value={stats.sharedLists}
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Lists shared with others
                </Text>
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Total List Items"
                  value={stats.totalItems}
                  prefix={<ShoppingOutlined />}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={8}>
              <Card>
                <Statistic
                  title="Items Purchased"
                  value={stats.purchasedItems}
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="Purchase Rate"
                  value={purchaseRate}
                  suffix="%"
                  valueStyle={{ color: purchaseRate > 50 ? '#52c41a' : '#faad14' }}
                  prefix={<RiseOutlined />}
                />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Items marked as purchased
                </Text>
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="Avg Items per List"
                  value={stats.averageItemsPerList || 0}
                  precision={1}
                  prefix={<UnorderedListOutlined />}
                />
              </Card>
            </Col>
          </Row>

          {/* Feature Info */}
          <Row gutter={16}>
            <Col span={12}>
              <Card title="Shopping List Features" style={{ height: '100%' }}>
                <ul style={{ paddingLeft: 20, margin: 0 }}>
                  <li>Users can create multiple shopping lists</li>
                  <li>Add items manually or from previous orders</li>
                  <li>Mark items as purchased</li>
                  <li>Share lists with family and friends</li>
                  <li>Reorder items by priority</li>
                  <li>Duplicate lists for recurring purchases</li>
                  <li>View estimated totals based on product prices</li>
                </ul>
              </Card>
            </Col>
            <Col span={12}>
              <Card title="User Benefits" style={{ height: '100%' }}>
                <ul style={{ paddingLeft: 20, margin: 0 }}>
                  <li>Plan grocery shopping in advance</li>
                  <li>Never forget essential items</li>
                  <li>Share lists with household members</li>
                  <li>Track spending and budget better</li>
                  <li>Quickly reorder frequent purchases</li>
                  <li>Organize items by category</li>
                  <li>Access lists offline on mobile</li>
                </ul>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
}
