import { useEffect, useState } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { seller } from '../../lib/api';
import { formatPKR } from '../../data/mockData';

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
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
    <div className="animate-fade-up">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-ink tracking-tight">Analytics</h1>
        <p className="text-sm text-text mt-1">Revenue and order trends over the last 30 days.</p>
      </div>

      {loading && (
        <div className="flex flex-col gap-4">
          <div className="animate-pulse bg-white border border-border rounded-2xl h-[280px]" />
          <div className="animate-pulse bg-white border border-border rounded-2xl h-[240px]" />
        </div>
      )}

      {!loading && error && (
        <div className="bg-white border border-dashed border-border-strong rounded-2xl p-8 text-center text-orange-text text-sm">{error}</div>
      )}

      {!loading && !error && data && (
        <>
          <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <div className="bg-white border border-border rounded-2xl p-5">
              <div className="font-display text-xl font-bold text-ink">{formatPKR(totalRevenue)}</div>
              <div className="text-xs text-text-muted mt-0.5">Revenue (last 30 days)</div>
            </div>
            <div className="bg-white border border-border rounded-2xl p-5">
              <div className="font-display text-xl font-bold text-ink">{totalOrders}</div>
              <div className="text-xs text-text-muted mt-0.5">Orders (last 30 days)</div>
            </div>
          </div>

          <div className="bg-white border border-border rounded-2xl p-5 mb-6">
            <h2 className="font-display text-base font-bold text-ink mb-4">Revenue trend</h2>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartDaily} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0E5A46" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#0E5A46" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E4E0D6" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#5A564C' }} axisLine={{ stroke: '#E4E0D6' }} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11, fill: '#5A564C' }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#0E5A46" strokeWidth={2} fill="url(#revenueFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white border border-border rounded-2xl p-5">
            <h2 className="font-display text-base font-bold text-ink mb-4">Top products by revenue</h2>
            {data.topProducts.length === 0 ? (
              <p className="text-sm text-text-muted py-6 text-center">No sales yet.</p>
            ) : (
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.topProducts} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E4E0D6" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#5A564C' }} axisLine={false} tickLine={false} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 11, fill: '#5A564C' }}
                      axisLine={false}
                      tickLine={false}
                      width={140}
                      tickFormatter={(v) => (v.length > 20 ? `${v.slice(0, 20)}…` : v)}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="revenue" name="Revenue" fill="#C97B2D" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
