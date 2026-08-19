// Lightweight, dependency-free "Browser on OS" summary for the Account Center sessions list —
// good enough for a human-readable device label, not meant to be a precise UA parser.
const OS_PATTERNS = [
  [/windows/i, 'Windows'],
  [/iphone/i, 'iPhone'],
  [/ipad/i, 'iPad'],
  [/mac os/i, 'Mac'],
  [/android/i, 'Android'],
  [/linux/i, 'Linux'],
];

const BROWSER_PATTERNS = [
  [/edg\//i, 'Edge'],
  [/opr\/|opera/i, 'Opera'],
  [/chrome\//i, 'Chrome'],
  [/firefox\//i, 'Firefox'],
  [/safari\//i, 'Safari'],
];

export function describeSession(userAgent) {
  const ua = userAgent || '';
  const os = OS_PATTERNS.find(([re]) => re.test(ua))?.[1] || 'Unknown device';
  const browser = BROWSER_PATTERNS.find(([re]) => re.test(ua))?.[1] || 'Unknown browser';
  const device = /iphone|ipad|android/i.test(ua) ? 'mobile' : 'desktop';
  return { device, label: `${browser} on ${os}` };
}
