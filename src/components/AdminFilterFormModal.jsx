import { useEffect, useState } from 'react';
import { IconClose } from './icons';

const TYPE_LABELS = {
  category: 'Category',
  country: 'Country',
  priceRange: 'Price range',
  moq: 'Max MOQ',
  verified: 'Verified Sellers',
  officialStore: 'Mall / Official Store',
  freeShipping: 'Free Shipping',
  rating: 'Rating',
  discount: 'On Sale',
  sortBy: 'Sort by',
};

// List-type filters — the only ones where an admin-curated option list makes sense (everything
// else is a toggle/range/dropdown with no discrete values to list).
const LIST_TYPES = new Set(['category', 'country']);

const emptyForm = { type: '', label: '', options: '' };

// Mirrors AdminCategoryFormModal's add/edit structure. Adding picks a filter type not already
// used in the section (type + section become that row's identity, like Category's `key`); editing
// only ever touches label/options — `enabled` and reordering are handled inline in the Filters
// tab list (checkbox / ▲▼), same shape as the reach-boost stepper.
export default function AdminFilterFormModal({ open, section, existingTypes = [], filter, loading, error, onClose, onSubmit }) {
  const [form, setForm] = useState(emptyForm);
  const isEdit = Boolean(filter);

  useEffect(() => {
    if (!open) return;
    setForm(
      filter
        ? { type: filter.type, label: filter.label || '', options: (filter.options || []).join(', ') }
        : emptyForm
    );
  }, [open, filter]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const availableTypes = Object.keys(TYPE_LABELS).filter((t) => isEdit || !existingTypes.includes(t));

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = () => {
    const options = LIST_TYPES.has(form.type)
      ? form.options.split(',').map((o) => o.trim()).filter(Boolean)
      : [];
    onSubmit(isEdit ? { label: form.label.trim() || TYPE_LABELS[form.type], options } : { section, type: form.type, label: form.label.trim() || TYPE_LABELS[form.type], options });
  };

  const canSubmit = Boolean(form.type);

  const fieldClass =
    'w-full px-[14px] py-[11px] border border-border rounded-lg text-[14px] font-sans bg-white text-ink outline-none focus:border-green focus:shadow-[0_0_0_3px_rgba(14,90,70,0.12)] transition-shadow disabled:bg-surface-muted disabled:text-text-muted';
  const labelClass = 'block text-[12.5px] font-semibold text-ink-soft mb-1.5';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />

      <div className="relative w-full max-w-[420px] max-h-full overflow-y-auto bg-white rounded-2xl shadow-2xl p-6 animate-fade-up">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-lg font-bold text-ink">{isEdit ? 'Edit filter' : 'Add a filter'}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-text-muted hover:text-ink cursor-pointer p-1">
            <IconClose width="18" height="18" />
          </button>
        </div>

        {error && <p className="text-sm text-orange-text bg-orange-tint rounded-lg px-3.5 py-2.5 mb-4">{error}</p>}

        {!isEdit && availableTypes.length === 0 ? (
          <p className="text-sm text-text-muted">Every available filter type is already added to this section.</p>
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <label className={labelClass}>Filter type {isEdit && <span className="font-normal text-text-muted">(can't be changed)</span>}</label>
              <select value={form.type} onChange={set('type')} disabled={isEdit} className={fieldClass}>
                <option value="">Choose one…</option>
                {availableTypes.map((t) => (
                  <option key={t} value={t}>
                    {TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Display label</label>
              <input type="text" value={form.label} onChange={set('label')} placeholder={form.type ? TYPE_LABELS[form.type] : ''} className={fieldClass} />
            </div>
            {LIST_TYPES.has(form.type) && (
              <div>
                <label className={labelClass}>Option values (comma-separated — leave blank to use the real values already in the catalog)</label>
                <textarea value={form.options} onChange={set('options')} rows={2} placeholder="e.g. Pakistan, UAE, China" className={`${fieldClass} resize-none`} />
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 cursor-pointer bg-white border-[1.5px] border-border text-ink-soft font-semibold text-sm py-3 rounded-full hover:bg-surface-muted transition-colors"
          >
            Cancel
          </button>
          {(isEdit || availableTypes.length > 0) && (
            <button
              type="button"
              onClick={submit}
              disabled={loading || !canSubmit}
              className="flex-1 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 bg-green hover:bg-green-hover text-white font-semibold text-sm py-3 rounded-full shadow-[0_6px_16px_rgba(14,90,70,0.25)] transition-colors"
            >
              {loading && (
                <span className="w-3.5 h-3.5 border-2 border-white/35 rounded-full inline-block" style={{ borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} />
              )}
              {loading ? 'Saving…' : isEdit ? 'Save changes' : 'Add filter'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
