import { Router } from 'express';
import { nanoid } from 'nanoid';
import { SellerProduct } from '../models/SellerProduct.js';
import { Product } from '../models/Product.js';
import { SellerOrder, ORDER_STATUSES } from '../models/SellerOrder.js';
import { Seller } from '../models/Seller.js';
import { PromotionRequest } from '../models/PromotionRequest.js';
import { Payout } from '../models/Payout.js';
import { Conversation } from '../models/Conversation.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { syncSellerProductToCatalog, removeSellerProductFromCatalog } from '../utils/publicCatalogSync.js';
import { normalizeHashtagList } from '../utils/hashtags.js';

const BANK_FIELDS = ['bankName', 'accountTitle', 'accountNumber', 'iban'];

const router = Router();
router.use(requireAuth, requireRole('seller'));

const DEFAULT_PRODUCT_IMG = 'https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=700&q=80';

function generateSku(category) {
  const prefix = (category || 'GEN').replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'GEN';
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${suffix}`;
}

// `views` isn't a SellerProduct field — it only exists on the public catalog Product doc that
// this listing syncs to (see publicCatalogSync.js, which shares the same _id), and only once the
// listing is active and has actually synced. `views` defaults to 0 for anything not yet published
// (drafts) so the seller portal never shows "undefined" views.
function serializeProduct(doc, views = 0) {
  const p = doc.toObject();
  return { ...p, id: p._id, views };
}

function serializeOrder(doc) {
  const o = doc.toObject();
  return { ...o, id: o._id, total: o.qty * o.unitPrice };
}

router.get(
  '/stats',
  asyncHandler(async (req, res) => {
    const products = await SellerProduct.find({ sellerId: req.user._id });
    const orders = await SellerOrder.find({ sellerId: req.user._id });
    const activeListings = products.filter((p) => p.status === 'active').length;
    const pendingOrders = orders.filter((o) => o.status === 'Pending' || o.status === 'Processing').length;
    const totalRevenue = orders
      .filter((o) => o.status !== 'Cancelled')
      .reduce((sum, o) => sum + o.qty * o.unitPrice, 0);
    res.json({
      stats: {
        totalRevenue,
        totalOrders: orders.length,
        activeListings,
        totalListings: products.length,
        pendingOrders,
      },
    });
  })
);

router.get(
  '/products',
  asyncHandler(async (req, res) => {
    const products = await SellerProduct.find({ sellerId: req.user._id }).sort({ createdAt: -1 });
    // Product's `_id` is a plain string (see the model comment), not an ObjectId, so the ids must
    // be stringified before querying it — an ObjectId $in wouldn't match.
    const catalogViews = await Product.find({ _id: { $in: products.map((p) => p._id.toString()) } }, 'views').lean();
    const viewsById = new Map(catalogViews.map((p) => [p._id, p.views || 0]));
    res.json({ products: products.map((p) => serializeProduct(p, viewsById.get(p._id.toString()) || 0)) });
  })
);

router.get(
  '/products/:id',
  asyncHandler(async (req, res) => {
    const product = await SellerProduct.findOne({ _id: req.params.id, sellerId: req.user._id });
    if (!product) return res.status(404).json({ message: 'Listing not found.' });
    const catalogProduct = await Product.findById(product._id.toString(), 'views').lean();
    res.json({ product: serializeProduct(product, catalogProduct?.views || 0) });
  })
);

router.post(
  '/products',
  asyncHandler(async (req, res) => {
    const {
      name,
      category,
      price,
      unit,
      moq,
      stock,
      status,
      images,
      description,
      sku,
      b2bEnabled,
      freeShipping,
      worldwideFreeShipping,
      tags,
      specifications,
      variantAxes,
      variants,
      shipping,
    } = req.body;
    if (!name || !category || !price || !unit || !moq) {
      return res.status(400).json({ message: 'Please fill in all required fields.' });
    }
    if (!Number.isFinite(price) || price <= 0) {
      return res.status(400).json({ message: 'Price must be a positive number.' });
    }
    if (!Number.isInteger(stock) || stock < 0) {
      return res.status(400).json({ message: 'Stock must be zero or a positive whole number.' });
    }
    if (images !== undefined && (!Array.isArray(images) || images.some((url) => typeof url !== 'string'))) {
      return res.status(400).json({ message: 'Images must be a list of URLs.' });
    }
    if (tags !== undefined && (!Array.isArray(tags) || tags.some((t) => typeof t !== 'string'))) {
      return res.status(400).json({ message: 'Tags must be a list of strings.' });
    }
    if (specifications !== undefined && !Array.isArray(specifications)) {
      return res.status(400).json({ message: 'Specifications must be a list.' });
    }
    if (variantAxes !== undefined && !Array.isArray(variantAxes)) {
      return res.status(400).json({ message: 'Variant axes must be a list.' });
    }
    if (variants !== undefined && !Array.isArray(variants)) {
      return res.status(400).json({ message: 'Variants must be a list.' });
    }
    if (shipping !== undefined && (typeof shipping !== 'object' || shipping === null || Array.isArray(shipping))) {
      return res.status(400).json({ message: 'Shipping info must be an object.' });
    }
    const gallery = Array.isArray(images) && images.length > 0 ? images : [req.body.img || DEFAULT_PRODUCT_IMG];
    const product = await SellerProduct.create({
      sellerId: req.user._id,
      name,
      category,
      description: description || '',
      sku: sku?.trim() || generateSku(category),
      price,
      unit,
      moq,
      stock,
      status: status || 'active',
      images: gallery,
      img: gallery[0],
      b2bEnabled: Boolean(b2bEnabled),
      freeShipping: freeShipping !== false,
      worldwideFreeShipping: Boolean(worldwideFreeShipping),
      // Normalized + de-duped server-side too (the chip input already does this
      // client-side) so the backend never trusts unnormalized/duplicate hashtags.
      tags: normalizeHashtagList(tags),
      specifications: Array.isArray(specifications) ? specifications : [],
      variantAxes: Array.isArray(variantAxes) ? variantAxes : [],
      variants: Array.isArray(variants) ? variants : [],
      shipping: shipping || {},
    });
    await syncSellerProductToCatalog(product, req.user);
    res.status(201).json({ product: serializeProduct(product) });
  })
);

router.patch(
  '/products/:id',
  asyncHandler(async (req, res) => {
    const body = req.body;
    if (body.price !== undefined && (!Number.isFinite(body.price) || body.price <= 0)) {
      return res.status(400).json({ message: 'Price must be a positive number.' });
    }
    if (body.stock !== undefined && (!Number.isInteger(body.stock) || body.stock < 0)) {
      return res.status(400).json({ message: 'Stock must be zero or a positive whole number.' });
    }
    if (body.images !== undefined && (!Array.isArray(body.images) || body.images.some((url) => typeof url !== 'string'))) {
      return res.status(400).json({ message: 'Images must be a list of URLs.' });
    }
    if (body.tags !== undefined && (!Array.isArray(body.tags) || body.tags.some((t) => typeof t !== 'string'))) {
      return res.status(400).json({ message: 'Tags must be a list of strings.' });
    }
    if (body.specifications !== undefined && !Array.isArray(body.specifications)) {
      return res.status(400).json({ message: 'Specifications must be a list.' });
    }
    if (body.variantAxes !== undefined && !Array.isArray(body.variantAxes)) {
      return res.status(400).json({ message: 'Variant axes must be a list.' });
    }
    if (body.variants !== undefined && !Array.isArray(body.variants)) {
      return res.status(400).json({ message: 'Variants must be a list.' });
    }
    if (body.shipping !== undefined && (typeof body.shipping !== 'object' || body.shipping === null || Array.isArray(body.shipping))) {
      return res.status(400).json({ message: 'Shipping info must be an object.' });
    }

    const product = await SellerProduct.findOne({ _id: req.params.id, sellerId: req.user._id });
    if (!product) return res.status(404).json({ message: 'Listing not found.' });

    const patch = { ...body };
    if (Array.isArray(patch.images)) {
      patch.images = patch.images.length > 0 ? patch.images : product.images;
      patch.img = patch.images[0];
    }
    if (patch.tags !== undefined) patch.tags = normalizeHashtagList(patch.tags);
    product.set(patch);
    await product.save();
    await syncSellerProductToCatalog(product, req.user);
    const catalogProduct = await Product.findById(product._id.toString(), 'views').lean();
    res.json({ product: serializeProduct(product, catalogProduct?.views || 0) });
  })
);

router.delete(
  '/products/:id',
  asyncHandler(async (req, res) => {
    const deleted = await SellerProduct.findOneAndDelete({ _id: req.params.id, sellerId: req.user._id });
    if (!deleted) return res.status(404).json({ message: 'Listing not found.' });
    await removeSellerProductFromCatalog(deleted._id);
    res.json({ ok: true });
  })
);

router.get(
  '/orders',
  asyncHandler(async (req, res) => {
    const orders = await SellerOrder.find({ sellerId: req.user._id }).sort({ placedAt: -1 });
    res.json({ orders: orders.map(serializeOrder) });
  })
);

router.patch(
  '/orders/:id',
  asyncHandler(async (req, res) => {
    const { status } = req.body;
    if (!ORDER_STATUSES.includes(status)) {
      return res.status(404).json({ message: 'Order not found or invalid status.' });
    }
    const order = await SellerOrder.findOne({ _id: req.params.id, sellerId: req.user._id });
    if (!order) return res.status(404).json({ message: 'Order not found or invalid status.' });
    order.status = status;
    await order.save();
    res.json({ order: serializeOrder(order) });
  })
);

// Ship Now — "falsafah" auto-generates a tracking id under the platform's own in-house courier
// (gated on the seller having bank details on file, since that's how they'd get paid out for a
// platform-handled shipment); "self" takes whatever courier name/tracking id the seller enters.
// Either way this can only ever be called once per order — see the 409 below — so the shipping
// info (and the label built from it) is effectively immutable once set.
router.patch(
  '/orders/:id/ship',
  asyncHandler(async (req, res) => {
    const order = await SellerOrder.findOne({ _id: req.params.id, sellerId: req.user._id });
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    if (order.shippingMethod) {
      return res.status(409).json({ message: 'This order has already been shipped.' });
    }

    const { method } = req.body;
    if (method === 'falsafah') {
      const missingBankField = BANK_FIELDS.find((key) => !req.user[key]);
      if (missingBankField) {
        return res.status(400).json({ message: 'Please add your bank details before shipping with Falsafah.' });
      }
      order.courierName = 'Falsafah Express';
      order.trackingId = `FE-${nanoid(10).toUpperCase()}`;
    } else if (method === 'self') {
      const courierName = String(req.body.courierName || '').trim();
      const trackingId = String(req.body.trackingId || '').trim();
      if (!courierName || !trackingId) {
        return res.status(400).json({ message: 'Please enter both the courier name and tracking id.' });
      }
      order.courierName = courierName;
      order.trackingId = trackingId;
    } else {
      return res.status(400).json({ message: 'Invalid shipping method.' });
    }

    order.shippingMethod = method;
    order.status = 'Shipped';
    order.shippedAt = new Date();
    await order.save();
    res.json({ order: serializeOrder(order) });
  })
);

// Second step for the Falsafah label: the client renders + uploads the PNG (needs the tracking
// id from the /ship response above first), then hands back the resulting URL here. Locked once
// set, same as /ship, so a generated label can't be swapped out afterwards.
router.patch(
  '/orders/:id/label',
  asyncHandler(async (req, res) => {
    const order = await SellerOrder.findOne({ _id: req.params.id, sellerId: req.user._id });
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    if (order.shippingMethod !== 'falsafah') {
      return res.status(400).json({ message: 'This order was not shipped with Falsafah.' });
    }
    if (order.labelUrl) {
      return res.status(409).json({ message: 'A label has already been generated for this order.' });
    }
    const labelUrl = String(req.body.labelUrl || '').trim();
    if (!labelUrl) return res.status(400).json({ message: 'Missing label URL.' });
    order.labelUrl = labelUrl;
    await order.save();
    res.json({ order: serializeOrder(order) });
  })
);

router.patch(
  '/bank-details',
  asyncHandler(async (req, res) => {
    const { bankName, accountTitle, accountNumber, iban } = req.body;
    for (const [key, value] of Object.entries({ bankName, accountTitle, accountNumber, iban })) {
      if (value !== undefined) req.user[key] = String(value).trim() || null;
    }
    await req.user.save();
    res.json({ user: req.user.toPublicJSON() });
  })
);

// ---------- Customers ----------

router.get(
  '/customers',
  asyncHandler(async (req, res) => {
    const orders = await SellerOrder.find({ sellerId: req.user._id }).sort({ placedAt: -1 });
    const byCompany = new Map();
    orders.forEach((o) => {
      const existing = byCompany.get(o.buyerCompany) || {
        buyerCompany: o.buyerCompany,
        buyerCountry: o.buyerCountry,
        totalOrders: 0,
        totalSpent: 0,
        lastOrderAt: o.placedAt,
      };
      existing.totalOrders += 1;
      if (o.status !== 'Cancelled') existing.totalSpent += o.qty * o.unitPrice;
      if (new Date(o.placedAt) > new Date(existing.lastOrderAt)) existing.lastOrderAt = o.placedAt;
      byCompany.set(o.buyerCompany, existing);
    });
    const customers = Array.from(byCompany.values()).sort((a, b) => new Date(b.lastOrderAt) - new Date(a.lastOrderAt));
    res.json({ customers });
  })
);

// ---------- Messages ----------
// Seller side of the buyer<->seller messenger — same Conversation documents as messages.routes.js
// (the buyer side), keyed by req.user.sellerId (the public Seller/store id, not this account's
// own User id — see the Conversation model).

function serializeSellerConversation(conv) {
  return {
    id: conv._id,
    buyerCompany: conv.buyerName || 'Guest buyer',
    unread: conv.sellerUnread || 0,
    messages: conv.messages,
  };
}

router.get(
  '/messages',
  asyncHandler(async (req, res) => {
    if (!req.user.sellerId) return res.json({ conversations: [] });
    const conversations = await Conversation.find({ sellerId: req.user.sellerId }).sort({ updatedAt: -1 });
    res.json({ conversations: conversations.map(serializeSellerConversation) });
  })
);

router.post(
  '/messages/:id',
  asyncHandler(async (req, res) => {
    if (!req.user.sellerId) return res.status(404).json({ message: 'No storefront found for this account.' });
    const text = (req.body?.text || '').trim();
    if (!text) return res.status(400).json({ message: 'Message text is required.' });

    const conv = await Conversation.findOne({ _id: req.params.id, sellerId: req.user.sellerId });
    if (!conv) return res.status(404).json({ message: 'Conversation not found.' });

    conv.messages.push({ from: 'seller', text, at: new Date() });
    conv.buyerUnread = (conv.buyerUnread || 0) + 1;
    await conv.save();
    res.json({ conversation: serializeSellerConversation(conv) });
  })
);

router.patch(
  '/messages/:id/read',
  asyncHandler(async (req, res) => {
    if (!req.user.sellerId) return res.status(404).json({ message: 'No storefront found for this account.' });
    const conv = await Conversation.findOne({ _id: req.params.id, sellerId: req.user.sellerId });
    if (!conv) return res.status(404).json({ message: 'Conversation not found.' });
    if (conv.sellerUnread) {
      conv.sellerUnread = 0;
      await conv.save();
    }
    res.json({ conversation: serializeSellerConversation(conv) });
  })
);

// ---------- Store profile ----------

function serializeStore(doc) {
  const s = doc.toObject();
  return { ...s, id: s._id };
}

router.get(
  '/store',
  asyncHandler(async (req, res) => {
    if (!req.user.sellerId) return res.status(404).json({ message: 'No storefront found for this account.' });
    const store = await Seller.findById(req.user.sellerId);
    if (!store) return res.status(404).json({ message: 'No storefront found for this account.' });
    res.json({ store: serializeStore(store) });
  })
);

router.patch(
  '/store',
  asyncHandler(async (req, res) => {
    if (!req.user.sellerId) return res.status(404).json({ message: 'No storefront found for this account.' });
    const { description, bannerUrl, hours } = req.body;
    const store = await Seller.findByIdAndUpdate(
      req.user.sellerId,
      { description: description ?? '', bannerUrl: bannerUrl || null, hours: hours || null },
      { new: true }
    );
    if (!store) return res.status(404).json({ message: 'No storefront found for this account.' });
    res.json({ store: serializeStore(store) });
  })
);

// ---------- Analytics ----------

router.get(
  '/analytics',
  asyncHandler(async (req, res) => {
    const orders = await SellerOrder.find({ sellerId: req.user._id });

    const DAYS = 30;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const byDay = new Map();
    const dayKeys = [];
    for (let i = DAYS - 1; i >= 0; i -= 1) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dayKeys.push(key);
      byDay.set(key, { date: key, revenue: 0, orders: 0 });
    }
    const cutoff = new Date(today);
    cutoff.setDate(cutoff.getDate() - (DAYS - 1));

    const productTotals = new Map();
    orders.forEach((o) => {
      if (o.status === 'Cancelled') return;
      const revenue = o.qty * o.unitPrice;

      const placed = new Date(o.placedAt);
      if (placed >= cutoff) {
        const key = placed.toISOString().slice(0, 10);
        const bucket = byDay.get(key);
        if (bucket) {
          bucket.revenue += revenue;
          bucket.orders += 1;
        }
      }

      const existing = productTotals.get(o.productName) || { name: o.productName, revenue: 0, qty: 0 };
      existing.revenue += revenue;
      existing.qty += o.qty;
      productTotals.set(o.productName, existing);
    });

    const daily = dayKeys.map((key) => byDay.get(key));
    const topProducts = Array.from(productTotals.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    res.json({ daily, topProducts });
  })
);

// ---------- Promotion requests ----------

function serializePromotionRequest(doc) {
  const p = doc.toObject();
  return { ...p, id: p._id };
}

router.post(
  '/promotions',
  asyncHandler(async (req, res) => {
    const { productId, spotlightType, note, budgetPkr } = req.body;
    if (!productId || !['featured', 'sponsored'].includes(spotlightType)) {
      return res.status(400).json({ message: 'A product and promotion type are required.' });
    }
    if (budgetPkr !== undefined && budgetPkr !== null && (!Number.isFinite(budgetPkr) || budgetPkr <= 0)) {
      return res.status(400).json({ message: 'Budget must be a positive number.' });
    }
    const product = await SellerProduct.findOne({ _id: productId, sellerId: req.user._id, status: 'active' });
    if (!product) return res.status(404).json({ message: 'Listing not found or not active.' });

    const existingPending = await PromotionRequest.findOne({ productId, status: 'pending' });
    if (existingPending) {
      return res.status(409).json({ message: 'This listing already has a pending promotion request.' });
    }

    const request = await PromotionRequest.create({
      sellerId: req.user._id,
      productId: product._id,
      productName: product.name,
      spotlightType,
      note: note || '',
      budgetPkr: Number.isFinite(budgetPkr) && budgetPkr > 0 ? budgetPkr : null,
    });
    res.status(201).json({ request: serializePromotionRequest(request) });
  })
);

router.get(
  '/promotions',
  asyncHandler(async (req, res) => {
    const requests = await PromotionRequest.find({ sellerId: req.user._id }).sort({ createdAt: -1 });
    res.json({ requests: requests.map(serializePromotionRequest) });
  })
);

// ---------- Payouts ----------

function serializePayout(doc) {
  const p = doc.toObject();
  return { ...p, id: p._id };
}

router.get(
  '/payouts',
  asyncHandler(async (req, res) => {
    const [payouts, deliveredOrders] = await Promise.all([
      Payout.find({ sellerId: req.user._id }).sort({ paidAt: -1 }),
      SellerOrder.find({ sellerId: req.user._id, status: 'Delivered' }),
    ]);
    const totalDelivered = deliveredOrders.reduce((sum, o) => sum + o.qty * o.unitPrice, 0);
    const totalPaid = payouts.reduce((sum, p) => sum + p.amount, 0);
    res.json({ payouts: payouts.map(serializePayout), pendingBalance: totalDelivered - totalPaid });
  })
);

export default router;
