import { Link } from 'react-router-dom';
import { IconMessageCircle } from './icons';

// Small "Chat" action shown under every product card — links into Messenger. Stops the click
// from bubbling so it works even when nested inside a card that's itself a <Link>.
export default function ChatButton({ className = '' }) {
  return (
    <Link
      to="/messenger"
      onClick={(e) => e.stopPropagation()}
      className={`inline-flex items-center justify-center gap-1.5 text-[12.5px] font-semibold text-green bg-green-tint hover:bg-green/15 rounded-lg py-2 no-underline transition-colors ${className}`}
    >
      <IconMessageCircle width="14" height="14" />
      Chat
    </Link>
  );
}
