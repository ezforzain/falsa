import { Router } from 'express';
import { Seller } from '../models/Seller.js';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { serializeUser, serializeUsers } from '../utils/serializeUser.js';

const router = Router();
router.use(requireAuth, requireRole('admin'));

router.patch(
  '/sellers/:id/verify',
  asyncHandler(async (req, res) => {
    const { verified } = req.body;
    const sellerRecord = await Seller.findByIdAndUpdate(req.params.id, { verified: Boolean(verified) }, { new: true });
    if (!sellerRecord) return res.status(404).json({ message: 'Store not found.' });
    res.json({ seller: sellerRecord });
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
    res.json({ seller: await serializeUser(user) });
  })
);

export default router;
