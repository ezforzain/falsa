import { Link } from 'react-router-dom';
import { useNotifications } from '../context/NotificationsContext';
import { useLanguage } from '../context/LanguageContext';
import { IconBell, IconCart, IconHeart, IconUser, IconTrash } from '../components/icons';

const CATEGORY_ICON = { orders: IconCart, wishlist: IconHeart, account: IconUser };
const CATEGORY_TINT = {
  orders: 'bg-green-tint text-green',
  wishlist: 'bg-rose-50 text-rose-500',
  account: 'bg-orange-tint text-orange',
};

function timeAgo(ts) {
  const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

export default function NotificationsPage() {
  const { feed, unreadCount, markRead, markAllRead, clearAll } = useNotifications();
  const { t } = useLanguage();

  return (
    <main className="max-w-[720px] mx-auto px-4 sm:px-6 lg:px-10 pt-9 pb-20 animate-fade-up">
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <h1 className="font-display text-[28px] font-bold m-0 tracking-tight text-ink">{t('notificationsPage.title')}</h1>
        {feed.length > 0 && (
          <div className="flex items-center gap-1.5 pt-2 shrink-0">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="cursor-pointer text-[12.5px] font-semibold text-green hover:text-green-hover px-2.5 py-1 rounded-lg transition-colors"
              >
                {t('notificationsPage.markAllRead')}
              </button>
            )}
            <button
              type="button"
              onClick={clearAll}
              aria-label={t('notificationsPage.clearAll')}
              className="cursor-pointer text-text-muted hover:text-orange p-1.5 rounded-lg hover:bg-surface-muted transition-colors"
            >
              <IconTrash width="15" height="15" />
            </button>
          </div>
        )}
      </div>
      <Link to="/settings" className="text-[13px] text-text-muted hover:text-green transition-colors no-underline mb-7 inline-block">
        {t('notificationsPage.preferencesLink')} →
      </Link>

      {feed.length === 0 ? (
        <div className="text-center py-[60px] px-5 bg-surface border border-dashed border-border-strong rounded-2xl">
          <span className="w-14 h-14 rounded-full bg-surface-muted inline-flex items-center justify-center mb-5">
            <IconBell width="22" height="22" className="text-text-muted" />
          </span>
          <p className="text-[16px] font-semibold text-ink mb-1.5">{t('notificationsPage.emptyTitle')}</p>
          <p className="text-sm text-text-muted max-w-[420px] mx-auto">{t('notificationsPage.emptyDesc')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {feed.map((n) => {
            const Icon = CATEGORY_ICON[n.category] || IconBell;
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => markRead(n.id)}
                className={`relative flex items-start gap-3 text-left rounded-xl border px-4 py-3.5 cursor-pointer transition-colors ${
                  n.read ? 'bg-surface border-border' : 'bg-green-tint/40 border-green-tint-border'
                }`}
              >
                <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${CATEGORY_TINT[n.category] || 'bg-surface-muted text-text-muted'}`}>
                  <Icon width="16" height="16" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-[13.5px] font-semibold text-ink">{n.title}</span>
                    {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-orange shrink-0" />}
                  </span>
                  <span className="block text-[12.5px] text-text-muted mt-0.5 leading-snug">{n.body}</span>
                  <span className="block text-[11px] text-text-muted mt-1">{timeAgo(n.createdAt)}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </main>
  );
}
