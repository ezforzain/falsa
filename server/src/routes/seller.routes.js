import { Router } from 'express';
import { SellerProduct } from '../models/SellerProduct.js';
import { SellerOrder, ORDER_STATUSES } from '../models/SellerOrder.js';
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

export default router;
