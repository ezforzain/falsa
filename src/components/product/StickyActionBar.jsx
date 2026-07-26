import { formatPKR, parsePrice } from '../../data/mockData';

// Matches MainLayout's own `bottomNavClearance` so this bar sits directly above the mobile
// BottomNavBar instead of overlapping it — see src/layouts/MainLayout.jsx.
const ABOVE_BOTTOM_NAV = 'calc(72px + max(env(safe-area-inset-bottom), 12px))';

// Mobile sticky Buy Now / Add to Cart bar — fades/slides in once the buyer scrolls past the
// inline buy box further up the page (see ProductPage's IntersectionObserver), so the primary
// actions are always one tap away while browsing Description/Specs/Reviews/etc. Sits above the
// bottom tab bar, never on top of it.
export default function StickyActionBar({ product, ordering, outOfStock, onOrderNow, onAddToCart }) {
  const currentPrice = parsePrice(product.price);
  const discountPercent = product.discountPercent || 0;
  const originalPrice = discountPercent > 0 ? currentPrice / (1 - discountPercent / 100) : null;

  return (
    <div
      className="md:hidden fixed inset-x-0 z-40 bg-white border-t border-border shadow-[0_-6px_24px_rgba(0,0,0,0.1)] animate-slide-up"
      style={{ bottom: ABOVE_BOTTOM_NAV }}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="min-w-0 shrink-0">
          <div className="font-display font-bold text-lg text-orange leading-none truncate">{formatPKR(currentPrice)}</div>
          {originalPrice && <div className="text-[11px] text-text-muted line-through leading-tight mt-0.5">{formatPKR(originalPrice)}</div>}
        </div>
        <div className="flex-1 flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onAddToCart}
            disabled={outOfStock}
            className="flex-1 text-center cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 font-semibold text-[14px] h-[46px] rounded-full transition-all active:scale-[0.97] bg-white border-[1.5px] border-green text-green"
          >
            {outOfStock ? 'Out of stock' : 'Add to Cart'}
          </button>
          <button
            type="button"
            onClick={onOrderNow}
            disabled={ordering || outOfStock}
            aria-busy={ordering}
            className="flex-1 flex items-center justify-center gap-2 text-center cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 bg-orange active:bg-orange-hover text-white font-semibold text-[14px] h-[46px] rounded-full shadow-[0_6px_16px_rgba(201,123,45,0.35)] transition-all active:scale-[0.97]"
          >
            {ordering && (
              <span className="w-3.5 h-3.5 border-[2.5px] border-white/35 rounded-full inline-block" style={{ borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} />
            )}
            {outOfStock ? 'Out of stock' : ordering ? 'Placing…' : 'Buy Now'}
          </button>
        </div>
      </div>
    </div>
  );
}
