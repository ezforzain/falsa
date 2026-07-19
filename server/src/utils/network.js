import os from 'node:os';

// The first non-internal IPv4 address on this machine — what a phone or other device on the
// same Wi-Fi actually uses to reach this machine, as opposed to `localhost` (which only ever
// means "this device") or a stale IP nobody remembers to update by hand. Shared by the startup
// log (src/index.js) and the dev-only network-info endpoint (src/app.js) so both agree.
export function getLanAddress() {
  const nets = os.networkInterfaces();
  for (const iface of Object.values(nets)) {
    for (const net of iface ?? []) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return null;
}
