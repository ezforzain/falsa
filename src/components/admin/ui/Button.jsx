const VARIANTS = {
  primary: 'bg-[var(--admin-primary)] hover:bg-[var(--admin-primary-hover)] text-white',
  secondary: 'bg-[var(--admin-surface)] border border-[var(--admin-border)] text-[var(--admin-ink-soft)] hover:bg-[var(--admin-canvas)]',
  danger: 'bg-[var(--admin-surface)] border border-[var(--admin-border)] text-[var(--admin-danger)] hover:bg-[var(--admin-danger-tint)]',
  ghost: 'text-[var(--admin-text)] hover:text-[var(--admin-ink)] hover:bg-[var(--admin-canvas)]',
};

const SIZES = {
  sm: 'text-xs px-3 py-1.5',
  md: 'text-sm px-4 py-2.5',
};

// Shared button for the Admin Panel — wraps the same disabled/spinner convention every existing
// modal already hand-rolls (see AdminProductFormModal etc.), just centralized and re-themed.
export default function Button({ variant = 'primary', size = 'md', loading = false, disabled, className = '', children, ...rest }) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={`cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 inline-flex items-center justify-center gap-1.5 font-semibold rounded-full transition-colors ${VARIANTS[variant] || VARIANTS.primary} ${SIZES[size] || SIZES.md} ${className}`}
      {...rest}
    >
      {loading && (
        <span
          className="w-3.5 h-3.5 border-2 border-current/30 rounded-full inline-block shrink-0"
          style={{ borderTopColor: 'currentColor', animation: 'spin 0.8s linear infinite' }}
        />
      )}
      {children}
    </button>
  );
}
