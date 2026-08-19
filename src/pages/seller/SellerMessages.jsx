import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { seller } from '../../lib/api';
import { loadOrSeedConversations, saveConversations } from '../../lib/sellerMessagesStore';
import { IconChevronLeft, IconMessageCircle } from '../../components/icons';

function formatTime(at) {
  return new Date(at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// Demo buyer/seller chat — see src/lib/sellerMessagesStore.js for why this is localStorage-backed
// rather than a real messaging backend. Conversations seed from this seller's actual customers
// (see SellerCustomers/GET /api/seller/customers) when there are any, so it doesn't feel random.
export default function SellerMessages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [draft, setDraft] = useState('');
  const bottomRef = useRef(null);
  // Guards the persistence effect below from firing on the initial (already-persisted) load —
  // only writes back to storage once the seller actually changes something.
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (!user?.id) return;
    seller
      .customers()
      .then((res) => {
        const names = res.customers.map((c) => c.buyerCompany);
        setConversations(loadOrSeedConversations(user.id, names));
      })
      .catch(() => setConversations(loadOrSeedConversations(user.id)))
      .finally(() => {
        hasLoadedRef.current = true;
      });
  }, [user?.id]);

  // Persisting here (rather than inline in the state updaters below) keeps the localStorage
  // write + cross-component event dispatch out of the render phase, where React can invoke a
  // state updater more than once and warn about setState-during-render in SellerLayout.
  useEffect(() => {
    if (!hasLoadedRef.current) return;
    saveConversations(user.id, conversations);
  }, [user?.id, conversations]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'nearest' });
  }, [activeId, conversations]);

  const active = conversations.find((c) => c.id === activeId) || null;

  const openConversation = (id) => {
    setActiveId(id);
    setConversations((current) => current.map((c) => (c.id === id ? { ...c, unread: 0 } : c)));
  };

  const sendMessage = () => {
    const text = draft.trim();
    if (!text || !active) return;
    const message = { id: `${active.id}_${Date.now()}`, from: 'seller', text, at: Date.now() };
    setConversations((current) => current.map((c) => (c.id === active.id ? { ...c, messages: [...c.messages, message] } : c)));
    setDraft('');
  };

  return (
    <div className="animate-fade-up">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-ink tracking-tight">Messages</h1>
        <p className="text-sm text-text mt-1">Chat with buyers about your listings and orders.</p>
      </div>

      {conversations.length === 0 ? (
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
                  {active.messages.map((m) => (
                    <div key={m.id} className={`max-w-[75%] ${m.from === 'seller' ? 'self-end items-end' : 'self-start items-start'} flex flex-col`}>
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
    </div>
  );
}
