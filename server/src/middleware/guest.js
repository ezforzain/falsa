import { nanoid } from 'nanoid';

const COOKIE_NAME = 'guestId';
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

// Guest-scoped cart/follows need a stable anonymous id across requests. Issued as an httpOnly
// cookie on first use, matching how the mock's localStorage-backed cart survives a refresh.
export function ensureGuestId(req, res, next) {
  let guestId = req.cookies?.[COOKIE_NAME];
  if (!guestId) {
    guestId = nanoid(21);
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
