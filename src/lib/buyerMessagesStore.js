// Buyer-side view over the server-backed conversation store (see server/src/models/Conversation.js
// and server/src/routes/messages.routes.js) — thin wrapper so MessengerPage doesn't call the raw
// API shape directly. buyerId is derived server-side (signed-in user or guest id), not passed here.
import { messages as messagesApi } from './api';

export async function loadConversations() {
  const { conversations } = await messagesApi.conversations();
  return conversations;
}

// Used when a buyer arrives via "Chat" on a product/seller page so that seller's conversation is
// ready to type into immediately, without them having to find it in a list first.
export async function getOrCreateConversation(seller, buyerName) {
  const { conversation } = await messagesApi.startConversation({
    sellerId: seller.id,
    sellerName: seller.name,
    buyerName,
  });
  return conversation;
}

export async function sendBuyerMessage(conversationId, text) {
  const { conversation } = await messagesApi.send(conversationId, text);
  return conversation;
}

export async function markBuyerRead(conversationId) {
  const { conversation } = await messagesApi.markRead(conversationId);
  return conversation;
}
