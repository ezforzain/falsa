// Shared buyer <-> seller conversation store. There's no real-time messaging backend yet, so
// every conversation lives in one localStorage key that both MessengerPage (buyer) and
// SellerMessages (seller) read from and write to, keyed by `${sellerId}__${buyerId}`. This is
// what actually lets a buyer's message reach the seller's inbox (and a seller's reply reach the
// buyer) — buyerMessagesStore.js / sellerMessagesStore.js are thin, role-scoped views over this.
const KEY = 'falsafahtot_conversations';
const EVENT = 'falsafahtot-messages-updated';

function loadAll() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAll(all) {
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // Storage unavailable (e.g. private browsing) — conversation state just stays session-only.
  }
  window.dispatchEvent(new CustomEvent(EVENT));
}

function makeId(sellerId, buyerId) {
  return `${sellerId}__${buyerId}`;
}

export function conversationsForBuyer(buyerId) {
  return loadAll().filter((c) => c.buyerId === buyerId);
}

export function conversationsForSeller(sellerId) {
  return loadAll().filter((c) => c.sellerId === sellerId);
}

// Used when a buyer arrives via "Chat" on a product/seller page so that seller's conversation is
// ready to type into immediately, without them having to find it in a list first.
export function getOrCreateConversation(sellerId, sellerName, buyerId, buyerName) {
  const all = loadAll();
  const id = makeId(sellerId, buyerId);
  const existing = all.find((c) => c.id === id);
  if (existing) return existing;

  const conversation = { id, sellerId, sellerName, buyerId, buyerName, messages: [], buyerUnread: 0, sellerUnread: 0 };
  saveAll([conversation, ...all]);
  return conversation;
}

export function sendMessage(conversationId, from, text) {
  const all = loadAll();
  const idx = all.findIndex((c) => c.id === conversationId);
  if (idx === -1) return;

  const message = { id: `${conversationId}_${Date.now()}`, from, text, at: Date.now() };
  const conv = all[idx];
  const next = [...all];
  next[idx] = {
    ...conv,
    messages: [...conv.messages, message],
    buyerUnread: from === 'seller' ? (conv.buyerUnread || 0) + 1 : conv.buyerUnread || 0,
    sellerUnread: from === 'buyer' ? (conv.sellerUnread || 0) + 1 : conv.sellerUnread || 0,
  };
  saveAll(next);
}

export function markRead(conversationId, role) {
  const all = loadAll();
  const idx = all.findIndex((c) => c.id === conversationId);
  if (idx === -1) return;

  const field = role === 'buyer' ? 'buyerUnread' : 'sellerUnread';
  if (!all[idx][field]) return;
  const next = [...all];
  next[idx] = { ...all[idx], [field]: 0 };
  saveAll(next);
}

export const MESSAGES_UPDATED_EVENT = EVENT;
