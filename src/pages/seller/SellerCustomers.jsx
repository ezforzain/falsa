import { useEffect, useState } from 'react';
import { seller } from '../../lib/api';
import { formatPKR } from '../../data/mockData';
import { IconUser } from '../../components/icons';
import SellerCard from '../../components/seller/SellerCard';
import StatCard from '../../components/seller/StatCard';
import SlideOverDrawer from '../../components/seller/SlideOverDrawer';

export default function SellerCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    seller
      .customers()
      .then((res) => setCustomers(res.customers))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = customers.filter((c) => c.buyerCompany.toLowerCase().includes(search.trim().toLowerCase()));
  const repeatCount = customers.filter((c) => c.totalOrders > 1).length;
  const avgOrder = customers.length ? customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.reduce((sum, c) => sum + c.totalOrders, 0) : 0;

  return (
    <div className="animate-fade-up flex flex-col gap-4">
      {!loading && !error && customers.length > 0 && (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <StatCard label="Customers" value={customers.length} note="Lifetime buyers" />
          <StatCard label="Repeat buyers" value={repeatCount} note={`${customers.length ? Math.round((repeatCount / customers.length) * 100) : 0}% returned`} />
          <StatCard label="Avg. order" value={formatPKR(Math.round(avgOrder))} note="Per order" />
        </div>
      )}

      <SellerCard
        eyebrow="Customers"
        action={
          !loading &&
          !error &&
          customers.length > 0 && (
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by buyer company…"
              className="w-full max-w-[260px] px-3.5 py-2 border border-border rounded-lg text-sm outline-none focus:border-green bg-surface-muted text-ink"
            />
          )
        }
      >
        {loading && (
          <div className="flex flex-col gap-2.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse h-14 bg-surface-muted rounded-2xl" />
            ))}
          </div>
        )}

        {!loading && error && <div className="p-6 text-center text-orange-text text-sm">{error}</div>}

        {!loading && !error && customers.length === 0 && (
          <div className="p-8 text-center flex flex-col items-center gap-4">
            <span className="w-14 h-14 rounded-full bg-green-tint inline-flex items-center justify-center">
              <IconUser width="24" height="24" className="text-green" />
            </span>
            <p className="text-sm text-text">No customers yet — they'll show up here once buyers order your listings.</p>
          </div>
        )}

        {!loading && !error && customers.length > 0 && (
          <div className="flex flex-col gap-2">
            {filtered.map((c) => (
              <button
                key={c.buyerCompany}
                type="button"
                onClick={() => setSelected(c)}
                className="grid items-center gap-3 px-3.5 py-3 rounded-2xl bg-surface-muted border border-border hover:border-border-strong transition-colors text-left cursor-pointer"
                style={{ gridTemplateColumns: 'minmax(0,2fr) 1fr 1fr 1fr' }}
              >
                <span className="min-w-0">
                  <span className="block text-[13.5px] font-bold text-ink truncate">{c.buyerCompany}</span>
                  <span className="block text-[11.5px] text-text-muted truncate">{c.buyerCountry}</span>
                </span>
                <span className="text-[13px] text-ink-soft">{c.totalOrders.toLocaleString('en-US')} orders</span>
                <span className="text-[13.5px] font-bold text-ink whitespace-nowrap">{formatPKR(c.totalSpent)}</span>
                <span className="text-[12.5px] text-text whitespace-nowrap">
                  {new Date(c.lastOrderAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </button>
            ))}
            {filtered.length === 0 && <div className="p-6 text-center text-sm text-text">No customers match "{search}".</div>}
          </div>
        )}
      </SellerCard>

      <SlideOverDrawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        kicker="Customer detail"
        title={selected?.buyerCompany}
        subtitle={selected?.buyerCountry}
        stats={
          selected
            ? [
                { label: 'Total spent', value: formatPKR(selected.totalSpent) },
                { label: 'Orders', value: selected.totalOrders },
              ]
            : []
        }
        history={
          selected
            ? [
                {
                  title: 'Latest order',
                  when: new Date(selected.lastOrderAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                  dot: '#5B8DEF',
                },
                selected.totalOrders > 1 && { title: 'Repeat customer', note: `${selected.totalOrders} orders placed to date`, dot: '#6FDFCE' },
              ].filter(Boolean)
            : []
        }
      />
    </div>
  );
}
