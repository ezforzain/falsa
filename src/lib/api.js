// Thin fetch client for the backend API (see /server). In dev, requests use relative paths
// like '/api/auth/signin', proxied to the backend by Vite (see vite.config.js) so cookies (the
// guest cart id) and CORS just work as if it were same-origin. A production static build (e.g.
// Vercel) has no such proxy, so VITE_API_URL — set at build time — points requests at wherever
// the backend is actually deployed instead; unset, it falls back to the old relative-path
// behavior so nothing changes for local dev. See .env.example.
// Every network call in the app goes through here so there's one place that
// attaches the auth token and turns non-2xx responses into thrown errors.

const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '';

const TOKEN_KEY = 'falsafahtot_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = tokenStore.get();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      // Needed the moment frontend and backend are on different origins (API_BASE set) — the
      // guest-cart cookie won't be sent/stored cross-origin without this. A no-op for the
      // relative-path/same-origin dev case.
      credentials: API_BASE ? 'include' : 'same-origin',
    });
  } catch {
    throw new ApiError('Network error — please check your connection and try again.', 0);
  }

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    // A non-JSON response from our own /api/* path usually means the backend (or its proxy)
    // isn't reachable rather than a normal API error, which always comes back as JSON.
    if (!isJson && path.startsWith('/api/')) {
      throw new ApiError('Could not reach the server — please check it is running and try again.', res.status);
    }
    throw new ApiError(data?.message || `Request failed (${res.status}).`, res.status);
  }
  return data;
}

// ---------- Auth ----------

export const auth = {
  signIn: (identifier, password) => request('/api/auth/signin', { method: 'POST', body: { identifier, password } }),
  signUp: (payload) => request('/api/auth/signup', { method: 'POST', body: payload }),
  verifyOtp: (pendingToken, code) => request('/api/auth/otp/verify', { method: 'POST', body: { pendingToken, code } }),
  forgotPassword: (identifier) => request('/api/auth/forgot-password', { method: 'POST', body: { identifier } }),
  logout: () => request('/api/auth/logout', { method: 'POST', auth: true }),
  session: () => request('/api/auth/session', { auth: true }),
  updateProfile: (payload) => request('/api/auth/profile', { method: 'PATCH', body: payload, auth: true }),
  // Self-service: a rejected seller uploads fresh CNIC images to go back into the review queue.
  resubmitKyc: (payload) => request('/api/auth/kyc/resubmit', { method: 'POST', body: payload, auth: true }),
};

// ---------- Catalog ----------

export const catalog = {
  categories: () => request('/api/categories'),
  mobileCategories: () => request('/api/categories/mobile'),
  mobileTabs: () => request('/api/mobile-tabs'),
  products: ({ category, q } = {}) => {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (q) params.set('q', q);
    const qs = params.toString();
    return request(`/api/products${qs ? `?${qs}` : ''}`);
  },
  trendingProducts: () => request('/api/products/trending'),
  product: (id) => request(`/api/products/${encodeURIComponent(id)}`),
  spotlightNear: () => request('/api/spotlight/near'),
  spotlightTrending: () => request('/api/spotlight/trending'),
};

// ---------- Cart ----------

export const cartApi = {
  get: () => request('/api/cart'),
  addItem: (productId, qty = 1) => request('/api/cart/items', { method: 'POST', body: { productId, qty } }),
  updateItem: (productId, qty) => request(`/api/cart/items/${encodeURIComponent(productId)}`, { method: 'PATCH', body: { qty } }),
  removeItem: (productId) => request(`/api/cart/items/${encodeURIComponent(productId)}`, { method: 'DELETE' }),
  clear: () => request('/api/cart', { method: 'DELETE' }),
  checkout: () => request('/api/checkout', { method: 'POST' }),
};

// ---------- Seller portal ----------

export const seller = {
  stats: () => request('/api/seller/stats', { auth: true }),
  products: () => request('/api/seller/products', { auth: true }),
  product: (id) => request(`/api/seller/products/${encodeURIComponent(id)}`, { auth: true }),
  createProduct: (payload) => request('/api/seller/products', { method: 'POST', body: payload, auth: true }),
  updateProduct: (id, payload) => request(`/api/seller/products/${encodeURIComponent(id)}`, { method: 'PATCH', body: payload, auth: true }),
  deleteProduct: (id) => request(`/api/seller/products/${encodeURIComponent(id)}`, { method: 'DELETE', auth: true }),
  orders: () => request('/api/seller/orders', { auth: true }),
  updateOrderStatus: (id, status) => request(`/api/seller/orders/${encodeURIComponent(id)}`, { method: 'PATCH', body: { status }, auth: true }),
};

// ---------- Sellers directory (Store Profile + Verified Store badge) ----------

export const sellers = {
  list: () => request('/api/sellers'),
  get: (id) => request(`/api/sellers/${encodeURIComponent(id)}`),
  followStatus: (id) => request(`/api/sellers/${encodeURIComponent(id)}/follow`),
  follow: (id) => request(`/api/sellers/${encodeURIComponent(id)}/follow`, { method: 'POST' }),
  unfollow: (id) => request(`/api/sellers/${encodeURIComponent(id)}/follow`, { method: 'DELETE' }),
};

// ---------- Admin ----------

export const admin = {
  setSellerVerified: (id, verified) =>
    request(`/api/admin/sellers/${encodeURIComponent(id)}/verify`, { method: 'PATCH', body: { verified }, auth: true }),
};

// ---------- Seller KYC (CNIC identity verification, admin review) ----------

export const kyc = {
  // Every seller with their CNIC review status (pending sorted first) — never the raw images,
  // see getSellerKyc for those.
  getPendingKyc: () => request('/api/admin/kyc', { auth: true }),
  // One seller's full KYC record, including CNIC front/back images — admin only.
  getSellerKyc: (userId) => request(`/api/admin/kyc/${encodeURIComponent(userId)}`, { auth: true }),
  approveSellerKyc: (userId) => request(`/api/admin/kyc/${encodeURIComponent(userId)}`, { method: 'PATCH', body: { status: 'approved' }, auth: true }),
  rejectSellerKyc: (userId, rejectionReason) =>
    request(`/api/admin/kyc/${encodeURIComponent(userId)}`, { method: 'PATCH', body: { status: 'rejected', rejectionReason }, auth: true }),
};

// ---------- Dev helpers ----------

// Only exists on the backend outside production (see server/src/app.js) — callers must treat a
// failed/missing response as "unavailable", not an error. Used by ShareButton to build a link
// that's actually reachable from another device even when the current page itself was loaded
// via localhost.
export const devInfo = {
  networkInfo: () => request('/api/dev/network-info'),
};

export { ApiError };
