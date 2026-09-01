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

const GUEST_ID_KEY = 'falsafahtot_guest_id';

// Identity for the guest-scoped cart/follows (see server/src/middleware/guest.js). Used to live
// entirely in a SameSite=None cookie, which mobile browsers increasingly block once frontend and
// API are on different origins (Vercel + Render in production) — a blocked cookie silently
// handed every request a brand-new empty cart. Owning the id here instead (plain localStorage,
// sent as a header) doesn't depend on cross-site cookie policy at all.
// crypto.randomUUID() only exists in secure contexts (HTTPS or localhost) — opening the app from
// a phone over the LAN (http://192.168.x.x) or any other plain-HTTP origin leaves it undefined,
// which used to throw and break the whole page. getRandomValues() has no such restriction, so it
// covers everywhere randomUUID doesn't; Math.random is the last-resort fallback for engines with
// neither.
function generateGuestId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0'));
    return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10, 16).join('')}`;
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getGuestId() {
  let id = localStorage.getItem(GUEST_ID_KEY);
  if (!id) {
    id = generateGuestId();
    localStorage.setItem(GUEST_ID_KEY, id);
  }
  return id;
}

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'X-Guest-Id': getGuestId() };
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
  } catch (networkErr) {
    // eslint-disable-next-line no-console
    console.error(`API network error on ${method} ${path}:`, networkErr);
    throw new ApiError('Unable to connect. Please check your internet connection and try again.', 0);
  }

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    // A non-JSON response from our own /api/* path usually means the backend (or its proxy)
    // isn't reachable rather than a normal API error, which always comes back as JSON.
    if (!isJson && path.startsWith('/api/')) {
      // eslint-disable-next-line no-console
      console.error(`API ${method} ${path} returned a non-JSON ${res.status} response.`);
      throw new ApiError('Unable to connect. Please check your internet connection and try again.', res.status);
    }
    // Our own route handlers respond with a deliberate, safe-to-display message on every 4xx
    // they raise (validation errors, "out of stock", auth failures, etc.). Anything else — a
    // 5xx, or an error with no message at all (e.g. a blocked CORS preflight, which never even
    // reaches our routes) — is technical detail that should never reach the UI verbatim, so it's
    // logged here for debugging and swapped for one generic, friendly message instead.
    if (res.status >= 500 || !data?.message) {
      // eslint-disable-next-line no-console
      console.error(`API ${method} ${path} failed (${res.status}):`, data?.message || res.statusText);
      throw new ApiError('Something went wrong. Please try again.', res.status);
    }
    throw new ApiError(data.message, res.status);
  }
  return data;
}

// ---------- Auth ----------

export const auth = {
  signIn: (identifier, password) => request('/api/auth/signin', { method: 'POST', body: { identifier, password } }),
  signUp: (payload) => request('/api/auth/signup', { method: 'POST', body: payload }),
  logout: () => request('/api/auth/logout', { method: 'POST', auth: true }),
  session: () => request('/api/auth/session', { auth: true }),
  updateProfile: (payload) => request('/api/auth/profile', { method: 'PATCH', body: payload, auth: true }),
  updatePreferences: (payload) => request('/api/auth/preferences', { method: 'PATCH', body: payload, auth: true }),
  updateAvatar: (avatarUrl) => request('/api/auth/avatar', { method: 'PATCH', body: { avatarUrl }, auth: true }),
  verifyEmail: (token) => request('/api/auth/verify-email', { method: 'POST', body: { token } }),
  resendVerificationEmail: () => request('/api/auth/verify-email/resend', { method: 'POST', auth: true }),
  changePassword: (payload) => request('/api/auth/password', { method: 'PATCH', body: payload, auth: true }),
  sessions: () => request('/api/auth/sessions', { auth: true }),
  revokeSession: (id) => request(`/api/auth/sessions/${encodeURIComponent(id)}`, { method: 'DELETE', auth: true }),
  revokeOtherSessions: () => request('/api/auth/sessions/revoke-others', { method: 'POST', auth: true }),
};

// ---------- Catalog ----------

export const catalog = {
  categories: () => request('/api/categories'),
  mobileCategories: () => request('/api/categories/mobile'),
  mobileTabs: () => request('/api/mobile-tabs'),
  hashtags: (q) => request(`/api/hashtags?q=${encodeURIComponent(q)}`),
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
  spotlightFeatured: (category) =>
    request(`/api/spotlight/featured-section${category ? `?category=${encodeURIComponent(category)}` : ''}`),
};

// ---------- Marketplace tabs (B2B / Spotlight / Worldwide / Free Shipping) ----------

// category/country accept either a single string or an array (multiselect filter panel) — an
// array is comma-joined, matching what buildMarketplaceFilter (server/src/utils/marketplaceQuery.js)
// splits back apart into a Mongo $in.
const joinList = (v) => (Array.isArray(v) ? v.filter(Boolean).join(',') : v);

function buildMarketplaceParams({
  q,
  category,
  country,
  buyerCountry,
  sellerId,
  verified,
  officialStore,
  freeShipping,
  priceMin,
  priceMax,
  moqMax,
  ratingMin,
  discountOnly,
  sortBy,
  limit,
} = {}) {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  const categoryList = joinList(category);
  if (categoryList) params.set('category', categoryList);
  const countryList = joinList(country);
  if (countryList) params.set('country', countryList);
  if (buyerCountry) params.set('buyerCountry', buyerCountry);
  if (sellerId) params.set('sellerId', sellerId);
  if (verified) params.set('verified', '1');
  if (officialStore) params.set('officialStore', '1');
  if (freeShipping) params.set('freeShipping', '1');
  if (discountOnly) params.set('discountOnly', '1');
  if (priceMin !== undefined && priceMin !== '') params.set('priceMin', priceMin);
  if (priceMax !== undefined && priceMax !== '') params.set('priceMax', priceMax);
  if (moqMax !== undefined && moqMax !== '') params.set('moqMax', moqMax);
  if (ratingMin !== undefined && ratingMin !== '') params.set('ratingMin', ratingMin);
  if (sortBy && sortBy !== 'relevance') params.set('sortBy', sortBy);
  if (limit) params.set('limit', limit);
  return params;
}

export const marketplace = {
  b2b: (opts) => request(`/api/marketplace/b2b?${buildMarketplaceParams(opts)}`),
  spotlight: (opts) => request(`/api/marketplace/spotlight?${buildMarketplaceParams(opts)}`),
  worldwide: (opts) => request(`/api/marketplace/worldwide?${buildMarketplaceParams(opts)}`),
  freeShipping: (opts) => request(`/api/marketplace/free-shipping?${buildMarketplaceParams(opts)}`),
  countries: () => request('/api/marketplace/countries'),
  // Admin-configured filter panel definition for one section (b2b/spotlight/worldwide/freeshipping)
  // — see server/src/models/FilterConfig.js.
  filters: (section) => request(`/api/marketplace/filters/${encodeURIComponent(section)}`),
};

// ---------- Cart ----------

export const cartApi = {
  get: () => request('/api/cart'),
  addItem: (productId, qty = 1) => request('/api/cart/items', { method: 'POST', body: { productId, qty } }),
  updateItem: (productId, qty) => request(`/api/cart/items/${encodeURIComponent(productId)}`, { method: 'PATCH', body: { qty } }),
  removeItem: (productId) => request(`/api/cart/items/${encodeURIComponent(productId)}`, { method: 'DELETE' }),
  clear: () => request('/api/cart', { method: 'DELETE' }),
  checkout: (address) => request('/api/checkout', { method: 'POST', body: address, auth: true }),
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
  shipOrder: (id, payload) => request(`/api/seller/orders/${encodeURIComponent(id)}/ship`, { method: 'PATCH', body: payload, auth: true }),
  setOrderLabel: (id, labelUrl) => request(`/api/seller/orders/${encodeURIComponent(id)}/label`, { method: 'PATCH', body: { labelUrl }, auth: true }),
  updateBankDetails: (payload) => request('/api/seller/bank-details', { method: 'PATCH', body: payload, auth: true }),
  getStoreProfile: () => request('/api/seller/store', { auth: true }),
  updateStoreProfile: (payload) => request('/api/seller/store', { method: 'PATCH', body: payload, auth: true }),
  analytics: () => request('/api/seller/analytics', { auth: true }),
  requestPromotion: (payload) => request('/api/seller/promotions', { method: 'POST', body: payload, auth: true }),
  promotions: () => request('/api/seller/promotions', { auth: true }),
  payouts: () => request('/api/seller/payouts', { auth: true }),
  customers: () => request('/api/seller/customers', { auth: true }),
};

// ---------- Buyer "My Orders" ----------

export const myOrders = {
  list: () => request('/api/orders', { auth: true }),
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
  setSellerOfficialStore: (id, officialStore) =>
    request(`/api/admin/sellers/${encodeURIComponent(id)}/official-store`, { method: 'PATCH', body: { officialStore }, auth: true }),
  products: () => request('/api/admin/products', { auth: true }),
  createProduct: (payload) => request('/api/admin/products', { method: 'POST', body: payload, auth: true }),
  updateProduct: (id, payload) => request(`/api/admin/products/${encodeURIComponent(id)}`, { method: 'PATCH', body: payload, auth: true }),
  deleteProduct: (id) => request(`/api/admin/products/${encodeURIComponent(id)}`, { method: 'DELETE', auth: true }),
  promotions: (status) => request(`/api/admin/promotions${status ? `?status=${encodeURIComponent(status)}` : ''}`, { auth: true }),
  reviewPromotion: (id, payload) => request(`/api/admin/promotions/${encodeURIComponent(id)}`, { method: 'PATCH', body: payload, auth: true }),
  overview: () => request('/api/admin/overview', { auth: true }),
  reports: () => request('/api/admin/reports', { auth: true }),
  getSettings: () => request('/api/admin/settings', { auth: true }),
  updateSettings: (payload) => request('/api/admin/settings', { method: 'PATCH', body: payload, auth: true }),
};

// ---------- Admin: orders ----------

export const adminOrders = {
  list: ({ status, q } = {}) => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (q) params.set('q', q);
    const qs = params.toString();
    return request(`/api/admin/orders${qs ? `?${qs}` : ''}`, { auth: true });
  },
  create: (payload) => request('/api/admin/orders', { method: 'POST', body: payload, auth: true }),
  updateStatus: (id, status) => request(`/api/admin/orders/${encodeURIComponent(id)}`, { method: 'PATCH', body: { status }, auth: true }),
};

// ---------- Admin: categories ----------

export const adminCategories = {
  list: () => request('/api/admin/categories', { auth: true }),
  create: (payload) => request('/api/admin/categories', { method: 'POST', body: payload, auth: true }),
  update: (id, payload) => request(`/api/admin/categories/${encodeURIComponent(id)}`, { method: 'PATCH', body: payload, auth: true }),
  remove: (id) => request(`/api/admin/categories/${encodeURIComponent(id)}`, { method: 'DELETE', auth: true }),
};

// ---------- Admin: marketplace filter panels (per section) ----------

export const adminFilters = {
  list: () => request('/api/admin/filters', { auth: true }),
  create: (payload) => request('/api/admin/filters', { method: 'POST', body: payload, auth: true }),
  update: (id, payload) => request(`/api/admin/filters/${encodeURIComponent(id)}`, { method: 'PATCH', body: payload, auth: true }),
  move: (id, direction) => request(`/api/admin/filters/${encodeURIComponent(id)}/move`, { method: 'PATCH', body: { direction }, auth: true }),
  remove: (id) => request(`/api/admin/filters/${encodeURIComponent(id)}`, { method: 'DELETE', auth: true }),
};

// ---------- Admin: user management ----------

export const adminUsers = {
  list: ({ role, q } = {}) => {
    const params = new URLSearchParams();
    if (role) params.set('role', role);
    if (q) params.set('q', q);
    const qs = params.toString();
    return request(`/api/admin/users${qs ? `?${qs}` : ''}`, { auth: true });
  },
  update: (id, payload) => request(`/api/admin/users/${encodeURIComponent(id)}`, { method: 'PATCH', body: payload, auth: true }),
  setStatus: (id, status) => request(`/api/admin/users/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: { status }, auth: true }),
  setVerified: (id, verified) =>
    request(`/api/admin/users/${encodeURIComponent(id)}/verified`, { method: 'PATCH', body: { verified }, auth: true }),
  // payload: { permanent: true } | { days: <number> } | { lift: true }, plus optional { reason }
  ban: (id, payload) => request(`/api/admin/users/${encodeURIComponent(id)}/ban`, { method: 'PATCH', body: payload, auth: true }),
  remove: (id) => request(`/api/admin/users/${encodeURIComponent(id)}`, { method: 'DELETE', auth: true }),
  payouts: (id) => request(`/api/admin/users/${encodeURIComponent(id)}/payouts`, { auth: true }),
  addPayout: (id, payload) => request(`/api/admin/users/${encodeURIComponent(id)}/payouts`, { method: 'POST', body: payload, auth: true }),
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
