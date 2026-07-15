import { useEffect, useState } from 'react';
import { formatPKR, parsePrice } from '../data/mockData';
import VariantCard from './VariantCard';
import QuantitySelector from './QuantitySelector';
import BuyNowButton from './BuyNowButton';
import { IconClose } from './icons';

// Daraz-style product variant selection bottom sheet: slides up from the bottom over a dark
// overlay, lets the buyer pick a "Color Family" option and a quantity, then confirms via a
// sticky Buy Now footer. `onBuyNow({ variant, qty })` is left to the caller (e.g. add-to-cart +
// navigate) so this component stays presentation-only and reusable outside ProductPage too.
export default function VariantBottomSheet({ product, open, loading = false, error = null, onClose, onBuyNow }) {
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (open && product) {
      setSelectedVariant(product.variants?.[0] || null);
      setQty(1);
    }
  }, [open, product]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open || !product) return null;

  const isTracked = typeof product.stock === 'number';
  const maxQty = isTracked ? Math.max(product.stock, 1) : Infinity;
  const outOfStock = isTracked && product.stock <= 0;

  const currentPrice = parsePrice(product.price);
  const discountPercent = product.discountPercent || 0;
  const originalPrice = discountPercent > 0 ? currentPrice / (1 - discountPercent / 100) : null;

  const confirm = () => {
    if (outOfStock || loading) return;
    onBuyNow({ variant: selectedVariant, qty });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/50 animate-fade-up" onClick={onClose} />

      <div className="relative w-full sm:max-w-[420px] max-h-[88vh] bg-white rounded-t-[24px] sm:rounded-[24px] shadow-2xl flex flex-col animate-slide-up">
        {/* Header */}
        <div className="relative flex items-start gap-3 px-5 pt-5 pb-4 border-b border-border shrink-0">
          <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-border bg-surface-muted">
            <img src={product.img} alt={product.name} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0 pr-6">
            {discountPercent > 0 && originalPrice && (
              <div className="text-[12.5px] font-semibold text-orange-text mb-0.5">
                Save {formatPKR(originalPrice - currentPrice)} with Promo
              </div>
            )}
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="font-display font-bold text-2xl text-orange leading-none">{formatPKR(currentPrice)}</span>
              {originalPrice && <span className="text-[13px] text-text-muted line-through">{formatPKR(originalPrice)}</span>}
            </div>
            {discountPercent > 0 && (
              <span className="inline-block mt-1.5 text-[11px] font-bold text-orange-text bg-orange-tint px-2 py-0.5 rounded">
                {discountPercent}% OFF
              </span>
            )}
            <div className="text-[13px] text-ink-soft mt-1.5 line-clamp-2 leading-snug">{product.name}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:text-ink hover:bg-surface-muted cursor-pointer transition-colors"
          >
            <IconClose width="18" height="18" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-6">
          {product.variants?.length > 0 && (
            <div>
              <div className="text-[13.5px] font-semibold text-ink-soft mb-3">
                Color Family: <span className="text-ink font-bold">{selectedVariant?.name}</span>
              </div>
              <div className="grid grid-cols-4 gap-2.5">
                {product.variants.map((variant) => (
                  <VariantCard
                    key={variant.id}
                    variant={variant}
                    selected={selectedVariant?.id === variant.id}
                    onSelect={setSelectedVariant}
                  />
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between">
              <span className="text-[13.5px] font-semibold text-ink-soft">Quantity</span>
              <QuantitySelector qty={qty} onChange={setQty} min={1} max={maxQty} />
            </div>
            {isTracked && (
              <div className="text-xs text-text-muted mt-2 text-right">
                {outOfStock ? <span className="text-orange-text font-semibold">Out of stock</span> : `${product.stock} available`}
              </div>
            )}
          </div>

          {error && <p className="text-sm text-orange-text bg-orange-tint rounded-lg px-3.5 py-2.5">{error}</p>}
        </div>

        {/* Sticky Buy Now */}
        <div
          className="shrink-0 px-5 py-4 border-t border-border"
          style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
        >
          <BuyNowButton onClick={confirm} disabled={outOfStock} loading={loading} />
        </div>
      </div>
    </div>
  );
}
