import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  deleteConversation,
  getOrCreateConversation,
  loadConversations,
  markBuyerRead,
} from '../lib/buyerMessagesStore';
import ConfirmDialog from '../components/ConfirmDialog';
import Avatar from '../components/Avatar';
import { IconChevronRight, IconMessageCircle, IconMoreVertical, IconSearch, IconTrash } from '../components/icons';
import logoMark from '../assets/logo-mark.png';

// Cross-device delivery (a seller replying from their own device/browser) has no push channel
// yet, so this polls instead — see server/src/models/Conversation.js for the actual persistence.
const POLL_MS = 6000;

function formatListTime(at) {
  if (!at) return '';
  const date = new Date(at);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

// Kebab ("more") menu on the top bar — a small self-contained dropdown, not worth pulling in
// ProfileDropdown's portal/positioning machinery for one lightweight action.
function HeaderMenu({ onMarkAllRead, hasUnread }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="More options"
        aria-haspopup="menu"
        aria-expanded={open}
        className="cursor-pointer w-9 h-9 rounded-full flex items-center justify-center text-ink hover:bg-surface-muted active:scale-95 transition-all"
      >
        <IconMoreVertical width="19" height="19" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-11 z-30 min-w-[190px] bg-surface border border-border rounded-2xl shadow-lg py-1.5 animate-fade-up"
        >
          <button
            type="button"
            role="menuitem"
            disabled={!hasUnread}
            onClick={() => {
              onMarkAllRead();
              setOpen(false);
            }}
            className="w-full text-left cursor-pointer disabled:cursor-not-allowed disabled:opacity-45 px-4 py-2.5 text-[13.5px] font-medium text-ink hover:bg-surface-muted transition-colors"
          >
            Mark all as read
          </button>
        </div>
      )}
    </div>
  );
}

function ConversationRow({ conversation, onDeleteRequest }) {
  const last = conversation.messages[conversation.messages.length - 1];
  const lastText = last?.deleted ? 'This message was deleted' : last?.text;
  const preview = last ? (last.from === 'buyer' ? `You: ${lastText}` : lastText) : 'No messages yet';

  return (
    <div className="relative">
      <Link
        to={`/messenger/${conversation.id}`}
        className="flex items-center gap-3 bg-surface border border-border rounded-2xl pl-3.5 pr-11 py-3 no-underline text-inherit hover:border-green/40 hover:bg-surface-muted active:scale-[0.99] transition-all"
      >
        <Avatar src={conversation.sellerLogoUrl} name={conversation.sellerName} size={50} />
        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-2">
            <span className="font-semibold text-[14.5px] text-ink truncate">{conversation.sellerName}</span>
            <span className="text-[11px] text-text-muted shrink-0">{last ? formatListTime(last.at) : ''}</span>
          </span>
          <span className="flex items-center justify-between gap-2 mt-0.5">
            <span className="text-[13px] text-text-muted truncate">{preview}</span>
            {conversation.unread > 0 && (
              <span className="shrink-0 min-w-[19px] h-[19px] px-1 rounded-full bg-green text-white text-[10.5px] font-bold flex items-center justify-center">
                {conversation.unread > 99 ? '99+' : conversation.unread}
              </span>
            )}
          </span>
        </span>
      </Link>
      <button
        type="button"
        onClick={() => onDeleteRequest(conversation)}
        aria-label={`Delete conversation with ${conversation.sellerName}`}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:text-orange-text hover:bg-orange-tint active:bg-orange-tint transition-colors"
      >
        <IconTrash width="15" height="15" />
      </button>
    </div>
  );
}

function MessagesIllustration() {
  // No exact source asset for the approved screenshot's illustration was provided — this is a
  // close approximation in the same palette/shape language (phone + chat bubbles), not a pixel
  // copy of that specific graphic.
  return (
    <div className="relative w-[220px] h-[180px] mx-auto mb-6">
      <span className="absolute inset-0 rounded-[50%] bg-green-tint/70" aria-hidden="true" />
      <span className="absolute left-3 top-8 w-14 h-10 rounded-2xl rounded-bl-sm bg-green flex items-center justify-center gap-1 shadow-md" aria-hidden="true">
        <span className="w-1.5 h-1.5 rounded-full bg-white/85" />
        <span className="w-1.5 h-1.5 rounded-full bg-white/85" />
        <span className="w-1.5 h-1.5 rounded-full bg-white/85" />
      </span>
      <span className="absolute right-4 top-4 w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center" aria-hidden="true">
        <IconMessageCircle width="15" height="15" className="text-green" />
      </span>
      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[108px] h-[150px] rounded-[22px] bg-ink shadow-xl p-[3px]">
        <span className="block w-full h-full rounded-[19px] bg-surface overflow-hidden flex flex-col">
          <span className="h-9 bg-green shrink-0 flex items-center gap-1.5 px-2.5">
            <span className="w-4 h-4 rounded-full bg-white/90" />
            <span className="w-10 h-1.5 rounded-full bg-white/60" />
          </span>
          <span className="flex-1 flex flex-col gap-1.5 px-2.5 py-2.5">
            <span className="w-[70%] h-2 rounded-full bg-surface-muted" />
            <span className="w-[55%] h-2 rounded-full self-end bg-green-tint" />
            <span className="w-[62%] h-2 rounded-full bg-surface-muted" />
          </span>
        </span>
      </span>
    </div>
  );
}

// Buyer-side counterpart to seller/SellerMessages.jsx. Arriving here via a product or
// seller-info page's "Chat" button (see ChatButton) passes { sellerId, sellerName } in router
// state — that seller's thread is opened straight away instead of leaving the buyer on the list.
export default function MessengerPage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const buyerName = user?.companyName || 'Guest buyer';

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

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

    if (targetSeller) {
      getOrCreateConversation(targetSeller, buyerName)
        .then((conversation) => {
          if (!cancelled) navigate(`/messenger/${conversation.id}`, { replace: true });
        })
        .catch((err) => {
          if (!cancelled) {
            setError(err.message || 'Could not open that chat right now.');
            setLoading(false);
          }
        });
      return () => {
        cancelled = true;
      };
    }

    loadConversations()
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

  const markAllRead = () => {
    const unreadOnes = conversations.filter((c) => c.unread > 0);
    setConversations((prev) => prev.map((c) => ({ ...c, unread: 0 })));
    unreadOnes.forEach((c) => markBuyerRead(c.id).catch(() => {}));
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteConversation(deleteTarget.id);
      setConversations((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err.message || 'Could not delete that conversation.');
    } finally {
      setDeleting(false);
    }
  };

  const hasUnread = conversations.some((c) => c.unread > 0);
  const isEmpty = !loading && !error && conversations.length === 0;

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Mobile: this page renders bare (no site Header — see MainLayout's bare-route list), so
          it carries its own top bar matching the approved design: logo, global search, and a
          "more" menu — rather than the generic desktop Header. */}
      <div className="md:hidden flex items-center justify-between gap-3 px-4 py-3 bg-surface border-b border-border shrink-0">
        <Link to="/" className="flex items-center gap-2 no-underline shrink-0">
          <img src={logoMark} alt="" className="w-8 h-8 object-contain" />
          <span className="font-display text-[19px] font-bold text-green tracking-tight">Falsafah</span>
        </Link>
        <div className="flex items-center gap-1 shrink-0">
          <Link
            to="/search"
            aria-label="Search"
            className="cursor-pointer w-9 h-9 rounded-full flex items-center justify-center text-ink hover:bg-surface-muted active:scale-95 transition-all"
          >
            <IconSearch width="18" height="18" />
          </Link>
          <HeaderMenu onMarkAllRead={markAllRead} hasUnread={hasUnread} />
        </div>
      </div>

      <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 sm:px-6 lg:px-10 pt-5 md:pt-9 pb-6">
        <div className="flex items-center gap-3 mb-1.5">
          <span className="w-11 h-11 rounded-2xl bg-green-tint flex items-center justify-center shrink-0">
            <IconMessageCircle width="20" height="20" className="text-green" strokeWidth={2} />
          </span>
          <h1 className="font-display text-[24px] sm:text-[28px] font-bold text-ink m-0 tracking-tight">Messages</h1>
        </div>
        <p className="text-sm text-text-muted mb-6 max-w-[440px] leading-relaxed">
          Chat with sellers about your orders and get quick support.
        </p>

        {loading ? (
          <div className="flex flex-col gap-2.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[74px] rounded-2xl bg-surface border border-border animate-pulse" />
            ))}
          </div>
        ) : error && conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center bg-surface border border-border/70 rounded-3xl px-6 py-14">
            <span className="w-16 h-16 rounded-full bg-orange-tint flex items-center justify-center mb-5">
              <IconMessageCircle width="26" height="26" className="text-orange-text" strokeWidth={1.75} />
            </span>
            <p className="text-sm text-orange-text max-w-[320px]">{error}</p>
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center text-center bg-surface border border-border/70 rounded-3xl px-6 py-12">
            <MessagesIllustration />
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
              <IconChevronRight width="16" height="16" />
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {error && <p className="text-xs text-orange-text px-1">{error}</p>}
            {conversations.map((c) => (
              <ConversationRow key={c.id} conversation={c} onDeleteRequest={setDeleteTarget} />
            ))}
          </div>
        )}
      </main>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this conversation?"
        message={deleteTarget ? `Your chat with ${deleteTarget.sellerName} will be removed from your Messages.` : ''}
        confirmLabel="Delete"
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
