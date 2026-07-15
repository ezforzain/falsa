import { http, HttpResponse, delay } from 'msw';
import * as db from './db';
import { parsePrice } from '../data/mockData';

const LATENCY_MS = 350;

function bearerToken(request) {
  const header = request.headers.get('authorization') || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

function requireSession(request) {
  const token = bearerToken(request);
  const session = db.getSession(token);
  if (!session) return null;
  const user = db.findUserById(session.userId);
  return user ? { token, user } : null;
}

// Every /api/seller/* route needs both a valid session AND a seller-role account —
// mirrors how a real API would gate a seller-only area server-side, not just hide the UI.
function requireSeller(request) {
  const session = requireSession(request);
  if (!session) return { error: HttpResponse.json({ message: 'Not signed in.' }, { status: 401 }) };
  if (session.user.role !== 'seller') {
    return { error: HttpResponse.json({ message: 'This area is only available to seller accounts.' }, { status: 403 }) };
  }
  return { session };
}

// Every /api/admin/* route needs both a valid session AND an admin-role account. Sellers
// cannot verify themselves — this is enforced here, server-side, not just by hiding the UI.
function requireAdmin(request) {
  const session = requireSession(request);
  if (!session) return { error: HttpResponse.json({ message: 'Not signed in.' }, { status: 401 }) };
  if (session.user.role !== 'admin') {
    return { error: HttpResponse.json({ message: 'This area is only available to admin accounts.' }, { status: 403 }) };
  }
  return { session };
}

function cartResponse(items) {
  const subtotal = items.reduce((sum, i) => sum + parsePrice(i.product.price) * i.qty, 0);
  const count = items.reduce((sum, i) => sum + i.qty, 0);
  return { items, subtotal, count };
}

export const handlers = [
  // ---------- Auth ----------

  http.post('/api/auth/signin', async ({ request }) => {
    await delay(LATENCY_MS);
    const { identifier, password } = await request.json();
    if (!identifier || !password) {
      return HttpResponse.json({ message: 'Email/phone and password are required.' }, { status: 400 });
    }
    const user = db.findUserByIdentifier(identifier);
    if (!user || user.password !== password) {
      return HttpResponse.json({ message: 'Invalid email/phone or password.' }, { status: 401 });
    }
    const pendingToken = db.createPending(user.id, 'signin');
    return HttpResponse.json({ pendingToken });
  }),

  http.post('/api/auth/signup', async ({ request }) => {
    await delay(LATENCY_MS);
    const body = await request.json();
    const {
      role,
      companyName,
      country,
      phone,
      email,
      password,
      category,
      address,
      sellerType,
      cnicNumber,
      cnicFront,
      cnicBack,
      location,
      businessAddress,
      businessDocument,
      legalCompanyName,
      registrationNumber,
      ntn,
      companyEmail,
      companyPhone,
      bankName,
      accountTitle,
      accountNumber,
      iban,
    } = body;
    if (!role || !companyName || !email || !password) {
      return HttpResponse.json({ message: 'Missing required fields.' }, { status: 400 });
    }
    if (db.findUserByIdentifier(email)) {
      return HttpResponse.json({ message: 'An account with this email already exists.' }, { status: 409 });
    }
    if (phone && db.findUserByIdentifier(phone)) {
      return HttpResponse.json({ message: 'An account with this phone number already exists.' }, { status: 409 });
    }

    let normalizedCnic = null;
    const isCorporate = role === 'seller' && sellerType === 'corporate';

    if (role === 'seller' && !isCorporate) {
      if (!address || !cnicNumber || !cnicFront || !cnicBack) {
        return HttpResponse.json(
          { message: 'Address, CNIC number, and both CNIC images are required for seller accounts.' },
          { status: 400 }
        );
      }
      // Strip dashes/spaces so "12345-1234567-1" and "1234512345671" are treated the same.
      normalizedCnic = String(cnicNumber).replace(/\D/g, '');
      if (!/^\d{13}$/.test(normalizedCnic)) {
        return HttpResponse.json({ message: 'CNIC number must be exactly 13 digits (dashes are fine, letters are not).' }, { status: 400 });
      }
      if (db.findUserByCnic(normalizedCnic)) {
        return HttpResponse.json(
          { message: 'This CNIC number is already registered. Only one seller account is allowed per CNIC.' },
          { status: 409 }
        );
      }
    }

    if (isCorporate) {
      const required = {
        location,
        'business address': businessAddress,
        'business document': businessDocument,
        'legal company name': legalCompanyName,
        'business registration number': registrationNumber,
        NTN: ntn,
        'company email': companyEmail,
        'company phone number': companyPhone,
        'bank name': bankName,
        'account title': accountTitle,
        'account number': accountNumber,
        IBAN: iban,
      };
      const missing = Object.entries(required).find(([, val]) => !val || !String(val).trim());
      if (missing) {
        return HttpResponse.json({ message: `${missing[0][0].toUpperCase()}${missing[0].slice(1)} is required.` }, { status: 400 });
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(companyEmail)) {
        return HttpResponse.json({ message: 'Enter a valid company email address.' }, { status: 400 });
      }
    }

    const user = db.createUser({
      role,
      companyName,
      country,
      phone,
      email,
      password,
      category,
      address,
      sellerType: role === 'seller' ? sellerType || 'individual' : undefined,
      cnicNumber: normalizedCnic,
      cnicFront,
      cnicBack,
      location,
      businessAddress,
      businessDocument,
      legalCompanyName,
      registrationNumber,
      ntn,
      companyEmail,
      companyPhone,
      bankName,
      accountTitle,
      accountNumber,
      iban,
    });
    const pendingToken = db.createPending(user.id, 'signup');
    return HttpResponse.json({ pendingToken });
  }),

  http.post('/api/auth/otp/verify', async ({ request }) => {
    await delay(LATENCY_MS);
    const { pendingToken, code } = await request.json();
    if (!code || String(code).replace(/\s/g, '').length !== 6) {
      return HttpResponse.json({ message: 'Enter the full 6-digit code.' }, { status: 400 });
    }
    const pending = db.getPending(pendingToken);
    if (!pending) {
      return HttpResponse.json({ message: 'This code has expired. Please try again.' }, { status: 400 });
    }
    db.destroyPending(pendingToken);

    if (pending.purpose === 'reset') {
      return HttpResponse.json({ purpose: 'reset', ok: true });
    }
    if (!pending.userId) {
      return HttpResponse.json({ message: 'Something went wrong. Please try again.' }, { status: 400 });
    }
    const token = db.createSession(pending.userId);
    const user = db.toPublicUser(db.findUserById(pending.userId));
    return HttpResponse.json({ purpose: pending.purpose, token, user });
  }),

  http.post('/api/auth/forgot-password', async ({ request }) => {
    await delay(LATENCY_MS);
    const { identifier } = await request.json();
    const user = db.findUserByIdentifier(identifier);
    // Always succeed, even if no account matches — don't leak account existence.
    const pendingToken = db.createPending(user ? user.id : null, 'reset');
    return HttpResponse.json({ pendingToken });
  }),

  http.post('/api/auth/logout', async ({ request }) => {
    await delay(200);
    const token = bearerToken(request);
    if (token) db.destroySession(token);
    return HttpResponse.json({ ok: true });
  }),

  http.get('/api/auth/session', async ({ request }) => {
    await delay(200);
    const session = requireSession(request);
    if (!session) return HttpResponse.json({ message: 'Not signed in.' }, { status: 401 });
    return HttpResponse.json({ user: db.toPublicUser(session.user) });
  }),

  http.patch('/api/auth/profile', async ({ request }) => {
    await delay(LATENCY_MS);
    const session = requireSession(request);
    if (!session) return HttpResponse.json({ message: 'Not signed in.' }, { status: 401 });
    const body = await request.json();
    const { companyName, phone, country, category } = body;
    if (!companyName) return HttpResponse.json({ message: 'Company name is required.' }, { status: 400 });
    const updated = db.updateUser(session.user.id, { companyName, phone, country, category });
    return HttpResponse.json({ user: db.toPublicUser(updated) });
  }),

  // Self-service: a rejected seller uploads fresh CNIC images and goes back into the review
  // queue. Gated the same way as /api/seller/* — valid session, seller role.
  http.post('/api/auth/kyc/resubmit', async ({ request }) => {
    await delay(LATENCY_MS);
    const session = requireSession(request);
    if (!session) return HttpResponse.json({ message: 'Not signed in.' }, { status: 401 });
    if (session.user.role !== 'seller') {
      return HttpResponse.json({ message: 'Only seller accounts can resubmit CNIC documents.' }, { status: 403 });
    }
    const { cnicFront, cnicBack } = await request.json();
    if (!cnicFront || !cnicBack) {
      return HttpResponse.json({ message: 'Both CNIC front and back images are required.' }, { status: 400 });
    }
    const updated = db.resubmitSellerKyc(session.user.id, { cnicFront, cnicBack });
    return HttpResponse.json({ user: updated });
  }),

  // ---------- Catalog ----------

  http.get('/api/categories', async () => {
    await delay(LATENCY_MS);
    return HttpResponse.json({ categories: db.listCategories() });
  }),

  http.get('/api/categories/mobile', async () => {
    await delay(LATENCY_MS);
    return HttpResponse.json({ categories: db.listMobileCategories() });
  }),

  http.get('/api/mobile-tabs', async () => {
    await delay(150);
    return HttpResponse.json({ tabs: db.listMobileTabs() });
  }),

  http.get('/api/products', async ({ request }) => {
    await delay(LATENCY_MS);
    const url = new URL(request.url);
    const category = url.searchParams.get('category') || undefined;
    const q = url.searchParams.get('q') || undefined;
    return HttpResponse.json({ products: db.listProducts({ category, q }) });
  }),

  http.get('/api/products/trending', async () => {
    await delay(LATENCY_MS);
    return HttpResponse.json({ products: db.listTrendingProducts() });
  }),

  http.get('/api/products/:id', async ({ params }) => {
    await delay(LATENCY_MS);
    const product = db.getProduct(params.id);
    if (!product) return HttpResponse.json({ message: 'Product not found.' }, { status: 404 });
    return HttpResponse.json({ product });
  }),

  http.get('/api/spotlight/near', async () => {
    await delay(LATENCY_MS);
    return HttpResponse.json({ items: db.listSpotlightNear() });
  }),

  http.get('/api/spotlight/trending', async () => {
    await delay(LATENCY_MS);
    return HttpResponse.json({ items: db.listSpotlightTrend() });
  }),

  // ---------- Cart ----------

  http.get('/api/cart', async () => {
    await delay(250);
    return HttpResponse.json(cartResponse(db.getCart()));
  }),

  http.post('/api/cart/items', async ({ request }) => {
    await delay(250);
    const { productId, qty } = await request.json();
    if (!productId || !db.getProduct(productId)) {
      return HttpResponse.json({ message: 'Unknown product.' }, { status: 404 });
    }
    if (!Number.isInteger(qty) || qty < 1) {
      return HttpResponse.json({ message: 'Quantity must be at least 1.' }, { status: 400 });
    }
    const result = db.addCartItem(productId, qty);
    if (!result.ok) {
      return HttpResponse.json({ message: result.message, available: result.available }, { status: 409 });
    }
    return HttpResponse.json(cartResponse(result.items));
  }),

  http.patch('/api/cart/items/:productId', async ({ request, params }) => {
    await delay(200);
    const { qty } = await request.json();
    const result = db.updateCartItem(params.productId, qty);
    if (!result.ok) {
      return HttpResponse.json({ message: result.message, available: result.available }, { status: 409 });
    }
    return HttpResponse.json(cartResponse(result.items));
  }),

  http.delete('/api/cart/items/:productId', async ({ params }) => {
    await delay(200);
    return HttpResponse.json(cartResponse(db.removeCartItem(params.productId)));
  }),

  http.delete('/api/cart', async () => {
    await delay(200);
    return HttpResponse.json(cartResponse(db.clearCart()));
  }),

  // No real payment gateway here — "checkout" reads the current cart, snapshots a total
  // and order id, then clears it server-side. That's the whole order lifecycle this app
  // models; there's no persisted buyer order history yet.
  http.post('/api/checkout', async () => {
    await delay(500);
    const items = db.getCart();
    if (items.length === 0) {
      return HttpResponse.json({ message: 'Your cart is empty.' }, { status: 400 });
    }
    const subtotal = items.reduce((sum, i) => sum + parsePrice(i.product.price) * i.qty, 0);
    const itemCount = items.reduce((sum, i) => sum + i.qty, 0);
    const orderId = `FT-${Date.now().toString(36).toUpperCase()}`;
    db.clearCart();
    return HttpResponse.json({ orderId, subtotal, itemCount, placedAt: Date.now() });
  }),

  // ---------- Sellers directory (public — powers Store Profile + the "Verified Store" badge) ----------

  http.get('/api/sellers', async () => {
    await delay(LATENCY_MS);
    return HttpResponse.json({ sellers: db.listSellers() });
  }),

  http.get('/api/sellers/:id', async ({ params }) => {
    await delay(LATENCY_MS);
    const sellerRecord = db.getSellerById(params.id);
    if (!sellerRecord) return HttpResponse.json({ message: 'Store not found.' }, { status: 404 });
    const products = db.listProducts({}).filter((p) => p.sellerId === sellerRecord.id);
    return HttpResponse.json({ seller: sellerRecord, products, following: db.isFollowingSeller(sellerRecord.id) });
  }),

  http.get('/api/sellers/:id/follow', async ({ params }) => {
    await delay(200);
    const sellerRecord = db.getSellerById(params.id);
    if (!sellerRecord) return HttpResponse.json({ message: 'Store not found.' }, { status: 404 });
    return HttpResponse.json({ following: db.isFollowingSeller(params.id), followerCount: sellerRecord.followerCount || 0 });
  }),

  http.post('/api/sellers/:id/follow', async ({ params }) => {
    await delay(300);
    const result = db.followSeller(params.id);
    if (!result) return HttpResponse.json({ message: 'Store not found.' }, { status: 404 });
    return HttpResponse.json(result);
  }),

  http.delete('/api/sellers/:id/follow', async ({ params }) => {
    await delay(300);
    const result = db.unfollowSeller(params.id);
    if (!result) return HttpResponse.json({ message: 'Store not found.' }, { status: 404 });
    return HttpResponse.json(result);
  }),

  // ---------- Admin ----------

  http.patch('/api/admin/sellers/:id/verify', async ({ request, params }) => {
    await delay(300);
    const { error } = requireAdmin(request);
    if (error) return error;
    const { verified } = await request.json();
    const sellerRecord = db.setSellerVerified(params.id, verified);
    if (!sellerRecord) return HttpResponse.json({ message: 'Store not found.' }, { status: 404 });
    return HttpResponse.json({ seller: sellerRecord });
  }),

  // Seller KYC (CNIC identity verification) — separate from the Verified Store badge above.
  http.get('/api/admin/kyc', async ({ request }) => {
    await delay(LATENCY_MS);
    const { error } = requireAdmin(request);
    if (error) return error;
    return HttpResponse.json({ sellers: db.listSellerKyc() });
  }),

  http.get('/api/admin/kyc/:userId', async ({ request, params }) => {
    await delay(LATENCY_MS);
    const { error } = requireAdmin(request);
    if (error) return error;
    const seller = db.getSellerKycDetail(params.userId);
    if (!seller) return HttpResponse.json({ message: 'Seller not found.' }, { status: 404 });
    return HttpResponse.json({ seller });
  }),

  http.patch('/api/admin/kyc/:userId', async ({ request, params }) => {
    await delay(300);
    const { session, error } = requireAdmin(request);
    if (error) return error;
    const { status, rejectionReason } = await request.json();
    const seller = db.reviewSellerKyc(params.userId, { status, rejectionReason, reviewedBy: session.user.id });
    if (!seller) return HttpResponse.json({ message: 'Seller not found or invalid status.' }, { status: 404 });
    return HttpResponse.json({ seller });
  }),

  // ---------- Seller portal ----------

  http.get('/api/seller/stats', async ({ request }) => {
    await delay(LATENCY_MS);
    const { session, error } = requireSeller(request);
    if (error) return error;
    return HttpResponse.json({ stats: db.getSellerStats(session.user.id) });
  }),

  http.get('/api/seller/products', async ({ request }) => {
    await delay(LATENCY_MS);
    const { session, error } = requireSeller(request);
    if (error) return error;
    return HttpResponse.json({ products: db.listSellerProducts(session.user.id) });
  }),

  http.get('/api/seller/products/:id', async ({ request, params }) => {
    await delay(LATENCY_MS);
    const { session, error } = requireSeller(request);
    if (error) return error;
    const product = db.getSellerProduct(session.user.id, params.id);
    if (!product) return HttpResponse.json({ message: 'Listing not found.' }, { status: 404 });
    return HttpResponse.json({ product });
  }),

  http.post('/api/seller/products', async ({ request }) => {
    await delay(LATENCY_MS);
    const { session, error } = requireSeller(request);
    if (error) return error;
    const body = await request.json();
    const { name, category, price, unit, moq, stock, status, images, description, sku } = body;
    if (!name || !category || !price || !unit || !moq) {
      return HttpResponse.json({ message: 'Please fill in all required fields.' }, { status: 400 });
    }
    if (!Number.isFinite(price) || price <= 0) {
      return HttpResponse.json({ message: 'Price must be a positive number.' }, { status: 400 });
    }
    if (!Number.isInteger(stock) || stock < 0) {
      return HttpResponse.json({ message: 'Stock must be zero or a positive whole number.' }, { status: 400 });
    }
    if (images !== undefined && (!Array.isArray(images) || images.some((url) => typeof url !== 'string'))) {
      return HttpResponse.json({ message: 'Images must be a list of URLs.' }, { status: 400 });
    }
    const product = db.createSellerProduct(session.user.id, {
      name,
      category,
      price,
      unit,
      moq,
      stock,
      status,
      images,
      img: body.img,
      description,
      sku,
    });
    return HttpResponse.json({ product }, { status: 201 });
  }),

  http.patch('/api/seller/products/:id', async ({ request, params }) => {
    await delay(LATENCY_MS);
    const { session, error } = requireSeller(request);
    if (error) return error;
    const body = await request.json();
    if (body.price !== undefined && (!Number.isFinite(body.price) || body.price <= 0)) {
      return HttpResponse.json({ message: 'Price must be a positive number.' }, { status: 400 });
    }
    if (body.stock !== undefined && (!Number.isInteger(body.stock) || body.stock < 0)) {
      return HttpResponse.json({ message: 'Stock must be zero or a positive whole number.' }, { status: 400 });
    }
    if (body.images !== undefined && (!Array.isArray(body.images) || body.images.some((url) => typeof url !== 'string'))) {
      return HttpResponse.json({ message: 'Images must be a list of URLs.' }, { status: 400 });
    }
    const product = db.updateSellerProduct(session.user.id, params.id, body);
    if (!product) return HttpResponse.json({ message: 'Listing not found.' }, { status: 404 });
    return HttpResponse.json({ product });
  }),

  http.delete('/api/seller/products/:id', async ({ request, params }) => {
    await delay(300);
    const { session, error } = requireSeller(request);
    if (error) return error;
    const ok = db.deleteSellerProduct(session.user.id, params.id);
    if (!ok) return HttpResponse.json({ message: 'Listing not found.' }, { status: 404 });
    return HttpResponse.json({ ok: true });
  }),

  http.get('/api/seller/orders', async ({ request }) => {
    await delay(LATENCY_MS);
    const { session, error } = requireSeller(request);
    if (error) return error;
    return HttpResponse.json({ orders: db.listSellerOrders(session.user.id) });
  }),

  http.patch('/api/seller/orders/:id', async ({ request, params }) => {
    await delay(300);
    const { session, error } = requireSeller(request);
    if (error) return error;
    const { status } = await request.json();
    const order = db.updateSellerOrderStatus(session.user.id, params.id, status);
    if (!order) return HttpResponse.json({ message: 'Order not found or invalid status.' }, { status: 404 });
    return HttpResponse.json({ order });
  }),
];
