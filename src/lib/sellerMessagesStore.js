// Seller-side view over the shared conversation store (see messagesStore.js) — scoped to this
// seller account. When the seller has no real buyer conversations yet, seeds a few demo threads
// (from this seller's actual customers when there are any, see SellerCustomers /
// GET /api/seller/customers) so the inbox doesn't start out looking broken/empty; those demo
// threads live in the same shared store as real ones, so replying to them works the same way.
import {
  conversationsForSeller,
  getOrCreateConversation,
  sendMessage as sendShared,
  markRead as markSharedRead,
  MESSAGES_UPDATED_EVENT,
} from './messagesStore';

const FALLBACK_BUYERS = ['Al-Noor Traders', 'Zenith Imports Co.', 'Blue Ocean Textiles'];

function toSellerView(conv) {
  return { id: conv.id, buyerCompany: conv.buyerName, unread: conv.sellerUnread || 0, messages: conv.messages };
}

function mapForSeller(sellerId) {
  return conversationsForSeller(sellerId).map(toSellerView);
}

function seedDemoConversations(sellerId, buyerNames) {
  const names = buyerNames && buyerNames.length > 0 ? buyerNames.slice(0, 4) : FALLBACK_BUYERS;
  names.forEach((name, i) => {
    const conv = getOrCreateConversation(sellerId, undefined, `demo_buyer_${sellerId}_${i}`, name);
    if (conv.messages.length === 0) {
      sendShared(conv.id, 'buyer', 'Hi, is this item still in stock?');
      sendShared(conv.id, 'buyer', "What's your best price for a bulk order?");
    }
  });
}

export function loadConversations(sellerId) {
  if (!sellerId) return [];
  return mapForSeller(sellerId);
}

export function loadOrSeedConversations(sellerId, buyerNames) {
  if (!sellerId) return [];
  const existing = mapForSeller(sellerId);
  if (existing.length > 0) return existing;
  seedDemoConversations(sellerId, buyerNames);
  return mapForSeller(sellerId);
}

export function sendSellerMessage(conversationId, text) {
  sendShared(conversationId, 'seller', text);
}

export function markSellerRead(conversationId) {
  markSharedRead(conversationId, 'seller');
}

export function totalUnread(conversations) {
  return conversations.reduce((sum, c) => sum + (c.unread || 0), 0);
}

export { MESSAGES_UPDATED_EVENT };
