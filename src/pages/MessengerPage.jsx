import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getOrCreateConversation, loadConversations, markBuyerRead, sendBuyerMessage } from '../lib/buyerMessagesStore';
import { IconArrowRight, IconChevronLeft, IconMessageCircle } from '../components/icons';

// Cross-device delivery (a seller replying from their own device/browser) has no push channel
// yet, so this polls instead — see server/src/models/Conversation.js for the actual persistence.
const POLL_MS = 6000;

function formatTime(at) {
  return new Date(at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// Buyer-side counterpart to seller/SellerMessages.jsx. Arriving here via a product or
// seller-info page's "Chat" button (see ChatButton) passes { sellerId, sellerName } in router
// state, which opens straight into that seller's thread instead of the plain conversation list.
export default function MessengerPage() {
  const { user } = useAuth();
  const location = useLocation();
  const buyerName = user?.companyName || 'Guest buyer';

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const refresh = useCallback(() => {
    loadConversations()
      .then((all) => setConversations(all))
      .catch(() => {
        // Silent — this is a background poll, not the user's own action.
      });
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const targetSeller = location.state?.sellerId ? { id: location.state.sellerId, name: location.state.sellerName } : null;
    const initial = targetSeller
      ? getOrCreateConversation(targetSeller, buyerName).then((conversation) => {
          if (!cancelled) setActiveId(conversation.id);
          return loadConversations();
        })
      : loadConversations();

    initial
      .then((all) => {
        if (!cancelled) setConversations(all);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Could not load your messages right now.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // Only re-run when the incoming seller target actually changes — not on every conversations update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state?.sellerId]);

  useEffect(() => {
    const interval = setInterval(refresh, POLL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'nearest' });
  }, [activeId, conversations]);

  const active = conversations.find((c) => c.id === activeId) || null;

  const openConversation = (id) => {
    setActiveId(id);
    markBuyerRead(id)
      .then((conv) => setConversations((prev) => prev.map((c) => (c.id === conv.id ? conv : c))))
      .catch(() => {});
  };

  const sendMessage = async () => {
    const text = draft.trim();
    if (!text || !active || sending) return;
    setDraft('');
    setSending(true);
    setError(null);
    try {
      const conv = await sendBuyerMessage(active.id, text);
      setConversations((prev) => prev.map((c) => (c.id === conv.id ? conv : c)));
    } catch (err) {
      setError(err.message || 'Could not send that message.');
      setDraft(text);
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-10 pt-6 sm:pt-9 pb-10 animate-fade-up">
      <div className="flex items-center gap-3 mb-2">
        <span className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-green-tint flex items-center justify-center shrink-0">
          <IconMessageCircle width="20" height="20" className="text-green" strokeWidth={2} />
        </span>
        <h1 className="font-display text-[22px] sm:text-[28px] font-bold text-ink m-0 tracking-tight">Messages</h1>
      </div>
      <p className="text-sm text-text-muted mb-6 sm:mb-8 max-w-[440px] leading-relaxed">
        Chat with sellers about your orders and products.
      </p>

      {loading ? (
        <div className="bg-surface border border-border rounded-3xl h-[65vh] sm:h-[600px] max-h-[70vh] animate-pulse" />
      ) : error && conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center bg-surface border border-border/70 rounded-3xl shadow-[0_2px_16px_rgba(0,0,0,0.04)] px-6 py-12 h-[65vh] sm:h-[600px] max-h-[70vh]">
          <span className="w-16 h-16 rounded-full bg-orange-tint flex items-center justify-center mb-5">
            <IconMessageCircle width="26" height="26" className="text-orange-text" strokeWidth={1.75} />
          </span>
          <p className="text-sm text-orange-text max-w-[320px]">{error}</p>
        </div>
      ) : conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center bg-surface border border-border/70 rounded-3xl shadow-[0_2px_16px_rgba(0,0,0,0.04)] px-6 py-12 h-[65vh] sm:h-[600px] max-h-[70vh]">
          <div className="relative mb-6">
            <span className="absolute inset-0 -m-4 rounded-full bg-green-tint/50" aria-hidden="true" />
            <span className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-green-tint flex items-center justify-center">
              <IconMessageCircle width="32" height="32" className="text-green" strokeWidth={1.6} />
            </span>
          </div>
          <p className="font-display text-lg sm:text-xl font-bold text-ink mb-2">No messages yet</p>
          <p className="text-sm text-text-muted max-w-[300px] mb-8 leading-relaxed">
            Start a conversation with a seller about your order or product.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 cursor-pointer bg-green hover:bg-green-hover text-white font-semibold text-sm px-6 py-3.5 rounded-full shadow-[0_8px_20px_-6px_rgba(14,90,70,0.5)] transition-colors no-underline"
          >
            <IconMessageCircle width="16" height="16" />
            Start a Chat
          </Link>
        </div>
      ) : (
        <div className="bg-surface border border-border/70 rounded-3xl shadow-[0_2px_16px_rgba(0,0,0,0.05)] overflow-hidden flex h-[65vh] sm:h-[600px] max-h-[75vh]">
          <div className={`w-full sm:w-[300px] shrink-0 sm:border-r border-border overflow-y-auto p-2 ${active ? 'hidden sm:block' : 'block'}`}>
            {conversations.map((c) => {
              const last = c.messages[c.messages.length - 1];
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => openConversation(c.id)}
                  className={`cursor-pointer w-full text-left px-3 py-3 rounded-2xl flex items-center gap-3 transition-colors mb-1 ${
                    activeId === c.id ? 'bg-green-tint' : 'hover:bg-surface-muted'
                  }`}
                >
                  <span className="w-11 h-11 rounded-full bg-green-tint flex items-center justify-center shrink-0 font-display text-[15px] font-bold text-green">
                    {c.sellerName?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-[13.5px] text-ink truncate">{c.sellerName}</span>
                      {c.unread > 0 && (
                        <span className="shrink-0 min-w-[18px] h-[18px] rounded-full bg-orange text-white text-[10px] font-bold flex items-center justify-center px-1">
                          {c.unread}
                        </span>
                      )}
                    </span>
                    <span className="block text-xs text-text-muted truncate mt-0.5">{last ? last.text : 'No messages yet'}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className={`flex-1 min-w-0 flex-col bg-surface ${active ? 'flex' : 'hidden sm:flex'}`}>
            {!active ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-sm text-text-muted">
                <span className="w-14 h-14 rounded-full bg-surface-muted flex items-center justify-center">
                  <IconMessageCircle width="24" height="24" className="text-text-muted" strokeWidth={1.6} />
                </span>
                Select a conversation
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 px-4 sm:px-5 py-3.5 border-b border-border shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveId(null)}
                    aria-label="Back to conversations"
                    className="sm:hidden cursor-pointer text-text-muted hover:text-ink -ml-1 p-1.5 rounded-full hover:bg-surface-muted transition-colors"
                  >
                    <IconChevronLeft width="18" height="18" />
                  </button>
                  <span className="w-9 h-9 rounded-full bg-green-tint flex items-center justify-center shrink-0 font-display text-[13px] font-bold text-green">
                    {active.sellerName?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                  <span className="font-semibold text-[14.5px] text-ink truncate">{active.sellerName}</span>
                </div>

                <div className="flex-1 overflow-y-auto px-3 sm:px-5 py-4 flex flex-col gap-2.5 bg-surface-muted/40">
                  {active.messages.length === 0 && (
                    <p className="text-sm text-text-muted text-center my-auto px-6">Say hi to {active.sellerName} to start the conversation.</p>
                  )}
                  {active.messages.map((m, i) => (
                    <div key={i} className={`max-w-[80%] sm:max-w-[70%] ${m.from === 'buyer' ? 'self-end items-end' : 'self-start items-start'} flex flex-col`}>
                      <div
                        className={`px-3.5 py-2.5 rounded-[18px] text-sm leading-relaxed shadow-[0_1px_2px_rgba(0,0,0,0.05)] ${
                          m.from === 'buyer' ? 'bg-green text-white rounded-br-md' : 'bg-surface text-ink rounded-bl-md'
                        }`}
                      >
                        {m.text}
                      </div>
                      <span className="text-[10px] text-text-muted mt-1 px-1">{formatTime(m.at)}</span>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>

                {error && <p className="text-xs text-orange-text px-4 sm:px-5 pb-1 bg-surface-muted/40">{error}</p>}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage();
                  }}
                  className="flex items-center gap-2.5 px-3 sm:px-4 py-3 border-t border-border shrink-0 bg-surface"
                >
                  <input
                    type="text"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder={`Message ${active.sellerName}…`}
                    disabled={sending}
                    className="flex-1 min-w-0 px-4 py-2.5 border border-border rounded-full text-sm outline-none focus:border-green bg-surface-muted disabled:opacity-60"
                  />
                  <button
                    type="submit"
                    aria-label="Send message"
                    disabled={!draft.trim() || sending}
                    className="shrink-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 bg-green hover:bg-green-hover text-white w-11 h-11 rounded-full transition-colors flex items-center justify-center"
                  >
                    <IconArrowRight width="18" height="18" />
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
