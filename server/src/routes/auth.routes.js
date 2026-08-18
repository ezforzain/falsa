import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Seller } from '../models/Seller.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { signAuthToken, createEmailVerificationToken, hashEmailVerificationToken } from '../utils/token.js';
import { requireAuth } from '../middleware/auth.js';
import { serializeUser } from '../utils/serializeUser.js';
import { sendVerificationEmail } from '../utils/mailer.js';

const router = Router();

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

async function findUserByIdentifier(identifier) {
  const id = String(identifier ?? '').trim().toLowerCase();
  return User.findOne({ $or: [{ email: id }, { phone: String(identifier ?? '').trim() }] });
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
    if (user.status === 'suspended') {
      return res.status(403).json({ message: 'Your account has been suspended. Contact support for help.' });
    }
    const token = signAuthToken(user);
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
      cnicNumber,
      cnicFront,
      cnicBack,
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

    let normalizedCnic = null;
    const isCorporate = role === 'seller' && sellerType === 'corporate';

    if (role === 'seller' && !isCorporate) {
      if (!address || !cnicNumber || !cnicFront || !cnicBack) {
        return res.status(400).json({
          message: 'Address, CNIC number, and both CNIC images are required for seller accounts.',
        });
      }
      normalizedCnic = String(cnicNumber).replace(/\D/g, '');
      if (!/^\d{13}$/.test(normalizedCnic)) {
        return res
          .status(400)
          .json({ message: 'CNIC number must be exactly 13 digits (dashes are fine, letters are not).' });
      }
      if (await User.findOne({ cnicNumber: normalizedCnic })) {
        return res.status(409).json({
          message: 'This CNIC number is already registered. Only one seller account is allowed per CNIC.',
        });
      }
    }

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

    const user = await User.create({
      role,
      email,
      phone,
      passwordHash,
      companyName,
      country,
      category: category || null,
      address: address || null,
      sellerId: sellerDoc?._id || null,
      sellerType: isSeller ? sellerType || 'individual' : null,
      cnicNumber: isSeller && !isCorporate ? normalizedCnic : null,
      cnicFront: isSeller && !isCorporate ? cnicFront : null,
      cnicBack: isSeller && !isCorporate ? cnicBack : null,
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
      cnicStatus: isSeller ? 'pending' : null,
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

    const token = signAuthToken(user);
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
// Stateless JWTs aren't server-revocable here; the client is expected to discard the token.
router.post('/logout', (_req, res) => {
  res.json({ ok: true });
});

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
    const { companyName, phone, country, category } = req.body;
    if (!companyName) return res.status(400).json({ message: 'Company name is required.' });
    req.user.set({ companyName, phone, country, category });
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
    if (avatarUrl !== null && !(typeof avatarUrl === 'string' && avatarUrl.startsWith('/uploads/avatars/'))) {
      return res.status(400).json({ message: 'Invalid profile picture.' });
    }
    req.user.set({ avatarUrl });
    await req.user.save();
    res.json({ user: await serializeUser(req.user) });
  })
);

// ---------- POST /api/auth/kyc/resubmit ----------
router.post(
  '/kyc/resubmit',
  requireAuth,
  asyncHandler(async (req, res) => {
    if (req.user.role !== 'seller') {
      return res.status(403).json({ message: 'Only seller accounts can resubmit CNIC documents.' });
    }
    const { cnicFront, cnicBack } = req.body;
    if (!cnicFront || !cnicBack) {
      return res.status(400).json({ message: 'Both CNIC front and back images are required.' });
    }
    req.user.set({
      cnicFront,
      cnicBack,
      cnicStatus: 'pending',
      cnicRejectionReason: null,
      reviewedBy: null,
      reviewedAt: null,
    });
    await req.user.save();
    res.json({ user: await serializeUser(req.user) });
  })
);

export default router;
