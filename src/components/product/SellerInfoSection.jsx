import { Link } from 'react-router-dom';
import SectionCard from './SectionCard';
import VerifiedBadge from '../VerifiedBadge';
import FollowButton from '../FollowButton';
import ChatButton from '../ChatButton';
import { IconStar, IconPin } from '../icons';

export default function SellerInfoSection({ seller, rating }) {
  const initial = seller.name?.trim()?.[0]?.toUpperCase() || '?';

  return (
    <SectionCard title="Seller Information" id="seller">
      <div className="flex flex-wrap items-center gap-5">
        <Link
          to={`/store/${seller.id}`}
          className="w-16 h-16 rounded-2xl bg-green-tint flex items-center justify-center shrink-0 no-underline"
        >
          <span className="font-display font-bold text-2xl text-green">{initial}</span>
        </Link>

        <div className="flex-1 min-w-[220px]">
          <div className="flex items-center gap-2 flex-wrap">
            <Link to={`/store/${seller.id}`} className="text-lg font-semibold text-ink no-underline hover:underline">
              {seller.name}
            </Link>
            {seller.verified && <VerifiedBadge size={17} />}
          </div>
          <div className="flex items-center gap-x-4 gap-y-1.5 text-[13px] text-text-muted mt-2 flex-wrap">
            {rating && (
              <span className="flex items-center gap-1 font-semibold text-ink-soft">
                <IconStar width="13" height="13" />
                {rating} rating
              </span>
            )}
            <span className="font-semibold text-ink-soft">{(seller.followerCount ?? 0).toLocaleString()} followers</span>
            {seller.location && (
              <span className="flex items-center gap-1">
                <IconPin width="13" height="13" />
                {seller.location}
              </span>
            )}
            {typeof seller.responseRate === 'number' && <span>{seller.responseRate}% response rate</span>}
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <ChatButton />
          <FollowButton sellerId={seller.id} initialFollowing={seller.following} />
          <Link
            to={`/store/${seller.id}`}
            className="text-sm font-semibold text-green no-underline hover:underline whitespace-nowrap"
          >
            View store →
          </Link>
        </div>
      </div>
    </SectionCard>
  );
}
