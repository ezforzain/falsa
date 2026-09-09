import { useEffect, useRef, useState } from 'react';
import { toDisplayableImage } from '../lib/heic';
import { validatePromoBannerImageFile } from '../lib/file';
import { uploadFile } from '../lib/upload';
import { seller } from '../lib/api';
import { IconChevronDown, IconPlus, IconTrash } from './icons';

const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,.heic,.heif';

// Extra promo/sale banners (plural, GIF-capable) shown as a carousel at the top of the seller's
// public store page — distinct from the single static cover banner in StoreBannerUploader just
// above it on this form. Unlike that one, each action here (add/remove/reorder) saves straight to
// the server immediately rather than waiting on the page's "Save changes" button, since there's
// no other seller-editable state riding along with it.
export default function PromoBannerManager({ banners, onChange }) {
  const inputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => () => previewUrl && URL.revokeObjectURL(previewUrl), [previewUrl]);

  const pickFile = () => inputRef.current?.click();

  const handleFile = async (rawFile) => {
    setError(null);
    let displayable;
    try {
      displayable = await toDisplayableImage(rawFile);
    } catch {
      setError('Could not process that photo. Please try a different file.');
      return;
    }

    const validationError = validatePromoBannerImageFile(displayable);
    if (validationError) {
      setError(validationError);
      return;
    }

    const localUrl = URL.createObjectURL(displayable);
    setPreviewUrl(localUrl);
    setUploading(true);
    try {
      const { url } = await uploadFile('store-banners', displayable);
      const { store } = await seller.addStoreBanner(url);
      onChange(store.promoBanners);
    } catch (err) {
      setError(err.message || 'Could not add that banner. Please try again.');
    } finally {
      setUploading(false);
      setPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return null;
      });
    }
  };

  const remove = async (bannerId) => {
    setError(null);
    setBusyId(bannerId);
    try {
      const { store } = await seller.removeStoreBanner(bannerId);
      onChange(store.promoBanners);
    } catch (err) {
      setError(err.message || 'Could not remove that banner. Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  const move = async (index, dir) => {
    const target = index + dir;
    if (target < 0 || target >= banners.length) return;
    const reordered = [...banners];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    onChange(reordered); // optimistic — snaps back on failure via the reload below
    setError(null);
    setBusyId(reordered[target].id);
    try {
      const { store } = await seller.reorderStoreBanners(reordered.map((b) => b.id));
      onChange(store.promoBanners);
    } catch (err) {
      onChange(banners); // failed — revert the optimistic swap
      setError(err.message || 'Could not reorder banners. Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex flex-col gap-2.5">
      {banners.length > 0 && (
        <div className="flex flex-col gap-2">
          {banners.map((b, i) => (
            <div key={b.id} className="flex items-center gap-2.5 bg-surface-muted rounded-xl p-2">
              <img src={b.url} alt="" className="w-20 h-12 object-cover rounded-lg shrink-0 bg-surface-muted" />
              <span className="flex-1 min-w-0 text-xs text-text-muted truncate">Banner {i + 1}</span>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0 || busyId === b.id}
                  aria-label="Move up"
                  className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 text-text-muted hover:text-ink p-1.5 rounded-lg hover:bg-surface transition-colors"
                >
                  <IconChevronDown width="13" height="13" className="rotate-180" />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === banners.length - 1 || busyId === b.id}
                  aria-label="Move down"
                  className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 text-text-muted hover:text-ink p-1.5 rounded-lg hover:bg-surface transition-colors"
                >
                  <IconChevronDown width="13" height="13" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(b.id)}
                  disabled={busyId === b.id}
                  aria-label="Remove banner"
                  className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 text-orange-text hover:text-orange p-1.5 rounded-lg hover:bg-surface transition-colors"
                >
                  <IconTrash width="14" height="14" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={pickFile}
        disabled={uploading}
        className="cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl py-3.5 text-[13px] font-semibold text-text-muted hover:text-green hover:border-green transition-colors"
      >
        {uploading ? (
          <span className="w-4 h-4 border-2 border-border-strong rounded-full inline-block" style={{ borderTopColor: '#0E5A46', animation: 'spin 0.8s linear infinite' }} />
        ) : (
          <IconPlus width="15" height="15" />
        )}
        {uploading ? 'Uploading…' : previewUrl ? 'Uploading…' : 'Add a promo banner'}
      </button>

      {error && <p className="text-[11.5px] text-orange-text">{error}</p>}

      <p className="text-[11.5px] text-text-muted leading-snug">
        Recommended 1200×300px · JPG, PNG, WEBP, or GIF (animated banners supported) · up to 8MB — shown as a carousel on your public
        store page, above your products.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) handleFile(file);
        }}
        className="sr-only"
      />
    </div>
  );
}
