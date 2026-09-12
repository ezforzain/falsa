import { IconSearch } from '../../icons';

// Wraps the existing "search form" pattern (a text input + optional select + submit button that
// each admin tab already builds inline) in one consistent shell — behavior/handlers are passed in
// unchanged from AdminPage.jsx, this only standardizes the look.
export default function SearchInput({ value, onChange, placeholder, className = '' }) {
  return (
    <div className={`relative flex-1 min-w-[220px] ${className}`}>
      <IconSearch width="15" height="15" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--admin-text-muted)] pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full pl-10 pr-3.5 py-2.5 border border-[var(--admin-border)] rounded-lg text-sm outline-none bg-[var(--admin-surface)] text-[var(--admin-ink)] focus:border-[var(--admin-primary)] focus:shadow-[0_0_0_3px_var(--admin-primary-tint)] transition-shadow"
      />
    </div>
  );
}
