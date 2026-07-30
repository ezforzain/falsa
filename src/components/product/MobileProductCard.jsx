import { Link } from 'react-router-dom';
import { formatPKR, parsePrice } from '../../data/mockData';
import VerifiedBadge from '../VerifiedBadge';
import WishlistButton from '../WishlistButton';
import { IconStar, IconTruck } from '../icons';

// The 2-column grid card used across the mobile Home feed and Wishlist — image, name, price
// (with original/discount when present), seller + verified badge, rating + review count, sold
// count, a free-shipping chip, and a wishlist heart layered over the image.
export default function MobileProductCard({ product }) {
  const currentPrice = parsePrice(product.price);
  const discountPercent = product.discountPercent || 0;
  const originalPrice = discountPercent > 0 ? currentPrice / (1 - discountPercent / 100) : null;
  const reviewCount = product.reviews?.length || 0;

  return (
    <Link
      to={`/product/${product.id}`}
      className="group block bg-white border border-[#EFEBE2] rounded-[14px] overflow-hidden no-underline text-inherit transition-all duration-200 active:scale-[0.98]"
    >
      <div className="relative h-[150px] overflow-hidden bg-surface-muted">
        <img src={product.img} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
        {discountPercent > 0 && (
          <span className="absolute top-2 left-2 bg-orange text-white text-[10.5px] font-bold px-2 py-1 rounded-full">
            -{discountPercent}%
          </span>
        )}
        <WishlistButton
          productId={product.id}
          size={16}
          className="absolute top-1.5 right-1.5 w-7 h-7 bg-white/90 backdrop-blur-sm"
        />
      </div>

      <div className="px-2.5 pt-2.5 pb-2.5 flex flex-col gap-1">
        <div className="text-[12.5px] font-semibold text-ink leading-snug line-clamp-2 min-h-[32px]">{product.name}</div>

        <div className="flex items-center gap-1 text-[11px] text-text-muted min-w-0">
          <span className="truncate">{product.seller}</span>
          {product.verified && <VerifiedBadge size={11} />}
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
          <span className="flex items-center gap-0.5 shrink-0">
            <IconStar width="11" height="11" />
            {product.rating}
          </span>
          {reviewCount > 0 && <span>({reviewCount})</span>}
          {product.sold > 0 && <span className="truncate">· {product.sold} sold</span>}
        </div>

        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="font-display font-bold text-[14.5px] text-green">{product.price}</span>
          {originalPrice && (
            <span className="text-[10.5px] text-text-muted line-through">{formatPKR(originalPrice)}</span>
          )}
        </div>

        {product.freeShipping && (
          <span className="inline-flex self-start items-center gap-1 text-[10px] font-semibold text-green bg-green-tint px-1.5 py-0.5 rounded-md">
            <IconTruck width="10" height="10" strokeWidth="2.4" />
            Free Shipping
          </span>
        )}
      </div>
    </Link>
  );
}
