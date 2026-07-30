import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import WishlistButton from '../WishlistButton';
import ShareButton from '../ShareButton';
import { IconChevronLeft, IconSearch, IconCart } from '../icons';

const iconBtnClass =
  'cursor-pointer w-9 h-9 rounded-full flex items-center justify-center text-ink-soft hover:bg-surface-muted active:scale-95 transition-all shrink-0';

// Daraz-style compact sticky header shown only on mobile product-detail pages (see MainLayout,
// which swaps out the full desktop Header for this on /product/:id) — Back, an inline search
// jump-off, Share, Wishlist, and Cart-with-count all in one row instead of the generic Header.
export default function MobileProductHeader({ product }) {
  const navigate = useNavigate();
  const { count } = useCart();

  return (
    <div
      className="sticky top-0 z-40 flex items-center gap-1.5 bg-white/95 backdrop-blur-md border-b border-border px-2 py-2"
      style={{ paddingTop: 'max(8px, env(safe-area-inset-top))' }}
    >
      <button type="button" onClick={() => navigate(-1)} aria-label="Back" className={iconBtnClass}>
        <IconChevronLeft width="22" height="22" />
      </button>

      <button
        type="button"
        onClick={() => navigate('/search')}
        className="flex-1 flex items-center gap-2 min-w-0 bg-surface-muted rounded-full px-3.5 py-2 text-left cursor-pointer"
      >
        <IconSearch width="15" height="15" className="text-text-muted shrink-0" strokeWidth="1.8" />
        <span className="text-[13px] text-text-muted truncate">Search in marketplace</span>
      </button>

      <ShareButton title={product?.name} iconOnly className={iconBtnClass} />
      {product && <WishlistButton productId={product.id} size={19} className={iconBtnClass} />}

      <button type="button" onClick={() => navigate('/cart')} aria-label="Cart" className={`relative ${iconBtnClass}`}>
        <IconCart width="19" height="19" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] px-[3px] rounded-full bg-orange text-white text-[9.5px] leading-[15px] font-semibold text-center ring-2 ring-white">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>
    </div>
  );
}
