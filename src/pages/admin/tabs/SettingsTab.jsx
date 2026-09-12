import Card from '../../../components/admin/ui/Card';
import Button from '../../../components/admin/ui/Button';
import Select from '../../../components/admin/ui/Select';

const fieldClass =
  'w-full px-3.5 py-2.5 border border-[var(--admin-border)] rounded-lg text-sm outline-none focus:border-[var(--admin-primary)] bg-[var(--admin-surface)] text-[var(--admin-ink)] transition-shadow focus:shadow-[0_0_0_3px_var(--admin-primary-tint)]';
const labelClass = 'block text-[12.5px] font-semibold text-[var(--admin-ink-soft)] mb-1.5';

export default function SettingsTab({
  user,
  profileForm,
  setProfileForm,
  profileSaving,
  profileSaveError,
  handleSaveProfile,
  settingsLoading,
  settingsError,
  settingsForm,
  setSettingsForm,
  settingsSaving,
  settingsSaveError,
  handleSaveSettings,
  tcsCostCenters,
  tcsCostCentersLoading,
  tcsCostCentersError,
  loadTcsCostCenters,
}) {
  return (
    <>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-[var(--admin-ink)] tracking-tight">Settings</h1>
        <p className="text-sm text-[var(--admin-text)] mt-1">Your admin profile, and basic marketplace-wide settings.</p>
      </div>

      <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        <Card>
          <h2 className="font-display text-base font-bold text-[var(--admin-ink)] mb-4">Your profile</h2>
          {profileSaveError && <p className="text-sm text-[var(--admin-danger)] bg-[var(--admin-danger-tint)] rounded-lg px-3.5 py-2.5 mb-4">{profileSaveError}</p>}
          <div className="flex flex-col gap-3.5">
            <div>
              <label className={labelClass}>Name</label>
              <input type="text" value={profileForm.companyName} onChange={(e) => setProfileForm((f) => ({ ...f, companyName: e.target.value }))} className={fieldClass} />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input type="text" value={profileForm.phone} onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))} className={fieldClass} />
            </div>
            <div>
              <label className={labelClass}>Country</label>
              <input type="text" value={profileForm.country} onChange={(e) => setProfileForm((f) => ({ ...f, country: e.target.value }))} className={fieldClass} />
            </div>
            <div className="text-xs text-[var(--admin-text-muted)]">Email: {user.email}</div>
            <Button className="self-start" loading={profileSaving} disabled={!profileForm.companyName.trim()} onClick={handleSaveProfile}>
              Save profile
            </Button>
          </div>
        </Card>

        <Card>
          <h2 className="font-display text-base font-bold text-[var(--admin-ink)] mb-4">Marketplace settings</h2>
          {settingsLoading && <div className="animate-pulse h-40 bg-[var(--admin-canvas)] rounded-xl" />}
          {!settingsLoading && settingsError && <p className="text-sm text-[var(--admin-danger)]">{settingsError}</p>}
          {!settingsLoading && !settingsError && settingsForm && (
            <div className="flex flex-col gap-3.5">
              {settingsSaveError && <p className="text-sm text-[var(--admin-danger)] bg-[var(--admin-danger-tint)] rounded-lg px-3.5 py-2.5">{settingsSaveError}</p>}
              <div>
                <label className={labelClass}>Marketplace name</label>
                <input type="text" value={settingsForm.siteName} onChange={(e) => setSettingsForm((f) => ({ ...f, siteName: e.target.value }))} className={fieldClass} />
              </div>
              <div>
                <label className={labelClass}>Support email</label>
                <input type="email" value={settingsForm.supportEmail} onChange={(e) => setSettingsForm((f) => ({ ...f, supportEmail: e.target.value }))} className={fieldClass} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Commission rate (%)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={settingsForm.commissionRatePercent}
                    onChange={(e) => setSettingsForm((f) => ({ ...f, commissionRatePercent: e.target.value }))}
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Currency</label>
                  <input type="text" value={settingsForm.currency} onChange={(e) => setSettingsForm((f) => ({ ...f, currency: e.target.value }))} className={fieldClass} />
                </div>
              </div>
              <label className="flex items-center gap-2.5 text-[13.5px] font-medium text-[var(--admin-ink)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={settingsForm.maintenanceMode}
                  onChange={(e) => setSettingsForm((f) => ({ ...f, maintenanceMode: e.target.checked }))}
                  className="w-4 h-4 accent-[var(--admin-primary)] cursor-pointer"
                />
                Maintenance mode
              </label>
              <Button className="self-start" loading={settingsSaving} disabled={!settingsForm.siteName?.trim()} onClick={handleSaveSettings}>
                Save settings
              </Button>
            </div>
          )}
        </Card>

        <Card>
          <h2 className="font-display text-base font-bold text-[var(--admin-ink)] mb-1">TCS shipping</h2>
          <p className="text-xs text-[var(--admin-text-muted)] mb-4">
            One-time setup — once these are set, every seller's "Ship with Falsafah" click books a real TCS Courier shipment
            automatically, with no extra input from them.
          </p>
          {!settingsLoading && !settingsError && settingsForm && (
            <div className="flex flex-col gap-3.5">
              <div>
                <label className={labelClass}>Cost center</label>
                {tcsCostCenters ? (
                  <Select
                    className="w-full"
                    value={settingsForm.tcsCostCenterCode || ''}
                    onChange={(e) => setSettingsForm((f) => ({ ...f, tcsCostCenterCode: e.target.value }))}
                  >
                    <option value="">Select a cost center…</option>
                    {tcsCostCenters.map((c) => (
                      <option key={c.costcentercode} value={c.costcentercode}>
                        {c.costcentercode} — {c.costcentername}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={settingsForm.tcsCostCenterCode || ''}
                      onChange={(e) => setSettingsForm((f) => ({ ...f, tcsCostCenterCode: e.target.value }))}
                      placeholder="e.g. 001 - LHR"
                      className={`flex-1 ${fieldClass}`}
                    />
                    <Button variant="secondary" size="sm" className="shrink-0" loading={tcsCostCentersLoading} onClick={loadTcsCostCenters}>
                      Load from TCS
                    </Button>
                  </div>
                )}
                {tcsCostCentersError && <p className="text-xs text-[var(--admin-danger)] mt-1.5">{tcsCostCentersError}</p>}
              </div>
              <div>
                <label className={labelClass}>Service code</label>
                <input
                  type="text"
                  value={settingsForm.tcsServiceCode || ''}
                  onChange={(e) => setSettingsForm((f) => ({ ...f, tcsServiceCode: e.target.value }))}
                  placeholder="e.g. O"
                  className={fieldClass}
                />
              </div>
              <div>
                <label className={labelClass}>Default parcel weight (kg)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={settingsForm.tcsDefaultWeightKg ?? ''}
                  onChange={(e) => setSettingsForm((f) => ({ ...f, tcsDefaultWeightKg: e.target.value }))}
                  className={fieldClass}
                />
                <p className="text-[11.5px] text-[var(--admin-text-muted)] mt-1.5">Used for every booking until per-product weight is tracked — TCS requires at least 0.5kg.</p>
              </div>
              <Button className="self-start" loading={settingsSaving} onClick={handleSaveSettings}>
                Save TCS settings
              </Button>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
