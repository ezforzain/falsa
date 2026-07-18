import { Link } from 'react-router-dom';
import { IconStar } from './icons';
import VerifiedBadge from './VerifiedBadge';
import ChatButton from './ChatButton';

export default function ProductCard({ product }) {
  return (
    <div className="group bg-white border border-border rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_14px_34px_rgba(20,40,32,0.12)] hover:border-border-strong">
      <Link to={`/product/${product.id}`} className="block no-underline text-inherit">
        <div className="h-[180px] relative overflow-hidden">
          <img src={product.img} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
          <span className="absolute top-3 left-3 bg-white/95 text-green text-[11px] font-bold px-2.5 py-1.5 rounded-full">
            {product.badge}
          </span>
        </div>
        <div className="px-[18px] pt-4 pb-3">
          <div className="text-[15px] font-semibold mb-1 leading-snug line-clamp-2">{product.name}</div>
          <div className="flex items-center gap-1.5 text-[12.5px] text-text-muted mb-3.5 min-w-0">
            <span className="truncate">{product.seller}</span>
            {product.verified && <VerifiedBadge size={14} />}
            <span className="opacity-60 shrink-0">·</span>
            <span className="flex items-center gap-0.5 shrink-0">
              <IconStar />
              {product.rating}
            </span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="font-display font-bold text-[17px] text-green">
              {product.price}
              <span className="text-xs font-medium text-text-muted"> /{product.unit}</span>
            </span>
            <span className="font-mono text-[11px] text-orange-text bg-orange-tint px-2.5 py-1 rounded-md">
              MOQ {product.moq}
            </span>
          </div>
        </div>
      </Link>
      <div className="px-[18px] pb-[18px] pt-1">
        <ChatButton className="w-full" />
      </div>
    </div>
  );
}
