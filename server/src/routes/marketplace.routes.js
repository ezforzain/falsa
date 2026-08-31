import { Router } from 'express';
import { Product } from '../models/Product.js';
import { FilterConfig, FILTER_SECTIONS } from '../models/FilterConfig.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { buildMarketplaceFilter, toMongoFilter } from '../utils/marketplaceQuery.js';
import { rankAndBlendByCountry, rankOnly, sortByOption, meetsRatingMin } from '../utils/marketplaceRanking.js';

const router = Router();

const DEFAULT_LIMIT = 60;

function serializeProduct(doc) {
  const p = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  return { ...p, id: p._id, verified: p.sellerVerified || false };
}

// Applies the shopper-picked sort (if any) or falls back to the section's normal ranking. Shared
// by all four marketplace endpoints so "explicit sort wins over ranking" can't drift between them.
function orderProducts(products, { sortBy, rank }) {
  const explicit = sortBy ? sortByOption(products, sortBy) : null;
  return explicit || rank();
}

function applyRatingFilter(products, ratingMin) {
  if (!Number.isFinite(ratingMin)) return products;
  return products.filter((p) => meetsRatingMin(p, ratingMin));
}

router.get(
  '/b2b',
  asyncHandler(async (req, res) => {
    const clauses = buildMarketplaceFilter(req.query);
    clauses.push({ b2bEnabled: true });
    const products = applyRatingFilter(await Product.find(toMongoFilter(clauses)).lean(), Number(req.query.ratingMin));
    const ordered = orderProducts(products, { sortBy: req.query.sortBy, rank: () => rankOnly(products) });
    res.json({ products: ordered.map(serializeProduct) });
  })
);

router.get(
  '/spotlight',
  asyncHandler(async (req, res) => {
    const buyerCountry = req.query.buyerCountry ? String(req.query.buyerCountry) : null;
    const limit = Number(req.query.limit) || DEFAULT_LIMIT;
    const clauses = buildMarketplaceFilter(req.query);
    const products = applyRatingFilter(await Product.find(toMongoFilter(clauses)).lean(), Number(req.query.ratingMin));

    const explicit = req.query.sortBy ? sortByOption(products, req.query.sortBy) : null;
    if (explicit) {
      return res.json({ products: explicit.slice(0, limit).map(serializeProduct), meta: { buyerCountry, sortBy: req.query.sortBy } });
    }
    const { products: blended, localCount, internationalCount } = rankAndBlendByCountry(products, buyerCountry, {
      localRatio: 0.7,
      limit,
    });
    res.json({
      products: blended.map(serializeProduct),
      meta: { buyerCountry, localCount, internationalCount },
    });
  })
);

router.get(
  '/worldwide',
  asyncHandler(async (req, res) => {
    const buyerCountry = req.query.buyerCountry ? String(req.query.buyerCountry) : null;
    const limit = Number(req.query.limit) || DEFAULT_LIMIT;
    const clauses = buildMarketplaceFilter(req.query);
    const products = applyRatingFilter(await Product.find(toMongoFilter(clauses)).lean(), Number(req.query.ratingMin));

    const explicit = req.query.sortBy ? sortByOption(products, req.query.sortBy) : null;
    if (explicit) {
      return res.json({ products: explicit.slice(0, limit).map(serializeProduct), meta: { buyerCountry, sortBy: req.query.sortBy } });
    }
    // Worldwide targets 80% international / 20% local — i.e. a 0.2 "local" ratio into the same
    // blend-with-backfill helper Spotlight uses with 0.7. When there's no international
    // inventory yet (today's seed data), this gracefully backfills to ~100% local rather than
    // returning nothing, per spec.
    const { products: blended, localCount, internationalCount } = rankAndBlendByCountry(products, buyerCountry, {
      localRatio: 0.2,
      limit,
    });
    res.json({
      products: blended.map(serializeProduct),
      meta: { buyerCountry, localCount, internationalCount },
    });
  })
);

router.get(
  '/free-shipping',
  asyncHandler(async (req, res) => {
    const buyerCountry = req.query.buyerCountry ? String(req.query.buyerCountry) : null;
    const clauses = buildMarketplaceFilter(req.query);
    clauses.push({ freeShipping: true });
    // Eligible when the seller ships free worldwide, OR ships free only within their own
    // country AND the buyer is in that same country — never a bare "has free shipping" boolean.
    clauses.push({ $or: [{ worldwideFreeShipping: true }, { sellerCountry: buyerCountry }] });
    const products = applyRatingFilter(await Product.find(toMongoFilter(clauses)).lean(), Number(req.query.ratingMin));
    const ordered = orderProducts(products, { sortBy: req.query.sortBy, rank: () => rankOnly(products) });
    res.json({ products: ordered.map(serializeProduct) });
  })
);

router.get(
  '/countries',
  asyncHandler(async (_req, res) => {
    const countries = await Product.distinct('sellerCountry', { sellerCountry: { $ne: null } });
    res.json({ countries: countries.sort() });
  })
);

// ---------- Filter panel config (admin-configurable, per section) ----------
// Public read side of server/src/models/FilterConfig.js — the storefront's filter panel
// (src/components/marketplace/MarketplaceFilters.jsx) fetches this once per section instead of
// hardcoding what to render. See admin.routes.js for the CRUD admins use to manage these.

const FILTER_LABELS = {
  category: 'Category',
  country: 'Country',
  priceRange: 'Price',
  moq: 'Max MOQ',
  verified: 'Verified Sellers',
  officialStore: 'Mall / Official Store',
  freeShipping: 'Free Shipping',
  rating: 'Rating',
  discount: 'On Sale',
  sortBy: 'Sort by',
};

// Starting point only — every field here stays fully admin-editable afterward (enable/disable,
// reorder, relabel) via the admin Filters tab. Not a hardcoded ceiling.
export const DEFAULT_FILTERS_BY_SECTION = {
  b2b: ['category', 'country', 'priceRange', 'moq', 'verified', 'officialStore', 'sortBy'],
  spotlight: ['category', 'country', 'priceRange', 'verified', 'officialStore', 'freeShipping', 'rating', 'discount', 'sortBy'],
  worldwide: ['category', 'country', 'priceRange', 'verified', 'officialStore', 'freeShipping', 'rating', 'discount', 'sortBy'],
  // No standalone "Free Shipping" toggle here — every product in this section is already
  // free-shipping-eligible for the buyer, so the toggle would be a no-op.
  freeshipping: ['category', 'country', 'priceRange', 'verified', 'officialStore', 'rating', 'discount', 'sortBy'],
};

// Lazily materializes a section's default rows the first time it's asked for — so existing
// deployments don't need a manual seed re-run, and a section with zero rows still shows a
// sensible starting panel instead of an empty one.
async function ensureSectionDefaults(section) {
  const existing = await FilterConfig.countDocuments({ section });
  if (existing > 0) return;
  const types = DEFAULT_FILTERS_BY_SECTION[section] || [];
  await FilterConfig.insertMany(
    types.map((type, order) => ({ section, type, label: FILTER_LABELS[type], enabled: true, order }))
  );
}

async function listOptions(type, section) {
  if (type === 'category') {
    const base = section === 'b2b' ? { b2bEnabled: true } : {};
    return (await Product.distinct('category', base)).filter(Boolean).sort();
  }
  if (type === 'country') {
    const base = section === 'b2b' ? { b2bEnabled: true, sellerCountry: { $ne: null } } : { sellerCountry: { $ne: null } };
    return (await Product.distinct('sellerCountry', base)).filter(Boolean).sort();
  }
  return undefined;
}

router.get(
  '/filters/:section',
  asyncHandler(async (req, res) => {
    const { section } = req.params;
    if (!FILTER_SECTIONS.includes(section)) return res.status(404).json({ message: 'Unknown marketplace section.' });
    await ensureSectionDefaults(section);
    const rows = await FilterConfig.find({ section, enabled: true }).sort({ order: 1 });
    const filters = await Promise.all(
      rows.map(async (row) => ({
        type: row.type,
        label: row.label,
        // Admin-curated list wins when set; otherwise derive live from real product data.
        options: row.options.length > 0 ? row.options : await listOptions(row.type, section),
      }))
    );
    res.json({ filters });
  })
);

export default router;
