'use client';

import React from 'react';
import { Card, Row, Col, Typography, Button, Space, Tag } from 'antd';
import {
  WhatsAppOutlined,
  MailOutlined,
  BarChartOutlined,
  RightOutlined,
  CheckCircleOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import Link from 'next/link';

const { Title, Text, Paragraph } = Typography;

interface IntegrationCard {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  status: 'active' | 'pending' | 'inactive';
  features: string[];
}

const integrations: IntegrationCard[] = [
  {
    title: 'WhatsApp Business',
    description: 'Send order updates, promotional messages, and support via WhatsApp Business API',
    icon: <WhatsAppOutlined style={{ fontSize: 48, color: '#25D366' }} />,
    href: '/integrations/whatsapp',
    status: 'active',
    features: [
      'Order notifications',
      'Delivery updates',
      'Promotional campaigns',
      'Customer support',
      'Interactive menus',
    ],
  },
  {
    title: 'Email Marketing',
    description: 'Automated email campaigns, newsletters, and customer engagement',
    icon: <MailOutlined style={{ fontSize: 48, color: '#1890ff' }} />,
    href: '/integrations/email-marketing',
    status: 'active',
    features: [
      'Newsletter campaigns',
      'Abandoned cart reminders',
      'Weekly deals',
      'Welcome series',
      'Re-engagement emails',
    ],
  },
  {
    title: 'Google Analytics',
    description: 'Track user behavior, conversions, and e-commerce events',
    icon: <BarChartOutlined style={{ fontSize: 48, color: '#F9AB00' }} />,
    href: '/integrations/analytics',
    status: 'active',
    features: [
      'Page/screen tracking',
      'E-commerce events',
      'User behavior',
      'Conversion tracking',
      'Custom events',
    ],
  },
];

const getStatusTag = (status: string) => {
  switch (status) {
    case 'active':
      return <Tag color="success" icon={<CheckCircleOutlined />}>Active</Tag>;
    case 'pending':
      return <Tag color="warning">Pending Setup</Tag>;
    case 'inactive':
      return <Tag color="default">Inactive</Tag>;
    default:
      return null;
  }
};

export default function IntegrationsPage() {
  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>
          <SettingOutlined style={{ marginRight: 12 }} />
          Integrations
        </Title>
        <Paragraph type="secondary">
          Manage external service integrations for marketing, communication, and analytics
        </Paragraph>
      </div>

      <Row gutter={[24, 24]}>
        {integrations.map((integration) => (
          <Col xs={24} md={12} lg={8} key={integration.title}>
            <Card
              hoverable
              style={{ height: '100%' }}
              actions={[
                <Link href={integration.href} key="manage">
                  <Button type="primary" icon={<RightOutlined />}>
                    Manage
                  </Button>
                </Link>,
              ]}
            >
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  {integration.icon}
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <Title level={4} style={{ marginBottom: 4 }}>{integration.title}</Title>
                  {getStatusTag(integration.status)}
                </div>
                
                <Paragraph type="secondary" style={{ textAlign: 'center', marginBottom: 16 }}>
                  {integration.description}
                </Paragraph>
                
                <div>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>Features:</Text>
                  <ul style={{ paddingLeft: 20, margin: 0 }}>
                    {integration.features.map((feature, idx) => (
                      <li key={idx}>
                        <Text type="secondary" style={{ fontSize: 12 }}>{feature}</Text>
                      </li>
                    ))}
                  </ul>
                </div>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}
