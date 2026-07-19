import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'node:path';

import { attachUser } from './middleware/auth.js';
import authRoutes from './routes/auth.routes.js';
import catalogRoutes from './routes/catalog.routes.js';
import cartRoutes from './routes/cart.routes.js';
import checkoutRoutes from './routes/checkout.routes.js';
import sellersRoutes from './routes/sellers.routes.js';
import sellerPortalRoutes from './routes/seller.routes.js';
import adminRoutes from './routes/admin.routes.js';
import uploadRoutes from './routes/upload.routes.js';

// True for any private-network address on the Vite dev port — covers a phone or another
// machine reaching this API via the same LAN IP the dev-server QR code points them to,
// whatever that IP happens to be (192.168.x.x, 10.x.x.x, or 172.16-31.x.x), without needing
// CLIENT_ORIGIN updated by hand every time this machine's IP changes.
function isPrivateLanOrigin(origin) {
  try {
    const { hostname, port } = new URL(origin);
    if (port !== '5173') return false;
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

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin(origin, callback) {
        // No Origin header (same-origin requests, curl, server-to-server) — always fine.
        if (!origin) return callback(null, true);
        const configured = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
        if (origin === configured) return callback(null, true);
        // Outside production, also accept LAN-local origins so a phone/other device reaching
        // this API directly (not just through the Vite proxy) isn't blocked. Production keeps
        // the strict single-origin check above.
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

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).json({ message: err.message || 'Internal server error.' });
  });

  return app;
}
