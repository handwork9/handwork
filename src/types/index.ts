// User & Auth Types
export type UserRole = 'buyer' | 'farmer' | 'rider' | 'guest';

export type PremiumTier = 'none' | 'basic' | 'gold' | 'platinum';

export interface User {
  id: string;
  name: string;
  email?: string;
  phone: string;
  role: UserRole;
  state?: string;
  city?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  rating?: number;
  deviceTokens?: string[];
  avatar?: string;
  walletBalance?: string;
  isActive?: boolean;
  isPhoneVerified?: boolean;
  isEmailVerified?: boolean;
  // Premium membership fields (buyer)
  isPremium?: boolean;
  premiumTier?: PremiumTier;
  premiumExpiry?: string;
  totalSpent?: number;
  totalOrders?: number;
  // Farmer activation fields
  isActivated?: boolean;
  activationPaidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email?: string;
  phone?: string;
  password: string;
}

export interface SignupData {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  state: string;
  city: string;
  address: string;
}

// Product Types
export interface Location {
  lat: number;
  lng: number;
  state: string;
  city?: string;
  address?: string;
}

export interface Product {
  id: string;
  farmerId: string;
  farmerName?: string;
  farmerPhone?: string;
  farmerAvatar?: string;
  farmerRating?: number;
  farmerLocation?: string;
  isVerifiedSeller?: boolean; // True if farmer has active subscription
  name?: string;
  title: string;
  description: string;
  price: number;
  unit: string; // 'kg', 'liter', 'piece', etc.
  stock: number;
  images?: string[] | null;
  category: ProductCategory;
  subcategory?: string;
  pickupLocation?: Location;
  // Backend returns these directly
  pickupLat?: number;
  pickupLng?: number;
  pickupState?: string;
  pickupCity?: string;
  pickupAddress?: string;
  rating?: number;
  reviewCount?: number;
  isAvailable: boolean;
  isOrganic?: boolean;
  isFeatured?: boolean;
  isPromoted?: boolean;
  isAdminProduct?: boolean;
  isSponsored?: boolean;
  sponsorTier?: 'verified' | 'premium';
  promotionExpiresAt?: string;
  recommendationScore?: number;
  harvestDate?: string;
  expiryDate?: string;
  certifications?: string[];
  minOrderQuantity?: number;
  bulkDiscountQuantity?: number;
  bulkDiscountPercent?: number;
  salesCount?: number;
  createdAt: string;
  updatedAt: string;
}

// Farmer data structure for API responses
export interface Farmer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
  bio?: string;
  location: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  rating: number;
  reviewCount: number;
  totalProducts: number;
  totalSales: number;
  joinedDate: string;
  isVerified: boolean;
  specialties?: string[];
  businessHours?: {
    open: string;
    close: string;
    days: string[];
  };
}

export type ProductCategory = 
  | 'vegetables'
  | 'fruits'
  | 'grains'
  | 'dairy'
  | 'eggs'
  | 'meat'
  | 'poultry'
  | 'seafood'
  | 'herbs_spices'
  | 'honey'
  | 'nuts'
  | 'tubers'
  | 'oils'
  | 'legumes'
  | 'processed'
  | 'livestock'
  | 'seeds'
  | 'beverages'
  | 'others';

export interface ProductFilters {
  category?: string;
  subcategory?: string;
  minPrice?: number;
  maxPrice?: number;
  state?: string;
  searchQuery?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  filter?: 'popular' | 'organic' | 'deals' | 'top_rated' | 'new';
  verifiedOnly?: boolean;
}

// Cart & Order Types
export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
  subtotal: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
  itemCount: number;
}

export type OrderStatus = 
  | 'pending'
  | 'created'  // Order created, payment processing
  | 'confirmed'
  | 'preparing'
  | 'ready_for_pickup'
  | 'rider_assigned' 
  | 'picked_up' 
  | 'in_transit' 
  | 'delivered' 
  | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export type DeliveryType = 'ASAP' | 'SCHEDULED';

export interface DeliveryAddress {
  address: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  instructions?: string;
  // Legacy fields for backwards compatibility
  id?: string;
  userId?: string;
  label?: string;
  addressLine1?: string;
  addressLine2?: string;
  postalCode?: string;
  location?: {
    lat: number;
    lng: number;
  };
  isDefault?: boolean;
}

export interface PickupPoint {
  address: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
}

export interface OrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  unit: string;
  subtotal: number;
  farmerId?: string;
  farmerName?: string;
  // Legacy fields for backwards compatibility
  productName?: string;
  productImage?: string;
  pricePerUnit?: number;
}

export interface AssignedRider {
  id: string;
  userId: string;
  vehicleType?: string;
  vehiclePlate?: string;
  vehicleModel?: string;
  isVerified?: boolean;
  isOnline?: boolean;
  isAvailable?: boolean;
  rating?: number;
  totalDeliveries?: number;
  currentLat?: number;
  currentLng?: number;
  user?: {
    id: string;
    name: string;
    phone: string;
    avatar?: string;
  };
}

export interface Order {
  id: string;
  orderNumber?: string;
  buyerId: string;
  buyerName?: string;
  buyerPhone?: string;
  farmerId?: string;
  farmerName?: string;
  items: OrderItem[];
  itemCount?: number;
  subtotal: number;
  deliveryFee: number;
  serviceFee?: number;
  discount?: number;
  riderEarnings?: number;
  platformFee?: number;
  total: number;
  status: OrderStatus;
  paymentStatus?: PaymentStatus;
  paymentMethod?: string;
  paymentMethodId?: string;
  deliveryAddress: DeliveryAddress;
  pickupPoint?: PickupPoint;
  deliveryType?: DeliveryType;
  isExpress?: boolean;
  scheduledAt?: string;
  assignedRiderId?: string;
  assignedRider?: AssignedRider;
  assignedRiderName?: string;
  assignedRiderPhone?: string;
  pickupLocation?: Location;
  eta?: number; // minutes
  distanceKm?: number;
  distanceMeters?: number;
  createdAt: string;
  updatedAt: string;
  riderAcceptedAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
}

export interface DeliveryAddressData {
  address: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  instructions?: string;
}

export interface OrderItemData {
  productId: string;
  quantity: number;
}

export interface GiftDetails {
  recipientName: string;
  recipientPhone: string;
  message?: string;
}

export interface CreateOrderData {
  deliveryAddress: DeliveryAddressData;
  discountCode?: string;
  notes?: string;
  riderNote?: string;
  farmerMessage?: string;
  paymentMethod?: 'card' | 'wallet';
  paymentReference?: string;
  deliveryType?: DeliveryType;
  scheduledDeliveryTime?: string;
  items?: OrderItemData[];
  isGift?: boolean;
  giftDetails?: GiftDetails;
}

// Rider Types
export interface RiderLocation {
  lat: number;
  lng: number;
  updatedAt: string;
}

export interface VehicleDetails {
  type: 'bike' | 'scooter' | 'car' | 'van';
  make?: string;
  model?: string;
  licensePlate: string;
  color?: string;
}

export interface Rider {
  id: string;
  userId: string;
  name: string;
  phone: string;
  currentLocation?: RiderLocation;
  state: string;
  city: string;
  available: boolean;
  vehicleDetails: VehicleDetails;
  rating?: number;
  completedDeliveries?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryAssignment {
  id: string;
  orderId: string;
  riderId: string;
  order: Order;
  rider: Rider;
  eta: number; // minutes
  distanceMeters: number;
  status: 'pending' | 'accepted' | 'rejected' | 'in_progress' | 'completed';
  acceptedAt?: string;
  rejectedAt?: string;
  completedAt?: string;
}

export interface DeliveryConfirmation {
  orderId: string;
  status: OrderStatus;
  location: {
    lat: number;
    lng: number;
  };
  photoUrl?: string;
  signature?: string;
  notes?: string;
  timestamp: string;
}

// Notification Types
export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  type: 'order' | 'delivery' | 'promotion' | 'system';
  read: boolean;
  createdAt: string;
}

// WebSocket Event Types
export interface SocketEvent {
  type: 
    | 'order:created'
    | 'order:confirmed'
    | 'order:rider_assigned'
    | 'order:picked_up'
    | 'order:in_transit'
    | 'order:delivered'
    | 'order:cancelled'
    | 'rider:location_update'
    | 'eta:update';
  orderId: string;
  data: any;
  timestamp: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Navigation Types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Onboarding: undefined;
  Welcome: undefined;
  Maintenance: undefined;
  WhatYouMissed: undefined;
  Login: undefined;
  Signup: undefined;
  PhoneLogin: undefined;
  OTPVerification: { phone: string; mode?: 'verify' | 'login' };
  ForgotPassword: undefined;
  TwoFactorVerification: { tempToken: string };
  LiveChat: undefined;  // Live support chat available from auth screens
  // Multi-step signup screens
  SignupRole: undefined;
  SignupEmail: { role: UserRole };
  SignupPhone: { role: UserRole; email: string };
  SignupPassword: { role: UserRole; email: string; phone: string };
  SignupPersonalInfo: { role: UserRole; email: string; phone: string; password: string };
  SignupNationality: { role: UserRole; email: string; phone: string; password: string; firstName: string; lastName: string };
  SignupAddress: { role: UserRole; email: string; phone: string; password: string; firstName: string; lastName: string; nationality: string; nationalityCode: string };
  SignupAgreement: { role: UserRole; email: string; phone: string; password: string; firstName: string; lastName: string; nationality: string; nationalityCode: string; state: string; city: string; address: string; latitude?: number; longitude?: number };
  // Rider-specific screens
  SignupBikeDetails: { role: UserRole; email: string; phone: string; password: string; firstName: string; lastName: string; nationality: string; nationalityCode: string; state: string; city: string; address: string; latitude?: number; longitude?: number; referralCode?: string; marketingConsent?: boolean };
  SignupGuarantors: { role: UserRole; email: string; phone: string; password: string; firstName: string; lastName: string; nationality: string; nationalityCode: string; state: string; city: string; address: string; latitude?: number; longitude?: number; bikeModel: string; plateNumber: string; bikeColor: string; driversLicense: string | null; referralCode?: string; marketingConsent?: boolean };
  // Farmer-specific screens
  SignupFarmDetails: { role: UserRole; email: string; phone: string; password: string; firstName: string; lastName: string; nationality: string; nationalityCode: string; state: string; city: string; address: string; latitude?: number; longitude?: number; referralCode?: string; marketingConsent?: boolean };
  SignupFarmVerification: { role: UserRole; email: string; phone: string; password: string; firstName: string; lastName: string; nationality: string; nationalityCode: string; state: string; city: string; address: string; latitude?: number; longitude?: number; farmName: string; farmType: string; farmSize: string; productCategories: string[]; bankName: string; bankCode: string; accountNumber: string; accountName: string; referralCode?: string; marketingConsent?: boolean };
  // Buyer-specific screens (optional)
  SignupPayment: { role: UserRole; email: string; phone: string; password: string; firstName: string; lastName: string; nationality: string; nationalityCode: string; state: string; city: string; address: string; latitude?: number; longitude?: number; referralCode?: string; marketingConsent?: boolean };
};

export type BuyerTabParamList = {
  Home: undefined;
  Messages: undefined;
  Orders: undefined;
  Profile: undefined;
};

export type BuyerStackParamList = {
  BuyerTabs: undefined;
  ProductDetail: { productId: string };
  FarmerProfile: { farmerId: string };
  Cart: undefined;
  Checkout: undefined;
  OrderTracking: { orderId: string };
  OrderDispute: { orderId: string; disputeId?: string };
  MyDisputes: undefined;
  WriteReview: { orderId: string; type: 'farmer' | 'rider'; recipientName?: string; recipientAvatar?: string };
  OrderConfirmation: { orderId: string; orderNumber: string; total: number; itemCount: number; paymentMethod: 'wallet' | 'card' | 'payForMe'; estimatedDelivery?: string };
  OrderCompleted: { orderId: string; orderNumber: string; total: number; farmerName?: string };
  Notifications: undefined;
  NotificationDetail: { notification: any };
  NotificationSettings: undefined;
  Appearance: undefined;
  EditProfile: undefined;
  PaymentMethods: undefined;
  DeliveryAddresses: undefined;
  Support: undefined;
  Wallet: undefined;
  TopUp: undefined;
  Transfer: undefined;
  Rewards: undefined;
  RewardHistory: undefined;
  RewardDetail: { reward: any };
  RewardTransactionDetail: { transaction: any };
  HowToEarn: undefined;
  BecomeFarmerInfo: undefined;
  FarmerOnboarding: undefined;
  Favorites: undefined;
  Invite: undefined;
  InviteHistory: undefined;
  InviteDetail: { invite: any };
  MyAddress: undefined;
  Security: undefined;
  TwoFactorSetup: { mode: 'enable' | 'disable' };
  ChangePassword: undefined;
  ChangePin: undefined;
  SetPin: { returnToSecurity?: boolean };
  ResetPin: undefined;
  LoginActivity: undefined;
  ActiveSessions: undefined;
  Language: undefined;
  HelpTranslate: undefined;
  HelpCenter: undefined;
  ContactUs: undefined;
  RateApp: undefined;
  TermsPrivacy: undefined;
  LiveChat: undefined;
  MyReports: undefined;
  PayBill: undefined;
  PaymentHistory: { payments: any[] };
  PaymentDetail: { payment: any };
  TransactionHistory: { transactions: any[] };
  TransactionDetail: { transaction: any };
  SubscriptionBox: undefined;
  GroupBuying: undefined;
  GroupBuyDetail: { groupBuyId: string };
  CreateGroupBuy: undefined;
  ShoppingLists: undefined;
  Coupons: undefined;
  Withdraw: { bankAccountId?: string } | undefined;
  WithdrawalHistory: undefined;
  BankAccounts: undefined;
  FarmerChat: {
    farmerId: string;
    farmerName?: string;
    farmerPhone?: string;
    farmerAvatar?: string;
    productId?: string;
  };
  RiderChat: {
    riderId?: string;
    riderName?: string;
    riderPhone?: string;
    riderRating?: number;
    vehicleType?: string;
    isOnline?: boolean;
    orderId?: string;
  };
  GoPremium: undefined;
  GoPremiumLearnMore: undefined;
  VerifiedSellersLearnMore: undefined;
  NearbyFarmersMap: undefined;
  Categories: undefined;
  Search: { category?: string; subcategory?: string; verifiedOnly?: boolean } | undefined;
  DeleteAccount: undefined;
  VideoCall: { 
    userId?: string; 
    userName?: string; 
    userAvatar?: string;
    callType?: 'video' | 'audio'; 
    isIncoming?: boolean;
  };
  // Social Features
  SocialFeed: undefined;
  Stories: { initialFarmerIndex?: number };
  LiveStreams: undefined;
};

export type FarmerTabParamList = {
  Dashboard: undefined;
  Products: undefined;
  Orders: undefined;
  Profile: undefined;
};

export type FarmerStackParamList = {
  FarmerTabs: undefined;
  FarmerActivation: undefined;
  Products: undefined;
  AddProduct: undefined;
  EditProduct: { productId: string };
  FarmerOrderDetail: { orderId: string };
  FarmerOrders: undefined;
  Analytics: undefined;
  TopProducts: undefined;
  ProductAnalyticsDetail: { product: any };
  AddDiscount: { product: any };
  PromoteProduct: { product: any };
  FarmerMessages: undefined;
  BuyerChat: { buyerId: string; buyerName: string; buyerPhone?: string; buyerAvatar?: string; productId?: string; orderId?: string };
  Settings: undefined;
  Wallet: undefined;
  TopUp: undefined;
  Transfer: undefined;
  GoPremium: undefined;
  FarmerSubscription: undefined;
  Rewards: undefined;
  RewardHistory: undefined;
  RewardDetail: { reward: any };
  RewardTransactionDetail: { transaction: any };
  HowToEarn: undefined;
  Favorites: undefined;
  Invite: undefined;
  InviteHistory: undefined;
  InviteDetail: { invite: any };
  EditProfile: undefined;
  MyAddress: undefined;
  PaymentMethods: undefined;
  Security: undefined;
  TwoFactorSetup: { mode: 'enable' | 'disable' };
  ChangePassword: undefined;
  ChangePin: undefined;
  SetPin: { returnToSecurity?: boolean };
  ResetPin: undefined;
  LoginActivity: undefined;
  ActiveSessions: undefined;
  Language: undefined;
  HelpTranslate: undefined;
  HelpCenter: undefined;
  ContactUs: undefined;
  RateApp: undefined;
  TermsPrivacy: undefined;
  Notifications: undefined;
  NotificationDetail: { notification: any };
  LiveChat: undefined;
  MyReports: undefined;
  PayBill: undefined;
  PaymentHistory: { payments: any[] };
  PaymentDetail: { payment: any };
  TransactionHistory: { transactions: any[] };
  TransactionDetail: { transaction: any };
  BankAccounts: undefined;
  Withdraw: { bankAccountId?: string };
  WithdrawalHistory: undefined;
  NotificationSettings: undefined;
  Appearance: undefined;
  DeleteAccount: undefined;
  VideoCall: { 
    userId?: string; 
    userName?: string; 
    userAvatar?: string;
    callType?: 'video' | 'audio'; 
    isIncoming?: boolean;
  };
  // Social Features
  SocialFeed: undefined;
  CreatePost: undefined;
  Stories: { initialFarmerIndex?: number };
  LiveStreams: undefined;
  GoLive: undefined;
};

export type RiderTabParamList = {
  AvailableJobs: undefined;
  ActiveDelivery: undefined;
  Earnings: undefined;
  Profile: undefined;
};

export type RiderStackParamList = {
  RiderTabs: { screen?: keyof RiderTabParamList } | undefined;
  AvailableJobs: undefined;
  ActiveDelivery: undefined;
  Earnings: undefined;
  DeliveryConfirmation: { deliveryId: string; earnings: number };
  DeliveryReceipt: { deliveryId: string; amount?: number; date?: string };
  DeliveryChat: { contactId: string; contactName: string; contactPhone: string; contactRole: 'buyer' | 'farmer'; orderId: string };
  Settings: undefined;
  Wallet: undefined;
  TopUp: undefined;
  Transfer: undefined;
  GoPremium: undefined;
  RiderSubscription: undefined;
  Rewards: undefined;
  RewardHistory: undefined;
  RewardDetail: { reward: any };
  RewardTransactionDetail: { transaction: any };
  HowToEarn: undefined;
  Favorites: undefined;
  Invite: undefined;
  InviteHistory: undefined;
  InviteDetail: { invite: any };
  EditProfile: undefined;
  MyAddress: undefined;
  PaymentMethods: undefined;
  Security: undefined;
  TwoFactorSetup: { mode: 'enable' | 'disable' };
  ChangePassword: undefined;
  ChangePin: undefined;
  SetPin: { returnToSecurity?: boolean };
  ResetPin: undefined;
  LoginActivity: undefined;
  ActiveSessions: undefined;
  Language: undefined;
  HelpTranslate: undefined;
  HelpCenter: undefined;
  ContactUs: undefined;
  RateApp: undefined;
  TermsPrivacy: undefined;
  Notifications: undefined;
  NotificationDetail: { notification: any };
  LiveChat: undefined;
  MyReports: undefined;
  PayBill: undefined;
  PaymentHistory: { payments: any[] };
  PaymentDetail: { payment: any };
  TransactionHistory: { transactions: any[] };
  TransactionDetail: { transaction: any };
  BankAccounts: undefined;
  Withdraw: { bankAccountId?: string };
  WithdrawalHistory: undefined;
  NotificationSettings: undefined;
  Appearance: undefined;
  DeleteAccount: undefined;
  VideoCall: { 
    userId?: string; 
    userName?: string; 
    userAvatar?: string;
    callType?: 'video' | 'audio'; 
    isIncoming?: boolean;
  };
};

// Bank Account & Withdrawal Types
export interface BankAccount {
  id: string;
  userId: string;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  isDefault: boolean;
  isVerified: boolean;
  createdAt: string;
}

export type WithdrawalStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface WithdrawalTransaction {
  id: string;
  userId: string;
  amount: number;
  fee: number;
  netAmount: number;
  status: WithdrawalStatus;
  bankAccount: BankAccount;
  reference: string;
  failureReason?: string;
  createdAt: string;
  processedAt?: string;
  completedAt?: string;
}

export interface WalletBalance {
  available: number;
  pending: number;
  total: number;
  currency: string;
}

// Promotion Types
export enum PromotionPlanId {
  BASIC = 'basic',
  STANDARD = 'standard',
  PREMIUM = 'premium',
}

export enum PromotionBoostType {
  HOMEPAGE = 'homepage_feature',
  CATEGORY = 'category_top',
  SEARCH = 'search_priority',
  BADGE = 'promoted_badge',
}

export enum TargetAudienceType {
  ALL = 'all_buyers',
  PREMIUM = 'premium_buyers',
  LOCAL = 'local_buyers',
  REPEAT = 'repeat_customers',
}

export enum PromotionStatus {
  PENDING_PAYMENT = 'pending_payment',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export interface PromotionPlan {
  id: PromotionPlanId;
  name: string;
  basePrice: number;
  duration: string;
  durationDays: number;
  features: string[];
  maxBoosts: number;
}

export interface Promotion {
  id: string;
  productId: string;
  farmerId: string;
  planId: PromotionPlanId;
  durationDays: number;
  boosts: PromotionBoostType[];
  targetAudience: TargetAudienceType;
  totalCost: number;
  status: PromotionStatus;
  startDate: string | null;
  endDate: string | null;
  views: number;
  clicks: number;
  conversions: number;
  createdAt: string;
}

export interface PromotionStats {
  totalPromotions: number;
  activePromotions: number;
  totalSpent: number;
  totalViews: number;
  totalClicks: number;
  totalConversions: number;
  averageConversionRate: number;
}
