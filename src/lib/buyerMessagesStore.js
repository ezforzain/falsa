// Buyer-side view over the shared conversation store (see messagesStore.js) — scoped to the
// signed-in buyer (or the guest id also used for the guest cart/follows, see lib/api.js's
// getGuestId), one conversation per seller the buyer has messaged.
import {
  conversationsForBuyer,
  getOrCreateConversation as getOrCreateShared,
  sendMessage as sendShared,
  MESSAGES_UPDATED_EVENT,
} from './messagesStore';

function toBuyerView(conv) {
  return { id: conv.id, sellerId: conv.sellerId, sellerName: conv.sellerName, messages: conv.messages };
}

export function loadConversations(buyerId) {
  if (!buyerId) return [];
  return conversationsForBuyer(buyerId).map(toBuyerView);
}

// Used when a buyer arrives via "Chat" on a product/seller page so that seller's conversation is
// ready to type into immediately, without them having to find it in a list first.
export function getOrCreateConversation(buyerId, seller, buyerName) {
  const conversation = getOrCreateShared(seller.id, seller.name, buyerId, buyerName);
  return { conversation: toBuyerView(conversation), conversations: loadConversations(buyerId) };
}

export function sendBuyerMessage(conversationId, text) {
  sendShared(conversationId, 'buyer', text);
}

export { MESSAGES_UPDATED_EVENT };
