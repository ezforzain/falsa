import VerifiedBadge from '../../../components/VerifiedBadge';
import Card from '../../../components/admin/ui/Card';
import Button from '../../../components/admin/ui/Button';
import { IconShield } from '../../../components/icons';

export default function SellersTab({ list, loading, error, actionError, pendingId, toggleOfficialStore, toggleVerified }) {
  return (
    <>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-[var(--admin-ink)] tracking-tight">Sellers</h1>
        <p className="text-sm text-[var(--admin-text)] mt-1">
          Verify or unverify seller stores. Only admins can change this — sellers cannot verify themselves.
        </p>
      </div>

      {actionError && <p className="text-sm text-[var(--admin-danger)] bg-[var(--admin-danger-tint)] rounded-lg px-3.5 py-2.5 mb-5">{actionError}</p>}

      <Card padded={false}>
        {loading && (
          <div className="p-6 flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse h-12 bg-[var(--admin-canvas)] rounded-xl" />
            ))}
          </div>
        )}

        {!loading && error && <div className="p-8 text-center text-sm text-[var(--admin-danger)]">{error}</div>}

        {!loading &&
          !error &&
          list.map((s, i) => (
            <div key={s.id} className={`flex items-center justify-between gap-4 px-5 py-4 flex-wrap ${i !== list.length - 1 ? 'border-b border-[var(--admin-border)]' : ''}`}>
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-9 h-9 rounded-lg bg-[var(--admin-primary-tint)] flex items-center justify-center shrink-0">
                  <IconShield width="16" height="16" className="text-[var(--admin-primary)]" strokeWidth="2.2" />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-[14.5px] text-[var(--admin-ink)] truncate">{s.name}</span>
                    {s.verified && <VerifiedBadge size={16} />}
                  </div>
                  <span className={`text-xs font-medium ${s.verified ? 'text-[var(--admin-success)]' : 'text-[var(--admin-text-muted)]'}`}>
                    {s.verified ? 'Verified Store' : 'Not verified'}
                    {s.officialStore ? ' · Official Store' : ''}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant={s.officialStore ? 'secondary' : 'primary'}
                  size="sm"
                  loading={pendingId === s.id}
                  onClick={() => toggleOfficialStore(s)}
                >
                  {s.officialStore ? 'Remove official store' : 'Mark official store'}
                </Button>
                <Button
                  variant={s.verified ? 'secondary' : 'primary'}
                  size="sm"
                  loading={pendingId === s.id}
                  onClick={() => toggleVerified(s)}
                >
                  {s.verified ? 'Remove verification' : 'Verify store'}
                </Button>
              </div>
            </div>
          ))}

        {!loading && !error && list.length === 0 && <div className="p-10 text-center text-sm text-[var(--admin-text)]">No stores found.</div>}
      </Card>
    </>
  );
}
