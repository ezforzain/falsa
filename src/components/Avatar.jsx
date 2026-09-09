import { useEffect, useState } from 'react';
import { IconUser } from './icons';
import { resolveMediaUrl } from '../lib/media';

// Single shared avatar renderer — every screen that shows a user's identity (account menu,
// profile page, seller portal header, admin user list, ...) goes through this so a profile
// picture, once set, appears everywhere consistently, and the fallback (generic person icon in a
// tinted circle) always looks the same as it did before this feature existed.
export default function Avatar({ src, size = 40, iconSize, bgClassName = 'bg-green-tint', iconClassName = 'text-green', className = '' }) {
  const resolvedIconSize = iconSize || Math.round(size * 0.45);
  // A stale/broken avatarUrl (deleted upload, expired blob: URL, bad path…) previously left the
  // browser's own tiny "broken image" glyph sitting in the circle instead of falling back to the
  // generic person icon — reset per src so switching to a working photo tries again.
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [src]);

  const resolvedSrc = resolveMediaUrl(src);
  const showImage = resolvedSrc && !broken;

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full overflow-hidden shrink-0 ${showImage ? 'bg-surface-muted' : bgClassName} ${className}`}
      style={{ width: size, height: size }}
    >
      {showImage ? (
        <img src={resolvedSrc} alt="" className="w-full h-full object-cover" onError={() => setBroken(true)} />
      ) : (
        <IconUser width={resolvedIconSize} height={resolvedIconSize} className={iconClassName} />
      )}
    </span>
  );
}
