import { useEffect, useState } from 'react';
import { seller } from '../../lib/api';
import { formatPKR } from '../../data/mockData';
import { IconWallet } from '../../components/icons';
import SellerCard from '../../components/seller/SellerCard';
import { PAYOUT_CHIP } from './statusChipPalette';

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
    <div className="animate-fade-up flex flex-col gap-4">
      {loading && (
        <div className="flex flex-col gap-4">
          <div className="animate-pulse bg-surface border border-border rounded-2xl h-[100px] max-w-[280px]" />
          <div className="animate-pulse bg-surface border border-border rounded-2xl h-[200px]" />
        </div>
      )}

      {!loading && error && (
        <div className="bg-surface border border-dashed border-border-strong rounded-2xl p-8 text-center text-orange-text text-sm">{error}</div>
      )}

      {!loading && !error && data && (
        <>
          <SellerCard eyebrow="Available balance" className="max-w-[280px]">
            <span className="w-9 h-9 rounded-lg bg-green-tint flex items-center justify-center mb-3">
              <IconWallet width="17" height="17" className="text-green" />
            </span>
            <div className="text-[22px] font-extrabold text-ink">{formatPKR(Math.max(data.pendingBalance, 0))}</div>
            <div className="text-xs text-text mt-1">Pending balance (delivered orders not yet paid out)</div>
          </SellerCard>

          <SellerCard eyebrow="Payout history">
            {data.payouts.length === 0 ? (
              <div className="p-8 text-center text-sm text-text">No payouts recorded yet.</div>
            ) : (
              <div className="flex flex-col gap-2">
                {data.payouts.map((p) => (
                  <div
                    key={p.id}
                    className="grid items-center gap-3 px-3.5 py-3 rounded-2xl bg-surface-muted border border-border"
                    style={{ gridTemplateColumns: 'minmax(0,2fr) 1fr 1fr 110px' }}
                  >
                    <span className="min-w-0">
                      <span className="block text-[13.5px] font-bold text-ink truncate">{p.reference || '—'}</span>
                      <span className="block text-[11.5px] text-text-muted capitalize">{p.method.replace('_', ' ')}</span>
                    </span>
                    <span className="text-[12.5px] text-text whitespace-nowrap">
                      {new Date(p.paidAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                    <span className="text-[13.5px] font-bold text-ink whitespace-nowrap">{formatPKR(p.amount)}</span>
                    <span
                      className="justify-self-start text-[11px] font-bold px-3 py-1.5 rounded-full border"
                      style={{ background: PAYOUT_CHIP.bg, color: PAYOUT_CHIP.fg, borderColor: PAYOUT_CHIP.border }}
                    >
                      Paid
                    </span>
                  </div>
                ))}
              </div>
            )}
          </SellerCard>
        </>
      )}
    </div>
  );
}
