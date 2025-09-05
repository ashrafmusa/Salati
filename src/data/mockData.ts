
// FIX: Changed import path to use the old `Product` type from the root `types.ts` file, which matches this mock data structure.
import { Product, Offer, Review } from '../../types';

export const PRODUCT_CATEGORIES: string[] = ["منتجات غذائية", "إلكترونيات", "عقارات", "ملابس"];

export const PRODUCTS: Product[] = [
  {
    id: 'prod1',
    name: 'Sudanese Breakfast Product',
    arabicName: 'سلة الفطور السوداني',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/salati/images/basket1.png',
    category: 'منتجات غذائية',
    description: 'كل ما تحتاجه لوجبة فطور سودانية أصيلة وغنية بالطعم.',
    contents: [
      { name: 'فول مدمس (علبة)', quantity: '2', price: 1000 },
      { name: 'طعمية (كيس)', quantity: '1', price: 800 },
      { name: 'جبنة بيضاء', quantity: '250 جرام', price: 1200 },
      { name: 'عيش بلدي', quantity: '10 أرغفة', price: 500 },
    ],
    stock: 50,
    availableExtras: ['extra1', 'extra3'],
  },
  {
    id: 'prod2',
    name: 'Family Lunch Product',
    arabicName: 'سلة الغداء العائلية',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/salati/images/basket2.png',
    category: 'منتجات غذائية',
    description: 'مكونات متكاملة لوجبة غداء شهية تكفي جميع أفراد العائلة.',
    contents: [
      { name: 'أرز', quantity: '2 كيلو', price: 2500 },
      { name: 'عدس', quantity: '1 كيلو', price: 1500 },
      { name: 'بصل', quantity: '1 كيلو', price: 500 },
      { name: 'طماطم', quantity: '1 كيلو', price: 500 },
      { name: 'لحم مفروم', quantity: '500 جرام', price: 4000 },
    ],
    stock: 30,
    availableExtras: ['extra1', 'extra2', 'extra4'],
  },
  {
    id: 'prod3',
    name: 'Economy Essentials Product',
    arabicName: 'سلة التوفير الأساسية',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/salati/images/basket3.png',
    category: 'منتجات غذائية',
    description: 'مجموعة من المنتجات الأساسية بسعر اقتصادي لا يقاوم.',
    contents: [
      { name: 'دقيق', quantity: '1 كيلو', price: 1000 },
      { name: 'مكرونة', quantity: '2 كيس', price: 1000 },
      { name: 'زيت', quantity: '0.5 لتر', price: 800 },
      { name: 'سكر', quantity: '0.5 كيلو', price: 500 },
    ],
    stock: 100,
    availableExtras: ['extra3', 'extra4'],
  },
   {
    id: 'prod4',
    name: 'New Arrivals Fruit Product',
    arabicName: 'سلة فواكه الموسم الجديدة',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/salati/images/basket4.png',
    category: 'منتجات غذائية',
    description: 'تشكيلة منعشة من أفضل فواكه الموسم الطازجة.',
    contents: [
      { name: 'مانجو', quantity: '1 كيلو', price: 2000 },
      { name: 'موز', quantity: '1 كيلو', price: 1000 },
      { name: 'برتقال', quantity: '1 كيلو', price: 800 },
      { name: 'تفاح', quantity: '1 كيلو', price: 1500 },
    ],
    stock: 15,
  },
];

export const OFFERS: Offer[] = [
  { 
    id: 'promo1',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/salati/images/promo1.png',
    title: 'عرض خاص! خصم 20% على المنتجات الغذائية',
    expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    discount: {
      type: 'percentage',
      value: 20,
      appliesTo: 'category',
      target: 'منتجات غذائية'
    }
  },
  { 
    id: 'promo2',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/salati/images/promo2.png',
    title: 'توصيل مجاني لجميع الطلبات فوق 20,000 ج.س',
    expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  }
];

export const MOCK_REVIEWS: Review[] = [
    {
        id: 'rev1',
        productId: 'prod1',
        author: 'أحمد علي',
        rating: 5,
        comment: 'منتج ممتاز ومكوناته طازجة. الفطور كان رائع!',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: 'rev2',
        productId: 'prod1',
        author: 'فاطمة محمد',
        rating: 4,
        comment: 'جيدة جداً، لكن أتمنى لو كانت كمية الجبنة أكبر قليلاً.',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: 'rev3',
        productId: 'prod2',
        author: 'خالد عمر',
        rating: 5,
        comment: 'المنتج العائلي موفر وممتاز. المكونات كفتنا وزيادة. شكراً سـلـتـي!',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    }
];