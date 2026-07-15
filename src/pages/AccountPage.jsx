import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { IconUser, IconLogout, IconChevronRight } from '../components/icons';

export default function AccountPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return (
      <main className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-10 pt-9 pb-20 animate-fade-up">
        <h1 className="font-display text-[28px] font-bold m-0 mb-1.5 tracking-tight">My Account</h1>
        <div className="text-center py-[60px] px-5 bg-white border border-dashed border-border-strong rounded-2xl">
          <span className="w-14 h-14 rounded-full bg-surface-muted inline-flex items-center justify-center mb-5">
            <IconUser width="22" height="22" className="text-text-muted" />
          </span>
          <p className="text-[16px] font-semibold text-ink mb-1.5">You're not signed in</p>
          <p className="text-sm text-text-muted mb-6">Sign in to view your account, orders, and saved stores.</p>
          <Link
            to="/auth"
            className="cursor-pointer inline-block bg-green hover:bg-green-hover text-white font-semibold text-sm px-[26px] py-3 rounded-full no-underline transition-colors"
          >
            Sign in
          </Link>
        </div>
      </main>
    );
  }

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const rows = [
    { label: 'My orders', to: '/cart' },
    ...(user.role === 'seller' ? [{ label: 'Seller portal', to: '/seller' }] : []),
    ...(user.role === 'admin' ? [{ label: 'Admin panel', to: '/admin' }] : []),
  ];

  return (
    <main className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-10 pt-9 pb-20 animate-fade-up">
      <h1 className="font-display text-[28px] font-bold m-0 mb-1.5 tracking-tight">My Account</h1>
      <p className="text-sm text-text-muted mb-7">Manage your profile and orders.</p>

      <div className="bg-white border border-border rounded-2xl p-6 mb-5 flex items-center gap-4">
        <span className="w-14 h-14 rounded-full bg-green-tint inline-flex items-center justify-center shrink-0">
          <IconUser width="22" height="22" className="text-green" />
        </span>
        <div className="min-w-0">
          <p className="text-[16px] font-semibold text-ink truncate">{user.companyName}</p>
          <p className="text-sm text-text-muted truncate">{user.email}</p>
        </div>
      </div>

      {rows.length > 0 && (
        <div className="bg-white border border-border rounded-2xl overflow-hidden mb-5">
          {rows.map((row) => (
            <Link
              key={row.to}
              to={row.to}
              className="flex items-center justify-between px-6 py-4 text-[15px] font-medium text-ink-soft no-underline border-b border-border last:border-b-0 hover:bg-surface-muted transition-colors"
            >
              {row.label}
              <IconChevronRight width="16" height="16" className="text-text-muted" />
            </Link>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={handleLogout}
        className="cursor-pointer flex items-center gap-2.5 bg-white border border-border rounded-2xl px-6 py-4 text-[15px] font-semibold text-orange-text w-full hover:border-border-strong transition-colors"
      >
        <IconLogout width="18" height="18" />
        Sign out
      </button>
    </main>
  );
}
