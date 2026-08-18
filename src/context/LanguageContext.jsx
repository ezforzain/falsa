import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { auth } from '../lib/api';
import { useAuth } from './AuthContext';
import { SUPPORTED_LANGUAGES, translations, resolvePath } from '../i18n/translations';

const LanguageContext = createContext(null);
const STORAGE_KEY = 'falsafahtot_language';

function readStored() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return SUPPORTED_LANGUAGES.some((l) => l.code === stored) ? stored : 'en';
  } catch {
    return 'en';
  }
}

// App-wide language + RTL handling. Persisted to localStorage immediately (works for guests),
// and mirrored to the signed-in user's account (so it follows them across devices) — see
// SettingsPage for the picker UI and server/src/routes/auth.routes.js's /preferences endpoint.
export function LanguageProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [language, setLanguageState] = useState(() => readStored());
  // True once we've applied the signed-in user's saved language for this session, so a later
  // profile refresh doesn't stomp on a change the user just made on this device.
  const appliedAccountLanguage = useRef(false);

  useEffect(() => {
    if (isAuthenticated && user?.language && !appliedAccountLanguage.current) {
      appliedAccountLanguage.current = true;
      if (user.language !== readStored()) setLanguageState(user.language);
    }
    if (!isAuthenticated) appliedAccountLanguage.current = false;
  }, [isAuthenticated, user?.language]);

  const activeLang = useMemo(
    () => SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0],
    [language]
  );

  useEffect(() => {
    document.documentElement.lang = activeLang.code;
    document.documentElement.dir = activeLang.dir;
  }, [activeLang]);

  const setLanguage = useCallback(
    (code) => {
      if (!SUPPORTED_LANGUAGES.some((l) => l.code === code)) return;
      setLanguageState(code);
      try {
        localStorage.setItem(STORAGE_KEY, code);
      } catch {
        // Storage unavailable — the setting still applies for this session.
      }
      if (isAuthenticated) {
        auth.updatePreferences({ language: code }).catch(() => {
          // Best-effort sync — the local UI has already switched, and it'll retry next change.
        });
      }
    },
    [isAuthenticated]
  );

  const t = useCallback(
    (path, fallback) => {
      const value = resolvePath(translations[activeLang.code], path) ?? resolvePath(translations.en, path);
      return value ?? fallback ?? path;
    },
    [activeLang.code]
  );

  const value = { language: activeLang.code, dir: activeLang.dir, languages: SUPPORTED_LANGUAGES, setLanguage, t };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
}
