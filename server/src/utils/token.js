import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';

// Email verification tokens: the raw token goes out in the email link and is never stored —
// only its SHA-256 hash sits in the DB (same idea as a password), so a database leak alone
// can't be used to verify/hijack an account.
const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24h

export function createEmailVerificationToken() {
  const token = crypto.randomBytes(32).toString('hex');
  return {
    token,
    tokenHash: hashEmailVerificationToken(token),
    expires: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
  };
}

export function hashEmailVerificationToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// sessionId, when passed, ties this token to a Session document (see models/Session.js) so it
// can be individually revoked later — see middleware/auth.js. Omitted only for tokens minted
// before sessions existed; there is no other caller that should skip it.
export function signAuthToken(user, sessionId) {
  const payload = { sub: String(user._id), role: user.role };
  if (sessionId) payload.sid = sessionId;
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
}

export function verifyAuthToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}
