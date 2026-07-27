import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Seller } from '../models/Seller.js';
import { Product } from '../models/Product.js';
import { Category, MobileTab } from '../models/Category.js';
import { SpotlightEntry } from '../models/SpotlightEntry.js';
import { SellerProduct } from '../models/SellerProduct.js';
import { SellerOrder } from '../models/SellerOrder.js';
import {
  categories,
  mobileCategories,
  mobileTabs,
  products,
  trendingProductIds,
  spotlightNear,
  spotlightTrend,
  SELLER_SEED_META,
  DEMO_USERS,
  DEMO_SELLER_PRODUCTS,
  DEMO_SELLER_ORDERS,
} from './data.js';

async function seed() {
  await connectDB();

  console.log('Clearing existing catalog/demo data...');
  await Promise.all([
    Category.deleteMany({}),
    MobileTab.deleteMany({}),
    SpotlightEntry.deleteMany({}),
    Product.deleteMany({}),
    Seller.deleteMany({}),
    User.deleteMany({}),
    SellerProduct.deleteMany({}),
    SellerOrder.deleteMany({}),
  ]);

  console.log('Seeding categories & mobile tabs...');
  await Category.insertMany(categories.map((c, i) => ({ kind: 'category', order: i, ...c })));
  await Category.insertMany(mobileCategories.map((c, i) => ({ kind: 'mobile', order: i, ...c })));
  await MobileTab.insertMany(mobileTabs.map((t, i) => ({ order: i, ...t })));

  console.log('Seeding sellers directory...');
  const sellerNames = [...new Set(products.map((p) => p.seller))];
  const sellerByName = new Map();
  for (const name of sellerNames) {
    const meta = SELLER_SEED_META[name] || { verified: false, followerCount: 0, responseRate: 90 };
    const sellerDoc = await Seller.create({ name, ...meta });
    sellerByName.set(name, sellerDoc);
  }

  console.log('Seeding product catalog...');
  const productDocs = {};
  for (const p of products) {
    const sellerDoc = sellerByName.get(p.seller);
    const doc = await Product.create({
      _id: p.id,
      name: p.name,
      sellerId: sellerDoc._id,
      seller: p.seller,
      location: p.location,
      category: p.category,
      rating: p.rating,
      price: p.price,
      moq: p.moq,
      unit: p.unit,
      badge: p.badge,
      stock: p.stock,
      img: p.img,
      images: p.images,
      discountPercent: p.discountPercent,
      variants: p.variants,
      trendingOrder: trendingProductIds.includes(p.id) ? trendingProductIds.indexOf(p.id) : null,
      description: p.description,
      specifications: p.specifications,
      reviews: p.reviews,
    });
    productDocs[p.id] = doc;
  }

  console.log('Seeding spotlight rails...');
  await SpotlightEntry.insertMany(
    spotlightNear.map((e, i) => ({ kind: 'near', order: i, rank: e.rank, distance: e.distance, shipping: e.shipping, productId: e.productId }))
  );
  await SpotlightEntry.insertMany(
    spotlightTrend.map((e, i) => ({ kind: 'trending', order: i, growth: e.growth, productId: e.productId }))
  );

  console.log('Seeding demo users (buyer/seller/admin)...');
  const userByEmail = new Map();
  for (const demo of DEMO_USERS) {
    const passwordHash = await bcrypt.hash(demo.password, 10);
    const isSeller = demo.role === 'seller';
    const sellerDoc = isSeller ? sellerByName.get(demo.companyName) : null;
    const user = await User.create({
      role: demo.role,
      email: demo.email,
      phone: demo.phone,
      passwordHash,
      companyName: demo.companyName,
      country: demo.country,
      category: demo.category || null,
      address: demo.address || null,
      sellerId: sellerDoc?._id || null,
      sellerType: isSeller ? demo.sellerType || 'individual' : null,
      cnicNumber: demo.cnicNumber || null,
      cnicStatus: isSeller ? demo.cnicStatus || 'pending' : null,
    });
    userByEmail.set(demo.email, user);
  }
  // Demo admin approved the demo seller's KYC, so the seller portal isn't gated in a fresh seed.
  const demoSeller = userByEmail.get('seller@falsafahtot.com');
  const demoAdmin = userByEmail.get('admin@falsafahtot.com');
  demoSeller.reviewedBy = demoAdmin._id;
  demoSeller.reviewedAt = new Date();
  await demoSeller.save();

  console.log('Seeding demo seller listings & orders...');
  const now = Date.now();
  const day = 86400000;
  for (const p of DEMO_SELLER_PRODUCTS) {
    const owner = userByEmail.get(p.ownerEmail);
    await SellerProduct.create({
      sellerId: owner._id,
      name: p.name,
      category: p.category,
      description: p.description,
      sku: p.sku,
      price: p.price,
      unit: p.unit,
      moq: p.moq,
      stock: p.stock,
      status: p.status,
      images: p.images,
      img: p.images[0],
      createdAt: new Date(now - p.daysAgo * day),
    });
  }
  for (const o of DEMO_SELLER_ORDERS) {
    const owner = userByEmail.get(o.ownerEmail);
    await SellerOrder.create({
      sellerId: owner._id,
      buyerCompany: o.buyerCompany,
      buyerCountry: o.buyerCountry,
      productName: o.productName,
      qty: o.qty,
      unitPrice: o.unitPrice,
      status: o.status,
      placedAt: new Date(now - o.daysAgo * day),
    });
  }

  console.log('Seed complete. Demo accounts (password: password123):');
  console.log('  buyer@falsafahtot.com  (buyer)');
  console.log('  seller@falsafahtot.com (seller, KYC approved)');
  console.log('  admin@falsafahtot.com  (admin)');
  console.log('OTP for all sign-in/sign-up flows is currently fixed to: 123456');

  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
