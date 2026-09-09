import { useEffect, useRef, useState } from 'react';
import { toDisplayableImage } from '../lib/heic';
import { validateBannerImageFile } from '../lib/file';
import { uploadFile } from '../lib/upload';
import { resolveMediaUrl } from '../lib/media';
import { IconCamera, IconTrash, IconUpload } from './icons';

const ACCEPT = 'image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif';

// Store cover banner — controlled (value/onChange) so it lives inside SellerStoreProfile's own
// form state, alongside StoreLogoUploader. Previously this reused the generic ProductImagesUploader
// (a square thumbnail grid meant for product photo galleries), which is why the banner never
// looked "right" while editing it: a square crop preview for an image that's actually displayed
// full-width and short (see the h-[140px]/h-[180px] w-full object-cover box on StorePage). This
// preview box matches that exact box, drag & drop works directly on it, and hover reveals
// Replace/Remove — closer to a real cover-photo editor than a bare upload grid.
export default function StoreBannerUploader({ value, onChange }) {
  const inputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
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

    const validationError = validateBannerImageFile(displayable);
    if (validationError) {
      setError(validationError);
      return;
    }

    const localUrl = URL.createObjectURL(displayable);
    setPreviewUrl(localUrl);
    setUploading(true);
    try {
      const { url } = await uploadFile('store-banners', displayable);
      onChange(url);
    } catch (err) {
      setError(err.message || 'Could not upload that photo. Please try again.');
    } finally {
      setUploading(false);
      setPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return null;
      });
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const displaySrc = previewUrl || resolveMediaUrl(value) || null;

  return (
    <div className="flex flex-col gap-2.5">
      <div
        onDragEnter={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragActive(false);
        }}
        onDrop={handleDrop}
        className={`group relative h-[140px] sm:h-[180px] w-full rounded-2xl overflow-hidden border-2 transition-colors ${
          dragActive ? 'border-orange bg-orange-tint/30' : 'border-dashed border-border bg-gradient-to-br from-green-deep via-green to-green-hover'
        }`}
        style={displaySrc ? { border: '2px solid transparent' } : undefined}
      >
        {displaySrc && <img src={displaySrc} alt="" className="w-full h-full object-cover" />}

        {!displaySrc && !uploading && (
          <button
            type="button"
            onClick={pickFile}
            className="cursor-pointer absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/90"
          >
            <IconUpload width="22" height="22" />
            <span className="text-[13px] font-semibold">Drag & drop, or click to upload a store banner</span>
          </button>
        )}

        {uploading && (
          <span className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span
              className="w-6 h-6 border-2 border-white/40 rounded-full inline-block"
              style={{ borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }}
            />
          </span>
        )}

        {displaySrc && !uploading && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-end justify-end p-2.5 gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100">
            <button
              type="button"
              onClick={pickFile}
              className="cursor-pointer flex items-center gap-1.5 bg-white/90 hover:bg-white text-ink text-[12px] font-semibold px-3 py-1.5 rounded-full transition-colors"
            >
              <IconCamera width="13" height="13" />
              Replace
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="cursor-pointer flex items-center gap-1.5 bg-white/90 hover:bg-white text-orange-text text-[12px] font-semibold px-3 py-1.5 rounded-full transition-colors"
            >
              <IconTrash width="13" height="13" />
              Remove
            </button>
          </div>
        )}
      </div>

      {error && <p className="text-[11.5px] text-orange-text">{error}</p>}

      <p className="text-[11.5px] text-text-muted leading-snug">
        Recommended 1200×300px (wide) · JPG, PNG, WEBP, or HEIC · up to 8MB — shown across the top of your public store page
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
