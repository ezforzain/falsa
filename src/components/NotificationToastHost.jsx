import { useEffect, useRef, useState } from 'react';
import { useNotifications } from '../context/NotificationsContext';
import Toast from './Toast';

// Surfaces the most recent notify() call as a transient toast, on top of it landing in the
// Notifications feed — so toggling a preference in Settings has an effect you can actually see
// the next time that action happens, not just a flag nobody ever looks at again.
export default function NotificationToastHost() {
  const { feed } = useNotifications();
  const [visible, setVisible] = useState(false);
  const lastShownId = useRef(null);
  const latest = feed[0];

  useEffect(() => {
    if (!latest || latest.id === lastShownId.current) return;
    lastShownId.current = latest.id;
    setVisible(true);
  }, [latest]);

  if (!latest) return null;
  return <Toast message={latest.title} show={visible} onHide={() => setVisible(false)} />;
}
