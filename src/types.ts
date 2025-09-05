

export interface User {
  uid: string;
  phone: string | null;
  name: string;
  address?: string;
  role: 'customer' | 'sub-admin' | 'admin' | 'super-admin' | 'driver';
  email?: string | null;
}

export interface Item {
  id: string;
  type: 'item';
  name: string;
  arabicName: string;
  imageUrl: string;
  category: string;
  description: string;
  price: number;
  stock: number;
  averageRating?: number;
  reviewCount?: number;
}

export interface BundleContent {
  itemId: string;
  quantity: number;
}

export interface Bundle {
  id: string;
  type: 'bundle';
  name: string;
  arabicName: string;
  imageUrl: string;
  category: string;
  description: string;
  contents: BundleContent[];
  stock: number;
  availableExtras?: string[];
  averageRating?: number;
  reviewCount?: number;
}

export type StoreProduct = Item | Bundle;

export interface ExtraItem {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
}

export interface CartItem {
  cartId: string; // Unique ID for cart instance
  productId: string;
  productType: 'item' | 'bundle';
  name: string;
  arabicName: string;
  imageUrl: string;
  quantity: number;
  unitPrice: number; // Price of one unit (item or bundle)
  selectedExtras: ExtraItem[];
  category: string;
  stock: number;
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
  target?: string; // category name or product ID (can be item or bundle id)
}

export interface Offer {
  id: string;
  imageUrl: string;
  title: string;
  expiryDate: string; // ISO date string
  link?: string;
  callToAction?: string;
  discount?: Discount;
}

export interface Review {
  id: string;
  productId: string; // Can be an Item ID or a Bundle ID
  author: string;
  rating: number;
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
// FIX: Added the `Customer` interface to resolve import errors in other files.
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