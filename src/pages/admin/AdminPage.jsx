import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { sellers, admin, adminUsers, kyc } from '../../lib/api';
import VerifiedBadge from '../../components/VerifiedBadge';
import OfficialBadge from '../../components/OfficialBadge';
import AdminProductFormModal from '../../components/AdminProductFormModal';
import AdminUserFormModal from '../../components/AdminUserFormModal';
import ConfirmDialog from '../../components/ConfirmDialog';
import Toast from '../../components/Toast';
import {
  IconAlertCircle,
  IconBox,
  IconClose,
  IconEdit,
  IconFile,
  IconLogout,
  IconPlus,
  IconShield,
  IconSparkle,
  IconTrash,
  IconUser,
} from '../../components/icons';
import logoMark from '../../assets/logo-mark.png';

export default function AdminPage() {
  const { user, status, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('products');

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingId, setPendingId] = useState(null);
  const [actionError, setActionError] = useState(null);

  const [kycList, setKycList] = useState([]);
  const [kycLoading, setKycLoading] = useState(true);
  const [kycError, setKycError] = useState(null);
  const [kycActionError, setKycActionError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [kycDetail, setKycDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reviewPending, setReviewPending] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [lightboxImage, setLightboxImage] = useState(null);

  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState(null);
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productFormLoading, setProductFormLoading] = useState(false);
  const [productFormError, setProductFormError] = useState(null);
  const [deleteProductTarget, setDeleteProductTarget] = useState(null);
  const [deleteProductLoading, setDeleteProductLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const [usersList, setUsersList] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState(null);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [userFormOpen, setUserFormOpen] = useState(false);
  const [userFormLoading, setUserFormLoading] = useState(false);
  const [userFormError, setUserFormError] = useState(null);
  const [userStatusPendingId, setUserStatusPendingId] = useState(null);
  const [deleteUserTarget, setDeleteUserTarget] = useState(null);
  const [deleteUserLoading, setDeleteUserLoading] = useState(false);
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [userPayouts, setUserPayouts] = useState([]);
  const [userPayoutsLoading, setUserPayoutsLoading] = useState(false);
  const [payoutForm, setPayoutForm] = useState({ amount: '', method: 'bank_transfer', reference: '', note: '' });
  const [payoutSubmitting, setPayoutSubmitting] = useState(false);
  const [payoutError, setPayoutError] = useState(null);

  const [promotionRequests, setPromotionRequests] = useState([]);
  const [promotionsLoading, setPromotionsLoading] = useState(true);
  const [promotionsError, setPromotionsError] = useState(null);
  const [reviewingPromoId, setReviewingPromoId] = useState(null);
  const [rejectingPromoId, setRejectingPromoId] = useState(null);
  const [promoRejectReason, setPromoRejectReason] = useState('');

  const showToast = (message) => {
    setToastMessage(message);
    setToastVisible(true);
  };

  const load = () => {
    setLoading(true);
    setError(null);
    sellers
      .list()
      .then((res) => setList(res.sellers))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  const loadKyc = () => {
    setKycLoading(true);
    setKycError(null);
    kyc
      .getPendingKyc()
      .then((res) => setKycList(res.sellers))
      .catch((err) => setKycError(err.message))
      .finally(() => setKycLoading(false));
  };

  const loadProducts = () => {
    setProductsLoading(true);
    setProductsError(null);
    admin
      .products()
      .then((res) => setProducts(res.products))
      .catch((err) => setProductsError(err.message))
      .finally(() => setProductsLoading(false));
  };

  const loadUsers = () => {
    setUsersLoading(true);
    setUsersError(null);
    adminUsers
      .list({ role: userRoleFilter || undefined, q: userSearch || undefined })
      .then((res) => setUsersList(res.users))
      .catch((err) => setUsersError(err.message))
      .finally(() => setUsersLoading(false));
  };

  const loadPromotions = () => {
    setPromotionsLoading(true);
    setPromotionsError(null);
    admin
      .promotions()
      .then((res) => setPromotionRequests(res.requests))
      .catch((err) => setPromotionsError(err.message))
      .finally(() => setPromotionsLoading(false));
  };

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      load();
      loadKyc();
      loadProducts();
      loadUsers();
      loadPromotions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.role]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRoleFilter]);

  const openAddProduct = () => {
    setEditingProduct(null);
    setProductFormError(null);
    setProductFormOpen(true);
  };

  const openEditProduct = (product) => {
    setEditingProduct(product);
    setProductFormError(null);
    setProductFormOpen(true);
  };

  const handleSubmitProductForm = async (payload) => {
    setProductFormLoading(true);
    setProductFormError(null);
    try {
      if (editingProduct) {
        await admin.updateProduct(editingProduct.id, payload);
        showToast('Product updated successfully');
      } else {
        await admin.createProduct(payload);
        showToast('Product added successfully');
      }
      setProductFormOpen(false);
      loadProducts();
    } catch (err) {
      setProductFormError(err.message);
    } finally {
      setProductFormLoading(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!deleteProductTarget) return;
    setDeleteProductLoading(true);
    try {
      await admin.deleteProduct(deleteProductTarget.id);
      setDeleteProductTarget(null);
      showToast('Product deleted');
      loadProducts();
    } catch (err) {
      setProductsError(err.message);
    } finally {
      setDeleteProductLoading(false);
    }
  };

  // Cycles a product through Off -> Featured -> Sponsored -> Off in the Home "Spotlight" tab —
  // the only place admins curate that section, since it has no separate management screen.
  const [spotlightUpdatingId, setSpotlightUpdatingId] = useState(null);
  const handleSetSpotlight = async (product, spotlight, spotlightType) => {
    setSpotlightUpdatingId(product.id);
    try {
      await admin.updateProduct(product.id, { spotlight, spotlightType });
      showToast(spotlight ? `Added to Spotlight (${spotlightType})` : 'Removed from Spotlight');
      loadProducts();
    } catch (err) {
      showToast(err.message || 'Could not update Spotlight status');
    } finally {
      setSpotlightUpdatingId(null);
    }
  };

  const openEditUser = (userRecord) => {
    setEditingUser(userRecord);
    setUserFormError(null);
    setUserFormOpen(true);
  };

  const handleSubmitUserForm = async (payload) => {
    setUserFormLoading(true);
    setUserFormError(null);
    try {
      await adminUsers.update(editingUser.id, payload);
      showToast('User updated successfully');
      setUserFormOpen(false);
      loadUsers();
    } catch (err) {
      setUserFormError(err.message);
    } finally {
      setUserFormLoading(false);
    }
  };

  const handleSetUserStatus = async (userRecord, status) => {
    setUserStatusPendingId(userRecord.id);
    try {
      await adminUsers.setStatus(userRecord.id, status);
      showToast(status === 'suspended' ? 'Account suspended' : 'Account reactivated');
      loadUsers();
    } catch (err) {
      showToast(err.message || 'Could not update account status');
    } finally {
      setUserStatusPendingId(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUserTarget) return;
    setDeleteUserLoading(true);
    try {
      await adminUsers.remove(deleteUserTarget.id);
      setDeleteUserTarget(null);
      showToast('User deleted');
      loadUsers();
    } catch (err) {
      showToast(err.message || 'Could not delete user');
    } finally {
      setDeleteUserLoading(false);
    }
  };

  const toggleUserExpand = async (userRecord) => {
    if (expandedUserId === userRecord.id) {
      setExpandedUserId(null);
      return;
    }
    setExpandedUserId(userRecord.id);
    setPayoutForm({ amount: '', method: 'bank_transfer', reference: '', note: '' });
    setPayoutError(null);
    setUserPayoutsLoading(true);
    try {
      const { payouts } = await adminUsers.payouts(userRecord.id);
      setUserPayouts(payouts);
    } catch (err) {
      setPayoutError(err.message);
    } finally {
      setUserPayoutsLoading(false);
    }
  };

  const handleAddPayout = async (userRecord) => {
    const amount = Number(payoutForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setPayoutError('Enter a valid payout amount.');
      return;
    }
    setPayoutSubmitting(true);
    setPayoutError(null);
    try {
      const { payout } = await adminUsers.addPayout(userRecord.id, {
        amount,
        method: payoutForm.method,
        reference: payoutForm.reference.trim(),
        note: payoutForm.note.trim(),
      });
      setUserPayouts((current) => [payout, ...current]);
      setPayoutForm({ amount: '', method: 'bank_transfer', reference: '', note: '' });
      showToast('Payout recorded');
    } catch (err) {
      setPayoutError(err.message);
    } finally {
      setPayoutSubmitting(false);
    }
  };

  const handleApprovePromotion = async (req) => {
    setReviewingPromoId(req.id);
    try {
      await admin.reviewPromotion(req.id, { status: 'approved' });
      showToast(`Boosted "${req.productName}"`);
      loadPromotions();
      loadProducts();
    } catch (err) {
      showToast(err.message || 'Could not approve promotion request');
    } finally {
      setReviewingPromoId(null);
    }
  };

  const handleRejectPromotion = async (req) => {
    setReviewingPromoId(req.id);
    try {
      await admin.reviewPromotion(req.id, { status: 'rejected', rejectionReason: promoRejectReason.trim() });
      showToast('Promotion request rejected');
      setRejectingPromoId(null);
      setPromoRejectReason('');
      loadPromotions();
    } catch (err) {
      showToast(err.message || 'Could not reject promotion request');
    } finally {
      setReviewingPromoId(null);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <span className="w-8 h-8 border-[3px] border-border rounded-full inline-block" style={{ borderTopColor: '#0E5A46', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/auth" replace />;

  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream px-4">
        <div className="max-w-[420px] text-center bg-white border border-border rounded-2xl shadow-xl p-8">
          <span className="w-14 h-14 rounded-full bg-orange-tint inline-flex items-center justify-center mb-5">
            <IconAlertCircle width="26" height="26" className="text-orange-text" />
          </span>
          <h1 className="font-display text-xl font-bold text-ink mb-2">Admin accounts only</h1>
          <p className="text-sm text-text mb-6 leading-relaxed">
            The admin panel is only available to admin accounts. You're signed in as a {user.role}.
          </p>
          <Link to="/" className="inline-block bg-green hover:bg-green-hover text-white font-semibold text-sm px-6 py-3 rounded-full no-underline transition-colors">
            Back to marketplace
          </Link>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const toggleVerified = async (sellerRecord) => {
    setPendingId(sellerRecord.id);
    setActionError(null);
    try {
      const { seller: updated } = await admin.setSellerVerified(sellerRecord.id, !sellerRecord.verified);
      setList((current) => current.map((s) => (s.id === updated.id ? updated : s)));
    } catch (err) {
      setActionError(err.message);
    } finally {
      setPendingId(null);
    }
  };

  const toggleExpand = async (userId) => {
    if (expandedId === userId) {
      setExpandedId(null);
      setKycDetail(null);
      setShowRejectForm(false);
      return;
    }
    setExpandedId(userId);
    setKycDetail(null);
    setShowRejectForm(false);
    setRejectReason('');
    setKycActionError(null);
    setDetailLoading(true);
    try {
      const { seller } = await kyc.getSellerKyc(userId);
      setKycDetail(seller);
    } catch (err) {
      setKycActionError(err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const finishReview = (updated) => {
    setKycList((current) => current.map((s) => (s.id === updated.id ? updated : s)));
    setExpandedId(null);
    setKycDetail(null);
    setShowRejectForm(false);
    setRejectReason('');
  };

  const approveKyc = async (userId) => {
    setReviewPending(true);
    setKycActionError(null);
    try {
      const { seller: updated } = await kyc.approveSellerKyc(userId);
      finishReview(updated);
    } catch (err) {
      setKycActionError(err.message);
    } finally {
      setReviewPending(false);
    }
  };

  const rejectKyc = async (userId) => {
    setReviewPending(true);
    setKycActionError(null);
    try {
      const { seller: updated } = await kyc.rejectSellerKyc(userId, rejectReason.trim());
      finishReview(updated);
    } catch (err) {
      setKycActionError(err.message);
    } finally {
      setReviewPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream font-sans text-ink flex flex-col">
      <header className="bg-green-deep text-white sticky top-0 z-40">
        <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-4 h-16">
          <Link to="/" className="flex items-center gap-2 no-underline shrink-0">
            <img src={logoMark} alt="" className="w-9 h-9 object-contain" />
            <span className="hidden sm:flex flex-col leading-none">
              <span className="flex items-center gap-1.5">
                <span className="font-display text-base font-bold text-white tracking-tight">
                  Falsafah
                </span>
                <OfficialBadge size={14} tooltipPosition="bottom" />
              </span>
              <span className="font-mono text-[9px] text-teal-soft tracking-[0.2em] uppercase mt-0.5">Admin Panel</span>
            </span>
          </Link>
          <div className="flex-1" />
          <span className="hidden md:block text-sm text-teal-mist truncate max-w-[220px]">{user.companyName}</span>
          <button
            type="button"
            onClick={handleLogout}
            className="cursor-pointer flex items-center gap-1.5 text-sm font-semibold text-white/90 hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <IconLogout width="17" height="17" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-[1000px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-up">
        <div className="flex items-center gap-2 mb-8 border-b border-border">
          {[
            { key: 'products', label: 'Products' },
            { key: 'stores', label: 'Verified Stores' },
            { key: 'kyc', label: 'Seller ID Verification' },
            { key: 'users', label: 'Users' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`cursor-pointer text-sm font-semibold px-1 pb-3 -mb-px border-b-2 transition-colors ${
                activeTab === tab.key ? 'text-green border-green' : 'text-text-muted border-transparent hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'products' && (
          <>
            {!promotionsLoading && !promotionsError && promotionRequests.some((r) => r.status === 'pending') && (
              <div className="bg-white border border-border rounded-2xl overflow-hidden mb-6">
                <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border bg-orange-tint/40">
                  <IconSparkle width="14" height="14" className="text-orange shrink-0" />
                  <h2 className="font-display text-[15px] font-bold text-ink">
                    Pending promotion requests ({promotionRequests.filter((r) => r.status === 'pending').length})
                  </h2>
                </div>
                {promotionRequests
                  .filter((r) => r.status === 'pending')
                  .map((req, i, arr) => (
                    <div key={req.id} className={`px-5 py-4 flex items-center justify-between gap-4 flex-wrap ${i !== arr.length - 1 ? 'border-b border-border' : ''}`}>
                      <div className="min-w-0">
                        <div className="text-[14px] font-semibold text-ink truncate">{req.productName}</div>
                        <div className="text-xs text-text-muted truncate">
                          {req.sellerName || 'Unknown seller'} · requesting{' '}
                          <span className="font-semibold text-ink-soft capitalize">{req.spotlightType}</span>
                          {req.note && ` · "${req.note}"`}
                        </div>
                      </div>

                      {rejectingPromoId === req.id ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <input
                            type="text"
                            value={promoRejectReason}
                            onChange={(e) => setPromoRejectReason(e.target.value)}
                            placeholder="Reason (optional)"
                            className="px-3 py-2 border border-border rounded-lg text-xs outline-none focus:border-green w-[200px]"
                          />
                          <button
                            type="button"
                            onClick={() => setRejectingPromoId(null)}
                            className="cursor-pointer bg-white border border-border text-ink-soft font-semibold text-xs px-3 py-2 rounded-full hover:bg-surface-muted transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={reviewingPromoId === req.id}
                            onClick={() => handleRejectPromotion(req)}
                            className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 bg-orange hover:bg-orange-hover text-white font-semibold text-xs px-4 py-2 rounded-full transition-colors"
                          >
                            {reviewingPromoId === req.id ? 'Submitting…' : 'Confirm reject'}
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            disabled={reviewingPromoId === req.id}
                            onClick={() => {
                              setRejectingPromoId(req.id);
                              setPromoRejectReason('');
                            }}
                            className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 bg-white border border-border text-orange-text font-semibold text-xs px-4 py-2 rounded-full hover:bg-orange-tint transition-colors"
                          >
                            Reject
                          </button>
                          <button
                            type="button"
                            disabled={reviewingPromoId === req.id}
                            onClick={() => handleApprovePromotion(req)}
                            className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 bg-green hover:bg-green-hover text-white font-semibold text-xs px-4 py-2 rounded-full transition-colors"
                          >
                            {reviewingPromoId === req.id ? 'Submitting…' : 'Approve'}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}

            <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
              <div>
                <h1 className="font-display text-2xl font-bold text-ink tracking-tight">Products</h1>
                <p className="text-sm text-text mt-1">Add, edit, and manage products listed on the marketplace.</p>
              </div>
              <button
                type="button"
                onClick={openAddProduct}
                className="cursor-pointer flex items-center gap-1.5 bg-green hover:bg-green-hover text-white font-semibold text-sm px-5 py-2.5 rounded-full transition-colors"
              >
                <IconPlus width="16" height="16" />
                Add Product
              </button>
            </div>

            {productsLoading && (
              <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse bg-white border border-border rounded-2xl h-[220px]" />
                ))}
              </div>
            )}

            {!productsLoading && productsError && (
              <div className="bg-white border border-dashed border-border-strong rounded-2xl p-8 text-center text-orange-text text-sm">
                {productsError}
              </div>
            )}

            {!productsLoading && !productsError && products.length === 0 && (
              <div className="bg-white border border-dashed border-border-strong rounded-2xl p-10 text-center">
                <span className="w-14 h-14 rounded-full bg-green-tint inline-flex items-center justify-center mb-4">
                  <IconBox width="24" height="24" className="text-green" />
                </span>
                <p className="text-sm text-text mb-5">No products yet.</p>
                <button
                  type="button"
                  onClick={openAddProduct}
                  className="cursor-pointer bg-green hover:bg-green-hover text-white font-semibold text-sm px-6 py-3 rounded-full transition-colors"
                >
                  Add your first product
                </button>
              </div>
            )}

            {!productsLoading && !productsError && products.length > 0 && (
              <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
                {products.map((p) => (
                  <div key={p.id} className="bg-white border border-border rounded-2xl overflow-hidden">
                    <div className="h-[130px] relative overflow-hidden">
                      <img src={p.img} alt={p.name} className="w-full h-full object-cover" />
                      {p.images?.length > 1 && (
                        <span className="absolute top-2.5 right-2.5 bg-black/55 text-white text-[10.5px] font-semibold px-2 py-1 rounded-full">
                          +{p.images.length - 1} photo{p.images.length - 1 === 1 ? '' : 's'}
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="text-[14.5px] font-semibold text-ink leading-snug line-clamp-2 mb-1 min-h-[38px]">{p.name}</div>
                      <div className="flex items-center gap-1 mb-1.5 min-w-0">
                        <span className="text-xs text-text-muted truncate">{p.sellerName}</span>
                        {p.verified && <VerifiedBadge size={13} />}
                      </div>
                      <div className="flex items-baseline justify-between mb-3">
                        <span className="font-display font-bold text-green text-[15px]">
                          {p.price}
                          {p.unit && <span className="text-xs font-medium text-text-muted"> /{p.unit}</span>}
                        </span>
                        {p.stock !== null && p.stock !== undefined && (
                          <span className={`text-xs font-semibold ${p.stock === 0 ? 'text-orange-text' : 'text-text-muted'}`}>
                            {p.stock === 0 ? 'Out of stock' : `${p.stock} in stock`}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2 mb-2">
                        <button
                          type="button"
                          onClick={() => openEditProduct(p)}
                          className="flex-1 flex items-center justify-center gap-1.5 cursor-pointer bg-white border border-border text-ink-soft font-semibold text-xs py-2 rounded-lg hover:bg-surface-muted transition-colors"
                        >
                          <IconEdit width="13" height="13" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteProductTarget(p)}
                          className="flex-1 flex items-center justify-center gap-1.5 cursor-pointer bg-white border border-border text-orange-text font-semibold text-xs py-2 rounded-lg hover:bg-orange-tint transition-colors"
                        >
                          <IconTrash width="13" height="13" />
                          Delete
                        </button>
                      </div>

                      {/* Home "Spotlight" tab curation — the only control surface for it. */}
                      <div className="flex items-center gap-1 pt-2 border-t border-border">
                        <IconSparkle width="12" height="12" className="text-orange shrink-0" />
                        <div className="flex gap-1 flex-1">
                          {[
                            { value: null, label: 'Off' },
                            { value: 'featured', label: 'Featured' },
                            { value: 'sponsored', label: 'Sponsored' },
                          ].map((opt) => {
                            const isActive = opt.value === null ? !p.spotlight : p.spotlight && p.spotlightType === opt.value;
                            return (
                              <button
                                key={opt.label}
                                type="button"
                                disabled={spotlightUpdatingId === p.id}
                                onClick={() => handleSetSpotlight(p, opt.value !== null, opt.value || 'featured')}
                                className={`flex-1 text-[10.5px] font-semibold py-1.5 rounded-md cursor-pointer transition-colors disabled:opacity-50 ${
                                  isActive ? 'bg-green text-white' : 'bg-surface-muted text-text-muted hover:bg-[#EFEBE2]'
                                }`}
                              >
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'stores' && (
          <>
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-ink tracking-tight">Verified Stores</h1>
          <p className="text-sm text-text mt-1">
            Verify or unverify seller stores. Only admins can change this — sellers cannot verify themselves.
          </p>
        </div>

        {actionError && <p className="text-sm text-orange-text bg-orange-tint rounded-lg px-3.5 py-2.5 mb-5">{actionError}</p>}

        <div className="bg-white border border-border rounded-2xl overflow-hidden">
          {loading && (
            <div className="p-6 flex flex-col gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse h-12 bg-surface-muted rounded-xl" />
              ))}
            </div>
          )}

          {!loading && error && <div className="p-8 text-center text-sm text-orange-text">{error}</div>}

          {!loading &&
            !error &&
            list.map((s, i) => (
              <div
                key={s.id}
                className={`flex items-center justify-between gap-4 px-5 py-4 flex-wrap ${i !== list.length - 1 ? 'border-b border-border' : ''}`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-9 h-9 rounded-lg bg-green-tint flex items-center justify-center shrink-0">
                    <IconShield width="16" height="16" className="text-green" strokeWidth="2.2" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-[14.5px] text-ink truncate">{s.name}</span>
                      {s.verified && <VerifiedBadge size={16} />}
                    </div>
                    <span className={`text-xs font-medium ${s.verified ? 'text-green' : 'text-text-muted'}`}>
                      {s.verified ? 'Verified Store' : 'Not verified'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={pendingId === s.id}
                  onClick={() => toggleVerified(s)}
                  className={`cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 font-semibold text-xs px-4 py-2 rounded-full transition-colors shrink-0 ${
                    s.verified
                      ? 'bg-white border border-border text-text hover:bg-surface-muted'
                      : 'bg-green hover:bg-green-hover text-white'
                  }`}
                >
                  {pendingId === s.id ? 'Saving…' : s.verified ? 'Remove verification' : 'Verify store'}
                </button>
              </div>
            ))}

          {!loading && !error && list.length === 0 && (
            <div className="p-10 text-center text-sm text-text">No stores found.</div>
          )}
        </div>
          </>
        )}

        {activeTab === 'kyc' && (
          <>
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-ink tracking-tight">Seller ID Verification</h1>
          <p className="text-sm text-text mt-1">
            Review CNIC documents submitted at signup. Approve to unlock the seller portal, or reject with a reason.
            Sellers cannot approve their own CNIC.
          </p>
        </div>

        {kycActionError && <p className="text-sm text-orange-text bg-orange-tint rounded-lg px-3.5 py-2.5 mb-5">{kycActionError}</p>}

        <div className="bg-white border border-border rounded-2xl overflow-hidden">
          {kycLoading && (
            <div className="p-6 flex flex-col gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse h-12 bg-surface-muted rounded-xl" />
              ))}
            </div>
          )}

          {!kycLoading && kycError && <div className="p-8 text-center text-sm text-orange-text">{kycError}</div>}

          {!kycLoading &&
            !kycError &&
            kycList.map((s, i) => (
              <div key={s.id} className={i !== kycList.length - 1 ? 'border-b border-border' : ''}>
                <div className="flex items-center justify-between gap-4 px-5 py-4 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-[14.5px] text-ink truncate">{s.companyName}</span>
                      <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-text-muted bg-surface-muted px-1.5 py-0.5 rounded">
                        {s.sellerType === 'corporate' ? 'Corporate' : 'Individual'}
                      </span>
                    </div>
                    <div className="text-xs text-text-muted truncate">
                      {s.email} · {s.sellerType === 'corporate' ? `NTN ${s.ntn || '—'}` : `CNIC ${s.cnicNumber || '—'}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        s.cnicStatus === 'approved'
                          ? 'bg-green-tint text-green'
                          : s.cnicStatus === 'rejected'
                            ? 'bg-orange-tint text-orange-text'
                            : 'bg-surface-muted text-text-muted'
                      }`}
                    >
                      {s.cnicStatus === 'approved' ? 'Approved' : s.cnicStatus === 'rejected' ? 'Rejected' : 'Pending'}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleExpand(s.id)}
                      className="cursor-pointer bg-white border border-border text-ink-soft font-semibold text-xs px-4 py-2 rounded-full hover:bg-surface-muted transition-colors"
                    >
                      {expandedId === s.id ? 'Close' : 'Review'}
                    </button>
                  </div>
                </div>

                {expandedId === s.id && (
                  <div className="px-5 pb-5 bg-surface-muted/60">
                    {detailLoading && <div className="text-sm text-text-muted py-4">Loading documents…</div>}
                    {!detailLoading && kycDetail && kycDetail.sellerType === 'corporate' && (
                      <div className="flex flex-col gap-4 pt-1">
                        <div className="max-w-[220px]">
                          <div className="text-[11px] font-semibold text-text-muted mb-1.5 uppercase tracking-wide">Business document</div>
                          {kycDetail.businessDocument ? (
                            kycDetail.businessDocument.startsWith('data:application/pdf') ? (
                              <a
                                href={kycDetail.businessDocument}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2 px-3 py-3 rounded-lg border border-border hover:border-green text-sm font-semibold text-green transition-colors"
                              >
                                <IconFile width="16" height="16" />
                                View PDF
                              </a>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setLightboxImage(kycDetail.businessDocument)}
                                className="block w-full cursor-zoom-in"
                              >
                                <img
                                  src={kycDetail.businessDocument}
                                  alt="Business document"
                                  className="w-full aspect-[1.3] object-cover rounded-lg border border-border hover:border-green transition-colors"
                                />
                              </button>
                            )
                          ) : (
                            <div className="w-full aspect-[1.3] rounded-lg border border-dashed border-border-strong flex items-center justify-center text-xs text-text-muted">
                              No document
                            </div>
                          )}
                        </div>

                        <div className="text-xs text-text-muted grid gap-x-6 gap-y-0.5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                          <div>
                            Legal company name: <span className="text-ink-soft">{kycDetail.legalCompanyName || '—'}</span>
                          </div>
                          <div>
                            Registration number: <span className="text-ink-soft">{kycDetail.registrationNumber || '—'}</span>
                          </div>
                          <div>
                            NTN: <span className="text-ink-soft">{kycDetail.ntn || '—'}</span>
                          </div>
                          <div>
                            Company email: <span className="text-ink-soft">{kycDetail.companyEmail || '—'}</span>
                          </div>
                          <div>
                            Company phone: <span className="text-ink-soft">{kycDetail.companyPhone || '—'}</span>
                          </div>
                          <div>
                            Location: <span className="text-ink-soft">{kycDetail.location || '—'}</span>
                          </div>
                          <div className="col-span-full">
                            Business address: <span className="text-ink-soft">{kycDetail.businessAddress || '—'}</span>
                          </div>
                          <div className="col-span-full h-px bg-border my-1" />
                          <div>
                            Bank name: <span className="text-ink-soft">{kycDetail.bankName || '—'}</span>
                          </div>
                          <div>
                            Account title: <span className="text-ink-soft">{kycDetail.accountTitle || '—'}</span>
                          </div>
                          <div>
                            Account number: <span className="text-ink-soft">{kycDetail.accountNumber || '—'}</span>
                          </div>
                          <div>
                            IBAN: <span className="text-ink-soft">{kycDetail.iban || '—'}</span>
                          </div>
                          {kycDetail.reviewedAt && (
                            <div className="col-span-full">
                              Last reviewed: <span className="text-ink-soft">{new Date(kycDetail.reviewedAt).toLocaleString()}</span>
                              {kycDetail.reviewedBy === user.id && ' by you'}
                            </div>
                          )}
                        </div>

                        {kycDetail.cnicStatus === 'rejected' && kycDetail.cnicRejectionReason && (
                          <p className="text-xs text-orange-text bg-orange-tint rounded-lg px-3 py-2">
                            Previous rejection reason: {kycDetail.cnicRejectionReason}
                          </p>
                        )}

                        {showRejectForm ? (
                          <div className="flex flex-col gap-2 max-w-[420px]">
                            <textarea
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              placeholder="Reason for rejection (shown to the seller)"
                              rows={2}
                              className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-green resize-none"
                            />
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setShowRejectForm(false)}
                                className="cursor-pointer bg-white border border-border text-ink-soft font-semibold text-xs px-4 py-2 rounded-full hover:bg-surface-muted transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                disabled={reviewPending || !rejectReason.trim()}
                                onClick={() => rejectKyc(s.id)}
                                className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 bg-orange hover:bg-orange-hover text-white font-semibold text-xs px-4 py-2 rounded-full transition-colors"
                              >
                                {reviewPending ? 'Submitting…' : 'Confirm rejection'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={reviewPending}
                              onClick={() => setShowRejectForm(true)}
                              className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 bg-white border border-border text-orange-text font-semibold text-xs px-4 py-2 rounded-full hover:bg-orange-tint transition-colors"
                            >
                              Reject
                            </button>
                            <button
                              type="button"
                              disabled={reviewPending}
                              onClick={() => approveKyc(s.id)}
                              className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 bg-green hover:bg-green-hover text-white font-semibold text-xs px-4 py-2 rounded-full transition-colors"
                            >
                              {reviewPending ? 'Submitting…' : 'Approve'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {!detailLoading && kycDetail && kycDetail.sellerType !== 'corporate' && (
                      <div className="flex flex-col gap-4 pt-1">
                        <div className="grid grid-cols-2 gap-3 max-w-[360px]">
                          <div>
                            <div className="text-[11px] font-semibold text-text-muted mb-1.5 uppercase tracking-wide">CNIC front</div>
                            {kycDetail.cnicFront ? (
                              <button
                                type="button"
                                onClick={() => setLightboxImage(kycDetail.cnicFront)}
                                className="block w-full cursor-zoom-in"
                              >
                                <img
                                  src={kycDetail.cnicFront}
                                  alt="CNIC front"
                                  className="w-full aspect-[1.6] object-cover rounded-lg border border-border hover:border-green transition-colors"
                                />
                              </button>
                            ) : (
                              <div className="w-full aspect-[1.6] rounded-lg border border-dashed border-border-strong flex items-center justify-center text-xs text-text-muted">
                                No image
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="text-[11px] font-semibold text-text-muted mb-1.5 uppercase tracking-wide">CNIC back</div>
                            {kycDetail.cnicBack ? (
                              <button
                                type="button"
                                onClick={() => setLightboxImage(kycDetail.cnicBack)}
                                className="block w-full cursor-zoom-in"
                              >
                                <img
                                  src={kycDetail.cnicBack}
                                  alt="CNIC back"
                                  className="w-full aspect-[1.6] object-cover rounded-lg border border-border hover:border-green transition-colors"
                                />
                              </button>
                            ) : (
                              <div className="w-full aspect-[1.6] rounded-lg border border-dashed border-border-strong flex items-center justify-center text-xs text-text-muted">
                                No image
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-xs text-text-muted grid gap-x-6 gap-y-0.5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                          <div>
                            Business name: <span className="text-ink-soft">{kycDetail.companyName || '—'}</span>
                          </div>
                          <div>
                            Email: <span className="text-ink-soft">{kycDetail.email || '—'}</span>
                          </div>
                          <div>
                            Phone: <span className="text-ink-soft">{kycDetail.phone || '—'}</span>
                          </div>
                          <div>
                            CNIC number: <span className="text-ink-soft">{kycDetail.cnicNumber || '—'}</span>
                          </div>
                          <div className="col-span-full">
                            Address: <span className="text-ink-soft">{kycDetail.address || '—'}</span>
                          </div>
                          {kycDetail.reviewedAt && (
                            <div className="col-span-full">
                              Last reviewed: <span className="text-ink-soft">{new Date(kycDetail.reviewedAt).toLocaleString()}</span>
                              {kycDetail.reviewedBy === user.id && ' by you'}
                            </div>
                          )}
                        </div>

                        {kycDetail.cnicStatus === 'rejected' && kycDetail.cnicRejectionReason && (
                          <p className="text-xs text-orange-text bg-orange-tint rounded-lg px-3 py-2">
                            Previous rejection reason: {kycDetail.cnicRejectionReason}
                          </p>
                        )}

                        {showRejectForm ? (
                          <div className="flex flex-col gap-2 max-w-[420px]">
                            <textarea
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              placeholder="Reason for rejection (shown to the seller)"
                              rows={2}
                              className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-green resize-none"
                            />
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setShowRejectForm(false)}
                                className="cursor-pointer bg-white border border-border text-ink-soft font-semibold text-xs px-4 py-2 rounded-full hover:bg-surface-muted transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                disabled={reviewPending || !rejectReason.trim()}
                                onClick={() => rejectKyc(s.id)}
                                className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 bg-orange hover:bg-orange-hover text-white font-semibold text-xs px-4 py-2 rounded-full transition-colors"
                              >
                                {reviewPending ? 'Submitting…' : 'Confirm rejection'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={reviewPending}
                              onClick={() => setShowRejectForm(true)}
                              className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 bg-white border border-border text-orange-text font-semibold text-xs px-4 py-2 rounded-full hover:bg-orange-tint transition-colors"
                            >
                              Reject
                            </button>
                            <button
                              type="button"
                              disabled={reviewPending}
                              onClick={() => approveKyc(s.id)}
                              className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 bg-green hover:bg-green-hover text-white font-semibold text-xs px-4 py-2 rounded-full transition-colors"
                            >
                              {reviewPending ? 'Submitting…' : 'Approve'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

          {!kycLoading && !kycError && kycList.length === 0 && (
            <div className="p-10 text-center text-sm text-text">No sellers found.</div>
          )}
        </div>
          </>
        )}

        {activeTab === 'users' && (
          <>
            <div className="mb-6">
              <h1 className="font-display text-2xl font-bold text-ink tracking-tight">Users</h1>
              <p className="text-sm text-text mt-1">View, edit, suspend, or delete any buyer, seller, or admin account.</p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                loadUsers();
              }}
              className="flex items-center gap-3 flex-wrap mb-5"
            >
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search by name, email, or phone…"
                className="flex-1 min-w-[220px] px-3.5 py-2.5 border border-border rounded-lg text-sm outline-none focus:border-green bg-white"
              />
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="px-3.5 py-2.5 border border-border rounded-lg text-sm outline-none focus:border-green bg-white"
              >
                <option value="">All roles</option>
                <option value="buyer">Buyers</option>
                <option value="seller">Sellers</option>
                <option value="admin">Admins</option>
              </select>
              <button
                type="submit"
                className="cursor-pointer bg-green hover:bg-green-hover text-white font-semibold text-sm px-5 py-2.5 rounded-full transition-colors"
              >
                Search
              </button>
            </form>

            <div className="bg-white border border-border rounded-2xl overflow-hidden">
              {usersLoading && (
                <div className="p-6 flex flex-col gap-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="animate-pulse h-12 bg-surface-muted rounded-xl" />
                  ))}
                </div>
              )}

              {!usersLoading && usersError && <div className="p-8 text-center text-sm text-orange-text">{usersError}</div>}

              {!usersLoading &&
                !usersError &&
                usersList.map((u, i) => (
                  <div key={u.id} className={i !== usersList.length - 1 ? 'border-b border-border' : ''}>
                    <div className="flex items-center justify-between gap-4 px-5 py-4 flex-wrap">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-9 h-9 rounded-lg bg-green-tint flex items-center justify-center shrink-0">
                          <IconUser width="16" height="16" className="text-green" strokeWidth="2.2" />
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-[14.5px] text-ink truncate">{u.companyName}</span>
                            {u.verified && <VerifiedBadge size={14} />}
                            <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-text-muted bg-surface-muted px-1.5 py-0.5 rounded capitalize">
                              {u.role}
                            </span>
                            <span
                              className={`shrink-0 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${
                                u.status === 'suspended' ? 'bg-orange-tint text-orange-text' : 'bg-green-tint text-green'
                              }`}
                            >
                              {u.status === 'suspended' ? 'Suspended' : 'Active'}
                            </span>
                          </div>
                          <div className="text-xs text-text-muted truncate">
                            {u.email} · {u.phone}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        {u.role === 'seller' && (
                          <button
                            type="button"
                            onClick={() => toggleUserExpand(u)}
                            className="cursor-pointer bg-white border border-border text-ink-soft font-semibold text-xs px-3.5 py-2 rounded-full hover:bg-surface-muted transition-colors"
                          >
                            {expandedUserId === u.id ? 'Close' : 'Payouts'}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openEditUser(u)}
                          className="cursor-pointer bg-white border border-border text-ink-soft font-semibold text-xs px-3.5 py-2 rounded-full hover:bg-surface-muted transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={userStatusPendingId === u.id || u.id === user.id}
                          onClick={() => handleSetUserStatus(u, u.status === 'suspended' ? 'active' : 'suspended')}
                          className={`cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 font-semibold text-xs px-3.5 py-2 rounded-full transition-colors ${
                            u.status === 'suspended'
                              ? 'bg-green hover:bg-green-hover text-white'
                              : 'bg-white border border-border text-orange-text hover:bg-orange-tint'
                          }`}
                        >
                          {userStatusPendingId === u.id ? 'Saving…' : u.status === 'suspended' ? 'Activate' : 'Suspend'}
                        </button>
                        <button
                          type="button"
                          disabled={u.id === user.id}
                          onClick={() => setDeleteUserTarget(u)}
                          className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center bg-white border border-border text-orange-text p-2 rounded-full hover:bg-orange-tint transition-colors"
                          aria-label="Delete user"
                        >
                          <IconTrash width="13" height="13" />
                        </button>
                      </div>
                    </div>

                    {expandedUserId === u.id && (
                      <div className="px-5 pb-5 bg-surface-muted/60">
                        <div className="text-[11px] font-semibold text-text-muted mb-2.5 uppercase tracking-wide pt-1">Payout ledger</div>

                        {userPayoutsLoading && <div className="text-sm text-text-muted py-2">Loading…</div>}

                        {!userPayoutsLoading && userPayouts.length > 0 && (
                          <div className="flex flex-col gap-2 mb-4">
                            {userPayouts.map((p) => (
                              <div key={p.id} className="flex items-center justify-between gap-3 bg-white border border-border rounded-lg px-3.5 py-2.5 text-sm">
                                <div className="min-w-0">
                                  <span className="font-semibold text-ink">Rs {Number(p.amount).toLocaleString('en-US')}</span>
                                  <span className="text-xs text-text-muted ml-2 capitalize">{p.method.replace('_', ' ')}</span>
                                  {p.reference && <span className="text-xs text-text-muted ml-2">Ref: {p.reference}</span>}
                                </div>
                                <span className="text-xs text-text-muted shrink-0">{new Date(p.paidAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {!userPayoutsLoading && userPayouts.length === 0 && (
                          <p className="text-sm text-text-muted mb-4">No payouts recorded yet.</p>
                        )}

                        {payoutError && <p className="text-sm text-orange-text bg-orange-tint rounded-lg px-3.5 py-2.5 mb-3">{payoutError}</p>}

                        <div className="flex items-end gap-2 flex-wrap">
                          <div>
                            <label className="block text-[11px] font-semibold text-text-muted mb-1">Amount (Rs)</label>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={payoutForm.amount}
                              onChange={(e) => setPayoutForm((f) => ({ ...f, amount: e.target.value }))}
                              className="w-[120px] px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-green bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-text-muted mb-1">Method</label>
                            <select
                              value={payoutForm.method}
                              onChange={(e) => setPayoutForm((f) => ({ ...f, method: e.target.value }))}
                              className="px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-green bg-white"
                            >
                              <option value="bank_transfer">Bank transfer</option>
                              <option value="cash">Cash</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-text-muted mb-1">Reference (optional)</label>
                            <input
                              type="text"
                              value={payoutForm.reference}
                              onChange={(e) => setPayoutForm((f) => ({ ...f, reference: e.target.value }))}
                              className="w-[150px] px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-green bg-white"
                            />
                          </div>
                          <button
                            type="button"
                            disabled={payoutSubmitting}
                            onClick={() => handleAddPayout(u)}
                            className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 bg-green hover:bg-green-hover text-white font-semibold text-xs px-4 py-2.5 rounded-full transition-colors"
                          >
                            {payoutSubmitting ? 'Recording…' : 'Record payout'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

              {!usersLoading && !usersError && usersList.length === 0 && (
                <div className="p-10 text-center text-sm text-text">No users found.</div>
              )}
            </div>
          </>
        )}
      </main>

      <AdminProductFormModal
        open={productFormOpen}
        product={editingProduct}
        sellersList={list}
        loading={productFormLoading}
        error={productFormError}
        onClose={() => setProductFormOpen(false)}
        onSubmit={handleSubmitProductForm}
      />

      <ConfirmDialog
        open={Boolean(deleteProductTarget)}
        title="Delete this product?"
        message={`"${deleteProductTarget?.name}" will be permanently removed from the storefront. This can't be undone.`}
        confirmLabel="Delete"
        loading={deleteProductLoading}
        onCancel={() => setDeleteProductTarget(null)}
        onConfirm={handleDeleteProduct}
      />

      <AdminUserFormModal
        open={userFormOpen}
        user={editingUser}
        loading={userFormLoading}
        error={userFormError}
        onClose={() => setUserFormOpen(false)}
        onSubmit={handleSubmitUserForm}
      />

      <ConfirmDialog
        open={Boolean(deleteUserTarget)}
        title="Delete this user?"
        message={`"${deleteUserTarget?.companyName}" will be permanently removed. This can't be undone.`}
        confirmLabel="Delete"
        loading={deleteUserLoading}
        onCancel={() => setDeleteUserTarget(null)}
        onConfirm={handleDeleteUser}
      />

      <Toast message={toastMessage} show={toastVisible} onHide={() => setToastVisible(false)} />

      {lightboxImage && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-6 cursor-zoom-out animate-fade-up"
          onClick={() => setLightboxImage(null)}
        >
          <img src={lightboxImage} alt="CNIC document" className="max-w-full max-h-full rounded-lg shadow-2xl" />
          <button
            type="button"
            onClick={() => setLightboxImage(null)}
            aria-label="Close"
            className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <IconClose width="18" height="18" />
          </button>
        </div>
      )}
    </div>
  );
}
