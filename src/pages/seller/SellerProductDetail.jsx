import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { seller } from '../../lib/api';
import { formatPKR } from '../../data/mockData';
import ProductFormModal from '../../components/ProductFormModal';
import ConfirmDialog from '../../components/ConfirmDialog';
import Toast from '../../components/Toast';
import ImageGallery from '../../components/ImageGallery';
import { IconArrowRight, IconBox, IconEdit, IconTrash } from '../../components/icons';

export default function SellerProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [toastVisible, setToastVisible] = useState(false);

  const load = () => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    setError(null);

    seller
      .product(id)
      .then((res) => {
        if (cancelled) return;
        setProduct(res.product);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err.status === 404) setNotFound(true);
        else setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  };

  useEffect(load, [id]);

  const handleEditSubmit = async (payload) => {
    setFormLoading(true);
    setFormError(null);
    try {
      const { product: updated } = await seller.updateProduct(id, payload);
      setProduct(updated);
      setFormOpen(false);
      setToastVisible(true);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await seller.deleteProduct(id);
      navigate('/seller/products');
    } catch (err) {
      setError(err.message);
      setDeleteOpen(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 w-32 bg-surface-muted rounded mb-6" />
        <div className="grid gap-8" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))' }}>
          <div className="h-[360px] rounded-2xl bg-surface-muted" />
          <div className="flex flex-col gap-3">
            <div className="h-7 w-2/3 bg-surface-muted rounded" />
            <div className="h-4 w-1/3 bg-surface-muted rounded" />
            <div className="h-24 bg-surface-muted rounded mt-3" />
            <div className="h-32 bg-surface-muted rounded mt-3" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="bg-white border border-dashed border-border-strong rounded-2xl p-10 text-center">
        <span className="w-14 h-14 rounded-full bg-orange-tint inline-flex items-center justify-center mb-4">
          <IconBox width="24" height="24" className="text-orange-text" />
        </span>
        <h1 className="font-display text-lg font-bold text-ink mb-2">Listing not found</h1>
        <p className="text-sm text-text mb-5">This listing may have been deleted, or doesn't belong to your account.</p>
        <Link
          to="/seller/products"
          className="inline-block bg-green hover:bg-green-hover text-white font-semibold text-sm px-6 py-3 rounded-full no-underline transition-colors"
        >
          Back to your listings
        </Link>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="bg-white border border-dashed border-border-strong rounded-2xl p-10 text-center">
        <p className="text-sm text-orange-text mb-5">{error}</p>
        <Link
          to="/seller/products"
          className="inline-block bg-green hover:bg-green-hover text-white font-semibold text-sm px-6 py-3 rounded-full no-underline transition-colors"
        >
          Back to your listings
        </Link>
      </div>
    );
  }

  if (!product) return null;

  const images = product.images && product.images.length > 0 ? product.images : [product.img];

  return (
    <div className="animate-fade-up">
      <Link
        to="/seller/products"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-text hover:text-ink no-underline mb-5 group"
      >
        <IconArrowRight width="14" height="14" strokeWidth="2.2" className="rotate-180 group-hover:-translate-x-0.5 transition-transform" />
        Back to your listings
      </Link>

      {error && <p className="text-sm text-orange-text bg-orange-tint rounded-lg px-3.5 py-2.5 mb-5">{error}</p>}

      <div className="grid gap-8 lg:gap-12 items-start" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))' }}>
        <ImageGallery
          images={images}
          alt={product.name}
          heightClassName="h-[240px] sm:h-[320px] lg:h-[400px]"
          thumbHeightClassName="h-[60px] sm:h-[70px]"
        />

        {/* Info */}
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full ${
                product.status === 'active' ? 'bg-green-tint text-green' : 'bg-surface-muted text-text-muted'
              }`}
            >
              {product.status === 'active' ? 'Active' : 'Draft'}
            </span>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-orange-tint text-orange-text">{product.category}</span>
          </div>

          <h1 className="font-display text-2xl font-bold text-ink tracking-tight mb-2">{product.name}</h1>

          <div className="font-display font-bold text-green text-2xl mb-4">
            {formatPKR(product.price)}
            <span className="text-sm font-medium text-text-muted"> /{product.unit}</span>
          </div>

          {product.description && <p className="text-sm text-text leading-relaxed mb-5">{product.description}</p>}

          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { label: 'MOQ', value: product.moq },
              { label: 'Stock', value: product.stock === 0 ? 'Out of stock' : `${product.stock.toLocaleString('en-US')} ${product.unit}` },
              { label: 'SKU', value: product.sku || '—' },
              {
                label: 'Created',
                value: new Date(product.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
              },
            ].map((row) => (
              <div key={row.label} className="bg-white border border-border rounded-xl px-4 py-3">
                <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wide mb-1">{row.label}</div>
                <div className={`text-sm font-semibold ${row.label === 'Stock' && product.stock === 0 ? 'text-orange-text' : 'text-ink'}`}>
                  {row.value}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setFormError(null);
                setFormOpen(true);
              }}
              className="flex-1 flex items-center justify-center gap-2 cursor-pointer bg-green hover:bg-green-hover text-white font-semibold text-sm py-3 rounded-full shadow-[0_6px_16px_rgba(14,90,70,0.25)] transition-colors"
            >
              <IconEdit width="15" height="15" />
              Edit product
            </button>
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="flex-1 flex items-center justify-center gap-2 cursor-pointer bg-white border border-border text-orange-text font-semibold text-sm py-3 rounded-full hover:bg-orange-tint transition-colors"
            >
              <IconTrash width="15" height="15" />
              Delete product
            </button>
          </div>
        </div>
      </div>

      <ProductFormModal
        open={formOpen}
        product={product}
        loading={formLoading}
        error={formError}
        onClose={() => setFormOpen(false)}
        onSubmit={handleEditSubmit}
      />

      <ConfirmDialog
        open={deleteOpen}
        title="Delete this listing?"
        message={`"${product.name}" will be permanently removed from your storefront. This can't be undone.`}
        confirmLabel="Delete"
        loading={deleteLoading}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
      />

      <Toast message="Listing updated successfully" show={toastVisible} onHide={() => setToastVisible(false)} />
    </div>
  );
}
