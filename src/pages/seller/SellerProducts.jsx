import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { seller } from '../../lib/api';
import { formatPKR } from '../../data/mockData';
import ProductFormModal from '../../components/ProductFormModal';
import ConfirmDialog from '../../components/ConfirmDialog';
import Toast from '../../components/Toast';
import { IconBox, IconEdit, IconPlus, IconTrash } from '../../components/icons';

export default function SellerProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

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

  return (
    <div className="animate-fade-up">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink tracking-tight">Your listings</h1>
          <p className="text-sm text-text mt-1">Add, edit, and manage the products you sell.</p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="cursor-pointer flex items-center gap-1.5 bg-green hover:bg-green-hover text-white font-semibold text-sm px-5 py-2.5 rounded-full transition-colors"
        >
          <IconPlus width="16" height="16" />
          Add listing
        </button>
      </div>

      {loading && (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-white border border-border rounded-2xl h-[220px]" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="bg-white border border-dashed border-border-strong rounded-2xl p-8 text-center text-orange-text text-sm">{error}</div>
      )}

      {!loading && !error && products.length === 0 && (
        <div className="bg-white border border-dashed border-border-strong rounded-2xl p-10 text-center">
          <span className="w-14 h-14 rounded-full bg-green-tint inline-flex items-center justify-center mb-4">
            <IconBox width="24" height="24" className="text-green" />
          </span>
          <p className="text-sm text-text mb-5">You haven't added any listings yet.</p>
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
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
          {products.map((p) => (
            <div key={p.id} className="bg-white border border-border rounded-2xl overflow-hidden">
              <Link to={`/seller/products/${p.id}`} className="block h-[130px] relative overflow-hidden cursor-pointer group">
                <img
                  src={p.img}
                  alt={p.name}
                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                />
                <span
                  className={`absolute top-2.5 left-2.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                    p.status === 'active' ? 'bg-white/94 text-green' : 'bg-white/94 text-text-muted'
                  }`}
                >
                  {p.status === 'active' ? 'Active' : 'Draft'}
                </span>
                {p.images?.length > 1 && (
                  <span className="absolute top-2.5 right-2.5 bg-black/55 text-white text-[10.5px] font-semibold px-2 py-1 rounded-full">
                    +{p.images.length - 1} photo{p.images.length - 1 === 1 ? '' : 's'}
                  </span>
                )}
              </Link>
              <div className="p-4">
                <div className="text-[14.5px] font-semibold text-ink leading-snug line-clamp-2 mb-1 min-h-[38px]">{p.name}</div>
                <div className="flex items-baseline justify-between mb-3">
                  <span className="font-display font-bold text-green text-[15px]">
                    {formatPKR(p.price)}
                    <span className="text-xs font-medium text-text-muted"> /{p.unit}</span>
                  </span>
                  <span className={`text-xs font-semibold ${p.stock === 0 ? 'text-orange-text' : 'text-text-muted'}`}>
                    {p.stock === 0 ? 'Out of stock' : `${p.stock} in stock`}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(p)}
                    className="flex-1 flex items-center justify-center gap-1.5 cursor-pointer bg-white border border-border text-ink-soft font-semibold text-xs py-2 rounded-lg hover:bg-surface-muted transition-colors"
                  >
                    <IconEdit width="13" height="13" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(p)}
                    className="flex-1 flex items-center justify-center gap-1.5 cursor-pointer bg-white border border-border text-orange-text font-semibold text-xs py-2 rounded-lg hover:bg-orange-tint transition-colors"
                  >
                    <IconTrash width="13" height="13" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
