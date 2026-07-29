import { Link } from 'react-router-dom';
import VerifiedBadge from '../VerifiedBadge';
import { IconPin, IconSparkle, IconStar } from '../icons';

// One card in the Featured Spotlight rail — mirrors the "★ rating (reviews) · N sold" +
// "Best Sellers · TOP N in Category" social-proof pattern from major B2B/B2C marketplaces
// (rating and sold count together read as more trustworthy than either alone).
export default function SpotlightCard({ item }) {
  const { product, type, rankInCategory } = item;
  const reviewCount = product.reviews?.length || 0;
  const sold = product.sold || 0;

  return (
    <div className="w-[210px] sm:w-[240px] shrink-0 snap-start bg-white border border-border rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_14px_34px_rgba(20,40,32,0.12)]">
      <div className="relative h-[150px] sm:h-[168px] overflow-hidden bg-surface-muted">
        <img src={product.img} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
        <span
          className={`absolute top-2.5 left-2.5 text-[10.5px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
            type === 'sponsored' ? 'bg-white/95 text-text' : 'bg-green text-white'
          }`}
        >
          {type === 'sponsored' ? 'Sponsored' : (
            <>
              <IconSparkle width="10" height="10" />
              Featured
            </>
          )}
        </span>
      </div>

      <div className="p-3 flex flex-col gap-1.5">
        {rankInCategory && (
          <div className="inline-flex self-start items-center gap-1 bg-orange-tint text-orange-text text-[10.5px] font-bold px-2 py-1 rounded-full">
            Best Sellers · TOP {rankInCategory} in {product.category}
          </div>
        )}

        <div className="text-[13px] font-semibold text-ink leading-snug line-clamp-2 min-h-[34px]">{product.name}</div>

        <div className="flex items-center gap-1 text-[11.5px] text-text-muted min-w-0">
          <IconPin width="11" height="11" className="shrink-0" />
          <span className="truncate">{product.seller}</span>
          {product.verified && <VerifiedBadge size={12} />}
        </div>

        <div className="flex items-center gap-1.5 text-[11.5px] text-text-muted">
          <IconStar width="12" height="12" className="text-orange fill-orange" />
          <span className="font-semibold text-ink">{product.rating}</span>
          {reviewCount > 0 && <span>({reviewCount})</span>}
          {sold > 0 && <span>· {sold} sold</span>}
        </div>

        <div className="font-display font-bold text-[16px] text-green mt-0.5">{product.price}</div>

        <div className="text-[11px] text-text-muted truncate">
          MOQ {product.moq} · {product.location}
        </div>

        <Link
          to={`/product/${product.id}`}
          className="mt-1.5 block text-center cursor-pointer bg-orange hover:bg-orange-hover active:scale-95 text-white font-semibold text-[12.5px] py-2 rounded-full no-underline transition-all"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}
