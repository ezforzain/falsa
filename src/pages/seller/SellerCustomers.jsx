import { useEffect, useState } from 'react';
import { seller } from '../../lib/api';
import { formatPKR } from '../../data/mockData';
import { IconUser } from '../../components/icons';

export default function SellerCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    seller
      .customers()
      .then((res) => setCustomers(res.customers))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = customers.filter((c) => c.buyerCompany.toLowerCase().includes(search.trim().toLowerCase()));

  return (
    <div className="animate-fade-up">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-ink tracking-tight">Customers</h1>
        <p className="text-sm text-text mt-1">Buyers who've ordered your listings.</p>
      </div>

      {!loading && !error && customers.length > 0 && (
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by buyer company…"
          className="w-full max-w-[320px] px-3.5 py-2.5 border border-border rounded-lg text-sm outline-none focus:border-green bg-white mb-5"
        />
      )}

      {loading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse h-16 bg-white border border-border rounded-2xl" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="bg-white border border-dashed border-border-strong rounded-2xl p-8 text-center text-orange-text text-sm">{error}</div>
      )}

      {!loading && !error && customers.length === 0 && (
        <div className="bg-white border border-dashed border-border-strong rounded-2xl p-10 text-center">
          <span className="w-14 h-14 rounded-full bg-green-tint inline-flex items-center justify-center mb-4">
            <IconUser width="24" height="24" className="text-green" />
          </span>
          <p className="text-sm text-text">No customers yet — they'll show up here once buyers order your listings.</p>
        </div>
      )}

      {!loading && !error && customers.length > 0 && (
        <div className="bg-white border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="border-b border-border text-left text-xs text-text-muted uppercase tracking-wide">
                  <th className="px-5 py-3 font-semibold">Buyer</th>
                  <th className="px-5 py-3 font-semibold">Country</th>
                  <th className="px-5 py-3 font-semibold">Orders</th>
                  <th className="px-5 py-3 font-semibold">Total spent</th>
                  <th className="px-5 py-3 font-semibold">Last order</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.buyerCompany} className="border-b border-border last:border-0">
                    <td className="px-5 py-4 font-semibold text-ink">{c.buyerCompany}</td>
                    <td className="px-5 py-4 text-text-muted">{c.buyerCountry}</td>
                    <td className="px-5 py-4 text-ink-soft">{c.totalOrders.toLocaleString('en-US')}</td>
                    <td className="px-5 py-4 font-semibold text-ink whitespace-nowrap">{formatPKR(c.totalSpent)}</td>
                    <td className="px-5 py-4 text-text-muted whitespace-nowrap">
                      {new Date(c.lastOrderAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-sm text-text">
                      No customers match "{search}".
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
