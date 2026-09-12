// Shared card shell for the Admin Panel — every tab's panels/tables/stat blocks use this so
// radius, border, and surface color stay identical everywhere (see the `.admin-shell` tokens in
// src/index.css for the underlying palette). A very subtle default shadow (not just on hover)
// gives cards a touch of depth against the canvas without looking heavy.
export default function Card({ children, className = '', padded = true, as: Tag = 'div', ...rest }) {
  return (
    <Tag
      className={`bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-2xl shadow-[var(--admin-shadow-sm)] ${padded ? 'p-6' : ''} ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({ title, description, action, className = '' }) {
  return (
    <div className={`flex items-center justify-between gap-3 flex-wrap px-6 py-5 border-b border-[var(--admin-border)] ${className}`}>
      <div className="min-w-0">
        <h2 className="font-display text-base font-bold text-[var(--admin-ink)] truncate">{title}</h2>
        {description && <p className="text-[13px] text-[var(--admin-text-muted)] mt-0.5">{description}</p>}
      </div>
      {action}
    </div>
  );
}
