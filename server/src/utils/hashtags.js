import { Product } from '../models/Product.js';
import { HashtagStat } from '../models/HashtagStat.js';

// Single source of truth for turning arbitrary seller/buyer input into a canonical
// hashtag: "running shoes", "#Running_Shoes", "  RunningShoes  " all become
// "RunningShoes". Mirrored client-side (src/lib/hashtags.js) for instant UI feedback,
// but this is the copy the backend actually trusts.
export function normalizeHashtag(raw) {
  const words = String(raw || '')
    .replace(/^#+/, '')
    .split(/[\s_-]+/)
    .map((w) => w.replace(/[^A-Za-z0-9]/g, ''))
    .filter(Boolean);
  if (words.length === 0) return null;
  const joined = words.map((w) => w[0].toUpperCase() + w.slice(1)).join('');
  return joined || null;
}

// Dedupes a list of raw hashtag inputs case-insensitively, keeping the first
// normalized spelling seen for each.
export function normalizeHashtagList(list) {
  const seen = new Set();
  const out = [];
  for (const raw of Array.isArray(list) ? list : []) {
    const tag = normalizeHashtag(raw);
    if (!tag) continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(tag);
  }
  return out;
}

// One aggregate over Product (scoped to `tagList` when given, otherwise every tag in
// use) merged with HashtagStat's click/search/view counters. Returns
// Map(lowercaseTag -> score). Real signals only:
//  - productCount: how many products carry the tag
//  - totalSold: combined `sold` across those products
//  - recentCount: how many of those products were created in the last 14 days (growth)
//  - clicks/searches/views: from HashtagStat, populated by the hashtag results page
//    and product-page views (see catalog.routes.js)
export async function computeTagPopularity(tagList) {
  const match = { tags: { $exists: true, $ne: [] } };
  if (Array.isArray(tagList) && tagList.length > 0) {
    const escaped = tagList.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    match.tags = { $in: escaped.map((t) => new RegExp(`^${t}$`, 'i')) };
  }

  const recentCutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const rows = await Product.aggregate([
    { $match: match },
    { $unwind: '$tags' },
    {
      $group: {
        _id: { $toLower: '$tags' },
        productCount: { $sum: 1 },
        totalSold: { $sum: { $ifNull: ['$sold', 0] } },
        recentCount: { $sum: { $cond: [{ $gte: ['$createdAt', recentCutoff] }, 1, 0] } },
      },
    },
  ]);

  const statFilter =
    Array.isArray(tagList) && tagList.length > 0 ? { tag: { $in: tagList.map((t) => t.toLowerCase()) } } : {};
  const stats = await HashtagStat.find(statFilter).lean();
  const statsByTag = new Map(stats.map((s) => [s.tag, s]));

  const popularity = new Map();
  for (const row of rows) {
    const stat = statsByTag.get(row._id);
    const score =
      row.productCount * 3 +
      Math.log10(row.totalSold + 1) * 5 +
      row.recentCount * 4 +
      (stat?.clicks || 0) * 2 +
      (stat?.searches || 0) * 2 +
      (stat?.views || 0) * 1;
    popularity.set(row._id, score);
  }
  return popularity;
}

// Ranks a product's own tags by global popularity (highest first, ties keep original
// order) and returns the top `n`. A tag with no popularity data yet (score 0) still
// sorts after any that have some — new products/tags don't error out, they just don't
// get promoted to the top 3 until they pick up real signal.
export function topTagsFor(tags, popularityMap, n = 3) {
  const list = Array.isArray(tags) ? tags : [];
  return list
    .map((tag, index) => ({ tag, index, score: popularityMap.get(tag.toLowerCase()) || 0 }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, n)
    .map((t) => t.tag);
}

// Fire-and-forget counter bump — never awaited by callers, never allowed to fail a
// request. `field` is one of 'clicks' | 'views' | 'searches'.
export function bumpHashtagStats(tags, field) {
  const list = normalizeHashtagList(tags);
  for (const tag of list) {
    HashtagStat.findOneAndUpdate(
      { tag: tag.toLowerCase() },
      { $inc: { [field]: 1 }, $setOnInsert: { displayTag: tag } },
      { upsert: true }
    ).catch(() => {
      // Non-critical — a missed counter bump never breaks the page it happened on.
    });
  }
}
