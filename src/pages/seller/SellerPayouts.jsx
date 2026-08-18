import { useEffect, useState } from 'react';
import { seller } from '../../lib/api';
import { formatPKR } from '../../data/mockData';
import { IconWallet } from '../../components/icons';

export default function SellerPayouts() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    seller
      .payouts()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-fade-up">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-ink tracking-tight">Payouts</h1>
        <p className="text-sm text-text mt-1">Your earnings ledger, recorded by our team.</p>
      </div>

      {loading && (
        <div className="flex flex-col gap-4">
          <div className="animate-pulse bg-white border border-border rounded-2xl h-[100px]" />
          <div className="animate-pulse bg-white border border-border rounded-2xl h-[200px]" />
        </div>
      )}

      {!loading && error && (
        <div className="bg-white border border-dashed border-border-strong rounded-2xl p-8 text-center text-orange-text text-sm">{error}</div>
      )}

      {!loading && !error && data && (
        <>
          <div className="bg-white border border-border rounded-2xl p-5 mb-6 max-w-[280px]">
            <span className="w-9 h-9 rounded-lg bg-green-tint flex items-center justify-center mb-3">
              <IconWallet width="17" height="17" className="text-green" />
            </span>
            <div className="font-display text-xl font-bold text-ink">{formatPKR(Math.max(data.pendingBalance, 0))}</div>
            <div className="text-xs text-text-muted mt-0.5">Pending balance (delivered orders not yet paid out)</div>
          </div>

          {data.payouts.length === 0 ? (
            <div className="bg-white border border-dashed border-border-strong rounded-2xl p-10 text-center">
              <p className="text-sm text-text">No payouts recorded yet.</p>
            </div>
          ) : (
            <div className="bg-white border border-border rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[480px]">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-text-muted uppercase tracking-wide">
                      <th className="px-5 py-3 font-semibold">Amount</th>
                      <th className="px-5 py-3 font-semibold">Method</th>
                      <th className="px-5 py-3 font-semibold">Reference</th>
                      <th className="px-5 py-3 font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.payouts.map((p) => (
                      <tr key={p.id} className="border-b border-border last:border-0">
                        <td className="px-5 py-4 font-semibold text-ink whitespace-nowrap">{formatPKR(p.amount)}</td>
                        <td className="px-5 py-4 text-text-muted capitalize">{p.method.replace('_', ' ')}</td>
                        <td className="px-5 py-4 text-text-muted">{p.reference || '—'}</td>
                        <td className="px-5 py-4 text-text-muted whitespace-nowrap">
                          {new Date(p.paidAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
