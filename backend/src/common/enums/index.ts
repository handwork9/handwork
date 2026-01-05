export enum UserRole {
  BUYER = 'buyer',
  FARMER = 'farmer',
  RIDER = 'rider',
  ADMIN = 'admin',
  SUPERADMIN = 'superadmin',
  OPERATIONS = 'operations',
  FINANCE = 'finance',
  SUPPORT = 'support',
}

export enum OrderStatus {
  PENDING = 'pending',
  CREATED = 'created',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  READY_FOR_PICKUP = 'ready_for_pickup',
  RIDER_ASSIGNED = 'rider_assigned',
  ASSIGNED = 'assigned',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentStatus {
  PENDING = 'pending',
  AUTHORIZED = 'authorized',
  COMPLETED = 'completed',
  CAPTURED = 'captured',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

export enum PaymentMethod {
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer',
  WALLET = 'wallet',
  CASH = 'cash',
}

export enum RiderStatus {
  AVAILABLE = 'available',
  BUSY = 'busy',
  OFFLINE = 'offline',
  SUSPENDED = 'suspended',
}

export enum DispatchStatus {
  PENDING = 'pending',
  SEARCHING = 'searching',
  OFFERED = 'offered',
  MATCHED = 'matched',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  FAILED = 'failed',
  NO_RIDERS = 'no_riders',
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
}

export enum NotificationType {
  PUSH = 'push',
  SMS = 'sms',
  EMAIL = 'email',
  IN_APP = 'in_app',
}

export enum ProductCategory {
  VEGETABLES = 'vegetables',
  FRUITS = 'fruits',
  GRAINS = 'grains',
  DAIRY = 'dairy',
  EGGS = 'eggs',
  MEAT = 'meat',
  POULTRY = 'poultry',
  SEAFOOD = 'seafood',
  HERBS_SPICES = 'herbs_spices',
  HONEY = 'honey',
  NUTS = 'nuts',
  TUBERS = 'tubers',
  OILS = 'oils',
  LEGUMES = 'legumes',
  PROCESSED = 'processed',
  LIVESTOCK = 'livestock',
  SEEDS = 'seeds',
  BEVERAGES = 'beverages',
  OTHERS = 'others',
}

export enum VehicleType {
  BICYCLE = 'bicycle',
  MOTORCYCLE = 'motorcycle',
  CAR = 'car',
  VAN = 'van',
}

export enum RiderApplicationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum FarmerApplicationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum ProductApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}
