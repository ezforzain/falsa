import { IconClose } from '../../icons';

// Shared shell for the 5 Admin Panel form modals (AdminProductFormModal, AdminUserFormModal,
// AdminCategoryFormModal, AdminFilterFormModal, AdminOrderFormModal). Each of those keeps its own
// form state, validation, and onSubmit payload untouched — only the outer overlay/card/header/
// footer markup was extracted here so every admin modal looks and behaves identically.
export default function ModalShell({ title, onClose, maxWidth = 460, children, footer }) {
  return (
    <div className="admin-shell fixed inset-0 z-[100] flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className="relative w-full max-h-full overflow-y-auto bg-[var(--admin-surface)] rounded-2xl shadow-[var(--admin-shadow-lg)] p-6 animate-fade-up"
        style={{ maxWidth }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-lg font-bold text-[var(--admin-ink)]">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-[var(--admin-text-muted)] hover:text-[var(--admin-ink)] cursor-pointer p-1">
            <IconClose width="18" height="18" />
          </button>
        </div>

        {children}

        {footer && <div className="flex gap-3 mt-6">{footer}</div>}
      </div>
    </div>
  );
}

export const adminFieldClass =
  'w-full px-[14px] py-[11px] border border-[var(--admin-border)] rounded-lg text-[14px] font-sans bg-[var(--admin-surface)] text-[var(--admin-ink)] outline-none focus:border-[var(--admin-primary)] focus:shadow-[0_0_0_3px_var(--admin-primary-tint)] transition-shadow disabled:bg-[var(--admin-canvas)] disabled:text-[var(--admin-text-muted)]';

export const adminLabelClass = 'block text-[12.5px] font-semibold text-[var(--admin-ink-soft)] mb-1.5';

export function ModalError({ children }) {
  if (!children) return null;
  return <p className="text-sm text-[var(--admin-danger)] bg-[var(--admin-danger-tint)] rounded-lg px-3.5 py-2.5 mb-4">{children}</p>;
}
