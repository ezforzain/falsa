import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getGuestId } from '../lib/api';
import { getOrCreateConversation, loadConversations, sendBuyerMessage, MESSAGES_UPDATED_EVENT } from '../lib/buyerMessagesStore';
import { IconChevronLeft, IconMessageCircle } from '../components/icons';

function formatTime(at) {
  return new Date(at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// Buyer-side counterpart to seller/SellerMessages.jsx — see buyerMessagesStore.js for why this
// is localStorage-backed rather than a real messaging backend. Arriving here via a product or
// seller-info page's "Chat" button (see ChatButton) passes { sellerId, sellerName } in router
// state, which opens straight into that seller's thread instead of the plain conversation list.
export default function MessengerPage() {
  const { user } = useAuth();
  const location = useLocation();
  const buyerId = user?.id || getGuestId();
  const buyerName = user?.companyName || 'Guest buyer';

  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [draft, setDraft] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    const targetSeller = location.state?.sellerId ? { id: location.state.sellerId, name: location.state.sellerName } : null;
    if (targetSeller) {
      const { conversation, conversations: all } = getOrCreateConversation(buyerId, targetSeller, buyerName);
      setConversations(all);
      setActiveId(conversation.id);
    } else {
      setConversations(loadConversations(buyerId));
    }
    // Only re-run when the buyer or the incoming seller target actually changes — not on every
    // conversations update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buyerId, location.state?.sellerId]);

  useEffect(() => {
    const refresh = () => setConversations(loadConversations(buyerId));
    window.addEventListener(MESSAGES_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(MESSAGES_UPDATED_EVENT, refresh);
  }, [buyerId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'nearest' });
  }, [activeId, conversations]);

  const active = conversations.find((c) => c.id === activeId) || null;

  const sendMessage = () => {
    const text = draft.trim();
    if (!text || !active) return;
    sendBuyerMessage(active.id, text);
    setDraft('');
  };

  return (
    <main className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-10 pt-9 pb-20 animate-fade-up">
      <h1 className="font-display text-[28px] font-bold m-0 mb-1.5 tracking-tight">Messenger</h1>
      <p className="text-sm text-text-muted mb-7">Conversations with sellers about your orders and enquiries.</p>

      {conversations.length === 0 ? (
        <div className="text-center py-[60px] px-5 bg-surface border border-dashed border-border-strong rounded-2xl">
          <span className="w-14 h-14 rounded-full bg-surface-muted inline-flex items-center justify-center mb-5">
            <IconMessageCircle width="22" height="22" className="text-text-muted" />
          </span>
          <p className="text-[16px] font-semibold text-ink mb-1.5">No messages yet</p>
          <p className="text-sm text-text-muted">Tap "Chat" on a product or seller page to start a conversation.</p>
        </div>
      ) : (
        <div className="bg-white border border-border rounded-2xl overflow-hidden flex h-[560px] max-h-[70vh]">
          <div className={`w-full sm:w-[280px] shrink-0 border-r border-border overflow-y-auto ${active ? 'hidden sm:block' : 'block'}`}>
            {conversations.map((c) => {
              const last = c.messages[c.messages.length - 1];
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveId(c.id)}
                  className={`cursor-pointer w-full text-left px-4 py-3.5 border-b border-border flex items-center gap-3 transition-colors ${
                    activeId === c.id ? 'bg-green-tint' : 'hover:bg-surface-muted'
                  }`}
                >
                  <span className="w-9 h-9 rounded-full bg-green-tint flex items-center justify-center shrink-0 font-display text-sm font-bold text-green">
                    {c.sellerName?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-[13.5px] text-ink truncate">{c.sellerName}</span>
                    <span className="block text-xs text-text-muted truncate">{last ? last.text : 'No messages yet'}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className={`flex-1 min-w-0 flex-col ${active ? 'flex' : 'hidden sm:flex'}`}>
            {!active ? (
              <div className="flex-1 flex items-center justify-center text-sm text-text-muted">Select a conversation</div>
            ) : (
              <>
                <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveId(null)}
                    aria-label="Back to conversations"
                    className="sm:hidden cursor-pointer text-text-muted hover:text-ink p-1"
                  >
                    <IconChevronLeft width="18" height="18" />
                  </button>
                  <span className="font-semibold text-[14px] text-ink">{active.sellerName}</span>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
                  {active.messages.length === 0 && (
                    <p className="text-sm text-text-muted text-center my-auto">Say hi to {active.sellerName} to start the conversation.</p>
                  )}
                  {active.messages.map((m) => (
                    <div key={m.id} className={`max-w-[75%] ${m.from === 'buyer' ? 'self-end items-end' : 'self-start items-start'} flex flex-col`}>
                      <div
                        className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          m.from === 'buyer' ? 'bg-green text-white rounded-br-sm' : 'bg-surface-muted text-ink rounded-bl-sm'
                        }`}
                      >
                        {m.text}
                      </div>
                      <span className="text-[10px] text-text-muted mt-1 px-1">{formatTime(m.at)}</span>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage();
                  }}
                  className="flex items-center gap-2 px-4 py-3 border-t border-border shrink-0"
                >
                  <input
                    type="text"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder={`Message ${active.sellerName}…`}
                    className="flex-1 px-3.5 py-2.5 border border-border rounded-full text-sm outline-none focus:border-green bg-white"
                  />
                  <button
                    type="submit"
                    disabled={!draft.trim()}
                    className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 bg-green hover:bg-green-hover text-white font-semibold text-sm px-5 py-2.5 rounded-full transition-colors"
                  >
                    Send
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
