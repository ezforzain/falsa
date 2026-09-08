import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { toDisplayableImage } from '../lib/heic';
import { validateBannerImageFile } from '../lib/file';
import { uploadFile } from '../lib/upload';
import { IconCamera, IconTrash } from './icons';

const ACCEPT = 'image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif';

// The cover-photo counterpart to AvatarUploader — same real backend round trip (POST
// /api/uploads/store-banners, then PATCH /api/auth/banner), just a wide image instead of a
// circular one. Used inside EditProfileSheet; every other screen that shows the banner (the
// profile hero itself) just reads user.bannerUrl via AuthContext like it does for avatarUrl.
export default function BannerUploader() {
  const { user, updateBanner } = useAuth();
  const inputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => () => previewUrl && URL.revokeObjectURL(previewUrl), [previewUrl]);

  const pickFile = () => inputRef.current?.click();

  const handleFile = async (rawFile) => {
    let displayable;
    try {
      displayable = await toDisplayableImage(rawFile);
    } catch {
      return;
    }

    if (validateBannerImageFile(displayable)) return;

    const localUrl = URL.createObjectURL(displayable);
    setPreviewUrl(localUrl);
    setUploading(true);
    try {
      const { url } = await uploadFile('store-banners', displayable);
      await updateBanner(url);
    } catch {
      // Swallowed — no inline error UI here; the banner just stays as it was.
    } finally {
      setUploading(false);
      setPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return null;
      });
    }
  };

  const handleRemove = async () => {
    setUploading(true);
    try {
      await updateBanner(null);
    } catch {
      // Swallowed — no inline error UI here.
    } finally {
      setUploading(false);
    }
  };

  const displaySrc = previewUrl || user?.bannerUrl || null;

  return (
    <div className="flex flex-col gap-2.5">
      <div className="relative h-28 sm:h-32 rounded-2xl overflow-hidden bg-gradient-to-br from-green-deep via-green to-green-hover">
        {displaySrc && <img src={displaySrc} alt="" className="w-full h-full object-cover" />}
        {uploading && (
          <span className="absolute inset-0 bg-black/40 flex items-center justify-center">
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
          aria-label="Edit banner"
          title="Edit banner"
          className="absolute bottom-2.5 right-2.5 cursor-pointer disabled:cursor-not-allowed flex items-center gap-1.5 bg-black/45 hover:bg-black/60 active:scale-95 text-white text-[12px] font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm transition-all"
        >
          <IconCamera width="13" height="13" />
          Edit banner
        </button>
      </div>

      {user?.bannerUrl && (
        <button
          type="button"
          onClick={handleRemove}
          disabled={uploading}
          className="self-start cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 flex items-center gap-1 text-[12.5px] font-semibold text-orange-text hover:underline"
        >
          <IconTrash width="12" height="12" />
          Remove banner
        </button>
      )}

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
