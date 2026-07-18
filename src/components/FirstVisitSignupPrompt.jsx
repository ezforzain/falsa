import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { IconClose, IconUser } from './icons';

const SEEN_KEY = 'falsafahtot_signup_prompt_seen';

// Shown the very first time a signed-out visitor opens ANY product page — once per browser,
// ever (tracked via localStorage), and never again once they've seen it once, dismissed it or
// not. Not a hard wall: the product underneath stays visible and this can be dismissed, per
// the "dismissable, once per browser" spec — a real paywall would tank first-visit conversion.
export default function FirstVisitSignupPrompt() {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) return;
    if (localStorage.getItem(SEEN_KEY)) return;
    localStorage.setItem(SEEN_KEY, '1');
    setOpen(true);
    // Only ever evaluated once per mount — re-checking on every isAuthenticated change would
    // re-show the prompt to a guest who signs out again, which isn't the intent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[130] flex items-end justify-center sm:items-center px-0 sm:px-4">
      <div className="absolute inset-0 bg-black/50 animate-fade-up" onClick={() => setOpen(false)} />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Sign up"
        className="relative w-full sm:max-w-[400px] bg-white rounded-t-[24px] sm:rounded-[24px] shadow-2xl p-6 sm:p-7 text-center animate-slide-up"
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close"
          className="absolute right-4 top-4 w-9 h-9 rounded-full bg-surface-muted hover:bg-cream-dark flex items-center justify-center transition-colors"
        >
          <IconClose width="16" height="16" className="text-ink-soft" />
        </button>

        <span className="w-16 h-16 rounded-full bg-green-tint inline-flex items-center justify-center mb-4">
          <IconUser width="26" height="26" className="text-green" />
        </span>
        <h2 className="font-display text-xl font-bold text-ink m-0 mb-2">Join Falsafah Tot free</h2>
        <p className="text-sm text-text mb-6 leading-relaxed">
          Sign up to save products, message sellers, and check out faster — free shipping on your first order.
        </p>

        <Link
          to="/auth?screen=signup&role=buyer"
          onClick={() => setOpen(false)}
          className="block text-center cursor-pointer bg-green hover:bg-green-hover text-white font-semibold text-[15px] py-3.5 rounded-full no-underline shadow-[0_8px_22px_rgba(14,90,70,0.25)] transition-all hover:-translate-y-0.5 mb-3"
        >
          Customer Sign Up
        </Link>
        <div className="flex items-center justify-center gap-1.5 text-sm">
          <Link to="/auth" onClick={() => setOpen(false)} className="text-green font-semibold no-underline hover:underline">
            Sign in
          </Link>
          <span className="text-text-muted">·</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="cursor-pointer text-text-muted font-medium hover:text-ink transition-colors"
          >
            Continue browsing
          </button>
        </div>
      </div>
    </div>
  );
}
