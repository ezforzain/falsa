import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { CartProvider } from './context/CartContext.jsx'
import { ProfileDrawerProvider } from './context/ProfileDrawerContext.jsx'

// The app now talks to the real Node/Express/MongoDB backend in /server (proxied by Vite —
// see vite.config.js) instead of the MSW mocks that used to intercept /api/* in-browser.
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
