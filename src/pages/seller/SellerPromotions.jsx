import { useEffect, useState } from 'react';
import { seller } from '../../lib/api';
import { IconSparkle } from '../../components/icons';

const STATUS_STYLES = {
  pending: 'bg-orange-tint text-orange-text',
  approved: 'bg-green-tint text-green',
  rejected: 'bg-surface-muted text-text-muted',
};

function statusBadgeClass(status) {
  return STATUS_STYLES[status] || 'bg-surface-muted text-text-muted';
}

export default function SellerPromotions() {
  const [products, setProducts] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({ productId: '', spotlightType: 'featured', note: '' });
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
      const { request } = await seller.requestPromotion(form);
      setRequests((current) => [request, ...current]);
      setForm({ productId: '', spotlightType: 'featured', note: '' });
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const fieldClass =
    'w-full px-[14px] py-[11px] border border-border rounded-lg text-[14px] font-sans bg-white text-ink outline-none focus:border-green focus:shadow-[0_0_0_3px_rgba(14,90,70,0.12)] transition-shadow';
  const labelClass = 'block text-[12.5px] font-semibold text-ink-soft mb-1.5';

  return (
    <div className="animate-fade-up">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-ink tracking-tight">Promotions</h1>
        <p className="text-sm text-text mt-1">Request to boost one of your listings — an admin reviews every request.</p>
      </div>

      {loading && <div className="animate-pulse bg-white border border-border rounded-2xl h-[400px]" />}

      {!loading && error && (
        <div className="bg-white border border-dashed border-border-strong rounded-2xl p-8 text-center text-orange-text text-sm">{error}</div>
      )}

      {!loading && !error && (
        <>
          <div className="bg-white border border-border rounded-2xl p-6 mb-6 max-w-[520px]">
            <h2 className="font-display text-base font-bold text-ink mb-4">Request a boost</h2>

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
          </div>

          <h2 className="font-display text-base font-bold text-ink mb-4">Your requests</h2>
          {requests.length === 0 ? (
            <div className="bg-white border border-dashed border-border-strong rounded-2xl p-10 text-center">
              <span className="w-14 h-14 rounded-full bg-green-tint inline-flex items-center justify-center mb-4">
                <IconSparkle width="22" height="22" className="text-green" />
              </span>
              <p className="text-sm text-text">No promotion requests yet.</p>
            </div>
          ) : (
            <div className="bg-white border border-border rounded-2xl overflow-hidden">
              {requests.map((r, i) => (
                <div key={r.id} className={`flex items-center justify-between gap-4 px-5 py-4 flex-wrap ${i !== requests.length - 1 ? 'border-b border-border' : ''}`}>
                  <div className="min-w-0">
                    <div className="font-semibold text-[14.5px] text-ink truncate">{r.productName}</div>
                    <div className="text-xs text-text-muted capitalize">
                      {r.spotlightType} · requested {new Date(r.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                    {r.status === 'rejected' && r.rejectionReason && (
                      <div className="text-xs text-orange-text mt-1">Reason: {r.rejectionReason}</div>
                    )}
                  </div>
                  <span className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full capitalize ${statusBadgeClass(r.status)}`}>{r.status}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
