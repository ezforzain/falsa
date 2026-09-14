import { useEffect, useState } from 'react';
import ModalShell, { ModalError, adminFieldClass, adminLabelClass } from './admin/ui/ModalShell';
import Button from './admin/ui/Button';

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

  return (
    <ModalShell
      title={isEdit ? 'Edit category' : 'Add category'}
      maxWidth={420}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" loading={loading} disabled={!canSubmit} onClick={submit}>
            {isEdit ? 'Save changes' : 'Add category'}
          </Button>
        </>
      }
    >
      <ModalError>{error}</ModalError>

      <div className="flex flex-col gap-4">
        <div>
          <label className={adminLabelClass}>Category name</label>
          <input type="text" value={form.name} onChange={set('name')} placeholder="e.g. Textiles & Fabrics" className={adminFieldClass} />
        </div>
        <div>
          <label className={adminLabelClass}>Key {isEdit && <span className="font-normal text-[var(--admin-text-muted)]">(can't be changed)</span>}</label>
          <input
            type="text"
            value={form.key}
            onChange={set('key')}
            disabled={isEdit}
            placeholder="e.g. textiles"
            className={adminFieldClass}
          />
        </div>
        <div>
          <label className={adminLabelClass}>Icon (optional — SVG path data, leave blank for a default icon)</label>
          <input type="text" value={form.icon} onChange={set('icon')} placeholder="e.g. M4 14a1 1 0 0 1-.78-1.63l9.9-10.2…" className={adminFieldClass} />
        </div>
        <div>
          <label className={adminLabelClass}>Image URL (optional)</label>
          <input type="text" value={form.img} onChange={set('img')} placeholder="https://…" className={adminFieldClass} />
        </div>
      </div>
    </ModalShell>
  );
}
