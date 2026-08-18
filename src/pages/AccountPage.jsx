import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProfileDrawer } from '../context/ProfileDrawerContext';
import { IconUser, IconMenu, IconMail } from '../components/icons';
import AvatarUploader from '../components/AvatarUploader';

// Sits under the profile card whenever the signed-in account hasn't clicked the link from its
// verification email yet — see VerifyEmailPage / server's /api/auth/verify-email.
function EmailVerifyNotice({ email, resend }) {
  const [state, setState] = useState('idle'); // idle | sending | sent | error
  const [error, setError] = useState(null);

  const handleResend = async () => {
    if (state === 'sending') return;
    setState('sending');
    setError(null);
    try {
      await resend();
      setState('sent');
    } catch (err) {
      setError(err.message);
      setState('error');
    }
  };

  return (
    <div className="mt-4 bg-orange-tint rounded-2xl p-4 flex gap-3 items-start">
      <span className="w-9 h-9 rounded-full bg-white inline-flex items-center justify-center shrink-0">
        <IconMail width="16" height="16" className="text-orange-text" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-semibold text-ink m-0">Verify your email</p>
        <p className="text-[12.5px] text-text-muted mt-1 mb-2 leading-snug break-words">
          We sent a link to <span className="font-medium text-ink">{email}</span>. Open it to verify your account.
        </p>
        {state === 'sent' ? (
          <p className="text-[12.5px] font-semibold text-green m-0">Email sent — check your inbox.</p>
        ) : (
          <a
            onClick={handleResend}
            className={`text-[12.5px] font-semibold text-orange-text cursor-pointer hover:underline ${state === 'sending' ? 'opacity-60 pointer-events-none' : ''}`}
          >
            {state === 'sending' ? 'Sending…' : 'Resend verification email'}
          </a>
        )}
        {state === 'error' && <p className="text-[12px] text-orange-text mt-1.5 mb-0">{error}</p>}
      </div>
    </div>
  );
}

// "My Profile" — just the profile itself now. Orders, seller tools, settings, support, and
// sign-out all moved into the Facebook-style account menu — see AccountMenuContent. The
// trigger for it only ever appears here: Header's hamburger only renders while viewing this
// page (desktop), and this page renders bare on mobile (no Header at all — see MainLayout's
// bare-route list), so it needs its own trigger too, rather than relying on the bottom nav.
export default function AccountPage() {
  const { user, isAuthenticated, resendVerificationEmail } = useAuth();
  const { open: openAccountMenu } = useProfileDrawer();

  const TopBar = (
    <div className="flex items-center justify-between gap-3 mb-1.5">
      <h1 className="font-display text-[28px] font-bold m-0 tracking-tight">My Profile</h1>
      <button
        type="button"
        onClick={openAccountMenu}
        aria-label="Account menu"
        aria-haspopup="dialog"
        className="md:hidden cursor-pointer w-10 h-10 rounded-lg flex items-center justify-center text-text hover:bg-surface-muted transition-colors shrink-0"
      >
        <IconMenu />
      </button>
    </div>
  );

  if (!isAuthenticated) {
    return (
      <main className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-10 pt-9 pb-20 animate-fade-up">
        <div className="max-w-[640px] mx-auto">
          {TopBar}
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
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-10 pt-9 pb-20 animate-fade-up">
      <div className="max-w-[640px] mx-auto">
        {TopBar}
        <p className="text-sm text-text-muted mb-7 flex items-center gap-1.5 flex-wrap">
          Orders, settings, and more now live in the account menu
          <IconMenu width="14" height="14" className="text-text-muted" />
          — tap it above.
        </p>

        <div className="bg-white border border-border rounded-2xl p-6 flex items-center gap-5 flex-wrap">
          <AvatarUploader size={72} />
          <div className="min-w-0">
            <p className="text-[17px] font-semibold text-ink truncate">{user.companyName}</p>
            <p className="text-sm text-text-muted truncate">{user.email || user.phone}</p>
            {user.country && <p className="text-[13px] text-text-muted truncate mt-0.5">{user.country}</p>}
          </div>
        </div>

        {!user.emailVerified && <EmailVerifyNotice email={user.email} resend={resendVerificationEmail} />}
      </div>
    </main>
  );
}
