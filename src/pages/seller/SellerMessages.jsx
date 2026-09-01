import { useCallback, useEffect, useRef, useState } from 'react';
import { loadConversations, markSellerRead, sendSellerMessage } from '../../lib/sellerMessagesStore';
import { IconChevronLeft, IconMessageCircle } from '../../components/icons';

// Cross-device delivery (a buyer messaging from their own device/browser) has no push channel
// yet, so this polls instead — see server/src/models/Conversation.js for the actual persistence.
const POLL_MS = 6000;

function formatTime(at) {
  return new Date(at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// Seller side of the buyer<->seller chat — see src/lib/sellerMessagesStore.js.
export default function SellerMessages() {
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
        // Silent — this is a background poll, not the seller's own action.
      });
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    loadConversations()
      .then((all) => setConversations(all))
      .catch((err) => setError(err.message || 'Could not load your messages right now.'))
      .finally(() => setLoading(false));
  }, []);

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
    markSellerRead(id)
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
      const conv = await sendSellerMessage(active.id, text);
      setConversations((prev) => prev.map((c) => (c.id === conv.id ? conv : c)));
    } catch (err) {
      setError(err.message || 'Could not send that message.');
      setDraft(text);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="animate-fade-up">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-ink tracking-tight">Messages</h1>
        <p className="text-sm text-text mt-1">Chat with buyers about your listings and orders.</p>
      </div>

      {loading ? (
        <div className="bg-white border border-border rounded-2xl h-[560px] max-h-[70vh] animate-pulse" />
      ) : error && conversations.length === 0 ? (
        <div className="bg-white border border-dashed border-border-strong rounded-2xl p-10 text-center">
          <p className="text-sm text-orange-text">{error}</p>
        </div>
      ) : conversations.length === 0 ? (
        <div className="bg-white border border-dashed border-border-strong rounded-2xl p-10 text-center">
          <span className="w-14 h-14 rounded-full bg-green-tint inline-flex items-center justify-center mb-4">
            <IconMessageCircle width="24" height="24" className="text-green" />
          </span>
          <p className="text-sm text-text">No conversations yet.</p>
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
                  onClick={() => openConversation(c.id)}
                  className={`cursor-pointer w-full text-left px-4 py-3.5 border-b border-border flex items-center gap-3 transition-colors ${
                    activeId === c.id ? 'bg-green-tint' : 'hover:bg-surface-muted'
                  }`}
                >
                  <span className="w-9 h-9 rounded-full bg-green-tint flex items-center justify-center shrink-0 font-display text-sm font-bold text-green">
                    {c.buyerCompany.charAt(0)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-[13.5px] text-ink truncate">{c.buyerCompany}</span>
                      {c.unread > 0 && (
                        <span className="shrink-0 w-4.5 h-4.5 min-w-[18px] rounded-full bg-orange text-white text-[10px] font-bold flex items-center justify-center px-1">
                          {c.unread}
                        </span>
                      )}
                    </span>
                    <span className="block text-xs text-text-muted truncate">{last?.text}</span>
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
                  <span className="font-semibold text-[14px] text-ink">{active.buyerCompany}</span>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
                  {active.messages.map((m, i) => (
                    <div key={i} className={`max-w-[75%] ${m.from === 'seller' ? 'self-end items-end' : 'self-start items-start'} flex flex-col`}>
                      <div
                        className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          m.from === 'seller' ? 'bg-green text-white rounded-br-sm' : 'bg-surface-muted text-ink rounded-bl-sm'
                        }`}
                      >
                        {m.text}
                      </div>
                      <span className="text-[10px] text-text-muted mt-1 px-1">{formatTime(m.at)}</span>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>

                {error && <p className="text-xs text-orange-text px-4 pb-1">{error}</p>}

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
                    placeholder="Type a message…"
                    disabled={sending}
                    className="flex-1 px-3.5 py-2.5 border border-border rounded-full text-sm outline-none focus:border-green bg-white disabled:opacity-60"
                  />
                  <button
                    type="submit"
                    disabled={!draft.trim() || sending}
                    className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 bg-green hover:bg-green-hover text-white font-semibold text-sm px-5 py-2.5 rounded-full transition-colors"
                  >
                    {sending ? 'Sending…' : 'Send'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
