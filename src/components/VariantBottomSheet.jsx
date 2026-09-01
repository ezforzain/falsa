import { useEffect, useState } from 'react';
import { formatPKR, parsePrice } from '../data/mockData';
import { parseMoqNumber } from '../lib/moq';
import VariantCard from './VariantCard';
import QuantitySelector from './QuantitySelector';
import BuyNowButton from './BuyNowButton';
import { IconClose } from './icons';

// Daraz-style product variant selection bottom sheet: slides up from the bottom over a dark
// overlay, lets the buyer pick a "Color Family" option and a quantity, then confirms via a
// sticky Buy Now footer. `onBuyNow({ variant, qty })` is left to the caller (e.g. add-to-cart +
// navigate) so this component stays presentation-only and reusable outside ProductPage too.
export default function VariantBottomSheet({ product, open, initialVariant = null, loading = false, error = null, onClose, onConfirm }) {
  const [selectedVariant, setSelectedVariant] = useState(null);
  const moqMin = parseMoqNumber(product?.moq) || 1;
  const [qty, setQty] = useState(moqMin);
  const [pendingIntent, setPendingIntent] = useState(null);

  useEffect(() => {
    if (open && product) {
      setSelectedVariant(initialVariant || product.variants?.[0] || null);
      setQty(parseMoqNumber(product.moq) || 1);
      setPendingIntent(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, product]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open || !product) return null;

  const isTracked = typeof product.stock === 'number';
  const maxQty = isTracked ? Math.max(product.stock, moqMin) : Infinity;
  const outOfStock = isTracked && product.stock <= 0;
  const moqUnreachable = !outOfStock && isTracked && product.stock < moqMin;

  const currentPrice = parsePrice(product.price);
  const discountPercent = product.discountPercent || 0;
  const originalPrice = discountPercent > 0 ? currentPrice / (1 - discountPercent / 100) : null;
  const total = currentPrice * qty;

  const confirm = (intent) => {
    if (outOfStock || moqUnreachable || loading) return;
    setPendingIntent(intent);
    onConfirm({ variant: selectedVariant, qty, intent });
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
              <QuantitySelector qty={qty} onChange={setQty} min={moqMin} max={maxQty} />
            </div>
            <div className="flex items-center justify-between text-xs text-text-muted mt-2">
              {moqMin > 1 ? <span>Minimum order: {product.moq}</span> : <span />}
              {isTracked && (
                <span>
                  {outOfStock ? <span className="text-orange-text font-semibold">Out of stock</span> : `${product.stock} available`}
                </span>
              )}
            </div>
          </div>

          {moqUnreachable && (
            <p className="text-sm text-orange-text bg-orange-tint rounded-lg px-3.5 py-2.5">
              Only {product.stock} left — below the {product.moq} minimum order quantity. Please contact the seller for options.
            </p>
          )}

          {error && <p className="text-sm text-orange-text bg-orange-tint rounded-lg px-3.5 py-2.5">{error}</p>}
        </div>

        {/* Sticky footer — live total updates as qty changes, then Add to Cart / Buy Now */}
        <div
          className="shrink-0 px-5 pt-3.5 pb-4 border-t border-border flex flex-col gap-3"
          style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
        >
          <div className="flex items-baseline justify-between">
            <span className="text-[13px] font-semibold text-ink-soft">Total</span>
            <span className="font-display font-bold text-xl text-ink">{formatPKR(total)}</span>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => confirm('cart')}
              disabled={outOfStock || moqUnreachable || loading}
              aria-busy={loading && pendingIntent === 'cart'}
              className="flex-1 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 bg-white border-[1.5px] border-green text-green font-bold text-[14.5px] py-[15px] rounded-full transition-all active:scale-[0.98]"
            >
              {loading && pendingIntent === 'cart' ? 'Adding…' : 'Add to Cart'}
            </button>
            <BuyNowButton
              onClick={() => confirm('buy')}
              disabled={outOfStock || moqUnreachable}
              loading={loading && pendingIntent === 'buy'}
              className="flex-[1.3]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
