import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { CartProvider } from './context/CartContext.jsx'
import { WishlistProvider } from './context/WishlistContext.jsx'
import { ProfileDrawerProvider } from './context/ProfileDrawerContext.jsx'
import { AppSettingsProvider } from './context/AppSettingsContext.jsx'
import { LanguageProvider } from './context/LanguageContext.jsx'
import { NotificationsProvider } from './context/NotificationsContext.jsx'

// Clears out any leftover service worker that isn't our own (e.g. the mock API worker earlier
// builds registered, back when the app talked to a mocked backend in-browser instead of the
// real one — see vite.config.js) before registering the current one, so a stale worker from an
// old visit never keeps serving outdated responses or blocks the real one from taking over.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    const stale = registrations.filter((r) => !r.active?.scriptURL.endsWith('/sw.js'));
    if (stale.length === 0) return;
    Promise.all(stale.map((r) => r.unregister())).then(() => {
      if (!sessionStorage.getItem('falsafahtot_sw_cleanup_reload')) {
        sessionStorage.setItem('falsafahtot_sw_cleanup_reload', '1');
        window.location.reload();
      }
    });
  });

  // Only in production builds — the dev server has no need for an offline fallback, and a
  // worker intercepting navigations during local development would just get in Vite's way.
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Non-critical — the app works identically without offline support, it just won't
        // show the branded offline page if the network drops.
      });
    });
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppSettingsProvider>
          <LanguageProvider>
            <NotificationsProvider>
              <CartProvider>
                <WishlistProvider>
                  <ProfileDrawerProvider>
                    <App />
                  </ProfileDrawerProvider>
                </WishlistProvider>
              </CartProvider>
            </NotificationsProvider>
          </LanguageProvider>
        </AppSettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
