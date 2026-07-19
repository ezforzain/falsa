import 'dotenv/config';
import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { getLanAddress } from './utils/network.js';

async function main() {
  await connectDB();
  const app = createApp();
  const port = process.env.PORT || 5000;
  // Explicit 0.0.0.0 (not just an omitted host) so this always listens on every network
  // interface, not only localhost — required for a phone on the same Wi-Fi to reach it directly
  // and, more importantly, for Vite's dev proxy on another device to relay requests here at all.
  app.listen(port, '0.0.0.0', () => {
    console.log(`Falsafah Tot API listening on http://localhost:${port}`);
    const lan = getLanAddress();
    if (lan) console.log(`  Also reachable on your network at: http://${lan}:${port}`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
