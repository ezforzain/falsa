import Card from '../../../components/admin/ui/Card';
import Button from '../../../components/admin/ui/Button';
import EmptyState from '../../../components/admin/ui/EmptyState';
import { IconEdit, IconLayers, IconPlus, IconTrash } from '../../../components/icons';

export default function CategoriesTab({ categoriesList, categoriesLoading, categoriesError, openAddCategory, openEditCategory, setDeleteCategoryTarget }) {
  return (
    <>
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--admin-ink)] tracking-tight">Categories</h1>
          <p className="text-sm text-[var(--admin-text)] mt-1">The taxonomy buyers browse and sellers list products under.</p>
        </div>
        <Button onClick={openAddCategory}>
          <IconPlus width="15" height="15" />
          Add category
        </Button>
      </div>

      {categoriesLoading && (
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse h-16 bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-2xl" />
          ))}
        </div>
      )}

      {!categoriesLoading && categoriesError && <Card className="border-dashed text-center text-[var(--admin-danger)] text-sm">{categoriesError}</Card>}

      {!categoriesLoading && !categoriesError && categoriesList.length === 0 && (
        <EmptyState icon={IconLayers} description="No categories yet — add the first one." />
      )}

      {!categoriesLoading && !categoriesError && categoriesList.length > 0 && (
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {categoriesList.map((c) => (
            <Card key={c.id} className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-[var(--admin-primary-tint)] flex items-center justify-center shrink-0">
                  {c.icon ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d={c.icon} />
                    </svg>
                  ) : (
                    <IconLayers width="15" height="15" className="text-[var(--admin-primary)]" />
                  )}
                </span>
                <div className="min-w-0">
                  <div className="font-semibold text-[14px] text-[var(--admin-ink)] truncate">{c.name}</div>
                  <div className="text-xs text-[var(--admin-text-muted)] truncate">{c.key}</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => openEditCategory(c)}
                  aria-label="Edit category"
                  className="cursor-pointer flex items-center justify-center bg-[var(--admin-surface)] border border-[var(--admin-border)] text-[var(--admin-ink-soft)] p-2 rounded-full hover:bg-[var(--admin-canvas)] transition-colors"
                >
                  <IconEdit width="13" height="13" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteCategoryTarget(c)}
                  aria-label="Delete category"
                  className="cursor-pointer flex items-center justify-center bg-[var(--admin-surface)] border border-[var(--admin-border)] text-[var(--admin-danger)] p-2 rounded-full hover:bg-[var(--admin-danger-tint)] transition-colors"
                >
                  <IconTrash width="13" height="13" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
