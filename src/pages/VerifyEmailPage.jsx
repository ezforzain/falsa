import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth as authApi } from '../lib/api';
import { IconCheck, IconAlertCircle, IconMail } from '../components/icons';

// Reached from the link inside the verification email (see server/src/utils/mailer.js) —
// deliberately works whether or not the visitor is signed in on this device/browser, since the
// token itself (not a session) is what proves the email belongs to them.
export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { isAuthenticated, markEmailVerified, resendVerificationEmail } = useAuth();

  const [state, setState] = useState('verifying'); // verifying | success | error
  const [error, setError] = useState(null);
  const [resendState, setResendState] = useState('idle'); // idle | sending | sent | error

  // StrictMode/dev double-effect guard — a verification token is single-use, so firing the
  // request twice would turn the second call into a spurious "invalid or expired" error.
  const requested = useRef(false);

  useEffect(() => {
    if (requested.current) return;
    requested.current = true;

    if (!token) {
      setError('This verification link is missing its token.');
      setState('error');
      return;
    }
    authApi
      .verifyEmail(token)
      .then(() => {
        markEmailVerified();
        setState('success');
      })
      .catch((err) => {
        setError(err.message);
        setState('error');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleResend = async () => {
    if (resendState === 'sending') return;
    setResendState('sending');
    try {
      await resendVerificationEmail();
      setResendState('sent');
    } catch {
      setResendState('idle');
    }
  };

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-cream px-4 py-5 font-sans text-ink">
      <Link to="/" className="font-display text-[32px] font-bold text-green tracking-tight leading-none mb-6 no-underline">
        Falsafah
      </Link>

      <div className="w-full max-w-[400px] bg-white rounded-2xl shadow-xl shadow-black/[0.08] border border-border/60 p-6 sm:p-8 text-center animate-fade-up">
        {state === 'verifying' && (
          <>
            <span className="w-16 h-16 rounded-full bg-green-tint inline-flex items-center justify-center mb-5">
              <span
                className="w-6 h-6 border-[2.5px] border-green/30 rounded-full inline-block"
                style={{ borderTopColor: '#0E5A46', animation: 'spin 0.8s linear infinite' }}
              />
            </span>
            <h1 className="font-display text-xl font-bold m-0 mb-2 tracking-tight">Verifying your email…</h1>
            <p className="text-[14.5px] text-text-muted m-0">This only takes a moment.</p>
          </>
        )}

        {state === 'success' && (
          <>
            <span className="w-16 h-16 rounded-full bg-green inline-flex items-center justify-center mb-5 shadow-[0_12px_30px_rgba(14,90,70,0.3)]">
              <IconCheck width="28" height="28" className="text-white" strokeWidth="2.6" />
            </span>
            <h1 className="font-display text-2xl font-bold m-0 mb-2.5 tracking-tight">Email verified</h1>
            <p className="text-[15px] text-text mb-6 leading-relaxed">Your account is confirmed. You're all set.</p>
            <Link
              to={isAuthenticated ? '/account' : '/auth'}
              className="block text-center cursor-pointer bg-green hover:bg-green-hover text-white font-semibold text-[15.5px] py-4 rounded-full no-underline shadow-[0_8px_22px_rgba(14,90,70,0.25)] transition-all hover:-translate-y-0.5"
            >
              {isAuthenticated ? 'Go to my account' : 'Sign in'}
            </Link>
          </>
        )}

        {state === 'error' && (
          <>
            <span className="w-16 h-16 rounded-full bg-orange-tint inline-flex items-center justify-center mb-5">
              <IconAlertCircle width="26" height="26" className="text-orange-text" />
            </span>
            <h1 className="font-display text-xl font-bold m-0 mb-2.5 tracking-tight">Link invalid or expired</h1>
            <p className="text-[14.5px] text-text mb-6 leading-relaxed">{error}</p>

            {isAuthenticated ? (
              <>
                {resendState === 'sent' ? (
                  <p className="text-[13.5px] font-semibold text-green flex items-center justify-center gap-2 mb-1">
                    <IconMail width="15" height="15" /> New link sent — check your inbox.
                  </p>
                ) : (
                  <a
                    onClick={handleResend}
                    className={`block text-center cursor-pointer bg-green hover:bg-green-hover text-white font-semibold text-[15.5px] py-4 rounded-full shadow-[0_8px_22px_rgba(14,90,70,0.25)] transition-all hover:-translate-y-0.5 ${resendState === 'sending' ? 'opacity-60 pointer-events-none' : ''}`}
                  >
                    {resendState === 'sending' ? 'Sending…' : 'Send a new link'}
                  </a>
                )}
              </>
            ) : (
              <Link
                to="/auth"
                className="block text-center cursor-pointer bg-green hover:bg-green-hover text-white font-semibold text-[15.5px] py-4 rounded-full no-underline shadow-[0_8px_22px_rgba(14,90,70,0.25)] transition-all hover:-translate-y-0.5"
              >
                Sign in to request a new link
              </Link>
            )}
          </>
        )}
      </div>
    </div>
  );
}
