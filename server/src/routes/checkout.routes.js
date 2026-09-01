import { Router } from 'express';
import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';
import { SellerOrder } from '../models/SellerOrder.js';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { parsePrice } from '../utils/price.js';
import { ensureGuestId } from '../middleware/guest.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const ADDRESS_FIELDS = ['fullName', 'phone', 'city', 'address'];

// No real payment gateway here — "checkout" reads the current cart, snapshots a total and order
// id, clears it, and creates one SellerOrder per cart line item (see below) so sellers see real
// buyer orders instead of only admin-seeded test data. Placing an order does require sign-in (see
// requireAuth below) so the delivery address has somewhere to auto-save to — the cart itself
// stays guest-id-scoped, unchanged, so signing in doesn't move or merge it.
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

    // Cache the owning seller User per Seller-directory id — several cart lines can belong to
    // the same store, and this avoids a repeat lookup per line.
    const ownerBySellerId = new Map();

    let subtotal = 0;
    let itemCount = 0;
    for (const item of cart.items) {
      const product = await Product.findById(item.productId);
      if (!product) continue;
      subtotal += parsePrice(product.price) * item.qty;
      itemCount += item.qty;

      const sellerKey = product.sellerId?.toString();
      if (!sellerKey) continue;
      if (!ownerBySellerId.has(sellerKey)) {
        ownerBySellerId.set(sellerKey, await User.findOne({ sellerId: product.sellerId }));
      }
      const owner = ownerBySellerId.get(sellerKey);

      // No linked seller account (should be unreachable — every published listing has one, see
      // publicCatalogSync.js) — skip rather than create an order nobody can ever see or ship.
      if (!owner) continue;

      await SellerOrder.create({
        sellerId: owner._id,
        buyerId: req.user._id,
        buyerCompany: savedAddress.fullName,
        buyerCountry: req.user.country || 'Pakistan',
        productId: product._id,
        productName: product.name,
        productImg: product.img || null,
        qty: item.qty,
        unitPrice: parsePrice(product.price),
        shippingAddress: savedAddress,
      });
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
