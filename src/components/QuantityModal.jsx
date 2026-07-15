import { useEffect, useRef, useState } from 'react';
import { IconClose } from './icons';

export default function QuantityModal({ product, open, alreadyInCart = 0, loading, error, onClose, onConfirm }) {
  const [qty, setQty] = useState(1);
  const inputRef = useRef(null);

  const isTracked = typeof product?.stock === 'number';
  const remaining = isTracked ? Math.max(product.stock - alreadyInCart, 0) : Infinity;
  const outOfStock = isTracked && remaining <= 0;

  useEffect(() => {
    if (open) setQty(1);
  }, [open, product?.id]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open || !product) return null;

  const clamp = (n) => Math.min(Math.max(n, 1), isTracked ? Math.max(remaining, 1) : Infinity);

  const decrease = () => setQty((q) => Math.max(q - 1, 1));
  const increase = () => setQty((q) => clamp(q + 1));

  const handleInputChange = (e) => {
    // Strip everything but digits (also drops the "," from the formatted display value below)
    // and cap raw entry at 9 digits — a sane ceiling so an untracked-stock product can't be
    // typed into a number so large the layout has to fight it; the font-size step-down below
    // is the real overflow guard for whatever's left within that ceiling.
    const raw = e.target.value.replace(/[^0-9]/g, '').slice(0, 9);
    setQty(raw === '' ? '' : Number(raw));
  };

  const handleInputBlur = () => {
    setQty((q) => clamp(Number(q) || 1));
  };

  const digitLength = String(qty || '').length;
  const qtyFontSizeClass =
    digitLength > 7 ? 'text-sm' : digitLength > 5 ? 'text-base' : digitLength > 3 ? 'text-lg' : 'text-xl';
  const displayQty = qty === '' ? '' : Number(qty).toLocaleString('en-US');

  const confirm = () => {
    if (outOfStock || loading) return;
    const finalQty = clamp(Number(qty) || 1);
    onConfirm(finalQty);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/45 animate-fade-up" onClick={onClose} />

      <div className="relative w-full max-w-[380px] max-h-[90vh] overflow-y-auto overflow-x-hidden bg-white rounded-2xl shadow-2xl p-6 animate-fade-up">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 text-text-muted hover:text-ink cursor-pointer p-1"
        >
          <IconClose width="18" height="18" />
        </button>

        <div className="flex items-center gap-3 mb-5 pr-6">
          <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-border">
            <img src={product.img} alt={product.name} className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <div className="text-[14.5px] font-semibold text-ink leading-snug line-clamp-2">{product.name}</div>
            <div className="font-display font-bold text-green text-[15px] mt-0.5">
              {product.price}
              <span className="text-xs font-medium text-text-muted"> /{product.unit}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-text-muted mb-4">
          <span>
            MOQ: <strong className="text-ink-soft">{product.moq}</strong>
          </span>
          {isTracked && (
            <span className={outOfStock ? 'text-orange-text font-semibold' : ''}>
              {outOfStock ? 'Out of stock' : `${remaining} available${alreadyInCart > 0 ? ` (${alreadyInCart} already in cart)` : ''}`}
            </span>
          )}
        </div>

        {error && <p className="text-sm text-orange-text bg-orange-tint rounded-lg px-3.5 py-2.5 mb-4">{error}</p>}

        {outOfStock ? (
          <div className="text-center py-4 text-sm text-text mb-2">This product is currently out of stock.</div>
        ) : (
          <div className="mb-5">
            <label className="block text-[13.5px] font-semibold text-ink-soft mb-2.5">Quantity</label>
            <div className="flex items-center justify-center gap-3 max-w-full">
              <button
                type="button"
                onClick={decrease}
                disabled={qty <= 1}
                aria-label="Decrease quantity"
                className="shrink-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 w-11 h-11 rounded-full border border-border flex items-center justify-center text-xl font-semibold text-ink hover:bg-surface-muted transition-colors"
              >
                −
              </button>
              <div className="min-w-[64px] max-w-[112px] w-full">
                <input
                  ref={inputRef}
                  type="text"
                  inputMode="numeric"
                  value={displayQty}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  onKeyDown={(e) => e.key === 'Enter' && confirm()}
                  className={`w-full h-11 px-2 text-center font-display font-bold tabular-nums leading-none border border-border rounded-xl text-ink outline-none overflow-x-auto focus:border-green focus:shadow-[0_0_0_3px_rgba(14,90,70,0.12)] transition-[font-size] ${qtyFontSizeClass}`}
                />
              </div>
              <button
                type="button"
                onClick={increase}
                disabled={isTracked && qty >= remaining}
                aria-label="Increase quantity"
                className="shrink-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 w-11 h-11 rounded-full border border-border flex items-center justify-center text-xl font-semibold text-ink hover:bg-surface-muted transition-colors"
              >
                +
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 cursor-pointer bg-white border-[1.5px] border-border text-ink-soft font-semibold text-sm py-3 rounded-full hover:bg-surface-muted transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={outOfStock || loading}
            className="flex-1 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 bg-green hover:bg-green-hover text-white font-semibold text-sm py-3 rounded-full shadow-[0_6px_16px_rgba(14,90,70,0.25)] transition-colors"
          >
            {loading && (
              <span className="w-3.5 h-3.5 border-2 border-white/35 rounded-full inline-block" style={{ borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} />
            )}
            {loading ? 'Adding…' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
}
