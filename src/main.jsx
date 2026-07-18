import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { CartProvider } from './context/CartContext.jsx'
import { ProfileDrawerProvider } from './context/ProfileDrawerContext.jsx'

// One-time cleanup: earlier builds of this app registered a mock service worker (MSW) to
// intercept /api/* calls in-browser. The app now talks to the real backend directly (see
// vite.config.js), but a service worker installed by an earlier visit keeps running — and
// keeps serving stale mock responses — until it's explicitly unregistered; new code alone
// doesn't remove it. This clears any leftover registration and reloads once so the real
// network requests take over immediately instead of on the next hard refresh.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    if (registrations.length === 0) return;
    Promise.all(registrations.map((r) => r.unregister())).then(() => {
      if (!sessionStorage.getItem('falsafahtot_sw_cleanup_reload')) {
        sessionStorage.setItem('falsafahtot_sw_cleanup_reload', '1');
        window.location.reload();
      }
    });
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <ProfileDrawerProvider>
            <App />
          </ProfileDrawerProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
