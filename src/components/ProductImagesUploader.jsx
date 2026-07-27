import { useRef, useState } from 'react';
import { toDisplayableImage } from '../lib/heic';
import { validateProductImageFile } from '../lib/file';
import { uploadFile } from '../lib/upload';
import { IconCamera, IconClose, IconEdit, IconUpload } from './icons';

const ACCEPT = 'image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif';

// Real device/gallery upload for seller product photos — replaces the old plain-URL text field.
// Tap-to-pick surfaces the OS's own Gallery/Camera/Files chooser for free on mobile, drag & drop
// works on desktop, and HEIC photos (the default format on iPhones) are converted to JPEG
// client-side before upload (see lib/heic.js) — the server converts again as a safety net. Every
// entry in `images` is always a real, already-uploaded URL; nothing is added until its upload
// has actually succeeded.
export default function ProductImagesUploader({ images, onChange, max = 6 }) {
  const inputRef = useRef(null);
  const replaceInputRef = useRef(null);
  const replaceIndexRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [error, setError] = useState(null);

  const remainingSlots = Math.max(max - images.length - pendingCount, 0);

  const uploadOne = async (file) => {
    const displayable = await toDisplayableImage(file).catch(() => {
      throw new Error('Could not process that photo. Please try a different file.');
    });
    const validationError = validateProductImageFile(displayable);
    if (validationError) throw new Error(validationError);
    const { url } = await uploadFile('products', displayable);
    return url;
  };

  const addFiles = async (fileList) => {
    const files = Array.from(fileList).slice(0, remainingSlots);
    if (files.length === 0) return;
    setError(null);
    setPendingCount((n) => n + files.length);
    const results = await Promise.allSettled(files.map(uploadOne));
    const urls = results.filter((r) => r.status === 'fulfilled').map((r) => r.value);
    const failed = results.find((r) => r.status === 'rejected');
    if (urls.length > 0) onChange([...images, ...urls]);
    if (failed) setError(failed.reason?.message || 'Some photos could not be uploaded. Please try again.');
    setPendingCount((n) => Math.max(n - files.length, 0));
  };

  const replaceAt = async (index, file) => {
    setError(null);
    setPendingCount((n) => n + 1);
    try {
      const url = await uploadOne(file);
      onChange(images.map((existing, i) => (i === index ? url : existing)));
    } catch (err) {
      setError(err.message || 'Could not upload that photo. Please try again.');
    } finally {
      setPendingCount((n) => Math.max(n - 1, 0));
    }
  };

  const removeAt = (index) => onChange(images.filter((_, i) => i !== index));

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  return (
    <div>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
        {images.map((url, i) => (
          <div key={`${url}-${i}`} className="relative aspect-square rounded-xl overflow-hidden border border-border bg-surface-muted group">
            <img src={url} alt={`Product photo ${i + 1}`} className="w-full h-full object-cover" />
            {i === 0 && (
              <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9.5px] font-semibold px-1.5 py-0.5 rounded">
                Cover
              </span>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-colors">
              <button
                type="button"
                onClick={() => {
                  replaceIndexRef.current = i;
                  replaceInputRef.current?.click();
                }}
                aria-label="Replace photo"
                className="cursor-pointer w-7 h-7 rounded-full bg-white/90 hover:bg-white flex items-center justify-center text-ink"
              >
                <IconEdit width="13" height="13" />
              </button>
              <button
                type="button"
                onClick={() => removeAt(i)}
                aria-label="Remove photo"
                className="cursor-pointer w-7 h-7 rounded-full bg-white/90 hover:bg-white flex items-center justify-center text-orange-text"
              >
                <IconClose width="13" height="13" />
              </button>
            </div>
          </div>
        ))}

        {Array.from({ length: pendingCount }).map((_, i) => (
          <div key={`pending-${i}`} className="aspect-square rounded-xl border border-dashed border-border-strong flex items-center justify-center">
            <span
              className="w-5 h-5 border-2 border-border-strong rounded-full inline-block"
              style={{ borderTopColor: '#0E5A46', animation: 'spin 0.8s linear infinite' }}
            />
          </div>
        ))}

        {remainingSlots > 0 && (
          <label
            htmlFor="product-images-input"
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
            className={`aspect-square rounded-xl border-2 border-dashed cursor-pointer flex flex-col items-center justify-center gap-1 text-center px-1 transition-colors ${
              dragActive ? 'border-orange bg-orange-tint' : 'border-border hover:border-orange hover:bg-orange-tint/30'
            }`}
          >
            <IconUpload width="16" height="16" className="text-orange" />
            <span className="text-[10.5px] font-semibold text-ink-soft leading-tight">Add photo</span>
            <input
              id="product-images-input"
              ref={inputRef}
              type="file"
              accept={ACCEPT}
              multiple
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = '';
              }}
              className="sr-only"
            />
          </label>
        )}
      </div>

      <input
        ref={replaceInputRef}
        type="file"
        accept={ACCEPT}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file && replaceIndexRef.current !== null) replaceAt(replaceIndexRef.current, file);
        }}
        className="sr-only"
      />

      {error && <p className="text-xs text-orange-text mt-2">{error}</p>}

      <p className="text-[11px] text-text-muted mt-2 flex items-center gap-1">
        <IconCamera width="12" height="12" className="shrink-0" />
        First photo is the cover · select from your gallery, camera, or files · JPG, PNG, WEBP, or HEIC · up to {max}
      </p>
    </div>
  );
}
