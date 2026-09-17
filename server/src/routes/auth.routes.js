import path from 'node:path';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Seller } from '../models/Seller.js';
import { Session } from '../models/Session.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  signAuthToken,
  createEmailVerificationOtp,
  hashEmailVerificationOtp,
  createPasswordResetOtp,
  hashPasswordResetOtp,
  createPasswordResetToken,
  hashPasswordResetToken,
} from '../utils/token.js';
import { requireAuth } from '../middleware/auth.js';
import { serializeUser } from '../utils/serializeUser.js';
import { sendVerificationOtpEmail, sendPasswordResetOtpEmail } from '../utils/mailer.js';
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

// Generates a fresh 6-digit verification code, saves its hash on the user, and emails it to
// their registered address. Shared by signup and the resend endpoint so the two can never drift.
async function issueEmailVerification(user) {
  const { code, codeHash, expires } = createEmailVerificationOtp();
  user.set({
    emailVerificationOtpHash: codeHash,
    emailVerificationOtpAttempts: 0,
    emailVerificationExpires: expires,
    emailVerificationSentAt: new Date(),
  });
  await user.save();
  await sendVerificationOtpEmail(user, code);
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
    // The User schema requires phone too (see models/User.js) — without this check, a signup
    // that skips it fails deep inside User.create() as a raw Mongoose ValidationError, which the
    // global error handler turns into an unhelpful generic 500 instead of a clear 400.
    if (!phone || !String(phone).trim()) {
      return res.status(400).json({ message: 'Phone number is required.' });
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

// ---------- POST /api/auth/verify-email/otp ----------
// Signup already signs the account straight in (see below), so this is requireAuth-gated and
// checks the code against the signed-in user directly — no separate email lookup needed, same
// pattern as /verify-email/resend. Wrong-code attempts are capped per code so a 6-digit code
// can't just be brute-forced within its 10-minute window (mirrors /forgot-password/verify).
router.post(
  '/verify-email/otp',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: 'Verification code is required.' });

    const user = req.user;
    const invalid = () => res.status(400).json({ message: 'Invalid or expired code.' });
    if (user.emailVerified) return res.status(400).json({ message: 'Your email is already verified.' });
    if (!user.emailVerificationOtpHash || !user.emailVerificationExpires || user.emailVerificationExpires < new Date()) {
      return invalid();
    }
    if (user.emailVerificationOtpAttempts >= 5) return invalid();
    if (hashEmailVerificationOtp(String(code).trim()) !== user.emailVerificationOtpHash) {
      user.emailVerificationOtpAttempts += 1;
      await user.save();
      return invalid();
    }

    user.set({
      emailVerified: true,
      emailVerificationOtpHash: null,
      emailVerificationOtpAttempts: 0,
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
// Always resolves { ok: true } whether or not the email is registered, so this can't be used to
// enumerate accounts — the OTP is only ever actually sent when a matching user exists. Also
// doubles as the "resend" action from the OTP screen (same cooldown as email verification).
router.post(
  '/forgot-password',
  asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email || !String(email).trim()) {
      return res.status(400).json({ message: 'Email is required.' });
    }
    const user = await User.findOne({ email: String(email).trim().toLowerCase() });
    if (user) {
      if (user.passwordResetSentAt && Date.now() - user.passwordResetSentAt.getTime() < RESEND_COOLDOWN_MS) {
        const waitSec = Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - user.passwordResetSentAt.getTime())) / 1000);
        return res.status(429).json({ message: `Please wait ${waitSec}s before requesting another code.` });
      }
      const { code, codeHash, expires } = createPasswordResetOtp();
      user.set({
        passwordResetOtpHash: codeHash,
        passwordResetOtpExpires: expires,
        passwordResetOtpAttempts: 0,
        passwordResetSentAt: new Date(),
        passwordResetTokenHash: null,
        passwordResetTokenExpires: null,
      });
      await user.save();
      try {
        await sendPasswordResetOtpEmail(user, code);
      } catch (err) {
        console.error('Failed to send password reset OTP:', err.message);
        return res.status(502).json({ message: "Couldn't send the reset code right now. Please try again shortly." });
      }
    }
    res.json({ ok: true });
  })
);

// ---------- POST /api/auth/forgot-password/verify ----------
// Trades a correct OTP for a short-lived reset token (see createPasswordResetToken) so the final
// POST /reset-password doesn't need to re-send/re-check the code. Wrong-code attempts are capped
// per OTP so a 6-digit code can't just be brute-forced within its 10-minute window.
router.post(
  '/forgot-password/verify',
  asyncHandler(async (req, res) => {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ message: 'Email and code are required.' });
    }
    const invalid = () => res.status(400).json({ message: 'Invalid or expired code.' });
    const user = await User.findOne({ email: String(email).trim().toLowerCase() });
    if (!user || !user.passwordResetOtpHash || !user.passwordResetOtpExpires || user.passwordResetOtpExpires < new Date()) {
      return invalid();
    }
    if (user.passwordResetOtpAttempts >= 5) {
      return invalid();
    }
    if (hashPasswordResetOtp(String(code).trim()) !== user.passwordResetOtpHash) {
      user.passwordResetOtpAttempts += 1;
      await user.save();
      return invalid();
    }

    const { token, tokenHash, expires } = createPasswordResetToken();
    user.set({
      passwordResetOtpHash: null,
      passwordResetOtpExpires: null,
      passwordResetOtpAttempts: 0,
      passwordResetTokenHash: tokenHash,
      passwordResetTokenExpires: expires,
    });
    await user.save();
    res.json({ resetToken: token });
  })
);

// ---------- POST /api/auth/reset-password ----------
// Public, like /verify-email — the reset token from /forgot-password/verify is the credential
// here, proving this request already confirmed ownership of the email via the OTP.
router.post(
  '/reset-password',
  asyncHandler(async (req, res) => {
    const { email, resetToken, newPassword } = req.body;
    if (!email || !resetToken || !newPassword) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }
    if (String(newPassword).length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }
    const user = await User.findOne({ email: String(email).trim().toLowerCase() });
    if (
      !user ||
      !user.passwordResetTokenHash ||
      !user.passwordResetTokenExpires ||
      user.passwordResetTokenExpires < new Date() ||
      hashPasswordResetToken(resetToken) !== user.passwordResetTokenHash
    ) {
      return res.status(400).json({ message: 'This reset session has expired. Please start over.' });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.set({ passwordResetTokenHash: null, passwordResetTokenExpires: null });
    await user.save();
    // Same reasoning as PATCH /password: a password reset should kill every existing session,
    // not just be a no-op for whoever's still signed in elsewhere on this account.
    await Session.deleteMany({ userId: user._id });
    res.json({ ok: true });
  })
);

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
    const { companyName, phone, country, category, handle, address, city } = req.body;
    if (!companyName) return res.status(400).json({ message: 'Company name is required.' });
    // phone is required on the User schema itself — sending it empty would otherwise fail deep
    // inside req.user.save() as a raw ValidationError (generic 500) instead of a clear 400.
    if (!phone || !String(phone).trim()) return res.status(400).json({ message: 'Phone number is required.' });

    const update = { companyName, phone, country, category };
    // address/city are optional on this route (undefined = "leave it alone") — only sellers'
    // settings form sends them today (their TCS pickup point, see SellerSettings.jsx), but
    // there's no reason to restrict the field to sellers only.
    if (address !== undefined) update.address = address;
    if (city !== undefined) update.city = city;

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

const ADDRESS_FIELDS = ['fullName', 'phone', 'city', 'address'];

// ---------- PATCH /api/auth/address ----------
// Standalone counterpart to the auto-save that already happens inside POST /api/checkout —
// lets a signed-in buyer view/edit/remove their saved delivery address (User.savedAddress) from
// the Addresses page without having to place an order first. Same validation as checkout's own
// address handling, and null clears it (mirrors avatar/banner's null-to-remove convention).
router.patch(
  '/address',
  requireAuth,
  asyncHandler(async (req, res) => {
    // Wrapped in { address } rather than sent as a bare body, same reason every other nullable
    // field here is — express.json()'s default strict mode rejects a top-level `null` payload
    // outright (only object/array root values are valid JSON to it), so `null` has to travel
    // inside an object key instead of as the whole body.
    const { address } = req.body;
    if (address === null) {
      req.user.set({ savedAddress: null });
      await req.user.save();
      return res.json({ user: await serializeUser(req.user) });
    }
    const missing = ADDRESS_FIELDS.find((key) => !String(address?.[key] || '').trim());
    if (missing) {
      return res.status(400).json({ message: 'Please fill in full name, phone, city, and address.' });
    }
    const label = address.label === 'Office' ? 'Office' : 'Home';
    req.user.set({
      savedAddress: {
        fullName: String(address.fullName).trim(),
        phone: String(address.phone).trim(),
        city: String(address.city).trim(),
        address: String(address.address).trim(),
        label,
      },
    });
    await req.user.save();
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
