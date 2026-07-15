import { useEffect, useState } from 'react';
import { sellers } from '../lib/api';
import Toast from './Toast';
import { IconCheck, IconPlus } from './icons';

// Self-contained Follow/Following control for a seller's store. Fetches the current follow
// state for `sellerId` on mount, persists toggles through the mock backend, and reports the
// server's updated follower count back via `onChange` so a parent (e.g. StoreCard) can keep its
// own follower-count display in sync without a second round trip. Drop-in reusable — any screen
// that knows a sellerId can render this with no extra wiring.
export default function FollowButton({ sellerId, initialFollowing = false, onChange, className = '' }) {
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    sellers
      .followStatus(sellerId)
      .then((res) => {
        if (cancelled) return;
        setFollowing(res.following);
        onChange?.(res.followerCount, res.following);
      })
      .catch(() => {
        // Silent — the button just keeps whatever initial state it was given.
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sellerId]);

  // Flips immediately (optimistic) per spec — "clicking Follow should immediately change the
  // button to Following" — with a spinner over the icon while the request is in flight, and a
  // rollback + error toast if the request fails.
  const toggle = async () => {
    if (loading) return;
    const previous = following;
    const next = !following;
    setFollowing(next);
    setLoading(true);
    try {
      const res = next ? await sellers.follow(sellerId) : await sellers.unfollow(sellerId);
      setFollowing(res.following);
      onChange?.(res.followerCount, res.following);
    } catch (err) {
      setFollowing(previous);
      setToastMessage(err.message || "Couldn't update follow status. Please try again.");
      setToastVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        disabled={loading}
        aria-pressed={following}
        aria-busy={loading}
        className={`inline-flex items-center justify-center gap-1.5 rounded-[10px] font-semibold text-sm px-5 py-2.5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-90 transition-colors duration-200 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF6A00] ${
          following
            ? 'bg-[#FF6A00] border border-[#FF6A00] text-white hover:bg-[#E65F00]'
            : 'bg-white border border-[#FF6A00] text-[#FF6A00] hover:bg-[#FFF4EC]'
        } ${className}`}
      >
        <span className="w-3.5 h-3.5 shrink-0 flex items-center justify-center">
          {loading ? (
            <span
              className="w-3.5 h-3.5 border-2 rounded-full inline-block"
              style={{
                borderColor: following ? 'rgba(255,255,255,0.35)' : 'rgba(255,106,0,0.3)',
                borderTopColor: following ? '#fff' : '#FF6A00',
                animation: 'spin 0.8s linear infinite',
              }}
            />
          ) : (
            <span key={following ? 'following' : 'follow'} className="flex items-center justify-center animate-fade-up">
              {following ? <IconCheck width="14" height="14" strokeWidth="3" /> : <IconPlus width="14" height="14" strokeWidth="3" />}
            </span>
          )}
        </span>
        <span key={`label-${following}`} className="animate-fade-up">
          {following ? 'Following' : 'Follow'}
        </span>
      </button>
      <Toast message={toastMessage} show={toastVisible} onHide={() => setToastVisible(false)} variant="error" />
    </>
  );
}
