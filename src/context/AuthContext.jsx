import { createContext, useContext, useEffect, useState } from 'react';
import { auth, tokenStore } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // 'loading' while we check for an existing session on app load, then
  // 'authenticated' or 'unauthenticated'.
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!tokenStore.get()) {
        if (!cancelled) setStatus('unauthenticated');
        return;
      }
      try {
        const { user: sessionUser } = await auth.session();
        if (cancelled) return;
        setUser(sessionUser);
        setStatus('authenticated');
      } catch {
        // Token is missing/expired/invalid on the mock server — treat as signed out.
        tokenStore.clear();
        if (!cancelled) {
          setUser(null);
          setStatus('unauthenticated');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = async (identifier, password) => {
    const result = await auth.signIn(identifier, password);
    tokenStore.set(result.token);
    setUser(result.user);
    setStatus('authenticated');
    return result;
  };

  const signUp = async (payload) => {
    const result = await auth.signUp(payload);
    tokenStore.set(result.token);
    setUser(result.user);
    setStatus('authenticated');
    return result;
  };

  const updateProfile = async (payload) => {
    const { user: updated } = await auth.updateProfile(payload);
    setUser(updated);
    return updated;
  };

  // avatarUrl is either a "/uploads/avatars/..." path just returned by the upload endpoint, or
  // null to remove the picture — see PATCH /api/auth/avatar. Updates context state immediately so
  // every screen reading user.avatarUrl (account menu, seller portal header, admin list, ...)
  // reflects the change without a page reload.
  const updateAvatar = async (avatarUrl) => {
    const { user: updated } = await auth.updateAvatar(avatarUrl);
    setUser(updated);
    return updated;
  };

  // A rejected seller uploads fresh CNIC images — resets their status back to "pending" server-side.
  const resubmitKyc = async (payload) => {
    const { user: updated } = await auth.resubmitKyc(payload);
    setUser(updated);
    return updated;
  };

  const resendVerificationEmail = () => auth.resendVerificationEmail();

  const changePassword = (payload) => auth.changePassword(payload);

  // Called by VerifyEmailPage after a successful /verify-email so the signed-in session (if any)
  // reflects the new status immediately, without waiting for the next session refresh.
  const markEmailVerified = () => {
    setUser((prev) => (prev ? { ...prev, emailVerified: true } : prev));
  };

  const logout = async () => {
    try {
      await auth.logout();
    } catch {
      // Best-effort — even if the network call fails, clear the local session.
    }
    tokenStore.clear();
    setUser(null);
    setStatus('unauthenticated');
  };

  const value = {
    user,
    status,
    isAuthenticated: status === 'authenticated',
    signIn,
    signUp,
    updateProfile,
    updateAvatar,
    resubmitKyc,
    resendVerificationEmail,
    markEmailVerified,
    changePassword,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
