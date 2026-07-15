import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Seller } from '../models/Seller.js';
import { PendingAuth } from '../models/PendingAuth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { makePendingToken, signAuthToken, DEV_OTP_CODE } from '../utils/token.js';
import { requireAuth } from '../middleware/auth.js';

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
    const pendingToken = makePendingToken();
    await PendingAuth.create({ pendingToken, userId: user._id, purpose: 'signin', otp: DEV_OTP_CODE });
    res.json({ pendingToken });
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

    const pendingToken = makePendingToken();
    await PendingAuth.create({ pendingToken, userId: user._id, purpose: 'signup', otp: DEV_OTP_CODE });
    res.json({ pendingToken });
  })
);

// ---------- POST /api/auth/otp/verify ----------
router.post(
  '/otp/verify',
  asyncHandler(async (req, res) => {
    const { pendingToken, code } = req.body;
    if (!code || String(code).replace(/\s/g, '').length !== 6) {
      return res.status(400).json({ message: 'Enter the full 6-digit code.' });
    }
    const pending = await PendingAuth.findOne({ pendingToken });
    if (!pending) {
      return res.status(400).json({ message: 'This code has expired. Please try again.' });
    }
    if (String(code).replace(/\s/g, '') !== pending.otp) {
      return res.status(400).json({ message: 'Incorrect code. Please try again.' });
    }
    await PendingAuth.deleteOne({ _id: pending._id });

    if (pending.purpose === 'reset') {
      return res.json({ purpose: 'reset', ok: true });
    }
    if (!pending.userId) {
      return res.status(400).json({ message: 'Something went wrong. Please try again.' });
    }
    const user = await User.findById(pending.userId);
    const token = signAuthToken(user);
    res.json({ purpose: pending.purpose, token, user: user.toPublicJSON() });
  })
);

// ---------- POST /api/auth/forgot-password ----------
router.post(
  '/forgot-password',
  asyncHandler(async (req, res) => {
    const { identifier } = req.body;
    const user = await findUserByIdentifier(identifier);
    // Always succeed, even if no account matches — don't leak account existence.
    const pendingToken = makePendingToken();
    await PendingAuth.create({ pendingToken, userId: user?._id || null, purpose: 'reset', otp: DEV_OTP_CODE });
    res.json({ pendingToken });
  })
);

// ---------- POST /api/auth/logout ----------
// Stateless JWTs aren't server-revocable here; the client is expected to discard the token.
router.post('/logout', (_req, res) => {
  res.json({ ok: true });
});

// ---------- GET /api/auth/session ----------
router.get('/session', requireAuth, (req, res) => {
  res.json({ user: req.user.toPublicJSON() });
});

// ---------- PATCH /api/auth/profile ----------
router.patch(
  '/profile',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { companyName, phone, country, category } = req.body;
    if (!companyName) return res.status(400).json({ message: 'Company name is required.' });
    req.user.set({ companyName, phone, country, category });
    await req.user.save();
    res.json({ user: req.user.toPublicJSON() });
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
    res.json({ user: req.user.toPublicJSON() });
  })
);

export default router;
