import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { toDisplayableImage } from '../lib/heic';
import { validateAvatarImageFile } from '../lib/file';
import { uploadFile } from '../lib/upload';
import Avatar from './Avatar';
import { IconCamera, IconTrash } from './icons';

const ACCEPT = 'image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif';

// The one place a user actually changes their profile picture — upload/change/remove, with a
// real backend round trip (POST /api/uploads/avatars, then PATCH /api/auth/avatar). Every other
// screen just displays whatever context/user.avatarUrl already says via <Avatar>; updating it
// here through AuthContext's updateAvatar propagates everywhere automatically because they all
// read from the same user object.
export default function AvatarUploader({ size = 96, avatarClassName = '' }) {
  const { user, updateAvatar } = useAuth();
  const inputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Revoke the last object URL whenever it's replaced or the component unmounts, so we don't
  // leak memory across repeated picks.
  useEffect(() => () => previewUrl && URL.revokeObjectURL(previewUrl), [previewUrl]);

  const pickFile = () => inputRef.current?.click();

  const handleFile = async (rawFile) => {
    let displayable;
    try {
      displayable = await toDisplayableImage(rawFile);
    } catch {
      return;
    }

    if (validateAvatarImageFile(displayable)) return;

    const localUrl = URL.createObjectURL(displayable);
    setPreviewUrl(localUrl);
    setUploading(true);
    try {
      const { url } = await uploadFile('avatars', displayable);
      await updateAvatar(url);
    } catch {
      // Swallowed — no inline error UI here; the picture just stays as it was.
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
      await updateAvatar(null);
    } catch {
      // Swallowed — no inline error UI here; the picture just stays as it was.
    } finally {
      setUploading(false);
    }
  };

  const displaySrc = previewUrl || user?.avatarUrl || null;

  return (
    <div className="flex flex-col items-center gap-2.5">
      <div className="relative">
        <Avatar src={displaySrc} size={size} iconSize={Math.round(size * 0.4)} className={avatarClassName} />
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
          aria-label="Edit profile picture"
          title="Edit profile picture"
          className="absolute bottom-0 right-0 cursor-pointer disabled:cursor-not-allowed w-8 h-8 rounded-full bg-green hover:bg-green-hover active:scale-90 text-white flex items-center justify-center border-[3px] border-surface shadow-md transition-all"
        >
          <IconCamera width="14" height="14" />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={pickFile}
          disabled={uploading}
          className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 text-[13px] font-semibold text-green hover:underline"
        >
          Edit Profile Picture
        </button>
        {user?.avatarUrl && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={uploading}
            className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 flex items-center gap-1 text-[13px] font-semibold text-orange-text hover:underline"
          >
            <IconTrash width="12" height="12" />
            Remove
          </button>
        )}
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
