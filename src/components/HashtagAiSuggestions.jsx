import { useEffect, useState } from 'react';
import { catalog } from '../lib/api';
import { IconSparkle } from './icons';

// Debounced AI-style hashtag suggestions derived from the product's title/category/
// description (see server's suggestHashtags util) — a seller taps one to add it, same
// gesture as the category suggestion chips elsewhere in this form. Never auto-adds
// anything; renders nothing once there's nothing left to suggest.
export default function HashtagAiSuggestions({ title, category, description, exclude, onAdd }) {
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (!title || !title.trim()) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      catalog
        .suggestHashtags({ title, category, description, exclude })
        .then(({ suggestions: fetched }) => {
          if (!cancelled) setSuggestions(fetched);
        })
        .catch(() => {
          if (!cancelled) setSuggestions([]);
        });
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, category, description]);

  // Already-added tags disappear from the suggestion list as soon as they're added,
  // without waiting on the next debounced fetch.
  const visible = suggestions.filter((s) => !exclude.some((t) => t.toLowerCase() === s.toLowerCase()));
  if (visible.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
      <span className="flex items-center gap-1 text-[11.5px] text-ink-soft">
        <IconSparkle width="12" height="12" className="text-green" />
        Suggested:
      </span>
      {visible.map((tag) => (
        <button
          key={tag}
          type="button"
          onClick={() => onAdd(tag)}
          className="text-[11.5px] font-semibold text-green border border-green/30 bg-green/5 hover:bg-green/10 rounded-full px-2.5 py-0.5 cursor-pointer transition-colors"
        >
          + #{tag}
        </button>
      ))}
    </div>
  );
}
