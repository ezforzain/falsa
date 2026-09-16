// Buyer-side view over the server-backed conversation store (see server/src/models/Conversation.js
// and server/src/routes/messages.routes.js) — thin wrapper so MessengerPage doesn't call the raw
// API shape directly. buyerId is derived server-side (signed-in user or guest id), not passed here.
import { messages as messagesApi } from './api';

export async function loadConversations() {
  const { conversations } = await messagesApi.conversations();
  return conversations;
}

export async function loadConversation(conversationId) {
  const { conversation } = await messagesApi.conversation(conversationId);
  return conversation;
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

// One-sided delete — removes the thread from this buyer's list only, see the route's own comment.
export async function deleteConversation(conversationId) {
  await messagesApi.deleteConversation(conversationId);
}

// index is the message's position in `messages` as last rendered — the server re-checks
// from === 'buyer' itself, so a stale/wrong index just 404s instead of deleting anything unsafe.
export async function deleteBuyerMessage(conversationId, index) {
  const { conversation } = await messagesApi.deleteMessage(conversationId, index);
  return conversation;
}
