import { useEffect, useState } from 'react';
import { IconClose, IconFile } from './icons';
import { adminUsers } from '../lib/api';

function Row({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-border/50 last:border-b-0">
      <span className="text-[12.5px] font-semibold text-text-muted shrink-0">{label}</span>
      <span className="text-[13.5px] text-ink text-right break-words">{value}</span>
    </div>
  );
}

// Takes a flat { label, value } list and drops anything with no value up front, so a section
// with nothing to show (e.g. no location was ever given) never renders as an empty box with
// just a heading — either it has real rows, or it renders nothing at all.
function Section({ title, rows }) {
  const present = rows.filter((r) => r.value !== null && r.value !== undefined && r.value !== '');
  if (present.length === 0) return null;
  return (
    <div className="mb-5">
      <div className="text-[11px] font-bold uppercase tracking-wide text-text-muted mb-2">{title}</div>
      <div className="bg-surface-muted/60 rounded-xl px-4">
        {present.map((r) => (
          <Row key={r.label} label={r.label} value={r.value} />
        ))}
      </div>
    </div>
  );
}

// Read-only "everything this account submitted" view — every buyer/seller signup field
// (including the corporate KYC block and the buyer's optional location) surfaces here for
// admin, rather than being scattered across separate edit forms with no single place to see it
// all at once.
export default function AdminUserDetailsModal({ user, onClose }) {
  const [docState, setDocState] = useState('idle'); // idle | loading | error
  const [docError, setDocError] = useState(null);

  useEffect(() => {
    setDocState('idle');
    setDocError(null);
  }, [user]);

  useEffect(() => {
    if (!user) return undefined;
    const onKeyDown = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [user, onClose]);

  if (!user) return null;

  const isSeller = user.role === 'seller';
  const isCorporate = isSeller && user.sellerType === 'corporate';
  const location = [user.locationVillage, user.locationCity, user.locationProvince].filter(Boolean).join(', ');
  const savedAddr = user.savedAddress;

  const handleViewDocument = async () => {
    setDocState('loading');
    setDocError(null);
    try {
      const { businessDocument } = await adminUsers.businessDocument(user.id);
      const win = window.open('', '_blank', 'noopener,noreferrer');
      if (win) {
        win.document.write(
          businessDocument.startsWith('data:application/pdf')
            ? `<iframe src="${businessDocument}" style="border:0;width:100%;height:100%"></iframe>`
            : `<img src="${businessDocument}" style="max-width:100%;height:auto;display:block;margin:0 auto" />`
        );
      }
      setDocState('idle');
    } catch (err) {
      setDocState('error');
      setDocError(err.message || 'Could not load the document.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />

      <div className="relative w-full max-w-[480px] max-h-full overflow-y-auto bg-surface rounded-2xl shadow-2xl p-6 animate-fade-up">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-display text-lg font-bold text-ink">{user.companyName}</h2>
            <p className="text-xs text-text-muted mt-0.5 capitalize">{user.role} account · everything they submitted</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-text-muted hover:text-ink cursor-pointer p-1">
            <IconClose width="18" height="18" />
          </button>
        </div>

        <Section
          title="Account"
          rows={[
            { label: isSeller ? 'Business / factory name' : 'Name', value: user.companyName },
            { label: 'Email', value: user.email },
            { label: 'Email verified', value: user.emailVerified ? 'Yes' : 'No' },
            { label: 'Phone', value: user.phone },
            { label: 'Country', value: user.country },
            { label: 'Handle', value: user.handle ? `@${user.handle}` : null },
            { label: 'Status', value: user.status === 'suspended' ? 'Suspended' : 'Active' },
            { label: 'Joined', value: user.createdAt ? new Date(user.createdAt).toLocaleString() : null },
          ]}
        />

        {!isSeller && (
          <Section
            title="Location (given at sign-up)"
            rows={[{ label: 'Province / City / Village', value: location || 'Skipped at sign-up — not provided yet' }]}
          />
        )}

        {isSeller && (
          <Section
            title="Seller details"
            rows={[
              { label: 'Seller type', value: user.sellerType },
              { label: 'Main product category', value: user.category },
              { label: 'Business address', value: user.address },
              { label: 'Pickup city', value: user.city },
            ]}
          />
        )}

        {isCorporate && (
          <Section
            title="Corporate KYC"
            rows={[
              { label: 'Legal company name', value: user.legalCompanyName },
              { label: 'Registration number', value: user.registrationNumber },
              { label: 'NTN', value: user.ntn },
              { label: 'Company email', value: user.companyEmail },
              { label: 'Company phone', value: user.companyPhone },
              { label: 'Business location', value: user.location },
              { label: 'Business address', value: user.businessAddress },
            ]}
          />
        )}

        {isCorporate && (
          <Section
            title="Bank details"
            rows={[
              { label: 'Bank name', value: user.bankName },
              { label: 'Account title', value: user.accountTitle },
              { label: 'Account number', value: user.accountNumber },
              { label: 'IBAN', value: user.iban },
            ]}
          />
        )}

        {isCorporate && user.hasBusinessDocument && (
          <div className="mb-5">
            <div className="text-[11px] font-bold uppercase tracking-wide text-text-muted mb-2">Business document</div>
            <button
              type="button"
              onClick={handleViewDocument}
              disabled={docState === 'loading'}
              className="w-full flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 bg-surface border border-border text-ink-soft font-semibold text-sm py-2.5 rounded-xl hover:bg-surface-muted transition-colors"
            >
              <IconFile width="15" height="15" />
              {docState === 'loading' ? 'Opening…' : 'View uploaded document'}
            </button>
            {docState === 'error' && <p className="text-xs text-orange-text mt-1.5">{docError}</p>}
          </div>
        )}

        {savedAddr && (
          <Section
            title="Saved delivery address (from checkout)"
            rows={[
              { label: 'Full name', value: savedAddr.fullName },
              { label: 'Phone', value: savedAddr.phone },
              { label: 'City', value: savedAddr.city },
              { label: 'Address', value: savedAddr.address },
              { label: 'Saved as', value: savedAddr.label },
            ]}
          />
        )}

        <button
          type="button"
          onClick={onClose}
          className="w-full cursor-pointer bg-surface border-[1.5px] border-border text-ink-soft font-semibold text-sm py-3 rounded-full hover:bg-surface-muted transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
