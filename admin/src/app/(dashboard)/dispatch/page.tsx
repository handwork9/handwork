'use client';

import {
  Card,
  Typography,
  Form,
  InputNumber,
  Switch,
  Button,
  Divider,
  Space,
  Select,
  Slider,
  Row,
  Col,
  Alert,
  Tabs,
  App,
  Descriptions,
  Tag,
  Tooltip,
  Statistic,
} from 'antd';
import {
  SaveOutlined,
  ReloadOutlined,
  SettingOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  CarOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { useConfigStore } from '@/store/config';

const { Title, Text } = Typography;

interface DispatchConfig {
  // Pricing
  baseFee: number;
  perKmRate: number;
  peakHoursMultiplier: number;
  minFee: number;
  maxFee: number;
  
  // Timing
  maxDeliveryRadius: number; // km
  estimatedPrepTime: number; // minutes
  avgDeliverySpeed: number; // km/h
  bufferTime: number; // minutes
  
  // Auto-dispatch
  autoDispatchEnabled: boolean;
  autoDispatchDelay: number; // seconds
  maxAutoDispatchAttempts: number;
  dispatchRadiusTiers: number[]; // km tiers
  
  // Peak hours
  peakHoursEnabled: boolean;
  peakHoursStart: string;
  peakHoursEnd: string;
  weekendPeakMultiplier: number;
  
  // Rider limits
  maxActiveOrdersPerRider: number;
  minRiderRating: number;
  prioritizeVerifiedRiders: boolean;
}

const formatCurrency = (value: number) => `₦${value.toLocaleString()}`;

export default function DispatchPage() {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const { featureFlags, setFeatureFlag } = useConfigStore();
  const { message } = App.useApp();

  // Fetch current config
  const { data: configData } = useQuery({
    queryKey: ['dispatch-config'],
    queryFn: async () => {
      const response = await adminApi.getDispatchConfig();
      return response.data.data;
    },
  });

  // Save config mutation
  const saveMutation = useMutation({
    mutationFn: (config: Partial<DispatchConfig>) =>
      adminApi.updateDispatchConfig(config),
    onSuccess: () => {
      message.success('Dispatch configuration saved');
      queryClient.invalidateQueries({ queryKey: ['dispatch-config'] });
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      message.error(error.response?.data?.message || 'Failed to save configuration');
    },
  });

  // Default config
  const defaultConfig: DispatchConfig = {
    baseFee: 500,
    perKmRate: 100,
    peakHoursMultiplier: 1.5,
    minFee: 500,
    maxFee: 5000,
    maxDeliveryRadius: 15,
    estimatedPrepTime: 15,
    avgDeliverySpeed: 25,
    bufferTime: 5,
    autoDispatchEnabled: true,
    autoDispatchDelay: 30,
    maxAutoDispatchAttempts: 5,
    dispatchRadiusTiers: [2, 5, 10],
    peakHoursEnabled: true,
    peakHoursStart: '12:00',
    peakHoursEnd: '14:00',
    weekendPeakMultiplier: 1.3,
    maxActiveOrdersPerRider: 3,
    minRiderRating: 4.0,
    prioritizeVerifiedRiders: true,
  };

  const config = configData || defaultConfig;

  const handleSave = () => {
    form.validateFields().then((values) => {
      saveMutation.mutate(values);
    });
  };

  const handleReset = () => {
    form.setFieldsValue(defaultConfig);
    message.info('Reset to default values');
  };

  return (
    <div style={{ margin: -24 }}>
      {/* Gradient Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
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
              <RocketOutlined style={{ fontSize: 24, color: '#fff' }} />
            </div>
            <div>
              <Title level={3} style={{ color: '#fff', margin: 0 }}>Dispatch Configuration</Title>
              <Text style={{ color: 'rgba(255,255,255,0.8)' }}>Configure delivery pricing, timing, and auto-dispatch settings</Text>
            </div>
          </div>
          <Space>
            <Tooltip title="Reset to defaults">
              <Button 
                icon={<ReloadOutlined />} 
                onClick={handleReset}
                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff' }}
              >
                Reset
              </Button>
            </Tooltip>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              loading={saveMutation.isPending}
              style={{ background: '#fff', color: '#10b981', border: 'none' }}
            >
              Save Changes
            </Button>
          </Space>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ padding: '0 24px', marginBottom: 24 }}>
        <Row gutter={16}>
          <Col xs={12} sm={6}>
            <Card 
              size="small" 
              style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              styles={{ body: { padding: 16 } }}
            >
              <Statistic
                title={<Text type="secondary" style={{ fontSize: 12 }}>Base Fee</Text>}
                value={config.baseFee}
                prefix="₦"
                styles={{ content: { fontSize: 24 } }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card 
              size="small" 
              style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              styles={{ body: { padding: 16 } }}
            >
              <Statistic
                title={<Text type="secondary" style={{ fontSize: 12 }}>Per Km Rate</Text>}
                value={config.perKmRate}
                prefix="₦"
                styles={{ content: { fontSize: 24 } }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card 
              size="small" 
              style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              styles={{ body: { padding: 16 } }}
            >
              <Statistic
                title={<Text type="secondary" style={{ fontSize: 12 }}>Max Radius</Text>}
                value={config.maxDeliveryRadius}
                suffix="km"
                styles={{ content: { fontSize: 24 } }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card 
              size="small" 
              style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              styles={{ body: { padding: 16 } }}
            >
              <Statistic
                title={<Text type="secondary" style={{ fontSize: 12 }}>Auto-Dispatch</Text>}
                value={config.autoDispatchEnabled ? 'On' : 'Off'}
                prefix={<ThunderboltOutlined style={{ color: config.autoDispatchEnabled ? '#10b981' : '#8c8c8c' }} />}
                styles={{ content: { fontSize: 24, color: config.autoDispatchEnabled ? '#10b981' : '#8c8c8c' } }}
              />
            </Card>
          </Col>
        </Row>
      </div>

      {/* Main Content */}
      <div style={{ padding: '0 24px 24px' }}>
        <Alert
          title="Configuration Changes"
          description="Changes will take effect immediately for new orders. Existing orders will continue with their original settings."
          type="info"
          showIcon
          style={{ marginBottom: 24, borderRadius: 12 }}
        />

      <Form
        form={form}
        layout="vertical"
        initialValues={config}
      >
        <Card 
          style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          styles={{ body: { padding: 0 } }}
        >
        <Tabs
          defaultActiveKey="pricing"
          type="card"
          style={{ padding: 16 }}
          items={[
            {
              key: 'pricing',
              label: (
                <span>
                  <DollarOutlined />
                  Pricing
                </span>
              ),
              children: (
                <Row gutter={24}>
                  <Col xs={24} lg={12}>
                    <Card 
                      title={
                        <Space>
                          <DollarOutlined style={{ color: '#10b981' }} />
                          <span>Delivery Fees</span>
                        </Space>
                      }
                      style={{ marginBottom: 24, borderRadius: 12 }}
                      styles={{ body: { padding: 20 } }}
                    >
                      <Form.Item
                        name="baseFee"
                        label="Base Delivery Fee"
                        tooltip="Fixed fee charged for every delivery"
                      >
                        <InputNumber
                          style={{ width: '100%' }}
                          min={0}
                          step={50}
                          formatter={(value) => `₦ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                          parser={(value) => Number(value!.replace(/₦\s?|(,*)/g, '')) as unknown as 0}
                        />
                      </Form.Item>

                      <Form.Item
                        name="perKmRate"
                        label="Per Kilometer Rate"
                        tooltip="Additional charge per kilometer"
                      >
                        <InputNumber
                          style={{ width: '100%' }}
                          min={0}
                          step={10}
                          formatter={(value) => `₦ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                          parser={(value) => Number(value!.replace(/₦\s?|(,*)/g, '')) as unknown as 0}
                        />
                      </Form.Item>

                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            name="minFee"
                            label="Minimum Fee"
                          >
                            <InputNumber
                              style={{ width: '100%' }}
                              min={0}
                              formatter={(value) => `₦ ${value}`}
                              parser={(value) => Number(value!.replace(/₦\s?/g, '')) as unknown as 0}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="maxFee"
                            label="Maximum Fee"
                          >
                            <InputNumber
                              style={{ width: '100%' }}
                              min={0}
                              formatter={(value) => `₦ ${value}`}
                              parser={(value) => Number(value!.replace(/₦\s?/g, '')) as unknown as 0}
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Divider>Fee Calculator Preview</Divider>
                      <Descriptions column={1} size="small">
                        <Descriptions.Item label="3 km delivery">
                          {formatCurrency(config.baseFee + config.perKmRate * 3)}
                        </Descriptions.Item>
                        <Descriptions.Item label="5 km delivery">
                          {formatCurrency(config.baseFee + config.perKmRate * 5)}
                        </Descriptions.Item>
                        <Descriptions.Item label="10 km delivery">
                          {formatCurrency(Math.min(config.baseFee + config.perKmRate * 10, config.maxFee))}
                        </Descriptions.Item>
                      </Descriptions>
                    </Card>
                  </Col>

                  <Col xs={24} lg={12}>
                    <Card 
                      title={
                        <Space>
                          <ClockCircleOutlined style={{ color: '#f59e0b' }} />
                          <span>Peak Hours Pricing</span>
                        </Space>
                      }
                      style={{ marginBottom: 24, borderRadius: 12 }}
                      styles={{ body: { padding: 20 } }}
                    >
                      <Form.Item
                        name="peakHoursEnabled"
                        label="Enable Peak Hours Pricing"
                        valuePropName="checked"
                      >
                        <Switch />
                      </Form.Item>

                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            name="peakHoursStart"
                            label="Peak Start Time"
                          >
                            <Select
                              options={Array.from({ length: 24 }, (_, i) => ({
                                value: `${i.toString().padStart(2, '0')}:00`,
                                label: `${i.toString().padStart(2, '0')}:00`,
                              }))}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="peakHoursEnd"
                            label="Peak End Time"
                          >
                            <Select
                              options={Array.from({ length: 24 }, (_, i) => ({
                                value: `${i.toString().padStart(2, '0')}:00`,
                                label: `${i.toString().padStart(2, '0')}:00`,
                              }))}
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Form.Item
                        name="peakHoursMultiplier"
                        label="Peak Hours Multiplier"
                        tooltip="Delivery fee is multiplied by this during peak hours"
                      >
                        <Slider
                          min={1}
                          max={3}
                          step={0.1}
                          marks={{
                            1: '1x',
                            1.5: '1.5x',
                            2: '2x',
                            2.5: '2.5x',
                            3: '3x',
                          }}
                        />
                      </Form.Item>

                      <Form.Item
                        name="weekendPeakMultiplier"
                        label="Weekend Multiplier"
                      >
                        <Slider
                          min={1}
                          max={2}
                          step={0.1}
                          marks={{
                            1: '1x',
                            1.25: '1.25x',
                            1.5: '1.5x',
                            1.75: '1.75x',
                            2: '2x',
                          }}
                        />
                      </Form.Item>
                    </Card>
                  </Col>
                </Row>
              ),
            },
            {
              key: 'timing',
              label: (
                <span>
                  <ClockCircleOutlined />
                  Timing
                </span>
              ),
              children: (
                <Row gutter={24}>
                  <Col xs={24} lg={12}>
                    <Card 
                      title={
                        <Space>
                          <ClockCircleOutlined style={{ color: '#3b82f6' }} />
                          <span>Delivery Estimates</span>
                        </Space>
                      }
                      style={{ borderRadius: 12 }}
                      styles={{ body: { padding: 20 } }}
                    >
                      <Form.Item
                        name="estimatedPrepTime"
                        label="Estimated Preparation Time (minutes)"
                        tooltip="Average time for farmers to prepare orders"
                      >
                        <Space.Compact style={{ width: '100%' }}>
                          <InputNumber
                            style={{ width: '100%' }}
                            min={5}
                            max={120}
                          />
                          <Button disabled style={{ pointerEvents: 'none' }}>mins</Button>
                        </Space.Compact>
                      </Form.Item>

                      <Form.Item
                        name="avgDeliverySpeed"
                        label="Average Delivery Speed"
                        tooltip="Average rider speed for time calculations"
                      >
                        <Space.Compact style={{ width: '100%' }}>
                          <InputNumber
                            style={{ width: '100%' }}
                            min={10}
                            max={60}
                          />
                          <Button disabled style={{ pointerEvents: 'none' }}>km/h</Button>
                        </Space.Compact>
                      </Form.Item>

                      <Form.Item
                        name="bufferTime"
                        label="Buffer Time (minutes)"
                        tooltip="Extra time added to delivery estimates"
                      >
                        <Space.Compact style={{ width: '100%' }}>
                          <InputNumber
                            style={{ width: '100%' }}
                            min={0}
                            max={30}
                          />
                          <Button disabled style={{ pointerEvents: 'none' }}>mins</Button>
                        </Space.Compact>
                      </Form.Item>
                    </Card>
                  </Col>

                  <Col xs={24} lg={12}>
                    <Card 
                      title={
                        <Space>
                          <CarOutlined style={{ color: '#8b5cf6' }} />
                          <span>Delivery Radius</span>
                        </Space>
                      }
                      style={{ borderRadius: 12 }}
                      styles={{ body: { padding: 20 } }}
                    >
                      <Form.Item
                        name="maxDeliveryRadius"
                        label="Maximum Delivery Radius"
                        tooltip="Orders beyond this distance will be rejected"
                      >
                        <Slider
                          min={5}
                          max={50}
                          marks={{
                            5: '5km',
                            15: '15km',
                            25: '25km',
                            50: '50km',
                          }}
                        />
                      </Form.Item>

                      <Divider>Time Estimate Preview</Divider>
                      <Descriptions column={1} size="small">
                        <Descriptions.Item label="3 km delivery">
                          ~{Math.round(config.estimatedPrepTime + (3 / config.avgDeliverySpeed) * 60 + config.bufferTime)} mins
                        </Descriptions.Item>
                        <Descriptions.Item label="5 km delivery">
                          ~{Math.round(config.estimatedPrepTime + (5 / config.avgDeliverySpeed) * 60 + config.bufferTime)} mins
                        </Descriptions.Item>
                        <Descriptions.Item label="10 km delivery">
                          ~{Math.round(config.estimatedPrepTime + (10 / config.avgDeliverySpeed) * 60 + config.bufferTime)} mins
                        </Descriptions.Item>
                      </Descriptions>
                    </Card>
                  </Col>
                </Row>
              ),
            },
            {
              key: 'autodispatch',
              label: (
                <span>
                  <ThunderboltOutlined />
                  Auto-Dispatch
                </span>
              ),
              children: (
                <Row gutter={24}>
                  <Col xs={24} lg={12}>
                    <Card 
                      title={
                        <Space>
                          <ThunderboltOutlined style={{ color: '#10b981' }} />
                          <span>Auto-Dispatch Settings</span>
                        </Space>
                      }
                      style={{ borderRadius: 12 }}
                      styles={{ body: { padding: 20 } }}
                    >
                      <Form.Item
                        name="autoDispatchEnabled"
                        label="Enable Auto-Dispatch"
                        valuePropName="checked"
                        tooltip="Automatically assign riders to orders"
                      >
                        <Switch />
                      </Form.Item>

                      <Form.Item
                        name="autoDispatchDelay"
                        label="Dispatch Delay (seconds)"
                        tooltip="Time to wait before auto-dispatching after order is ready"
                      >
                        <Space.Compact style={{ width: '100%' }}>
                          <InputNumber
                            style={{ width: '100%' }}
                            min={0}
                            max={300}
                          />
                          <Button disabled style={{ pointerEvents: 'none' }}>secs</Button>
                        </Space.Compact>
                      </Form.Item>

                      <Form.Item
                        name="maxAutoDispatchAttempts"
                        label="Max Dispatch Attempts"
                        tooltip="Number of riders to try before manual intervention"
                      >
                        <InputNumber
                          style={{ width: '100%' }}
                          min={1}
                          max={20}
                        />
                      </Form.Item>

                      <Form.Item
                        label="Dispatch Radius Tiers (km)"
                        tooltip="System expands search radius through these tiers"
                      >
                        <Space>
                          <Tag color="blue">Tier 1: 2km</Tag>
                          <Tag color="green">Tier 2: 5km</Tag>
                          <Tag color="orange">Tier 3: 10km</Tag>
                        </Space>
                      </Form.Item>
                    </Card>
                  </Col>

                  <Col xs={24} lg={12}>
                    <Card 
                      title={
                        <Space>
                          <SettingOutlined style={{ color: '#ef4444' }} />
                          <span>Rider Selection Criteria</span>
                        </Space>
                      }
                      style={{ borderRadius: 12 }}
                      styles={{ body: { padding: 20 } }}
                    >
                      <Form.Item
                        name="maxActiveOrdersPerRider"
                        label="Max Active Orders per Rider"
                        tooltip="Maximum concurrent orders a rider can have"
                      >
                        <InputNumber
                          style={{ width: '100%' }}
                          min={1}
                          max={10}
                        />
                      </Form.Item>

                      <Form.Item
                        name="minRiderRating"
                        label="Minimum Rider Rating"
                        tooltip="Only riders with this rating or higher will be auto-dispatched"
                      >
                        <Slider
                          min={1}
                          max={5}
                          step={0.5}
                          marks={{
                            1: '1.0',
                            2: '2.0',
                            3: '3.0',
                            4: '4.0',
                            5: '5.0',
                          }}
                        />
                      </Form.Item>

                      <Form.Item
                        name="prioritizeVerifiedRiders"
                        label="Prioritize Verified Riders"
                        valuePropName="checked"
                        tooltip="Verified riders get priority in dispatch queue"
                      >
                        <Switch />
                      </Form.Item>
                    </Card>
                  </Col>
                </Row>
              ),
            },
            {
              key: 'features',
              label: (
                <span>
                  <SettingOutlined />
                  Feature Flags
                </span>
              ),
              children: (
                <Row gutter={24}>
                  <Col xs={24} lg={12}>
                    <Card 
                      title={
                        <Space>
                          <SettingOutlined style={{ color: '#3b82f6' }} />
                          <span>Marketplace Features</span>
                        </Space>
                      }
                      style={{ borderRadius: 12 }}
                      styles={{ body: { padding: 20 } }}
                    >
                      <Space orientation="vertical" style={{ width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <Text strong>Live Tracking</Text>
                            <br />
                            <Text type="secondary">Real-time rider location updates</Text>
                          </div>
                          <Switch
                            checked={featureFlags.liveTracking}
                            onChange={(v) => setFeatureFlag('liveTracking', v)}
                          />
                        </div>
                        <Divider style={{ margin: '12px 0' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <Text strong>Push Notifications</Text>
                            <br />
                            <Text type="secondary">Send push notifications to users</Text>
                          </div>
                          <Switch
                            checked={featureFlags.notifications}
                            onChange={(v) => setFeatureFlag('notifications', v)}
                          />
                        </div>
                        <Divider style={{ margin: '12px 0' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <Text strong>Reviews</Text>
                            <br />
                            <Text type="secondary">Allow customers to leave reviews</Text>
                          </div>
                          <Switch
                            checked={featureFlags.reviews}
                            onChange={(v) => setFeatureFlag('reviews', v)}
                          />
                        </div>
                        <Divider style={{ margin: '12px 0' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <Text strong>Promotions</Text>
                            <br />
                            <Text type="secondary">Enable discount codes and promotions</Text>
                          </div>
                          <Switch
                            checked={featureFlags.promotions}
                            onChange={(v) => setFeatureFlag('promotions', v)}
                          />
                        </div>
                      </Space>
                    </Card>
                  </Col>

                  <Col xs={24} lg={12}>
                    <Card 
                      title={
                        <Space>
                          <ThunderboltOutlined style={{ color: '#f59e0b' }} />
                          <span>System Features</span>
                        </Space>
                      }
                      style={{ borderRadius: 12 }}
                      styles={{ body: { padding: 20 } }}
                    >
                      <Space orientation="vertical" style={{ width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <Text strong>Maintenance Mode</Text>
                            <br />
                            <Text type="secondary">Disable ordering for maintenance</Text>
                          </div>
                          <Switch
                            checked={featureFlags.maintenanceMode}
                            onChange={(v) => setFeatureFlag('maintenanceMode', v)}
                          />
                        </div>
                        <Divider style={{ margin: '12px 0' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <Text strong>Debug Mode</Text>
                            <br />
                            <Text type="secondary">Enable verbose logging</Text>
                          </div>
                          <Switch
                            checked={featureFlags.debugMode}
                            onChange={(v) => setFeatureFlag('debugMode', v)}
                          />
                        </div>
                      </Space>
                    </Card>
                  </Col>
                </Row>
              ),
            },
          ]}
        />
        </Card>
      </Form>
      </div>
    </div>
  );
}
