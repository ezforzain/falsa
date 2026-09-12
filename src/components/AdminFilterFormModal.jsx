import { useEffect, useState } from 'react';
import ModalShell, { ModalError, adminFieldClass, adminLabelClass } from './admin/ui/ModalShell';
import Button from './admin/ui/Button';

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

  return (
    <ModalShell
      title={isEdit ? 'Edit filter' : 'Add a filter'}
      maxWidth={420}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          {(isEdit || availableTypes.length > 0) && (
            <Button className="flex-1" loading={loading} disabled={!canSubmit} onClick={submit}>
              {isEdit ? 'Save changes' : 'Add filter'}
            </Button>
          )}
        </>
      }
    >
      <ModalError>{error}</ModalError>

      {!isEdit && availableTypes.length === 0 ? (
        <p className="text-sm text-[var(--admin-text-muted)]">Every available filter type is already added to this section.</p>
      ) : (
        <div className="flex flex-col gap-4">
          <div>
            <label className={adminLabelClass}>Filter type {isEdit && <span className="font-normal text-[var(--admin-text-muted)]">(can't be changed)</span>}</label>
            <select value={form.type} onChange={set('type')} disabled={isEdit} className={adminFieldClass}>
              <option value="">Choose one…</option>
              {availableTypes.map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={adminLabelClass}>Display label</label>
            <input type="text" value={form.label} onChange={set('label')} placeholder={form.type ? TYPE_LABELS[form.type] : ''} className={adminFieldClass} />
          </div>
          {LIST_TYPES.has(form.type) && (
            <div>
              <label className={adminLabelClass}>Option values (comma-separated — leave blank to use the real values already in the catalog)</label>
              <textarea value={form.options} onChange={set('options')} rows={2} placeholder="e.g. Pakistan, UAE, China" className={`${adminFieldClass} resize-none`} />
            </div>
          )}
        </div>
      )}
    </ModalShell>
  );
}
