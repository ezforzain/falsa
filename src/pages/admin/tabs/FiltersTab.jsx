import Card, { CardHeader } from '../../../components/admin/ui/Card';
import Button from '../../../components/admin/ui/Button';
import { FILTER_SECTIONS, FILTER_TYPE_LABELS } from '../filterConstants';
import { IconChevronDown, IconEdit, IconPlus, IconTrash } from '../../../components/icons';

export default function FiltersTab({
  filtersList,
  filtersLoading,
  filtersError,
  openAddFilter,
  openEditFilter,
  handleToggleFilterEnabled,
  handleMoveFilter,
  filterRowPendingId,
  setDeleteFilterTarget,
}) {
  return (
    <>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-[var(--admin-ink)] tracking-tight">Filters</h1>
        <p className="text-sm text-[var(--admin-text)] mt-1.5">
          Choose which filters shoppers see on each marketplace section, in what order, and (for Category / Country)
          which values are offered. Every filter is backed by real product data — nothing here is decorative.
        </p>
      </div>

      {filtersLoading && (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="animate-pulse h-40 bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-2xl" />
          ))}
        </div>
      )}

      {!filtersLoading && filtersError && <Card className="border-dashed text-center text-[var(--admin-danger)] text-sm">{filtersError}</Card>}

      {!filtersLoading && !filtersError && (
        <div className="flex flex-col gap-6">
          {FILTER_SECTIONS.map((section) => {
            const sectionFilters = filtersList.filter((f) => f.section === section.key).sort((a, b) => a.order - b.order);
            return (
              <Card key={section.key} padded={false}>
                <CardHeader title={section.label} action={<Button variant="secondary" size="sm" onClick={() => openAddFilter(section.key)}><IconPlus width="13" height="13" /> Add filter</Button>} />

                {sectionFilters.length === 0 ? (
                  <p className="text-sm text-[var(--admin-text-muted)] px-5 py-6 text-center">No filters added to this section yet.</p>
                ) : (
                  sectionFilters.map((f, i) => (
                    <div key={f.id} className={`flex items-center justify-between gap-3 px-5 py-3.5 flex-wrap ${i !== sectionFilters.length - 1 ? 'border-b border-[var(--admin-border)]' : ''}`}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex flex-col shrink-0">
                          <button
                            type="button"
                            onClick={() => handleMoveFilter(f, 'up')}
                            disabled={i === 0 || filterRowPendingId === f.id}
                            aria-label="Move up"
                            className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-25 text-[var(--admin-text-muted)] hover:text-[var(--admin-ink)] rotate-180"
                          >
                            <IconChevronDown width="13" height="13" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveFilter(f, 'down')}
                            disabled={i === sectionFilters.length - 1 || filterRowPendingId === f.id}
                            aria-label="Move down"
                            className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-25 text-[var(--admin-text-muted)] hover:text-[var(--admin-ink)]"
                          >
                            <IconChevronDown width="13" height="13" />
                          </button>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-[14px] text-[var(--admin-ink)] truncate">{f.label}</span>
                            <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-[var(--admin-text-muted)] bg-[var(--admin-canvas)] px-1.5 py-0.5 rounded">
                              {FILTER_TYPE_LABELS[f.type] || f.type}
                            </span>
                          </div>
                          {f.options?.length > 0 && <div className="text-xs text-[var(--admin-text-muted)] truncate mt-0.5">{f.options.join(', ')}</div>}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleFilterEnabled(f)}
                          disabled={filterRowPendingId === f.id}
                          className={`cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                            f.enabled ? 'bg-[var(--admin-success-tint)] text-[var(--admin-success)]' : 'bg-[var(--admin-canvas)] text-[var(--admin-text-muted)]'
                          }`}
                        >
                          {f.enabled ? 'Enabled' : 'Disabled'}
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditFilter(f)}
                          aria-label="Edit filter"
                          className="cursor-pointer flex items-center justify-center bg-[var(--admin-surface)] border border-[var(--admin-border)] text-[var(--admin-ink-soft)] p-2 rounded-full hover:bg-[var(--admin-canvas)] transition-colors"
                        >
                          <IconEdit width="13" height="13" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteFilterTarget(f)}
                          aria-label="Delete filter"
                          className="cursor-pointer flex items-center justify-center bg-[var(--admin-surface)] border border-[var(--admin-border)] text-[var(--admin-danger)] p-2 rounded-full hover:bg-[var(--admin-danger-tint)] transition-colors"
                        >
                          <IconTrash width="13" height="13" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
