import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { Category, Supplier, Item, Bundle, ExtraItem, Offer, Driver } from '../types';

// --- DUMMY DATA DEFINITIONS ---
// This seed file is designed to provide a comprehensive and realistic dataset for demo purposes.

// --- IDs for linking data ---
const supplierIds = {
    dairy: 'dummy_supplier_1',
    bakery: 'dummy_supplier_2',
    farm: 'dummy_supplier_3',
    butcher: 'dummy_supplier_4',
    cleaning: 'dummy_supplier_5',
    general: 'dummy_supplier_6',
};

const itemIds = {
  milk: 'item_milk_01',
  yogurt: 'item_yogurt_02',
  bread: 'item_bread_03',
  cheese: 'item_cheese_04',
  tea: 'item_tea_05',
  coffee: 'item_coffee_06',
  sugar: 'item_sugar_07',
  soap: 'item_soap_08',
  toothpaste: 'item_toothpaste_09',
  oil: 'item_oil_10',
  tomato: 'item_tomato_11',
  potato: 'item_potato_12',
  onion: 'item_onion_13',
  banana: 'item_banana_14',
  chicken: 'item_chicken_15',
  beef: 'item_beef_16',
  laundry: 'item_laundry_17',
  dishSoap: 'item_dishsoap_18',
  allPurposeCleaner: 'item_cleaner_19',
  water: 'item_water_20',
  soda: 'item_soda_21',
  croissant: 'item_croissant_22'
};

const extraIds = {
  honey: 'extra_honey_01',
  jam: 'extra_jam_02',
  butter: 'extra_butter_03'
};

const bundleIds = {
    breakfast: 'bundle_breakfast_01',
    hotdrinks: 'bundle_hotdrinks_02',
    cleaning: 'bundle_cleaning_03',
    bbq: 'bundle_bbq_04',
};

// --- DATA ARRAYS ---

const dummyCategories: Omit<Category, 'id'>[] = [
  { name: 'منتجات غذائية', image: 'https://res.cloudinary.com/dolmzcken/image/upload/v1757023041/cuoebfbklinshszz6vfz.png', sortOrder: 1 },
  { name: 'مخبوزات', image: 'https://res.cloudinary.com/dolmzcken/image/upload/v1757023220/v0r5m4qf8gqym01c7t4w.png', sortOrder: 2 },
  { name: 'مشروبات', image: 'https://res.cloudinary.com/dolmzcken/image/upload/v1757023157/mscyvzvb7g3vzbbfzs5b.png', sortOrder: 3 },
  { name: 'خضروات وفواكه', image: 'https://res.cloudinary.com/dolmzcken/image/upload/v1758000100/sample_vegetables.png', sortOrder: 4 },
  { name: 'لحوم ودواجن', image: 'https://res.cloudinary.com/dolmzcken/image/upload/v1758000200/sample_meat.png', sortOrder: 5 },
  { name: 'منظفات منزلية', image: 'https://res.cloudinary.com/dolmzcken/image/upload/v1758000300/sample_cleaning.png', sortOrder: 6 },
  { name: 'عناية شخصية', image: 'https://res.cloudinary.com/dolmzcken/image/upload/v1757023267/j9k7pyeg1m3k5i0hkl7n.png', sortOrder: 7 },
];

const dummySuppliers: (Omit<Supplier, 'id'> & { id: string })[] = [
  { id: supplierIds.dairy, name: 'مورد الألبان الطازجة', contactPerson: 'علي محمد', phone: '+249912345678', email: 'dairy@supplier.com', address: 'الخرطوم', paymentTerms: 'Net 30', bankDetails: 'Bank of Khartoum, 12345' },
  { id: supplierIds.bakery, name: 'مخابز المدينة', contactPerson: 'سارة أحمد', phone: '+249923456789', email: 'bakery@supplier.com', address: 'أم درمان', paymentTerms: 'Cash on Delivery', bankDetails: 'Omdurman National Bank, 54321' },
  { id: supplierIds.farm, name: 'مزرعة الخيرات الطازجة', contactPerson: 'يوسف عبدالله', phone: '+249934567890', email: 'farm@supplier.com', address: 'بحري', paymentTerms: 'Net 15', bankDetails: 'Faisal Islamic Bank, 67890' },
  { id: supplierIds.butcher, name: 'ملحمة المدينة', contactPerson: 'خالد حسن', phone: '+249945678901', email: 'butcher@supplier.com', address: 'الخرطوم 2', paymentTerms: 'Cash on Delivery', bankDetails: 'Bank of Khartoum, 11223' },
  { id: supplierIds.cleaning, name: 'كلين هوم للتنظيف', contactPerson: 'فاطمة إبراهيم', phone: '+249956789012', email: 'clean@supplier.com', address: 'الرياض', paymentTerms: 'Net 45', bankDetails: 'Al Baraka Bank, 44556' },
  { id: supplierIds.general, name: 'شركة التوزيع العام', contactPerson: 'عمر سليمان', phone: '+249967890123', email: 'general@supplier.com', address: 'المنطقة الصناعية', paymentTerms: 'Net 60', bankDetails: 'Bank of Sudan, 77889' },
];

const dummyItems: Item[] = [
  // Existing Items (Refreshed)
  { id: itemIds.milk, type: 'item', name: 'Milk', arabicName: 'لبن', imageUrl: 'https://res.cloudinary.com/dolmzcken/image/upload/v1757023472/r877ubywmkydmmqjqg2a.png', imageUrls: ['https://res.cloudinary.com/dolmzcken/image/upload/v1757023472/r877ubywmkydmmqjqg2a.png', 'https://res.cloudinary.com/dolmzcken/image/upload/v1758000500/milk_gallery_1.png'], category: 'منتجات غذائية', description: 'لبن طازج كامل الدسم، 1 لتر.', costUSD: 2.67, markupPercentage: 25, stock: 100, supplierId: supplierIds.dairy, isFeatured: true, reviewCount: 5, averageRating: 4.8 },
  { id: itemIds.yogurt, type: 'item', name: 'Yogurt', arabicName: 'زبادي', imageUrl: 'https://res.cloudinary.com/dolmzcken/image/upload/v1757023531/j0zjxcnna0n5zsmolbqu.png', category: 'منتجات غذائية', description: 'زبادي طبيعي، 170 جرام.', costUSD: 0.89, markupPercentage: 25, stock: 80, supplierId: supplierIds.dairy },
  { id: itemIds.bread, type: 'item', name: 'Bread', arabicName: 'خبز', imageUrl: 'https://res.cloudinary.com/dolmzcken/image/upload/v1757023573/r9z3q4v4v9qgplxqv0qz.png', category: 'مخبوزات', description: 'خبز طازج من الفرن.', costUSD: 0.36, markupPercentage: 25, stock: 200, supplierId: supplierIds.bakery, isFeatured: true, reviewCount: 12, averageRating: 4.5 },
  { id: itemIds.cheese, type: 'item', name: 'White Cheese', arabicName: 'جبنة بيضاء', imageUrl: 'https://res.cloudinary.com/dolmzcken/image/upload/v1757023617/p4f5b7y9s9gckc8a7z3d.png', category: 'منتجات غذائية', description: 'جبنة بيضاء بلدية، 500 جرام.', costUSD: 4.44, markupPercentage: 25, stock: 50, reviewCount: 8, averageRating: 4.2 },
  { id: itemIds.tea, type: 'item', name: 'Tea', arabicName: 'شاي', imageUrl: 'https://res.cloudinary.com/dolmzcken/image/upload/v1757023674/i8g8v8d9e0f0g0h0i0j0.png', category: 'مشروبات', description: 'شاي أسود فاخر، 100 كيس.', costUSD: 2.13, markupPercentage: 25, stock: 150, isFeatured: true, reviewCount: 25, averageRating: 4.9, supplierId: supplierIds.general },
  { id: itemIds.coffee, type: 'item', name: 'Coffee', arabicName: 'قهوة', imageUrl: 'https://res.cloudinary.com/dolmzcken/image/upload/v1757023722/k0l0m0n0o0p0q0r0s0t0.png', category: 'مشروبات', description: 'بن مطحون، 250 جرام.', costUSD: 5.33, markupPercentage: 25, stock: 70, supplierId: supplierIds.general },
  { id: itemIds.sugar, type: 'item', name: 'Sugar', arabicName: 'سكر', imageUrl: 'https://res.cloudinary.com/dolmzcken/image/upload/v1757023766/u0v0w0x0y0z0a1b1c1d1.png', category: 'منتجات غذائية', description: 'سكر أبيض ناعم، 1 كيلو.', costUSD: 3.56, markupPercentage: 25, stock: 300, supplierId: supplierIds.general },
  { id: itemIds.soap, type: 'item', name: 'Soap', arabicName: 'صابون', imageUrl: 'https://res.cloudinary.com/dolmzcken/image/upload/v1757023805/e1f1g1h1i1j1k1l1m1n1.png', category: 'عناية شخصية', description: 'صابون معطر.', costUSD: 1.42, markupPercentage: 25, stock: 120, supplierId: supplierIds.general },
  { id: itemIds.toothpaste, type: 'item', name: 'Toothpaste', arabicName: 'معجون أسنان', imageUrl: 'https://res.cloudinary.com/dolmzcken/image/upload/v1757023851/o1p1q1r1s1t1u1v1w1x1.png', category: 'عناية شخصية', description: 'معجون أسنان بالفلورايد.', costUSD: 1.78, markupPercentage: 25, stock: 90, supplierId: supplierIds.general },
  { id: itemIds.oil, type: 'item', name: 'Cooking Oil', arabicName: 'زيت طبخ', imageUrl: 'https://res.cloudinary.com/dolmzcken/image/upload/v1757023891/y1z1a2b2c2d2e2f2g2h2.png', category: 'منتجات غذائية', description: 'زيت دوار الشمس، 1 لتر.', costUSD: 7.11, markupPercentage: 25, stock: 8, isFeatured: true, supplierId: supplierIds.general },
  
  // New Items
  { id: itemIds.tomato, type: 'item', name: 'Tomatoes', arabicName: 'طماطم', imageUrl: 'https://res.cloudinary.com/dolmzcken/image/upload/v1758000600/tomatoes.png', category: 'خضروات وفواكه', description: 'طماطم طازجة، 1 كيلو.', costUSD: 1.50, markupPercentage: 30, stock: 60, supplierId: supplierIds.farm },
  { id: itemIds.potato, type: 'item', name: 'Potatoes', arabicName: 'بطاطس', imageUrl: 'https://res.cloudinary.com/dolmzcken/image/upload/v1758000700/potatoes.png', category: 'خضروات وفواكه', description: 'بطاطس عالية الجودة، 1 كيلو.', costUSD: 1.20, markupPercentage: 30, stock: 150, supplierId: supplierIds.farm },
  { id: itemIds.onion, type: 'item', name: 'Onions', arabicName: 'بصل', imageUrl: 'https://res.cloudinary.com/dolmzcken/image/upload/v1758000800/onions.png', category: 'خضروات وفواكه', description: 'بصل أحمر، 1 كيلو.', costUSD: 1.10, markupPercentage: 30, stock: 180, supplierId: supplierIds.farm, isFeatured: true },
  { id: itemIds.banana, type: 'item', name: 'Bananas', arabicName: 'موز', imageUrl: 'https://res.cloudinary.com/dolmzcken/image/upload/v1758000900/bananas.png', category: 'خضروات وفواكه', description: 'موز طازج، 1 كيلو.', costUSD: 2.00, markupPercentage: 35, stock: 40 },
  { id: itemIds.chicken, type: 'item', name: 'Chicken', arabicName: 'دجاج', imageUrl: 'https://res.cloudinary.com/dolmzcken/image/upload/v1758001000/chicken.png', imageUrls: ['https://res.cloudinary.com/dolmzcken/image/upload/v1758001000/chicken.png', 'https://res.cloudinary.com/dolmzcken/image/upload/v1758001050/chicken_gallery_1.png'], category: 'لحوم ودواجن', description: 'دجاجة كاملة، 1 كيلو.', costUSD: 8.00, markupPercentage: 40, stock: 35, supplierId: supplierIds.butcher, isFeatured: true, reviewCount: 18, averageRating: 4.6 },
  { id: itemIds.beef, type: 'item', name: 'Beef', arabicName: 'لحم بقري', imageUrl: 'https://res.cloudinary.com/dolmzcken/image/upload/v1758001100/beef.png', category: 'لحوم ودواجن', description: 'لحم بقري مفروم، 500 جرام.', costUSD: 10.00, markupPercentage: 40, stock: 25, supplierId: supplierIds.butcher },
  { id: itemIds.laundry, type: 'item', name: 'Laundry Detergent', arabicName: 'مسحوق غسيل', imageUrl: 'https://res.cloudinary.com/dolmzcken/image/upload/v1758001200/laundry.png', category: 'منظفات منزلية', description: 'مسحوق غسيل فعال، 1 كيلو.', costUSD: 6.50, markupPercentage: 30, stock: 55, supplierId: supplierIds.cleaning },
  { id: itemIds.dishSoap, type: 'item', name: 'Dish Soap', arabicName: 'سائل جلي', imageUrl: 'https://res.cloudinary.com/dolmzcken/image/upload/v1758001300/dish_soap.png', category: 'منظفات منزلية', description: 'سائل جلي بالليمون، 500 مل.', costUSD: 2.50, markupPercentage: 30, stock: 75, supplierId: supplierIds.cleaning },
  { id: itemIds.allPurposeCleaner, type: 'item', name: 'All-Purpose Cleaner', arabicName: 'منظف متعدد الاستخدامات', imageUrl: 'https://res.cloudinary.com/dolmzcken/image/upload/v1758001400/cleaner.png', category: 'منظفات منزلية', description: 'منظف لجميع الأسطح، 1 لتر.', costUSD: 4.00, markupPercentage: 30, stock: 65, supplierId: supplierIds.cleaning, isFeatured: true },
  { id: itemIds.water, type: 'item', name: 'Water Bottle', arabicName: 'مياه معدنية', imageUrl: 'https://res.cloudinary.com/dolmzcken/image/upload/v1758001500/water.png', category: 'مشروبات', description: 'مياه معدنية نقية، 1.5 لتر.', costUSD: 0.50, markupPercentage: 20, stock: 500, supplierId: supplierIds.general },
  { id: itemIds.soda, type: 'item', name: 'Soda', arabicName: 'مشروب غازي', imageUrl: 'https://res.cloudinary.com/dolmzcken/image/upload/v1758001600/soda.png', category: 'مشروبات', description: 'مشروب غازي، 330 مل.', costUSD: 0.75, markupPercentage: 25, stock: 250, supplierId: supplierIds.general },
  { id: itemIds.croissant, type: 'item', name: 'Croissant', arabicName: 'كرواسان', imageUrl: 'https://res.cloudinary.com/dolmzcken/image/upload/v1758001700/croissant.png', category: 'مخبوزات', description: 'كرواسان بالزبدة.', costUSD: 1.00, markupPercentage: 40, stock: 60, supplierId: supplierIds.bakery },
];

const dummyExtras: ExtraItem[] = [
  { id: extraIds.honey, name: 'عسل', price: 800, imageUrl: 'https://res.cloudinary.com/dolmzcken/image/upload/v1757024003/i2j2k2l2m2n2o2p2q2r2.png' },
  { id: extraIds.jam, name: 'مربى', price: 600, imageUrl: 'https://res.cloudinary.com/dolmzcken/image/upload/v1757024040/s2t2u2v2w2x2y2z2a3b3.png' },
  { id: extraIds.butter, name: 'زبدة', price: 700, imageUrl: 'https://res.cloudinary.com/dolmzcken/image/upload/v1757024074/c3d3e3f3g3h3i3j3k3l3.png' },
];

const dummyBundles: Bundle[] = [
  { id: bundleIds.breakfast, type: 'bundle', name: 'Sudanese Breakfast Basket', arabicName: 'سلة الفطور السوداني', imageUrl: 'https://res.cloudinary.com/dolmzcken/image/upload/v1757024177/m3n3o3p3q3r3s3t3u3v3.png', category: 'منتجات غذائية', description: 'كل ما تحتاجه لبداية يوم مثالية.', contents: [{ itemId: itemIds.bread, quantity: 2 }, { itemId: itemIds.cheese, quantity: 1 }, { itemId: itemIds.tea, quantity: 1 }, { itemId: itemIds.sugar, quantity: 1 }], stock: 30, availableExtras: [extraIds.honey, extraIds.jam, extraIds.butter], reviewCount: 15, averageRating: 4.7 },
  { id: bundleIds.hotdrinks, type: 'bundle', name: 'Hot Drinks Basket', arabicName: 'سلة المشروبات الساخنة', imageUrl: 'https://res.cloudinary.com/dolmzcken/image/upload/v1757024219/w3x3y3z3a4b4c4d4e4f4.png', category: 'مشروبات', description: 'استمتع بمشروباتك الساخنة المفضلة.', contents: [{ itemId: itemIds.tea, quantity: 1 }, { itemId: itemIds.coffee, quantity: 1 }, { itemId: itemIds.sugar, quantity: 1 }, { itemId: itemIds.milk, quantity: 1 }], stock: 40 },
  { id: bundleIds.cleaning, type: 'bundle', name: 'Cleaning Essentials Kit', arabicName: 'سلة النظافة الأساسية', imageUrl: 'https://res.cloudinary.com/dolmzcken/image/upload/v1758001800/cleaning_bundle.png', category: 'منظفات منزلية', description: 'كل ما تحتاجه لمنزل نظيف ولامع.', contents: [{ itemId: itemIds.laundry, quantity: 1 }, { itemId: itemIds.dishSoap, quantity: 1 }, { itemId: itemIds.allPurposeCleaner, quantity: 1 }], stock: 20 },
  { id: bundleIds.bbq, type: 'bundle', name: 'BBQ Kit', arabicName: 'سلة الشواء', imageUrl: 'https://res.cloudinary.com/dolmzcken/image/upload/v1758001900/bbq_bundle.png', category: 'لحوم ودواجن', description: 'جهز نفسك لحفلة شواء رائعة.', contents: [{ itemId: itemIds.beef, quantity: 2 }, { itemId: itemIds.onion, quantity: 1 }, { itemId: itemIds.soda, quantity: 4 }], stock: 15 },
];

const dummyOffers: Omit<Offer, 'id'>[] = [
    { imageUrl: 'https://res.cloudinary.com/dolmzcken/image/upload/v1757024340/g4h4i4j4k4l4m4n4o4p4.png', title: 'خصم 15% على كل المشروبات!', expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), callToAction: 'تسوق الآن', discount: { type: 'percentage', value: 15, appliesTo: 'category', target: 'مشروبات' } },
    { imageUrl: 'https://res.cloudinary.com/dolmzcken/image/upload/v1757024391/q4r4s4t4u4v4w4x4y4z4.png', title: 'وفر 500 ج.س على سلة الفطور', expiryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), callToAction: 'اطلبها الآن', discount: { type: 'fixed', value: 500, appliesTo: 'product', target: bundleIds.breakfast } },
    { imageUrl: 'https://res.cloudinary.com/dolmzcken/image/upload/v1758002000/cleaning_offer.png', title: 'عرض النظافة: اشترِ 2 صابون واحصل على 1 مجاناً!', expiryDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(), callToAction: 'احصل على العرض', discount: { type: 'buyXgetY', buyQuantity: 2, getQuantity: 1, appliesTo: 'product', target: itemIds.soap } },
];

const dummyDrivers: Omit<Driver, 'id'>[] = [
    { name: 'أحمد علي', phone: '+249911111111', status: 'Available' },
    { name: 'فاطمة عمر', phone: '+249922222222', status: 'On-Delivery' },
    { name: 'حسن خالد', phone: '+249933333333', status: 'Offline' },
];

/**
 * Seeds the Firestore database with a complete set of dummy data for demonstration.
 * Will only run if the 'categories' collection is empty, unless `force` is true.
 * @param db Firestore instance
 * @param options { force?: boolean } - If true, will seed even if data exists.
 */
export const seedDatabase = async (db: firebase.firestore.Firestore, options?: { force?: boolean }) => {
    if (!options?.force) {
        const categoriesCheck = await db.collection('categories').limit(1).get();
        if (!categoriesCheck.empty) {
            console.log("Database already contains data. Skipping safe seed process.");
            return;
        }
    }

    console.log(options?.force ? "Forcing database seed..." : "Database appears to be empty. Seeding with dummy data...");
    const batch = db.batch();
    
    // Seed data in order
    dummyCategories.forEach(data => {
        const docRef = db.collection('categories').doc();
        batch.set(docRef, data);
    });

    dummySuppliers.forEach(data => {
        const { id, ...supplierData } = data;
        const docRef = db.collection('suppliers').doc(id);
        batch.set(docRef, supplierData);
    });
    
    dummyItems.forEach(item => {
        const { id, ...itemData } = item;
        const docRef = db.collection('items').doc(id);
        batch.set(docRef, itemData);
    });
    
    dummyExtras.forEach(extra => {
        const { id, ...extraData } = extra;
        const docRef = db.collection('extras').doc(id);
        batch.set(docRef, extraData);
    });

    dummyBundles.forEach(bundle => {
        const { id, ...bundleData } = bundle;
        const docRef = db.collection('bundles').doc(id);
        batch.set(docRef, bundleData);
    });

    dummyOffers.forEach(data => {
        const docRef = db.collection('offers').doc();
        batch.set(docRef, data);
    });
    
    dummyDrivers.forEach(data => {
        const docRef = db.collection('drivers').doc();
        batch.set(docRef, data);
    });

    try {
        await batch.commit();
        console.log("Dummy data successfully seeded to Firestore.");
    } catch (error) {
        console.error("Error seeding database:", error);
        throw error; // Re-throw the error so the calling function can handle it.
    }
};
