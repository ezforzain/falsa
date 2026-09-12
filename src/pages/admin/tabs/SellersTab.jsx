import { useEffect, useState } from 'react';
import VerifiedBadge from '../../../components/VerifiedBadge';
import Card from '../../../components/admin/ui/Card';
import Button from '../../../components/admin/ui/Button';
import SearchInput from '../../../components/admin/ui/SearchInput';
import Pagination from '../../../components/admin/ui/Pagination';
import EmptyState from '../../../components/admin/ui/EmptyState';
import { IconShield } from '../../../components/icons';

const PAGE_SIZE = 10;

export default function SellersTab({ list, loading, error, actionError, pendingId, toggleOfficialStore, toggleVerified }) {
  // Client-side search/pagination over the already-fetched `list` — no new API calls.
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filtered = search.trim() ? list.filter((s) => s.name.toLowerCase().includes(search.trim().toLowerCase())) : list;

  useEffect(() => setPage(1), [search, list.length]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-[var(--admin-ink)] tracking-tight">Sellers</h1>
        <p className="text-sm text-[var(--admin-text)] mt-1.5">
          Verify or unverify seller stores. Only admins can change this — sellers cannot verify themselves.
        </p>
      </div>

      {actionError && <p className="text-sm text-[var(--admin-danger)] bg-[var(--admin-danger-tint)] rounded-lg px-3.5 py-2.5 mb-5">{actionError}</p>}

      {!loading && !error && list.length > 0 && (
        <div className="mb-5">
          <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search sellers by name…" className="max-w-[380px]" />
        </div>
      )}

      <Card padded={false}>
        {loading && (
          <div className="p-6 flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse h-14 bg-[var(--admin-canvas)] rounded-xl" />
            ))}
          </div>
        )}

        {!loading && error && <div className="p-8 text-center text-sm text-[var(--admin-danger)]">{error}</div>}

        {!loading &&
          !error &&
          pageItems.map((s, i) => (
            <div key={s.id} className={`flex items-center justify-between gap-4 px-6 py-4 flex-wrap ${i !== pageItems.length - 1 ? 'border-b border-[var(--admin-border)]' : ''}`}>
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-10 h-10 rounded-lg bg-[var(--admin-primary-tint)] flex items-center justify-center shrink-0">
                  <IconShield width="17" height="17" className="text-[var(--admin-primary)]" strokeWidth="2.2" />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-[15px] text-[var(--admin-ink)] truncate">{s.name}</span>
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

        {!loading && !error && list.length > 0 && filtered.length === 0 && (
          <div className="p-10">
            <EmptyState icon={IconShield} description="No sellers match your search." />
          </div>
        )}

        {!loading && !error && list.length === 0 && <div className="p-10 text-center text-sm text-[var(--admin-text)]">No stores found.</div>}

        {!loading && !error && totalPages > 1 && (
          <Pagination page={page} totalPages={totalPages} onChange={setPage} total={filtered.length} pageSize={PAGE_SIZE} />
        )}
      </Card>
    </>
  );
}
