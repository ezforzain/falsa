import { useEffect, useState } from 'react';
import { IconUser } from './icons';

// Single shared avatar renderer — every screen that shows a user's identity (account menu,
// profile page, seller portal header, admin user list, ...) goes through this so a profile
// picture, once set, appears everywhere consistently, and the fallback always looks the same.
//
// Fallback: a Gmail/Slack-style initial letter on a tinted circle when a `name` is given (reads
// as a real, intentional placeholder at a glance), or the generic person icon when it isn't —
// the plain person icon, at typical avatar sizes, read as an unclear cut-off smudge rather than
// a recognizable placeholder, which the initial letter doesn't have that problem with.
export default function Avatar({ src, name, size = 40, iconSize, bgClassName = 'bg-green-tint', iconClassName = 'text-green', className = '' }) {
  const resolvedIconSize = iconSize || Math.round(size * 0.45);
  // A stale/broken avatarUrl (deleted upload, expired blob: URL, bad path…) previously left the
  // browser's own tiny "broken image" glyph sitting in the circle instead of falling back to the
  // placeholder below — reset per src so switching to a working photo tries again.
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [src]);

  const showImage = src && !broken;
  const initial = name?.trim()?.[0]?.toUpperCase();

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full overflow-hidden shrink-0 ${showImage ? 'bg-surface-muted' : bgClassName} ${className}`}
      style={{ width: size, height: size }}
    >
      {showImage ? (
        <img src={src} alt="" className="w-full h-full object-cover" onError={() => setBroken(true)} />
      ) : initial ? (
        <span className={`font-display font-bold leading-none ${iconClassName}`} style={{ fontSize: Math.round(size * 0.42) }}>
          {initial}
        </span>
      ) : (
        <IconUser width={resolvedIconSize} height={resolvedIconSize} className={iconClassName} />
      )}
    </span>
  );
}
