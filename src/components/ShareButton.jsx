import { useEffect, useState } from 'react';
import { devInfo } from '../lib/api';
import Toast from './Toast';
import { IconShare } from './icons';

const LOCAL_HOSTNAMES = ['localhost', '127.0.0.1'];

// Builds a link that works for whoever RECEIVES it, not just whoever clicks Share. In
// production this is just the current page's own URL — a real public domain already works for
// everyone. In local dev, `window.location.origin` can be `localhost` if that's simply how the
// person sharing happened to open the app themselves; a link built from that only ever opens on
// their own machine, which is the single most common reason "it opens for me but not for them"
// happens on a project that isn't deployed yet. So here we ask the backend for its own detected
// LAN address (see /api/dev/network-info, dev-only) and prefer that whenever the current origin
// is localhost — guaranteeing the shared link is reachable from another device on the same
// Wi-Fi regardless of how the sharer got to this page.
export default function ShareButton({ title, className = '' }) {
  const [lanUrl, setLanUrl] = useState(undefined); // undefined = still checking, null = unavailable
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    devInfo
      .networkInfo()
      .then((res) => {
        if (!cancelled) setLanUrl(res.lanUrl || null);
      })
      .catch(() => {
        if (!cancelled) setLanUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const isLocalOnly = LOCAL_HOSTNAMES.includes(window.location.hostname);
  const buildShareUrl = () => {
    const base = isLocalOnly && lanUrl ? lanUrl : window.location.origin;
    return base + window.location.pathname;
  };

  const share = async () => {
    const url = buildShareUrl();
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // User dismissed the native share sheet — not an error worth surfacing.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setToastMessage('Link copied to clipboard');
    } catch {
      setToastMessage(url);
    }
    setToastVisible(true);
  };

  // We asked the backend and it couldn't find a LAN address either — the link we're about to
  // hand out really might only work on this machine, so say so up front instead of pretending.
  const linkMightNotWork = isLocalOnly && lanUrl === null;

  return (
    <div className={`shrink-0 ${className}`}>
      <button
        type="button"
        onClick={share}
        aria-label="Share this product"
        title={
          linkMightNotWork
            ? "Couldn't detect a network address — this link may only open on this computer."
            : 'Share this product'
        }
        className="flex items-center justify-center gap-1.5 cursor-pointer text-text hover:text-ink bg-white border border-border hover:border-border-strong rounded-full w-[52px] sm:w-auto h-[52px] sm:px-4 sm:py-[13px] text-sm font-semibold transition-colors"
      >
        <IconShare width="16" height="16" className={linkMightNotWork ? 'text-orange-text' : undefined} />
        <span className="hidden sm:inline">Share</span>
      </button>
      <Toast message={toastMessage} show={toastVisible} onHide={() => setToastVisible(false)} />
    </div>
  );
}
