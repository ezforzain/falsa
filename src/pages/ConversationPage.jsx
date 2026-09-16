import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  deleteBuyerMessage,
  deleteConversation,
  loadConversation,
  markBuyerRead,
  sendBuyerMessage,
} from '../lib/buyerMessagesStore';
import ConfirmDialog from '../components/ConfirmDialog';
import Avatar from '../components/Avatar';
import { IconChevronLeft, IconSend, IconTrash } from '../components/icons';

const POLL_MS = 6000;
const MAX_COMPOSER_HEIGHT = 120; // px — beyond this the textarea scrolls internally instead of growing further

function formatBubbleTime(at) {
  return new Date(at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

// Full-screen conversation view — its own route (/messenger/:id) rather than a panel inside
// MessengerPage, so opening a chat is real navigation (proper back button/history, and a
// completely bare screen with no Header/BottomNavBar to fight the keyboard for space — see
// MainLayout's isMobileConversation branch). Root is a fixed h-[100dvh] flex column with the
// composer as the LAST flex child rather than position:fixed; combined with Capacitor's Keyboard
// plugin (resize: 'body', capacitor.config.json) actually shrinking the native WebView when the
// keyboard opens, that's what keeps the composer sitting right above the keyboard instead of
// being covered by it or jumping around — no manual keyboard-height tracking needed.
export default function ConversationPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [conversation, setConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [revealedIndex, setRevealedIndex] = useState(null); // which of MY OWN bubbles shows its delete affordance
  const [messageDeleteTarget, setMessageDeleteTarget] = useState(null); // { index, text }
  const [confirmDeleteChat, setConfirmDeleteChat] = useState(false);
  const [deletingChat, setDeletingChat] = useState(false);
  const [deletingMessage, setDeletingMessage] = useState(false);

  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  // While this screen is open, any new message that arrives via poll is already "seen" — mark
  // it read right away instead of leaving an unread badge on a conversation the buyer is
  // actively looking at (it would otherwise only clear on the *next* mount/open).
  const refresh = useCallback(() => {
    loadConversation(id)
      .then((conv) => {
        setConversation(conv);
        if (conv.unread > 0) {
          markBuyerRead(id)
            .then((updated) => setConversation(updated))
            .catch(() => {});
        }
      })
      .catch(() => {
        // Silent — background poll.
      });
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    loadConversation(id)
      .then((conv) => {
        if (cancelled) return;
        setConversation(conv);
        if (conv.unread > 0) {
          markBuyerRead(id)
            .then((updated) => !cancelled && setConversation(updated))
            .catch(() => {});
        }
      })
      .catch((err) => !cancelled && setLoadError(err.message || 'Could not open this conversation.'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    const interval = setInterval(refresh, POLL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [conversation?.messages?.length]);

  // Auto-grow the composer as the buyer types, capped so a long message scrolls internally
  // instead of pushing the send button/header off screen.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, MAX_COMPOSER_HEIGHT)}px`;
  }, [draft]);

  const sendMessage = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setDraft('');
    setSending(true);
    setSendError(null);
    try {
      const conv = await sendBuyerMessage(id, text);
      setConversation(conv);
    } catch (err) {
      setSendError(err.message || 'Could not send that message.');
      setDraft(text);
    } finally {
      setSending(false);
    }
  };

  const confirmDeleteMessage = async () => {
    if (!messageDeleteTarget) return;
    setDeletingMessage(true);
    try {
      const conv = await deleteBuyerMessage(id, messageDeleteTarget.index);
      setConversation(conv);
      setMessageDeleteTarget(null);
      setRevealedIndex(null);
    } catch (err) {
      setSendError(err.message || 'Could not delete that message.');
    } finally {
      setDeletingMessage(false);
    }
  };

  const confirmDeleteWholeChat = async () => {
    setDeletingChat(true);
    try {
      await deleteConversation(id);
      navigate('/messenger', { replace: true });
    } catch (err) {
      setSendError(err.message || 'Could not delete this conversation.');
      setDeletingChat(false);
      setConfirmDeleteChat(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[100dvh] flex flex-col bg-surface" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="h-[60px] border-b border-border animate-pulse shrink-0" />
        <div className="flex-1" />
      </div>
    );
  }

  if (loadError || !conversation) {
    return (
      <div
        className="h-[100dvh] flex flex-col items-center justify-center gap-4 bg-surface px-6 text-center"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <p className="text-sm text-orange-text">{loadError || 'Conversation not found.'}</p>
        <Link to="/messenger" className="text-sm font-semibold text-green hover:underline no-underline">
          Back to Messages
        </Link>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-surface" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      {/* Header — back button, seller identity (links to their store), delete-chat action. */}
      <div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-border shrink-0 bg-surface">
        <button
          type="button"
          onClick={() => navigate('/messenger')}
          aria-label="Back to conversations"
          className="cursor-pointer text-ink-soft hover:text-ink p-1.5 -ml-1 rounded-full hover:bg-surface-muted transition-colors shrink-0"
        >
          <IconChevronLeft width="20" height="20" />
        </button>
        <Link
          to={`/store/${conversation.sellerId}`}
          className="flex items-center gap-2.5 min-w-0 flex-1 no-underline text-inherit"
        >
          <Avatar src={conversation.sellerLogoUrl} name={conversation.sellerName} size={38} />
          <span className="font-semibold text-[14.5px] text-ink truncate">{conversation.sellerName}</span>
        </Link>
        <button
          type="button"
          onClick={() => setConfirmDeleteChat(true)}
          aria-label="Delete conversation"
          className="cursor-pointer w-9 h-9 rounded-full flex items-center justify-center text-text-muted hover:text-orange-text hover:bg-orange-tint transition-colors shrink-0"
        >
          <IconTrash width="17" height="17" />
        </button>
      </div>

      {/* Messages — flex-1 so it's the only thing that shrinks/scrolls when the keyboard opens. */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-5 py-4 flex flex-col gap-2.5 bg-surface-muted/40">
        {conversation.messages.length === 0 && (
          <p className="text-sm text-text-muted text-center my-auto px-6">Say hi to {conversation.sellerName} to start the conversation.</p>
        )}
        {conversation.messages.map((m) => {
          const isMine = m.from === 'buyer';
          const revealed = isMine && revealedIndex === m.index;
          return (
            <div key={m.index} className={`max-w-[82%] sm:max-w-[70%] flex flex-col ${isMine ? 'self-end items-end' : 'self-start items-start'}`}>
              <div className="flex items-center gap-1.5">
                {isMine && revealed && (
                  <button
                    type="button"
                    onClick={() => setMessageDeleteTarget({ index: m.index, text: m.text })}
                    aria-label="Delete message"
                    className="cursor-pointer shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-orange-text bg-orange-tint hover:bg-orange/20 transition-colors animate-fade-up"
                  >
                    <IconTrash width="13" height="13" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => isMine && setRevealedIndex((cur) => (cur === m.index ? null : m.index))}
                  className={`text-left cursor-pointer px-3.5 py-2.5 rounded-[18px] text-sm leading-relaxed shadow-[0_1px_2px_rgba(0,0,0,0.05)] ${
                    isMine ? 'bg-green text-white rounded-br-md' : 'bg-surface text-ink rounded-bl-md'
                  }`}
                >
                  {m.text}
                </button>
              </div>
              <span className="text-[10px] text-text-muted mt-1 px-1">{formatBubbleTime(m.at)}</span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {sendError && <p className="text-xs text-orange-text px-4 sm:px-5 pb-1 bg-surface-muted/40 shrink-0">{sendError}</p>}

      {/* Composer — last flex child, never position:fixed, so it can't overlap or get covered. */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
        className="flex items-end gap-2.5 px-3 sm:px-4 py-2.5 border-t border-border shrink-0 bg-surface"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 10px)' }}
      >
        <textarea
          ref={textareaRef}
          rows={1}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder={`Message ${conversation.sellerName}…`}
          disabled={sending}
          className="flex-1 min-w-0 resize-none px-4 py-2.5 border border-border rounded-[22px] text-sm leading-normal outline-none focus:border-green bg-surface-muted disabled:opacity-60"
          style={{ maxHeight: MAX_COMPOSER_HEIGHT }}
        />
        <button
          type="submit"
          aria-label="Send message"
          disabled={!draft.trim() || sending}
          className="shrink-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 bg-green hover:bg-green-hover text-white w-11 h-11 rounded-full transition-colors flex items-center justify-center"
        >
          <IconSend width="17" height="17" />
        </button>
      </form>

      <ConfirmDialog
        open={!!messageDeleteTarget}
        title="Delete this message?"
        message="This will remove the message from the conversation."
        confirmLabel="Delete"
        loading={deletingMessage}
        onCancel={() => setMessageDeleteTarget(null)}
        onConfirm={confirmDeleteMessage}
      />
      <ConfirmDialog
        open={confirmDeleteChat}
        title="Delete this conversation?"
        message={`Your chat with ${conversation.sellerName} will be removed from your Messages.`}
        confirmLabel="Delete"
        loading={deletingChat}
        onCancel={() => setConfirmDeleteChat(false)}
        onConfirm={confirmDeleteWholeChat}
      />
    </div>
  );
}
