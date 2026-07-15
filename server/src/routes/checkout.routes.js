import { Router } from 'express';
import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { parsePrice } from '../utils/price.js';
import { ensureGuestId } from '../middleware/guest.js';

const router = Router();

// No real payment gateway here — "checkout" reads the current cart, snapshots a total and
// order id, then clears it. That's the whole order lifecycle this endpoint models; there's no
// persisted buyer order history yet (mirrors the mock exactly).
router.post(
  '/',
  ensureGuestId,
  asyncHandler(async (req, res) => {
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

    const orderId = `FT-${Date.now().toString(36).toUpperCase()}`;
    cart.items = [];
    await cart.save();
    res.json({ orderId, subtotal, itemCount, placedAt: Date.now() });
  })
);

export default router;
