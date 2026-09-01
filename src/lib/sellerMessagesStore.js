// Seller-side view over the server-backed conversation store (see server/src/models/Conversation.js
// and the "Messages" section of server/src/routes/seller.routes.js) — thin wrapper so
// SellerMessages/SellerLayout don't call the raw API shape directly. Scoped to the signed-in
// seller by their auth token server-side, not passed here.
import { seller as sellerApi } from './api';

export async function loadConversations() {
  const { conversations } = await sellerApi.messages();
  return conversations;
}

export async function sendSellerMessage(conversationId, text) {
  const { conversation } = await sellerApi.sendMessage(conversationId, text);
  return conversation;
}

export async function markSellerRead(conversationId) {
  const { conversation } = await sellerApi.markMessageRead(conversationId);
  return conversation;
}

export function totalUnread(conversations) {
  return conversations.reduce((sum, c) => sum + (c.unread || 0), 0);
}
