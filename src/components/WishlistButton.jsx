import { useWishlist } from '../context/WishlistContext';
import { IconHeart } from './icons';

// Sits on top of a card <Link> (product cards) or standalone (product-detail header) — always
// stops the click from bubbling into a parent link/navigation.
export default function WishlistButton({ productId, productName, size = 18, className = '' }) {
  const { has, toggle } = useWishlist();
  const active = has(productId);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(productId, productName);
      }}
      aria-label={active ? 'Remove from wishlist' : 'Save to wishlist'}
      aria-pressed={active}
      className={`cursor-pointer flex items-center justify-center rounded-full transition-all active:scale-90 ${className}`}
    >
      <IconHeart
        width={size}
        height={size}
        className={active ? 'text-orange' : 'text-ink-soft'}
        fill={active ? 'currentColor' : 'none'}
      />
    </button>
  );
}
