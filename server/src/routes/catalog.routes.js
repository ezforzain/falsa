import { Router } from 'express';
import { Product } from '../models/Product.js';
import { Category, MobileTab } from '../models/Category.js';
import { SpotlightEntry } from '../models/SpotlightEntry.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

function serializeProduct(doc) {
  const p = doc.toObject();
  const seller = p.sellerId; // populated
  return {
    ...p,
    id: p._id,
    sellerId: seller?._id ?? p.sellerId,
    verified: seller?.verified || false,
  };
}

router.get(
  '/categories',
  asyncHandler(async (_req, res) => {
    const categories = await Category.find({ kind: 'category' }).sort({ order: 1 });
    res.json({ categories: categories.map(({ key, name, icon, img }) => ({ key, name, icon, img })) });
  })
);

router.get(
  '/categories/mobile',
  asyncHandler(async (_req, res) => {
    const categories = await Category.find({ kind: 'mobile' }).sort({ order: 1 });
    res.json({ categories: categories.map(({ key, name, fullName, img }) => ({ key, name, fullName, img })) });
  })
);

router.get(
  '/mobile-tabs',
  asyncHandler(async (_req, res) => {
    const tabs = await MobileTab.find().sort({ order: 1 });
    res.json({ tabs: tabs.map(({ key, label, banner }) => ({ key, label, banner })) });
  })
);

router.get(
  '/products',
  asyncHandler(async (req, res) => {
    const { category, q } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (q) {
      const re = new RegExp(String(q).trim().replace(/\s+/g, ' '), 'i');
      filter.$or = [{ name: re }, { category: re }, { seller: re }];
    }
    const products = await Product.find(filter).populate('sellerId', 'verified');
    res.json({ products: products.map(serializeProduct) });
  })
);

router.get(
  '/products/trending',
  asyncHandler(async (_req, res) => {
    const products = await Product.find({ trendingOrder: { $ne: null } })
      .sort({ trendingOrder: 1 })
      .populate('sellerId', 'verified');
    res.json({ products: products.map(serializeProduct) });
  })
);

router.get(
  '/products/:id',
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id).populate('sellerId', 'verified');
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    res.json({ product: serializeProduct(product) });
  })
);

router.get(
  '/spotlight/near',
  asyncHandler(async (_req, res) => {
    const entries = await SpotlightEntry.find({ kind: 'near' })
      .sort({ order: 1 })
      .populate({ path: 'productId', populate: { path: 'sellerId', select: 'verified' } });
    res.json({
      items: entries.map((e) => ({
        rank: e.rank,
        distance: e.distance,
        shipping: e.shipping,
        product: serializeProduct(e.productId),
      })),
    });
  })
);

router.get(
  '/spotlight/trending',
  asyncHandler(async (_req, res) => {
    const entries = await SpotlightEntry.find({ kind: 'trending' })
      .sort({ order: 1 })
      .populate({ path: 'productId', populate: { path: 'sellerId', select: 'verified' } });
    res.json({
      items: entries.map((e) => ({
        growth: e.growth,
        product: serializeProduct(e.productId),
      })),
    });
  })
);

export default router;
