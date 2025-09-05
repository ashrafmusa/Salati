

export interface User {
  uid: string;
  phone: string | null;
  name: string;
  address?: string;
  role: 'customer' | 'sub-admin' | 'admin' | 'super-admin' | 'driver';
  email?: string | null;
  password?: string; // Only for mock data, will be obsolete
}

export interface ProductContentItem {
  name: string;
  quantity: string;
  // FIX: The price was optional, which is not safe for calculations. Made it required.
  price: number;
  imageUrl?: string;
}

export interface ExtraItem {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
}

export interface Product {
  id: string;
  name: string;
  arabicName: string;
  imageUrl: string;
  category: string;
  description: string;
  contents: ProductContentItem[];
  stock?: number;
  availableExtras?: string[]; // IDs of available extras
  averageRating?: number; // Calculated field
  reviewCount?: number; // Calculated field
}

export interface CartItem extends Product {
  cartId: string; // Unique ID for this cart instance (productId + extras)
  quantity: number;
  selectedExtras: ExtraItem[];
}

export enum OrderStatus {
  Preparing = "قيد التجهيز",
  ReadyForPickup = "جاهز للاستلام",
  OutForDelivery = "قيد التوصيل",
  Delivered = "تم التوصيل",
  Cancelled = "ملغي",
}

export interface Order {
  id: string;
  userId: string;
  date: string; // ISO date string
  items: CartItem[];
  total: number;
  subtotal?: number;
  deliveryFee?: number;
  discountAmount?: number;
  appliedOfferIds?: string[];
  status: OrderStatus;
  paymentStatus: 'unpaid' | 'paid';
  deliveryInfo: DeliveryInfo;
  driverId?: string | null;
}

export interface DeliveryInfo {
  name: string;
  phone: string;
  address: string;
}

export interface Discount {
  type: 'percentage' | 'fixed';
  value: number;
  appliesTo: 'all' | 'category' | 'product';
  target?: string; // category name or product ID
}

export interface Offer {
  id: string;
  imageUrl: string;
  title: string;
  expiryDate: string; // ISO date string
  link?: string; // e.g., '#/product/prod1' or '#/category/العائلية'
  callToAction?: string; // e.g., 'تسوق الآن'
  discount?: Discount;
}

export interface Review {
  id: string;
  productId: string;
  author: string;
  rating: number; // e.g., 1-5
  comment: string;
  date: string; // ISO date string
}

export interface Category {
  id: string;
  name: string;
  image: string;
  sortOrder: number;
}

export interface StoreSettings {
  deliveryFee: number;
}


// Admin Panel Specific Types
export interface Customer extends User {
  joinDate: string; // ISO date string
  orderHistory: string[]; // array of order IDs
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  status: 'Available' | 'On-Delivery' | 'Offline';
}

export interface AdminOrder extends Order {
  customer?: Omit<User, 'role'>;
}

export interface AdminNotification {
  id: string;
  message: string;
  timestamp: string; // ISO date string
  read: boolean;
  link?: string;
}