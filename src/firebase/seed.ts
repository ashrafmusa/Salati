

// FIX: Refactored Firebase imports to use the v8 compat library to resolve module errors.
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { Category, Supplier, Item, Bundle, ExtraItem, Offer, Driver } from '../types';

// --- DUMMY DATA DEFINITIONS ---

const dummyCategories: Omit<Category, 'id'>[] = [
    { name: 'منتجات غذائية', image: 'https://res.cloudinary.com/dolmzcken/image/upload/v1757023041/cuoebfbklinshszz6vfz.png', sortOrder: 1 },
    { name: 'مشروبات', image: 'https://res.cloudinary.com/dolmzcken/image/upload/v1757023157/mscyvzvb7g3vzbbfzs5b.png', sortOrder: 2 },
    { name: 'مخبوزات', image: 'https://res.cloudinary.com/dolmzcken/image/upload/v1757023220/v0r5m4qf8gqym01c7t4w.png', sortOrder: 3 },
    { name: 'عناية شخصية', image: 'https://res.cloudinary.com/dolmzcken/image/upload/v1757023267/j9k7pyeg1m3k5i0hkl7n.png', sortOrder: 4 },
];

const supplierIds = {
    dairy: 'dummy_supplier_1',
    bakery: 'dummy_supplier_2'
};

const dummySuppliers: (Omit<Supplier, 'id'> & { id: string })[] = [
    { id: supplierIds.dairy, name: 'مورد الألبان الطازجة', contactPerson: 'علي محمد', phone: '+249912345678', email: 'dairy@supplier.com', address: 'الخرطوم', paymentTerms: 'Net 30', bankDetails: 'Bank of Khartoum, 12345' },
    { id: supplierIds.bakery, name: 'مخابز المدينة', contactPerson: 'سارة أحمد', phone: '+249923456789', email: 'bakery@supplier.com', address: 'أم درمان', paymentTerms: 'Cash on Delivery', bankDetails: 'Omdurman National Bank, 54321' },
];

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
};

const dummyItems: Item[] = [
    { id: itemIds.milk, type: 'item', name: 'Milk', arabicName: 'لبن', imageUrl: 'https://res.cloudinary.com/dolmzcken/image/upload/v1757023472/r877ubywmkydmmqjqg2a.png', category: 'منتجات غذائية', description: 'لبن طازج كامل الدسم.', price: 1500, stock: 100, supplierId: supplierIds.dairy, isFeatured: true, reviewCount: 5, averageRating: 4.8 },
    { id: itemIds.yogurt, type: 'item', name: 'Yogurt', arabicName: 'زبادي', imageUrl: 'https://res.cloudinary.com/dolmzcken/image/upload/v1757023531/j0zjxcnna0n5zsmolbqu.png', category: 'منتجات غذائية', description: 'زبادي طبيعي.', price: 500, stock: 80, supplierId: supplierIds.dairy },
    { id: itemIds.bread, type: 'item', name: 'Bread', arabicName: 'خبز', imageUrl: 'https://res.cloudinary.com/dolmzcken/image/upload/v1757023573/r9z3q4v4v9qgplxqv0qz.png', category: 'مخبوزات', description: 'خبز طازج من الفرن.', price: 200, stock: 200, supplierId: supplierIds.bakery, isFeatured: true, reviewCount: 12, averageRating: 4.5 },
    { id: itemIds.cheese, type: 'item', name: 'White Cheese', arabicName: 'جبنة بيضاء', imageUrl: 'https://res.cloudinary.com/dolmzcken/image/upload/v1757023617/p4f5b7y9s9gckc8a7z3d.png', category: 'منتجات غذائية', description: 'جبنة بيضاء بلدية.', price: 2500, stock: 50, reviewCount: 8, averageRating: 4.2 },
    { id: itemIds.tea, type: 'item', name: 'Tea', arabicName: 'شاي', imageUrl: 'https://res.cloudinary.com/dolmzcken/image/upload/v1757023674/i8g8v8d9e0f0g0h0i0j0.png', category: 'مشروبات', description: 'شاي أسود فاخر.', price: 1200, stock: 150, isFeatured: true, reviewCount: 25, averageRating: 4.9 },
    { id: itemIds.coffee, type: 'item', name: 'Coffee', arabicName: 'قهوة', imageUrl: 'https://res.cloudinary.com/dolmzcken/image/upload/v1757023722/k0l0m0n0o0p0q0r0s0t0.png', category: 'مشروبات', description: 'بن مطحون.', price: 3000, stock: 70 },
    { id: itemIds.sugar, type: 'item', name: 'Sugar', arabicName: 'سكر', imageUrl: 'https://res.cloudinary.com/dolmzcken/image/upload/v1757023766/u0v0w0x0y0z0a1b1c1d1.png', category: 'منتجات غذائية', description: 'سكر أبيض ناعم.', price: 2000, stock: 300 },
    { id: itemIds.soap, type: 'item', name: 'Soap', arabicName: 'صابون', imageUrl: 'https://res.cloudinary.com/dolmzcken/image/upload/v1757023805/e1f1g1h1i1j1k1l1m1n1.png', category: 'عناية شخصية', description: 'صابون معطر.', price: 800, stock: 120 },
    { id: itemIds.toothpaste, type: 'item', name: 'Toothpaste', arabicName: 'معجون أسنان', imageUrl: 'https://res.cloudinary.com/dolmzcken/image/upload/v1757023851/o1p1q1r1s1t1u1v1w1x1.png', category: 'عناية شخصية', description: 'معجون أسنان بالفلورايد.', price: 1000, stock: 90 },
    { id: itemIds.oil, type: 'item', name: 'Cooking Oil', arabicName: 'زيت طبخ', imageUrl: 'https://res.cloudinary.com/dolmzcken/image/upload/v1757023891/y1z1a2b2c2d2e2f2g2h2.png', category: 'منتجات غذائية', description: 'زيت دوار الشمس.', price: 4000, stock: 8, isFeatured: true },
];

const extraIds = {
    honey: 'extra_honey_01',
    jam: 'extra_jam_02',
    butter: 'extra_butter_03'
};

const dummyExtras: ExtraItem[] = [
    { id: extraIds.honey, name: 'عسل', price: 800, imageUrl: 'https://res.cloudinary.com/dolmzcken/image/upload/v1757024003/i2j2k2l2m2n2o2p2q2r2.png' },
    { id: extraIds.jam, name: 'مربى', price: 600, imageUrl: 'https://res.cloudinary.com/dolmzcken/image/upload/v1757024040/s2t2u2v2w2x2y2z2a3b3.png' },
    { id: extraIds.butter, name: 'زبدة', price: 700, imageUrl: 'https://res.cloudinary.com/dolmzcken/image/upload/v1757024074/c3d3e3f3g3h3i3j3k3l3.png' },
];

const bundleIds = {
    breakfast: 'bundle_breakfast_01',
    hotdrinks: 'bundle_hotdrinks_02'
};

const dummyBundles: Bundle[] = [
    { id: bundleIds.breakfast, type: 'bundle', name: 'Sudanese Breakfast Basket', arabicName: 'سلة الفطور السوداني', imageUrl: 'https://res.cloudinary.com/dolmzcken/image/upload/v1757024177/m3n3o3p3q3r3s3t3u3v3.png', category: 'منتجات غذائية', description: 'كل ما تحتاجه لبداية يوم مثالية.', contents: [{ itemId: itemIds.bread, quantity: 2 }, { itemId: itemIds.cheese, quantity: 1 }, { itemId: itemIds.tea, quantity: 1 }, { itemId: itemIds.sugar, quantity: 1 }], stock: 30, availableExtras: [extraIds.honey, extraIds.jam, extraIds.butter], reviewCount: 15, averageRating: 4.7 },
    { id: bundleIds.hotdrinks, type: 'bundle', name: 'Hot Drinks Basket', arabicName: 'سلة المشروبات الساخنة', imageUrl: 'https://res.cloudinary.com/dolmzcken/image/upload/v1757024219/w3x3y3z3a4b4c4d4e4f4.png', category: 'مشروبات', description: 'استمتع بمشروباتك الساخنة المفضلة.', contents: [{ itemId: itemIds.tea, quantity: 1 }, { itemId: itemIds.coffee, quantity: 1 }, { itemId: itemIds.sugar, quantity: 1 }, { itemId: itemIds.milk, quantity: 1 }], stock: 40 },
];

const dummyOffers: Omit<Offer, 'id'>[] = [
    { imageUrl: 'https://res.cloudinary.com/dolmzcken/image/upload/v1757024340/g4h4i4j4k4l4m4n4o4p4.png', title: 'خصم 15% على كل المشروبات!', expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), callToAction: 'تسوق الآن', discount: { type: 'percentage', value: 15, appliesTo: 'category', target: 'مشروبات' } },
    { imageUrl: 'https://res.cloudinary.com/dolmzcken/image/upload/v1757024391/q4r4s4t4u4v4w4x4y4z4.png', title: 'وفر 500 ج.س على سلة الفطور', expiryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), callToAction: 'اطلبها الآن', discount: { type: 'fixed', value: 500, appliesTo: 'product', target: bundleIds.breakfast } },
];

const dummyDrivers: Omit<Driver, 'id'>[] = [
    { name: 'أحمد علي', phone: '+249911111111', status: 'Available' },
    { name: 'فاطمة عمر', phone: '+249922222222', status: 'Offline' },
];

// FIX: Update Firestore type to compat version.
export const seedDatabase = async (db: firebase.firestore.Firestore) => {
    // Check if data already exists to prevent re-seeding
    // FIX: Refactor Firestore query to use v8 compat syntax.
    const categoriesCheck = await db.collection('categories').limit(1).get();
    if (!categoriesCheck.empty) {
        console.log("Database already contains data. Skipping seed process.");
        return;
    }

    console.log("Database appears to be empty. Seeding with dummy data...");
    // FIX: Refactor writeBatch call to use v8 compat syntax.
    const batch = db.batch();

    // Add Categories
    dummyCategories.forEach(data => {
        // FIX: Refactor doc creation to use v8 compat syntax.
        const docRef = db.collection('categories').doc();
        batch.set(docRef, data);
    });

    // Add Suppliers
    dummySuppliers.forEach(data => {
        const { id, ...supplierData } = data;
        // FIX: Refactor doc creation to use v8 compat syntax.
        const docRef = db.collection('suppliers').doc(id);
        batch.set(docRef, supplierData);
    });

    // Add Items
    dummyItems.forEach(item => {
        const { id, ...itemData } = item;
        // FIX: Refactor doc creation to use v8 compat syntax.
        const docRef = db.collection('items').doc(id);
        batch.set(docRef, itemData);
    });

    // Add Extras
    dummyExtras.forEach(extra => {
        const { id, ...extraData } = extra;
        // FIX: Refactor doc creation to use v8 compat syntax.
        const docRef = db.collection('extras').doc(id);
        batch.set(docRef, extraData);
    });

    // Add Bundles
    dummyBundles.forEach(bundle => {
        const { id, ...bundleData } = bundle;
        // FIX: Refactor doc creation to use v8 compat syntax.
        const docRef = db.collection('bundles').doc(id);
        batch.set(docRef, bundleData);
    });

    // Add Offers
    dummyOffers.forEach(data => {
        // FIX: Refactor doc creation to use v8 compat syntax.
        const docRef = db.collection('offers').doc();
        batch.set(docRef, data);
    });

    // Add Drivers
    dummyDrivers.forEach(data => {
        // FIX: Refactor doc creation to use v8 compat syntax.
        const docRef = db.collection('drivers').doc();
        batch.set(docRef, data);
    });

    try {
        await batch.commit();
        console.log("Dummy data successfully seeded to Firestore.");
    } catch (error) {
        console.error("Error seeding database:", error);
    }
};