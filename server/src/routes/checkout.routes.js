import { Router } from 'express';
import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { parsePrice } from '../utils/price.js';
import { ensureGuestId } from '../middleware/guest.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const ADDRESS_FIELDS = ['fullName', 'phone', 'city', 'address'];

// No real payment gateway here — "checkout" reads the current cart, snapshots a total and
// order id, then clears it. That's the whole order lifecycle this endpoint models; there's no
// persisted buyer order history yet (mirrors the mock exactly). Placing an order does require
// sign-in (see requireAuth below) so the delivery address has somewhere to auto-save to — the
// cart itself stays guest-id-scoped, unchanged, so signing in doesn't move or merge it.
router.post(
  '/',
  requireAuth,
  ensureGuestId,
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    const missing = ADDRESS_FIELDS.find((key) => !String(body[key] || '').trim());
    if (missing) {
      return res.status(400).json({ message: 'Please fill in your full name, phone, city, and address.' });
    }
    const label = body.label === 'Office' ? 'Office' : 'Home';
    const savedAddress = {
      fullName: String(body.fullName).trim(),
      phone: String(body.phone).trim(),
      city: String(body.city).trim(),
      address: String(body.address).trim(),
      label,
    };

    const cart = await Cart.findOne({ guestId: req.guestId });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Your cart is empty.' });
    }

    let subtotal = 0;
    let itemCount = 0;
    for (const item of cart.items) {
      const product = await Product.findById(item.productId);
      if (!product) continue;
      subtotal += parsePrice(product.price) * item.qty;
      itemCount += item.qty;
    }

    // Auto-save — submitting an address at checkout (first time or via Edit) is what persists
    // it to the account, no separate save step.
    req.user.savedAddress = savedAddress;
    await req.user.save();

    const orderId = `FT-${Date.now().toString(36).toUpperCase()}`;
    cart.items = [];
    await cart.save();
    res.json({ orderId, subtotal, itemCount, placedAt: Date.now(), address: savedAddress });
  })
);

export default router;
