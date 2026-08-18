import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Seller } from '../models/Seller.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { signAuthToken } from '../utils/token.js';
import { requireAuth } from '../middleware/auth.js';
import { serializeUser } from '../utils/serializeUser.js';

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

    const token = signAuthToken(user);
    res.json({ token, user: await serializeUser(user) });
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
