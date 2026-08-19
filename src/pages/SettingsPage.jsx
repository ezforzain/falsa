import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNotifications } from '../context/NotificationsContext';
import { useAppSettings } from '../context/AppSettingsContext';
import ToggleSwitch from '../components/ToggleSwitch';
import SectionCard from '../components/SectionCard';
import { IconGlobe, IconBell, IconSliders, IconCheck, IconSun, IconMoon, IconMonitor } from '../components/icons';

function PreferenceRow({ title, description, checked, onChange, disabled = false }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-[13.5px] font-semibold text-ink m-0">{title}</p>
        <p className="text-[12px] text-text-muted mt-0.5 leading-snug">{description}</p>
      </div>
      <ToggleSwitch checked={checked} onChange={onChange} disabled={disabled} label={title} />
    </div>
  );
}

const THEME_OPTIONS = [
  { key: 'light', icon: IconSun },
  { key: 'dark', icon: IconMoon },
  { key: 'system', icon: IconMonitor },
];

export default function SettingsPage() {
  const { isAuthenticated } = useAuth();
  const { language, languages, setLanguage, t } = useLanguage();
  const { prefs, setPref } = useNotifications();
  const { theme, setTheme, reduceMotion, setReduceMotion } = useAppSettings();

  return (
    <main className="max-w-[720px] mx-auto px-4 sm:px-6 lg:px-10 pt-9 pb-20 animate-fade-up">
      <h1 className="font-display text-[28px] font-bold m-0 mb-1.5 tracking-tight text-ink">{t('settings.title')}</h1>
      <p className="text-sm text-text-muted mb-7">{t('settings.subtitle')}</p>

      <div className="flex flex-col gap-5">
        {/* Language */}
        <SectionCard icon={IconGlobe} title={t('settings.languageTitle')} description={t('settings.languageDesc')}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {languages.map((lang) => {
              const active = lang.code === language;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setLanguage(lang.code)}
                  aria-pressed={active}
                  className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left cursor-pointer transition-all ${
                    active
                      ? 'border-green bg-green-tint'
                      : 'border-border bg-surface hover:border-green/30 hover:bg-surface-muted'
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block text-[14px] font-semibold text-ink" dir={lang.dir}>
                      {lang.nativeName}
                    </span>
                    <span className="block text-[11.5px] text-text-muted mt-0.5">{lang.englishName}</span>
                  </span>
                  {active && (
                    <span className="w-5 h-5 rounded-full bg-green text-white flex items-center justify-center shrink-0">
                      <IconCheck width="11" height="11" strokeWidth="3" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <p className="text-[11.5px] text-text-muted mt-3.5">
            {isAuthenticated ? t('settings.languageSyncHint') : t('settings.languageGuestHint')}
          </p>
        </SectionCard>

        {/* Notification Preferences */}
        <SectionCard icon={IconBell} title={t('settings.notificationsTitle')} description={t('settings.notificationsDesc')}>
          <div className="divide-y divide-border">
            <PreferenceRow
              title={t('settings.notifMaster')}
              description={t('settings.notifMasterDesc')}
              checked={prefs.master}
              onChange={(v) => setPref('master', v)}
            />
            <PreferenceRow
              title={t('settings.notifOrders')}
              description={t('settings.notifOrdersDesc')}
              checked={prefs.orders}
              onChange={(v) => setPref('orders', v)}
              disabled={!prefs.master}
            />
            <PreferenceRow
              title={t('settings.notifWishlist')}
              description={t('settings.notifWishlistDesc')}
              checked={prefs.wishlist}
              onChange={(v) => setPref('wishlist', v)}
              disabled={!prefs.master}
            />
            <PreferenceRow
              title={t('settings.notifAccount')}
              description={t('settings.notifAccountDesc')}
              checked={prefs.account}
              onChange={(v) => setPref('account', v)}
              disabled={!prefs.master}
            />
          </div>
        </SectionCard>

        {/* App Settings */}
        <SectionCard icon={IconSliders} title={t('settings.appSettingsTitle')} description={t('settings.appSettingsDesc')}>
          <div>
            <p className="text-[13.5px] font-semibold text-ink mb-2.5">{t('settings.themeLabel')}</p>
            <div className="grid grid-cols-3 gap-2.5">
              {THEME_OPTIONS.map(({ key, icon: Icon }) => {
                const active = theme === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTheme(key)}
                    aria-pressed={active}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 cursor-pointer transition-all ${
                      active
                        ? 'border-green bg-green-tint text-green'
                        : 'border-border bg-surface text-text-muted hover:border-green/30 hover:bg-surface-muted'
                    }`}
                  >
                    <Icon width="18" height="18" />
                    <span className="text-[12px] font-semibold text-ink">{t(`settings.theme${key[0].toUpperCase()}${key.slice(1)}`)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-border mt-4 pt-1">
            <PreferenceRow
              title={t('settings.reduceMotion')}
              description={t('settings.reduceMotionDesc')}
              checked={reduceMotion}
              onChange={setReduceMotion}
            />
          </div>

          <p className="text-[11.5px] text-text-muted mt-3">{t('settings.deviceOnlyHint')}</p>
        </SectionCard>
      </div>
    </main>
  );
}
