// FIX: Define the User type to be used across modules.
export interface User {
  uid: string;
  email: string | null;
  name: string;
  phone?: string | null;
  address?: string;
  role: 'super-admin' | 'admin' | 'sub-admin' | 'driver' | 'customer' | 'supplier';
  customDeliveryFee?: number;
  supplierId?: string;
}

export interface Item {
  id: string;
  type: 'item';
  name: string;
  arabicName: string;
  imageUrl: string;
  imageUrls?: string[]; // For product gallery
  category: string;
  description: string;
  costUSD: number; // The base cost of the item in USD
  markupPercentage: number; // The profit margin percentage
  stock: number;
  averageRating?: number;
  reviewCount?: number;
  isFeatured?: boolean;
  supplierId?: string; // SCM feature
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
  imageUrls?: string[]; // For product gallery
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
  unitPrice: number; // Price of one unit (item or bundle) IN SDG AT THE TIME OF ADDING
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
  deliveryMethod: 'delivery' | 'pickup';
  lastUpdatedBy?: { id: string; name: string };
  lastUpdatedAt?: string;
  customerHasUnreadMessages?: boolean;
  adminHasUnreadMessages?: boolean;
}

export interface DeliveryInfo {
  name: string;
  phone: string;
  address: string;
}

export interface PercentageDiscount {
  type: 'percentage';
  value: number; // e.g., 15 for 15%
  appliesTo: 'all' | 'category' | 'product';
  target?: string;
}

export interface FixedDiscount {
  type: 'fixed';
  value: number; // e.g., 500 for 500 currency units
  appliesTo: 'all' | 'category' | 'product';
  target?: string;
}

export interface BuyXGetYDiscount {
  type: 'buyXgetY';
  buyQuantity: number; // e.g., 10
  getQuantity: number; // e.g., 1 or 2
  appliesTo: 'product'; // This offer type is product-specific
  target: string; // The ID of the product
}

export type Discount = PercentageDiscount | FixedDiscount | BuyXGetYDiscount;


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

export interface ThemeSettings {
  primaryColor: string;
  secondaryColor: string;
  sansFont: string;
  displayFont: string;
}

export interface StoreSettings {
  deliveryFee: number;
  logoUrl: string;
  storeAddress: string;
  usdToSdgRate: number; // New field for currency conversion
  announcementText?: string;
  isAnnouncementActive?: boolean;
  theme: ThemeSettings;
  loginIllustrationSvg?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string; // ISO date string
  adminId: string;
  adminName: string;
  action: string;
  details?: string;
}

// --- SCM (Supply Chain Management) Types ---

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  paymentTerms: string;
  bankDetails: string;
  userId?: string;
}

export interface PurchaseOrderItem {
  itemId: string;
  itemName: string; // Denormalized for display
  quantity: number;
  costPrice: number;
}

export enum PurchaseOrderStatus {
  Draft = "مسودة",
  Sent = "مرسل للمورد",
  PartiallyReceived = "تم الاستلام جزئياً",
  FullyReceived = "تم الاستلام بالكامل",
  Cancelled = "ملغي",
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName: string; // Denormalized for display
  createdDate: string; // ISO date string
  expectedDate: string; // ISO date string
  items: PurchaseOrderItem[];
  totalCost: number;
  status: PurchaseOrderStatus;
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

// Collaboration Feature Types
export interface ActivityLogEntry {
  id: string;
  timestamp: string; // ISO date string
  authorId: string;
  authorName: string;
  message: string;
  type: 'status_change' | 'customer_message' | 'driver_note' | 'admin_message' | 'internal_note' | 'issue' | 'system_log';
  visibility: 'public' | 'internal';
}

// User-created Lists (Daily Baskets)
export interface UserListItem {
  productId: string;
  productType: 'item' | 'bundle';
}

export interface UserList {
  id: string;
  name: string;
  items: UserListItem[];
}

// --- Real Estate Types ---

export type PropertyType = 'apartment' | 'house' | 'office' | 'land';
export type ListingType = 'rent' | 'sale';
export type PricePeriod = 'monthly' | 'annually';

export enum ListingStatus {
  Available = "متاح",
  Rented = "مؤجر",
  Sold = "تم البيع",
  Unavailable = "غير متاح",
}

export interface Property {
  id: string;
  title: string;
  description: string;
  type: PropertyType;
  location: {
    address: string;
    city: string;
    latitude?: number;
    longitude?: number;
  };
  imageUrls: string[];
  amenities: string[];
  bedrooms: number;
  bathrooms: number;
  area: number; // in sq meters
  ownerId?: string;
}

export interface Listing {
  id: string;
  propertyId: string;
  listingType: ListingType;
  price: number;
  pricePeriod?: PricePeriod;
  status: ListingStatus;
  listedDate: string; // ISO date string
}
