import { Router } from 'express';
import { Product } from '../models/Product.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { buildMarketplaceFilter, toMongoFilter } from '../utils/marketplaceQuery.js';
import { rankAndBlendByCountry, rankOnly } from '../utils/marketplaceRanking.js';

const router = Router();

const DEFAULT_LIMIT = 60;

function serializeProduct(doc) {
  const p = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  return { ...p, id: p._id, verified: p.sellerVerified || false };
}

router.get(
  '/b2b',
  asyncHandler(async (req, res) => {
    const clauses = buildMarketplaceFilter(req.query);
    clauses.push({ b2bEnabled: true });
    const products = await Product.find(toMongoFilter(clauses)).lean();
    res.json({ products: rankOnly(products).map(serializeProduct) });
  })
);

router.get(
  '/spotlight',
  asyncHandler(async (req, res) => {
    const buyerCountry = req.query.buyerCountry ? String(req.query.buyerCountry) : null;
    const limit = Number(req.query.limit) || DEFAULT_LIMIT;
    const clauses = buildMarketplaceFilter(req.query);
    const products = await Product.find(toMongoFilter(clauses)).lean();
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
    const products = await Product.find(toMongoFilter(clauses)).lean();
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
    const products = await Product.find(toMongoFilter(clauses)).lean();
    res.json({ products: rankOnly(products).map(serializeProduct) });
  })
);

router.get(
  '/countries',
  asyncHandler(async (_req, res) => {
    const countries = await Product.distinct('sellerCountry', { sellerCountry: { $ne: null } });
    res.json({ countries: countries.sort() });
  })
);

export default router;
