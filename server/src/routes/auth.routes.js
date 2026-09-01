import path from 'node:path';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Seller } from '../models/Seller.js';
import { Session } from '../models/Session.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { signAuthToken, createEmailVerificationToken, hashEmailVerificationToken } from '../utils/token.js';
import { requireAuth } from '../middleware/auth.js';
import { serializeUser } from '../utils/serializeUser.js';
import { sendVerificationEmail } from '../utils/mailer.js';
import { describeBan, liftExpiredBan } from '../utils/ban.js';

const router = Router();
const UPLOAD_ROOT = path.resolve('uploads');

function slugify(str) {
  return String(str)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

async function findOrCreateSellerByName(name) {
  const existing = await Seller.findOne({ name });
  if (existing) return existing;
  return Seller.create({ name, verified: false, followerCount: 0, responseRate: 90 });
}

const HANDLE_RE = /^[a-z0-9_]{3,20}$/;

// Best-effort "@handle" for a brand-new account, derived from their display name. Collisions are
// rare (random 4-digit suffix) but not impossible, so this retries a handful of times with a
// fresh suffix rather than letting a unique-index race fail the whole signup.
async function generateUniqueHandle(companyName) {
  const base = slugify(companyName).slice(0, 14) || 'user';
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const suffix = String(Math.floor(1000 + Math.random() * 9000));
    const candidate = `${base}${suffix}`.slice(0, 20);
    if (!(await User.findOne({ handle: candidate }))) return candidate;
  }
  return null; // Leave it unset rather than block signup — editable later from the profile page.
}

async function findUserByIdentifier(identifier) {
  const id = String(identifier ?? '').trim().toLowerCase();
  return User.findOne({ $or: [{ email: id }, { phone: String(identifier ?? '').trim() }] });
}

// Creates the Session document a fresh sign-in/sign-up is bound to, then signs a token carrying
// its id — shared so signin and signup can never drift on how a session gets created.
async function createSessionAndToken(user, req) {
  const sessionId = crypto.randomUUID();
  await Session.create({
    userId: user._id,
    sessionId,
    userAgent: req.headers['user-agent'] || '',
    ip: req.ip,
  });
  return signAuthToken(user, sessionId);
}

// Generates a fresh verification token, saves its hash on the user, and emails it to their
// registered address. Shared by signup and the resend endpoint so the two can never drift.
async function issueEmailVerification(user) {
  const { token, tokenHash, expires } = createEmailVerificationToken();
  user.set({
    emailVerificationTokenHash: tokenHash,
    emailVerificationExpires: expires,
    emailVerificationSentAt: new Date(),
  });
  await user.save();
  await sendVerificationEmail(user, token);
}

const RESEND_COOLDOWN_MS = 60 * 1000;

// ---------- POST /api/auth/signin ----------
router.post(
  '/signin',
  asyncHandler(async (req, res) => {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ message: 'Email/phone and password are required.' });
    }
    const user = await findUserByIdentifier(identifier);
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email/phone or password.' });
    }
    await liftExpiredBan(user);
    const ban = describeBan(user);
    if (ban.banned) {
      return res.status(403).json({ message: ban.message });
    }
    const token = await createSessionAndToken(user, req);
    res.json({ token, user: await serializeUser(user) });
  })
);

// ---------- POST /api/auth/signup ----------
router.post(
  '/signup',
  asyncHandler(async (req, res) => {
    const body = req.body;
    const {
      role,
      companyName,
      country,
      phone,
      email,
      password,
      category,
      address,
      sellerType,
      location,
      businessAddress,
      businessDocument,
      legalCompanyName,
      registrationNumber,
      ntn,
      companyEmail,
      companyPhone,
      bankName,
      accountTitle,
      accountNumber,
      iban,
    } = body;

    if (!role || !companyName || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }
    // Admin accounts are provisioned directly (not self-service) — without this, anyone could
    // hit this endpoint with role:"admin" and get a full admin JWT.
    if (role !== 'buyer' && role !== 'seller') {
      return res.status(400).json({ message: 'Invalid account type.' });
    }
    if (await findUserByIdentifier(email)) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }
    if (phone && (await findUserByIdentifier(phone))) {
      return res.status(409).json({ message: 'An account with this phone number already exists.' });
    }

    const isCorporate = role === 'seller' && sellerType === 'corporate';

    if (isCorporate) {
      const required = {
        location,
        'business address': businessAddress,
        'business document': businessDocument,
        'legal company name': legalCompanyName,
        'business registration number': registrationNumber,
        NTN: ntn,
        'company email': companyEmail,
        'company phone number': companyPhone,
        'bank name': bankName,
        'account title': accountTitle,
        'account number': accountNumber,
        IBAN: iban,
      };
      const missing = Object.entries(required).find(([, val]) => !val || !String(val).trim());
      if (missing) {
        return res.status(400).json({ message: `${missing[0][0].toUpperCase()}${missing[0].slice(1)} is required.` });
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(companyEmail)) {
        return res.status(400).json({ message: 'Enter a valid company email address.' });
      }
    }

    const isSeller = role === 'seller';
    const passwordHash = await bcrypt.hash(password, 10);
    const sellerDoc = isSeller ? await findOrCreateSellerByName(companyName) : null;
    const handle = await generateUniqueHandle(companyName);

    const user = await User.create({
      role,
      email,
      phone,
      passwordHash,
      companyName,
      handle,
      country,
      category: category || null,
      address: address || null,
      sellerId: sellerDoc?._id || null,
      sellerType: isSeller ? sellerType || 'individual' : null,
      location: isCorporate ? location : null,
      businessAddress: isCorporate ? businessAddress : null,
      businessDocument: isCorporate ? businessDocument : null,
      legalCompanyName: isCorporate ? legalCompanyName : null,
      registrationNumber: isCorporate ? registrationNumber : null,
      ntn: isCorporate ? ntn : null,
      companyEmail: isCorporate ? companyEmail : null,
      companyPhone: isCorporate ? companyPhone : null,
      bankName: isCorporate ? bankName : null,
      accountTitle: isCorporate ? accountTitle : null,
      accountNumber: isCorporate ? accountNumber : null,
      iban: isCorporate ? iban : null,
    });

    // Best-effort — a broken/unconfigured mail provider shouldn't block account creation itself,
    // just leave the account unverified until they hit "resend" (see /verify-email/resend).
    let emailSendFailed = false;
    try {
      await issueEmailVerification(user);
    } catch (err) {
      console.error('Failed to send verification email on signup:', err.message);
      emailSendFailed = true;
    }

    // Every new account is live right away — sign them straight in, same as a normal /signin.
    const token = await createSessionAndToken(user, req);
    res.json({ token, user: await serializeUser(user), emailSendFailed });
  })
);

// ---------- POST /api/auth/verify-email ----------
// Public — the token itself, freshly emailed to the user's registered address, is the
// credential here, so this deliberately doesn't require a signed-in session (the link should
// work from any device/browser the user opens their inbox in).
router.post(
  '/verify-email',
  asyncHandler(async (req, res) => {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'Verification token is required.' });

    const user = await User.findOne({ emailVerificationTokenHash: hashEmailVerificationToken(token) });
    if (!user || !user.emailVerificationExpires || user.emailVerificationExpires < new Date()) {
      return res.status(400).json({ message: 'This verification link is invalid or has expired.' });
    }

    user.set({
      emailVerified: true,
      emailVerificationTokenHash: null,
      emailVerificationExpires: null,
    });
    await user.save();
    res.json({ user: await serializeUser(user) });
  })
);

// ---------- POST /api/auth/verify-email/resend ----------
router.post(
  '/verify-email/resend',
  requireAuth,
  asyncHandler(async (req, res) => {
    if (req.user.emailVerified) {
      return res.status(400).json({ message: 'Your email is already verified.' });
    }
    const sentAt = req.user.emailVerificationSentAt;
    if (sentAt && Date.now() - sentAt.getTime() < RESEND_COOLDOWN_MS) {
      const waitSec = Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - sentAt.getTime())) / 1000);
      return res.status(429).json({ message: `Please wait ${waitSec}s before requesting another email.` });
    }
    try {
      await issueEmailVerification(req.user);
    } catch (err) {
      console.error('Failed to resend verification email:', err.message);
      return res.status(502).json({ message: "Couldn't send the verification email right now. Please try again shortly." });
    }
    res.json({ ok: true });
  })
);

// ---------- POST /api/auth/forgot-password ----------
// Self-service password reset needs a real delivery channel (email/SMS) to verify identity
// before letting someone set a new password — not wired up yet, so this intentionally stays a
// clear "not available" response rather than a fake/bypassable verification step.
router.post('/forgot-password', (_req, res) => {
  res.status(503).json({ message: "Password reset isn't available yet. Please contact support to reset your password." });
});

// ---------- POST /api/auth/logout ----------
// Deletes the Session this token is bound to, so the token stops working immediately (not just
// once the client discards it) — see middleware/auth.js. A legacy pre-session token has no
// req.sessionId; nothing to delete, so this is still a safe no-op for it.
router.post(
  '/logout',
  asyncHandler(async (req, res) => {
    if (req.sessionId) await Session.deleteOne({ sessionId: req.sessionId });
    res.json({ ok: true });
  })
);

// ---------- GET /api/auth/session ----------
router.get(
  '/session',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ user: await serializeUser(req.user) });
  })
);

// ---------- PATCH /api/auth/profile ----------
router.patch(
  '/profile',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { companyName, phone, country, category, handle } = req.body;
    if (!companyName) return res.status(400).json({ message: 'Company name is required.' });

    const update = { companyName, phone, country, category };

    // handle is optional on this route (undefined = "leave it alone") so the existing
    // name/phone/country form can keep patching without ever having to know about it.
    if (handle !== undefined) {
      const normalized = String(handle || '').trim().toLowerCase();
      if (!HANDLE_RE.test(normalized)) {
        return res.status(400).json({ message: 'Handle must be 3-20 characters: lowercase letters, numbers, underscores.' });
      }
      const taken = await User.findOne({ handle: normalized, _id: { $ne: req.user._id } });
      if (taken) return res.status(409).json({ message: 'That handle is already taken.' });
      update.handle = normalized;
    }

    req.user.set(update);
    await req.user.save();
    res.json({ user: await serializeUser(req.user) });
  })
);

// ---------- PATCH /api/auth/preferences ----------
// Separate from /profile on purpose — that route requires companyName and is about identity
// fields, while this is just Settings-page state (language, notification toggles) that should
// be patchable independently and never blocked by profile validation.
const NOTIFICATION_PREF_KEYS = ['master', 'orders', 'wishlist', 'account'];
router.patch(
  '/preferences',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { language, notificationPreferences } = req.body;
    const update = {};

    if (language !== undefined) {
      if (!['en', 'ur'].includes(language)) {
        return res.status(400).json({ message: 'Unsupported language.' });
      }
      update.language = language;
    }

    if (notificationPreferences !== undefined) {
      if (typeof notificationPreferences !== 'object' || notificationPreferences === null) {
        return res.status(400).json({ message: 'Invalid notification preferences.' });
      }
      const merged = req.user.notificationPreferences
        ? req.user.notificationPreferences.toObject()
        : { master: true, orders: true, wishlist: true, account: true };
      for (const key of NOTIFICATION_PREF_KEYS) {
        if (typeof notificationPreferences[key] === 'boolean') merged[key] = notificationPreferences[key];
      }
      update.notificationPreferences = merged;
    }

    req.user.set(update);
    await req.user.save();
    res.json({ user: await serializeUser(req.user) });
  })
);

// Matches exactly what POST /api/uploads/avatars hands back (see server/src/middleware/upload.js:
// nanoid(16) + the original extension) — anchored end-to-end so no path-traversal segment or
// extra slash can sneak in ahead of the "starts with" check.
const AVATAR_URL_RE = /^\/uploads\/avatars\/[A-Za-z0-9_-]{1,64}\.[a-z0-9]{1,8}$/i;

// Best-effort cleanup of the file an avatar URL used to point at, so repeated change/remove
// cycles don't quietly fill up disk with orphaned uploads. Never blocks the response on this —
// a delete failure (e.g. already gone) shouldn't turn a successful profile update into an error.
async function deleteAvatarFile(avatarUrl) {
  if (!avatarUrl || !AVATAR_URL_RE.test(avatarUrl)) return;
  const filePath = path.join(UPLOAD_ROOT, 'avatars', path.basename(avatarUrl));
  await fs.unlink(filePath).catch(() => {});
}

// ---------- PATCH /api/auth/avatar ----------
// Separate from /profile for the same reason /preferences is: that route requires companyName,
// and an avatar change shouldn't be blocked by unrelated identity-field validation. `avatarUrl`
// must be null (remove) or a path this app itself just handed back from POST /api/uploads/avatars
// — never an arbitrary string — so this can't be used to plant an unrelated/external image URL.
router.patch(
  '/avatar',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { avatarUrl } = req.body;
    if (avatarUrl !== null && !(typeof avatarUrl === 'string' && AVATAR_URL_RE.test(avatarUrl))) {
      return res.status(400).json({ message: 'Invalid profile picture.' });
    }
    const previousAvatarUrl = req.user.avatarUrl;
    req.user.set({ avatarUrl });
    await req.user.save();
    if (previousAvatarUrl && previousAvatarUrl !== avatarUrl) {
      await deleteAvatarFile(previousAvatarUrl);
    }
    res.json({ user: await serializeUser(req.user) });
  })
);

// Same shape as AVATAR_URL_RE, pointed at /uploads/store-banners/ instead — what POST
// /api/uploads/store-banners hands back.
const BANNER_URL_RE = /^\/uploads\/store-banners\/[A-Za-z0-9_-]{1,64}\.[a-z0-9]{1,8}$/i;

async function deleteBannerFile(bannerUrl) {
  if (!bannerUrl || !BANNER_URL_RE.test(bannerUrl)) return;
  const filePath = path.join(UPLOAD_ROOT, 'store-banners', path.basename(bannerUrl));
  await fs.unlink(filePath).catch(() => {});
}

// ---------- PATCH /api/auth/banner ----------
// Mirrors PATCH /api/auth/avatar exactly, one folder over — the cover photo behind the avatar on
// the profile page.
router.patch(
  '/banner',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { bannerUrl } = req.body;
    if (bannerUrl !== null && !(typeof bannerUrl === 'string' && BANNER_URL_RE.test(bannerUrl))) {
      return res.status(400).json({ message: 'Invalid banner image.' });
    }
    const previousBannerUrl = req.user.bannerUrl;
    req.user.set({ bannerUrl });
    await req.user.save();
    if (previousBannerUrl && previousBannerUrl !== bannerUrl) {
      await deleteBannerFile(previousBannerUrl);
    }
    res.json({ user: await serializeUser(req.user) });
  })
);

// ---------- PATCH /api/auth/password ----------
// Changing the password revokes every other session as a security measure (standard practice —
// a compromised/shared device losing its saved password shouldn't keep a live session), keeping
// only the one that made this request.
router.patch(
  '/password',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required.' });
    }
    if (!(await req.user.comparePassword(currentPassword))) {
      return res.status(400).json({ message: 'Current password is incorrect.' });
    }
    if (String(newPassword).length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters.' });
    }
    req.user.passwordHash = await bcrypt.hash(newPassword, 10);
    await req.user.save();
    const keepSessionId = req.sessionId;
    await Session.deleteMany({
      userId: req.user._id,
      ...(keepSessionId ? { sessionId: { $ne: keepSessionId } } : {}),
    });
    res.json({ ok: true });
  })
);

// ---------- GET /api/auth/sessions ----------
router.get(
  '/sessions',
  requireAuth,
  asyncHandler(async (req, res) => {
    const sessions = await Session.find({ userId: req.user._id }).sort({ lastActiveAt: -1 });
    res.json({
      sessions: sessions.map((s) => ({
        id: s._id,
        userAgent: s.userAgent,
        ip: s.ip,
        createdAt: s.createdAt,
        lastActiveAt: s.lastActiveAt,
        current: s.sessionId === req.sessionId,
      })),
    });
  })
);

// ---------- DELETE /api/auth/sessions/:id ----------
router.delete(
  '/sessions/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const session = await Session.findOne({ _id: req.params.id, userId: req.user._id });
    if (!session) return res.status(404).json({ message: 'Session not found.' });
    await session.deleteOne();
    res.json({ ok: true });
  })
);

// ---------- POST /api/auth/sessions/revoke-others ----------
router.post(
  '/sessions/revoke-others',
  requireAuth,
  asyncHandler(async (req, res) => {
    await Session.deleteMany({
      userId: req.user._id,
      ...(req.sessionId ? { sessionId: { $ne: req.sessionId } } : {}),
    });
    res.json({ ok: true });
  })
);

export default router;
