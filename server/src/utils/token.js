import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';

export function signAuthToken(user) {
  return jwt.sign({ sub: String(user._id), role: user.role }, process.env.JWT_SECRET, {
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

export function makePendingToken() {
  return `pending_${nanoid(24)}`;
}

// Fixed dev-mode OTP for now — swap for a real emailed code (e.g. via Resend) later.
export const DEV_OTP_CODE = '123456';
