// Seed data ported from the frontend's src/data/mockData.js, so the real backend starts out
// showing the same catalog the mock API did.

export const unsplash = (id, w = 700) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const categories = [
  {
    key: 'textiles',
    name: 'Textiles',
    icon: 'M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z',
    img: unsplash('photo-1523381210434-271e8be1f52b', 200),
  },
  {
    key: 'surgical',
    name: 'Surgical Instruments',
    icon: 'M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2',
    img: unsplash('photo-1583911860205-72f8ac8ddcbe', 200),
  },
  {
    key: 'leather',
    name: 'Leather Goods',
    icon: 'M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42zM7.5 7.5h.01',
    img: unsplash('photo-1473188588951-666fce8e7c68', 200),
  },
  {
    key: 'sports',
    name: 'Sports Goods',
    icon: 'M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z',
    img: unsplash('photo-1575361204480-aadea25e6e68', 200),
  },
  {
    key: 'rice',
    name: 'Rice & Grains',
    icon: 'M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0',
    img: unsplash('photo-1586201375761-83865001e31c', 200),
  },
  {
    key: 'electronics',
    name: 'Electronics',
    icon: 'M6 6h12v12H6zM10 10h4v4h-4zM9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2',
    img: unsplash('photo-1504148455328-c376907d081c', 200),
  },
  {
    key: 'packaging',
    name: 'Packaging',
    icon: 'M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM3.3 7l8.7 5 8.7-5M12 22V12',
    img: unsplash('photo-1553413077-190dd305871c', 200),
  },
  {
    key: 'hardware',
    name: 'Hardware & Tools',
    icon: 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z',
    img: unsplash('photo-1607166452427-7e4477079cb9', 200),
  },
];

export const mobileCategories = [
  { key: 'textiles', name: 'Textiles', fullName: 'Textiles & Fabrics', img: unsplash('photo-1523381210434-271e8be1f52b', 200) },
  { key: 'surgical', name: 'Surgical', fullName: 'Surgical Instruments', img: unsplash('photo-1583911860205-72f8ac8ddcbe', 200) },
  { key: 'leather', name: 'Leather', fullName: 'Leather Goods', img: unsplash('photo-1473188588951-666fce8e7c68', 200) },
  { key: 'sports', name: 'Sports', fullName: 'Sports Goods', img: unsplash('photo-1575361204480-aadea25e6e68', 200) },
  { key: 'rice', name: 'Rice & Grains', fullName: 'Rice & Grains', img: unsplash('photo-1586201375761-83865001e31c', 200) },
  { key: 'hardware', name: 'Hardware', fullName: 'Hardware & Tools', img: unsplash('photo-1504148455328-c376907d081c', 200) },
];

export const mobileTabs = [
  { key: 'aimode', label: 'B2B', banner: 'B2B: describe what you need in plain words and we’ll match suppliers for you.' },
  { key: 'spotlight', label: 'Spotlight', banner: null },
  { key: 'worldwide', label: 'Worldwide', banner: 'Worldwide: browsing verified sellers across all 190+ countries.' },
  { key: 'freeshipping', label: 'Free Shipping', banner: 'Free Shipping: showing products eligible for free shipping on your first order.' },
];

export const products = [
  { id: 'cotton-twill-fabric', name: 'Cotton Twill Fabric 280 GSM', seller: 'Anwar Textile Mills', location: 'Faisalabad, Pakistan', category: 'Textiles & Fabrics', rating: '4.8', price: 'Rs 670', moq: '500m', unit: 'metre', badge: 'Best seller', stock: 2400, img: unsplash('photo-1523381210434-271e8be1f52b') },
  { id: 'surgical-instrument-set', name: 'Stainless Surgical Instrument Set', seller: 'Sialkot Surgical Co.', location: 'Sialkot, Pakistan', category: 'Surgical Instruments', rating: '4.9', price: 'Rs 2,480', moq: '100pc', unit: 'set', badge: 'Top rated', stock: 340, img: unsplash('photo-1583911860205-72f8ac8ddcbe') },
  { id: 'leather-work-gloves', name: 'Full-Grain Leather Work Gloves', seller: 'Karachi Leatherworks', location: 'Karachi, Pakistan', category: 'Leather Goods', rating: '4.7', price: 'Rs 865', moq: '300pr', unit: 'pair', badge: 'Verified', stock: 980, img: unsplash('photo-1473188588951-666fce8e7c68') },
  { id: 'match-grade-footballs', name: 'Match-Grade Footballs', seller: 'Star Sports Mfg.', location: 'Sialkot, Pakistan', category: 'Sports Goods', rating: '4.8', price: 'Rs 1,560', moq: '200pc', unit: 'piece', badge: 'Hot', stock: 18, img: unsplash('photo-1575361204480-aadea25e6e68') },
  { id: 'corrugated-shipping-boxes', name: 'Corrugated Shipping Boxes', seller: 'PakPack Industries', location: 'Lahore, Pakistan', category: 'Packaging', rating: '4.6', price: 'Rs 340', moq: '1000pc', unit: 'piece', badge: 'Verified', stock: 5200, img: unsplash('photo-1607166452427-7e4477079cb9') },
  { id: 'hand-tools-hardware-set', name: 'Hand Tools & Hardware Set', seller: 'Gujranwala Metals', location: 'Gujranwala, Pakistan', category: 'Hardware & Tools', rating: '4.7', price: 'Rs 1,120', moq: '150pc', unit: 'set', badge: 'Verified', stock: 610, img: unsplash('photo-1504148455328-c376907d081c') },
  { id: 'basmati-rice-25kg', name: 'Basmati Rice 25kg Bags', seller: 'Al-Barkat Rice Mills', location: 'Sheikhupura, Pakistan', category: 'Rice & Grains', rating: '4.7', price: 'Rs 3,200', moq: '50bag', unit: 'bag', badge: 'Trending', stock: 240, img: unsplash('photo-1586201375761-83865001e31c') },
  { id: 'denim-fabric-rolls', name: 'Denim Fabric Rolls', seller: 'Faisalabad Denim Co.', location: 'Faisalabad, Pakistan', category: 'Textiles & Fabrics', rating: '4.5', price: 'Rs 590', moq: '400m', unit: 'metre', badge: 'Trending', stock: 0, img: unsplash('photo-1565084888279-aca607ecce0c') },
  { id: 'warehouse-racking-systems', name: 'Warehouse Racking Systems', seller: 'PakPack Industries', location: 'Lahore, Pakistan', category: 'Hardware & Tools', rating: '4.6', price: 'Rs 8,400', moq: '10set', unit: 'set', badge: 'Verified', stock: 42, img: unsplash('photo-1553413077-190dd305871c') },
];

const VARIANT_IMAGE_IDS = [
  'photo-1523381210434-271e8be1f52b',
  'photo-1620799140408-edc6dcb6d633',
  'photo-1489987707025-afc232f7ea0f',
  'photo-1441986300917-64674bd600d8',
];
const VARIANT_NAMES = ['Classic White', 'Charcoal Grey', 'Deep Forest Green', 'Sandstone Beige'];
const DISCOUNT_PERCENTS = [12, 18, 22, 15, 20, 10, 25, 8, 14];

products.forEach((product, i) => {
  product.discountPercent = DISCOUNT_PERCENTS[i % DISCOUNT_PERCENTS.length];
  product.variants = VARIANT_NAMES.map((name, vi) => ({
    id: `${product.id}-var-${vi + 1}`,
    name,
    img: unsplash(VARIANT_IMAGE_IDS[vi % VARIANT_IMAGE_IDS.length], 200),
  }));
});

export const trendingProductIds = ['cotton-twill-fabric', 'surgical-instrument-set', 'leather-work-gloves', 'match-grade-footballs'];

export const spotlightNear = [
  { rank: 1, distance: '12 km away', shipping: 'Rs 450 · 2 days', productId: 'cotton-twill-fabric' },
  { rank: 2, distance: '38 km away', shipping: 'Rs 700 · 3 days', productId: 'corrugated-shipping-boxes' },
  { rank: 3, distance: '90 km away', shipping: 'Rs 990 · 4 days', productId: 'hand-tools-hardware-set' },
];

export const spotlightTrend = [
  { growth: '38%', productId: 'basmati-rice-25kg' },
  { growth: '24%', productId: 'denim-fabric-rolls' },
  { growth: '19%', productId: 'warehouse-racking-systems' },
  { growth: '12%', productId: 'match-grade-footballs' },
];

export const SELLER_SEED_META = {
  'Anwar Textile Mills': { verified: true, followerCount: 1240, responseRate: 97 },
  'Karachi Leatherworks': { verified: true, followerCount: 860, responseRate: 95 },
  'PakPack Industries': { verified: true, followerCount: 640, responseRate: 93 },
  'Sialkot Surgical Co.': { verified: false, followerCount: 410, responseRate: 89 },
  'Star Sports Mfg.': { verified: false, followerCount: 520, responseRate: 91 },
  'Gujranwala Metals': { verified: false, followerCount: 310, responseRate: 88 },
  'Al-Barkat Rice Mills': { verified: false, followerCount: 275, responseRate: 90 },
  'Faisalabad Denim Co.': { verified: false, followerCount: 380, responseRate: 87 },
};

export const DEMO_USERS = [
  {
    role: 'buyer',
    email: 'buyer@falsafahtot.com',
    phone: '+92 300 0000000',
    password: 'password123',
    companyName: 'Al-Karam Traders',
    country: 'Pakistan',
  },
  {
    role: 'seller',
    email: 'seller@falsafahtot.com',
    phone: '+92 300 1111111',
    password: 'password123',
    companyName: 'Anwar Textile Mills',
    country: 'Pakistan',
    category: 'Textiles & Fabrics',
    sellerType: 'individual',
    address: 'Plot 14, Industrial Estate, Faisalabad, Pakistan',
    cnicNumber: '3520112345671',
    cnicStatus: 'approved',
  },
  {
    role: 'admin',
    email: 'admin@falsafahtot.com',
    phone: '+92 300 9999999',
    password: 'password123',
    companyName: 'Falsafah Tot HQ',
    country: 'Pakistan',
  },
];

export const DEMO_SELLER_PRODUCTS = [
  {
    ownerEmail: 'seller@falsafahtot.com',
    name: 'Cotton Twill Fabric 280 GSM',
    category: 'Textiles & Fabrics',
    description: 'Export-grade 280 GSM cotton twill, pre-shrunk and dyed to order. Popular for workwear, uniforms, and heavy-duty garment lining. Available in standard and custom widths.',
    sku: 'TEX-1001',
    price: 670,
    unit: 'metre',
    moq: '500m',
    stock: 2400,
    status: 'active',
    images: [unsplash('photo-1523381210434-271e8be1f52b'), unsplash('photo-1620799140408-edc6dcb6d633'), unsplash('photo-1489987707025-afc232f7ea0f')],
    daysAgo: 12,
  },
  {
    ownerEmail: 'seller@falsafahtot.com',
    name: 'Denim Fabric Rolls',
    category: 'Textiles & Fabrics',
    description: 'Mid-weight 12oz denim, indigo-dyed, sold in full rolls. Suitable for apparel and accessories manufacturing.',
    sku: 'TEX-1002',
    price: 590,
    unit: 'metre',
    moq: '400m',
    stock: 0,
    status: 'active',
    images: [unsplash('photo-1565084888279-aca607ecce0c')],
    daysAgo: 6,
  },
  {
    ownerEmail: 'seller@falsafahtot.com',
    name: 'Organic Cotton Canvas Roll',
    category: 'Textiles & Fabrics',
    description: '',
    sku: 'TEX-1003',
    price: 810,
    unit: 'metre',
    moq: '250m',
    stock: 640,
    status: 'draft',
    images: [unsplash('photo-1620799140408-edc6dcb6d633'), unsplash('photo-1441986300917-64674bd600d8')],
    daysAgo: 2,
  },
];

export const DEMO_SELLER_ORDERS = [
  { ownerEmail: 'seller@falsafahtot.com', buyerCompany: 'Al-Karam Traders', buyerCountry: 'Pakistan', productName: 'Cotton Twill Fabric 280 GSM', qty: 800, unitPrice: 670, status: 'Pending', daysAgo: 1 },
  { ownerEmail: 'seller@falsafahtot.com', buyerCompany: 'Gulistan Sourcing Co.', buyerCountry: 'United Arab Emirates', productName: 'Cotton Twill Fabric 280 GSM', qty: 2200, unitPrice: 583, status: 'Processing', daysAgo: 3 },
  { ownerEmail: 'seller@falsafahtot.com', buyerCompany: 'Nordic Trade House', buyerCountry: 'Sweden', productName: 'Denim Fabric Rolls', qty: 400, unitPrice: 590, status: 'Shipped', daysAgo: 6 },
  { ownerEmail: 'seller@falsafahtot.com', buyerCompany: 'Redwood Imports LLC', buyerCountry: 'United States', productName: 'Cotton Twill Fabric 280 GSM', qty: 500, unitPrice: 670, status: 'Delivered', daysAgo: 14 },
  { ownerEmail: 'seller@falsafahtot.com', buyerCompany: 'Al-Karam Traders', buyerCountry: 'Pakistan', productName: 'Denim Fabric Rolls', qty: 150, unitPrice: 590, status: 'Cancelled', daysAgo: 20 },
];
