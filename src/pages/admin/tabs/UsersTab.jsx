import { useEffect, useState } from 'react';
import Avatar from '../../../components/Avatar';
import VerifiedBadge from '../../../components/VerifiedBadge';
import Card from '../../../components/admin/ui/Card';
import Button from '../../../components/admin/ui/Button';
import Badge from '../../../components/admin/ui/Badge';
import SearchInput from '../../../components/admin/ui/SearchInput';
import Select from '../../../components/admin/ui/Select';
import Pagination from '../../../components/admin/ui/Pagination';
import { IconTrash } from '../../../components/icons';

const PAGE_SIZE = 10;

export default function UsersTab({
  usersList,
  usersLoading,
  usersError,
  userSearch,
  setUserSearch,
  userRoleFilter,
  setUserRoleFilter,
  loadUsers,
  currentUser,
  banLabel,
  expandedUserId,
  toggleUserExpand,
  openEditUser,
  userVerifyPendingId,
  handleToggleUserVerified,
  banningUserId,
  setBanningUserId,
  banDays,
  setBanDays,
  banPending,
  submitBan,
  setPermanentBanTarget,
  setDeleteUserTarget,
  userPayoutsLoading,
  userPayouts,
  payoutError,
  payoutForm,
  setPayoutForm,
  payoutSubmitting,
  handleAddPayout,
}) {
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [usersList.length, userSearch, userRoleFilter]);

  const totalPages = Math.max(1, Math.ceil(usersList.length / PAGE_SIZE));
  const pageItems = usersList.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-[var(--admin-ink)] tracking-tight">Users</h1>
        <p className="text-sm text-[var(--admin-text)] mt-1">View, edit, suspend, or delete any buyer, seller, or admin account.</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          loadUsers();
        }}
        className="flex items-center gap-3 flex-wrap mb-5"
      >
        <SearchInput value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Search by name, email, or phone…" />
        <Select value={userRoleFilter} onChange={(e) => setUserRoleFilter(e.target.value)}>
          <option value="">All roles</option>
          <option value="buyer">Buyers</option>
          <option value="seller">Sellers</option>
          <option value="admin">Admins</option>
        </Select>
        <Button type="submit">Search</Button>
      </form>

      <Card padded={false}>
        {usersLoading && (
          <div className="p-6 flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse h-12 bg-[var(--admin-canvas)] rounded-xl" />
            ))}
          </div>
        )}

        {!usersLoading && usersError && <div className="p-8 text-center text-sm text-[var(--admin-danger)]">{usersError}</div>}

        {!usersLoading &&
          !usersError &&
          pageItems.map((u, i) => (
            <div key={u.id} className={i !== pageItems.length - 1 ? 'border-b border-[var(--admin-border)]' : ''}>
              <div className="flex items-center justify-between gap-4 px-5 py-4 flex-wrap">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar src={u.avatarUrl} name={u.companyName} size={36} iconSize={16} bgClassName="bg-[var(--admin-primary-tint)]" iconClassName="text-[var(--admin-primary)]" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-[14.5px] text-[var(--admin-ink)] truncate">{u.companyName}</span>
                      {u.verified && <VerifiedBadge size={14} />}
                      <Badge tone="neutral" className="capitalize">{u.role}</Badge>
                      {u.status === 'suspended' ? (
                        <Badge tone="danger">{banLabel(u) || 'Suspended'}</Badge>
                      ) : (
                        <Badge tone="success" dot>Active</Badge>
                      )}
                    </div>
                    <div className="text-xs text-[var(--admin-text-muted)] truncate">{u.email} · {u.phone}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  {u.role === 'seller' && (
                    <Button variant="secondary" size="sm" onClick={() => toggleUserExpand(u)}>
                      {expandedUserId === u.id ? 'Close' : 'Payouts'}
                    </Button>
                  )}
                  <Button variant="secondary" size="sm" onClick={() => openEditUser(u)}>Edit</Button>
                  <Button
                    size="sm"
                    variant={u.verified ? 'secondary' : 'primary'}
                    loading={userVerifyPendingId === u.id}
                    onClick={() => handleToggleUserVerified(u)}
                    style={u.verified ? undefined : { backgroundColor: '#3B82F6' }}
                  >
                    {u.verified ? 'Remove tick' : 'Blue tick'}
                  </Button>
                  {u.status === 'suspended' ? (
                    <Button size="sm" loading={banPending} disabled={u.id === currentUser.id} onClick={() => submitBan(u, { lift: true }, 'Ban lifted')}>
                      Unban
                    </Button>
                  ) : (
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={u.id === currentUser.id}
                      className={banningUserId === u.id ? 'bg-[var(--admin-danger-tint)]' : ''}
                      onClick={() => {
                        setBanDays('7');
                        setBanningUserId(banningUserId === u.id ? null : u.id);
                      }}
                    >
                      {banningUserId === u.id ? 'Cancel' : 'Ban'}
                    </Button>
                  )}
                  <button
                    type="button"
                    disabled={u.id === currentUser.id}
                    onClick={() => setDeleteUserTarget(u)}
                    aria-label="Delete user"
                    className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center bg-[var(--admin-surface)] border border-[var(--admin-border)] text-[var(--admin-danger)] p-2 rounded-full hover:bg-[var(--admin-danger-tint)] transition-colors"
                  >
                    <IconTrash width="13" height="13" />
                  </button>
                </div>
              </div>

              {banningUserId === u.id && u.status !== 'suspended' && (
                <div className="px-5 pb-4 -mt-1">
                  <div className="flex items-end gap-2 flex-wrap bg-[var(--admin-canvas)] rounded-xl p-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] mb-1">Ban length (days)</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={banDays}
                        onChange={(e) => setBanDays(e.target.value.replace(/[^\d]/g, ''))}
                        className="w-[90px] px-3 py-2 border border-[var(--admin-border)] rounded-lg text-sm outline-none focus:border-[var(--admin-primary)] bg-[var(--admin-surface)] text-[var(--admin-ink)]"
                      />
                    </div>
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={!banDays || Number(banDays) <= 0}
                      loading={banPending}
                      onClick={() => submitBan(u, { days: Number(banDays) }, `Banned for ${banDays} day${banDays === '1' ? '' : 's'}`)}
                    >
                      Ban {banDays || '…'} day{banDays === '1' ? '' : 's'}
                    </Button>
                    <Button variant="secondary" size="sm" disabled={banPending} onClick={() => setPermanentBanTarget(u)}>
                      Permanent ban
                    </Button>
                  </div>
                </div>
              )}

              {expandedUserId === u.id && (
                <div className="px-5 pb-5 bg-[var(--admin-canvas)]/60">
                  <div className="text-[11px] font-semibold text-[var(--admin-text-muted)] mb-2.5 uppercase tracking-wide pt-1">Payout ledger</div>

                  {userPayoutsLoading && <div className="text-sm text-[var(--admin-text-muted)] py-2">Loading…</div>}

                  {!userPayoutsLoading && userPayouts.length > 0 && (
                    <div className="flex flex-col gap-2 mb-4">
                      {userPayouts.map((p) => (
                        <div key={p.id} className="flex items-center justify-between gap-3 bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-lg px-3.5 py-2.5 text-sm">
                          <div className="min-w-0">
                            <span className="font-semibold text-[var(--admin-ink)]">Rs {Number(p.amount).toLocaleString('en-US')}</span>
                            <span className="text-xs text-[var(--admin-text-muted)] ml-2 capitalize">{p.method.replace('_', ' ')}</span>
                            {p.reference && <span className="text-xs text-[var(--admin-text-muted)] ml-2">Ref: {p.reference}</span>}
                          </div>
                          <span className="text-xs text-[var(--admin-text-muted)] shrink-0">
                            {new Date(p.paidAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {!userPayoutsLoading && userPayouts.length === 0 && <p className="text-sm text-[var(--admin-text-muted)] mb-4">No payouts recorded yet.</p>}

                  {payoutError && <p className="text-sm text-[var(--admin-danger)] bg-[var(--admin-danger-tint)] rounded-lg px-3.5 py-2.5 mb-3">{payoutError}</p>}

                  <div className="flex items-end gap-2 flex-wrap">
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] mb-1">Amount (Rs)</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={payoutForm.amount}
                        onChange={(e) => setPayoutForm((f) => ({ ...f, amount: e.target.value }))}
                        className="w-[120px] px-3 py-2 border border-[var(--admin-border)] rounded-lg text-sm outline-none focus:border-[var(--admin-primary)] bg-[var(--admin-surface)] text-[var(--admin-ink)]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] mb-1">Method</label>
                      <Select value={payoutForm.method} onChange={(e) => setPayoutForm((f) => ({ ...f, method: e.target.value }))}>
                        <option value="bank_transfer">Bank transfer</option>
                        <option value="cash">Cash</option>
                        <option value="other">Other</option>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--admin-text-muted)] mb-1">Reference (optional)</label>
                      <input
                        type="text"
                        value={payoutForm.reference}
                        onChange={(e) => setPayoutForm((f) => ({ ...f, reference: e.target.value }))}
                        className="w-[150px] px-3 py-2 border border-[var(--admin-border)] rounded-lg text-sm outline-none focus:border-[var(--admin-primary)] bg-[var(--admin-surface)] text-[var(--admin-ink)]"
                      />
                    </div>
                    <Button size="sm" loading={payoutSubmitting} onClick={() => handleAddPayout(u)}>Record payout</Button>
                  </div>
                </div>
              )}
            </div>
          ))}

        {!usersLoading && !usersError && usersList.length === 0 && <div className="p-10 text-center text-sm text-[var(--admin-text)]">No users found.</div>}

        {!usersLoading && !usersError && usersList.length > 0 && (
          <Pagination page={page} totalPages={totalPages} onChange={setPage} total={usersList.length} pageSize={PAGE_SIZE} />
        )}
      </Card>
    </>
  );
}
