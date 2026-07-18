import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Listen on all network interfaces (not just localhost) so other devices on the same
    // Wi-Fi — a phone, another laptop — can reach the dev server via this machine's LAN IP.
    host: true,
    proxy: {
      // Forwards to the real backend (see /server) as if it were same-origin — this is what
      // lets the guest-cart cookie and CORS work in dev without any extra config, and keeps
      // every relative '/api/...' call in src/lib/api.js unchanged.
      '/api': { target: 'http://localhost:5000', changeOrigin: true },
      '/uploads': { target: 'http://localhost:5000', changeOrigin: true },
    },
  },
})
