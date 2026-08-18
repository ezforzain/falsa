import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AppSettingsContext = createContext(null);
const THEME_KEY = 'falsafahtot_theme'; // 'light' | 'dark' | 'system'
const MOTION_KEY = 'falsafahtot_reduce_motion';

function readTheme() {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === 'light' || v === 'dark' || v === 'system' ? v : 'system';
  } catch {
    return 'system';
  }
}

function readReduceMotion() {
  try {
    return localStorage.getItem(MOTION_KEY) === '1';
  } catch {
    return false;
  }
}

// Device-level display preferences (see SettingsPage's "App Settings" section) — deliberately
// local-only rather than synced to the account, same as most apps treat theme/motion as a
// per-device choice. Applying them is a CSS-variable/attribute flip on <html> rather than a
// prop threaded through every component: the app's whole color system is defined as Tailwind v4
// `@theme` custom properties (see index.css), so redefining them under `[data-theme="dark"]`
// re-themes every `bg-cream`/`text-ink`/etc. utility already in use, everywhere, for free.
export function AppSettingsProvider({ children }) {
  const [theme, setThemeState] = useState(() => readTheme());
  const [reduceMotion, setReduceMotionState] = useState(() => readReduceMotion());
  const [systemPrefersDark, setSystemPrefersDark] = useState(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e) => setSystemPrefersDark(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const resolvedTheme = theme === 'system' ? (systemPrefersDark ? 'dark' : 'light') : theme;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolvedTheme);
  }, [resolvedTheme]);

  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', reduceMotion);
  }, [reduceMotion]);

  const setTheme = (next) => {
    setThemeState(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // Session-only if storage is unavailable.
    }
  };

  const setReduceMotion = (next) => {
    setReduceMotionState(next);
    try {
      localStorage.setItem(MOTION_KEY, next ? '1' : '0');
    } catch {
      // Session-only if storage is unavailable.
    }
  };

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme, reduceMotion, setReduceMotion }),
    [theme, resolvedTheme, reduceMotion]
  );

  return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>;
}

export function useAppSettings() {
  const ctx = useContext(AppSettingsContext);
  if (!ctx) throw new Error('useAppSettings must be used within an AppSettingsProvider');
  return ctx;
}
