import { Router } from 'express';
import { SellerOrder } from '../models/SellerOrder.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

function serializeOrder(doc) {
  const o = doc.toObject();
  return { ...o, id: o._id, total: o.qty * o.unitPrice };
}

// Buyer-facing "My Orders" — orders this account placed via checkout (see checkout.routes.js),
// across every seller. Read-only: shipping/tracking is only ever set by the seller's Ship Now flow.
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const orders = await SellerOrder.find({ buyerId: req.user._id }).sort({ placedAt: -1 });
    res.json({ orders: orders.map(serializeOrder) });
  })
);

export default router;
