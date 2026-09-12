// Shared card shell for the Admin Panel — every tab's panels/tables/stat blocks use this so
// radius, border, and surface color stay identical everywhere (see the `.admin-shell` tokens in
// src/index.css for the underlying palette).
export default function Card({ children, className = '', padded = true, as: Tag = 'div', ...rest }) {
  return (
    <Tag
      className={`bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-2xl ${padded ? 'p-5' : ''} ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({ title, description, action, className = '' }) {
  return (
    <div className={`flex items-center justify-between gap-3 flex-wrap px-5 py-4 border-b border-[var(--admin-border)] ${className}`}>
      <div className="min-w-0">
        <h2 className="font-display text-[15px] font-bold text-[var(--admin-ink)] truncate">{title}</h2>
        {description && <p className="text-xs text-[var(--admin-text-muted)] mt-0.5">{description}</p>}
      </div>
      {action}
    </div>
  );
}
