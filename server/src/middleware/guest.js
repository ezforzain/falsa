import { nanoid } from 'nanoid';

const COOKIE_NAME = 'guestId';
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
const HEADER_NAME = 'x-guest-id';
// Matches what the client generates (crypto.randomUUID(), see guestIdStore in src/lib/api.js) —
// deliberately a bit looser than a strict UUID regex so older/manually-set ids aren't rejected.
const VALID_GUEST_ID_RE = /^[A-Za-z0-9_-]{10,64}$/;

// Guest-scoped cart/follows need a stable anonymous id across requests. The client now owns this
// id (generated once, kept in localStorage) and sends it as the X-Guest-Id header on every
// request — that's the primary channel, because the SameSite=None cookie this used to rely on
// exclusively gets dropped by mobile browsers blocking cross-site cookies once frontend and API
// are on different origins (Vercel + Render in production), which silently handed a request a
// brand-new empty cart instead of the one items were actually added to.
//
// The cookie is still set/read too — harmless, and keeps things working unchanged for any client
// that hasn't picked up the header yet — but the header wins when both are present.
export function ensureGuestId(req, res, next) {
  const headerValue = req.headers[HEADER_NAME];
  const headerGuestId = typeof headerValue === 'string' && VALID_GUEST_ID_RE.test(headerValue) ? headerValue : null;
  let guestId = headerGuestId || req.cookies?.[COOKIE_NAME];
  if (!guestId) guestId = nanoid(21);

  if (guestId !== req.cookies?.[COOKIE_NAME]) {
    const crossOrigin = process.env.NODE_ENV === 'production';
    res.cookie(COOKIE_NAME, guestId, {
      httpOnly: true,
      // Frontend and backend are on different origins in production (e.g. Vercel + a separate
      // API host) — a cross-origin fetch only carries the cookie if it's SameSite=None, which
      // itself requires Secure (HTTPS). Locally, frontend/backend share an origin through the
      // Vite proxy and there's no HTTPS, so `lax` (no `secure`) is what actually works there.
      sameSite: crossOrigin ? 'none' : 'lax',
      secure: crossOrigin,
      maxAge: ONE_YEAR_MS,
    });
  }
  req.guestId = guestId;
  next();
}
