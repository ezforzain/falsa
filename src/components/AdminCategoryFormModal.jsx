import { useEffect, useState } from 'react';
import { IconClose } from './icons';

const emptyForm = { key: '', name: '', icon: '', img: '' };

// Mirrors AdminUserFormModal's structure — manages the marketplace category taxonomy
// (Category.kind === 'category').
export default function AdminCategoryFormModal({ open, category, loading, error, onClose, onSubmit }) {
  const [form, setForm] = useState(emptyForm);
  const isEdit = Boolean(category);

  useEffect(() => {
    if (!open) return;
    setForm(
      category
        ? { key: category.key || '', name: category.name || '', icon: category.icon || '', img: category.img || '' }
        : emptyForm
    );
  }, [open, category]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = () => {
    onSubmit({
      key: form.key.trim(),
      name: form.name.trim(),
      icon: form.icon.trim(),
      img: form.img.trim(),
    });
  };

  const canSubmit = form.name.trim() && (isEdit || form.key.trim());

  const fieldClass =
    'w-full px-[14px] py-[11px] border border-border rounded-lg text-[14px] font-sans bg-surface text-ink outline-none focus:border-green focus:shadow-[0_0_0_3px_rgba(14,90,70,0.12)] transition-shadow disabled:bg-surface-muted disabled:text-text-muted';
  const labelClass = 'block text-[12.5px] font-semibold text-ink-soft mb-1.5';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />

      <div className="relative w-full max-w-[420px] max-h-full overflow-y-auto bg-surface rounded-2xl shadow-2xl p-6 animate-fade-up">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-lg font-bold text-ink">{isEdit ? 'Edit category' : 'Add category'}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-text-muted hover:text-ink cursor-pointer p-1">
            <IconClose width="18" height="18" />
          </button>
        </div>

        {error && <p className="text-sm text-orange-text bg-orange-tint rounded-lg px-3.5 py-2.5 mb-4">{error}</p>}

        <div className="flex flex-col gap-4">
          <div>
            <label className={labelClass}>Category name</label>
            <input type="text" value={form.name} onChange={set('name')} placeholder="e.g. Textiles & Fabrics" className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>Key {isEdit && <span className="font-normal text-text-muted">(can't be changed)</span>}</label>
            <input
              type="text"
              value={form.key}
              onChange={set('key')}
              disabled={isEdit}
              placeholder="e.g. textiles"
              className={fieldClass}
            />
          </div>
          <div>
            <label className={labelClass}>Icon (optional — SVG path data, leave blank for a default icon)</label>
            <input type="text" value={form.icon} onChange={set('icon')} placeholder="e.g. M4 14a1 1 0 0 1-.78-1.63l9.9-10.2…" className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>Image URL (optional)</label>
            <input type="text" value={form.img} onChange={set('img')} placeholder="https://…" className={fieldClass} />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 cursor-pointer bg-surface border-[1.5px] border-border text-ink-soft font-semibold text-sm py-3 rounded-full hover:bg-surface-muted transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={loading || !canSubmit}
            className="flex-1 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 bg-green hover:bg-green-hover text-white font-semibold text-sm py-3 rounded-full shadow-[0_6px_16px_rgba(14,90,70,0.25)] transition-colors"
          >
            {loading && (
              <span className="w-3.5 h-3.5 border-2 border-white/35 rounded-full inline-block" style={{ borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} />
            )}
            {loading ? 'Saving…' : isEdit ? 'Save changes' : 'Add category'}
          </button>
        </div>
      </div>
    </div>
  );
}
