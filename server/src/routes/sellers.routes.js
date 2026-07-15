import { Router } from 'express';
import { Seller } from '../models/Seller.js';
import { Product } from '../models/Product.js';
import { Follow } from '../models/Follow.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ensureGuestId } from '../middleware/guest.js';

const router = Router();
router.use(ensureGuestId);

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const sellers = await Seller.find().sort({ name: 1 });
    res.json({ sellers });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const sellerRecord = await Seller.findById(req.params.id);
    if (!sellerRecord) return res.status(404).json({ message: 'Store not found.' });
    const products = await Product.find({ sellerId: sellerRecord._id }).populate('sellerId', 'verified');
    const following = Boolean(await Follow.findOne({ guestId: req.guestId, sellerId: sellerRecord._id }));
    res.json({
      seller: sellerRecord,
      products: products.map((p) => {
        const obj = p.toObject();
        return { ...obj, id: obj._id, verified: p.sellerId?.verified || false, sellerId: p.sellerId?._id };
      }),
      following,
    });
  })
);

router.get(
  '/:id/follow',
  asyncHandler(async (req, res) => {
    const sellerRecord = await Seller.findById(req.params.id);
    if (!sellerRecord) return res.status(404).json({ message: 'Store not found.' });
    const following = Boolean(await Follow.findOne({ guestId: req.guestId, sellerId: sellerRecord._id }));
    res.json({ following, followerCount: sellerRecord.followerCount || 0 });
  })
);

router.post(
  '/:id/follow',
  asyncHandler(async (req, res) => {
    const sellerRecord = await Seller.findById(req.params.id);
    if (!sellerRecord) return res.status(404).json({ message: 'Store not found.' });
    const existing = await Follow.findOne({ guestId: req.guestId, sellerId: sellerRecord._id });
    if (existing) return res.json({ following: true, followerCount: sellerRecord.followerCount || 0 });
    await Follow.create({ guestId: req.guestId, sellerId: sellerRecord._id });
    sellerRecord.followerCount = (sellerRecord.followerCount || 0) + 1;
    await sellerRecord.save();
    res.json({ following: true, followerCount: sellerRecord.followerCount });
  })
);

router.delete(
  '/:id/follow',
  asyncHandler(async (req, res) => {
    const sellerRecord = await Seller.findById(req.params.id);
    if (!sellerRecord) return res.status(404).json({ message: 'Store not found.' });
    const existing = await Follow.findOneAndDelete({ guestId: req.guestId, sellerId: sellerRecord._id });
    if (!existing) return res.json({ following: false, followerCount: sellerRecord.followerCount || 0 });
    sellerRecord.followerCount = Math.max((sellerRecord.followerCount || 0) - 1, 0);
    await sellerRecord.save();
    res.json({ following: false, followerCount: sellerRecord.followerCount });
  })
);

export default router;
