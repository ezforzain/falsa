import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { CartProvider } from './context/CartContext.jsx'

function renderApp() {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </StrictMode>,
  )
}

// This app has no real backend — MSW *is* the backend, mocking every /api/* endpoint
// (auth, catalog, cart) at the network level so requests show up as real fetches in
// devtools. It must be running before the app's first render, or that first render's
// fetches would race the worker and fail.
async function enableMocking() {
  const { worker } = await import('./mocks/browser.js')
  await worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: { url: '/mockServiceWorker.js' },
  })
  return Boolean(navigator.serviceWorker.controller)
}

enableMocking().then((controlled) => {
  if (controlled) {
    sessionStorage.removeItem('msw-reload-attempted')
    renderApp()
    return
  }
  // Known MSW/browser gotcha: worker.start() can resolve before the Service Worker
  // actually takes control of THIS page load (most common right after a hard/force
  // reload, which browsers deliberately route around the SW for that one navigation).
  // Any /api/* fetch made before control is established falls through to the real
  // network and 404s. A single reload fixes it, since the worker is already active
  // by then. Guarded with sessionStorage so a genuinely broken SW can't loop forever.
  if (!sessionStorage.getItem('msw-reload-attempted')) {
    sessionStorage.setItem('msw-reload-attempted', '1')
    window.location.reload()
  } else {
    renderApp()
  }
})
