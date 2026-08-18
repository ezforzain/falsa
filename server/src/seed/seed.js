import 'dotenv/config';
import { connectDB } from '../config/db.js';
import { Seller } from '../models/Seller.js';
import { Product } from '../models/Product.js';
import { Category, MobileTab } from '../models/Category.js';
import { SpotlightEntry } from '../models/SpotlightEntry.js';
import { parseMoqNumber } from '../utils/moq.js';
import {
  categories,
  mobileCategories,
  mobileTabs,
  products,
  trendingProductIds,
  spotlightNear,
  spotlightTrend,
  SELLER_SEED_META,
} from './data.js';

async function seed() {
  await connectDB();

  console.log('Clearing existing catalog data...');
  await Promise.all([
    Category.deleteMany({}),
    MobileTab.deleteMany({}),
    SpotlightEntry.deleteMany({}),
    Product.deleteMany({}),
    Seller.deleteMany({}),
  ]);

  console.log('Seeding categories & mobile tabs...');
  await Category.insertMany(categories.map((c, i) => ({ kind: 'category', order: i, ...c })));
  await Category.insertMany(mobileCategories.map((c, i) => ({ kind: 'mobile', order: i, ...c })));
  await MobileTab.insertMany(mobileTabs.map((t, i) => ({ order: i, ...t })));

  console.log('Seeding sellers directory...');
  const sellerNames = [...new Set(products.map((p) => p.seller))];
  const sellerByName = new Map();
  for (const name of sellerNames) {
    const meta = SELLER_SEED_META[name] || { verified: false, officialStore: false, country: null, followerCount: 0, responseRate: 90 };
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
      priceValue: Number(String(p.price).replace(/[^\d.]/g, '')) || null,
      moq: p.moq,
      moqValue: parseMoqNumber(p.moq),
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
      sold: p.sold || 0,
      spotlight: p.spotlight || false,
      spotlightType: p.spotlightType || 'featured',
      freeShipping: p.freeShipping !== false,
      worldwideFreeShipping: p.worldwideFreeShipping || false,
      b2bEnabled: p.b2bEnabled || false,
      sellerCountry: sellerDoc.country || null,
      sellerVerified: sellerDoc.verified || false,
      sellerOfficialStore: sellerDoc.officialStore || false,
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

  console.log('Seed complete — catalog, categories, and sellers directory populated.');
  console.log('No user accounts were seeded — sign up through the app to create one.');

  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
