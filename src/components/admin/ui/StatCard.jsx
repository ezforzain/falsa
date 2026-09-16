const TINTS = {
  primary: 'bg-[var(--admin-primary-tint)] text-[var(--admin-primary)]',
  success: 'bg-[var(--admin-success-tint)] text-[var(--admin-success)]',
  info: 'bg-[var(--admin-info-tint)] text-[var(--admin-info)]',
  warning: 'bg-[var(--admin-warning-tint)] text-[var(--admin-warning)]',
  danger: 'bg-[var(--admin-danger-tint)] text-[var(--admin-danger)]',
};

// `emphasis` is reserved for the single most important metric on a stat row (Revenue) — a
// slightly larger number and a tinted wash/border, not a different grid size, so cards still
// align perfectly in the row instead of breaking the grid.
export default function StatCard({ label, value, icon: Icon, tone = 'primary', trend, emphasis = false }) {
  return (
    <div
      className={`rounded-2xl p-6 transition-all hover:shadow-[var(--admin-shadow-md)] hover:-translate-y-0.5 shadow-[var(--admin-shadow-sm)] ${
        emphasis
          ? 'bg-[var(--admin-primary-tint)] border border-[var(--admin-primary-border)]'
          : 'bg-[var(--admin-surface)] border border-[var(--admin-border)]'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-4">
        {Icon && (
          <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${TINTS[tone] || TINTS.primary}`}>
            <Icon width="19" height="19" />
          </span>
        )}
        {trend != null && (
          <span className={`text-xs font-bold ${trend >= 0 ? 'text-[var(--admin-success)]' : 'text-[var(--admin-danger)]'}`}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div className={`font-display font-bold text-[var(--admin-ink)] leading-tight ${emphasis ? 'text-3xl' : 'text-2xl'}`}>{value}</div>
      <div className="text-[13px] text-[var(--admin-text-muted)] mt-1 font-medium">{label}</div>
    </div>
  );
}
