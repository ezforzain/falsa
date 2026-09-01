import { Link } from 'react-router-dom';
import { IconMessageCircle } from './icons';

// "Chat" action on the Product Detail page — links into Messenger. Sized to match the other
// pill buttons in that page's primary action row (Order Now / Add to Cart / Share): icon-only
// on mobile, icon + label from the sm breakpoint up, same as ShareButton.
// sellerId/sellerName (when known) are handed to MessengerPage via router state so it opens
// straight into a conversation with that seller instead of the plain conversation list.
export default function ChatButton({ sellerId, sellerName, className = '' }) {
  return (
    <Link
      to="/messenger"
      state={sellerId ? { sellerId, sellerName } : undefined}
      aria-label="Chat with seller"
      title="Chat with seller"
      className={`shrink-0 flex items-center justify-center gap-1.5 cursor-pointer text-green bg-green-tint hover:bg-green/15 rounded-full w-[52px] sm:w-auto h-[52px] sm:px-4 sm:py-[13px] text-sm font-semibold no-underline transition-colors ${className}`}
    >
      <IconMessageCircle width="16" height="16" />
      <span className="hidden sm:inline">Chat</span>
    </Link>
  );
}
