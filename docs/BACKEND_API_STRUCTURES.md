# Backend API Data Structures

This document outlines the data structures required from the backend API for proper app functionality.

---

## 1. Product API Response

When fetching a product, include farmer contact information:

```typescript
interface Product {
  id: string;
  farmerId: string;
  farmerName: string;
  farmerPhone?: string;        // NEW: Farmer's phone number
  farmerAvatar?: string;       // NEW: Farmer's profile image URL
  farmerRating?: number;       // NEW: Farmer's average rating
  farmerLocation?: string;     // NEW: Farmer's location/address
  
  name: string;
  title: string;
  description: string;
  price: number;
  unit: string;                // 'kg', 'liter', 'piece', etc.
  stock: number;
  images: string[];
  category: ProductCategory;
  pickupLocation: Location;
  rating?: number;
  reviewCount?: number;
  isAvailable: boolean;
  createdAt: string;           // ISO date string
  updatedAt: string;           // ISO date string
}
```

### Example API Response:
```json
GET /api/products/:id

{
  "id": "prod_123",
  "farmerId": "farmer_456",
  "farmerName": "John Adebayo",
  "farmerPhone": "+2348012345678",
  "farmerAvatar": "https://example.com/avatars/farmer_456.jpg",
  "farmerRating": 4.8,
  "farmerLocation": "Lagos, Nigeria",
  "name": "Fresh Tomatoes",
  "title": "Organic Fresh Roma Tomatoes",
  "description": "Freshly harvested organic tomatoes...",
  "price": 2500,
  "unit": "kg",
  "stock": 150,
  "images": ["https://example.com/products/tomato1.jpg"],
  "category": "vegetables",
  "pickupLocation": {
    "address": "123 Farm Road, Lagos",
    "latitude": 6.5244,
    "longitude": 3.3792
  },
  "rating": 4.5,
  "reviewCount": 128,
  "isAvailable": true,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-12-10T14:20:00Z"
}
```

---

## 2. Farmer API Response

When fetching a farmer's profile:

```typescript
interface Farmer {
  id: string;
  name: string;
  phone: string;               // REQUIRED: For call functionality
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
  joinedDate: string;          // ISO date string
  isVerified: boolean;
  specialties?: string[];      // e.g., ['Tomatoes', 'Peppers']
  businessHours?: {
    open: string;              // e.g., '08:00'
    close: string;             // e.g., '18:00'
    days: string[];            // e.g., ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
  };
}
```

### Example API Response:
```json
GET /api/farmers/:id

{
  "success": true,
  "data": {
    "id": "farmer_456",
    "name": "John Adebayo",
    "phone": "+2348012345678",
    "email": "john@farmfresh.ng",
    "avatar": "https://example.com/avatars/farmer_456.jpg",
    "bio": "Third-generation farmer specializing in organic vegetables.",
    "location": "Lagos, Nigeria",
    "coordinates": {
      "latitude": 6.5244,
      "longitude": 3.3792
    },
    "rating": 4.8,
    "reviewCount": 256,
    "totalProducts": 15,
    "totalSales": 1250,
    "joinedDate": "2023-03-15T00:00:00Z",
    "isVerified": true,
    "specialties": ["Tomatoes", "Peppers", "Onions", "Leafy Greens"],
    "businessHours": {
      "open": "07:00",
      "close": "18:00",
      "days": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    }
  }
}
```

---

## 3. Discount API Request

When creating a discount:

```typescript
interface CreateDiscountRequest {
  productId: string;
  productName: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  originalPrice: number;
  discountedPrice: number;
  savings: number;
  minQuantity: number;
  isLimitedTime: boolean;
  startDate: string | null;    // ISO date string
  endDate: string | null;      // ISO date string
  usePromoCode: boolean;
  promoCode: string | null;
  createdAt: string;           // ISO date string
  status: 'active' | 'inactive' | 'expired';
}
```

### Example API Request:
```json
POST /api/discounts

{
  "productId": "prod_123",
  "productName": "Fresh Tomatoes",
  "discountType": "percentage",
  "discountValue": 15,
  "originalPrice": 2500,
  "discountedPrice": 2125,
  "savings": 375,
  "minQuantity": 2,
  "isLimitedTime": true,
  "startDate": "2024-12-11T00:00:00Z",
  "endDate": "2024-12-25T23:59:59Z",
  "usePromoCode": true,
  "promoCode": "HOLIDAY15",
  "createdAt": "2024-12-11T10:30:00Z",
  "status": "active"
}
```

---

## 4. Promotion API Request

When creating a promotion:

```typescript
interface CreatePromotionRequest {
  productId: string;
  productName: string;
  productImage: string;
  
  // Plan details
  planId: string | null;
  planName: string;
  planDuration: string;
  planReach: string;
  planFeatures: string[];
  
  // Budget
  useCustomBudget: boolean;
  customBudget: number | null;
  planPrice: number;
  
  // Boost add-ons
  selectedBoosts: string[];
  boostDetails: Array<{
    id: string;
    name: string;
    price: number;
  }>;
  
  // Targeting
  targetAudience: 'all' | 'local' | 'subscribers';
  
  // Total cost
  totalCost: number;
  
  // Dates
  startDate: string;           // ISO date string
  endDate: string | null;      // ISO date string
  
  // Metadata
  createdAt: string;           // ISO date string
  status: 'pending_payment' | 'active' | 'completed' | 'cancelled';
}
```

### Example API Request:
```json
POST /api/promotions

{
  "productId": "prod_123",
  "productName": "Fresh Tomatoes",
  "productImage": "🍅",
  "planId": "standard",
  "planName": "Standard",
  "planDuration": "7 days",
  "planReach": "~2,000 views",
  "planFeatures": ["Featured in category", "Badge on listing", "Homepage spotlight", "Push notifications"],
  "useCustomBudget": false,
  "customBudget": null,
  "planPrice": 2500,
  "selectedBoosts": ["search", "notification"],
  "boostDetails": [
    { "id": "search", "name": "Search Boost", "price": 500 },
    { "id": "notification", "name": "Push Notification", "price": 1000 }
  ],
  "targetAudience": "all",
  "totalCost": 4000,
  "startDate": "2024-12-11T10:30:00Z",
  "endDate": "2024-12-18T10:30:00Z",
  "createdAt": "2024-12-11T10:30:00Z",
  "status": "pending_payment"
}
```

---

## 5. Order API Response (for tracking)

When fetching order details for tracking:

```typescript
interface Order {
  id: string;
  buyerId: string;
  farmerId: string;
  farmerName: string;
  farmerPhone: string;         // For contacting farmer about order
  
  // Rider info (if assigned)
  assignedRiderId?: string;
  assignedRiderName?: string;
  assignedRiderPhone?: string; // For contacting rider
  
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  
  deliveryAddress: Location;
  estimatedDelivery?: string;  // ISO date string
  actualDelivery?: string;     // ISO date string
  
  createdAt: string;
  updatedAt: string;
}
```

---

## Phone Number Format

All phone numbers should be stored and returned in **international format** with country code:

- ✅ Correct: `+2348012345678`
- ❌ Incorrect: `08012345678`

This ensures the `tel:` URL scheme works correctly on all devices.

---

## Required Backend Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products/:id` | Get product with farmer details |
| GET | `/api/farmers/:id` | Get farmer profile with phone |
| GET | `/api/farmers/:id/products` | Get farmer's products |
| POST | `/api/discounts` | Create a discount |
| GET | `/api/discounts/:productId` | Get active discounts for product |
| POST | `/api/promotions` | Create a promotion |
| GET | `/api/promotions/:productId` | Get active promotions |
| GET | `/api/orders/:id` | Get order with contact details |

---

## Privacy Considerations

- **Phone numbers** should only be exposed to authenticated users who have a legitimate need (e.g., buyers who placed an order, active chat participants)
- Consider implementing a **callback request** feature instead of exposing phone numbers directly
- Add **rate limiting** on contact actions to prevent spam
