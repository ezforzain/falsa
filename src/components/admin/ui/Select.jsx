export default function Select({ className = '', children, ...rest }) {
  return (
    <select
      className={`px-3.5 py-2.5 border border-[var(--admin-border)] rounded-lg text-sm outline-none bg-[var(--admin-surface)] text-[var(--admin-ink)] focus:border-[var(--admin-primary)] focus:shadow-[0_0_0_3px_var(--admin-primary-tint)] transition-shadow cursor-pointer ${className}`}
      {...rest}
    >
      {children}
    </select>
  );
}
