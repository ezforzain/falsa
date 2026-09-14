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
    <div className="bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-lg px-3.5 py-2.5 shadow-[var(--admin-shadow-md)] text-xs">
      <div className="font-semibold text-[var(--admin-ink)] mb-1">{label}</div>
      <div className="text-[var(--admin-text-muted)]">
        Revenue: <span className="font-semibold text-[var(--admin-ink-soft)]">{formatPKR(payload[0].value)}</span>
      </div>
    </div>
  );
}

// Compact axis labels ("Rs 500K" instead of "Rs 500,000") so the Y-axis never gets clipped by a
// narrow gutter regardless of how large revenue numbers get.
const compactPKR = (n) => `Rs ${new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n)}`;

function ViewAllLink({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer flex items-center gap-1 text-[13px] font-semibold text-[var(--admin-primary)] hover:text-[var(--admin-primary-hover)] px-2.5 py-1.5 -mr-2.5 rounded-lg hover:bg-[var(--admin-primary-tint)] transition-colors"
    >
      View all <IconChevronRight width="13" height="13" />
    </button>
  );
}

export default function DashboardTab({ overview, overviewLoading, overviewError, usersList, reports, reportsLoading, products, onNavigate }) {
  // Simple week-over-week revenue trend from data already fetched for the chart below (no new
  // API calls) — only shown once there are at least two full weeks of daily data AND the prior
  // week had enough revenue for a percentage to be meaningful (a near-zero prior week turns any
  // uptick into a nonsensical four-to-six-digit percentage, which is worse than showing nothing).
  let revenueTrend = null;
  if (reports?.daily?.length >= 14) {
    const days = reports.daily;
    const lastWeek = days.slice(-7).reduce((sum, d) => sum + d.revenue, 0);
    const priorWeek = days.slice(-14, -7).reduce((sum, d) => sum + d.revenue, 0);
    const totalRevenue = days.reduce((sum, d) => sum + d.revenue, 0);
    if (priorWeek > totalRevenue * 0.02) {
      const pct = Math.round(((lastWeek - priorWeek) / priorWeek) * 100);
      if (Math.abs(pct) <= 999) revenueTrend = pct;
    }
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-[var(--admin-ink)] tracking-tight">Dashboard</h1>
        <p className="text-sm text-[var(--admin-text)] mt-1.5">Overview of your marketplace performance.</p>
      </div>

      {overviewLoading && (
        <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-2xl h-[128px]" />
          ))}
        </div>
      )}

      {!overviewLoading && overviewError && (
        <Card className="border-dashed text-center text-[var(--admin-danger)] text-sm">{overviewError}</Card>
      )}

      {!overviewLoading && !overviewError && overview && (
        <>
          <div className="mb-5">
            <StatCard
              label="Revenue"
              value={formatPKR(overview.totals.revenue)}
              icon={IconWallet}
              tone="success"
              emphasis
              trend={revenueTrend}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-5 mb-8">
            <StatCard label="Total sellers" value={overview.totals.sellers.toLocaleString('en-US')} icon={IconStore} tone="primary" />
            <StatCard label="Total products" value={overview.totals.products.toLocaleString('en-US')} icon={IconBox} tone="info" />
            <StatCard label="Total orders" value={overview.totals.orders.toLocaleString('en-US')} icon={IconReceipt} tone="primary" />
            <StatCard label="Total users" value={usersList.length.toLocaleString('en-US')} icon={IconUser} tone="info" />
            <StatCard label="Pending orders" value={overview.totals.pendingOrders.toLocaleString('en-US')} icon={IconClock} tone="warning" />
            <StatCard
              label="Delivered orders"
              value={!reportsLoading && reports ? (reports.statusBreakdown.Delivered || 0).toLocaleString('en-US') : '—'}
              icon={IconCheck}
              tone="success"
            />
          </div>

          {!reportsLoading && reports?.daily?.length > 0 && (
            <Card className="mb-8" padded={false}>
              <CardHeader
                title="Sales overview"
                description="Revenue over the last 30 days"
                action={
                  <div className="text-right">
                    <div className="font-display text-xl font-bold text-[var(--admin-ink)]">
                      {formatPKR(reports.daily.reduce((sum, d) => sum + d.revenue, 0))}
                    </div>
                    <div className="text-[11px] text-[var(--admin-text-muted)]">30-day total</div>
                  </div>
                }
              />
              <div className="h-[320px] p-6">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={reports.daily.map((d) => ({ ...d, label: new Date(d.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) }))}
                    margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="dashboardRevenueFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.28} />
                        <stop offset="100%" stopColor="#7C3AED" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--admin-border)" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 12, fill: 'var(--admin-text-muted)' }}
                      axisLine={{ stroke: 'var(--admin-border)' }}
                      tickLine={false}
                      interval="preserveStartEnd"
                      minTickGap={24}
                    />
                    <YAxis tick={{ fontSize: 12, fill: 'var(--admin-text-muted)' }} axisLine={false} tickLine={false} width={68} tickFormatter={compactPKR} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#7C3AED" strokeWidth={2.5} fill="url(#dashboardRevenueFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <Card padded={false}>
              <CardHeader title="Recent orders" action={<ViewAllLink onClick={() => onNavigate('orders')} />} />
              {overview.recentOrders.length === 0 ? (
                <p className="text-sm text-[var(--admin-text-muted)] p-8 text-center">No orders yet.</p>
              ) : (
                overview.recentOrders.map((o) => (
                  <div key={o.id} className="flex items-center gap-3.5 px-6 py-4 border-b border-[var(--admin-border)] last:border-0 hover:bg-[var(--admin-surface-hover)] transition-colors">
                    <span className="shrink-0 w-9 h-9 rounded-full bg-[var(--admin-primary-tint)] text-[var(--admin-primary)] flex items-center justify-center">
                      <IconReceipt width="15" height="15" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm text-[var(--admin-ink)] truncate">{o.buyerCompany}</div>
                      <div className="text-xs text-[var(--admin-text-muted)] truncate mt-0.5">{o.sellerName} · {o.productName}</div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-semibold text-sm text-[var(--admin-ink)]">{formatPKR(o.total)}</div>
                      <span className={`inline-block text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded mt-1 ${statusBadgeClass(o.status)}`}>{o.status}</span>
                    </div>
                  </div>
                ))
              )}
            </Card>

            <Card padded={false}>
              <CardHeader title="Recent sellers" action={<ViewAllLink onClick={() => onNavigate('stores')} />} />
              {overview.recentSellers.length === 0 ? (
                <p className="text-sm text-[var(--admin-text-muted)] p-8 text-center">No sellers yet.</p>
              ) : (
                overview.recentSellers.map((s) => (
                  <div key={s.id} className="flex items-center gap-3.5 px-6 py-4 border-b border-[var(--admin-border)] last:border-0 hover:bg-[var(--admin-surface-hover)] transition-colors">
                    <span className="shrink-0 w-9 h-9 rounded-full bg-[var(--admin-info-tint)] text-[var(--admin-info)] flex items-center justify-center">
                      <IconStore width="15" height="15" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm text-[var(--admin-ink)] truncate">{s.companyName}</div>
                      <div className="text-xs text-[var(--admin-text-muted)] truncate mt-0.5">{s.email}</div>
                    </div>
                    {s.createdAt && (
                      <span className="shrink-0 text-xs text-[var(--admin-text-muted)]">
                        {new Date(s.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                ))
              )}
            </Card>

            <Card padded={false}>
              <CardHeader title="Recent products" action={<ViewAllLink onClick={() => onNavigate('products')} />} />
              {products.length === 0 ? (
                <p className="text-sm text-[var(--admin-text-muted)] p-8 text-center">No products yet.</p>
              ) : (
                products.slice(0, 5).map((p) => (
                  <div key={p.id} className="flex items-center gap-3.5 px-6 py-4 border-b border-[var(--admin-border)] last:border-0 hover:bg-[var(--admin-surface-hover)] transition-colors">
                    <img src={p.img} alt="" className="shrink-0 w-9 h-9 rounded-lg object-cover bg-[var(--admin-canvas)]" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="font-semibold text-sm text-[var(--admin-ink)] truncate">{p.name}</span>
                        {p.verified && <VerifiedBadge size={12} />}
                      </div>
                      <div className="text-xs text-[var(--admin-text-muted)] truncate mt-0.5">{p.sellerName}</div>
                    </div>
                    <div className="shrink-0 text-sm font-semibold text-[var(--admin-ink)]">{p.price}</div>
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
