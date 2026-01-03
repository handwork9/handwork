'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  Input,
  Select,
  Button,
  Tag,
  Space,
  Modal,
  Form,
  InputNumber,
  App,
  Card,
  Image,
  Switch,
  Typography,
  Tooltip,
  Row,
  Col,
  Segmented,
  Statistic,
  Empty,
  Spin,
  Upload,
  message as antMessage,
} from 'antd';
import type { UploadFile, UploadProps } from 'antd';
import {
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  ExclamationCircleOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  ShoppingOutlined,
  InboxOutlined,
  UserOutlined,
  PlusOutlined,
  RocketOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { adminApi, normalizeImageUrl } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

const { Text, Title, Paragraph } = Typography;

interface Product {
  id: string;
  title: string;
  description: string;
  price: string | number;
  unit: string;
  stock: number;
  category: string;
  images: string[];
  isAvailable: boolean;
  isPromoted?: boolean;
  isAdminProduct?: boolean;
  promotionExpiresAt?: string;
  recommendationScore?: number;
  farmerId: string;
  farmerName?: string;
  farmerPhone?: string;
  farmerAvatar?: string;
  isVerifiedSeller?: boolean;
  farmer?: {
    id: string;
    firstName: string;
    lastName: string;
    businessName?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ProductsResponse {
  data: Product[];
  total: number;
  page: number;
  limit: number;
}

const categoryOptions = [
  { value: '', label: 'All Categories' },
  { value: 'vegetables', label: '🥬 Vegetables' },
  { value: 'fruits', label: '🍎 Fruits' },
  { value: 'grains', label: '🌾 Grains' },
  { value: 'dairy', label: '🥛 Dairy' },
  { value: 'eggs', label: '🥚 Eggs' },
  { value: 'meat', label: '🥩 Meat' },
  { value: 'poultry', label: '🍗 Poultry' },
  { value: 'seafood', label: '🐟 Seafood' },
  { value: 'herbs_spices', label: '🌶️ Herbs & Spices' },
  { value: 'honey', label: '🍯 Honey' },
  { value: 'nuts', label: '🥜 Nuts' },
  { value: 'tubers', label: '🥔 Tubers' },
  { value: 'oils', label: '🫒 Oils' },
  { value: 'legumes', label: '🫘 Legumes' },
  { value: 'processed', label: '📦 Processed' },
  { value: 'livestock', label: '🐄 Livestock' },
  { value: 'seeds', label: '🌱 Seeds' },
  { value: 'beverages', label: '🍹 Beverages' },
  { value: 'others', label: '📦 Other' },
];

// Nigerian States for filtering
const stateOptions = [
  { value: '', label: '📍 All States' },
  { value: 'Abia', label: 'Abia' },
  { value: 'Adamawa', label: 'Adamawa' },
  { value: 'Akwa Ibom', label: 'Akwa Ibom' },
  { value: 'Anambra', label: 'Anambra' },
  { value: 'Bauchi', label: 'Bauchi' },
  { value: 'Bayelsa', label: 'Bayelsa' },
  { value: 'Benue', label: 'Benue' },
  { value: 'Borno', label: 'Borno' },
  { value: 'Cross River', label: 'Cross River' },
  { value: 'Delta', label: 'Delta' },
  { value: 'Ebonyi', label: 'Ebonyi' },
  { value: 'Edo', label: 'Edo' },
  { value: 'Ekiti', label: 'Ekiti' },
  { value: 'Enugu', label: 'Enugu' },
  { value: 'FCT', label: 'FCT (Abuja)' },
  { value: 'Gombe', label: 'Gombe' },
  { value: 'Imo', label: 'Imo' },
  { value: 'Jigawa', label: 'Jigawa' },
  { value: 'Kaduna', label: 'Kaduna' },
  { value: 'Kano', label: 'Kano' },
  { value: 'Katsina', label: 'Katsina' },
  { value: 'Kebbi', label: 'Kebbi' },
  { value: 'Kogi', label: 'Kogi' },
  { value: 'Kwara', label: 'Kwara' },
  { value: 'Lagos', label: 'Lagos' },
  { value: 'Nasarawa', label: 'Nasarawa' },
  { value: 'Niger', label: 'Niger' },
  { value: 'Ogun', label: 'Ogun' },
  { value: 'Ondo', label: 'Ondo' },
  { value: 'Osun', label: 'Osun' },
  { value: 'Oyo', label: 'Oyo' },
  { value: 'Plateau', label: 'Plateau' },
  { value: 'Rivers', label: 'Rivers' },
  { value: 'Sokoto', label: 'Sokoto' },
  { value: 'Taraba', label: 'Taraba' },
  { value: 'Yobe', label: 'Yobe' },
  { value: 'Zamfara', label: 'Zamfara' },
];

// Product Card Component for Grid View (Buyer Preview Style)
function ProductCard({ 
  product, 
  onEdit, 
  onView, 
  onDelete, 
  onToggleAvailability 
}: { 
  product: Product;
  onEdit: () => void;
  onView: () => void;
  onDelete: () => void;
  onToggleAvailability: () => void;
}) {
  const price = Number(product.price);
  
  return (
    <Card
      hoverable
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      styles={{ body: { flex: 1, padding: 16 } }}
      cover={
        <div style={{ position: 'relative', height: 160, overflow: 'hidden', background: '#f5f5f5' }}>
          <Image
            src={normalizeImageUrl(product.images?.[0])}
            alt={product.title}
            style={{ width: '100%', height: 160, objectFit: 'cover' }}
            fallback="/placeholder-product.png"
            preview={false}
          />
          {!product.isAvailable && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Tag color="red" style={{ fontSize: 14 }}>Hidden</Tag>
            </div>
          )}
          <Tag 
            color="green" 
            style={{ 
              position: 'absolute', 
              top: 8, 
              right: 8,
              fontSize: 11,
            }}
          >
            {product.category}
          </Tag>
          {product.stock <= 5 && product.stock > 0 && (
            <Tag 
              color="orange" 
              style={{ 
                position: 'absolute', 
                top: 8, 
                left: 8,
                fontSize: 11,
              }}
            >
              Low Stock
            </Tag>
          )}
          {product.stock === 0 && (
            <Tag 
              color="red" 
              style={{ 
                position: 'absolute', 
                top: 8, 
                left: 8,
                fontSize: 11,
              }}
            >
              Out of Stock
            </Tag>
          )}
          {product.isPromoted && (
            <Tag 
              color="purple" 
              icon={<RocketOutlined />}
              style={{ 
                position: 'absolute', 
                bottom: 8, 
                left: 8,
                fontSize: 10,
              }}
            >
              Promoted
            </Tag>
          )}
          {product.isAdminProduct && (
            <Tag 
              color="cyan" 
              icon={<SafetyCertificateOutlined />}
              style={{ 
                position: 'absolute', 
                bottom: 8, 
                right: 8,
                fontSize: 10,
              }}
            >
              Official
            </Tag>
          )}
        </div>
      }
      actions={[
        <Tooltip title="View" key="view">
          <EyeOutlined onClick={onView} />
        </Tooltip>,
        <Tooltip title="Edit" key="edit">
          <EditOutlined onClick={onEdit} />
        </Tooltip>,
        <Tooltip title={product.isAvailable ? 'Hide' : 'Show'} key="toggle">
          <Switch 
            size="small" 
            checked={product.isAvailable} 
            onChange={onToggleAvailability}
          />
        </Tooltip>,
        <Tooltip title="Delete" key="delete">
          <DeleteOutlined onClick={onDelete} style={{ color: '#ff4d4f' }} />
        </Tooltip>,
      ]}
    >
      <div>
        <Text 
          strong 
          style={{ 
            fontSize: 14, 
            display: 'block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            marginBottom: 8,
          }}
          title={product.title}
        >
          {product.title}
        </Text>
        <div style={{ marginBottom: 8 }}>
          <Text strong style={{ fontSize: 18, color: '#16a34a' }}>
            ₦{price.toLocaleString()}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            /{product.unit}
          </Text>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            <InboxOutlined /> {product.stock} {product.unit}
          </Text>
          <Tooltip title={product.farmerName || product.farmer?.businessName || `${product.farmer?.firstName || ''} ${product.farmer?.lastName || ''}`}>
            <Text type="secondary" style={{ fontSize: 11, maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <UserOutlined /> {product.farmerName || product.farmer?.businessName || product.farmer?.firstName || 'Unknown'}
            </Text>
          </Tooltip>
        </div>
      </div>
    </Card>
  );
}

export default function ProductsPage() {
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [createFileList, setCreateFileList] = useState<UploadFile[]>([]);
  const [editFileList, setEditFileList] = useState<UploadFile[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [form] = Form.useForm();
  const [createForm] = Form.useForm();
  const queryClient = useQueryClient();
  const { message, modal } = App.useApp();
  const { user: adminUser } = useAuthStore();

  // Fetch farmers for dropdown
  const { data: farmersData } = useQuery({
    queryKey: ['farmers-dropdown'],
    queryFn: async () => {
      const response = await adminApi.getFarmersForDropdown();
      // Handle different response formats
      const data = response.data;
      if (Array.isArray(data)) {
        return data;
      }
      if (data?.data && Array.isArray(data.data)) {
        return data.data;
      }
      return [];
    },
  });

  const farmers = Array.isArray(farmersData) ? farmersData : [];

  const { data, isLoading, error } = useQuery<ProductsResponse>({
    queryKey: ['products', currentPage, pageSize, categoryFilter, stateFilter, searchText],
    queryFn: async () => {
      try {
        const response = await adminApi.getProducts({
          page: currentPage,
          limit: pageSize,
          category: categoryFilter || undefined,
          state: stateFilter || undefined,
          search: searchText || undefined,
        });
        const apiResponse = response.data;
        
        console.log('Products API response:', apiResponse);
        
        // Handle admin endpoint format: { products: [...], total, pages }
        if (apiResponse?.products && Array.isArray(apiResponse.products)) {
          return { 
            data: apiResponse.products, 
            total: apiResponse.total || apiResponse.products.length, 
            page: currentPage, 
            limit: pageSize 
          };
        }
        
        // Handle public endpoint: { success: true, data: { data: [...] } }
        if (apiResponse?.success && apiResponse?.data) {
          const innerData = apiResponse.data;
          if (Array.isArray(innerData.data)) {
            return { 
              data: innerData.data, 
              total: innerData.total || innerData.data.length, 
              page: innerData.page || currentPage, 
              limit: innerData.limit || pageSize 
            };
          }
          if (Array.isArray(innerData)) {
            return { data: innerData, total: innerData.length, page: currentPage, limit: pageSize };
          }
        }
        
        if (Array.isArray(apiResponse)) {
          return { data: apiResponse, total: apiResponse.length, page: currentPage, limit: pageSize };
        }
        
        if (apiResponse?.data && Array.isArray(apiResponse.data)) {
          return { 
            data: apiResponse.data, 
            total: apiResponse.total || apiResponse.data.length, 
            page: apiResponse.page || currentPage, 
            limit: apiResponse.limit || pageSize 
          };
        }
        
        console.warn('Unexpected API response format:', apiResponse);
        return { data: [], total: 0, page: currentPage, limit: pageSize };
      } catch (err) {
        console.error('Products fetch error:', err);
        throw err;
      }
    },
    retry: 1,
  });

  // Log error if present
  if (error) {
    console.error('Products query error:', error);
  }

  const products = Array.isArray(data?.data) ? data.data : [];

  // Helper function to convert file to base64
  const getBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  // Handle image preview
  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj as File);
    }
    setPreviewImage(file.url || (file.preview as string));
    setPreviewOpen(true);
  };

  // Upload props for create form
  const createUploadProps: UploadProps = {
    listType: 'picture-card',
    fileList: createFileList,
    onPreview: handlePreview,
    beforeUpload: (file) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        antMessage.error('You can only upload image files!');
        return Upload.LIST_IGNORE;
      }
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        antMessage.error('Image must be smaller than 5MB!');
        return Upload.LIST_IGNORE;
      }
      return false; // Prevent auto upload
    },
    onChange: ({ fileList }) => {
      setCreateFileList(fileList);
    },
    onRemove: (file) => {
      setCreateFileList((prev) => prev.filter((f) => f.uid !== file.uid));
    },
    maxCount: 5,
    accept: 'image/*',
  };

  // Upload props for edit form
  const editUploadProps: UploadProps = {
    listType: 'picture-card',
    fileList: editFileList,
    onPreview: handlePreview,
    beforeUpload: (file) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        antMessage.error('You can only upload image files!');
        return Upload.LIST_IGNORE;
      }
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        antMessage.error('Image must be smaller than 5MB!');
        return Upload.LIST_IGNORE;
      }
      return false; // Prevent auto upload
    },
    onChange: ({ fileList }) => {
      setEditFileList(fileList);
    },
    onRemove: (file) => {
      setEditFileList((prev) => prev.filter((f) => f.uid !== file.uid));
    },
    maxCount: 5,
    accept: 'image/*',
  };

  // Process images for submission
  const processImagesForSubmit = async (fileList: UploadFile[]): Promise<string[]> => {
    const images: string[] = [];
    for (const file of fileList) {
      if (file.url) {
        // Existing image URL
        images.push(file.url);
      } else if (file.originFileObj) {
        // New file - convert to base64
        const base64 = await getBase64(file.originFileObj);
        images.push(base64);
      }
    }
    return images;
  };

  const createMutation = useMutation({
    mutationFn: async (data: {
      farmerId: string;
      title: string;
      description?: string;
      price: number;
      unit?: string;
      stock: number;
      category: string;
    }) => {
      const images = await processImagesForSubmit(createFileList);
      // If "admin" is selected, use the admin's user ID
      const farmerId = data.farmerId === 'admin' && adminUser?.id 
        ? adminUser.id 
        : data.farmerId;
      return adminApi.createProduct({ ...data, farmerId, images });
    },
    onSuccess: () => {
      message.success('Product created successfully');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setCreateModalOpen(false);
      setCreateFileList([]);
    },
    onError: () => {
      message.error('Failed to create product');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const images = await processImagesForSubmit(editFileList);
      return adminApi.updateProduct(id, { ...data, images });
    },
    onSuccess: () => {
      message.success('Product updated successfully');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setEditModalOpen(false);
      setSelectedProduct(null);
      setEditFileList([]);
    },
    onError: () => {
      message.error('Failed to update product');
    },
  });

  const handleTableChange = (pagination: TablePaginationConfig) => {
    setCurrentPage(pagination.current || 1);
    setPageSize(pagination.pageSize || 12);
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    // Set up existing images for edit form
    if (product.images && product.images.length > 0) {
      const existingFiles: UploadFile[] = product.images.map((url, index) => ({
        uid: `-${index}`,
        name: `image-${index + 1}`,
        status: 'done',
        url: normalizeImageUrl(url),
      }));
      setEditFileList(existingFiles);
    } else {
      setEditFileList([]);
    }
    setEditModalOpen(true);
  };

  const handleView = (product: Product) => {
    setSelectedProduct(product);
    setViewModalOpen(true);
  };

  const handleDelete = (product: Product) => {
    modal.confirm({
      title: 'Delete Product',
      icon: <ExclamationCircleOutlined />,
      content: `Are you sure you want to delete "${product.title}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await adminApi.updateProduct(product.id, { isDeleted: true });
          message.success('Product deleted successfully');
          queryClient.invalidateQueries({ queryKey: ['products'] });
        } catch {
          message.error('Failed to delete product');
        }
      },
    });
  };

  const handleEditSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (selectedProduct) {
        updateMutation.mutate({ id: selectedProduct.id, data: values });
      }
    } catch {
      // Validation failed
    }
  };

  const toggleAvailability = async (product: Product) => {
    try {
      await adminApi.updateProduct(product.id, { isAvailable: !product.isAvailable });
      message.success(`Product ${product.isAvailable ? 'hidden' : 'made available'}`);
      queryClient.invalidateQueries({ queryKey: ['products'] });
    } catch {
      message.error('Failed to update product availability');
    }
  };

  // Handle promotion toggle
  const handleTogglePromotion = async (product: Product, isPromoted: boolean) => {
    try {
      await adminApi.toggleProductPromotion(product.id, isPromoted, isPromoted ? 30 : undefined);
      message.success(isPromoted ? 'Product added to Sponsored section!' : 'Product removed from Sponsored section');
      queryClient.invalidateQueries({ queryKey: ['products'] });
    } catch {
      message.error('Failed to update product promotion status');
    }
  };

  // Handle admin product toggle
  const handleToggleAdminProduct = async (product: Product, isAdminProduct: boolean) => {
    try {
      await adminApi.toggleAdminProduct(product.id, isAdminProduct);
      message.success(isAdminProduct ? 'Product added to Official Store!' : 'Product removed from Official Store');
      queryClient.invalidateQueries({ queryKey: ['products'] });
    } catch {
      message.error('Failed to update Official Store status');
    }
  };

  // Stats
  const totalProducts = data?.total || 0;
  const inStockProducts = products.filter(p => p.stock > 0).length;
  const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= 5).length;
  const outOfStockProducts = products.filter(p => p.stock === 0).length;
  const promotedProducts = products.filter(p => p.isPromoted).length;
  const officialProducts = products.filter(p => p.isAdminProduct).length;
  const hiddenProducts = products.filter(p => !p.isAvailable).length;

  const columns: ColumnsType<Product> = [
    {
      title: 'Image',
      dataIndex: 'images',
      key: 'images',
      width: 80,
      render: (images: string[]) => (
        <Image
          src={normalizeImageUrl(images?.[0])}
          alt="Product"
          width={50}
          height={50}
          style={{ objectFit: 'cover', borderRadius: 4 }}
          fallback="/placeholder-product.png"
          preview={false}
        />
      ),
    },
    {
      title: 'Name',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: Product) => (
        <div>
          <Text strong>{title}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.category}
          </Text>
        </div>
      ),
    },
    {
      title: 'Farmer',
      dataIndex: 'farmerName',
      key: 'farmer',
      render: (farmerName: string, record: Product) => (
        <Text>{farmerName || record.farmer?.businessName || `${record.farmer?.firstName || ''} ${record.farmer?.lastName || ''}`.trim() || 'N/A'}</Text>
      ),
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price: string | number, record: Product) => (
        <Text>₦{Number(price).toLocaleString()}/{record.unit}</Text>
      ),
    },
    {
      title: 'Stock',
      dataIndex: 'stock',
      key: 'stock',
      render: (stock: number, record: Product) => (
        <Tag color={stock > 10 ? 'green' : stock > 0 ? 'orange' : 'red'}>
          {stock} {record.unit}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isAvailable',
      key: 'isAvailable',
      render: (isAvailable: boolean, record: Product) => (
        <Tooltip title={isAvailable ? 'Click to hide' : 'Click to show'}>
          <Switch
            checked={isAvailable}
            onChange={() => toggleAvailability(record)}
            checkedChildren="Live"
            unCheckedChildren="Hidden"
          />
        </Tooltip>
      ),
    },
    {
      title: 'Promotion',
      key: 'promotion',
      width: 150,
      render: (_, record: Product) => (
        <Space orientation="vertical" size="small">
          <Tooltip title={record.isPromoted ? 'Remove from Sponsored' : 'Add to Sponsored'}>
            <Switch
              size="small"
              checked={record.isPromoted}
              onChange={(checked) => handleTogglePromotion(record, checked)}
              checkedChildren={<RocketOutlined />}
              unCheckedChildren={<RocketOutlined />}
              style={{ backgroundColor: record.isPromoted ? '#9333ea' : undefined }}
            />
          </Tooltip>
          <Tooltip title={record.isAdminProduct ? 'Remove from Official Store' : 'Add to Official Store'}>
            <Switch
              size="small"
              checked={record.isAdminProduct}
              onChange={(checked) => handleToggleAdminProduct(record, checked)}
              checkedChildren={<SafetyCertificateOutlined />}
              unCheckedChildren={<SafetyCertificateOutlined />}
              style={{ backgroundColor: record.isAdminProduct ? '#0891b2' : undefined }}
            />
          </Tooltip>
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Tooltip title="View">
            <Button type="text" icon={<EyeOutlined />} onClick={() => handleView(record)} />
          </Tooltip>
          <Tooltip title="Edit">
            <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          </Tooltip>
          <Tooltip title="Delete">
            <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Products Management</Title>
          <Text type="secondary">Manage your product inventory and listings</Text>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => setCreateModalOpen(true)}
        >
          Add Product
        </Button>
      </div>

      {/* Stats Row */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6} md={4}>
          <Card size="small">
            <Statistic 
              title="Total Products" 
              value={totalProducts} 
              prefix={<ShoppingOutlined />}
              styles={{ content: { color: '#1890ff' } }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} md={4}>
          <Card size="small">
            <Statistic 
              title="In Stock" 
              value={inStockProducts} 
              prefix={<InboxOutlined />}
              styles={{ content: { color: '#52c41a' } }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} md={4}>
          <Card size="small">
            <Statistic 
              title="Low Stock" 
              value={lowStockProducts} 
              prefix={<ExclamationCircleOutlined />}
              styles={{ content: { color: '#faad14' } }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} md={4}>
          <Card size="small">
            <Statistic 
              title="Out of Stock" 
              value={outOfStockProducts} 
              prefix={<InboxOutlined />}
              styles={{ content: { color: '#ff4d4f' } }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} md={4}>
          <Card size="small">
            <Statistic 
              title="Hidden" 
              value={hiddenProducts} 
              prefix={<EyeInvisibleOutlined />}
              styles={{ content: { color: '#8c8c8c' } }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} md={4}>
          <Card size="small">
            <Statistic 
              title="Sponsored" 
              value={promotedProducts} 
              prefix={<RocketOutlined />}
              styles={{ content: { color: '#9333ea' } }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} md={4}>
          <Card size="small">
            <Statistic 
              title="Official Store" 
              value={officialProducts} 
              prefix={<SafetyCertificateOutlined />}
              styles={{ content: { color: '#0891b2' } }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters and View Toggle */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <Input
              placeholder="Search products..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 250 }}
              allowClear
            />
            <Select
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={categoryOptions}
              style={{ width: 180 }}
            />
            <Select
              value={stateFilter}
              onChange={setStateFilter}
              options={stateOptions}
              style={{ width: 180 }}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              placeholder="Filter by State"
            />
          </div>
          <Segmented
            value={viewMode}
            onChange={(value) => setViewMode(value as 'grid' | 'list')}
            options={[
              { value: 'grid', icon: <AppstoreOutlined />, label: 'Grid' },
              { value: 'list', icon: <UnorderedListOutlined />, label: 'List' },
            ]}
          />
        </div>
      </Card>

      {/* Products Display */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 50 }}>
          <Spin size="large" />
        </div>
      ) : products.length === 0 ? (
        <Empty description="No products found" />
      ) : viewMode === 'grid' ? (
        <>
          <Row gutter={[16, 16]}>
            {products.map((product) => (
              <Col xs={24} sm={12} md={8} lg={6} key={product.id}>
                <ProductCard
                  product={product}
                  onEdit={() => handleEdit(product)}
                  onView={() => handleView(product)}
                  onDelete={() => handleDelete(product)}
                  onToggleAvailability={() => toggleAvailability(product)}
                />
              </Col>
            ))}
          </Row>
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <Text type="secondary">
              Showing {products.length} of {data?.total || 0} products
            </Text>
            {(data?.total || 0) > pageSize && (
              <div style={{ marginTop: 8 }}>
                <Button 
                  onClick={() => setCurrentPage(p => p - 1)} 
                  disabled={currentPage === 1}
                  style={{ marginRight: 8 }}
                >
                  Previous
                </Button>
                <Button 
                  onClick={() => setCurrentPage(p => p + 1)} 
                  disabled={currentPage * pageSize >= (data?.total || 0)}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </>
      ) : (
        <Table
          columns={columns}
          dataSource={products}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: data?.total || 0,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} products`,
          }}
          onChange={handleTableChange}
        />
      )}

      {/* Edit Modal */}
      <Modal
        title="Edit Product"
        open={editModalOpen}
        onOk={handleEditSubmit}
        onCancel={() => {
          setEditModalOpen(false);
          setSelectedProduct(null);
          setEditFileList([]);
        }}
        afterClose={() => form.resetFields()}
        afterOpenChange={(open) => {
          if (open && selectedProduct) {
            form.setFieldsValue({
              title: selectedProduct.title,
              description: selectedProduct.description,
              price: selectedProduct.price,
              stock: selectedProduct.stock,
              unit: selectedProduct.unit,
              category: selectedProduct.category,
              isAvailable: selectedProduct.isAvailable,
            });
          }
        }}
        confirmLoading={updateMutation.isPending}
        width={700}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            label="Product Images"
            extra="Upload up to 5 images. First image will be the main product image."
          >
            <Upload {...editUploadProps}>
              {editFileList.length >= 5 ? null : (
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>Upload</div>
                </div>
              )}
            </Upload>
          </Form.Item>

          <Form.Item
            name="title"
            label="Product Name"
            rules={[{ required: true, message: 'Please enter product name' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="price"
                label="Price (₦)"
                rules={[{ required: true, message: 'Please enter price' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="unit"
                label="Unit"
                rules={[{ required: true, message: 'Please enter unit' }]}
              >
                <Select options={[
                  { value: 'kg', label: 'Kilogram (kg)' },
                  { value: 'g', label: 'Gram (g)' },
                  { value: 'piece', label: 'Piece' },
                  { value: 'bunch', label: 'Bunch' },
                  { value: 'basket', label: 'Basket' },
                  { value: 'bag', label: 'Bag' },
                  { value: 'crate', label: 'Crate' },
                  { value: 'litre', label: 'Litre' },
                ]} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="stock"
                label="Stock Quantity"
                rules={[{ required: true, message: 'Please enter quantity' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="category"
                label="Category"
                rules={[{ required: true, message: 'Please select category' }]}
              >
                <Select options={categoryOptions.filter(c => c.value)} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="isAvailable" label="Available" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      {/* Create Product Modal */}
      <Modal
        title="Add New Product"
        open={createModalOpen}
        onOk={() => {
          createForm.validateFields().then((values) => {
            if (createFileList.length === 0) {
              antMessage.warning('Please upload at least one product image');
              return;
            }
            createMutation.mutate(values);
          });
        }}
        onCancel={() => {
          setCreateModalOpen(false);
          setCreateFileList([]);
        }}
        afterClose={() => createForm.resetFields()}
        confirmLoading={createMutation.isPending}
        width={700}
        okText="Create Product"
        destroyOnHidden
      >
        <Form form={createForm} layout="vertical" preserve={false}>
          <Form.Item
            name="farmerId"
            label="List Product Under"
            rules={[{ required: true, message: 'Please select who to list the product under' }]}
            extra="Select 'Admin Store' to list under your own account, or select a farmer"
          >
            <Select 
              placeholder="Select who to list product under"
              showSearch
              optionFilterProp="label"
              options={[
                {
                  value: 'admin',
                  label: '🏪 Admin Store (List as Admin)',
                },
                ...farmers.map((f: { id: string; name: string; businessName: string }) => ({
                  value: f.id,
                  label: `👨‍🌾 ${f.businessName} (${f.name})`,
                }))
              ]}
            />
          </Form.Item>

          <Form.Item
            label="Product Images"
            required
            extra="Upload up to 5 images. First image will be the main product image."
          >
            <Upload {...createUploadProps}>
              {createFileList.length >= 5 ? null : (
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>Upload</div>
                </div>
              )}
            </Upload>
          </Form.Item>

          <Form.Item
            name="title"
            label="Product Name"
            rules={[{ required: true, message: 'Please enter product name' }]}
          >
            <Input placeholder="e.g., Fresh Organic Tomatoes" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Describe the product..." />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="price"
                label="Price (₦)"
                rules={[{ required: true, message: 'Please enter price' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="unit"
                label="Unit"
                initialValue="kg"
              >
                <Select options={[
                  { value: 'kg', label: 'Kilogram (kg)' },
                  { value: 'g', label: 'Gram (g)' },
                  { value: 'piece', label: 'Piece' },
                  { value: 'bunch', label: 'Bunch' },
                  { value: 'basket', label: 'Basket' },
                  { value: 'bag', label: 'Bag' },
                  { value: 'crate', label: 'Crate' },
                  { value: 'litre', label: 'Litre' },
                ]} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="stock"
                label="Stock Quantity"
                rules={[{ required: true, message: 'Please enter quantity' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="category"
                label="Category"
                rules={[{ required: true, message: 'Please select category' }]}
              >
                <Select 
                  placeholder="Select category"
                  options={categoryOptions.filter(c => c.value)} 
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Image Preview Modal */}
      <Modal
        open={previewOpen}
        title="Image Preview"
        footer={null}
        onCancel={() => setPreviewOpen(false)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="preview" style={{ width: '100%' }} src={previewImage} />
      </Modal>

      {/* View Modal - Buyer Preview Style */}
      <Modal
        title={null}
        open={viewModalOpen}
        onCancel={() => {
          setViewModalOpen(false);
          setSelectedProduct(null);
        }}
        footer={[
          <Button key="close" onClick={() => setViewModalOpen(false)}>
            Close
          </Button>,
          <Button key="edit" type="primary" onClick={() => {
            setViewModalOpen(false);
            if (selectedProduct) handleEdit(selectedProduct);
          }}>
            Edit Product
          </Button>,
        ]}
        width={700}
      >
        {selectedProduct && (
          <div>
            {/* Image Gallery */}
            <div style={{ marginBottom: 20 }}>
              <Image.PreviewGroup>
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
                  {selectedProduct.images?.length > 0 ? (
                    selectedProduct.images.map((img, index) => (
                      <Image
                        key={index}
                        src={normalizeImageUrl(img)}
                        alt={`${selectedProduct.title} ${index + 1}`}
                        width={150}
                        height={150}
                        style={{ objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
                      />
                    ))
                  ) : (
                    <div style={{
                      width: '100%',
                      height: 200,
                      background: '#f5f5f5',
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Text type="secondary">No images</Text>
                    </div>
                  )}
                </div>
              </Image.PreviewGroup>
            </div>

            {/* Product Info - Buyer View Style */}
            <div style={{ padding: '0 8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <Tag color={selectedProduct.isAvailable ? 'green' : 'red'}>
                    {selectedProduct.isAvailable ? 'Available' : 'Hidden'}
                  </Tag>
                  <Tag>{selectedProduct.category}</Tag>
                </div>
                <Tag color={selectedProduct.stock > 10 ? 'green' : selectedProduct.stock > 0 ? 'orange' : 'red'}>
                  {selectedProduct.stock} {selectedProduct.unit} in stock
                </Tag>
              </div>

              <Title level={3} style={{ marginBottom: 8, marginTop: 16 }}>
                {selectedProduct.title}
              </Title>

              <div style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#16a34a' }}>
                  ₦{Number(selectedProduct.price).toLocaleString()}
                </Text>
                <Text type="secondary" style={{ fontSize: 16, marginLeft: 4 }}>
                  per {selectedProduct.unit}
                </Text>
              </div>

              <Paragraph type="secondary" style={{ fontSize: 14, marginBottom: 20 }}>
                {selectedProduct.description || 'No description provided'}
              </Paragraph>

              <Card size="small" style={{ background: '#fafafa' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: '#16a34a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                  }}>
                    {selectedProduct.farmerName?.[0] || selectedProduct.farmer?.firstName?.[0] || 'F'}
                  </div>
                  <div>
                    <Text strong>
                      {selectedProduct.farmerName || selectedProduct.farmer?.businessName || `${selectedProduct.farmer?.firstName || ''} ${selectedProduct.farmer?.lastName || ''}`}
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Farmer / Seller
                    </Text>
                  </div>
                </div>
              </Card>

              <div style={{ marginTop: 16, padding: 12, background: '#f0f9ff', borderRadius: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  <strong>Admin Info:</strong> Created {new Date(selectedProduct.createdAt).toLocaleDateString()} • 
                  Last updated {new Date(selectedProduct.updatedAt).toLocaleDateString()}
                </Text>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
