import { verifyAuthToken } from '../utils/token.js';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function bearerToken(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

// Attaches req.user when a valid Bearer token is present; never rejects by itself.
export const attachUser = asyncHandler(async (req, _res, next) => {
  const token = bearerToken(req);
  const payload = token ? verifyAuthToken(token) : null;
  if (payload) {
    req.user = await User.findById(payload.sub);
  }
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
