import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'node:path';

import { attachUser } from './middleware/auth.js';
import { getLanAddress } from './utils/network.js';
import authRoutes from './routes/auth.routes.js';
import catalogRoutes from './routes/catalog.routes.js';
import cartRoutes from './routes/cart.routes.js';
import checkoutRoutes from './routes/checkout.routes.js';
import sellersRoutes from './routes/sellers.routes.js';
import sellerPortalRoutes from './routes/seller.routes.js';
import adminRoutes from './routes/admin.routes.js';
import uploadRoutes from './routes/upload.routes.js';

// True for any private-network/localhost address, on ANY port — covers a phone or another
// machine reaching this API via the same LAN IP the dev-server QR code points them to (whatever
// that IP happens to be: 192.168.x.x, 10.x.x.x, or 172.16-31.x.x), and covers every Vite dev
// port (5173, 5174, 5175, ...) Vite might land on when the default port is already taken —
// without needing CLIENT_ORIGIN updated by hand per port or per machine.
function isPrivateLanOrigin(origin) {
  try {
    const { hostname } = new URL(origin);
    return (
      hostname === 'localhost' ||
      /^127\./.test(hostname) ||
      /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(hostname)
    );
  } catch {
    return false;
  }
}

// CLIENT_ORIGIN may be a single origin or a comma-separated list (e.g. a production domain plus
// its www. variant, or multiple environments) — this is the only allow-list used in production,
// where the LAN-wildcard bypass below is disabled.
function getConfiguredOrigins() {
  const raw = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
  return raw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin(origin, callback) {
        // No Origin header (same-origin requests, curl, server-to-server) — always fine.
        if (!origin) return callback(null, true);
        if (getConfiguredOrigins().includes(origin)) return callback(null, true);
        // Outside production, also accept any localhost/private-LAN origin regardless of port,
        // so requests keep working no matter which port Vite happens to bind (5173, 5174, ...)
        // or which device on the LAN is making them. Production keeps the strict allow-list above.
        if (process.env.NODE_ENV !== 'production' && isPrivateLanOrigin(origin)) {
          return callback(null, true);
        }
        callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
    })
  );
  // The signup form still sends CNIC/business-document images as base64 JSON strings (up to
  // 4-5MB raw each per the frontend's validateImageFile/validateDocumentFile limits) rather
  // than multipart uploads — base64 inflates that by ~33%, so the body limit needs real
  // headroom above the raw file size, not just above the JSON metadata.
  app.use(express.json({ limit: '15mb' }));
  app.use(cookieParser());
  app.use(morgan('dev'));
  app.use('/uploads', express.static(path.resolve('uploads')));

  app.use(attachUser);

  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  // Dev-only: lets the frontend's Share button build a link that works for OTHER devices even
  // if the person sharing it happened to load the page via `localhost` themselves — see
  // ShareButton.jsx. Not exposed in production, where window.location.origin is already a real
  // public domain and needs no help.
  if (process.env.NODE_ENV !== 'production') {
    app.get('/api/dev/network-info', (_req, res) => {
      const lan = getLanAddress();
      res.json({ lanUrl: lan ? `http://${lan}:5173` : null });
    });
  }

  app.use('/api/auth', authRoutes);
  app.use('/api', catalogRoutes);
  app.use('/api/cart', cartRoutes);
  app.use('/api/checkout', checkoutRoutes);
  app.use('/api/sellers', sellersRoutes);
  app.use('/api/seller', sellerPortalRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/uploads', uploadRoutes);

  app.use((req, res) => {
    res.status(404).json({ message: 'Not found.' });
  });

  // Every route handler in this app responds with its own deliberate, safe-to-display message
  // directly (res.status(400).json({ message: ... })) rather than throwing — so anything that
  // actually reaches this handler (a CORS rejection, an uncaught exception, a malformed-JSON
  // body, a Mongoose error) is by definition unexpected and its real message is internal detail,
  // not something a user should see. Full detail still goes to the server console for debugging.
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).json({ message: 'Something went wrong. Please try again.' });
  });

  return app;
}
