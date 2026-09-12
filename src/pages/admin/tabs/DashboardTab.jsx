import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatPKR } from '../../../data/mockData';
import { statusBadgeClass } from '../../seller/statusStyles';
import VerifiedBadge from '../../../components/VerifiedBadge';
import Card, { CardHeader } from '../../../components/admin/ui/Card';
import StatCard from '../../../components/admin/ui/StatCard';
import { IconBox, IconCheck, IconChevronRight, IconClock, IconReceipt, IconStore, IconUser, IconWallet } from '../../../components/icons';

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-lg px-3 py-2 shadow-[var(--admin-shadow-md)] text-xs">
      <div className="font-semibold text-[var(--admin-ink)] mb-1">{label}</div>
      <div className="text-[var(--admin-text-muted)]">
        Revenue: <span className="font-semibold text-[var(--admin-ink-soft)]">{formatPKR(payload[0].value)}</span>
      </div>
    </div>
  );
}

export default function DashboardTab({ overview, overviewLoading, overviewError, usersList, reports, reportsLoading, products, onNavigate }) {
  return (
    <>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-[var(--admin-ink)] tracking-tight">Dashboard</h1>
        <p className="text-sm text-[var(--admin-text)] mt-1">A snapshot of the whole marketplace, right now.</p>
      </div>

      {overviewLoading && (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-2xl h-[100px]" />
          ))}
        </div>
      )}

      {!overviewLoading && overviewError && (
        <Card className="border-dashed text-center text-[var(--admin-danger)] text-sm">{overviewError}</Card>
      )}

      {!overviewLoading && !overviewError && overview && (
        <>
          <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
            <StatCard label="Total sellers" value={overview.totals.sellers.toLocaleString('en-US')} icon={IconStore} tone="primary" />
            <StatCard label="Total products" value={overview.totals.products.toLocaleString('en-US')} icon={IconBox} tone="info" />
            <StatCard label="Total orders" value={overview.totals.orders.toLocaleString('en-US')} icon={IconReceipt} tone="primary" />
            <StatCard label="Total users" value={usersList.length.toLocaleString('en-US')} icon={IconUser} tone="info" />
            <StatCard label="Revenue" value={formatPKR(overview.totals.revenue)} icon={IconWallet} tone="success" />
            <StatCard label="Pending orders" value={overview.totals.pendingOrders.toLocaleString('en-US')} icon={IconClock} tone="warning" />
            {!reportsLoading && reports && (
              <StatCard label="Delivered orders" value={(reports.statusBreakdown.Delivered || 0).toLocaleString('en-US')} icon={IconCheck} tone="success" />
            )}
          </div>

          {!reportsLoading && reports?.daily?.length > 0 && (
            <Card className="mb-6" padded={false}>
              <CardHeader title="Sales overview" description="Revenue over the last 30 days" />
              <div className="h-[220px] p-5">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={reports.daily.map((d) => ({ ...d, label: new Date(d.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) }))}
                    margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="dashboardRevenueFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#7C3AED" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--admin-border)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--admin-text-muted)' }} axisLine={{ stroke: 'var(--admin-border)' }} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--admin-text-muted)' }} axisLine={false} tickLine={false} width={40} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#7C3AED" strokeWidth={2} fill="url(#dashboardRevenueFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            <Card padded={false}>
              <CardHeader
                title="Recent orders"
                action={
                  <button type="button" onClick={() => onNavigate('orders')} className="cursor-pointer text-xs font-semibold text-[var(--admin-primary)] hover:text-[var(--admin-primary-hover)] flex items-center gap-1">
                    View all <IconChevronRight width="12" height="12" />
                  </button>
                }
              />
              {overview.recentOrders.length === 0 ? (
                <p className="text-sm text-[var(--admin-text-muted)] p-6 text-center">No orders yet.</p>
              ) : (
                overview.recentOrders.map((o) => (
                  <div key={o.id} className="flex items-center gap-3 px-5 py-3 border-b border-[var(--admin-border)] last:border-0 hover:bg-[var(--admin-surface-hover)] transition-colors">
                    <span className="shrink-0 w-8 h-8 rounded-full bg-[var(--admin-primary-tint)] text-[var(--admin-primary)] flex items-center justify-center">
                      <IconReceipt width="14" height="14" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-[13.5px] text-[var(--admin-ink)] truncate">{o.buyerCompany}</div>
                      <div className="text-xs text-[var(--admin-text-muted)] truncate">{o.sellerName} · {o.productName}</div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-semibold text-[13.5px] text-[var(--admin-ink)]">{formatPKR(o.total)}</div>
                      <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${statusBadgeClass(o.status)}`}>{o.status}</span>
                    </div>
                  </div>
                ))
              )}
            </Card>

            <Card padded={false}>
              <CardHeader
                title="Recent sellers"
                action={
                  <button type="button" onClick={() => onNavigate('stores')} className="cursor-pointer text-xs font-semibold text-[var(--admin-primary)] hover:text-[var(--admin-primary-hover)] flex items-center gap-1">
                    View all <IconChevronRight width="12" height="12" />
                  </button>
                }
              />
              {overview.recentSellers.length === 0 ? (
                <p className="text-sm text-[var(--admin-text-muted)] p-6 text-center">No sellers yet.</p>
              ) : (
                overview.recentSellers.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 px-5 py-3 border-b border-[var(--admin-border)] last:border-0 hover:bg-[var(--admin-surface-hover)] transition-colors">
                    <span className="shrink-0 w-8 h-8 rounded-full bg-[var(--admin-info-tint)] text-[var(--admin-info)] flex items-center justify-center">
                      <IconStore width="14" height="14" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-[13.5px] text-[var(--admin-ink)] truncate">{s.companyName}</div>
                      <div className="text-xs text-[var(--admin-text-muted)] truncate">{s.email}</div>
                    </div>
                    {s.createdAt && (
                      <span className="shrink-0 text-[11px] text-[var(--admin-text-muted)]">
                        {new Date(s.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                ))
              )}
            </Card>

            <Card padded={false}>
              <CardHeader
                title="Recent products"
                action={
                  <button type="button" onClick={() => onNavigate('products')} className="cursor-pointer text-xs font-semibold text-[var(--admin-primary)] hover:text-[var(--admin-primary-hover)] flex items-center gap-1">
                    View all <IconChevronRight width="12" height="12" />
                  </button>
                }
              />
              {products.length === 0 ? (
                <p className="text-sm text-[var(--admin-text-muted)] p-6 text-center">No products yet.</p>
              ) : (
                products.slice(0, 5).map((p) => (
                  <div key={p.id} className="flex items-center gap-3 px-5 py-3 border-b border-[var(--admin-border)] last:border-0 hover:bg-[var(--admin-surface-hover)] transition-colors">
                    <img src={p.img} alt="" className="shrink-0 w-8 h-8 rounded-lg object-cover bg-[var(--admin-canvas)]" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="font-semibold text-[13.5px] text-[var(--admin-ink)] truncate">{p.name}</span>
                        {p.verified && <VerifiedBadge size={12} />}
                      </div>
                      <div className="text-xs text-[var(--admin-text-muted)] truncate">{p.sellerName}</div>
                    </div>
                    <div className="shrink-0 text-[13px] font-semibold text-[var(--admin-ink)]">{p.price}</div>
                  </div>
                ))
              )}
            </Card>
          </div>
        </>
      )}
    </>
  );
}
