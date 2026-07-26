import { formatPKR, parsePrice } from '../../data/mockData';
import { IconStar } from '../icons';

// Amazon/Temu/Daraz-style price block: big current price, struck-through original price, and an
// explicit "Save Rs X (Y% OFF)" callout — plus the rating + sold-count line right underneath,
// since on those apps the two always sit together as the page's main trust/urgency signal.
export default function PriceBox({ product, rating, reviewCount, soldCount }) {
  const currentPrice = parsePrice(product.price);
  const discountPercent = product.discountPercent || 0;
  const originalPrice = discountPercent > 0 ? currentPrice / (1 - discountPercent / 100) : null;

  return (
    <div>
      <div className="flex items-baseline gap-2.5 flex-wrap">
        <span className="font-display font-bold text-[34px] sm:text-[40px] text-orange tracking-tight leading-none">
          {formatPKR(currentPrice)}
        </span>
        <span className="text-sm text-text-muted font-medium">/ {product.unit}</span>
      </div>

      {originalPrice && (
        <div className="flex items-center gap-2.5 mt-2 flex-wrap">
          <span className="text-[15px] text-text-muted line-through">{formatPKR(originalPrice)}</span>
          <span className="text-[11.5px] font-bold text-orange-text bg-orange-tint px-2 py-0.5 rounded">{discountPercent}% OFF</span>
          <span className="text-[12.5px] font-semibold text-green">Save {formatPKR(originalPrice - currentPrice)}</span>
        </div>
      )}

      <div className="flex items-center gap-3 mt-3 flex-wrap text-[13px]">
        <a href="#reviews" className="inline-flex items-center gap-1 font-semibold text-ink-soft no-underline hover:underline">
          <IconStar width="14" height="14" />
          {Number(rating).toFixed(1)}
          <span className="text-text-muted font-medium">({reviewCount.toLocaleString()})</span>
        </a>
        <span className="w-1 h-1 rounded-full bg-border-strong" />
        <span className="text-text-muted font-medium">{soldCount.toLocaleString()}+ sold</span>
      </div>
    </div>
  );
}
