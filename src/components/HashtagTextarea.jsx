import { useEffect, useRef, useState } from 'react';
import { catalog } from '../lib/api';

function detectActiveTag(text, cursor) {
  const upToCursor = text.slice(0, cursor);
  const match = upToCursor.match(/#(\w*)$/);
  if (!match) return null;
  return { text: match[1], start: cursor - match[0].length, end: cursor };
}

// YouTube-style "#hashtag as you type" — while the cursor sits inside a #word, shows a live
// dropdown of matching tags already used elsewhere on the marketplace, each with real usage
// counts ("N products · M sellers", the product/seller equivalent of YouTube's "N videos ·
// M channels"). Picking one completes the tag in place; anything typed that matches nothing yet
// is still a valid new hashtag — see the "no products yet" line.
export default function HashtagTextarea({ value, onChange, placeholder, rows = 3, className }) {
  const textareaRef = useRef(null);
  const rootRef = useRef(null);
  const [activeTag, setActiveTag] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loading, setLoading] = useState(false);

  const syncActiveTag = () => {
    const el = textareaRef.current;
    if (!el) return;
    setActiveTag(detectActiveTag(el.value, el.selectionStart));
  };

  const handleChange = (e) => {
    onChange(e.target.value);
    setActiveTag(detectActiveTag(e.target.value, e.target.selectionStart));
  };

  useEffect(() => {
    if (!activeTag || activeTag.text.length === 0) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(() => {
      catalog
        .hashtags(activeTag.text)
        .then(({ hashtags }) => {
          if (!cancelled) setSuggestions(hashtags);
        })
        .catch(() => {
          if (!cancelled) setSuggestions([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [activeTag?.text]);

  useEffect(() => setActiveIndex(-1), [suggestions]);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setActiveTag(null);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const applySuggestion = (tag) => {
    if (!activeTag) return;
    const before = value.slice(0, activeTag.start);
    const after = value.slice(activeTag.end);
    const next = `${before}#${tag}${after.startsWith(' ') ? '' : ' '}${after}`;
    onChange(next);
    setActiveTag(null);
    setSuggestions([]);
    requestAnimationFrame(() => {
      const pos = before.length + tag.length + 2;
      const el = textareaRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  };

  const open = Boolean(activeTag) && activeTag.text.length > 0;

  const handleKeyDown = (e) => {
    if (!open) return;
    if (e.key === 'ArrowDown' && suggestions.length > 0) {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp' && suggestions.length > 0) {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && activeIndex >= 0 && suggestions[activeIndex]) {
      e.preventDefault();
      applySuggestion(suggestions[activeIndex].tag);
    } else if (e.key === 'Escape') {
      setActiveTag(null);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyUp={syncActiveTag}
        onClick={syncActiveTag}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        className={className}
      />

      {open && (
        <div className="absolute z-20 left-0 right-0 mt-1.5 max-h-72 overflow-y-auto bg-white border border-border rounded-xl shadow-lg py-1.5">
          {loading && suggestions.length === 0 && <div className="px-3.5 py-3 text-sm text-text-muted">Searching…</div>}
          {!loading && suggestions.length === 0 && (
            <div className="px-3.5 py-3 text-sm text-text-muted">#{activeTag.text} — new hashtag, no products yet.</div>
          )}
          {suggestions.map((s, i) => (
            <div
              key={s.tag}
              onMouseDown={(e) => {
                e.preventDefault();
                applySuggestion(s.tag);
              }}
              onMouseEnter={() => setActiveIndex(i)}
              className={`px-3.5 py-2.5 cursor-pointer flex items-center justify-between gap-3 ${
                i === activeIndex ? 'bg-green/10' : 'hover:bg-surface-muted'
              }`}
            >
              <span className="font-semibold text-ink text-[14px]">#{s.tag}</span>
              <span className="text-[12px] text-text-muted whitespace-nowrap">
                {s.productCount.toLocaleString()} product{s.productCount !== 1 ? 's' : ''} · {s.sellerCount.toLocaleString()} seller
                {s.sellerCount !== 1 ? 's' : ''}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
