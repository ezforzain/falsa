import { Router } from 'express';
import { SellerProduct } from '../models/SellerProduct.js';
import { SellerOrder, ORDER_STATUSES } from '../models/SellerOrder.js';
import { Seller } from '../models/Seller.js';
import { PromotionRequest } from '../models/PromotionRequest.js';
import { Payout } from '../models/Payout.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { syncSellerProductToCatalog, removeSellerProductFromCatalog } from '../utils/publicCatalogSync.js';

const router = Router();
router.use(requireAuth, requireRole('seller'));

const DEFAULT_PRODUCT_IMG = 'https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=700&q=80';

function generateSku(category) {
  const prefix = (category || 'GEN').replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'GEN';
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${suffix}`;
}

function serializeProduct(doc) {
  const p = doc.toObject();
  return { ...p, id: p._id };
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
    res.json({ products: products.map(serializeProduct) });
  })
);

router.get(
  '/products/:id',
  asyncHandler(async (req, res) => {
    const product = await SellerProduct.findOne({ _id: req.params.id, sellerId: req.user._id });
    if (!product) return res.status(404).json({ message: 'Listing not found.' });
    res.json({ product: serializeProduct(product) });
  })
);

router.post(
  '/products',
  asyncHandler(async (req, res) => {
    const { name, category, price, unit, moq, stock, status, images, description, sku } = req.body;
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

    const product = await SellerProduct.findOne({ _id: req.params.id, sellerId: req.user._id });
    if (!product) return res.status(404).json({ message: 'Listing not found.' });

    const patch = { ...body };
    if (Array.isArray(patch.images)) {
      patch.images = patch.images.length > 0 ? patch.images : product.images;
      patch.img = patch.images[0];
    }
    product.set(patch);
    await product.save();
    await syncSellerProductToCatalog(product, req.user);
    res.json({ product: serializeProduct(product) });
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
    const { productId, spotlightType, note } = req.body;
    if (!productId || !['featured', 'sponsored'].includes(spotlightType)) {
      return res.status(400).json({ message: 'A product and promotion type are required.' });
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
