// Shared Mongo filter builder for the B2B / Spotlight / Worldwide / Free Shipping marketplace
// tabs (server/src/routes/marketplace.routes.js) — one place so the four endpoints don't each
// duplicate the same query-param parsing, and so "multiple filters must work together" is
// satisfied for free (every filter just adds another clause to the same $and).
//
// Returns an ARRAY of clause objects (not a single merged object) so callers can safely append
// their own extra clauses — including ones that themselves need `$or` — without colliding with
// the keyword-search `$or` clause below (two sibling `$or` keys on one object would silently
// overwrite each other; combining as `{ $and: [...clauses] }` never has that problem).
export function buildMarketplaceFilter(query) {
  const clauses = [];

  const q = query.q ? String(query.q).trim() : '';
  if (q) {
    const re = new RegExp(q.replace(/\s+/g, ' '), 'i');
    clauses.push({ $or: [{ name: re }, { category: re }, { seller: re }] });
  }

  if (query.category) clauses.push({ category: query.category });
  if (query.sellerId) clauses.push({ sellerId: query.sellerId });
  if (query.country) clauses.push({ sellerCountry: query.country });

  if (query.verified === '1' || query.verified === 'true') clauses.push({ sellerVerified: true });
  if (query.officialStore === '1' || query.officialStore === 'true') clauses.push({ sellerOfficialStore: true });
  if (query.freeShipping === '1' || query.freeShipping === 'true') clauses.push({ freeShipping: true });

  const priceMin = query.priceMin !== undefined ? Number(query.priceMin) : null;
  const priceMax = query.priceMax !== undefined ? Number(query.priceMax) : null;
  if (Number.isFinite(priceMin) || Number.isFinite(priceMax)) {
    const range = {};
    if (Number.isFinite(priceMin)) range.$gte = priceMin;
    if (Number.isFinite(priceMax)) range.$lte = priceMax;
    clauses.push({ priceValue: range });
  }

  const moqMax = query.moqMax !== undefined ? Number(query.moqMax) : null;
  if (Number.isFinite(moqMax)) {
    // Products with no parseable MOQ are excluded when this filter is actively used — there's
    // nothing honest to compare them against, so "no data" can't count as "satisfies the filter".
    clauses.push({ moqValue: { $ne: null, $lte: moqMax } });
  }

  return clauses;
}

// Combines the shared clauses with any route-specific ones into a single Mongo filter.
export function toMongoFilter(clauses) {
  if (clauses.length === 0) return {};
  if (clauses.length === 1) return clauses[0];
  return { $and: clauses };
}
