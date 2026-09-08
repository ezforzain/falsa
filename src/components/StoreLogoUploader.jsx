import { useEffect, useRef, useState } from 'react';
import { toDisplayableImage } from '../lib/heic';
import { validateAvatarImageFile } from '../lib/file';
import { uploadFile } from '../lib/upload';
import Avatar from './Avatar';
import { IconCamera, IconTrash } from './icons';

const ACCEPT = 'image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif';

// The store's own logo — what buyers actually see on StoreCard, SellerInfoSection, and the store
// profile page, instead of the generic initials placeholder those fell back to before this field
// existed. Deliberately separate from AvatarUploader (which edits the seller's personal account
// picture, only ever shown inside the seller portal itself) and controlled via value/onChange so
// it can live inside SellerStoreProfile's own form state and save together with the rest of the
// store profile.
export default function StoreLogoUploader({ value, onChange, size = 96 }) {
  const inputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
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

    const validationError = validateAvatarImageFile(displayable);
    if (validationError) {
      setError(validationError);
      return;
    }

    const localUrl = URL.createObjectURL(displayable);
    setPreviewUrl(localUrl);
    setUploading(true);
    try {
      const { url } = await uploadFile('store-logos', displayable);
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

  const displaySrc = previewUrl || value || null;

  return (
    <div className="flex items-center gap-4">
      <div className="relative shrink-0">
        <Avatar src={displaySrc} size={size} iconSize={Math.round(size * 0.4)} />
        {uploading && (
          <span className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
            <span
              className="w-6 h-6 border-2 border-white/40 rounded-full inline-block"
              style={{ borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }}
            />
          </span>
        )}
        <button
          type="button"
          onClick={pickFile}
          disabled={uploading}
          aria-label="Edit store logo"
          title="Edit store logo"
          className="absolute bottom-0 right-0 cursor-pointer disabled:cursor-not-allowed w-8 h-8 rounded-full bg-green hover:bg-green-hover active:scale-90 text-white flex items-center justify-center border-[3px] border-surface shadow-md transition-all"
        >
          <IconCamera width="14" height="14" />
        </button>
      </div>

      <div className="flex flex-col gap-1.5 min-w-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={pickFile}
            disabled={uploading}
            className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 text-[13px] font-semibold text-green hover:underline"
          >
            {uploading ? 'Uploading…' : 'Edit logo'}
          </button>
          {value && !uploading && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="cursor-pointer flex items-center gap-1 text-[13px] font-semibold text-orange-text hover:underline"
            >
              <IconTrash width="12" height="12" />
              Remove
            </button>
          )}
        </div>
        <p className="text-[11.5px] text-text-muted leading-snug">Square photo works best · JPG, PNG, WEBP, or HEIC</p>
        {error && <p className="text-[11.5px] text-orange-text">{error}</p>}
      </div>

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
