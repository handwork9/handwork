'use client';

import { useState } from 'react';
import {
  Row,
  Col,
  Card,
  Statistic,
  Typography,
  Table,
  Tag,
  Space,
  Button,
  Select,
  DatePicker,
  Modal,
  Input,
  Badge,
  Tooltip,
  Tabs,
  Progress,
  Alert,
  Descriptions,
  Timeline,
  message,
} from 'antd';
import {
  WarningOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  UserOutlined,
  StopOutlined,
  SearchOutlined,
  ReloadOutlined,
  AlertOutlined,
  SafetyOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import dayjs from 'dayjs';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#6b7280'];

const SEVERITY_COLORS: Record<string, string> = {
  low: 'blue',
  medium: 'orange',
  high: 'red',
  critical: 'magenta',
};

const STATUS_COLORS: Record<string, string> = {
  open: 'blue',
  investigating: 'orange',
  confirmed: 'red',
  false_positive: 'green',
  resolved: 'default',
  escalated: 'purple',
};

const FRAUD_TYPE_LABELS: Record<string, string> = {
  suspicious_login: 'Suspicious Login',
  multiple_accounts: 'Multiple Accounts',
  unusual_transaction: 'Unusual Transaction',
  fake_reviews: 'Fake Reviews',
  payment_fraud: 'Payment Fraud',
  account_takeover: 'Account Takeover',
  velocity_abuse: 'Velocity Abuse',
  refund_abuse: 'Refund Abuse',
  promo_abuse: 'Promo Abuse',
  fake_orders: 'Fake Orders',
  identity_fraud: 'Identity Fraud',
  chargeback: 'Chargeback',
};

export default function FraudDetectionPage() {
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [severityFilter, setSeverityFilter] = useState<string | undefined>();
  const [page, setPage] = useState(1);

  const getDateParams = () => {
    if (dateRange) {
      return {
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD'),
      };
    }
    return {};
  };

  // Fetch stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['fraud-stats', dateRange],
    queryFn: async () => {
      const params = getDateParams();
      const response = await api.get('/admin/fraud/stats', { params });
      return response.data;
    },
  });

  // Fetch alerts
  const { data: alertsData, isLoading: alertsLoading } = useQuery({
    queryKey: ['fraud-alerts', page, statusFilter, typeFilter, severityFilter],
    queryFn: async () => {
      const response = await api.get('/admin/fraud/alerts', {
        params: {
          page,
          limit: 20,
          status: statusFilter,
          type: typeFilter,
          severity: severityFilter,
        },
      });
      return response.data;
    },
  });

  // Fetch rules
  const { data: rules } = useQuery({
    queryKey: ['fraud-rules'],
    queryFn: async () => {
      const response = await api.get('/admin/fraud/rules');
      return response.data;
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, resolution }: { id: string; status: string; resolution?: string }) => {
      const response = await api.put(`/admin/fraud/alerts/${id}/status`, { status, resolution });
      return response.data;
    },
    onSuccess: () => {
      message.success('Alert status updated');
      queryClient.invalidateQueries({ queryKey: ['fraud-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['fraud-stats'] });
      setDetailsModalOpen(false);
    },
  });

  // Block user mutation
  const blockUserMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const response = await api.post(`/admin/fraud/alerts/${alertId}/block-user`);
      return response.data;
    },
    onSuccess: () => {
      message.success('User blocked');
      queryClient.invalidateQueries({ queryKey: ['fraud-alerts'] });
    },
  });

  // Run scan mutation
  const runScanMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/admin/fraud/scan');
      return response.data;
    },
    onSuccess: () => {
      message.success('Fraud scan completed');
      queryClient.invalidateQueries({ queryKey: ['fraud-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['fraud-stats'] });
    },
  });

  const columns = [
    {
      title: 'Alert',
      key: 'alert',
      render: (_: any, record: any) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.title}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {FRAUD_TYPE_LABELS[record.type] || record.type}
          </Text>
        </Space>
      ),
    },
    {
      title: 'User',
      key: 'user',
      render: (_: any, record: any) => (
        <Space>
          <UserOutlined />
          <Text>{record.user?.fullName || 'Unknown'}</Text>
        </Space>
      ),
    },
    {
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      render: (severity: string) => (
        <Tag color={SEVERITY_COLORS[severity]}>{severity.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Risk Score',
      dataIndex: 'riskScore',
      key: 'riskScore',
      render: (score: number) => (
        <Progress
          percent={score}
          size="small"
          strokeColor={score >= 70 ? '#ef4444' : score >= 40 ? '#f59e0b' : '#10b981'}
          showInfo={false}
          style={{ width: 80 }}
        />
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={STATUS_COLORS[status]}>{status.replace('_', ' ').toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('MMM D, HH:mm'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              icon={<EyeOutlined />}
              size="small"
              onClick={() => {
                setSelectedAlert(record);
                setDetailsModalOpen(true);
              }}
            />
          </Tooltip>
          {record.status === 'open' && (
            <>
              <Tooltip title="Mark as False Positive">
                <Button
                  icon={<CheckCircleOutlined />}
                  size="small"
                  onClick={() => updateStatusMutation.mutate({ id: record.id, status: 'false_positive' })}
                />
              </Tooltip>
              <Tooltip title="Confirm Fraud">
                <Button
                  icon={<CloseCircleOutlined />}
                  size="small"
                  danger
                  onClick={() => updateStatusMutation.mutate({ id: record.id, status: 'confirmed' })}
                />
              </Tooltip>
            </>
          )}
          {!record.userBlocked && record.userId && (
            <Tooltip title="Block User">
              <Button
                icon={<StopOutlined />}
                size="small"
                danger
                onClick={() => {
                  Modal.confirm({
                    title: 'Block User?',
                    content: 'This will suspend the user account. Are you sure?',
                    onOk: () => blockUserMutation.mutate(record.id),
                  });
                }}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  const pieData = stats?.alertsByType?.map((item: any) => ({
    name: FRAUD_TYPE_LABELS[item.type] || item.type,
    value: parseInt(item.count),
  })) || [];

  return (
    <div style={{ padding: 24 }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            <SafetyOutlined /> Fraud Detection
          </Title>
        </Col>
        <Col>
          <Space>
            <RangePicker
              value={dateRange}
              onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
            />
            <Button
              icon={<ReloadOutlined />}
              loading={runScanMutation.isPending}
              onClick={() => runScanMutation.mutate()}
            >
              Run Scan
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic
              title="Total Alerts"
              value={stats?.totalAlerts || 0}
              prefix={<AlertOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic
              title="Open"
              value={stats?.openAlerts || 0}
              valueStyle={{ color: '#3b82f6' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic
              title="Investigating"
              value={stats?.investigatingAlerts || 0}
              valueStyle={{ color: '#f59e0b' }}
              prefix={<SearchOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic
              title="Confirmed"
              value={stats?.confirmedFraud || 0}
              valueStyle={{ color: '#ef4444' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic
              title="False Positives"
              value={stats?.falsePositives || 0}
              valueStyle={{ color: '#10b981' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic
              title="Resolved"
              value={stats?.resolvedAlerts || 0}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={16}>
          <Card title="Alert Trend">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={stats?.riskTrend || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <RechartsTooltip />
                <Area type="monotone" dataKey="count" stroke="#ef4444" fill="#fecaca" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="Alerts by Type">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  dataKey="value"
                  label={({ name }) => name}
                >
                  {pieData.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Alerts Table */}
      <Card
        title="Fraud Alerts"
        extra={
          <Space>
            <Select
              placeholder="Status"
              allowClear
              style={{ width: 140 }}
              onChange={setStatusFilter}
              options={[
                { label: 'Open', value: 'open' },
                { label: 'Investigating', value: 'investigating' },
                { label: 'Confirmed', value: 'confirmed' },
                { label: 'False Positive', value: 'false_positive' },
                { label: 'Resolved', value: 'resolved' },
              ]}
            />
            <Select
              placeholder="Severity"
              allowClear
              style={{ width: 120 }}
              onChange={setSeverityFilter}
              options={[
                { label: 'Critical', value: 'critical' },
                { label: 'High', value: 'high' },
                { label: 'Medium', value: 'medium' },
                { label: 'Low', value: 'low' },
              ]}
            />
            <Select
              placeholder="Type"
              allowClear
              style={{ width: 160 }}
              onChange={setTypeFilter}
              options={Object.entries(FRAUD_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
            />
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={alertsData?.alerts || []}
          rowKey="id"
          loading={alertsLoading}
          pagination={{
            current: page,
            total: alertsData?.total || 0,
            pageSize: 20,
            onChange: setPage,
            showTotal: (total) => `Total ${total} alerts`,
          }}
        />
      </Card>

      {/* Alert Details Modal */}
      <Modal
        title="Alert Details"
        open={detailsModalOpen}
        onCancel={() => setDetailsModalOpen(false)}
        width={700}
        footer={
          selectedAlert?.status === 'open' || selectedAlert?.status === 'investigating' ? (
            <Space>
              <Button onClick={() => setDetailsModalOpen(false)}>Close</Button>
              <Button
                onClick={() => updateStatusMutation.mutate({ id: selectedAlert.id, status: 'investigating' })}
              >
                Mark Investigating
              </Button>
              <Button
                type="primary"
                ghost
                onClick={() => updateStatusMutation.mutate({ id: selectedAlert.id, status: 'false_positive' })}
              >
                False Positive
              </Button>
              <Button
                type="primary"
                danger
                onClick={() => updateStatusMutation.mutate({ id: selectedAlert.id, status: 'confirmed' })}
              >
                Confirm Fraud
              </Button>
            </Space>
          ) : null
        }
      >
        {selectedAlert && (
          <Tabs
            items={[
              {
                key: 'details',
                label: 'Details',
                children: (
                  <Descriptions column={2} bordered size="small">
                    <Descriptions.Item label="Title" span={2}>{selectedAlert.title}</Descriptions.Item>
                    <Descriptions.Item label="Type">
                      {FRAUD_TYPE_LABELS[selectedAlert.type] || selectedAlert.type}
                    </Descriptions.Item>
                    <Descriptions.Item label="Severity">
                      <Tag color={SEVERITY_COLORS[selectedAlert.severity]}>
                        {selectedAlert.severity.toUpperCase()}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Status">
                      <Tag color={STATUS_COLORS[selectedAlert.status]}>
                        {selectedAlert.status.replace('_', ' ').toUpperCase()}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Risk Score">
                      <Progress
                        percent={selectedAlert.riskScore}
                        size="small"
                        strokeColor={selectedAlert.riskScore >= 70 ? '#ef4444' : selectedAlert.riskScore >= 40 ? '#f59e0b' : '#10b981'}
                      />
                    </Descriptions.Item>
                    <Descriptions.Item label="Description" span={2}>
                      {selectedAlert.description}
                    </Descriptions.Item>
                    <Descriptions.Item label="User">
                      {selectedAlert.user?.fullName || 'Unknown'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Auto Detected">
                      {selectedAlert.autoDetected ? <Tag color="blue">Yes</Tag> : <Tag>No</Tag>}
                    </Descriptions.Item>
                    <Descriptions.Item label="Created">
                      {dayjs(selectedAlert.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                    </Descriptions.Item>
                    <Descriptions.Item label="User Blocked">
                      {selectedAlert.userBlocked ? <Tag color="red">Yes</Tag> : <Tag color="green">No</Tag>}
                    </Descriptions.Item>
                  </Descriptions>
                ),
              },
              {
                key: 'notes',
                label: 'Notes & History',
                children: (
                  <Timeline
                    items={selectedAlert.notes?.map((note: any) => ({
                      children: (
                        <div>
                          <Text strong>{note.authorName}</Text>
                          <Text type="secondary" style={{ marginLeft: 8 }}>
                            {dayjs(note.createdAt).format('MMM D, HH:mm')}
                          </Text>
                          <div>{note.content}</div>
                        </div>
                      ),
                    })) || []}
                  />
                ),
              },
              {
                key: 'metadata',
                label: 'Metadata',
                children: (
                  <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4, fontSize: 12 }}>
                    {JSON.stringify(selectedAlert.metadata, null, 2)}
                  </pre>
                ),
              },
            ]}
          />
        )}
      </Modal>
    </div>
  );
}
