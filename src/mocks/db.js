// A tiny "server-side" mock database for the MSW handlers.
//
// Product/category/spotlight data is static seed data re-used from src/data/mockData.js
// (the catalog). Users, sessions, and the cart are *mutable* server state — since MSW
// handlers run inside the same browser tab, a hard page refresh re-evaluates this whole
// module. To make auth/cart genuinely survive a refresh (not just a client-side re-render),
// that mutable state is persisted to localStorage under a `msw_db_*` namespace, acting as
// the mock server's "disk" the same way a real backend would keep rows in a database file.
import {
  categories,
  mobileCategories,
  mobileTabs,
  products,
  spotlightNear,
  spotlightTrend,
  trendingProducts,
  matchesQuery,
  unsplash,
} from '../data/mockData';

const NS = 'msw_db_';

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(NS + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  localStorage.setItem(NS + key, JSON.stringify(value));
}

function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function slugify(str) {
  return String(str)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

// ---------- Sellers (storefront directory — the "is_verified" source of truth) ----------
// A lightweight directory of every seller name in the catalog, plus any seller that signs up
// through the seller portal. This is what the "Verified Store" badge reads from and what the
// admin panel toggles — kept separate from `users` because most catalog sellers in this demo
// (e.g. "Sialkot Surgical Co.") don't have a login account at all.

const SELLER_SEED_META = {
  'Anwar Textile Mills': { verified: true, followerCount: 1240, responseRate: 97 },
  'Karachi Leatherworks': { verified: true, followerCount: 860, responseRate: 95 },
  'PakPack Industries': { verified: true, followerCount: 640, responseRate: 93 },
  'Sialkot Surgical Co.': { verified: false, followerCount: 410, responseRate: 89 },
  'Star Sports Mfg.': { verified: false, followerCount: 520, responseRate: 91 },
  'Gujranwala Metals': { verified: false, followerCount: 310, responseRate: 88 },
  'Al-Barkat Rice Mills': { verified: false, followerCount: 275, responseRate: 90 },
  'Faisalabad Denim Co.': { verified: false, followerCount: 380, responseRate: 87 },
};
const DEFAULT_SELLER_META = { verified: false, followerCount: 0, responseRate: 90 };

function seedSellersIfEmpty() {
  if (readJSON('sellers', null)) return;
  const names = [...new Set(products.map((p) => p.seller))];
  const now = Date.now();
  writeJSON(
    'sellers',
    names.map((name) => {
      const meta = SELLER_SEED_META[name] || DEFAULT_SELLER_META;
      return {
        id: `store_${slugify(name)}`,
        name,
        verified: meta.verified, // is_verified BOOLEAN DEFAULT FALSE — most seed sellers start unverified
        followerCount: meta.followerCount,
        responseRate: meta.responseRate,
        createdAt: now,
      };
    })
  );
}

function readSellers() {
  seedSellersIfEmpty();
  return readJSON('sellers', []);
}

function writeSellers(list) {
  writeJSON('sellers', list);
  return list;
}

export function listSellers() {
  return [...readSellers()].sort((a, b) => a.name.localeCompare(b.name));
}

export function getSellerById(id) {
  return readSellers().find((s) => s.id === id) || null;
}

export function getSellerByName(name) {
  return readSellers().find((s) => s.name === name) || null;
}

// Looks a seller up by name, creating a fresh (unverified) directory entry the first time a
// given business name is seen — e.g. when a new seller account signs up.
export function findOrCreateSellerByName(name) {
  const existing = getSellerByName(name);
  if (existing) return existing;
  const record = {
    id: `store_${slugify(name)}`,
    name,
    verified: DEFAULT_SELLER_META.verified,
    followerCount: DEFAULT_SELLER_META.followerCount,
    responseRate: DEFAULT_SELLER_META.responseRate,
    createdAt: Date.now(),
  };
  writeSellers([...readSellers(), record]);
  return record;
}

function patchSeller(id, patch) {
  const list = readSellers();
  if (!list.some((s) => s.id === id)) return null;
  const next = list.map((s) => (s.id === id ? { ...s, ...patch } : s));
  writeSellers(next);
  return next.find((s) => s.id === id);
}

export function setSellerVerified(id, verified) {
  return patchSeller(id, { verified: Boolean(verified) });
}

// ---------- Store follows ----------
// Kept as a guest/session-independent set (mirrors how the cart is modeled above), persisted
// so it survives a refresh. Not tied to a user id since browsing/following, like the cart,
// doesn't require signing in anywhere else in this app.

function readFollows() {
  return readJSON('follows', []); // array of sellerIds
}

function writeFollowsList(list) {
  writeJSON('follows', list);
  return list;
}

export function isFollowingSeller(sellerId) {
  return readFollows().includes(sellerId);
}

// Returns { following, followerCount } — idempotent if already followed.
export function followSeller(sellerId) {
  const sellerRecord = getSellerById(sellerId);
  if (!sellerRecord) return null;
  const follows = readFollows();
  if (follows.includes(sellerId)) {
    return { following: true, followerCount: sellerRecord.followerCount || 0 };
  }
  writeFollowsList([...follows, sellerId]);
  const updated = patchSeller(sellerId, { followerCount: (sellerRecord.followerCount || 0) + 1 });
  return { following: true, followerCount: updated.followerCount };
}

// Returns { following, followerCount } — idempotent if already not followed.
export function unfollowSeller(sellerId) {
  const sellerRecord = getSellerById(sellerId);
  if (!sellerRecord) return null;
  const follows = readFollows();
  if (!follows.includes(sellerId)) {
    return { following: false, followerCount: sellerRecord.followerCount || 0 };
  }
  writeFollowsList(follows.filter((id) => id !== sellerId));
  const updated = patchSeller(sellerId, { followerCount: Math.max((sellerRecord.followerCount || 0) - 1, 0) });
  return { following: false, followerCount: updated.followerCount };
}

// Joins a catalog product with its seller directory record, attaching `verified`/`sellerId`
// so every surface that renders a product card can show the "Verified Store" badge without a
// second round trip.
function attachSellerInfo(product) {
  if (!product) return product;
  const sellerRecord = getSellerByName(product.seller);
  return { ...product, verified: sellerRecord?.verified || false, sellerId: sellerRecord?.id || null };
}

// ---------- Users ----------

const DEMO_USERS = [
  {
    id: 'user_demo_buyer',
    role: 'buyer',
    email: 'buyer@falsafahtot.com',
    phone: '+92 300 0000000',
    password: 'password123',
    companyName: 'Al-Karam Traders',
    country: 'Pakistan',
  },
  {
    id: 'user_demo_seller',
    role: 'seller',
    email: 'seller@falsafahtot.com',
    phone: '+92 300 1111111',
    password: 'password123',
    companyName: 'Anwar Textile Mills',
    country: 'Pakistan',
    category: 'Textiles & Fabrics',
    sellerId: 'store_anwar_textile_mills',
    sellerType: 'individual',
    address: 'Plot 14, Industrial Estate, Faisalabad, Pakistan',
    cnicNumber: '3520112345671',
    cnicFront: null,
    cnicBack: null,
    cnicStatus: 'approved',
    cnicRejectionReason: null,
    reviewedBy: 'user_demo_admin',
    reviewedAt: Date.now(),
  },
  {
    id: 'user_demo_admin',
    role: 'admin',
    email: 'admin@falsafahtot.com',
    phone: '+92 300 9999999',
    password: 'password123',
    companyName: 'Falsafah HQ',
    country: 'Pakistan',
  },
];

function seedUsersIfEmpty() {
  const existing = readJSON('users', null);
  if (!existing) {
    writeJSON('users', DEMO_USERS);
    return;
  }
  // Backfill for browsers that already seeded `users` in an earlier session (e.g. before the
  // admin role / seller `sellerId` link / CNIC verification fields existed): add any missing
  // demo accounts and patch the demo seller with fields it predates, without touching any real
  // accounts the user has signed up.
  let changed = false;
  const byId = new Map(existing.map((u) => [u.id, u]));
  for (const demo of DEMO_USERS) {
    const current = byId.get(demo.id);
    if (!current) {
      byId.set(demo.id, demo);
      changed = true;
      continue;
    }
    const patch = {};
    if (demo.sellerId && !current.sellerId) patch.sellerId = demo.sellerId;
    if (demo.sellerType && !current.sellerType) patch.sellerType = demo.sellerType;
    if (demo.cnicStatus && !current.cnicStatus) {
      patch.cnicStatus = demo.cnicStatus;
      patch.cnicNumber = demo.cnicNumber;
      patch.address = demo.address;
      patch.cnicFront = demo.cnicFront;
      patch.cnicBack = demo.cnicBack;
      patch.cnicRejectionReason = demo.cnicRejectionReason;
      patch.reviewedBy = demo.reviewedBy;
      patch.reviewedAt = demo.reviewedAt;
    } else if (current.cnicStatus && (current.cnicFrontImage !== undefined || current.cnicReviewedBy !== undefined)) {
      // Rename backfill for browsers seeded under the old field names (cnicFrontImage/
      // cnicBackImage/cnicReviewedBy/cnicReviewedAt) before this system settled on
      // cnicFront/cnicBack/reviewedBy/reviewedAt.
      if (current.cnicFrontImage !== undefined) {
        patch.cnicFront = current.cnicFrontImage;
        patch.cnicFrontImage = undefined;
      }
      if (current.cnicBackImage !== undefined) {
        patch.cnicBack = current.cnicBackImage;
        patch.cnicBackImage = undefined;
      }
      if (current.cnicReviewedBy !== undefined) {
        patch.reviewedBy = current.cnicReviewedBy;
        patch.cnicReviewedBy = undefined;
      }
      if (current.cnicReviewedAt !== undefined) {
        patch.reviewedAt = current.cnicReviewedAt;
        patch.cnicReviewedAt = undefined;
      }
    }
    if (Object.keys(patch).length > 0) {
      byId.set(demo.id, { ...current, ...patch });
      changed = true;
    }
  }
  if (changed) writeJSON('users', [...byId.values()]);
}

export function listUsers() {
  seedUsersIfEmpty();
  return readJSON('users', DEMO_USERS);
}

export function findUserByIdentifier(identifier) {
  const id = String(identifier ?? '').trim().toLowerCase();
  return listUsers().find((u) => u.email.toLowerCase() === id || u.phone.replace(/\s+/g, '') === id.replace(/\s+/g, ''));
}

export function findUserById(userId) {
  return listUsers().find((u) => u.id === userId) || null;
}

// CNIC numbers are stored as normalized 13-digit strings (dashes/spaces stripped before this is
// called) — one CNIC can only ever back one seller account.
export function findUserByCnic(cnicNumber) {
  return listUsers().find((u) => u.cnicNumber === cnicNumber) || null;
}

export function createUser({
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
}) {
  const users = listUsers();
  const isSeller = role === 'seller';
  const isCorporate = isSeller && sellerType === 'corporate';
  const user = {
    id: uid('user'),
    role,
    email,
    phone,
    password,
    companyName,
    country,
    category: category || null,
    address: address || null,
    // A seller's public "Verified Store" badge lives on the sellers directory (see
    // findOrCreateSellerByName below) — separate from the verification status below, which
    // gates the seller portal itself rather than the public storefront badge.
    sellerId: isSeller ? findOrCreateSellerByName(companyName).id : null,
    sellerType: isSeller ? sellerType || 'individual' : null,
    // Individual path — CNIC front/back.
    cnicNumber: isSeller && !isCorporate ? cnicNumber : null,
    cnicFront: isSeller && !isCorporate ? cnicFront : null,
    cnicBack: isSeller && !isCorporate ? cnicBack : null,
    // Corporate path — registration details, a single business document, and bank info.
    location: isCorporate ? location : null,
    businessAddress: isCorporate ? businessAddress : null,
    businessDocument: isCorporate ? businessDocument : null,
    legalCompanyName: isCorporate ? legalCompanyName : null,
    registrationNumber: isCorporate ? registrationNumber : null,
    ntn: isCorporate ? ntn : null,
    companyEmail: isCorporate ? companyEmail : null,
    companyPhone: isCorporate ? companyPhone : null,
    bankName: isCorporate ? bankName : null,
    accountTitle: isCorporate ? accountTitle : null,
    accountNumber: isCorporate ? accountNumber : null,
    iban: isCorporate ? iban : null,
    // Shared verification trail — same "pending/approved/rejected" gate regardless of path.
    cnicStatus: isSeller ? 'pending' : null,
    cnicRejectionReason: null,
    reviewedBy: null,
    reviewedAt: null,
  };
  writeJSON('users', [...users, user]);
  return user;
}

export function updateUser(userId, patch) {
  const users = listUsers();
  const next = users.map((u) => (u.id === userId ? { ...u, ...patch, id: u.id, password: u.password } : u));
  writeJSON('users', next);
  return next.find((u) => u.id === userId) || null;
}

export function toPublicUser(user) {
  if (!user) return null;
  // Never send the password back to the client, same as a real API would. The raw CNIC image
  // data URLs are stripped too — even from the owner's own session — since nothing in the UI
  // needs to redisplay them; only the admin KYC review endpoints (below) return the images, and
  // only to admin accounts.
  const { password, cnicFront, cnicBack, businessDocument, ...publicUser } = user;
  if (publicUser.role === 'seller' && publicUser.sellerId) {
    const sellerRecord = getSellerById(publicUser.sellerId);
    publicUser.verified = sellerRecord ? sellerRecord.verified : false;
  }
  return publicUser;
}

// ---------- Seller KYC (CNIC identity verification) ----------
// Gates the seller portal itself (see the SellerLayout pending-verification banner) — distinct
// from the public "Verified Store" badge above, which is a separate marketplace trust signal an
// admin toggles independently. A seller can be CNIC-approved without yet having a public badge.

// Admin-facing list: every seller account with its review status, but never the CNIC images
// themselves — those are only fetched one at a time via getSellerKycDetail, so a bulk list
// response never has to carry a pile of base64 images.
export function listSellerKyc() {
  const statusOrder = { pending: 0, rejected: 1, approved: 2 };
  return listUsers()
    .filter((u) => u.role === 'seller')
    .map((u) => toPublicUser(u))
    .sort((a, b) => (statusOrder[a.cnicStatus] ?? 3) - (statusOrder[b.cnicStatus] ?? 3));
}

// Full record for one seller, including the CNIC front/back images — only ever called from an
// admin-gated handler.
export function getSellerKycDetail(userId) {
  const user = findUserById(userId);
  if (!user || user.role !== 'seller') return null;
  const { password, ...detail } = user;
  return detail;
}

export function reviewSellerKyc(userId, { status, rejectionReason, reviewedBy }) {
  if (!['approved', 'rejected'].includes(status)) return null;
  const user = findUserById(userId);
  if (!user || user.role !== 'seller') return null;
  const updated = updateUser(userId, {
    cnicStatus: status,
    cnicRejectionReason: status === 'rejected' ? rejectionReason || 'Documents could not be verified.' : null,
    reviewedBy,
    reviewedAt: Date.now(),
  });
  return toPublicUser(updated);
}

// Lets a rejected seller upload fresh CNIC images and go back into the review queue —
// resets status to "pending" and clears the previous rejection/review trail.
// Resubmission documents differ by seller type: an individual re-uploads CNIC front/back, a
// corporate seller re-uploads their business document. Either shape is accepted here — only
// the fields actually present in `documents` are touched, so this works for both paths without
// the caller needing to know which fields are relevant.
export function resubmitSellerKyc(userId, documents) {
  const user = findUserById(userId);
  if (!user || user.role !== 'seller') return null;
  const updated = updateUser(userId, {
    ...documents,
    cnicStatus: 'pending',
    cnicRejectionReason: null,
    reviewedBy: null,
    reviewedAt: null,
  });
  return toPublicUser(updated);
}

// ---------- Sessions ----------

function readSessions() {
  return readJSON('sessions', {});
}

export function createSession(userId) {
  const sessions = readSessions();
  const token = uid('token');
  sessions[token] = { userId, createdAt: Date.now() };
  writeJSON('sessions', sessions);
  return token;
}

export function getSession(token) {
  if (!token) return null;
  const sessions = readSessions();
  return sessions[token] || null;
}

export function destroySession(token) {
  const sessions = readSessions();
  delete sessions[token];
  writeJSON('sessions', sessions);
}

// ---------- Pending auth (pre-OTP-verification signin/signup/password-reset) ----------

function readPending() {
  return readJSON('pending', {});
}

export function createPending(userId, purpose) {
  const pending = readPending();
  const pendingToken = uid('pending');
  pending[pendingToken] = { userId, purpose, createdAt: Date.now() };
  writeJSON('pending', pending);
  return pendingToken;
}

export function getPending(pendingToken) {
  if (!pendingToken) return null;
  return readPending()[pendingToken] || null;
}

export function destroyPending(pendingToken) {
  const pending = readPending();
  delete pending[pendingToken];
  writeJSON('pending', pending);
}

// ---------- Catalog (read-only) ----------

export function listCategories() {
  return categories;
}

export function listMobileCategories() {
  return mobileCategories;
}

export function listMobileTabs() {
  return mobileTabs;
}

export function listSpotlightNear() {
  return spotlightNear.map((entry) => ({ ...entry, product: attachSellerInfo(entry.product) }));
}

export function listSpotlightTrend() {
  return spotlightTrend.map((entry) => ({ ...entry, product: attachSellerInfo(entry.product) }));
}

export function listTrendingProducts() {
  return trendingProducts.map((p) => attachSellerInfo(p));
}

export function listProducts({ category, q } = {}) {
  let result = products;
  if (category) {
    result = result.filter((p) => p.category === category);
  }
  if (q) {
    result = result.filter((p) => matchesQuery(p, q));
  }
  return result.map(attachSellerInfo);
}

export function getProduct(id) {
  return attachSellerInfo(products.find((p) => p.id === id) || null);
}

// ---------- Cart ----------
// Kept as a guest/session-independent cart (mirrors the app's existing behavior),
// persisted so it survives a refresh just like the rest of the mock backend.

function readCart() {
  return readJSON('cart', []); // [{ productId, qty }]
}

function writeCart(items) {
  writeJSON('cart', items);
  return items;
}

function hydrateCart(items) {
  return items
    .map((i) => ({ product: getProduct(i.productId), qty: i.qty }))
    .filter((i) => i.product);
}

export function getCart() {
  return hydrateCart(readCart());
}

// Returns { ok: true, items } on success, or { ok: false, message, available } if the
// requested quantity would exceed the product's tracked stock (undefined/null stock on
// a product means inventory isn't tracked for it, so no cap is enforced).
export function addCartItem(productId, qty = 1) {
  const product = getProduct(productId);
  const items = readCart();
  const existing = items.find((i) => i.productId === productId);
  const currentQty = existing ? existing.qty : 0;
  const requestedTotal = currentQty + qty;

  if (typeof product?.stock === 'number' && requestedTotal > product.stock) {
    const available = Math.max(product.stock - currentQty, 0);
    return {
      ok: false,
      message:
        available > 0
          ? `Only ${available} more unit${available === 1 ? '' : 's'} available for this product.`
          : 'This product is out of stock.',
      available,
    };
  }

  if (existing) {
    existing.qty = requestedTotal;
  } else {
    items.push({ productId, qty });
  }
  return { ok: true, items: hydrateCart(writeCart(items)) };
}

// Same result shape as addCartItem: { ok: true, items } or { ok: false, message, available }.
export function updateCartItem(productId, qty) {
  let items = readCart();
  if (qty <= 0) {
    items = items.filter((i) => i.productId !== productId);
    return { ok: true, items: hydrateCart(writeCart(items)) };
  }

  const product = getProduct(productId);
  if (typeof product?.stock === 'number' && qty > product.stock) {
    return {
      ok: false,
      message: `Only ${product.stock} unit${product.stock === 1 ? '' : 's'} available for this product.`,
      available: product.stock,
    };
  }

  items = items.map((i) => (i.productId === productId ? { ...i, qty } : i));
  return { ok: true, items: hydrateCart(writeCart(items)) };
}

export function removeCartItem(productId) {
  const items = readCart().filter((i) => i.productId !== productId);
  return hydrateCart(writeCart(items));
}

export function clearCart() {
  return hydrateCart(writeCart([]));
}

// ---------- Seller portal: listings ----------
// A seller's own manageable inventory — deliberately separate from the read-only public
// `products` catalog above, so the seller portal has full CRUD without ever mutating (or
// colliding IDs with) the shared storefront data.

const ORDER_STATUSES = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

function seedSellerProductsIfEmpty() {
  if (readJSON('seller_products', null)) return;
  const now = Date.now();
  writeJSON('seller_products', [
    {
      id: 'sp_demo_1',
      sellerId: 'user_demo_seller',
      name: 'Cotton Twill Fabric 280 GSM',
      category: 'Textiles & Fabrics',
      description:
        'Export-grade 280 GSM cotton twill, pre-shrunk and dyed to order. Popular for workwear, uniforms, and heavy-duty garment lining. Available in standard and custom widths.',
      sku: 'TEX-1001',
      price: 670,
      unit: 'metre',
      moq: '500m',
      stock: 2400,
      status: 'active',
      images: [unsplash('photo-1523381210434-271e8be1f52b'), unsplash('photo-1620799140408-edc6dcb6d633'), unsplash('photo-1489987707025-afc232f7ea0f')],
      img: unsplash('photo-1523381210434-271e8be1f52b'),
      createdAt: now - 12 * 86400000,
    },
    {
      id: 'sp_demo_2',
      sellerId: 'user_demo_seller',
      name: 'Denim Fabric Rolls',
      category: 'Textiles & Fabrics',
      description: 'Mid-weight 12oz denim, indigo-dyed, sold in full rolls. Suitable for apparel and accessories manufacturing.',
      sku: 'TEX-1002',
      price: 590,
      unit: 'metre',
      moq: '400m',
      stock: 0,
      status: 'active',
      images: [unsplash('photo-1565084888279-aca607ecce0c')],
      img: unsplash('photo-1565084888279-aca607ecce0c'),
      createdAt: now - 6 * 86400000,
    },
    {
      id: 'sp_demo_3',
      sellerId: 'user_demo_seller',
      name: 'Organic Cotton Canvas Roll',
      category: 'Textiles & Fabrics',
      description: '',
      sku: 'TEX-1003',
      price: 810,
      unit: 'metre',
      moq: '250m',
      stock: 640,
      status: 'draft',
      images: [unsplash('photo-1620799140408-edc6dcb6d633'), unsplash('photo-1441986300917-64674bd600d8')],
      img: unsplash('photo-1620799140408-edc6dcb6d633'),
      createdAt: now - 2 * 86400000,
    },
  ]);
}

function readSellerProducts() {
  seedSellerProductsIfEmpty();
  return readJSON('seller_products', []);
}

function writeSellerProducts(items) {
  writeJSON('seller_products', items);
  return items;
}

export function listSellerProducts(sellerId) {
  return readSellerProducts()
    .filter((p) => p.sellerId === sellerId)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function getSellerProduct(sellerId, id) {
  return readSellerProducts().find((p) => p.id === id && p.sellerId === sellerId) || null;
}

const DEFAULT_PRODUCT_IMG = unsplash('photo-1553413077-190dd305871c');

// A short, readable SKU derived from the category (e.g. "Textiles & Fabrics" -> "TEX-4821")
// so a listing always has one to display even if the seller doesn't type one in.
function generateSku(category) {
  const prefix = (category || 'GEN').replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'GEN';
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${suffix}`;
}

export function createSellerProduct(sellerId, data) {
  const items = readSellerProducts();
  // `images` is the full gallery a seller can attach to a listing; `img` is kept in sync as
  // images[0] so every existing view that only knows about a single cover photo (product
  // cards, cart, order rows) keeps working without any changes.
  const images = Array.isArray(data.images) && data.images.length > 0 ? data.images : [data.img || DEFAULT_PRODUCT_IMG];
  const record = {
    id: uid('sp'),
    sellerId,
    name: data.name,
    category: data.category,
    description: data.description || '',
    sku: data.sku?.trim() || generateSku(data.category),
    price: data.price,
    unit: data.unit,
    moq: data.moq,
    stock: data.stock,
    status: data.status || 'active',
    images,
    img: images[0],
    createdAt: Date.now(),
  };
  writeSellerProducts([record, ...items]);
  return record;
}

export function updateSellerProduct(sellerId, id, patch) {
  const items = readSellerProducts();
  const existing = items.find((p) => p.id === id && p.sellerId === sellerId);
  if (!existing) return null;
  const nextPatch = { ...patch };
  if (Array.isArray(nextPatch.images)) {
    nextPatch.images = nextPatch.images.length > 0 ? nextPatch.images : existing.images;
    nextPatch.img = nextPatch.images[0];
  }
  const next = items.map((p) => (p.id === id ? { ...p, ...nextPatch, id: p.id, sellerId: p.sellerId } : p));
  writeSellerProducts(next);
  return next.find((p) => p.id === id);
}

export function deleteSellerProduct(sellerId, id) {
  const items = readSellerProducts();
  if (!items.some((p) => p.id === id && p.sellerId === sellerId)) return false;
  writeSellerProducts(items.filter((p) => p.id !== id));
  return true;
}

// ---------- Seller portal: orders ----------

function seedSellerOrdersIfEmpty() {
  if (readJSON('seller_orders', null)) return;
  const now = Date.now();
  const day = 86400000;
  writeJSON('seller_orders', [
    {
      id: 'ord_demo_1',
      sellerId: 'user_demo_seller',
      buyerCompany: 'Al-Karam Traders',
      buyerCountry: 'Pakistan',
      productName: 'Cotton Twill Fabric 280 GSM',
      qty: 800,
      unitPrice: 670,
      status: 'Pending',
      placedAt: now - 1 * day,
    },
    {
      id: 'ord_demo_2',
      sellerId: 'user_demo_seller',
      buyerCompany: 'Gulistan Sourcing Co.',
      buyerCountry: 'United Arab Emirates',
      productName: 'Cotton Twill Fabric 280 GSM',
      qty: 2200,
      unitPrice: 583,
      status: 'Processing',
      placedAt: now - 3 * day,
    },
    {
      id: 'ord_demo_3',
      sellerId: 'user_demo_seller',
      buyerCompany: 'Nordic Trade House',
      buyerCountry: 'Sweden',
      productName: 'Denim Fabric Rolls',
      qty: 400,
      unitPrice: 590,
      status: 'Shipped',
      placedAt: now - 6 * day,
    },
    {
      id: 'ord_demo_4',
      sellerId: 'user_demo_seller',
      buyerCompany: 'Redwood Imports LLC',
      buyerCountry: 'United States',
      productName: 'Cotton Twill Fabric 280 GSM',
      qty: 500,
      unitPrice: 670,
      status: 'Delivered',
      placedAt: now - 14 * day,
    },
    {
      id: 'ord_demo_5',
      sellerId: 'user_demo_seller',
      buyerCompany: 'Al-Karam Traders',
      buyerCountry: 'Pakistan',
      productName: 'Denim Fabric Rolls',
      qty: 150,
      unitPrice: 590,
      status: 'Cancelled',
      placedAt: now - 20 * day,
    },
  ]);
}

function readSellerOrders() {
  seedSellerOrdersIfEmpty();
  return readJSON('seller_orders', []);
}

function writeSellerOrders(items) {
  writeJSON('seller_orders', items);
  return items;
}

export function listSellerOrders(sellerId) {
  return readSellerOrders()
    .filter((o) => o.sellerId === sellerId)
    .map((o) => ({ ...o, total: o.qty * o.unitPrice }))
    .sort((a, b) => b.placedAt - a.placedAt);
}

export function updateSellerOrderStatus(sellerId, orderId, status) {
  if (!ORDER_STATUSES.includes(status)) return null;
  const items = readSellerOrders();
  const existing = items.find((o) => o.id === orderId && o.sellerId === sellerId);
  if (!existing) return null;
  const next = items.map((o) => (o.id === orderId ? { ...o, status } : o));
  writeSellerOrders(next);
  return { ...next.find((o) => o.id === orderId), total: existing.qty * existing.unitPrice };
}

export function getSellerStats(sellerId) {
  const productsList = listSellerProducts(sellerId);
  const orders = listSellerOrders(sellerId);
  const activeListings = productsList.filter((p) => p.status === 'active').length;
  const pendingOrders = orders.filter((o) => o.status === 'Pending' || o.status === 'Processing').length;
  const totalRevenue = orders
    .filter((o) => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + o.total, 0);
  return {
    totalRevenue,
    totalOrders: orders.length,
    activeListings,
    totalListings: productsList.length,
    pendingOrders,
  };
}
