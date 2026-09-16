export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="border border-dashed border-[var(--admin-border-strong)] rounded-2xl p-10 text-center">
      {Icon && (
        <span className="w-14 h-14 rounded-full bg-[var(--admin-primary-tint)] inline-flex items-center justify-center mb-4">
          <Icon width="24" height="24" className="text-[var(--admin-primary)]" />
        </span>
      )}
      {title && <p className="text-sm font-semibold text-[var(--admin-ink)] mb-1">{title}</p>}
      {description && <p className="text-sm text-[var(--admin-text-muted)] mb-5">{description}</p>}
      {action}
    </div>
  );
}
