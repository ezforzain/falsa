import { verifyAuthToken } from '../utils/token.js';
import { User } from '../models/User.js';
import { Session } from '../models/Session.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function bearerToken(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

// Only bother writing lastActiveAt when it's meaningfully stale — avoids a DB write on every
// single authenticated request just to keep a "last active" timestamp fresh.
const LAST_ACTIVE_THROTTLE_MS = 5 * 60 * 1000;

// Attaches req.user (and req.sessionId) when a valid Bearer token is present; never rejects by
// itself — requireAuth/requireRole are what actually enforce access.
export const attachUser = asyncHandler(async (req, _res, next) => {
  const token = bearerToken(req);
  const payload = token ? verifyAuthToken(token) : null;
  if (!payload) return next();

  // Tokens carry a session id (payload.sid) tying them to a Session document — deleting that
  // document (logout, "sign out this device", "sign out other devices", password change) makes
  // the token stop working immediately instead of only until it naturally expires. Tokens minted
  // before sessions existed have no `sid`; those fall back to the old trust-the-JWT-alone
  // behavior so nobody already signed in gets abruptly logged out by this change — they simply
  // aren't revocable until their next sign-in issues a session-bound token.
  if (payload.sid) {
    const session = await Session.findOne({ sessionId: payload.sid, userId: payload.sub });
    if (!session) return next();
    req.sessionId = payload.sid;
    if (Date.now() - session.lastActiveAt.getTime() > LAST_ACTIVE_THROTTLE_MS) {
      session.lastActiveAt = new Date();
      await session.save();
    }
  }

  req.user = await User.findById(payload.sub);
  next();
});

export const requireAuth = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Not signed in.' });
  if (req.user.status === 'suspended') {
    return res.status(403).json({ message: 'Your account has been suspended. Contact support for help.' });
  }
  next();
};

export const requireRole = (role) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Not signed in.' });
  if (req.user.role !== role) {
    return res.status(403).json({ message: `This area is only available to ${role} accounts.` });
  }
  next();
};
