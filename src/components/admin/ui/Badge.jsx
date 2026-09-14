const TONES = {
  neutral: 'bg-[var(--admin-canvas)] text-[var(--admin-text)]',
  primary: 'bg-[var(--admin-primary-tint)] text-[var(--admin-primary)]',
  success: 'bg-[var(--admin-success-tint)] text-[var(--admin-success)]',
  info: 'bg-[var(--admin-info-tint)] text-[var(--admin-info)]',
  warning: 'bg-[var(--admin-warning-tint)] text-[var(--admin-warning)]',
  danger: 'bg-[var(--admin-danger-tint)] text-[var(--admin-danger)]',
  solid: 'bg-[var(--admin-success)] text-white',
};

const DOT_COLORS = {
  neutral: 'var(--admin-text-muted)',
  primary: 'var(--admin-primary)',
  success: 'var(--admin-success)',
  info: 'var(--admin-info)',
  warning: 'var(--admin-warning)',
  danger: 'var(--admin-danger)',
  solid: 'var(--admin-success)',
};

// Mirrors the seller portal's order-status colors (src/pages/seller/statusStyles.js) so an order
// reads the same way whether an admin or a seller is looking at it — just re-expressed as a tone
// name the admin Badge/StatusMenu components understand instead of that file's raw class strings.
export const ORDER_STATUS_TONES = {
  Pending: 'warning',
  Processing: 'info',
  Shipped: 'primary',
  Delivered: 'solid',
  Cancelled: 'neutral',
};

export function Badge({ tone = 'neutral', dot = false, children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full whitespace-nowrap ${TONES[tone] || TONES.neutral} ${className}`}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: DOT_COLORS[tone] || DOT_COLORS.neutral }} />}
      {children}
    </span>
  );
}

export default Badge;
