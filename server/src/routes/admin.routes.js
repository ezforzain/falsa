import { Router } from 'express';
import { Seller } from '../models/Seller.js';
import { User } from '../models/User.js';
import { Product } from '../models/Product.js';
import { PromotionRequest } from '../models/PromotionRequest.js';
import { Payout } from '../models/Payout.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { serializeUser, serializeUsers } from '../utils/serializeUser.js';
import { parseMoqNumber } from '../utils/moq.js';

const router = Router();
router.use(requireAuth, requireRole('admin'));

router.patch(
  '/sellers/:id/verify',
  asyncHandler(async (req, res) => {
    const { verified } = req.body;
    const sellerRecord = await Seller.findByIdAndUpdate(req.params.id, { verified: Boolean(verified) }, { new: true });
    if (!sellerRecord) return res.status(404).json({ message: 'Store not found.' });
    // Keep the denormalized copy on every one of this seller's products in sync — the
    // marketplace tabs filter/rank off Product.sellerVerified directly rather than populating.
    await Product.updateMany({ sellerId: sellerRecord._id }, { sellerVerified: sellerRecord.verified });
    res.json({ seller: sellerRecord });
  })
);

router.patch(
  '/sellers/:id/official-store',
  asyncHandler(async (req, res) => {
    const { officialStore } = req.body;
    const sellerRecord = await Seller.findByIdAndUpdate(req.params.id, { officialStore: Boolean(officialStore) }, { new: true });
    if (!sellerRecord) return res.status(404).json({ message: 'Store not found.' });
    await Product.updateMany({ sellerId: sellerRecord._id }, { sellerOfficialStore: sellerRecord.officialStore });
    res.json({ seller: sellerRecord });
  })
);

const DEFAULT_PRODUCT_IMG = 'https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=700&q=80';

function slugify(name) {
  return String(name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '');
}

async function uniqueProductSlug(name) {
  const base = slugify(name) || 'product';
  let slug = base;
  let n = 1;
  // eslint-disable-next-line no-await-in-loop
  while (await Product.exists({ _id: slug })) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}

function formatPrice(price) {
  const trimmed = String(price).trim();
  return /^rs\b/i.test(trimmed) ? trimmed : `Rs ${trimmed}`;
}

// Numeric twin of the display price string, for the marketplace tabs' price-range filter.
function parsePriceValue(price) {
  const n = Number(String(price).replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? n : null;
}

function serializeAdminProduct(doc) {
  const p = doc.toObject();
  const sellerDoc = p.sellerId;
  return {
    ...p,
    id: p._id,
    sellerId: sellerDoc?._id ?? p.sellerId,
    sellerName: sellerDoc?.name ?? p.seller,
    verified: sellerDoc?.verified || false,
  };
}

router.get(
  '/products',
  asyncHandler(async (_req, res) => {
    const products = await Product.find().sort({ createdAt: -1 }).populate('sellerId', 'name verified');
    res.json({ products: products.map(serializeAdminProduct) });
  })
);

router.post(
  '/products',
  asyncHandler(async (req, res) => {
    const { name, sellerId, category, description, price, unit, moq, stock, badge, images, img, b2bEnabled, freeShipping, worldwideFreeShipping } = req.body;
    if (!name || !sellerId || !category || !price) {
      return res.status(400).json({ message: 'Please fill in all required fields.' });
    }
    const sellerDoc = await Seller.findById(sellerId);
    if (!sellerDoc) return res.status(400).json({ message: 'Selected store was not found.' });
    if (stock !== undefined && stock !== null && stock !== '' && (!Number.isInteger(stock) || stock < 0)) {
      return res.status(400).json({ message: 'Stock must be zero or a positive whole number.' });
    }
    if (images !== undefined && (!Array.isArray(images) || images.some((url) => typeof url !== 'string'))) {
      return res.status(400).json({ message: 'Images must be a list of URLs.' });
    }
    const gallery = Array.isArray(images) && images.length > 0 ? images : [img || DEFAULT_PRODUCT_IMG];
    const _id = await uniqueProductSlug(name);
    const product = await Product.create({
      _id,
      name,
      sellerId: sellerDoc._id,
      seller: sellerDoc.name,
      category,
      description: description || '',
      price: formatPrice(price),
      priceValue: parsePriceValue(price),
      moq: moq || '',
      moqValue: parseMoqNumber(moq),
      unit: unit || '',
      badge: badge || undefined,
      stock: stock === undefined || stock === null || stock === '' ? null : Number(stock),
      img: gallery[0],
      images: gallery,
      b2bEnabled: Boolean(b2bEnabled),
      freeShipping: freeShipping !== false,
      worldwideFreeShipping: Boolean(worldwideFreeShipping),
      sellerCountry: sellerDoc.country || null,
      sellerVerified: sellerDoc.verified || false,
      sellerOfficialStore: sellerDoc.officialStore || false,
    });
    await product.populate('sellerId', 'name verified');
    res.status(201).json({ product: serializeAdminProduct(product) });
  })
);

router.patch(
  '/products/:id',
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found.' });

    const body = { ...req.body };
    if (body.sellerId) {
      const sellerDoc = await Seller.findById(body.sellerId);
      if (!sellerDoc) return res.status(400).json({ message: 'Selected store was not found.' });
      body.sellerId = sellerDoc._id;
      body.seller = sellerDoc.name;
      body.sellerCountry = sellerDoc.country || null;
      body.sellerVerified = sellerDoc.verified || false;
      body.sellerOfficialStore = sellerDoc.officialStore || false;
    }
    if (body.price !== undefined) {
      body.priceValue = parsePriceValue(body.price);
      body.price = formatPrice(body.price);
    }
    if (body.moq !== undefined) body.moqValue = parseMoqNumber(body.moq);
    if (body.stock !== undefined) {
      body.stock = body.stock === null || body.stock === '' ? null : Number(body.stock);
    }
    if (body.b2bEnabled !== undefined) body.b2bEnabled = Boolean(body.b2bEnabled);
    if (body.freeShipping !== undefined) body.freeShipping = body.freeShipping !== false;
    if (body.worldwideFreeShipping !== undefined) body.worldwideFreeShipping = Boolean(body.worldwideFreeShipping);
    if (Array.isArray(body.images)) {
      body.images = body.images.length > 0 ? body.images : product.images;
      body.img = body.images[0];
    }

    product.set(body);
    await product.save();
    await product.populate('sellerId', 'name verified');
    res.json({ product: serializeAdminProduct(product) });
  })
);

router.delete(
  '/products/:id',
  asyncHandler(async (req, res) => {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Product not found.' });
    res.json({ ok: true });
  })
);

const STATUS_ORDER = { pending: 0, rejected: 1, approved: 2 };

router.get(
  '/kyc',
  asyncHandler(async (_req, res) => {
    const sellers = await User.find({ role: 'seller' });
    const serialized = await serializeUsers(sellers);
    serialized.sort((a, b) => (STATUS_ORDER[a.cnicStatus] ?? 3) - (STATUS_ORDER[b.cnicStatus] ?? 3));
    res.json({ sellers: serialized });
  })
);

router.get(
  '/kyc/:userId',
  asyncHandler(async (req, res) => {
    const user = await User.findOne({ _id: req.params.userId, role: 'seller' });
    if (!user) return res.status(404).json({ message: 'Seller not found.' });
    const detail = user.toObject({ virtuals: true });
    delete detail.passwordHash;
    delete detail.__v;
    res.json({ seller: detail });
  })
);

router.patch(
  '/kyc/:userId',
  asyncHandler(async (req, res) => {
    const { status, rejectionReason } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(404).json({ message: 'Seller not found or invalid status.' });
    }
    const user = await User.findOne({ _id: req.params.userId, role: 'seller' });
    if (!user) return res.status(404).json({ message: 'Seller not found or invalid status.' });
    user.set({
      cnicStatus: status,
      cnicRejectionReason: status === 'rejected' ? rejectionReason || 'Documents could not be verified.' : null,
      reviewedBy: req.user._id,
      reviewedAt: new Date(),
    });
    await user.save();

    // Approving a seller's ID documents IS what "getting verified" means from their side — flip
    // the store's public "Verified Store" badge (and the denormalized copy on their products,
    // same as PATCH /sellers/:id/verify) in lockstep so approval always shows up immediately,
    // rather than requiring the admin to separately toggle it in the Verified Stores tab.
    // Rejection deliberately leaves an existing verified badge alone — a failed resubmission
    // shouldn't silently unverify a store that was already legitimately verified.
    if (status === 'approved' && user.sellerId) {
      const sellerRecord = await Seller.findByIdAndUpdate(user.sellerId, { verified: true }, { new: true });
      if (sellerRecord) {
        await Product.updateMany({ sellerId: sellerRecord._id }, { sellerVerified: true });
      }
    }

    res.json({ seller: await serializeUser(user) });
  })
);

// ---------- Users ----------

router.get(
  '/users',
  asyncHandler(async (req, res) => {
    const { role, q } = req.query;
    const filter = {};
    if (role && ['buyer', 'seller', 'admin'].includes(role)) filter.role = role;
    if (q && q.trim()) {
      const re = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ companyName: re }, { email: re }, { phone: re }];
    }
    const users = await User.find(filter).sort({ createdAt: -1 });
    res.json({ users: await serializeUsers(users) });
  })
);

router.patch(
  '/users/:id',
  asyncHandler(async (req, res) => {
    const { companyName, email, phone, country } = req.body;
    if (!companyName || !email) {
      return res.status(400).json({ message: 'Company name and email are required.' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const normalizedEmail = String(email).trim().toLowerCase();
    const emailTaken = await User.findOne({ _id: { $ne: user._id }, email: normalizedEmail });
    if (emailTaken) return res.status(409).json({ message: 'Another account already uses this email.' });
    if (phone) {
      const phoneTaken = await User.findOne({ _id: { $ne: user._id }, phone });
      if (phoneTaken) return res.status(409).json({ message: 'Another account already uses this phone number.' });
    }

    user.set({ companyName, email: normalizedEmail, phone, country });
    await user.save();
    res.json({ user: await serializeUser(user) });
  })
);

router.patch(
  '/users/:id/status',
  asyncHandler(async (req, res) => {
    const { status } = req.body;
    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status.' });
    }
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: "You can't suspend your own account." });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    user.status = status;
    await user.save();
    res.json({ user: await serializeUser(user) });
  })
);

router.delete(
  '/users/:id',
  asyncHandler(async (req, res) => {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: "You can't delete your own account." });
    }
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'User not found.' });
    res.json({ ok: true });
  })
);

function serializePayout(doc) {
  const p = doc.toObject();
  return { ...p, id: p._id };
}

router.get(
  '/users/:id/payouts',
  asyncHandler(async (req, res) => {
    const payouts = await Payout.find({ sellerId: req.params.id }).sort({ paidAt: -1 });
    res.json({ payouts: payouts.map(serializePayout) });
  })
);

router.post(
  '/users/:id/payouts',
  asyncHandler(async (req, res) => {
    const { amount, method, reference, note } = req.body;
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: 'Amount must be a positive number.' });
    }
    const seller = await User.findOne({ _id: req.params.id, role: 'seller' });
    if (!seller) return res.status(404).json({ message: 'Seller not found.' });
    const payout = await Payout.create({
      sellerId: seller._id,
      amount,
      method: ['bank_transfer', 'cash', 'other'].includes(method) ? method : 'bank_transfer',
      reference: reference || '',
      note: note || '',
      recordedBy: req.user._id,
    });
    res.status(201).json({ payout: serializePayout(payout) });
  })
);

// ---------- Promotion requests ----------

const PROMO_STATUS_ORDER = { pending: 0, approved: 1, rejected: 2 };

function serializePromotion(doc) {
  const p = doc.toObject();
  const sellerDoc = p.sellerId;
  return {
    ...p,
    id: p._id,
    sellerId: sellerDoc?._id ?? p.sellerId,
    sellerName: sellerDoc?.companyName ?? null,
  };
}

router.get(
  '/promotions',
  asyncHandler(async (req, res) => {
    const { status } = req.query;
    const filter = status && ['pending', 'approved', 'rejected'].includes(status) ? { status } : {};
    const requests = await PromotionRequest.find(filter).populate('sellerId', 'companyName').sort({ createdAt: -1 });
    const serialized = requests.map(serializePromotion);
    serialized.sort((a, b) => (PROMO_STATUS_ORDER[a.status] ?? 3) - (PROMO_STATUS_ORDER[b.status] ?? 3));
    res.json({ requests: serialized });
  })
);

router.patch(
  '/promotions/:id',
  asyncHandler(async (req, res) => {
    const { status, rejectionReason } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status.' });
    }
    const request = await PromotionRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Promotion request not found.' });

    request.status = status;
    request.rejectionReason = status === 'rejected' ? rejectionReason || null : null;
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    await request.save();

    if (status === 'approved') {
      await Product.findByIdAndUpdate(request.productId, {
        spotlight: true,
        spotlightType: request.spotlightType,
      });
    }

    await request.populate('sellerId', 'companyName');
    res.json({ request: serializePromotion(request) });
  })
);

export default router;
