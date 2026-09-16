import { IconChevronLeft, IconChevronRight } from '../../icons';

const PAGE_SIZE_DEFAULT = 10;

// Purely client-side pagination over an already-fetched array — every admin list endpoint
// (adminUsers.list, adminOrders.list, admin.products, ...) already returns the full result set in
// one call, so this just slices what AdminPage.jsx already loaded rather than adding any new
// network request or backend paging param.
export function usePagination(items, pageSize = PAGE_SIZE_DEFAULT) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  return { pageSize, totalPages };
}

export default function Pagination({ page, totalPages, onChange, total, pageSize }) {
  if (totalPages <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-t border-[var(--admin-border)] flex-wrap">
      <span className="text-xs text-[var(--admin-text-muted)]">
        Showing <span className="font-semibold text-[var(--admin-ink-soft)]">{from}–{to}</span> of{' '}
        <span className="font-semibold text-[var(--admin-ink-soft)]">{total}</span>
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          aria-label="Previous page"
          className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 w-8 h-8 rounded-lg border border-[var(--admin-border)] flex items-center justify-center text-[var(--admin-ink-soft)] hover:bg-[var(--admin-canvas)] transition-colors"
        >
          <IconChevronLeft width="14" height="14" />
        </button>
        <span className="text-xs font-semibold text-[var(--admin-ink-soft)] px-2 whitespace-nowrap">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          aria-label="Next page"
          className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 w-8 h-8 rounded-lg border border-[var(--admin-border)] flex items-center justify-center text-[var(--admin-ink-soft)] hover:bg-[var(--admin-canvas)] transition-colors"
        >
          <IconChevronRight width="14" height="14" />
        </button>
      </div>
    </div>
  );
}
