// Client-side twin of server/src/utils/hashtags.js's normalizeHashtag — same rules, kept
// in sync by hand since the two apps don't share code. Used for instant feedback in the
// chip input (see HashtagChipInput.jsx) before anything hits the network; the backend
// re-normalizes on save regardless, so this is a UX nicety, not the source of truth.
export function normalizeHashtag(raw) {
  const words = String(raw || '')
    .replace(/^#+/, '')
    .split(/[\s_-]+/)
    .map((w) => w.replace(/[^A-Za-z0-9]/g, ''))
    .filter(Boolean);
  if (words.length === 0) return null;
  return words.map((w) => w[0].toUpperCase() + w.slice(1)).join('');
}

// Case-insensitive de-duping union of any number of hashtag lists, keeping the first
// spelling seen for each. Used to merge the explicit chip list with whatever #hashtags
// the seller also typed inline in the description (see ProductFormModal.jsx).
export function mergeHashtags(...lists) {
  const seen = new Set();
  const out = [];
  for (const list of lists) {
    for (const raw of list || []) {
      const tag = normalizeHashtag(raw);
      if (!tag) continue;
      const key = tag.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(tag);
    }
  }
  return out;
}
