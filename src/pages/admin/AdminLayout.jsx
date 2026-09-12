import { useState } from 'react';
import { Link } from 'react-router-dom';
import Avatar from '../../components/Avatar';
import OfficialBadge from '../../components/OfficialBadge';
import {
  IconBox,
  IconGrid,
  IconHome,
  IconLogout,
  IconMenu,
  IconReceipt,
  IconSettings,
  IconSliders,
  IconStore,
  IconTrendingUp,
  IconUser,
} from '../../components/icons';
import logoMark from '../../assets/logo-mark.png';

// The 9 sections that already exist in the admin panel today (see the old `activeTab` list this
// replaces in AdminPage.jsx) — nothing added, nothing renamed except "Verified Stores" -> "Sellers"
// for a clearer sidebar label (same tab, same content).
export const ADMIN_NAV_ITEMS = [
  { key: 'overview', label: 'Dashboard', icon: IconHome },
  { key: 'orders', label: 'Orders', icon: IconReceipt },
  { key: 'products', label: 'Products', icon: IconBox },
  { key: 'stores', label: 'Sellers', icon: IconStore },
  { key: 'users', label: 'Users', icon: IconUser },
  { key: 'categories', label: 'Categories', icon: IconGrid },
  { key: 'filters', label: 'Filters', icon: IconSliders },
  { key: 'reports', label: 'Reports', icon: IconTrendingUp },
  { key: 'settings', label: 'Settings', icon: IconSettings },
];

function SidebarContent({ activeTab, onTabChange, onLogout, onNavigate }) {
  return (
    <div className="flex flex-col h-full">
      <Link to="/" className="flex items-center gap-2.5 no-underline shrink-0 px-5 h-16 border-b border-[var(--admin-sidebar-border)]">
        <img src={logoMark} alt="" className="w-8 h-8 object-contain" />
        <span className="flex flex-col leading-none">
          <span className="flex items-center gap-1.5">
            <span className="font-display text-[15px] font-bold text-white tracking-tight">Falsafah</span>
            <OfficialBadge size={13} tooltipPosition="bottom" />
          </span>
          <span className="font-mono text-[9px] text-[var(--admin-sidebar-text)] tracking-[0.2em] uppercase mt-0.5">Admin</span>
        </span>
      </Link>

      <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-0.5">
        {ADMIN_NAV_ITEMS.map((item) => {
          const active = activeTab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                onTabChange(item.key);
                onNavigate?.();
              }}
              className={`cursor-pointer flex items-center gap-3 text-[13.5px] font-semibold px-3 py-2.5 rounded-lg transition-colors ${
                active
                  ? 'bg-[var(--admin-primary)] text-white'
                  : 'text-[var(--admin-sidebar-text)] hover:bg-[var(--admin-sidebar-bg-hover)] hover:text-[var(--admin-sidebar-text-active)]'
              }`}
            >
              <item.icon width="16" height="16" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-[var(--admin-sidebar-border)]">
        <button
          type="button"
          onClick={onLogout}
          className="cursor-pointer w-full flex items-center gap-3 text-[13.5px] font-semibold px-3 py-2.5 rounded-lg text-[var(--admin-sidebar-text)] hover:bg-[var(--admin-sidebar-bg-hover)] hover:text-[var(--admin-sidebar-text-active)] transition-colors"
        >
          <IconLogout width="16" height="16" />
          Logout
        </button>
      </div>
    </div>
  );
}

export default function AdminLayout({ activeTab, onTabChange, user, onLogout, children }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const currentLabel = ADMIN_NAV_ITEMS.find((i) => i.key === activeTab)?.label || 'Dashboard';

  return (
    <div className="admin-shell min-h-screen flex font-sans text-[var(--admin-ink)]">
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:block w-64 shrink-0 fixed inset-y-0 left-0 border-r border-[var(--admin-sidebar-border)]"
        style={{ background: 'var(--admin-sidebar-bg)' }}
      >
        <SidebarContent activeTab={activeTab} onTabChange={onTabChange} onLogout={onLogout} />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-[90]">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDrawerOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[80vw] shadow-[var(--admin-shadow-lg)] animate-fade-up" style={{ background: 'var(--admin-sidebar-bg)' }}>
            <SidebarContent activeTab={activeTab} onTabChange={onTabChange} onLogout={onLogout} onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 min-w-0 lg:pl-64">
        <header className="sticky top-0 z-40 bg-[var(--admin-surface)] border-b border-[var(--admin-border)]">
          <div className="flex items-center gap-3 h-16 px-4 sm:px-6">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              className="lg:hidden cursor-pointer p-2 -ml-2 rounded-lg text-[var(--admin-ink-soft)] hover:bg-[var(--admin-canvas)] transition-colors"
            >
              <IconMenu width="20" height="20" />
            </button>

            <h1 className="font-display text-base sm:text-lg font-bold text-[var(--admin-ink)] truncate">{currentLabel}</h1>

            <div className="flex-1" />

            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar
                src={user.avatarUrl}
                name={user.companyName}
                size={32}
                iconSize={15}
                bgClassName="bg-[var(--admin-primary-tint)]"
                iconClassName="text-[var(--admin-primary)]"
              />
              <span className="hidden sm:flex flex-col leading-tight min-w-0">
                <span className="text-[13px] font-semibold text-[var(--admin-ink)] truncate max-w-[160px]">{user.companyName}</span>
                <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--admin-primary)]">Admin</span>
              </span>
            </div>
          </div>
        </header>

        <main className="max-w-[1200px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 animate-fade-up">{children}</main>
      </div>
    </div>
  );
}
