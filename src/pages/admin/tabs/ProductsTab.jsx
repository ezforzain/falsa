import { useEffect, useState } from 'react';
import { formatPKR } from '../../../data/mockData';
import VerifiedBadge from '../../../components/VerifiedBadge';
import Card, { CardHeader } from '../../../components/admin/ui/Card';
import Button from '../../../components/admin/ui/Button';
import EmptyState from '../../../components/admin/ui/EmptyState';
import SearchInput from '../../../components/admin/ui/SearchInput';
import Pagination from '../../../components/admin/ui/Pagination';
import { IconBox, IconEdit, IconPlus, IconSparkle, IconTrash } from '../../../components/icons';

const PAGE_SIZE = 12;

// Off/Featured/Sponsored are visually distinct states (not "everything purple") — Off is neutral,
// Featured uses the info/blue accent, Sponsored uses the primary/purple accent, matching how much
// visibility each one actually buys the seller.
const SPOTLIGHT_OPTS = [
  { value: null, label: 'Off', activeClass: 'bg-[var(--admin-ink-soft)] text-white' },
  { value: 'featured', label: 'Featured', activeClass: 'bg-[var(--admin-info)] text-white' },
  { value: 'sponsored', label: 'Sponsored', activeClass: 'bg-[var(--admin-primary)] text-white' },
];

function PromotionRequests({ promotionRequests, rejectingPromoId, setRejectingPromoId, promoRejectReason, setPromoRejectReason, reviewingPromoId, onApprove, onReject }) {
  const pending = promotionRequests.filter((r) => r.status === 'pending');
  if (pending.length === 0) return null;

  return (
    <Card padded={false} className="mb-6">
      <CardHeader
        title={`Pending promotion requests (${pending.length})`}
        className="bg-[var(--admin-warning-tint)]/40"
      />
      {pending.map((req, i, arr) => (
        <div key={req.id} className={`px-6 py-4 flex items-center justify-between gap-4 flex-wrap ${i !== arr.length - 1 ? 'border-b border-[var(--admin-border)]' : ''}`}>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-[var(--admin-ink)] truncate">{req.productName}</div>
            <div className="text-xs text-[var(--admin-text-muted)] truncate mt-0.5">
              {req.sellerName || 'Unknown seller'} · requesting{' '}
              <span className="font-semibold text-[var(--admin-ink-soft)] capitalize">{req.spotlightType}</span>
              {req.budgetPkr && <> · budget <span className="font-semibold text-[var(--admin-ink-soft)]">{formatPKR(req.budgetPkr)}</span></>}
              {req.note && ` · "${req.note}"`}
            </div>
          </div>

          {rejectingPromoId === req.id ? (
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="text"
                value={promoRejectReason}
                onChange={(e) => setPromoRejectReason(e.target.value)}
                placeholder="Reason (optional)"
                className="px-3 py-2 border border-[var(--admin-border)] rounded-lg text-xs outline-none focus:border-[var(--admin-primary)] w-[200px] bg-[var(--admin-surface)] text-[var(--admin-ink)]"
              />
              <Button variant="secondary" size="sm" onClick={() => setRejectingPromoId(null)}>Cancel</Button>
              <Button variant="danger" size="sm" loading={reviewingPromoId === req.id} onClick={() => onReject(req)}>Confirm reject</Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="danger"
                size="sm"
                disabled={reviewingPromoId === req.id}
                onClick={() => {
                  setRejectingPromoId(req.id);
                  setPromoRejectReason('');
                }}
              >
                Reject
              </Button>
              <Button size="sm" loading={reviewingPromoId === req.id} onClick={() => onApprove(req)}>Approve</Button>
            </div>
          )}
        </div>
      ))}
    </Card>
  );
}

export default function ProductsTab({
  promotionRequests,
  promotionsLoading,
  promotionsError,
  rejectingPromoId,
  setRejectingPromoId,
  promoRejectReason,
  setPromoRejectReason,
  reviewingPromoId,
  handleApprovePromotion,
  handleRejectPromotion,
  products,
  productsLoading,
  productsError,
  openAddProduct,
  openEditProduct,
  setDeleteProductTarget,
  spotlightUpdatingId,
  handleSetSpotlight,
  reachPendingId,
  handleSetReach,
}) {
  // Client-side search/pagination over the already-fetched `products` array — no new API calls.
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filtered = search.trim()
    ? products.filter((p) => `${p.name} ${p.sellerName}`.toLowerCase().includes(search.trim().toLowerCase()))
    : products;

  useEffect(() => setPage(1), [search, products.length]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      {!promotionsLoading && !promotionsError && (
        <PromotionRequests
          promotionRequests={promotionRequests}
          rejectingPromoId={rejectingPromoId}
          setRejectingPromoId={setRejectingPromoId}
          promoRejectReason={promoRejectReason}
          setPromoRejectReason={setPromoRejectReason}
          reviewingPromoId={reviewingPromoId}
          onApprove={handleApprovePromotion}
          onReject={handleRejectPromotion}
        />
      )}

      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-[var(--admin-ink)] tracking-tight">Products</h1>
          <p className="text-sm text-[var(--admin-text)] mt-1.5">Add, edit, and manage products listed on the marketplace.</p>
        </div>
        <Button onClick={openAddProduct}>
          <IconPlus width="16" height="16" />
          Add product
        </Button>
      </div>

      {!productsLoading && !productsError && products.length > 0 && (
        <div className="mb-5">
          <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products by name or seller…" className="max-w-[380px]" />
        </div>
      )}

      {productsLoading && (
        <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-2xl h-[280px]" />
          ))}
        </div>
      )}

      {!productsLoading && productsError && <Card className="border-dashed text-center text-[var(--admin-danger)] text-sm">{productsError}</Card>}

      {!productsLoading && !productsError && products.length === 0 && (
        <EmptyState icon={IconBox} description="No products yet." action={<Button onClick={openAddProduct}>Add your first product</Button>} />
      )}

      {!productsLoading && !productsError && products.length > 0 && filtered.length === 0 && (
        <EmptyState icon={IconBox} description="No products match your search." />
      )}

      {!productsLoading && !productsError && filtered.length > 0 && (
        <>
          <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
            {pageItems.map((p) => (
              <Card key={p.id} padded={false} className="overflow-hidden flex flex-col">
                <div className="h-[150px] relative overflow-hidden bg-[var(--admin-canvas)] shrink-0">
                  <img src={p.img} alt={p.name} className="w-full h-full object-cover" />
                  {p.images?.length > 1 && (
                    <span className="absolute top-2.5 right-2.5 bg-black/55 text-white text-[10.5px] font-semibold px-2 py-1 rounded-full">
                      +{p.images.length - 1} photo{p.images.length - 1 === 1 ? '' : 's'}
                    </span>
                  )}
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="text-[15px] font-semibold text-[var(--admin-ink)] leading-snug line-clamp-2 mb-1.5 min-h-[42px]">{p.name}</div>
                  <div className="flex items-center gap-1 mb-2 min-w-0">
                    <span className="text-xs text-[var(--admin-text-muted)] truncate">{p.sellerName}</span>
                    {p.verified && <VerifiedBadge size={13} />}
                  </div>
                  <div className="flex items-baseline justify-between mb-4">
                    <span className="font-display font-bold text-[var(--admin-primary)] text-base">
                      {p.price}
                      {p.unit && <span className="text-xs font-medium text-[var(--admin-text-muted)]"> /{p.unit}</span>}
                    </span>
                    {p.stock !== null && p.stock !== undefined && (
                      <span className={`text-xs font-semibold ${p.stock === 0 ? 'text-[var(--admin-danger)]' : 'text-[var(--admin-text-muted)]'}`}>
                        {p.stock === 0 ? 'Out of stock' : `${p.stock} in stock`}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 mb-3">
                    <Button variant="secondary" size="sm" className="flex-1" onClick={() => openEditProduct(p)}>
                      <IconEdit width="13" height="13" /> Edit
                    </Button>
                    <Button variant="danger" size="sm" className="flex-1" onClick={() => setDeleteProductTarget(p)}>
                      <IconTrash width="13" height="13" /> Delete
                    </Button>
                  </div>

                  <div className="flex items-center gap-1.5 pt-3 border-t border-[var(--admin-border)]">
                    <IconSparkle width="12" height="12" className="text-[var(--admin-warning)] shrink-0" />
                    <div className="flex gap-1 flex-1">
                      {SPOTLIGHT_OPTS.map((opt) => {
                        const isActive = opt.value === null ? !p.spotlight : p.spotlight && p.spotlightType === opt.value;
                        return (
                          <button
                            key={opt.label}
                            type="button"
                            disabled={spotlightUpdatingId === p.id}
                            onClick={() => handleSetSpotlight(p, opt.value !== null, opt.value || 'featured')}
                            className={`flex-1 text-[10.5px] font-semibold py-1.5 rounded-md cursor-pointer transition-colors disabled:opacity-50 ${
                              isActive ? opt.activeClass : 'bg-[var(--admin-canvas)] text-[var(--admin-text-muted)] hover:bg-[var(--admin-border)]'
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-3 mt-3 border-t border-[var(--admin-border)]">
                    <span className="text-[10.5px] font-semibold text-[var(--admin-text-muted)] uppercase tracking-wide shrink-0">Reach</span>
                    <div className="flex items-center gap-1.5 flex-1 justify-end">
                      <button
                        type="button"
                        disabled={reachPendingId === p.id || (p.reachBoost || 1) <= 1}
                        onClick={() => handleSetReach(p, (p.reachBoost || 1) - 1)}
                        className="cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed w-6 h-6 rounded-md bg-[var(--admin-canvas)] text-[var(--admin-ink-soft)] font-bold text-sm flex items-center justify-center hover:bg-[var(--admin-border)] transition-colors"
                        aria-label="Lower reach"
                      >
                        −
                      </button>
                      <span className={`min-w-[34px] text-center text-xs font-bold ${(p.reachBoost || 1) > 1 ? 'text-[var(--admin-primary)]' : 'text-[var(--admin-text-muted)]'}`}>
                        {reachPendingId === p.id ? '…' : `${p.reachBoost || 1}×`}
                      </span>
                      <button
                        type="button"
                        disabled={reachPendingId === p.id || (p.reachBoost || 1) >= 10}
                        onClick={() => handleSetReach(p, (p.reachBoost || 1) + 1)}
                        className="cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed w-6 h-6 rounded-md bg-[var(--admin-canvas)] text-[var(--admin-ink-soft)] font-bold text-sm flex items-center justify-center hover:bg-[var(--admin-border)] transition-colors"
                        aria-label="Raise reach"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          {totalPages > 1 && (
            <Card padded={false} className="mt-5">
              <Pagination page={page} totalPages={totalPages} onChange={setPage} total={filtered.length} pageSize={PAGE_SIZE} />
            </Card>
          )}
        </>
      )}
    </>
  );
}
