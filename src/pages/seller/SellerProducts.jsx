import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { seller } from '../../lib/api';
import { formatPKR } from '../../data/mockData';
import ProductFormModal from '../../components/ProductFormModal';
import ConfirmDialog from '../../components/ConfirmDialog';
import Toast from '../../components/Toast';
import SellerCard from '../../components/seller/SellerCard';
import StatCard from '../../components/seller/StatCard';
import StatusChipMenu from '../../components/seller/StatusChipMenu';
import { IconBox, IconChevronDown, IconEdit, IconPlus, IconTrash } from '../../components/icons';
import { PRODUCT_CHIP, PRODUCT_LABEL, PRODUCT_OUT_OF_STOCK_BADGE } from './statusChipPalette';

const FILTERS = ['All', 'Live', 'Draft'];

export default function SellerProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('All');

  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  const showToast = (message) => {
    setToastMessage(message);
    setToastVisible(true);
  };

  const load = () => {
    setLoading(true);
    setError(null);
    seller
      .products()
      .then((res) => setProducts(res.products))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openAdd = () => {
    setEditingProduct(null);
    setFormError(null);
    setFormOpen(true);
  };

  const openEdit = (product) => {
    setEditingProduct(product);
    setFormError(null);
    setFormOpen(true);
  };

  const handleSubmitForm = async (payload) => {
    setFormLoading(true);
    setFormError(null);
    try {
      if (editingProduct) {
        await seller.updateProduct(editingProduct.id, payload);
        showToast('Listing updated successfully');
      } else {
        const { product: created } = await seller.createProduct(payload);
        // POST /products' field allowlist doesn't know about priceTiers yet (B2B bulk pricing —
        // see ProductFormModal.jsx) — the base listing is created exactly as before, then this
        // one extra PATCH (already a generic passthrough) adds the tiers. A no-op when there
        // aren't any, so a normal B2C listing still creates in a single request.
        if (payload.priceTiers?.length > 0) {
          await seller.updateProduct(created.id, { priceTiers: payload.priceTiers });
        }
        showToast('Listing added successfully');
      }
      setFormOpen(false);
      load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleStatusChange = async (product, status) => {
    setStatusUpdatingId(product.id);
    try {
      await seller.updateProduct(product.id, { status });
      setProducts((current) => current.map((p) => (p.id === product.id ? { ...p, status } : p)));
    } catch (err) {
      setError(err.message);
    } finally {
      setStatusUpdatingId(null);
    }
  };

  // "Store display order" — controls the sequence buyers see these products in on the public
  // store page (see GET /api/sellers/:id's sort). Swapping just the two moved items would leave
  // everyone else's storeOrder null/stale, so every move re-numbers the *entire* current list
  // 0..N-1 in one pass — the first move a seller ever makes establishes a full order, not just a
  // partial one.
  const move = async (index, dir) => {
    const target = index + dir;
    if (target < 0 || target >= products.length || reordering) return;
    const reordered = [...products];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setProducts(reordered);
    setReordering(true);
    try {
      await Promise.all(reordered.map((p, i) => seller.updateProduct(p.id, { storeOrder: i })));
    } catch (err) {
      setError(err.message);
      load();
    } finally {
      setReordering(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await seller.deleteProduct(deleteTarget.id);
      setDeleteTarget(null);
      showToast('Listing deleted');
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const liveCount = products.filter((p) => p.status === 'active').length;
  const draftCount = products.filter((p) => p.status === 'draft').length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;
  const avgPrice = products.length ? products.reduce((sum, p) => sum + (Number(p.price) || 0), 0) / products.length : 0;

  const visibleProducts = products.filter((p) => {
    if (filter === 'Live') return p.status === 'active';
    if (filter === 'Draft') return p.status === 'draft';
    return true;
  });

  return (
    <div className="animate-fade-up flex flex-col gap-4">
      {!loading && !error && products.length > 0 && (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <StatCard label="Live listings" value={liveCount} note={`of ${products.length} total`} />
          <StatCard label="Drafts" value={draftCount} note="Awaiting review" />
          <StatCard label="Out of stock" value={outOfStockCount} note={outOfStockCount === 0 ? 'All good' : 'Needs restock'} />
          <StatCard label="Avg. price" value={formatPKR(Math.round(avgPrice))} note="Across catalogue" />
        </div>
      )}

      <SellerCard
        eyebrow="Catalogue"
        action={
          <div className="flex items-center gap-2 flex-wrap">
            {products.length > 0 &&
              FILTERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`text-[11.5px] font-bold rounded-full px-3 py-1.5 cursor-pointer border transition-colors ${
                    filter === f ? 'bg-green-tint border-green-tint-border text-ink-soft' : 'bg-surface-muted border-border text-text hover:text-ink'
                  }`}
                >
                  {f}
                </button>
              ))}
            <button
              type="button"
              onClick={openAdd}
              className="cursor-pointer flex items-center gap-1.5 bg-green hover:bg-green-hover text-white font-bold text-[12.5px] px-4 py-2 rounded-xl transition-colors whitespace-nowrap"
            >
              <IconPlus width="14" height="14" />
              Add listing
            </button>
          </div>
        }
      >
        {loading && (
          <div className="flex flex-col gap-2.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse h-16 bg-surface-muted rounded-2xl" />
            ))}
          </div>
        )}

        {!loading && error && <div className="p-6 text-center text-orange-text text-sm">{error}</div>}

        {!loading && !error && products.length === 0 && (
          <div className="p-8 text-center flex flex-col items-center gap-4">
            <span className="w-14 h-14 rounded-full bg-green-tint inline-flex items-center justify-center">
              <IconBox width="24" height="24" className="text-green" />
            </span>
            <p className="text-sm text-text">You haven't added any listings yet.</p>
            <button
              type="button"
              onClick={openAdd}
              className="cursor-pointer bg-green hover:bg-green-hover text-white font-semibold text-sm px-6 py-3 rounded-full transition-colors"
            >
              Add your first listing
            </button>
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <div className="flex flex-col gap-2">
            {visibleProducts.map((p, i) => (
              <div
                key={p.id}
                className="flex items-center gap-3 flex-wrap sm:flex-nowrap px-3.5 py-3 rounded-2xl bg-surface-muted border border-border"
              >
                <Link to={`/seller/products/${p.id}`} className="flex items-center gap-3 min-w-0 flex-1 no-underline">
                  <span className="w-10 h-10 rounded-lg overflow-hidden bg-surface border border-border flex items-center justify-center shrink-0">
                    {p.img ? <img src={p.img} alt="" className="w-full h-full object-cover" /> : <IconBox width="16" height="16" className="text-text-muted" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13.5px] font-bold text-ink truncate">{p.name}</span>
                    <span className="block text-[11.5px] text-text-muted truncate">
                      {p.sku ? `SKU ${p.sku}` : `${(p.views || 0).toLocaleString('en-US')} views`}
                    </span>
                  </span>
                </Link>
                <span className="text-[13.5px] font-bold text-ink whitespace-nowrap">
                  {formatPKR(p.price)} {p.unit && <span className="text-xs font-medium text-text-muted">/{p.unit}</span>}
                </span>
                <span className="text-[12.5px] text-text whitespace-nowrap w-[90px]">{p.stock === 0 ? '—' : `${p.stock} in stock`}</span>
                <span className="flex items-center gap-1.5 flex-wrap">
                  <StatusChipMenu
                    status={p.status}
                    cycleOptions={['active', 'draft']}
                    palette={PRODUCT_CHIP}
                    labelFor={PRODUCT_LABEL}
                    disabled={statusUpdatingId === p.id}
                    onChange={(status) => handleStatusChange(p, status)}
                  />
                  {p.stock === 0 && (
                    <span
                      className="text-[11px] font-bold px-3 py-1.5 rounded-full border"
                      style={{ background: PRODUCT_OUT_OF_STOCK_BADGE.bg, color: PRODUCT_OUT_OF_STOCK_BADGE.fg, borderColor: PRODUCT_OUT_OF_STOCK_BADGE.border }}
                    >
                      Out of stock
                    </span>
                  )}
                </span>
                <span className="flex items-center gap-1 shrink-0 ml-auto">
                  <button
                    type="button"
                    onClick={() => openEdit(p)}
                    aria-label="Edit"
                    title="Edit"
                    className="cursor-pointer bg-surface border border-border text-ink-soft p-2 rounded-lg hover:bg-surface transition-colors"
                  >
                    <IconEdit width="13" height="13" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(p)}
                    aria-label="Delete"
                    title="Delete"
                    className="cursor-pointer bg-surface border border-border text-orange-text p-2 rounded-lg hover:bg-orange-tint transition-colors"
                  >
                    <IconTrash width="13" height="13" />
                  </button>
                  {products.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => move(i, -1)}
                        disabled={i === 0 || reordering}
                        aria-label="Move up in store display order"
                        title="Move up in store display order"
                        className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 bg-surface border border-border text-ink-soft p-2 rounded-lg hover:bg-surface transition-colors"
                      >
                        <IconChevronDown width="13" height="13" className="rotate-180" />
                      </button>
                      <button
                        type="button"
                        onClick={() => move(i, 1)}
                        disabled={i === products.length - 1 || reordering}
                        aria-label="Move down in store display order"
                        title="Move down in store display order"
                        className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 bg-surface border border-border text-ink-soft p-2 rounded-lg hover:bg-surface transition-colors"
                      >
                        <IconChevronDown width="13" height="13" />
                      </button>
                    </>
                  )}
                </span>
              </div>
            ))}
            {visibleProducts.length === 0 && <div className="p-6 text-center text-sm text-text">No listings match this filter.</div>}
          </div>
        )}
      </SellerCard>

      <ProductFormModal
        open={formOpen}
        product={editingProduct}
        loading={formLoading}
        error={formError}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmitForm}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this listing?"
        message={`"${deleteTarget?.name}" will be permanently removed from your storefront. This can't be undone.`}
        confirmLabel="Delete"
        loading={deleteLoading}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />

      <Toast message={toastMessage} show={toastVisible} onHide={() => setToastVisible(false)} />
    </div>
  );
}
