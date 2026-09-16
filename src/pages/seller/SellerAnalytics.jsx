import { useEffect, useState } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { seller } from '../../lib/api';
import { formatPKR } from '../../data/mockData';
import SellerCard from '../../components/seller/SellerCard';
import StatCard from '../../components/seller/StatCard';

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
      <div className="font-semibold text-ink mb-1">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="text-text-muted">
          {p.name}: <span className="font-semibold text-ink-soft">{p.dataKey === 'revenue' ? formatPKR(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function SellerAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    seller
      .analytics()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const totalRevenue = data?.daily?.reduce((sum, d) => sum + d.revenue, 0) ?? 0;
  const totalOrders = data?.daily?.reduce((sum, d) => sum + d.orders, 0) ?? 0;

  const chartDaily = (data?.daily || []).map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
  }));

  return (
    <div className="animate-fade-up flex flex-col gap-4">
      {loading && (
        <div className="flex flex-col gap-4">
          <div className="animate-pulse bg-surface border border-border rounded-2xl h-[280px]" />
          <div className="animate-pulse bg-surface border border-border rounded-2xl h-[240px]" />
        </div>
      )}

      {!loading && error && (
        <div className="bg-surface border border-dashed border-border-strong rounded-2xl p-8 text-center text-orange-text text-sm">{error}</div>
      )}

      {!loading && !error && data && (
        <>
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <StatCard label="Revenue" value={formatPKR(totalRevenue)} note="Last 30 days" />
            <StatCard label="Orders" value={totalOrders} note="Last 30 days" />
          </div>

          <SellerCard eyebrow="Revenue trend — last 30 days">
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartDaily} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3B6FE0" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#3B6FE0" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E2745" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#68769B' }} axisLine={{ stroke: '#1E2745' }} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11, fill: '#68769B' }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#5B8DEF" strokeWidth={2} fill="url(#revenueFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </SellerCard>

          <SellerCard eyebrow="Top products by revenue">
            {data.topProducts.length === 0 ? (
              <p className="text-sm text-text-muted py-6 text-center">No sales yet.</p>
            ) : (
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.topProducts} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E2745" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#68769B' }} axisLine={false} tickLine={false} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 11, fill: '#68769B' }}
                      axisLine={false}
                      tickLine={false}
                      width={140}
                      tickFormatter={(v) => (v.length > 20 ? `${v.slice(0, 20)}…` : v)}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="revenue" name="Revenue" fill="#6FDFCE" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </SellerCard>
        </>
      )}
    </div>
  );
}
