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

const reachOf = (doc) => {
  const n = Number(doc.reachBoost);
  return Number.isFinite(n) && n > 0 ? n : 1;
};

// Stable reorder by the admin reach multiplier (1x–10x, see Product.reachBoost), highest first.
// Callers pass a list already in their natural order (newest first / curated) so products with
// an equal boost keep that order — a boost only ever pulls a product forward, never shuffles ties.
const byReach = (products) => products.slice().sort((a, b) => reachOf(b) - reachOf(a));

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
    // Newest first — otherwise a just-added product sits wherever Mongo's natural order happens
    // to place it (this collection keys `_id` off a human-readable slug, not an ObjectId, so
    // natural order isn't creation order) and can look like it "didn't show up".
    const products = await Product.find(filter).sort({ createdAt: -1 }).populate('sellerId', 'verified');
    res.json({ products: byReach(products).map(serializeProduct) });
  })
);

router.get(
  '/products/trending',
  asyncHandler(async (_req, res) => {
    // Admin/seller product creation has no UI for setting `trendingOrder` (unlike `spotlight`,
    // which has an explicit admin toggle) — it's a hand-curated ranking boost, not a publish gate.
    // Requiring it here silently hid every newly created product from the homepage's default
    // section. Curated items still lead, in their curated order; everything else follows, newest
    // first, so nothing needs manual curation just to be visible.
    const [curated, rest] = await Promise.all([
      Product.find({ trendingOrder: { $ne: null } }).sort({ trendingOrder: 1 }).populate('sellerId', 'verified'),
      Product.find({ trendingOrder: null }).sort({ createdAt: -1 }).populate('sellerId', 'verified'),
    ]);
    // Curated items keep their hand-set order; everything else is ordered by reach then recency.
    res.json({ products: [...curated, ...byReach(rest)].map(serializeProduct) });
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
  '/spotlight/featured-section',
  asyncHandler(async (req, res) => {
    const { category } = req.query;

    // Rank is computed against the *whole* category (not just spotlighted items), so a "TOP 3"
    // badge means what it says rather than only counting other admin-picked products.
    const allInCategory = await Product.find({}, 'category sold').lean();
    const soldByCategory = new Map();
    for (const p of allInCategory) {
      const list = soldByCategory.get(p.category) || [];
      list.push(p.sold || 0);
      soldByCategory.set(p.category, list);
    }
    for (const list of soldByCategory.values()) list.sort((a, b) => b - a);

    const filter = { spotlight: true };
    if (category) filter.category = category;
    const products = await Product.find(filter).populate('sellerId', 'verified');

    const items = products.map((doc) => {
      const product = serializeProduct(doc);
      const ranked = soldByCategory.get(product.category) || [];
      const rank = ranked.indexOf(product.sold || 0) + 1;
      return {
        type: product.spotlightType || 'featured',
        rankInCategory: rank > 0 && rank <= 10 ? rank : null,
        product,
      };
    });
    items.sort((a, b) => (a.type === b.type ? (b.product.sold || 0) - (a.product.sold || 0) : a.type === 'featured' ? -1 : 1));

    const categories = [...new Set(products.map((p) => p.category))].sort();

    res.json({ items, categories });
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
