import { nanoid } from 'nanoid';

const COOKIE_NAME = 'guestId';
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

// Guest-scoped cart/follows need a stable anonymous id across requests. Issued as an httpOnly
// cookie on first use, matching how the mock's localStorage-backed cart survives a refresh.
export function ensureGuestId(req, res, next) {
  let guestId = req.cookies?.[COOKIE_NAME];
  if (!guestId) {
    guestId = nanoid(21);
    res.cookie(COOKIE_NAME, guestId, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: ONE_YEAR_MS,
    });
  }
  req.guestId = guestId;
  next();
}
