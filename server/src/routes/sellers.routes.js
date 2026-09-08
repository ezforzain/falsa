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
    // { storeOrder: 1, createdAt: 1 }: a seller who's never reordered their storefront has every
    // product's storeOrder null (tied), so createdAt is what actually orders them — plain
    // chronological, same as before this field existed. Once they reorder, every one of their
    // products gets a concrete 0..N-1 value in one pass (see PATCH /api/seller/products/:id), so
    // storeOrder alone decides the order from then on.
    const products = await Product.find({ sellerId: sellerRecord._id })
      .sort({ storeOrder: 1, createdAt: 1 })
      .populate('sellerId', 'verified');
    const following = Boolean(await Follow.findOne({ guestId: req.guestId, sellerId: sellerRecord._id }));

    const serializedProducts = products.map((p) => {
      const obj = p.toObject();
      return { ...obj, id: obj._id, verified: p.sellerId?.verified || false, sellerId: p.sellerId?._id };
    });

    // Seller-defined sections (see Seller.sections), resolved into actual product summaries in
    // the seller's own chosen order — dropped entirely if empty or every referenced product is
    // gone/inactive, rather than showing an empty section on the storefront.
    const productById = new Map(serializedProducts.map((p) => [p.id, p]));
    const sections = (sellerRecord.sections || [])
      .map((s) => ({
        id: s._id,
        name: s.name,
        products: s.productIds.map((pid) => productById.get(pid)).filter(Boolean),
      }))
      .filter((s) => s.products.length > 0);

    res.json({
      seller: sellerRecord,
      products: serializedProducts,
      sections,
      promoBanners: (sellerRecord.promoBanners || []).map((b) => ({ id: b._id, url: b.url })),
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
