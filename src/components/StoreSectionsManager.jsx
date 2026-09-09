import { useState } from 'react';
import { seller } from '../lib/api';
import { IconChevronDown, IconPlus, IconTrash } from './icons';

const fieldClass =
  'w-full px-[14px] py-[10px] border border-border rounded-lg text-[13.5px] font-sans bg-surface text-ink outline-none focus:border-green focus:shadow-[0_0_0_3px_rgba(14,90,70,0.12)] transition-shadow';

// One custom section: its name (inline-editable), its assigned products in seller-chosen order,
// and an "Add product" picker limited to this seller's own listings not already in it. Every
// action here (rename, add/remove/reorder products, reorder the section itself) saves to the
// server immediately via the parent's callbacks — there's no separate "Save" step.
function SectionRow({ section, products, isFirst, isLast, onRename, onSetProductIds, onDelete, onMove }) {
  const [name, setName] = useState(section.name);
  const [savingName, setSavingName] = useState(false);
  const [busy, setBusy] = useState(false);
  const [picker, setPicker] = useState('');

  const assigned = section.productIds.map((id) => products.find((p) => p.id === id)).filter(Boolean);
  const available = products.filter((p) => !section.productIds.includes(p.id));

  const commitName = () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === section.name) {
      setName(section.name);
      return;
    }
    setSavingName(true);
    onRename(trimmed).finally(() => setSavingName(false));
  };

  const addProduct = (productId) => {
    setPicker('');
    if (!productId) return;
    setBusy(true);
    onSetProductIds([...section.productIds, productId]).finally(() => setBusy(false));
  };

  const removeProduct = (productId) => {
    setBusy(true);
    onSetProductIds(section.productIds.filter((id) => id !== productId)).finally(() => setBusy(false));
  };

  const moveProduct = (index, dir) => {
    const target = index + dir;
    if (target < 0 || target >= section.productIds.length) return;
    const next = [...section.productIds];
    [next[index], next[target]] = [next[target], next[index]];
    setBusy(true);
    onSetProductIds(next).finally(() => setBusy(false));
  };

  return (
    <div className="border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={commitName}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          disabled={savingName}
          className="flex-1 min-w-0 px-3 py-2 border border-border rounded-lg text-[14px] font-semibold text-ink outline-none focus:border-green bg-surface"
        />
        <button
          type="button"
          onClick={() => onMove(-1)}
          disabled={isFirst}
          aria-label="Move section up"
          className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 text-text-muted hover:text-ink p-1.5 rounded-lg hover:bg-surface-muted transition-colors"
        >
          <IconChevronDown width="13" height="13" className="rotate-180" />
        </button>
        <button
          type="button"
          onClick={() => onMove(1)}
          disabled={isLast}
          aria-label="Move section down"
          className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 text-text-muted hover:text-ink p-1.5 rounded-lg hover:bg-surface-muted transition-colors"
        >
          <IconChevronDown width="13" height="13" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete section"
          className="cursor-pointer text-orange-text hover:text-orange p-1.5 rounded-lg hover:bg-orange-tint transition-colors"
        >
          <IconTrash width="14" height="14" />
        </button>
      </div>

      {assigned.length > 0 && (
        <div className="flex flex-col gap-1.5 mb-2.5">
          {assigned.map((p, i) => (
            <div key={p.id} className="flex items-center gap-2 bg-surface-muted rounded-lg p-1.5">
              <img src={p.img} alt="" className="w-9 h-9 object-cover rounded-md shrink-0 bg-surface-muted" />
              <span className="flex-1 min-w-0 text-[12.5px] text-ink-soft truncate">{p.name}</span>
              <button
                type="button"
                onClick={() => moveProduct(i, -1)}
                disabled={i === 0 || busy}
                aria-label="Move product up"
                className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 text-text-muted hover:text-ink p-1 rounded hover:bg-surface transition-colors"
              >
                <IconChevronDown width="12" height="12" className="rotate-180" />
              </button>
              <button
                type="button"
                onClick={() => moveProduct(i, 1)}
                disabled={i === assigned.length - 1 || busy}
                aria-label="Move product down"
                className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 text-text-muted hover:text-ink p-1 rounded hover:bg-surface transition-colors"
              >
                <IconChevronDown width="12" height="12" />
              </button>
              <button
                type="button"
                onClick={() => removeProduct(p.id)}
                disabled={busy}
                aria-label="Remove from section"
                className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 text-orange-text hover:text-orange p-1 rounded hover:bg-surface transition-colors"
              >
                <IconTrash width="12" height="12" />
              </button>
            </div>
          ))}
        </div>
      )}

      {available.length > 0 ? (
        <select value={picker} onChange={(e) => addProduct(e.target.value)} disabled={busy} className={fieldClass}>
          <option value="">+ Add a product to this section…</option>
          {available.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      ) : (
        assigned.length === 0 && <p className="text-[12.5px] text-text-muted">You don't have any active listings to add yet.</p>
      )}
    </div>
  );
}

// Seller-defined product groupings shown as their own sections on the public store page — e.g.
// "New Arrivals" or "Eid Collection" — scoped entirely to this seller's own store, separate from
// the platform-wide category taxonomy. `products` is this seller's own active listing summaries
// (see SellerStoreProfile), used to build each section's "add product" picker.
export default function StoreSectionsManager({ sections, products, onChange }) {
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  const createSection = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setCreating(true);
    setError(null);
    try {
      const { store } = await seller.addStoreSection(trimmed);
      setNewName('');
      onChange(store.sections);
    } catch (err) {
      setError(err.message || 'Could not create that section. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const renameSection = async (sectionId, name) => {
    try {
      const { store } = await seller.updateStoreSection(sectionId, { name });
      onChange(store.sections);
    } catch (err) {
      setError(err.message || 'Could not rename that section. Please try again.');
    }
  };

  const setProductIds = async (sectionId, productIds) => {
    try {
      const { store } = await seller.updateStoreSection(sectionId, { productIds });
      onChange(store.sections);
    } catch (err) {
      setError(err.message || 'Could not update that section. Please try again.');
    }
  };

  const deleteSection = async (sectionId) => {
    try {
      const { store } = await seller.deleteStoreSection(sectionId);
      onChange(store.sections);
    } catch (err) {
      setError(err.message || 'Could not delete that section. Please try again.');
    }
  };

  const moveSection = async (index, dir) => {
    const target = index + dir;
    if (target < 0 || target >= sections.length) return;
    const reordered = [...sections];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    onChange(reordered);
    try {
      const { store } = await seller.reorderStoreSections(reordered.map((s) => s.id));
      onChange(store.sections);
    } catch (err) {
      onChange(sections);
      setError(err.message || 'Could not reorder sections. Please try again.');
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {sections.map((section, i) => (
        <SectionRow
          key={section.id}
          section={section}
          products={products}
          isFirst={i === 0}
          isLast={i === sections.length - 1}
          onRename={(name) => renameSection(section.id, name)}
          onSetProductIds={(ids) => setProductIds(section.id, ids)}
          onDelete={() => deleteSection(section.id)}
          onMove={(dir) => moveSection(i, dir)}
        />
      ))}

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && createSection()}
          placeholder="e.g. New Arrivals, Eid Collection"
          className={fieldClass}
        />
        <button
          type="button"
          onClick={createSection}
          disabled={creating || !newName.trim()}
          className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 shrink-0 flex items-center gap-1.5 bg-green hover:bg-green-hover text-white font-semibold text-[13px] px-4 py-2.5 rounded-lg transition-colors"
        >
          <IconPlus width="14" height="14" />
          Add section
        </button>
      </div>

      {error && <p className="text-[11.5px] text-orange-text">{error}</p>}
    </div>
  );
}
