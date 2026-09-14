import { Router } from 'express';
import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';
import { SellerOrder } from '../models/SellerOrder.js';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { parsePrice } from '../utils/price.js';
import { ensureGuestId } from '../middleware/guest.js';
import { requireAuth } from '../middleware/auth.js';
import { notifySellerNewOrder } from '../services/smsService.js';

const router = Router();

const ADDRESS_FIELDS = ['fullName', 'phone', 'city', 'address'];

// Resolves a cart line's product to the one real seller account it should be attributed to.
// `ownerUserId` (set at listing-sync time — see publicCatalogSync.js) is the unambiguous path;
// it's preferred whenever present. Older/seeded catalog rows don't have it, so this falls back
// to reverse-matching Product.sellerId (a shared Seller *directory* id) against User.sellerId —
// but only when that resolves to exactly one account. Two seller accounts can legitimately share
// one Seller directory record (same companyName — see auth.routes.js findOrCreateSellerByName),
// so an ambiguous match is treated the same as no match: this order line cannot be safely
// attributed to a seller and must not be silently guessed.
//
// `cache` is keyed by which resolution path was actually taken (`u:<ownerUserId>` vs.
// `s:<sellerId>`), not by the product's shared Seller-directory id alone — two products can
// share that directory id while one carries its own ownerUserId and the other doesn't (or while
// belonging to two different real accounts), and keying on the directory id alone made the
// second product silently reuse the first product's resolution instead of running its own.
async function resolveProductOwner(product, cache) {
  if (product.ownerUserId) {
    const key = `u:${product.ownerUserId}`;
    if (!cache.has(key)) cache.set(key, await User.findById(product.ownerUserId));
    return cache.get(key);
  }
  const key = `s:${product.sellerId}`;
  if (!cache.has(key)) {
    const candidates = await User.find({ sellerId: product.sellerId });
    cache.set(key, candidates.length === 1 ? candidates[0] : null);
  }
  return cache.get(key);
}

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

    // Pass 1 — resolve every cart line to a real product + a single unambiguous owning seller
    // account, without writing anything yet. Any line that can't be resolved fails the whole
    // checkout with a clear message: a buyer must never be told "order placed" for an order that
    // silently didn't get created for some (or all) of their cart. ownerCache (see
    // resolveProductOwner) dedupes repeat lookups across lines that resolve the same way.
    const ownerCache = new Map();
    const resolvedLines = [];
    const unavailable = [];

    for (const item of cart.items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        unavailable.push('An item in your cart is no longer available.');
        continue;
      }

      const owner = await resolveProductOwner(product, ownerCache);

      if (!owner) {
        console.error(`Checkout: could not resolve a single seller account for product ${product._id} (sellerId ${product.sellerId}).`);
        unavailable.push(`"${product.name}" is temporarily unavailable for order — please remove it from your cart.`);
        continue;
      }

      resolvedLines.push({ item, product, owner });
    }

    if (unavailable.length > 0) {
      return res.status(400).json({ message: unavailable.join(' ') });
    }

    // Pass 2 — everything resolved cleanly, now actually create the orders. One order id ties
    // every SellerOrder line item from this checkout together (a cart spanning multiple sellers
    // fans out into one SellerOrder per seller) — this is the id the buyer, each seller, and
    // admin all see for "the same order". If a write fails partway through, roll back whatever
    // this checkout already created rather than leaving a half-placed order on file.
    const orderRef = `FT-${Date.now().toString(36).toUpperCase()}`;
    const created = [];
    let subtotal = 0;
    let itemCount = 0;

    try {
      for (const { item, product, owner } of resolvedLines) {
        const unitPrice = parsePrice(product.price);
        subtotal += unitPrice * item.qty;
        itemCount += item.qty;

        const order = await SellerOrder.create({
          sellerId: owner._id,
          orderRef,
          buyerId: req.user._id,
          buyerCompany: savedAddress.fullName,
          buyerCountry: req.user.country || 'Pakistan',
          productId: product._id,
          productName: product.name,
          productImg: product.img || null,
          qty: item.qty,
          unitPrice,
          shippingAddress: savedAddress,
        });
        created.push(order);
      }
    } catch (err) {
      console.error(`Checkout: order creation failed for ${orderRef}, rolling back ${created.length} line item(s):`, err.message);
      await SellerOrder.deleteMany({ _id: { $in: created.map((o) => o._id) } });
      return res.status(500).json({ message: "Couldn't save your order — please try again." });
    }

    console.log(`Checkout: order ${orderRef} saved — ${created.length} line item(s) across ${ownerCache.size} seller(s), buyer ${req.user._id}.`);

    // Auto-save — submitting an address at checkout (first time or via Edit) is what persists
    // it to the account, no separate save step.
    req.user.savedAddress = savedAddress;
    await req.user.save();

    cart.items = [];
    await cart.save();

    // SMS goes out only now that every order this checkout created is actually saved — one text
    // per seller (not per line item) so a seller with several items in this order isn't texted
    // repeatedly, and sellerNotifiedAt marks each covered order so a retry can't double-send.
    const ordersBySeller = new Map();
    for (const order of created) {
      const key = order.sellerId.toString();
      if (!ordersBySeller.has(key)) ordersBySeller.set(key, []);
      ordersBySeller.get(key).push(order);
    }
    for (const [sellerId, sellerOrders] of ordersBySeller) {
      const owner = [...ownerCache.values()].find((o) => o && o._id.toString() === sellerId);
      if (!owner) continue;
      const result = await notifySellerNewOrder(owner, { orderRef, productName: sellerOrders[0].productName });
      if (result.ok) {
        await SellerOrder.updateMany({ _id: { $in: sellerOrders.map((o) => o._id) } }, { sellerNotifiedAt: new Date() });
      }
    }

    res.json({ orderId: orderRef, subtotal, itemCount, placedAt: Date.now(), address: savedAddress });
  })
);

export default router;
