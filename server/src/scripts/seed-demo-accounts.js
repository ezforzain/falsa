import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Seller } from '../models/Seller.js';
import { SellerProduct } from '../models/SellerProduct.js';
import { SellerOrder } from '../models/SellerOrder.js';
import { syncSellerProductToCatalog, removeSellerProductFromCatalog } from '../utils/publicCatalogSync.js';

// Provisions two real, login-capable accounts (real bcrypt password hash, real JWT session,
// real role-based access — nothing about auth itself is faked) purely so the "Login as Admin" /
// "Login as Seller" demo buttons on the sign-in page (see src/pages/AuthPage.jsx) have somewhere
// to actually sign into. Re-runnable: existing demo accounts/listings/orders are reset rather
// than duplicated, so this is safe to run again after a catalog reseed.
//
// Credentials here MUST match the DEMO_* fallbacks in src/pages/AuthPage.jsx — override both
// sides together via env if you change them (VITE_DEMO_* on the frontend, DEMO_* here).
const DEMO_ADMIN_EMAIL = process.env.DEMO_ADMIN_EMAIL || 'demo-admin@falsafah.com';
const DEMO_ADMIN_PASSWORD = process.env.DEMO_ADMIN_PASSWORD || 'Demo@Admin123';
const DEMO_SELLER_EMAIL = process.env.DEMO_SELLER_EMAIL || 'demo-seller@falsafah.com';
const DEMO_SELLER_PASSWORD = process.env.DEMO_SELLER_PASSWORD || 'Demo@Seller123';
const DEMO_SELLER_COMPANY = 'Falsafah Demo Trading Co.';

const DEMO_LISTINGS = [
  {
    name: 'Premium Cotton Twill Fabric',
    category: 'Textiles & Fabrics',
    description: 'Heavyweight cotton twill, dyed and finished in-house. Bulk rolls, custom widths on request.',
    price: 4.5,
    unit: 'per meter',
    moq: '500 meters',
    stock: 12000,
    b2bEnabled: true,
    freeShipping: true,
    img: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=700&q=80',
  },
  {
    name: 'Genuine Leather Wallet — Bifold',
    category: 'Leather Goods',
    description: 'Hand-stitched full-grain leather bifold wallet, private-label ready.',
    price: 8.9,
    unit: 'per piece',
    moq: '200 pieces',
    stock: 3400,
    b2bEnabled: true,
    freeShipping: true,
    img: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=700&q=80',
  },
  {
    name: 'Stainless Steel Kitchen Knife Set',
    category: 'Home & Kitchen',
    description: '5-piece forged stainless steel knife set with ergonomic handles.',
    price: 14.25,
    unit: 'per set',
    moq: '100 sets',
    stock: 1800,
    b2bEnabled: false,
    freeShipping: true,
    img: 'https://images.unsplash.com/photo-1593618998160-e34014e67546?auto=format&fit=crop&w=700&q=80',
  },
];

const DEMO_ORDERS = [
  { buyerCompany: 'Al-Karam Traders', buyerCountry: 'Pakistan', qty: 800, status: 'Delivered', daysAgo: 21 },
  { buyerCompany: 'Meridian Import Co.', buyerCountry: 'United States', qty: 250, status: 'Delivered', daysAgo: 14 },
  { buyerCompany: 'Nordic Retail Group', buyerCountry: 'Sweden', qty: 120, status: 'Shipped', daysAgo: 5 },
  { buyerCompany: 'Gulf Trading LLC', buyerCountry: 'United Arab Emirates', qty: 60, status: 'Processing', daysAgo: 2 },
  { buyerCompany: 'Riverside Wholesale', buyerCountry: 'Canada', qty: 30, status: 'Pending', daysAgo: 0 },
];

async function upsertUser({ email, password, patch }) {
  const passwordHash = await bcrypt.hash(password, 10);
  const existing = await User.findOne({ email });
  if (existing) {
    existing.set({ ...patch, passwordHash });
    await existing.save();
    return existing;
  }
  return User.create({ email, passwordHash, ...patch });
}

async function main() {
  await connectDB();

  console.log('Provisioning demo admin...');
  const admin = await upsertUser({
    email: DEMO_ADMIN_EMAIL,
    password: DEMO_ADMIN_PASSWORD,
    patch: {
      role: 'admin',
      companyName: 'Falsafah Admin (Demo)',
      phone: 'demo_admin_phone',
      country: 'Pakistan',
      emailVerified: true,
      status: 'active',
    },
  });

  console.log('Provisioning demo seller storefront + account...');
  const sellerDoc = await Seller.findOneAndUpdate(
    { name: DEMO_SELLER_COMPANY },
    {
      name: DEMO_SELLER_COMPANY,
      verified: true,
      officialStore: true,
      country: 'Pakistan',
      followerCount: 980,
      responseRate: 96,
      responseTime: 'Within 2 hours',
      description: 'A demo storefront used by the "Login as Seller" button — safe to explore, reset by re-running the demo seed script.',
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const seller = await upsertUser({
    email: DEMO_SELLER_EMAIL,
    password: DEMO_SELLER_PASSWORD,
    patch: {
      role: 'seller',
      companyName: DEMO_SELLER_COMPANY,
      phone: 'demo_seller_phone',
      country: 'Pakistan',
      address: '14 Industrial Estate, Karachi',
      sellerId: sellerDoc._id,
      sellerType: 'individual',
      cnicNumber: '0000000000000',
      cnicStatus: 'approved',
      emailVerified: true,
      status: 'active',
    },
  });

  console.log('Resetting demo seller listings...');
  const oldListings = await SellerProduct.find({ sellerId: seller._id });
  await Promise.all(oldListings.map((doc) => removeSellerProductFromCatalog(doc._id)));
  await SellerProduct.deleteMany({ sellerId: seller._id });

  for (const listing of DEMO_LISTINGS) {
    const doc = await SellerProduct.create({
      sellerId: seller._id,
      sku: `DEMO-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'active',
      images: [listing.img],
      ...listing,
    });
    // Mirrors what POST /api/seller/products does on a real create, so these listings are also
    // visible to buyers browsing the storefront — not just inside the seller's own dashboard.
    await syncSellerProductToCatalog(doc, seller);
  }

  console.log('Resetting demo seller orders...');
  await SellerOrder.deleteMany({ sellerId: seller._id });
  const listingDocs = await SellerProduct.find({ sellerId: seller._id });
  for (const order of DEMO_ORDERS) {
    const listing = listingDocs[Math.floor(Math.random() * listingDocs.length)];
    await SellerOrder.create({
      sellerId: seller._id,
      buyerCompany: order.buyerCompany,
      buyerCountry: order.buyerCountry,
      productName: listing.name,
      qty: order.qty,
      unitPrice: listing.price,
      status: order.status,
      placedAt: new Date(Date.now() - order.daysAgo * 24 * 60 * 60 * 1000),
    });
  }

  console.log('\nDemo accounts ready:');
  console.log(`  Admin  — ${DEMO_ADMIN_EMAIL} / ${DEMO_ADMIN_PASSWORD}`);
  console.log(`  Seller — ${DEMO_SELLER_EMAIL} / ${DEMO_SELLER_PASSWORD}`);
  process.exit(0);
}

main().catch((err) => {
  console.error('seed-demo-accounts failed:', err);
  process.exit(1);
});
