import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { auth } from '../lib/api';
import { useAuth } from './AuthContext';

const NotificationsContext = createContext(null);
const PREFS_KEY = 'falsafahtot_notification_prefs';
const FEED_KEY = 'falsafahtot_notification_feed';
const MAX_FEED = 50;

const DEFAULT_PREFS = { master: true, orders: true, wishlist: true, account: true };

function readPrefs() {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed ? { ...DEFAULT_PREFS, ...parsed } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

function readFeed() {
  try {
    const raw = localStorage.getItem(FEED_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Notification Preferences (Settings page) + the feed they gate (Notifications page). Real app
// events call `notify(category, title, body)` from wherever they actually happen — order
// checkout, wishlist saves, sign-in — rather than this context inventing activity on its own;
// each call is dropped silently if the master switch or that category's toggle is off, so
// toggling a preference has an immediately observable effect the next time that action happens.
export function NotificationsProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [prefs, setPrefs] = useState(() => readPrefs());
  const [feed, setFeed] = useState(() => readFeed());
  const appliedAccountPrefs = useRef(false);
  // Mirrors `prefs` for `notify` to read synchronously without making the gating check itself
  // go through a setState updater (see notify below).
  const prefsRef = useRef(prefs);
  useEffect(() => {
    prefsRef.current = prefs;
  }, [prefs]);

  useEffect(() => {
    if (isAuthenticated && user?.notificationPreferences && !appliedAccountPrefs.current) {
      appliedAccountPrefs.current = true;
      setPrefs((prev) => ({ ...prev, ...user.notificationPreferences }));
    }
    if (!isAuthenticated) appliedAccountPrefs.current = false;
  }, [isAuthenticated, user?.notificationPreferences]);

  useEffect(() => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch {
      // Session-only if storage is unavailable.
    }
  }, [prefs]);

  useEffect(() => {
    try {
      localStorage.setItem(FEED_KEY, JSON.stringify(feed));
    } catch {
      // Session-only if storage is unavailable.
    }
  }, [feed]);

  const setPref = useCallback(
    (key, val) => {
      setPrefs((prev) => {
        const next = { ...prev, [key]: val };
        if (isAuthenticated) {
          auth.updatePreferences({ notificationPreferences: { [key]: val } }).catch(() => {
            // Best-effort — the toggle already applied locally.
          });
        }
        return next;
      });
    },
    [isAuthenticated]
  );

  const notify = useCallback((category, title, body) => {
    const current = prefsRef.current;
    if (!current.master || current[category] === false) return;
    setFeed((prevFeed) =>
      [
        { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, category, title, body, read: false, createdAt: Date.now() },
        ...prevFeed,
      ].slice(0, MAX_FEED)
    );
  }, []);

  const markRead = useCallback((id) => {
    setFeed((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllRead = useCallback(() => {
    setFeed((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => setFeed([]), []);

  const unreadCount = useMemo(() => feed.filter((n) => !n.read).length, [feed]);

  const value = { prefs, setPref, notify, feed, markRead, markAllRead, clearAll, unreadCount };

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within a NotificationsProvider');
  return ctx;
}
