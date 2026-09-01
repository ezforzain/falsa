import { useEffect, useState } from 'react';
import { messages as messagesApi } from '../lib/api';

// Polls rather than pushes — there's no real-time channel yet, see
// server/src/models/Conversation.js. BottomNavBar (and anywhere else that shows the badge) reads
// from here instead of a hardcoded number, so nothing else needs to change if that changes.
const POLL_MS = 20000;

export function useUnreadMessageCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      messagesApi
        .conversations()
        .then(({ conversations }) => {
          if (cancelled) return;
          setCount(conversations.reduce((sum, c) => sum + (c.unread || 0), 0));
        })
        .catch(() => {});
    };
    refresh();
    const interval = setInterval(refresh, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return count;
}
