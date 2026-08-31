// Ranking + country-blend logic shared by the Spotlight (70/30) and Worldwide (20/80) marketplace
// tabs. Both are "rank a pool, then blend a local vs. international split with backfill so the
// section never goes empty" — the only difference between them is which side of the split gets
// the larger share, so one function serves both (see marketplace.routes.js).

// Small deterministic PRNG (mulberry32) — used only to rotate which same-score products lead the
// pool, so a fixed day doesn't always surface the exact same order, without behaving like true
// randomness that would make results feel inconsistent within one visit.
function mulberry32(seed) {
  let s = seed | 0;
  return function rand() {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function daySeed() {
  const now = new Date();
  const startOfYear = Date.UTC(now.getUTCFullYear(), 0, 0);
  return now.getUTCFullYear() * 1000 + Math.floor((now.getTime() - startOfYear) / 86400000);
}

function seededShuffle(items, seed) {
  const rand = mulberry32(seed);
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Composite score from real, already-available signals only — no fabricated sales/ratings.
function scoreProduct(p) {
  let score = 0;
  if (p.sellerVerified) score += 20;
  if (p.sellerOfficialStore) score += 10;
  // Admin/seller-promoted items (see PromotionRequest + the seller Promotions page) get a boost
  // here instead of being the section's only source of products — the promotion system still
  // matters, it's just one ranking input among several real signals now.
  if (p.spotlight) score += 25 + (p.spotlightType === 'sponsored' ? 5 : 0);
  const rating = Number.parseFloat(p.rating);
  if (Number.isFinite(rating)) score += rating * 5;
  const sold = Number(p.sold) || 0;
  score += Math.min(Math.log10(sold + 1) * 10, 30);
  const ageDays = (Date.now() - new Date(p.createdAt).getTime()) / 86400000;
  score += Math.max(0, 10 - ageDays / 30);
  // Admin reach multiplier (1x–10x, see Product.reachBoost) — applied last so it scales every
  // other signal at once, letting an admin lift or bury a product across the marketplace.
  const reach = Number(p.reachBoost);
  return score * (Number.isFinite(reach) && reach > 0 ? reach : 1);
}

// Ranks by score band (coarse, so near-ties rotate) with a seeded shuffle inside each band so
// repeat visits within a day see a stable order but different days surface different products.
function rankWithRotation(products) {
  const seed = daySeed();
  const bandWidth = 8;
  const bands = new Map();
  for (const p of products) {
    const band = Math.round(scoreProduct(p) / bandWidth);
    if (!bands.has(band)) bands.set(band, []);
    bands.get(band).push(p);
  }
  const orderedBands = [...bands.keys()].sort((a, b) => b - a);
  const ranked = [];
  for (const band of orderedBands) {
    ranked.push(...seededShuffle(bands.get(band), seed + band));
  }
  return ranked;
}

// Interleaves two already-ranked lists so the result reads as one mixed feed approximating
// `localRatio` local / `(1 - localRatio)` international, rather than one block then the other.
function interleaveByRatio(localItems, otherItems, localRatio) {
  const result = [];
  let li = 0;
  let oi = 0;
  while (li < localItems.length || oi < otherItems.length) {
    const wantLocalSoFar = Math.round((result.length + 1) * localRatio);
    if (li < wantLocalSoFar && li < localItems.length) {
      result.push(localItems[li]);
      li += 1;
    } else if (oi < otherItems.length) {
      result.push(otherItems[oi]);
      oi += 1;
    } else if (li < localItems.length) {
      result.push(localItems[li]);
      li += 1;
    }
  }
  return result;
}

// Splits `products` into local (seller country === buyerCountry) vs. international pools, ranks
// each independently, then blends toward `localRatio` — backfilling from whichever pool is short
// so the section is never emptier than the total available inventory allows.
export function rankAndBlendByCountry(products, buyerCountry, { localRatio, limit }) {
  const available = products.filter((p) => p.stock !== 0);
  const local = available.filter((p) => buyerCountry && p.sellerCountry === buyerCountry);
  const international = available.filter((p) => !(buyerCountry && p.sellerCountry === buyerCountry));

  const rankedLocal = rankWithRotation(local);
  const rankedIntl = rankWithRotation(international);

  const localTarget = Math.round(limit * localRatio);
  const intlTarget = limit - localTarget;
  let localTake = Math.min(localTarget, rankedLocal.length);
  let intlTake = Math.min(intlTarget, rankedIntl.length);
  let remaining = limit - localTake - intlTake;
  if (remaining > 0) {
    const fromLocal = Math.min(remaining, rankedLocal.length - localTake);
    localTake += fromLocal;
    remaining -= fromLocal;
    const fromIntl = Math.min(remaining, rankedIntl.length - intlTake);
    intlTake += fromIntl;
  }

  const localSlice = rankedLocal.slice(0, localTake);
  const intlSlice = rankedIntl.slice(0, intlTake);

  return {
    products: interleaveByRatio(localSlice, intlSlice, localRatio),
    localCount: localSlice.length,
    internationalCount: intlSlice.length,
  };
}

export function rankOnly(products) {
  return rankWithRotation(products.filter((p) => p.stock !== 0));
}

// Explicit sort options a shopper can pick from the filter panel's "Sort by" control (see
// FilterConfig type 'sortBy'). 'relevance' isn't handled here — it means "use the ranking above
// unchanged", which is what every endpoint already does by default.
export const SORT_OPTIONS = ['priceAsc', 'priceDesc', 'bestSelling', 'newest', 'topRated'];

// A shopper who explicitly picks "Price: Low to High" expects an actual price sort — not
// something reshuffled by verified/reach/rotation scoring or the country blend. Bypasses ranking
// entirely rather than layering a sort on top of it. Returns null for anything not in
// SORT_OPTIONS so callers know to fall back to the ranked/blended order.
export function sortByOption(products, sortBy) {
  const list = products.filter((p) => p.stock !== 0);
  switch (sortBy) {
    case 'priceAsc':
      return list.slice().sort((a, b) => (Number(a.priceValue) || 0) - (Number(b.priceValue) || 0));
    case 'priceDesc':
      return list.slice().sort((a, b) => (Number(b.priceValue) || 0) - (Number(a.priceValue) || 0));
    case 'bestSelling':
      return list.slice().sort((a, b) => (Number(b.sold) || 0) - (Number(a.sold) || 0));
    case 'newest':
      return list.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    case 'topRated':
      return list.slice().sort((a, b) => (Number.parseFloat(b.rating) || 0) - (Number.parseFloat(a.rating) || 0));
    default:
      return null;
  }
}

// `rating` is a display string (e.g. "4.5"), not a number Mongo can range-query — parsed the same
// way scoreProduct() already does. A product with no parseable rating never matches a
// minimum-rating filter; "no data" isn't a pass.
export function meetsRatingMin(product, ratingMin) {
  const r = Number.parseFloat(product.rating);
  return Number.isFinite(r) && r >= ratingMin;
}
