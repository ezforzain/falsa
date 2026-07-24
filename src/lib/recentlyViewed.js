// Tracks product ids the shopper has opened, most-recent-first, so the Product Detail page can
// show a "Recently Viewed" rail. Plain localStorage (no backend concept of view history exists) —
// wrapped in try/catch since private-browsing/storage-disabled contexts throw on access.
const KEY = "falsafahtot_recently_viewed";
const MAX_ENTRIES = 12;

export function recordRecentlyViewed(productId) {
  if (!productId) return;
  try {
    const ids = getRecentlyViewedIds();
    const next = [productId, ...ids.filter((id) => id !== productId)].slice(0, MAX_ENTRIES);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable — recently viewed just won't persist this session.
  }
}

export function getRecentlyViewedIds() {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
