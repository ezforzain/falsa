import { useState } from 'react';

// There's no messaging backend yet — MessengerPage is a static "no messages yet" placeholder, so
// the real unread count is always 0 today. This hook is the single place that will start
// returning a real, live-updating count once a messages API exists; BottomNavBar (and anywhere
// else that shows the badge) reads from here instead of a hardcoded number, so nothing else needs
// to change when that happens.
export function useUnreadMessageCount() {
  const [count] = useState(0);
  return count;
}
