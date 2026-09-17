import { useEffect, useRef, useState } from 'react';
import Cropper from 'react-easy-crop';
import ModalShell, { ModalError, adminFieldClass, adminLabelClass } from './admin/ui/ModalShell';
import Button from './admin/ui/Button';
import Select from './admin/ui/Select';
import SearchInput from './admin/ui/SearchInput';
import { admin } from '../lib/api';
import { toDisplayableImage } from '../lib/heic';
import { validateCategoryImageFile } from '../lib/file';
import { uploadFile } from '../lib/upload';
import { getCroppedImageFile } from '../lib/cropImage';
import { IconTrash, IconUpload } from './icons';

const emptyForm = { key: '', name: '', icon: '', img: '', marketplacePlacement: 'both' };

const PLACEMENT_OPTIONS = [
  { value: 'both', label: 'Both — Spotlight & B2B' },
  { value: 'spotlight', label: 'Spotlight only' },
  { value: 'b2b', label: 'B2B only' },
];

// Mirrors AdminUserFormModal's structure — manages the marketplace category taxonomy
// (Category.kind === 'category'). Extended with: market placement, image-by-upload with a
// crop step, and (when editing) assigning existing products into this category.
export default function AdminCategoryFormModal({ open, category, loading, error, onClose, onSubmit }) {
  const [form, setForm] = useState(emptyForm);
  const isEdit = Boolean(category);
  const fileInputRef = useRef(null);

  const [imageMode, setImageMode] = useState('url');
  const [imageError, setImageError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [cropSrc, setCropSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [addedProductIds, setAddedProductIds] = useState(() => new Set());

  useEffect(() => {
    if (!open) return;
    setForm(
      category
        ? {
            key: category.key || '',
            name: category.name || '',
            icon: category.icon || '',
            img: category.img || '',
            marketplacePlacement: category.marketplacePlacement || 'both',
          }
        : emptyForm
    );
    setImageMode('url');
    setImageError(null);
    setCropSrc(null);
    setAddedProductIds(new Set());
    setProductSearch('');
  }, [open, category]);

  useEffect(() => {
    if (!open || !isEdit) return;
    let cancelled = false;
    setProductsLoading(true);
    admin
      .products()
      .then(({ products: list }) => {
        if (!cancelled) setProducts(list);
      })
      .catch(() => {
        /* the assign-products panel just stays empty on failure — not fatal to editing the category */
      })
      .finally(() => {
        if (!cancelled) setProductsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, isEdit, category]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  useEffect(() => () => cropSrc && URL.revokeObjectURL(cropSrc), [cropSrc]);

  if (!open) return null;

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const pickFile = () => fileInputRef.current?.click();

  const handleFileSelected = async (e) => {
    const raw = e.target.files?.[0];
    e.target.value = '';
    if (!raw) return;
    setImageError(null);
    let displayable;
    try {
      displayable = await toDisplayableImage(raw);
    } catch {
      setImageError('Could not process that photo. Please try a different file.');
      return;
    }
    const validationError = validateCategoryImageFile(displayable);
    if (validationError) {
      setImageError(validationError);
      return;
    }
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setCropSrc(URL.createObjectURL(displayable));
  };

  const cancelCrop = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  };

  const confirmCrop = async () => {
    if (!cropSrc || !croppedAreaPixels) return;
    setUploading(true);
    setImageError(null);
    try {
      const file = await getCroppedImageFile(cropSrc, croppedAreaPixels);
      const { url } = await uploadFile('categories', file);
      setForm((f) => ({ ...f, img: url }));
      cancelCrop();
    } catch (err) {
      setImageError(err.message || 'Could not upload that photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const toggleProduct = (id) => {
    setAddedProductIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredProducts = products.filter((p) => p.name?.toLowerCase().includes(productSearch.trim().toLowerCase()));

  const submit = () => {
    onSubmit({
      key: form.key.trim(),
      name: form.name.trim(),
      icon: form.icon.trim(),
      img: form.img.trim(),
      marketplacePlacement: form.marketplacePlacement,
      productIdsToAssign: Array.from(addedProductIds),
    });
  };

  const canSubmit = form.name.trim() && (isEdit || form.key.trim());

  return (
    <ModalShell
      title={isEdit ? 'Edit category' : 'Add category'}
      maxWidth={560}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" loading={loading} disabled={!canSubmit || uploading} onClick={submit}>
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
          <label className={adminLabelClass}>Market placement</label>
          <Select value={form.marketplacePlacement} onChange={set('marketplacePlacement')} className="w-full">
            {PLACEMENT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className={adminLabelClass + ' mb-0'}>Category image</label>
            <div className="flex gap-1 bg-[var(--admin-canvas)] rounded-full p-0.5">
              {['url', 'upload'].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setImageMode(mode)}
                  className={`px-3 py-1 rounded-full text-[11.5px] font-semibold cursor-pointer transition-colors ${
                    imageMode === mode
                      ? 'bg-[var(--admin-primary)] text-white'
                      : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-ink)]'
                  }`}
                >
                  {mode === 'url' ? 'Image URL' : 'Upload photo'}
                </button>
              ))}
            </div>
          </div>

          {imageMode === 'url' && (
            <input type="text" value={form.img} onChange={set('img')} placeholder="https://…" className={adminFieldClass} />
          )}

          {imageMode === 'upload' && !cropSrc && (
            <div className="flex items-center gap-3">
              {form.img && (
                <span className="w-14 h-14 rounded-full overflow-hidden border border-[var(--admin-border)] shrink-0">
                  <img src={form.img} alt="" className="w-full h-full object-cover" />
                </span>
              )}
              <Button type="button" variant="secondary" onClick={pickFile}>
                <IconUpload width="14" height="14" />
                {form.img ? 'Replace photo' : 'Choose photo'}
              </Button>
              {form.img && (
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, img: '' }))}
                  aria-label="Remove image"
                  className="cursor-pointer flex items-center justify-center bg-[var(--admin-surface)] border border-[var(--admin-border)] text-[var(--admin-danger)] p-2 rounded-full hover:bg-[var(--admin-danger-tint)] transition-colors"
                >
                  <IconTrash width="13" height="13" />
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif" onChange={handleFileSelected} className="sr-only" />
            </div>
          )}

          {imageMode === 'upload' && cropSrc && (
            <div className="flex flex-col gap-3">
              <div className="relative w-full h-64 bg-[var(--admin-canvas)] rounded-xl overflow-hidden">
                <Cropper
                  image={cropSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={(_area, areaPixels) => setCroppedAreaPixels(areaPixels)}
                />
              </div>
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full"
                aria-label="Zoom"
              />
              <div className="flex gap-3">
                <Button type="button" variant="secondary" className="flex-1" onClick={cancelCrop} disabled={uploading}>Cancel</Button>
                <Button type="button" className="flex-1" loading={uploading} onClick={confirmCrop}>Use this crop</Button>
              </div>
            </div>
          )}

          {imageError && <p className="text-[11.5px] text-[var(--admin-danger)] mt-1.5">{imageError}</p>}
        </div>

        {isEdit && (
          <div>
            <label className={adminLabelClass}>Products in this category</label>
            <p className="text-[11.5px] text-[var(--admin-text-muted)] mb-2 leading-snug">
              Products already here are checked and locked — move a product out from its own edit form. Check others below to add them to "{category?.name}".
            </p>
            <SearchInput value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="Search products…" className="mb-2" />
            <div className="max-h-48 overflow-y-auto flex flex-col gap-1 border border-[var(--admin-border)] rounded-lg p-2">
              {productsLoading && <p className="text-[12px] text-[var(--admin-text-muted)] px-1 py-2">Loading products…</p>}
              {!productsLoading && filteredProducts.length === 0 && (
                <p className="text-[12px] text-[var(--admin-text-muted)] px-1 py-2">No products match.</p>
              )}
              {!productsLoading &&
                filteredProducts.map((p) => {
                  const alreadyIn = p.category === category?.name;
                  return (
                    <label
                      key={p.id}
                      className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-[var(--admin-canvas)] cursor-pointer text-[13px] text-[var(--admin-ink)]"
                    >
                      <input
                        type="checkbox"
                        checked={alreadyIn || addedProductIds.has(p.id)}
                        disabled={alreadyIn}
                        onChange={() => toggleProduct(p.id)}
                        className="shrink-0"
                      />
                      <span className="truncate flex-1">{p.name}</span>
                      <span className="text-[11px] text-[var(--admin-text-muted)] shrink-0">{p.category}</span>
                    </label>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </ModalShell>
  );
}
