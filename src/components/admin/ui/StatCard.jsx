const TINTS = {
  primary: 'bg-[var(--admin-primary-tint)] text-[var(--admin-primary)]',
  success: 'bg-[var(--admin-success-tint)] text-[var(--admin-success)]',
  info: 'bg-[var(--admin-info-tint)] text-[var(--admin-info)]',
  warning: 'bg-[var(--admin-warning-tint)] text-[var(--admin-warning)]',
  danger: 'bg-[var(--admin-danger-tint)] text-[var(--admin-danger)]',
};

export default function StatCard({ label, value, icon: Icon, tone = 'primary', trend }) {
  return (
    <div className="bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-2xl p-5 transition-all hover:shadow-[var(--admin-shadow-md)] hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-2 mb-3">
        {Icon && (
          <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${TINTS[tone] || TINTS.primary}`}>
            <Icon width="17" height="17" />
          </span>
        )}
        {trend != null && (
          <span className={`text-[11px] font-bold ${trend >= 0 ? 'text-[var(--admin-success)]' : 'text-[var(--admin-danger)]'}`}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div className="font-display text-xl font-bold text-[var(--admin-ink)] leading-tight">{value}</div>
      <div className="text-xs text-[var(--admin-text-muted)] mt-0.5">{label}</div>
    </div>
  );
}
