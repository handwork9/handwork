'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, normalizeImageUrl } from '@/lib/api';
import {
  Table,
  Tag,
  Space,
  Button,
  Input,
  Select,
  Card,
  Row,
  Col,
  Statistic,
  Modal,
  Form,
  Typography,
  Badge,
  Avatar,
  Tooltip,
  App,
  Empty,
  Spin,
} from 'antd';
import {
  FlagOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  SearchOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;

const reportTypeConfig: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  inappropriate_behavior: { color: 'red', label: 'Inappropriate Behavior', icon: <ExclamationCircleOutlined /> },
  technical_problem: { color: 'orange', label: 'Technical Problem', icon: <ExclamationCircleOutlined /> },
  spam: { color: 'purple', label: 'Spam', icon: <ExclamationCircleOutlined /> },
  other: { color: 'default', label: 'Other', icon: <FlagOutlined /> },
};

const reportStatusConfig: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  pending: { color: 'warning', label: 'Pending', icon: <ClockCircleOutlined /> },
  reviewed: { color: 'processing', label: 'Reviewed', icon: <EyeOutlined /> },
  resolved: { color: 'success', label: 'Resolved', icon: <CheckCircleOutlined /> },
  dismissed: { color: 'default', label: 'Dismissed', icon: <CloseCircleOutlined /> },
};

interface SupportReport {
  id: string;
  userId: string;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  ticketId?: string;
  ticket?: {
    id: string;
    ticketNumber: string;
    subject: string;
  };
  type: string;
  status: string;
  description?: string;
  adminNotes?: string;
  reviewedBy?: string;
  reviewer?: {
    id: string;
    name: string;
  };
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export default function ReportsPage() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReport, setSelectedReport] = useState<SupportReport | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [form] = Form.useForm();

  // Fetch reports
  const { data: reportsData, isLoading, refetch } = useQuery({
    queryKey: ['support-reports', statusFilter, typeFilter],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;
      const response = await adminApi.getSupportReports(params);
      // Handle wrapped response format: {success: true, data: {reports: [...]}}
      return response.data?.data || response.data;
    },
  });

  // Fetch stats
  const { data: statsData } = useQuery({
    queryKey: ['support-report-stats'],
    queryFn: async () => {
      try {
        const response = await adminApi.getSupportReportStats();
        // Handle wrapped response format: {success: true, data: {stats: {...}}}
        const data = response.data?.data || response.data;
        return data?.stats || { total: 0, pending: 0, reviewed: 0, resolved: 0, dismissed: 0 };
      } catch {
        return { total: 0, pending: 0, reviewed: 0, resolved: 0, dismissed: 0 };
      }
    },
  });

  // Update report mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { status?: string; adminNotes?: string } }) => {
      return adminApi.updateSupportReport(id, data);
    },
    onSuccess: () => {
      message.success('Report updated successfully');
      queryClient.invalidateQueries({ queryKey: ['support-reports'] });
      queryClient.invalidateQueries({ queryKey: ['support-report-stats'] });
      setUpdateModalOpen(false);
      setSelectedReport(null);
      form.resetFields();
    },
    onError: () => {
      message.error('Failed to update report');
    },
  });

  const reports = reportsData?.reports || [];

  const handleViewDetails = (report: SupportReport) => {
    setSelectedReport(report);
    setDetailsModalOpen(true);
  };

  const handleUpdateReport = (report: SupportReport) => {
    setSelectedReport(report);
    form.setFieldsValue({
      status: report.status,
      adminNotes: report.adminNotes || '',
    });
    setUpdateModalOpen(true);
  };

  const handleSubmitUpdate = async (values: { status: string; adminNotes: string }) => {
    if (!selectedReport) return;
    await updateMutation.mutateAsync({
      id: selectedReport.id,
      data: values,
    });
  };

  const columns = [
    {
      title: 'Report ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (id: string) => (
        <Text copyable={{ text: id }} style={{ fontSize: 12 }}>
          {id.slice(0, 8)}...
        </Text>
      ),
    },
    {
      title: 'Reporter',
      key: 'user',
      render: (_: unknown, record: SupportReport) => (
        <Space>
          <Avatar size="small" src={normalizeImageUrl(record.user?.avatar)} icon={<UserOutlined />} />
          <div>
            <Text strong style={{ display: 'block' }}>{record.user?.name || 'Unknown'}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>{record.user?.email}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const config = reportTypeConfig[type] || reportTypeConfig.other;
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.label}
          </Tag>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config = reportStatusConfig[status] || reportStatusConfig.pending;
        return (
          <Badge status={config.color as 'warning' | 'processing' | 'success' | 'default'} text={config.label} />
        );
      },
    },
    {
      title: 'Related Ticket',
      key: 'ticket',
      render: (_: unknown, record: SupportReport) => (
        record.ticket ? (
          <Tooltip title={record.ticket.subject}>
            <Tag color="blue">{record.ticket.ticketNumber}</Tag>
          </Tooltip>
        ) : (
          <Text type="secondary">N/A</Text>
        )
      ),
    },
    {
      title: 'Submitted',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => (
        <Tooltip title={dayjs(date).format('MMM D, YYYY h:mm A')}>
          <Text>{dayjs(date).fromNow()}</Text>
        </Tooltip>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: SupportReport) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(record)}
            />
          </Tooltip>
          <Tooltip title="Update Status">
            <Button
              type="primary"
              size="small"
              onClick={() => handleUpdateReport(record)}
            >
              Review
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          <FlagOutlined style={{ marginRight: 8 }} />
          User Reports
        </Title>
        <Text type="secondary">Review and manage reports submitted by users</Text>
      </div>

      {/* Stats Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Total Reports"
              value={statsData?.total || 0}
              prefix={<FlagOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Pending"
              value={statsData?.pending || 0}
              styles={{ content: { color: '#faad14' } }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Resolved"
              value={statsData?.resolved || 0}
              styles={{ content: { color: '#52c41a' } }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Dismissed"
              value={statsData?.dismissed || 0}
              styles={{ content: { color: '#8c8c8c' } }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap>
          <Select
            placeholder="Filter by Status"
            style={{ width: 150 }}
            allowClear
            value={statusFilter || undefined}
            onChange={(value) => setStatusFilter(value || '')}
            options={[
              { label: 'Pending', value: 'pending' },
              { label: 'Reviewed', value: 'reviewed' },
              { label: 'Resolved', value: 'resolved' },
              { label: 'Dismissed', value: 'dismissed' },
            ]}
          />
          <Select
            placeholder="Filter by Type"
            style={{ width: 180 }}
            allowClear
            value={typeFilter || undefined}
            onChange={(value) => setTypeFilter(value || '')}
            options={[
              { label: 'Inappropriate Behavior', value: 'inappropriate_behavior' },
              { label: 'Technical Problem', value: 'technical_problem' },
              { label: 'Spam', value: 'spam' },
              { label: 'Other', value: 'other' },
            ]}
          />
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
            Refresh
          </Button>
        </Space>
      </Card>

      {/* Reports Table */}
      <Card>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 50 }}>
            <Spin size="large" />
          </div>
        ) : reports.length === 0 ? (
          <Empty description="No reports found" />
        ) : (
          <Table
            dataSource={reports}
            columns={columns}
            rowKey="id"
            pagination={{
              total: reportsData?.total || 0,
              pageSize: reportsData?.limit || 20,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} reports`,
            }}
          />
        )}
      </Card>

      {/* Details Modal */}
      <Modal
        title="Report Details"
        open={detailsModalOpen}
        onCancel={() => {
          setDetailsModalOpen(false);
          setSelectedReport(null);
        }}
        footer={[
          <Button key="close" onClick={() => setDetailsModalOpen(false)}>
            Close
          </Button>,
          <Button
            key="review"
            type="primary"
            onClick={() => {
              setDetailsModalOpen(false);
              if (selectedReport) handleUpdateReport(selectedReport);
            }}
          >
            Review Report
          </Button>,
        ]}
        width={600}
      >
        {selectedReport && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text type="secondary">Report ID</Text>
                <br />
                <Text copyable>{selectedReport.id}</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary">Status</Text>
                <br />
                <Badge
                  status={reportStatusConfig[selectedReport.status]?.color as 'warning' | 'processing' | 'success' | 'default'}
                  text={reportStatusConfig[selectedReport.status]?.label}
                />
              </Col>
              <Col span={12}>
                <Text type="secondary">Type</Text>
                <br />
                <Tag color={reportTypeConfig[selectedReport.type]?.color}>
                  {reportTypeConfig[selectedReport.type]?.label}
                </Tag>
              </Col>
              <Col span={12}>
                <Text type="secondary">Submitted</Text>
                <br />
                <Text>{dayjs(selectedReport.createdAt).format('MMM D, YYYY h:mm A')}</Text>
              </Col>
              <Col span={24}>
                <Text type="secondary">Reporter</Text>
                <br />
                <Space>
                  <Avatar src={normalizeImageUrl(selectedReport.user?.avatar)} icon={<UserOutlined />} />
                  <div>
                    <Text strong>{selectedReport.user?.name}</Text>
                    <br />
                    <Text type="secondary">{selectedReport.user?.email}</Text>
                  </div>
                </Space>
              </Col>
              {selectedReport.ticket && (
                <Col span={24}>
                  <Text type="secondary">Related Ticket</Text>
                  <br />
                  <Space>
                    <MessageOutlined />
                    <Tag color="blue">{selectedReport.ticket.ticketNumber}</Tag>
                    <Text>{selectedReport.ticket.subject}</Text>
                  </Space>
                </Col>
              )}
              <Col span={24}>
                <Text type="secondary">Description</Text>
                <br />
                <Paragraph style={{ background: '#f5f5f5', padding: 12, borderRadius: 8 }}>
                  {selectedReport.description || 'No description provided'}
                </Paragraph>
              </Col>
              {selectedReport.adminNotes && (
                <Col span={24}>
                  <Text type="secondary">Admin Notes</Text>
                  <br />
                  <Paragraph style={{ background: '#e6f4ff', padding: 12, borderRadius: 8 }}>
                    {selectedReport.adminNotes}
                  </Paragraph>
                </Col>
              )}
              {selectedReport.reviewer && (
                <Col span={24}>
                  <Text type="secondary">Reviewed By</Text>
                  <br />
                  <Text>{selectedReport.reviewer.name} on {dayjs(selectedReport.reviewedAt).format('MMM D, YYYY h:mm A')}</Text>
                </Col>
              )}
            </Row>
          </div>
        )}
      </Modal>

      {/* Update Modal */}
      <Modal
        title="Review Report"
        open={updateModalOpen}
        onCancel={() => {
          setUpdateModalOpen(false);
          setSelectedReport(null);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmitUpdate}
        >
          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: 'Please select a status' }]}
          >
            <Select
              options={[
                { label: 'Pending', value: 'pending' },
                { label: 'Reviewed', value: 'reviewed' },
                { label: 'Resolved', value: 'resolved' },
                { label: 'Dismissed', value: 'dismissed' },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="adminNotes"
            label="Admin Notes"
          >
            <TextArea rows={4} placeholder="Add notes about this report..." />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button onClick={() => setUpdateModalOpen(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={updateMutation.isPending}>
                Update Report
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
