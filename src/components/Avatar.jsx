import { IconUser } from './icons';

// Single shared avatar renderer — every screen that shows a user's identity (account menu,
// profile page, seller portal header, admin user list, ...) goes through this so a profile
// picture, once set, appears everywhere consistently, and the fallback (generic person icon in a
// tinted circle) always looks the same as it did before this feature existed.
export default function Avatar({ src, size = 40, iconSize, bgClassName = 'bg-green-tint', iconClassName = 'text-green', className = '' }) {
  const resolvedIconSize = iconSize || Math.round(size * 0.45);

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full overflow-hidden shrink-0 ${src ? 'bg-surface-muted' : bgClassName} ${className}`}
      style={{ width: size, height: size }}
    >
      {src ? (
        <img src={src} alt="" className="w-full h-full object-cover" />
      ) : (
        <IconUser width={resolvedIconSize} height={resolvedIconSize} className={iconClassName} />
      )}
    </span>
  );
}
