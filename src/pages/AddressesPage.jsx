import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AddressForm, { EMPTY_ADDRESS } from '../components/AddressForm';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast from '../components/Toast';
import { IconUser, IconEdit, IconPin, IconTrash, IconChevronLeft } from '../components/icons';

const LABEL_ICON = { Home: '🏠', Office: '🏢' };

// Standalone view/edit/remove for the account's one saved delivery address (User.savedAddress —
// the same field checkout auto-saves to, see CartPage). Reuses the exact AddressForm checkout
// already uses so the two never drift apart, wired to PATCH /api/auth/address instead of
// checkout's auto-save so it works without an order in progress.
function AddressSummaryCard({ address, onEdit, onRemove }) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5 sm:p-6 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1.5">
          <span className="text-[15px] font-semibold text-ink">{address.fullName}</span>
          <span className="text-[10px] font-bold uppercase tracking-wide text-orange-text bg-orange-tint px-2 py-0.5 rounded-full">
            {LABEL_ICON[address.label] || ''} {address.label}
          </span>
        </div>
        <p className="text-sm text-text-muted m-0">{address.phone}</p>
        <p className="text-sm text-text mt-1 mb-0 leading-relaxed">
          {address.address}, {address.city}
        </p>
      </div>
      <div className="shrink-0 flex items-center gap-2">
        <button
          type="button"
          onClick={onEdit}
          aria-label="Edit address"
          className="cursor-pointer flex items-center gap-1.5 bg-surface border border-border text-ink-soft font-semibold text-xs px-3.5 py-2 rounded-full hover:bg-surface-muted transition-colors"
        >
          <IconEdit width="13" height="13" />
          Edit
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove address"
          className="cursor-pointer flex items-center justify-center w-8 h-8 rounded-full text-orange-text hover:bg-orange-tint transition-colors"
        >
          <IconTrash width="14" height="14" />
        </button>
      </div>
    </div>
  );
}

export default function AddressesPage() {
  const { user, isAuthenticated, updateAddress } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(EMPTY_ADDRESS);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '' });

  if (!isAuthenticated) {
    return (
      <main className="max-w-[720px] mx-auto px-4 sm:px-6 lg:px-10 pt-9 pb-20 animate-fade-up">
        <div className="text-center py-14 sm:py-[60px] px-6 bg-surface border border-border rounded-3xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_10px_28px_-8px_rgba(0,0,0,0.08)]">
          <span className="w-16 h-16 rounded-full bg-green-tint inline-flex items-center justify-center mb-5">
            <IconUser width="24" height="24" className="text-green" />
          </span>
          <p className="text-[17px] font-bold text-ink mb-1.5 font-display tracking-tight">You're not signed in</p>
          <p className="text-sm text-text-muted mb-7 max-w-[280px] mx-auto leading-relaxed">
            Sign in to manage your delivery addresses.
          </p>
          <Link
            to="/auth"
            className="cursor-pointer inline-flex items-center gap-2 bg-green hover:bg-green-hover text-white font-semibold text-sm px-7 py-3.5 rounded-full no-underline shadow-[0_8px_20px_rgba(14,90,70,0.25)] hover:-translate-y-0.5 transition-all"
          >
            Sign in
          </Link>
        </div>
      </main>
    );
  }

  const startEdit = () => {
    setForm(user.savedAddress || { ...EMPTY_ADDRESS, fullName: user.companyName || '', phone: user.phone || '' });
    setError(null);
    setEditing(true);
  };

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      await updateAddress(form);
      setEditing(false);
      setToast({ show: true, message: 'Address saved' });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmRemoveAddress = async () => {
    setRemoving(true);
    try {
      await updateAddress(null);
      setConfirmRemove(false);
      setToast({ show: true, message: 'Address removed' });
    } catch (err) {
      setToast({ show: true, message: err.message });
    } finally {
      setRemoving(false);
    }
  };

  return (
    <main className="max-w-[720px] mx-auto px-4 sm:px-6 lg:px-10 pt-9 pb-20 animate-fade-up">
      <div className="flex items-center gap-2.5 mb-1.5">
        <Link
          to="/account"
          aria-label="Back to account"
          className="cursor-pointer w-9 h-9 -ml-1.5 rounded-lg flex items-center justify-center text-ink-soft hover:bg-surface-muted transition-colors"
        >
          <IconChevronLeft width="18" height="18" />
        </Link>
        <h1 className="font-display text-[24px] sm:text-[26px] font-bold m-0 tracking-tight text-ink">Addresses</h1>
      </div>
      <p className="text-sm text-text-muted mb-7 ml-[46px]">Manage the delivery address used at checkout.</p>

      {editing ? (
        <div className="bg-surface border border-border rounded-2xl p-5 sm:p-6 shadow-[0_1px_3px_rgba(27,31,29,0.04)]">
          <AddressForm
            value={form}
            onChange={setForm}
            onSubmit={submit}
            onCancel={() => setEditing(false)}
            submitLabel="Save address"
            loading={saving}
            error={error}
          />
        </div>
      ) : user.savedAddress ? (
        <AddressSummaryCard address={user.savedAddress} onEdit={startEdit} onRemove={() => setConfirmRemove(true)} />
      ) : (
        <div className="text-center py-14 px-6 bg-surface border border-border rounded-3xl">
          <span className="w-14 h-14 rounded-full bg-green-tint inline-flex items-center justify-center mb-4">
            <IconPin width="20" height="20" className="text-green" />
          </span>
          <p className="text-[15px] font-bold text-ink mb-1.5 font-display">No saved address yet</p>
          <p className="text-sm text-text-muted mb-6 max-w-[300px] mx-auto leading-relaxed">
            Add a delivery address to make checkout faster next time.
          </p>
          <button
            type="button"
            onClick={startEdit}
            className="cursor-pointer inline-flex items-center gap-2 bg-green hover:bg-green-hover text-white font-semibold text-sm px-6 py-3 rounded-full transition-all"
          >
            <IconPin width="14" height="14" />
            Add address
          </button>
        </div>
      )}

      <ConfirmDialog
        open={confirmRemove}
        title="Remove this address?"
        message="You'll need to add a new one the next time you check out."
        confirmLabel="Remove"
        loading={removing}
        onCancel={() => setConfirmRemove(false)}
        onConfirm={confirmRemoveAddress}
      />

      <Toast message={toast.message} show={toast.show} onHide={() => setToast((prev) => ({ ...prev, show: false }))} />
    </main>
  );
}
