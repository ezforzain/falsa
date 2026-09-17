import { useCallback, useEffect, useRef, useState } from 'react';
import { deleteSellerMessage, loadConversations, markSellerRead, sendSellerMessage } from '../../lib/sellerMessagesStore';
import ConfirmDialog from '../../components/ConfirmDialog';
import MessageActionMenu from '../../components/MessageActionMenu';
import { useLongPress } from '../../hooks/useLongPress';
import { IconChevronLeft, IconMessageCircle, IconMoreVertical } from '../../components/icons';

// Cross-device delivery (a buyer messaging from their own device/browser) has no push channel
// yet, so this polls instead — see server/src/models/Conversation.js for the actual persistence.
const POLL_MS = 6000;

function formatTime(at) {
  return new Date(at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// A 0-size rect at the long-press point — see ConversationPage.jsx's identical helper (buyer
// side); kept separate here rather than shared since the two screens' bubble markup/theming
// otherwise doesn't overlap at all.
function pointRect(x, y) {
  return { top: y, bottom: y, left: x, right: x };
}

function SellerMessageBubble({ m, onOpenMenu }) {
  const isMine = m.from === 'seller';
  const bubbleRef = useRef(null);
  const longPress = useLongPress((e) => {
    const touch = e.touches?.[0] ?? e.changedTouches?.[0];
    onOpenMenu(m, touch ? pointRect(touch.clientX, touch.clientY) : bubbleRef.current?.getBoundingClientRect());
  });

  if (m.deleted) {
    return (
      <div className={`max-w-[75%] ${isMine ? 'self-end items-end' : 'self-start items-start'} flex flex-col`}>
        <div className="px-3.5 py-2.5 rounded-2xl text-sm italic text-text-muted bg-surface-muted border border-border/70">
          This message was deleted
        </div>
        <span className="text-[10px] text-text-muted mt-1 px-1">{formatTime(m.at)}</span>
      </div>
    );
  }

  return (
    <div className={`max-w-[75%] ${isMine ? 'self-end items-end' : 'self-start items-start'} flex flex-col`}>
      <div className={`group flex items-center gap-1 ${isMine ? 'flex-row' : 'flex-row-reverse'}`}>
        <button
          type="button"
          onClick={(e) => onOpenMenu(m, e.currentTarget.getBoundingClientRect())}
          aria-label="Message actions"
          className="cursor-pointer shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-text-muted opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:bg-surface-muted hover:text-ink transition-opacity"
        >
          <IconMoreVertical width="14" height="14" />
        </button>
        <button
          ref={bubbleRef}
          type="button"
          {...longPress}
          onContextMenu={(e) => {
            e.preventDefault();
            onOpenMenu(m, e.currentTarget.getBoundingClientRect());
          }}
          className={`select-none text-left cursor-pointer px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
            isMine ? 'bg-[var(--color-chat-me-bg,var(--color-green))] text-white rounded-br-sm' : 'bg-surface-muted text-ink rounded-bl-sm'
          }`}
        >
          {m.text}
        </button>
      </div>
      <span className="text-[10px] text-text-muted mt-1 px-1">{formatTime(m.at)}</span>
    </div>
  );
}

// Seller side of the buyer<->seller chat — see src/lib/sellerMessagesStore.js.
export default function SellerMessages() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [menuState, setMenuState] = useState(null); // { index, isMine, anchorRect, stage: 'root' | 'deleteChoice' }
  const [pendingDelete, setPendingDelete] = useState(null); // { index, scope: 'me' | 'everyone' }
  const [deletingMessage, setDeletingMessage] = useState(false);
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

  const openMessageMenu = (m, anchorRect) => {
    if (!anchorRect) return;
    setMenuState({ index: m.index, isMine: m.from === 'seller', anchorRect, stage: 'root' });
  };

  const chooseDeleteScope = (scope) => {
    if (!menuState) return;
    setPendingDelete({ index: menuState.index, scope });
  };

  const menuItems = !menuState
    ? []
    : menuState.stage === 'root'
    ? [
        {
          key: 'delete',
          label: 'Delete',
          danger: true,
          keepOpen: true,
          onSelect: () => setMenuState((s) => ({ ...s, stage: 'deleteChoice' })),
        },
      ]
    : [
        { key: 'me', label: 'Delete for me', onSelect: () => chooseDeleteScope('me') },
        ...(menuState.isMine
          ? [{ key: 'everyone', label: 'Delete for everyone', danger: true, onSelect: () => chooseDeleteScope('everyone') }]
          : []),
      ];

  const confirmDeleteMessage = async () => {
    if (!pendingDelete || !active) return;
    setDeletingMessage(true);
    try {
      const conv = await deleteSellerMessage(active.id, pendingDelete.index, pendingDelete.scope);
      setConversations((prev) => prev.map((c) => (c.id === conv.id ? conv : c)));
      setPendingDelete(null);
    } catch (err) {
      setError(err.message || 'Could not delete that message.');
    } finally {
      setDeletingMessage(false);
    }
  };

  return (
    <div className="animate-fade-up">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-ink tracking-tight">Messages</h1>
        <p className="text-sm text-text mt-1">Chat with buyers about your listings and orders.</p>
      </div>

      {loading ? (
        <div className="bg-surface border border-border rounded-2xl h-[560px] max-h-[70vh] animate-pulse" />
      ) : error && conversations.length === 0 ? (
        <div className="bg-surface border border-dashed border-border-strong rounded-2xl p-10 text-center">
          <p className="text-sm text-orange-text">{error}</p>
        </div>
      ) : conversations.length === 0 ? (
        <div className="bg-surface border border-dashed border-border-strong rounded-2xl p-10 text-center">
          <span className="w-14 h-14 rounded-full bg-green-tint inline-flex items-center justify-center mb-4">
            <IconMessageCircle width="24" height="24" className="text-green" />
          </span>
          <p className="text-sm text-text">No conversations yet.</p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden flex h-[560px] max-h-[70vh]">
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
                    <span className={`block text-xs text-text-muted truncate ${last?.deleted ? 'italic' : ''}`}>
                      {last?.deleted ? 'This message was deleted' : last?.text}
                    </span>
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
                    <SellerMessageBubble key={m.index} m={m} onOpenMenu={openMessageMenu} />
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
                    className="flex-1 px-3.5 py-2.5 border border-border rounded-full text-sm outline-none focus:border-green bg-surface disabled:opacity-60"
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

      <MessageActionMenu
        open={!!menuState}
        anchorRect={menuState?.anchorRect}
        items={menuItems}
        onClose={() => setMenuState(null)}
        themeClass="seller-portal"
      />

      <ConfirmDialog
        open={!!pendingDelete}
        title={pendingDelete?.scope === 'everyone' ? 'Delete for everyone?' : 'Delete this message?'}
        message={
          pendingDelete?.scope === 'everyone'
            ? 'This message will be removed for you and the buyer. This cannot be undone.'
            : 'This removes the message from your side of the chat only.'
        }
        confirmLabel="Delete"
        loading={deletingMessage}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDeleteMessage}
      />
    </div>
  );
}
