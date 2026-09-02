import { Router } from 'express';
import { SellerOrder } from '../models/SellerOrder.js';
import * as tcsService from '../services/tcsService.js';
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

// Live delivery status for the "Track Shipment" button on the buyer's order — scoped to orders
// this buyer actually placed (buyerId match below), and only meaningful once the seller has
// shipped it with TCS ("falsafah" — see PATCH /api/seller/orders/:id/ship).
router.get(
  '/:id/tracking',
  asyncHandler(async (req, res) => {
    const order = await SellerOrder.findOne({ _id: req.params.id, buyerId: req.user._id });
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    if (order.shippingMethod !== 'falsafah' || !order.trackingId) {
      return res.status(400).json({ message: 'This order has not shipped with a trackable courier yet.' });
    }
    try {
      const tracking = await tcsService.trackShipment(order.trackingId);
      const latestStatus = tracking?.deliveryinfo?.[0]?.status || tracking?.shipmentsummary || null;
      if (latestStatus) {
        order.tcsDeliveryStatus = latestStatus;
        order.tcsDeliveryStatusAt = new Date();
        await order.save();
      }
      res.json({ tracking });
    } catch (err) {
      const status = Number.isInteger(err.status) && err.status >= 400 && err.status < 600 ? err.status : 502;
      res.status(status).json({ message: err.message || 'Could not fetch tracking from TCS.' });
    }
  })
);

export default router;
