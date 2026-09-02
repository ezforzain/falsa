import { useState } from 'react';
import { normalizeHashtag } from '../lib/hashtags';
import { IconClose, IconPlus } from './icons';

// Seller-facing hashtag editor: type a tag, press Add (or Enter) to turn it into a
// removable chip. Normalizes as-you-type formatting ("running shoes" -> "#RunningShoes"),
// blocks empty/invalid input and case-insensitive duplicates.
export default function HashtagChipInput({ value, onChange, fieldClass, placeholder = 'e.g. RunningShoes' }) {
  const [draft, setDraft] = useState('');
  const [error, setError] = useState(null);

  const add = () => {
    const tag = normalizeHashtag(draft);
    if (!tag) {
      setError(draft.trim() ? 'Hashtags can only contain letters, numbers and underscores.' : null);
      return;
    }
    if (value.some((t) => t.toLowerCase() === tag.toLowerCase())) {
      setError(`#${tag} is already added.`);
      return;
    }
    onChange([...value, tag]);
    setDraft('');
    setError(null);
  };

  const remove = (tag) => onChange(value.filter((t) => t !== tag));

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      add();
    }
  };

  return (
    <div>
      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={fieldClass}
        />
        <button
          type="button"
          onClick={add}
          className="shrink-0 flex items-center gap-1.5 px-4 py-[11px] rounded-lg text-[13px] font-semibold text-white bg-green hover:bg-green-hover cursor-pointer transition-colors"
        >
          <IconPlus width="13" height="13" />
          Add
        </button>
      </div>

      {error && <p className="text-[11.5px] text-orange-text mt-1.5">{error}</p>}

      {value.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
          <span className="text-[11.5px] font-semibold text-ink-soft">
            Added ({value.length}):
          </span>
          {value.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-green bg-green/10 rounded-full pl-2.5 pr-1.5 py-0.5"
            >
              #{tag}
              <button
                type="button"
                onClick={() => remove(tag)}
                aria-label={`Remove #${tag}`}
                className="cursor-pointer text-green/70 hover:text-green p-0.5 rounded-full"
              >
                <IconClose width="10" height="10" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
