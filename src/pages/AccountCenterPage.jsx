import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNotifications } from '../context/NotificationsContext';
import { useAppSettings } from '../context/AppSettingsContext';
import { auth } from '../lib/api';
import { describeSession } from '../lib/userAgent';
import Avatar from '../components/Avatar';
import SectionCard from '../components/SectionCard';
import Toast from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';
import {
  IconUser,
  IconMail,
  IconPhone,
  IconKey,
  IconEye,
  IconEyeOff,
  IconMonitor,
  IconClock,
  IconBell,
  IconSliders,
  IconStore,
  IconBox,
  IconReceipt,
  IconWallet,
  IconShield,
  IconChevronRight,
  IconLogout,
} from '../components/icons';

const fieldClass =
  'w-full px-3.5 py-2.5 border border-border rounded-xl text-[14px] font-sans bg-surface text-ink outline-none focus:border-green focus:shadow-[0_0_0_3px_rgba(14,90,70,0.12)] transition-shadow';
const fieldLabelClass = 'block text-[11.5px] font-semibold text-text-muted uppercase tracking-wide mb-1.5';

const ROLE_LABEL_KEY = { buyer: 'roleBuyer', seller: 'roleSeller', admin: 'roleAdmin' };

function formatDateTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Nav card linking out to an already-real, working screen (seller portal pages, /account,
// /settings) rather than duplicating that screen's logic here — see plan for the "hub that
// links out" decision.
function NavCard({ icon: Icon, label, to }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-xl border border-border bg-cream/60 px-3.5 py-3 no-underline text-inherit hover:border-green/40 hover:bg-surface-muted transition-all group"
    >
      <span className="w-9 h-9 rounded-lg bg-surface flex items-center justify-center shrink-0 text-green border border-border/70">
        <Icon width="15" height="15" />
      </span>
      <span className="min-w-0 flex-1 text-[13.5px] font-semibold text-ink truncate">{label}</span>
      <IconChevronRight width="15" height="15" className="text-text-muted shrink-0 group-hover:translate-x-0.5 group-hover:text-green transition-all" />
    </Link>
  );
}

function PasswordInput({ value, onChange, placeholder, show, autoComplete }) {
  return (
    <input
      type={show ? 'text' : 'password'}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoComplete={autoComplete}
      className={fieldClass}
    />
  );
}

function ChangePasswordForm({ t, changePassword, onSuccess }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const submit = async () => {
    setError(null);
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError(t('accountCenter.allFieldsRequired'));
      return;
    }
    if (newPassword.length < 8) {
      setError(t('accountCenter.passwordMinLength'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('accountCenter.passwordMismatch'));
      return;
    }
    setSaving(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-3.5">
      <p className="text-[13.5px] font-semibold text-ink m-0">{t('accountCenter.changePasswordTitle')}</p>
      {error && <p className="text-sm text-orange-text bg-orange-tint rounded-lg px-3.5 py-2.5">{error}</p>}

      <div className="relative">
        <label className={fieldLabelClass}>{t('accountCenter.currentPassword')}</label>
        <PasswordInput value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} show={show} autoComplete="current-password" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label className={fieldLabelClass}>{t('accountCenter.newPassword')}</label>
          <PasswordInput value={newPassword} onChange={(e) => setNewPassword(e.target.value)} show={show} autoComplete="new-password" />
        </div>
        <div>
          <label className={fieldLabelClass}>{t('accountCenter.confirmPassword')}</label>
          <PasswordInput value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} show={show} autoComplete="new-password" />
        </div>
      </div>

      <div className="flex items-center gap-2.5 mt-1">
        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className="flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 bg-green hover:bg-green-hover text-white font-semibold text-[13.5px] py-2.5 px-5 rounded-full shadow-[0_6px_16px_rgba(14,90,70,0.25)] hover:-translate-y-0.5 transition-all"
        >
          {saving && (
            <span className="w-3.5 h-3.5 border-2 border-white/35 rounded-full inline-block" style={{ borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} />
          )}
          {saving ? t('accountCenter.updatingPassword') : t('accountCenter.updatePassword')}
        </button>
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="flex items-center gap-1.5 cursor-pointer text-text-muted hover:text-green font-semibold text-[12.5px] py-2.5 px-3 rounded-full hover:bg-surface-muted transition-colors"
        >
          {show ? <IconEyeOff width="14" height="14" /> : <IconEye width="14" height="14" />}
        </button>
      </div>
    </div>
  );
}

function SessionsList({ t, onToast }) {
  const [sessions, setSessions] = useState(null);
  const [error, setError] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null); // { type: 'one'|'others', id? }
  const [working, setWorking] = useState(false);

  const load = () => {
    auth
      .sessions()
      .then((data) => setSessions(data.sessions))
      .catch((err) => setError(err.message));
  };

  useEffect(load, []);

  const confirmRevoke = async () => {
    if (!confirmTarget) return;
    setWorking(true);
    try {
      if (confirmTarget.type === 'one') {
        await auth.revokeSession(confirmTarget.id);
        setSessions((prev) => prev.filter((s) => s.id !== confirmTarget.id));
        onToast(t('accountCenter.sessionSignedOut'));
      } else {
        await auth.revokeOtherSessions();
        setSessions((prev) => prev.filter((s) => s.current));
        onToast(t('accountCenter.allOtherSessionsSignedOut'));
      }
      setConfirmTarget(null);
    } catch (err) {
      onToast(err.message, 'error');
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="mt-5 pt-5 border-t border-border">
      <p className="text-[13.5px] font-semibold text-ink mb-3">{t('accountCenter.sessionsTitle')}</p>

      {!sessions && !error && (
        <div className="flex flex-col gap-2">
          <div className="animate-pulse bg-cream/60 border border-border rounded-xl h-[60px]" />
          <div className="animate-pulse bg-cream/60 border border-border rounded-xl h-[60px]" />
        </div>
      )}

      {error && <p className="text-sm text-orange-text bg-orange-tint rounded-lg px-3.5 py-2.5">{error}</p>}

      {sessions && sessions.length === 0 && <p className="text-sm text-text-muted">{t('accountCenter.sessionsEmpty')}</p>}

      {sessions && sessions.length > 0 && (
        <div className="flex flex-col gap-2">
          {sessions.map((s) => {
            const { label } = describeSession(s.userAgent);
            return (
              <div key={s.id} className="flex items-center gap-3 rounded-xl border border-border/70 bg-cream/60 px-3.5 py-3">
                <span className="w-9 h-9 rounded-lg bg-surface flex items-center justify-center shrink-0 text-green border border-border/70">
                  <IconMonitor width="15" height="15" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13.5px] font-semibold text-ink truncate">{label}</span>
                    {s.current && (
                      <span className="text-[10.5px] font-bold uppercase tracking-wide text-green bg-green-tint px-2 py-0.5 rounded-full shrink-0">
                        {t('accountCenter.thisDevice')}
                      </span>
                    )}
                  </div>
                  <span className="flex items-center gap-1.5 text-[12px] text-text-muted mt-0.5">
                    <IconClock width="11" height="11" />
                    {t('accountCenter.lastActive')}: {formatDateTime(s.lastActiveAt)}
                    {s.ip ? ` · ${s.ip}` : ''}
                  </span>
                </div>
                {!s.current && (
                  <button
                    type="button"
                    onClick={() => setConfirmTarget({ type: 'one', id: s.id })}
                    className="cursor-pointer shrink-0 text-[12.5px] font-semibold text-orange-text hover:underline px-2 py-1"
                  >
                    {t('accountCenter.signOutDevice')}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {sessions && sessions.length > 1 && (
        <button
          type="button"
          onClick={() => setConfirmTarget({ type: 'others' })}
          className="mt-3.5 cursor-pointer text-[12.5px] font-semibold text-orange-text hover:underline"
        >
          {t('accountCenter.signOutAllOthers')}
        </button>
      )}

      <ConfirmDialog
        open={!!confirmTarget}
        title={confirmTarget?.type === 'one' ? t('accountCenter.confirmSignOutDeviceTitle') : t('accountCenter.confirmSignOutOthersTitle')}
        message={confirmTarget?.type === 'one' ? t('accountCenter.confirmSignOutDeviceMsg') : t('accountCenter.confirmSignOutOthersMsg')}
        confirmLabel={t('accountCenter.signOutDevice')}
        loading={working}
        onCancel={() => setConfirmTarget(null)}
        onConfirm={confirmRevoke}
      />
    </div>
  );
}

export default function AccountCenterPage() {
  const { user, isAuthenticated, changePassword, logout } = useAuth();
  const { t, language, languages } = useLanguage();
  const { prefs } = useNotifications();
  const { theme } = useAppSettings();
  const navigate = useNavigate();

  const [toast, setToast] = useState({ show: false, message: '', variant: 'success' });
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const showToast = (message, variant = 'success') => setToast({ show: true, message, variant });

  if (!isAuthenticated) {
    return (
      <main className="max-w-[720px] mx-auto px-4 sm:px-6 lg:px-10 pt-9 pb-20 animate-fade-up">
        <div className="text-center py-14 sm:py-[60px] px-6 bg-surface border border-border rounded-3xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_10px_28px_-8px_rgba(0,0,0,0.08)]">
          <span className="w-16 h-16 rounded-full bg-green-tint inline-flex items-center justify-center mb-5">
            <IconUser width="24" height="24" className="text-green" />
          </span>
          <p className="text-[17px] font-bold text-ink mb-1.5 font-display tracking-tight">{t('accountCenter.notSignedInTitle')}</p>
          <p className="text-sm text-text-muted mb-7 max-w-[280px] mx-auto leading-relaxed">{t('accountCenter.notSignedInDesc')}</p>
          <Link
            to="/auth"
            className="cursor-pointer inline-flex items-center gap-2 bg-green hover:bg-green-hover text-white font-semibold text-sm px-7 py-3.5 rounded-full no-underline shadow-[0_8px_20px_rgba(14,90,70,0.25)] hover:-translate-y-0.5 transition-all"
          >
            {t('common.signIn')}
          </Link>
        </div>
      </main>
    );
  }

  const isSeller = user.role === 'seller';
  const notifSummary = !prefs.master
    ? t('accountCenter.notificationsAllOff')
    : prefs.orders && prefs.wishlist && prefs.account
      ? t('accountCenter.notificationsAllOn')
      : t('accountCenter.notificationsPartial');
  const languageLabel = languages.find((l) => l.code === language)?.nativeName || language;
  const themeLabel = t(`settings.theme${theme[0].toUpperCase()}${theme.slice(1)}`);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    setLoggingOut(false);
    navigate('/');
  };

  return (
    <main className="max-w-[720px] mx-auto px-4 sm:px-6 lg:px-10 pt-9 pb-20 animate-fade-up">
      <h1 className="font-display text-[26px] sm:text-[28px] font-bold m-0 mb-1.5 tracking-tight text-ink">{t('accountCenter.title')}</h1>
      <p className="text-sm text-text-muted mb-7">{t('accountCenter.subtitle')}</p>

      <div className="flex flex-col gap-5">
        {/* Profile */}
        <section className="bg-surface border border-border rounded-2xl p-5 sm:p-6 shadow-[0_1px_3px_rgba(27,31,29,0.04)]">
          <div className="flex items-center gap-4">
            <Avatar src={user.avatarUrl} size={56} />
            <div className="min-w-0 flex-1">
              <p className="font-display text-[16px] font-bold text-ink truncate m-0">{user.companyName}</p>
              <span className="inline-flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-wide text-green bg-green-tint px-2 py-0.5 rounded-full mt-1">
                {t(`accountCenter.${ROLE_LABEL_KEY[user.role] || 'roleBuyer'}`)}
              </span>
            </div>
            <Link
              to="/account"
              className="shrink-0 cursor-pointer text-[13px] font-semibold text-green hover:underline whitespace-nowrap"
            >
              {t('accountCenter.editProfile')}
            </Link>
          </div>
          <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-border">
            {user.email && (
              <span className="flex items-center gap-2 text-[13px] text-text-muted truncate">
                <IconMail width="13" height="13" className="shrink-0" />
                {user.email}
              </span>
            )}
            {user.phone && (
              <span className="flex items-center gap-2 text-[13px] text-text-muted truncate">
                <IconPhone width="13" height="13" className="shrink-0" />
                {user.phone}
              </span>
            )}
          </div>
        </section>

        {/* My Orders — visible to every signed-in user, buyers included */}
        <SectionCard icon={IconReceipt} title={t('accountCenter.myOrdersTitle')} description={t('accountCenter.myOrdersDesc')}>
          <NavCard icon={IconReceipt} label={t('accountCenter.myOrders')} to="/orders" />
        </SectionCard>

        {/* Password & Security */}
        <SectionCard icon={IconKey} title={t('accountCenter.securityTitle')} description={t('accountCenter.securityDesc')}>
          <ChangePasswordForm t={t} changePassword={changePassword} onSuccess={() => showToast(t('accountCenter.passwordUpdated'))} />
          <SessionsList t={t} onToast={showToast} />
        </SectionCard>

        {/* Notifications */}
        <SectionCard icon={IconBell} title={t('accountCenter.notificationsTitle')} description={t('accountCenter.notificationsDesc')}>
          <div className="flex items-center justify-between gap-4">
            <p className="text-[13.5px] font-semibold text-ink m-0">{notifSummary}</p>
            <Link to="/settings" className="shrink-0 cursor-pointer text-[13px] font-semibold text-green hover:underline whitespace-nowrap">
              {t('accountCenter.manage')}
            </Link>
          </div>
        </SectionCard>

        {/* Language & Theme */}
        <SectionCard icon={IconSliders} title={t('accountCenter.languageThemeTitle')} description={t('accountCenter.languageThemeDesc')}>
          <div className="flex items-center justify-between gap-4">
            <p className="text-[13.5px] font-semibold text-ink m-0">
              {languageLabel} · {themeLabel}
            </p>
            <Link to="/settings" className="shrink-0 cursor-pointer text-[13px] font-semibold text-green hover:underline whitespace-nowrap">
              {t('accountCenter.manage')}
            </Link>
          </div>
        </SectionCard>

        {/* Seller Tools */}
        {isSeller && (
          <SectionCard icon={IconStore} title={t('accountCenter.sellerToolsTitle')} description={t('accountCenter.sellerToolsDesc')}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <NavCard icon={IconStore} label={t('accountCenter.shopProfile')} to="/seller/store-profile" />
              <NavCard icon={IconBox} label={t('accountCenter.products')} to="/seller/products" />
              <NavCard icon={IconReceipt} label={t('accountCenter.orders')} to="/seller/orders" />
              <NavCard icon={IconWallet} label={t('accountCenter.earnings')} to="/seller/payouts" />
              <NavCard icon={IconShield} label={t('accountCenter.sellerVerification')} to="/seller/settings" />
            </div>
          </SectionCard>
        )}

        {/* Logout */}
        <SectionCard icon={IconLogout} title={t('accountCenter.logoutTitle')} description={t('accountCenter.logoutDesc')}>
          <button
            type="button"
            onClick={() => setLogoutConfirm(true)}
            className="cursor-pointer bg-orange hover:bg-orange-hover text-white font-semibold text-[13.5px] py-2.5 px-5 rounded-full shadow-[0_6px_16px_rgba(201,123,45,0.3)] transition-colors"
          >
            {t('accountCenter.logoutButton')}
          </button>
        </SectionCard>
      </div>

      <ConfirmDialog
        open={logoutConfirm}
        title={t('accountCenter.confirmLogoutTitle')}
        message={t('accountCenter.confirmLogoutMsg')}
        confirmLabel={t('accountCenter.logoutButton')}
        loading={loggingOut}
        onCancel={() => setLogoutConfirm(false)}
        onConfirm={handleLogout}
      />

      <Toast message={toast.message} show={toast.show} variant={toast.variant} onHide={() => setToast((prev) => ({ ...prev, show: false }))} />
    </main>
  );
}
