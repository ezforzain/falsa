import SectionCard from './SectionCard';
import { IconStar } from '../icons';

function timeAgoLabel(dateStr) {
  const days = Math.max(0, Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000));
  if (days < 1) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  const months = Math.round(days / 30);
  return months === 1 ? '1 month ago' : `${months} months ago`;
}

export default function ReviewsSection({ summary, reviews }) {
  return (
    <SectionCard title="Customer Reviews" subtitle={`${summary.total.toLocaleString()} verified buyer reviews`} id="reviews">
      <div className="flex flex-col sm:flex-row gap-8 mb-8">
        <div className="flex sm:flex-col items-center sm:items-start gap-3 sm:gap-1 shrink-0">
          <div className="font-display text-4xl font-bold text-ink">{summary.rating.toFixed(1)}</div>
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <IconStar key={i} width="14" height="14" className={i < Math.round(summary.rating) ? '' : 'opacity-25'} />
            ))}
          </div>
          <div className="text-xs text-text-muted">{summary.total.toLocaleString()} reviews</div>
        </div>

        <div className="flex-1 flex flex-col gap-1.5 justify-center">
          {summary.breakdown.map(({ star, pct }) => (
            <div key={star} className="flex items-center gap-3">
              <span className="text-xs text-text-muted w-10 shrink-0">{star} star</span>
              <div className="flex-1 h-2 rounded-full bg-surface-muted overflow-hidden">
                <div className="h-full bg-green rounded-full" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-xs text-text-muted w-9 text-right shrink-0">{pct}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-5">
        {reviews.map((review) => (
          <div key={review.id} className="border-t border-border pt-5 first:border-t-0 first:pt-0">
            <div className="flex items-center justify-between gap-3 flex-wrap mb-1.5">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-full bg-green-tint flex items-center justify-center text-green font-display font-bold text-sm shrink-0">
                  {review.name.trim()[0]?.toUpperCase()}
                </span>
                <div>
                  <div className="text-[13.5px] font-semibold text-ink">{review.name}</div>
                  {review.country && <div className="text-[11.5px] text-text-muted">{review.country}</div>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <IconStar key={i} width="12" height="12" className={i < review.rating ? '' : 'opacity-25'} />
                  ))}
                </div>
                <span className="text-[11.5px] text-text-muted">{timeAgoLabel(review.date)}</span>
              </div>
            </div>
            <p className="text-[13.5px] text-text leading-relaxed m-0">{review.comment}</p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
