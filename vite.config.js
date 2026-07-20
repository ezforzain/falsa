import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import qrcode from 'qrcode-terminal'

// Prints a scannable QR code for the LAN URL every time the dev server starts, so there's
// never a chance of copying the wrong address (localhost/127.0.0.1 only work on this machine —
// a phone needs this machine's actual LAN IP). Reads Vite's own `resolvedUrls`, computed live
// from whatever host/port it actually bound to, instead of guessing or hardcoding an IP.
function qrCodePlugin() {
  return {
    name: 'lan-qr-code',
    configureServer(server) {
      const printUrls = server.printUrls.bind(server)
      server.printUrls = () => {
        printUrls()
        const networkUrl = server.resolvedUrls?.network?.[0]
        if (!networkUrl) {
          server.config.logger.warn(
            '\n  No LAN address detected — connect this machine to Wi-Fi/Ethernet to enable phone access.\n'
          )
          return
        }
        console.log('\n  Scan with your phone (same Wi-Fi network):\n')
        qrcode.generate(networkUrl, { small: true })
        console.log(`  ${networkUrl}\n`)
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), qrCodePlugin()],
  server: {
    // Listen on all network interfaces (not just localhost) so other devices on the same
    // Wi-Fi — a phone, another laptop — can reach the dev server via this machine's LAN IP.
    host: true,
    // Vite rejects requests with an unrecognized Host header by default (DNS-rebinding
    // protection) — necessary to allow-list when tunneling through a public URL (e.g.
    // localtunnel, for testing on mobile data instead of the same Wi-Fi), since the tunnel's
    // hostname isn't this machine's own. Scoped to loca.lt's subdomains rather than `true`
    // (allow everything) to keep this no broader than it needs to be.
    allowedHosts: ['.loca.lt'],
    proxy: {
      // Forwards to the real backend (see /server) as if it were same-origin — this is what
      // lets the guest-cart cookie and CORS work in dev without any extra config, and keeps
      // every relative '/api/...' call in src/lib/api.js unchanged.
      '/api': { target: 'http://localhost:5000', changeOrigin: true },
      '/uploads': { target: 'http://localhost:5000', changeOrigin: true },
    },
  },
})
