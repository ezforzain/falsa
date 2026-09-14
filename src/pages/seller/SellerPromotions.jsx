import { useEffect, useState } from 'react';
import { seller } from '../../lib/api';
import { formatPKR } from '../../data/mockData';
import { IconSparkle } from '../../components/icons';
import SellerCard from '../../components/seller/SellerCard';
import StatCard from '../../components/seller/StatCard';
import StatusChipMenu from '../../components/seller/StatusChipMenu';
import { PROMOTION_CHIP } from './statusChipPalette';

const PROMOTION_LABEL = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected' };

// Quick-fill shortcuts, not a hard menu — the seller can still type any amount. These are
// stated estimates shown to help the seller pick a reasonable budget, not a guarantee — there's
// no real ad-serving/billing behind them (the app has no payment gateway); admin sees the number
// on the request the same way it already sees the note field.
const BUDGET_SUGGESTIONS = [
  { amount: 300, views: '~1,000 views' },
  { amount: 600, views: '~2,500 views' },
  { amount: 1200, views: '~6,000 views' },
];

export default function SellerPromotions() {
  const [products, setProducts] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({ productId: '', spotlightType: 'featured', budgetPkr: '', note: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const load = () => {
    setLoading(true);
    setError(null);
    Promise.all([seller.products(), seller.promotions()])
      .then(([productsRes, requestsRes]) => {
        setProducts(productsRes.products.filter((p) => p.status === 'active'));
        setRequests(requestsRes.requests);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const submit = async () => {
    if (!form.productId) {
      setSubmitError('Choose a listing to promote.');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const { request } = await seller.requestPromotion({
        ...form,
        budgetPkr: form.budgetPkr === '' ? undefined : Number(form.budgetPkr),
      });
      setRequests((current) => [request, ...current]);
      setForm({ productId: '', spotlightType: 'featured', budgetPkr: '', note: '' });
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const fieldClass =
    'w-full px-[14px] py-[11px] border border-border rounded-lg text-[14px] font-sans bg-surface-muted text-ink outline-none focus:border-green focus:shadow-[0_0_0_3px_rgba(59,111,224,0.12)] transition-shadow';
  const labelClass = 'block text-[12.5px] font-semibold text-ink-soft mb-1.5';

  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const approvedCount = requests.filter((r) => r.status === 'approved').length;

  return (
    <div className="animate-fade-up flex flex-col gap-4">
      {loading && <div className="animate-pulse bg-surface border border-border rounded-2xl h-[400px]" />}

      {!loading && error && (
        <div className="bg-surface border border-dashed border-border-strong rounded-2xl p-8 text-center text-orange-text text-sm">{error}</div>
      )}

      {!loading && !error && (
        <>
          {requests.length > 0 && (
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
              <StatCard label="Requests" value={requests.length} note="Lifetime" />
              <StatCard label="Pending" value={pendingCount} note="Awaiting review" />
              <StatCard label="Approved" value={approvedCount} note="Live boosts" />
            </div>
          )}

          <SellerCard eyebrow="Request a boost" className="max-w-[560px]">
            {submitError && <p className="text-sm text-orange-text bg-orange-tint rounded-lg px-3.5 py-2.5 mb-4">{submitError}</p>}

            {products.length === 0 ? (
              <p className="text-sm text-text-muted">You need an active listing before you can request a promotion.</p>
            ) : (
              <div className="flex flex-col gap-4">
                <div>
                  <label className={labelClass}>Listing</label>
                  <select value={form.productId} onChange={(e) => setForm((f) => ({ ...f, productId: e.target.value }))} className={fieldClass}>
                    <option value="" disabled>
                      Select a listing…
                    </option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Promotion type</label>
                  <select
                    value={form.spotlightType}
                    onChange={(e) => setForm((f) => ({ ...f, spotlightType: e.target.value }))}
                    className={fieldClass}
                  >
                    <option value="featured">Featured</option>
                    <option value="sponsored">Sponsored</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Budget (Rs, optional)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={form.budgetPkr}
                    onChange={(e) => setForm((f) => ({ ...f, budgetPkr: e.target.value.replace(/[^\d]/g, '') }))}
                    placeholder="e.g. 500"
                    className={fieldClass}
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {BUDGET_SUGGESTIONS.map((s) => (
                      <button
                        key={s.amount}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, budgetPkr: String(s.amount) }))}
                        className={`text-[11.5px] font-semibold px-2.5 py-1 rounded-full border cursor-pointer transition-colors ${
                          form.budgetPkr === String(s.amount)
                            ? 'border-green text-green bg-green-tint'
                            : 'border-border text-ink-soft bg-surface hover:border-green/40'
                        }`}
                      >
                        {formatPKR(s.amount)} → {s.views}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Note to admin (optional)</label>
                  <textarea
                    value={form.note}
                    onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                    placeholder="Why should this listing be boosted?"
                    rows={2}
                    className={`${fieldClass} resize-none`}
                  />
                </div>
                <button
                  type="button"
                  onClick={submit}
                  disabled={submitting}
                  className="self-start flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 bg-green hover:bg-green-hover text-white font-semibold text-sm py-2.5 px-6 rounded-full transition-colors"
                >
                  {submitting ? 'Submitting…' : 'Submit request'}
                </button>
              </div>
            )}
          </SellerCard>

          <SellerCard eyebrow="Your requests">
            {requests.length === 0 ? (
              <div className="p-6 text-center flex flex-col items-center gap-4">
                <span className="w-14 h-14 rounded-full bg-green-tint inline-flex items-center justify-center">
                  <IconSparkle width="22" height="22" className="text-green" />
                </span>
                <p className="text-sm text-text">No promotion requests yet.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {requests.map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-4 flex-wrap px-3.5 py-3 rounded-2xl bg-surface-muted border border-border">
                    <div className="min-w-0">
                      <div className="font-bold text-[13.5px] text-ink truncate">{r.productName}</div>
                      <div className="text-[11.5px] text-text-muted capitalize">
                        {r.spotlightType}
                        {r.budgetPkr && <> · budget {formatPKR(r.budgetPkr)}</>}
                        {' '}· requested {new Date(r.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                      {r.status === 'rejected' && r.rejectionReason && (
                        <div className="text-[11.5px] text-orange-text mt-1">Reason: {r.rejectionReason}</div>
                      )}
                    </div>
                    <StatusChipMenu status={r.status} palette={PROMOTION_CHIP} labelFor={PROMOTION_LABEL} readOnly />
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
