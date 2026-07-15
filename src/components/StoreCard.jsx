import { useState } from 'react';
import { Link } from 'react-router-dom';
import VerifiedBadge from './VerifiedBadge';
import FollowButton from './FollowButton';
import { IconStar } from './icons';

// Store summary card shown on the Product Detail page — logo, name, verified badge, rating,
// and store stats, plus the Follow/Following control. `seller` is the sellers-directory record
// returned by GET /api/sellers/:id (see src/mocks/handlers.js), extended with `productCount`
// and `following` by the caller.
export default function StoreCard({ rating, location, seller }) {
  const [followerCount, setFollowerCount] = useState(seller?.followerCount ?? 0);

  if (!seller) return null;

  const initial = seller.name?.trim()?.[0]?.toUpperCase() || '?';

  return (
    <div className="flex items-center gap-4 bg-white border border-border rounded-2xl px-5 py-4 mb-[22px] flex-wrap">
      <Link
        to={`/store/${seller.id}`}
        className="w-12 h-12 rounded-full bg-green-tint flex items-center justify-center shrink-0 no-underline"
      >
        <span className="font-display font-bold text-lg text-green">{initial}</span>
      </Link>

      <div className="flex-1 min-w-[180px]">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Link to={`/store/${seller.id}`} className="text-[15px] font-semibold text-ink no-underline hover:underline">
            {seller.name}
          </Link>
          {seller.verified && <VerifiedBadge size={15} />}
        </div>
        <div className="flex items-center gap-x-3 gap-y-1 text-[12.5px] text-text-muted mt-1 flex-wrap">
          {rating && (
            <span className="flex items-center gap-1 font-semibold text-ink-soft">
              <IconStar width="12" height="12" />
              {rating}
            </span>
          )}
          {location && <span>{location}</span>}
          {typeof seller.productCount === 'number' && <span>{seller.productCount} products</span>}
          {typeof seller.responseRate === 'number' && <span>{seller.responseRate}% response rate</span>}
          <span>{followerCount.toLocaleString()} followers</span>
        </div>
      </div>

      <FollowButton
        sellerId={seller.id}
        initialFollowing={seller.following}
        onChange={(count) => setFollowerCount(count)}
      />
    </div>
  );
}
