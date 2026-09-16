import { NavLink } from 'react-router-dom';

// Shared between the desktop sidebar and the mobile slide-in drawer (see SellerLayout.jsx) so
// the two nav renderings can never drift apart.
export default function NavList({ tabs, unreadMessages = 0, onNavigate }) {
  return (
    <nav className="flex flex-col gap-1.5">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center justify-between gap-2 px-4 py-3 rounded-xl text-sm border transition-colors ${
              isActive
                ? 'bg-green-tint border-green-tint-border text-ink-soft font-bold'
                : 'border-transparent text-text hover:bg-surface-muted hover:text-ink font-medium'
            }`
          }
        >
          <span className="flex items-center gap-2.5">
            <tab.icon width="15" height="15" />
            {tab.label}
          </span>
          {tab.badgeKey === 'messages' && unreadMessages > 0 && (
            <span className="text-[11px] font-bold text-cream bg-green rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
              {unreadMessages}
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
