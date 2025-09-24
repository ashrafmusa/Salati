// FIX: Define the User type to be used across modules.
export interface User {
  uid: string;
  email: string | null;
  name: string;
  phone?: string | null;
  address?: string;
  // Keep the role keys in English for internal logic, but define their user-facing Arabic translations elsewhere.
  role: 'super-admin' | 'admin' | 'sub-admin' | 'driver' | 'customer' | 'supplier';
  customDeliveryFee?: number;
  supplierId?: string;
}

export interface Item {
  id: string;
  type: 'item';
  name: string;
  arabicName: string; // Already included, which is perfect for localization
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
  arabicName: string; // Already included, perfect
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
  arabicName: string; // New: Add Arabic name for display
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

// Translate payment status
export enum PaymentStatus {
  Unpaid = 'غير مدفوع', // Unpaid
  Paid = 'مدفوع', // Paid
}

// Translate delivery method
export enum DeliveryMethod {
  Delivery = 'توصيل', // Delivery
  Pickup = 'استلام من المتجر', // Pickup
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
  // Use the new PaymentStatus enum for localized value, but the underlying type is still a string literal for easy comparison
  paymentStatus: keyof typeof PaymentStatus extends infer K ? K extends string ? Lowercase<K> : never : never; // 'unpaid' | 'paid'
  deliveryInfo: DeliveryInfo;
  driverId?: string | null;
  // Use the new DeliveryMethod enum for localized value, but the underlying type is still a string literal
  deliveryMethod: keyof typeof DeliveryMethod extends infer K ? K extends string ? Lowercase<K> : never : never; // 'delivery' | 'pickup'
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
  // Keep internal logic keys as English
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
  appliesTo: 'product';
  target: string; // The ID of the product
}

export type Discount = PercentageDiscount | FixedDiscount | BuyXGetYDiscount;


export interface Offer {
  id: string;
  imageUrl: string;
  title: string;
  arabicTitle: string; // New: Add Arabic title
  expiryDate: string; // ISO date string
  link?: string;
  callToAction?: string;
  arabicCallToAction?: string; // New: Add Arabic Call to Action
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
  arabicName: string; // New: Add Arabic name
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
  arabicAnnouncementText?: string; // New: Add Arabic announcement text
  isAnnouncementActive?: boolean;
  theme: ThemeSettings;
  loginIllustrationSvg?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string; // ISO date string
  adminId: string;
  adminName: string;
  // The action itself will likely be translated in the UI via an i18n key map
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

// Translate Driver Status
export enum DriverStatus {
  Available = 'متاح', // Available
  OnDelivery = 'قيد التوصيل', // On-Delivery
  Offline = 'غير متصل', // Offline
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  // Use DriverStatus for localized values
  status: keyof typeof DriverStatus; // 'Available' | 'OnDelivery' | 'Offline'
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
export enum ActivityLogType {
  StatusChange = 'تغيير حالة',
  CustomerMessage = 'رسالة عميل',
  DriverNote = 'ملاحظة سائق',
  AdminMessage = 'رسالة إداري',
  InternalNote = 'ملاحظة داخلية',
  Issue = 'مشكلة',
  SystemLog = 'سجل نظام',
}

export enum VisibilityType {
  Public = 'عام',
  Internal = 'داخلي',
}

export interface ActivityLogEntry {
  id: string;
  timestamp: string; // ISO date string
  authorId: string;
  authorName: string;
  message: string;
  // Use enums for localized values
  type: keyof typeof ActivityLogType extends infer K ? K extends string ? K : never : never; // 'StatusChange' | 'CustomerMessage' | 'DriverNote' | 'AdminMessage' | 'InternalNote' | 'Issue' | 'SystemLog'
  visibility: keyof typeof VisibilityType; // 'Public' | 'Internal'
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

// Enums for Real Estate types to provide Arabic translations
export enum PropertyType {
  Apartment = 'شقة',
  House = 'منزل/فيلا',
  Office = 'مكتب',
  Land = 'أرض',
}
export enum ListingType {
  Rent = 'إيجار',
  Sale = 'بيع',
}
export enum PricePeriod {
  Monthly = 'شهري',
  Annually = 'سنوي',
}

export enum ListingStatus {
  Available = "متاح",
  Rented = "مؤجر",
  Sold = "تم البيع",
  Unavailable = "غير متاح",
}

export interface Property {
  id: string;
  title: string;
  arabicTitle: string; // New: Add Arabic title
  description: string;
  arabicDescription: string; // New: Add Arabic description
  // Use the enum key for the internal type, and the value for display
  type: keyof typeof PropertyType extends infer K ? K extends string ? K : never : never; // 'Apartment' | 'House' | 'Office' | 'Land'
  location: {
    address: string;
    city: string;
    latitude?: number;
    longitude?: number;
  };
  imageUrls: string[];
  amenities: string[];
  arabicAmenities: string[]; // New: Add Arabic amenities
  bedrooms: number;
  bathrooms: number;
  area: number; // in sq meters
  ownerId?: string;
}

export interface Listing {
  id: string;
  propertyId: string;
  propertyTitle: string; // Denormalized for easier display
  propertyArabicTitle: string; // New: Denormalized Arabic title
  imageUrl: string; // Denormalized main image
  // Use the enum key for the internal type
  listingType: keyof typeof ListingType; // 'Rent' | 'Sale'
  price: number;
  // Use the enum key for the internal period
  pricePeriod?: keyof typeof PricePeriod; // 'Monthly' | 'Annually'
  status: ListingStatus;
  listedDate: string; // ISO date string
}