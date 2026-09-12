import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatPKR } from '../../../data/mockData';
import Card from '../../../components/admin/ui/Card';

const PIE_COLORS = ['#7C3AED', '#C97B2D', '#2D6FC9', '#1E8E5A', '#B03A2C'];

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-lg px-3 py-2 shadow-[var(--admin-shadow-md)] text-xs">
      <div className="font-semibold text-[var(--admin-ink)] mb-1">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="text-[var(--admin-text-muted)]">
          {p.name}: <span className="font-semibold text-[var(--admin-ink-soft)]">{p.dataKey === 'revenue' ? formatPKR(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function ReportsTab({ reports, reportsLoading, reportsError }) {
  return (
    <>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-[var(--admin-ink)] tracking-tight">Reports</h1>
        <p className="text-sm text-[var(--admin-text)] mt-1">Sales, order, and seller performance statistics across the marketplace.</p>
      </div>

      {reportsLoading && (
        <div className="flex flex-col gap-4">
          <div className="animate-pulse bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-2xl h-[280px]" />
          <div className="animate-pulse bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-2xl h-[240px]" />
        </div>
      )}

      {!reportsLoading && reportsError && <Card className="border-dashed text-center text-[var(--admin-danger)] text-sm">{reportsError}</Card>}

      {!reportsLoading && !reportsError && reports && (
        <>
          <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
            <Card>
              <div className="font-display text-xl font-bold text-[var(--admin-ink)]">{formatPKR(reports.daily.reduce((sum, d) => sum + d.revenue, 0))}</div>
              <div className="text-xs text-[var(--admin-text-muted)] mt-0.5">Revenue (last 30 days)</div>
            </Card>
            <Card>
              <div className="font-display text-xl font-bold text-[var(--admin-ink)]">{reports.daily.reduce((sum, d) => sum + d.orders, 0)}</div>
              <div className="text-xs text-[var(--admin-text-muted)] mt-0.5">Orders (last 30 days)</div>
            </Card>
            {Object.entries(reports.statusBreakdown).map(([statusKey, count]) => (
              <Card key={statusKey}>
                <div className="font-display text-xl font-bold text-[var(--admin-ink)]">{count}</div>
                <div className="text-xs text-[var(--admin-text-muted)] mt-0.5">{statusKey} orders</div>
              </Card>
            ))}
          </div>

          <Card className="mb-6">
            <h2 className="font-display text-base font-bold text-[var(--admin-ink)] mb-4">Revenue trend</h2>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={reports.daily.map((d) => ({ ...d, label: new Date(d.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) }))}
                  margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="adminRevenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#7C3AED" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--admin-border)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--admin-text-muted)' }} axisLine={{ stroke: 'var(--admin-border)' }} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--admin-text-muted)' }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#7C3AED" strokeWidth={2} fill="url(#adminRevenueFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
            <Card>
              <h2 className="font-display text-base font-bold text-[var(--admin-ink)] mb-4">Top sellers by revenue</h2>
              {reports.sellerPerformance.length === 0 ? (
                <p className="text-sm text-[var(--admin-text-muted)] py-6 text-center">No sales yet.</p>
              ) : (
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reports.sellerPerformance} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--admin-border)" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--admin-text-muted)' }} axisLine={false} tickLine={false} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fontSize: 11, fill: 'var(--admin-text-muted)' }}
                        axisLine={false}
                        tickLine={false}
                        width={120}
                        tickFormatter={(v) => (v.length > 16 ? `${v.slice(0, 16)}…` : v)}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="revenue" name="Revenue" fill="#7C3AED" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            <Card>
              <h2 className="font-display text-base font-bold text-[var(--admin-ink)] mb-4">Orders by status</h2>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={Object.entries(reports.statusBreakdown).map(([name, value]) => ({ name, value }))}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={2}
                    >
                      {Object.keys(reports.statusBreakdown).map((key, i) => (
                        <Cell key={key} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-center mt-2">
                {Object.keys(reports.statusBreakdown).map((key, i) => (
                  <span key={key} className="flex items-center gap-1.5 text-xs text-[var(--admin-text-muted)]">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    {key}
                  </span>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}
    </>
  );
}
