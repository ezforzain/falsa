import { normalizeHashtag } from './hashtags.js';

const STOPWORDS = new Set([
  'a', 'an', 'the', 'for', 'with', 'and', 'or', 'of', 'in', 'on', 'at', 'to', 'from', 'by',
  'is', 'are', 'new', 'best', 'premium', 'quality', 'set', 'pack', 'pcs', 'piece', 'pieces',
  'your', 'our', 'this', 'that', 'these', 'those', 'per', 'up', 'out', 'each',
]);

// Splits free text into significant lowercase words: possessives normalized ("men's" ->
// "mens"), punctuation stripped, stopwords and very short/numeric-only tokens dropped.
function significantWords(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/['’]s\b/g, 's')
    .split(/[^a-z0-9]+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 1 && !STOPWORDS.has(w) && !/^\d+$/.test(w));
}

function pascalCase(words) {
  return words.map((w) => w[0].toUpperCase() + w.slice(1)).join('');
}

// Rule-based "AI suggestions" — no external model call, fully deterministic and fast.
// Heuristic: the last significant word of the title is treated as the product's "head
// noun" (e.g. "Running Shoes" -> "shoes"); every other descriptive word from the title
// is paired with it ("running"+"shoes" -> RunningShoes, "black"+"shoes" -> BlackShoes),
// which reproduces the kind of suggestions YouTube-style tag pickers show. The category
// name and a few description keywords add a bit more breadth without ever inventing
// anything unrelated to what the seller actually typed.
export function suggestHashtags({ title, description, category, exclude } = {}) {
  const excludeSet = new Set((Array.isArray(exclude) ? exclude : []).map((t) => String(t).toLowerCase()));
  const titleWords = significantWords(title);
  const suggestions = [];
  const seen = new Set();

  const add = (words) => {
    if (!words || words.length === 0) return;
    const tag = normalizeHashtag(pascalCase(words));
    if (!tag) return;
    const key = tag.toLowerCase();
    if (seen.has(key) || excludeSet.has(key)) return;
    seen.add(key);
    suggestions.push(tag);
  };

  if (titleWords.length > 0) {
    const head = titleWords[titleWords.length - 1];
    const descriptors = titleWords.slice(0, -1);

    // Whole title (or its last 2-3 words) as one compact tag, e.g. "RunningShoes".
    add(titleWords.slice(-2));
    // Head noun alone, e.g. "Shoes".
    add([head]);
    // Each descriptor + head noun, e.g. "MensShoes", "BlackShoes", "WaterproofShoes".
    for (const word of descriptors) add([word, head]);
  }

  if (category) {
    const categoryWords = significantWords(category);
    if (categoryWords.length > 0) add(categoryWords);
  }

  // A handful of description keywords, paired with the title's head noun when there is
  // one, so e.g. a material or use-case mentioned only in the description still surfaces.
  if (description) {
    const head = titleWords[titleWords.length - 1];
    const descWords = significantWords(description).filter((w) => !titleWords.includes(w));
    for (const word of descWords.slice(0, 6)) {
      if (head) add([word, head]);
      else add([word]);
    }
  }

  return suggestions.slice(0, 8);
}
