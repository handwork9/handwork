'use client';

import { useState } from 'react';
import {
  Card,
  Typography,
  Form,
  Input,
  Select,
  Button,
  Space,
  Row,
  Col,
  App,
  Divider,
  Alert,
  Spin,
  Result,
} from 'antd';
import {
  SendOutlined,
  MailOutlined,
  TeamOutlined,
  FileTextOutlined,
  LinkOutlined,
  BulbOutlined,
  GiftOutlined,
  NotificationOutlined,
  RocketOutlined,
  PictureOutlined,
} from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

type TemplateType = 'announcement' | 'promotion' | 'newsletter' | 'update';
type AudienceType = 'all' | 'buyers' | 'farmers' | 'riders';

interface EmailFormData {
  subject: string;
  content: string;
  template: TemplateType;
  targetAudience: AudienceType;
  ctaText?: string;
  ctaUrl?: string;
  imageUrl?: string;
}

const templateInfo: Record<TemplateType, { icon: React.ReactNode; title: string; description: string; color: string }> = {
  announcement: {
    icon: <NotificationOutlined />,
    title: 'Announcement',
    description: 'Important announcements and company news',
    color: '#3b82f6',
  },
  promotion: {
    icon: <GiftOutlined />,
    title: 'Promotion',
    description: 'Special offers, discounts, and deals',
    color: '#f59e0b',
  },
  newsletter: {
    icon: <FileTextOutlined />,
    title: 'Newsletter',
    description: 'Regular updates and curated content',
    color: '#16a34a',
  },
  update: {
    icon: <RocketOutlined />,
    title: 'Update',
    description: 'Product updates and new features',
    color: '#8b5cf6',
  },
};

const audienceInfo: Record<AudienceType, { icon: React.ReactNode; label: string; description: string }> = {
  all: {
    icon: <TeamOutlined />,
    label: 'All Users',
    description: 'Send to all active users on the platform',
  },
  buyers: {
    icon: <TeamOutlined />,
    label: 'Buyers Only',
    description: 'Send only to registered buyers',
  },
  farmers: {
    icon: <TeamOutlined />,
    label: 'Farmers Only',
    description: 'Send only to registered farmers/sellers',
  },
  riders: {
    icon: <TeamOutlined />,
    label: 'Riders Only',
    description: 'Send only to registered delivery riders',
  },
};

export default function PromotionalEmailsPage() {
  const { message, modal } = App.useApp();
  const [form] = Form.useForm<EmailFormData>();
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastResult, setLastResult] = useState<{ sent: number; failed: number; audience: string } | null>(null);

  // Watch form values for preview
  const template = Form.useWatch('template', form);
  const targetAudience = Form.useWatch('targetAudience', form);
  const subject = Form.useWatch('subject', form);
  const content = Form.useWatch('content', form);
  const ctaText = Form.useWatch('ctaText', form);
  const ctaUrl = Form.useWatch('ctaUrl', form);
  const imageUrl = Form.useWatch('imageUrl', form);

  const sendEmailMutation = useMutation({
    mutationFn: (data: {
      subject: string;
      content: string;
      template: TemplateType;
      targetAudience: AudienceType;
      ctaButton?: { text: string; url: string };
      imageUrl?: string;
    }) => adminApi.sendPromotionalEmail(data),
    onSuccess: (response) => {
      const result = response.data;
      setLastResult({
        sent: result.sent,
        failed: result.failed,
        audience: result.targetAudience,
      });
      setShowSuccess(true);
      form.resetFields();
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      message.error(error.response?.data?.message || 'Failed to send promotional emails');
    },
  });

  const handleSubmit = async (values: EmailFormData) => {
    modal.confirm({
      title: 'Confirm Send Promotional Email',
      content: (
        <div>
          <Paragraph>
            You are about to send a <strong>{templateInfo[values.template].title}</strong> email to{' '}
            <strong>{audienceInfo[values.targetAudience].label}</strong>.
          </Paragraph>
          <Paragraph type="secondary">
            Subject: {values.subject}
          </Paragraph>
          <Alert
            title="This action cannot be undone"
            description="Once sent, the email will be delivered to all users in the selected audience."
            type="warning"
            showIcon
            style={{ marginTop: 16 }}
          />
        </div>
      ),
      okText: 'Send Emails',
      okButtonProps: { danger: true },
      onOk: async () => {
        const ctaText = values.ctaText?.trim();
        const ctaUrl = values.ctaUrl?.trim();
        const imgUrl = values.imageUrl?.trim();
        const payload = {
          subject: values.subject,
          content: values.content,
          template: values.template,
          targetAudience: values.targetAudience,
          ctaButton: ctaText && ctaUrl 
            ? { text: ctaText, url: ctaUrl }
            : undefined,
          imageUrl: imgUrl || undefined,
        };
        sendEmailMutation.mutate(payload);
      },
    });
  };

  if (showSuccess && lastResult) {
    return (
      <div style={{ padding: 24 }}>
        <Result
          status="success"
          title="Promotional Emails Sent Successfully!"
          subTitle={
            <Space orientation="vertical" size="small">
              <Text>
                Successfully sent to <strong>{lastResult.sent}</strong> {lastResult.audience} users
              </Text>
              {lastResult.failed > 0 && (
                <Text type="warning">
                  Failed to send to {lastResult.failed} users
                </Text>
              )}
            </Space>
          }
          extra={[
            <Button 
              type="primary" 
              key="new" 
              onClick={() => setShowSuccess(false)}
              icon={<MailOutlined />}
            >
              Send Another Email
            </Button>,
          ]}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
          <MailOutlined style={{ color: '#16a34a' }} />
          Promotional Emails
        </Title>
        <Text type="secondary">
          Send marketing and promotional emails to your users
        </Text>
      </div>

      <Row gutter={24}>
        {/* Email Form */}
        <Col xs={24} lg={14}>
          <Card>
            <Spin spinning={sendEmailMutation.isPending}>
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                initialValues={{
                  template: 'promotion',
                  targetAudience: 'all',
                }}
              >
                {/* Template Selection */}
                <Form.Item
                  name="template"
                  label="Email Template"
                  rules={[{ required: true, message: 'Please select a template' }]}
                >
                  <Select size="large" placeholder="Select email template">
                    {Object.entries(templateInfo).map(([key, info]) => (
                      <Select.Option key={key} value={key}>
                        <Space>
                          <span style={{ color: info.color }}>{info.icon}</span>
                          <span>{info.title}</span>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            - {info.description}
                          </Text>
                        </Space>
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>

                {/* Target Audience */}
                <Form.Item
                  name="targetAudience"
                  label="Target Audience"
                  rules={[{ required: true, message: 'Please select target audience' }]}
                >
                  <Select size="large" placeholder="Select who should receive this email">
                    {Object.entries(audienceInfo).map(([key, info]) => (
                      <Select.Option key={key} value={key}>
                        <Space>
                          {info.icon}
                          <span>{info.label}</span>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            - {info.description}
                          </Text>
                        </Space>
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>

                <Divider />

                {/* Email Subject */}
                <Form.Item
                  name="subject"
                  label="Email Subject"
                  rules={[
                    { required: true, message: 'Please enter email subject' },
                    { max: 100, message: 'Subject must be less than 100 characters' },
                  ]}
                >
                  <Input
                    size="large"
                    placeholder="e.g., Special Offer Just for You! 🎉"
                    prefix={<MailOutlined style={{ color: '#bfbfbf' }} />}
                    showCount
                    maxLength={100}
                  />
                </Form.Item>

                {/* Email Content */}
                <Form.Item
                  name="content"
                  label="Email Content"
                  rules={[
                    { required: true, message: 'Please enter email content' },
                    { min: 20, message: 'Content must be at least 20 characters' },
                  ]}
                  extra="Use line breaks to separate paragraphs. The content will be formatted nicely in the email."
                >
                  <TextArea
                    rows={6}
                    placeholder="Write your email message here...

You can use multiple paragraphs by pressing Enter twice.

Share exciting news, promotions, or updates with your users!"
                    showCount
                    maxLength={2000}
                  />
                </Form.Item>

                {/* Image URL */}
                <Form.Item
                  name="imageUrl"
                  label="Banner Image URL (Optional)"
                  rules={[
                    { type: 'url', message: 'Please enter a valid image URL' },
                  ]}
                  extra="Add a banner image to make your email more engaging. Use a direct image URL (e.g., https://example.com/image.jpg)"
                >
                  <Input
                    placeholder="e.g., https://example.com/promo-banner.jpg"
                    prefix={<PictureOutlined style={{ color: '#bfbfbf' }} />}
                  />
                </Form.Item>

                <Divider>Call to Action (Optional)</Divider>

                {/* CTA Button */}
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="ctaText"
                      label="Button Text"
                      rules={[
                        { max: 30, message: 'Button text must be less than 30 characters' },
                      ]}
                    >
                      <Input
                        placeholder="e.g., Shop Now"
                        prefix={<BulbOutlined style={{ color: '#bfbfbf' }} />}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="ctaUrl"
                      label="Button URL"
                      rules={[
                        { type: 'url', message: 'Please enter a valid URL' },
                      ]}
                    >
                      <Input
                        placeholder="e.g., https://handwork.com/shop"
                        prefix={<LinkOutlined style={{ color: '#bfbfbf' }} />}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Divider />

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    icon={<SendOutlined />}
                    loading={sendEmailMutation.isPending}
                    block
                  >
                    Send Promotional Email
                  </Button>
                </Form.Item>
              </Form>
            </Spin>
          </Card>
        </Col>

        {/* Preview */}
        <Col xs={24} lg={10}>
          <Card
            title={
              <Space>
                <FileTextOutlined />
                Email Preview
              </Space>
            }
            extra={
              template && (
                <span style={{ 
                  color: templateInfo[template as TemplateType]?.color,
                  fontWeight: 500,
                }}>
                  {templateInfo[template as TemplateType]?.title}
                </span>
              )
            }
          >
            {/* Preview Header */}
            <div
              style={{
                background: template
                  ? `linear-gradient(135deg, ${templateInfo[template as TemplateType]?.color} 0%, ${templateInfo[template as TemplateType]?.color}dd 100%)`
                  : '#16a34a',
                padding: '24px 16px',
                textAlign: 'center',
                borderRadius: 8,
                marginBottom: 16,
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>
                {template === 'announcement' && '📢'}
                {template === 'promotion' && '🎉'}
                {template === 'newsletter' && '📰'}
                {template === 'update' && '🚀'}
                {!template && '📧'}
              </div>
              <Title level={4} style={{ color: 'white', margin: 0 }}>
                {templateInfo[template as TemplateType]?.title || 'Email Template'}
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>
                Handwork Marketplace
              </Text>
            </div>

            {/* Preview Body */}
            <div style={{ padding: '0 8px' }}>
              {/* Banner Image Preview */}
              {imageUrl && (
                <div style={{ marginBottom: 16 }}>
                  <img 
                    src={imageUrl} 
                    alt="Banner" 
                    style={{ 
                      width: '100%', 
                      maxHeight: 200, 
                      objectFit: 'cover',
                      borderRadius: 8,
                    }} 
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              <Text type="secondary" style={{ fontSize: 13 }}>
                Hello [User Name],
              </Text>

              <Title level={5} style={{ margin: '12px 0 8px' }}>
                {subject || 'Your Email Subject'}
              </Title>

              <div style={{ 
                color: '#4b5563', 
                fontSize: 14,
                lineHeight: 1.7,
                whiteSpace: 'pre-wrap',
                minHeight: 80,
              }}>
                {content || 'Your email content will appear here...'}
              </div>

              {/* CTA Button Preview */}
              {(ctaText || ctaUrl) && (
                <div style={{ textAlign: 'center', margin: '24px 0' }}>
                  <Button
                    type="primary"
                    size="large"
                    style={{
                      backgroundColor: template 
                        ? templateInfo[template as TemplateType]?.color 
                        : '#16a34a',
                      borderColor: template 
                        ? templateInfo[template as TemplateType]?.color 
                        : '#16a34a',
                    }}
                  >
                    {ctaText || 'Button Text'}
                  </Button>
                  {ctaUrl && (
                    <div style={{ marginTop: 8 }}>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        → {ctaUrl}
                      </Text>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Preview Footer */}
            <div
              style={{
                borderTop: '1px solid #e5e7eb',
                marginTop: 16,
                paddingTop: 16,
                textAlign: 'center',
              }}
            >
              <Text type="secondary" style={{ fontSize: 12 }}>
                You received this email because you are a valued member of Handwork.
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: 11 }}>
                © {new Date().getFullYear()} Handwork. All rights reserved.
              </Text>
            </div>

            {/* Audience Info */}
            {targetAudience && (
              <Alert
                title={`Sending to: ${audienceInfo[targetAudience as AudienceType]?.label}`}
                description={audienceInfo[targetAudience as AudienceType]?.description}
                type="info"
                showIcon
                icon={<TeamOutlined />}
                style={{ marginTop: 16 }}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
