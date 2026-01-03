'use client';

import React, { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Typography,
  Row,
  Col,
  Statistic,
  Input,
  Select,
  Avatar,
  Rate,
  Progress,
  Tabs,
  Badge,
  Tooltip,
} from 'antd';
import {
  StarOutlined,
  StarFilled,
  SearchOutlined,
  ReloadOutlined,
  UserOutlined,
  ShoppingOutlined,
  AppleOutlined,
  AndroidOutlined,
  LikeOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useAuthStore } from '@/store/authStore';

const { Title, Text } = Typography;

interface AppReview {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  rating: number;
  platform: 'ios' | 'android';
  appVersion: string;
  promptedAt: string;
  reviewedAt: string | null;
  dismissed: boolean;
}

interface ProductReview {
  id: string;
  userId: string;
  userName: string;
  productId: string;
  productName: string;
  productImage: string | null;
  rating: number;
  comment: string;
  helpful: number;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface RatingStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: { [key: number]: number };
  promptsShown: number;
  promptsAccepted: number;
  conversionRate: number;
}

export default function RatingsReviewsPage() {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRating, setFilterRating] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('product');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  // Fetch product reviews
  const { data: reviewsData, isLoading: reviewsLoading } = useQuery({
    queryKey: ['product-reviews'],
    queryFn: async () => {
      const res = await fetch(`${apiUrl}/reviews/admin/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch reviews');
      return res.json();
    },
  });

  // Fetch app review prompts
  const { data: appReviewsData, isLoading: appReviewsLoading } = useQuery({
    queryKey: ['app-reviews'],
    queryFn: async () => {
      const res = await fetch(`${apiUrl}/reviews/admin/app-prompts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch app reviews');
      return res.json();
    },
  });

  // Fetch rating stats
  const { data: statsData } = useQuery({
    queryKey: ['rating-stats'],
    queryFn: async () => {
      const res = await fetch(`${apiUrl}/reviews/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    },
  });

  const reviews: ProductReview[] = reviewsData?.reviews || reviewsData || [];
  const appReviews: AppReview[] = appReviewsData || [];
  const stats: RatingStats = statsData || {
    totalReviews: reviews.length,
    averageRating: 4.5,
    ratingDistribution: { 5: 60, 4: 25, 3: 10, 2: 3, 1: 2 },
    promptsShown: 150,
    promptsAccepted: 45,
    conversionRate: 30,
  };

  const filteredReviews = reviews.filter(review => {
    const matchesSearch =
      review.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.comment?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRating =
      filterRating === 'all' || review.rating === parseInt(filterRating);
    return matchesSearch && matchesRating;
  });

  const productReviewColumns = [
    {
      title: 'Product',
      key: 'product',
      render: (_: any, record: ProductReview) => (
        <Space>
          <Avatar
            src={record.productImage}
            icon={<ShoppingOutlined />}
            shape="square"
            size={48}
          />
          <Text strong>{record.productName}</Text>
        </Space>
      ),
    },
    {
      title: 'Reviewer',
      key: 'reviewer',
      render: (_: any, record: ProductReview) => (
        <Space>
          <Avatar src={record.userAvatar} icon={<UserOutlined />} size="small" />
          <Text>{record.userName}</Text>
        </Space>
      ),
    },
    {
      title: 'Rating',
      dataIndex: 'rating',
      key: 'rating',
      sorter: (a: ProductReview, b: ProductReview) => b.rating - a.rating,
      render: (rating: number) => <Rate disabled defaultValue={rating} style={{ fontSize: 14 }} />,
    },
    {
      title: 'Comment',
      dataIndex: 'comment',
      key: 'comment',
      width: 300,
      render: (comment: string) => (
        <Tooltip title={comment}>
          <Text ellipsis style={{ maxWidth: 280 }}>{comment || '-'}</Text>
        </Tooltip>
      ),
    },
    {
      title: 'Helpful',
      dataIndex: 'helpful',
      key: 'helpful',
      render: (helpful: number) => (
        <Space>
          <LikeOutlined />
          <Text>{helpful || 0}</Text>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors: Record<string, string> = {
          pending: 'orange',
          approved: 'green',
          rejected: 'red',
        };
        return <Tag color={colors[status]}>{status?.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('MMM D, YYYY'),
    },
  ];

  const appReviewColumns = [
    {
      title: 'User',
      key: 'user',
      render: (_: any, record: AppReview) => (
        <Space>
          <Avatar src={record.userAvatar} icon={<UserOutlined />} />
          <Text>{record.userName}</Text>
        </Space>
      ),
    },
    {
      title: 'Platform',
      dataIndex: 'platform',
      key: 'platform',
      render: (platform: string) => (
        <Tag
          icon={platform === 'ios' ? <AppleOutlined /> : <AndroidOutlined />}
          color={platform === 'ios' ? 'default' : 'green'}
        >
          {platform?.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'App Version',
      dataIndex: 'appVersion',
      key: 'appVersion',
    },
    {
      title: 'Rating',
      dataIndex: 'rating',
      key: 'rating',
      render: (rating: number) =>
        rating ? <Rate disabled defaultValue={rating} style={{ fontSize: 14 }} /> : <Text type="secondary">-</Text>,
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: any, record: AppReview) => {
        if (record.reviewedAt) {
          return <Badge status="success" text="Reviewed" />;
        }
        if (record.dismissed) {
          return <Badge status="warning" text="Dismissed" />;
        }
        return <Badge status="processing" text="Prompted" />;
      },
    },
    {
      title: 'Prompted At',
      dataIndex: 'promptedAt',
      key: 'promptedAt',
      render: (date: string) => dayjs(date).format('MMM D, YYYY HH:mm'),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          <StarFilled style={{ marginRight: 12, color: '#fadb14' }} />
          Ratings & Reviews
        </Title>
        <Text type="secondary">Manage product reviews and app rating prompts</Text>
      </div>

      {/* Stats */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Reviews"
              value={stats.totalReviews}
              prefix={<MessageOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Average Rating"
              value={stats.averageRating}
              precision={1}
              suffix="/ 5"
              prefix={<StarFilled style={{ color: '#fadb14' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="App Review Prompts"
              value={stats.promptsShown}
              suffix={`(${stats.promptsAccepted} accepted)`}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Prompt Conversion"
              value={stats.conversionRate}
              suffix="%"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Rating Distribution */}
      <Card title="Rating Distribution" style={{ marginBottom: 24 }}>
        <Row gutter={24}>
          {[5, 4, 3, 2, 1].map((star) => {
            const count = stats.ratingDistribution?.[star] || 0;
            const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
            return (
              <Col span={4} key={star}>
                <Space direction="vertical" align="center" style={{ width: '100%' }}>
                  <Space>
                    <Text strong>{star}</Text>
                    <StarFilled style={{ color: '#fadb14' }} />
                  </Space>
                  <Progress
                    percent={percentage}
                    showInfo={false}
                    strokeColor={star >= 4 ? '#52c41a' : star >= 3 ? '#faad14' : '#ff4d4f'}
                  />
                  <Text type="secondary">{count} reviews</Text>
                </Space>
              </Col>
            );
          })}
        </Row>
      </Card>

      {/* Reviews Tabs */}
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'product',
              label: (
                <Space>
                  <ShoppingOutlined />
                  Product Reviews
                </Space>
              ),
              children: (
                <>
                  <Space style={{ marginBottom: 16 }}>
                    <Input
                      placeholder="Search reviews..."
                      prefix={<SearchOutlined />}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ width: 300 }}
                    />
                    <Select
                      value={filterRating}
                      onChange={setFilterRating}
                      style={{ width: 120 }}
                      options={[
                        { value: 'all', label: 'All Ratings' },
                        { value: '5', label: '5 Stars' },
                        { value: '4', label: '4 Stars' },
                        { value: '3', label: '3 Stars' },
                        { value: '2', label: '2 Stars' },
                        { value: '1', label: '1 Star' },
                      ]}
                    />
                    <Button
                      icon={<ReloadOutlined />}
                      onClick={() => queryClient.invalidateQueries({ queryKey: ['product-reviews'] })}
                    >
                      Refresh
                    </Button>
                  </Space>
                  <Table
                    columns={productReviewColumns}
                    dataSource={filteredReviews}
                    rowKey="id"
                    loading={reviewsLoading}
                    pagination={{ pageSize: 10 }}
                  />
                </>
              ),
            },
            {
              key: 'app',
              label: (
                <Space>
                  <StarOutlined />
                  App Rating Prompts
                </Space>
              ),
              children: (
                <>
                  <Space style={{ marginBottom: 16 }}>
                    <Button
                      icon={<ReloadOutlined />}
                      onClick={() => queryClient.invalidateQueries({ queryKey: ['app-reviews'] })}
                    >
                      Refresh
                    </Button>
                  </Space>
                  <Table
                    columns={appReviewColumns}
                    dataSource={appReviews}
                    rowKey="id"
                    loading={appReviewsLoading}
                    pagination={{ pageSize: 10 }}
                  />
                </>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
