import { Router } from 'express';
import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { parsePrice } from '../utils/price.js';
import { ensureGuestId } from '../middleware/guest.js';

const router = Router();
router.use(ensureGuestId);

async function getOrCreateCart(guestId) {
  let cart = await Cart.findOne({ guestId });
  if (!cart) cart = await Cart.create({ guestId, items: [] });
  return cart;
}

async function hydrate(cart) {
  const items = [];
  for (const item of cart.items) {
    const product = await Product.findById(item.productId).populate('sellerId', 'verified');
    if (!product) continue;
    const p = product.toObject();
    items.push({
      qty: item.qty,
      product: { ...p, id: p._id, verified: product.sellerId?.verified || false, sellerId: product.sellerId?._id },
    });
  }
  return items;
}

function cartResponse(items) {
  const subtotal = items.reduce((sum, i) => sum + parsePrice(i.product.price) * i.qty, 0);
  const count = items.reduce((sum, i) => sum + i.qty, 0);
  return { items, subtotal, count };
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const cart = await getOrCreateCart(req.guestId);
    res.json(cartResponse(await hydrate(cart)));
  })
);

router.post(
  '/items',
  asyncHandler(async (req, res) => {
    const { productId, qty } = req.body;
    const product = await Product.findById(productId);
    if (!productId || !product) return res.status(404).json({ message: 'Unknown product.' });
    if (!Number.isInteger(qty) || qty < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1.' });
    }

    const cart = await getOrCreateCart(req.guestId);
    const existing = cart.items.find((i) => i.productId === productId);
    const currentQty = existing ? existing.qty : 0;
    const requestedTotal = currentQty + qty;

    if (typeof product.stock === 'number' && requestedTotal > product.stock) {
      const available = Math.max(product.stock - currentQty, 0);
      return res.status(409).json({
        message:
          available > 0
            ? `Only ${available} more unit${available === 1 ? '' : 's'} available for this product.`
            : 'This product is out of stock.',
        available,
      });
    }

    if (existing) existing.qty = requestedTotal;
    else cart.items.push({ productId, qty });
    await cart.save();
    res.json(cartResponse(await hydrate(cart)));
  })
);

router.patch(
  '/items/:productId',
  asyncHandler(async (req, res) => {
    const { qty } = req.body;
    const cart = await getOrCreateCart(req.guestId);

    if (qty <= 0) {
      cart.items = cart.items.filter((i) => i.productId !== req.params.productId);
      await cart.save();
      return res.json(cartResponse(await hydrate(cart)));
    }

    const product = await Product.findById(req.params.productId);
    if (typeof product?.stock === 'number' && qty > product.stock) {
      return res.status(409).json({
        message: `Only ${product.stock} unit${product.stock === 1 ? '' : 's'} available for this product.`,
        available: product.stock,
      });
    }

    const existing = cart.items.find((i) => i.productId === req.params.productId);
    if (existing) existing.qty = qty;
    await cart.save();
    res.json(cartResponse(await hydrate(cart)));
  })
);

router.delete(
  '/items/:productId',
  asyncHandler(async (req, res) => {
    const cart = await getOrCreateCart(req.guestId);
    cart.items = cart.items.filter((i) => i.productId !== req.params.productId);
    await cart.save();
    res.json(cartResponse(await hydrate(cart)));
  })
);

router.delete(
  '/',
  asyncHandler(async (req, res) => {
    const cart = await getOrCreateCart(req.guestId);
    cart.items = [];
    await cart.save();
    res.json(cartResponse([]));
  })
);

export default router;
