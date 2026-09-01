import { Router } from 'express';
import { Product } from '../models/Product.js';
import { Category, MobileTab } from '../models/Category.js';
import { SpotlightEntry } from '../models/SpotlightEntry.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { normalizeHashtag, computeTagPopularity, topTagsFor, bumpHashtagStats } from '../utils/hashtags.js';
import { suggestHashtags } from '../utils/hashtagSuggest.js';
import { rankOnly } from '../utils/marketplaceRanking.js';

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
    // Atomically bump the view counter on every load and use the post-increment doc, rather than
    // a separate fire-and-forget update, so the count shown to the buyer (and later to the seller,
    // see GET /seller/products) is never one view behind.
    const product = await Product.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }, { new: true }).populate(
      'sellerId',
      'verified'
    );
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    const serialized = serializeProduct(product);

    // YouTube-style "max 3 hashtags under the product" — pick the product's own tags
    // that currently have the most real popularity signal (see utils/hashtags.js),
    // rather than always showing whichever 3 the seller happened to type first.
    if (Array.isArray(serialized.tags) && serialized.tags.length > 0) {
      const popularity = await computeTagPopularity(serialized.tags);
      serialized.topTags = topTagsFor(serialized.tags, popularity);
      // "Product views" trending signal — fire-and-forget, never blocks the response.
      bumpHashtagStats(serialized.tags, 'views');
    } else {
      serialized.topTags = [];
    }

    res.json({ product: serialized });
  })
);

// YouTube-style "#hashtag as you type" suggestions: for each tag starting with the query,
// how many products carry it and how many distinct sellers have used it — drives the live
// suggestion dropdown in the seller's product form (see HashtagSuggestions.jsx). Popularity
// (product count) is real, derived straight from the public catalog, not seeded/faked.
router.get(
  '/hashtags',
  asyncHandler(async (req, res) => {
    const q = String(req.query.q || '')
      .trim()
      .replace(/^#/, '');
    if (!q) return res.json({ hashtags: [] });
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const hashtags = await Product.aggregate([
      { $unwind: '$tags' },
      { $match: { tags: { $regex: `^${escaped}`, $options: 'i' } } },
      { $group: { _id: { $toLower: '$tags' }, tag: { $first: '$tags' }, productCount: { $sum: 1 }, sellers: { $addToSet: '$sellerId' } } },
      { $project: { _id: 0, tag: 1, productCount: 1, sellerCount: { $size: '$sellers' } } },
      { $sort: { productCount: -1 } },
      { $limit: 8 },
    ]);
    res.json({ hashtags });
  })
);

// Rule-based AI hashtag suggestions from whatever the seller has typed so far (title/
// category/description) — see utils/hashtagSuggest.js. `exclude` (comma-separated) is
// the seller's current tag list, so already-added tags are never suggested again.
router.get(
  '/hashtags/suggest',
  asyncHandler(async (req, res) => {
    const { title, description, category } = req.query;
    const exclude = String(req.query.exclude || '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const suggestions = suggestHashtags({ title, description, category, exclude });
    res.json({ suggestions });
  })
);

// Hashtag discovery/results page: every active product carrying this tag, ranked by
// the same relevance/popularity/availability signal the marketplace tabs use (see
// rankOnly in marketplaceRanking.js) rather than plain recency — never shows products
// that don't actually carry the tag.
router.get(
  '/hashtags/:tag',
  asyncHandler(async (req, res) => {
    const tag = normalizeHashtag(req.params.tag);
    if (!tag) return res.json({ tag: req.params.tag, products: [] });

    const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const products = await Product.find({ tags: { $regex: `^${escaped}$`, $options: 'i' } }).populate(
      'sellerId',
      'verified'
    );
    const ranked = rankOnly(products);
    // "Searches/clicks" trending signal — a hashtag results page load counts as one.
    bumpHashtagStats([tag], 'searches');
    res.json({ tag, products: ranked.map(serializeProduct) });
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
