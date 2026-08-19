import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { sellers, admin, adminUsers, adminOrders, adminCategories, kyc } from '../../lib/api';
import { formatPKR } from '../../data/mockData';
import { ORDER_STATUSES, statusBadgeClass } from '../seller/statusStyles';
import VerifiedBadge from '../../components/VerifiedBadge';
import OfficialBadge from '../../components/OfficialBadge';
import Avatar from '../../components/Avatar';
import AdminProductFormModal from '../../components/AdminProductFormModal';
import AdminUserFormModal from '../../components/AdminUserFormModal';
import AdminCategoryFormModal from '../../components/AdminCategoryFormModal';
import AdminOrderFormModal from '../../components/AdminOrderFormModal';
import ConfirmDialog from '../../components/ConfirmDialog';
import Toast from '../../components/Toast';
import {
  IconAlertCircle,
  IconBox,
  IconClose,
  IconEdit,
  IconFile,
  IconLayers,
  IconLogout,
  IconPlus,
  IconReceipt,
  IconShield,
  IconSparkle,
  IconTrash,
} from '../../components/icons';
import logoMark from '../../assets/logo-mark.png';

const PIE_COLORS = ['#0E5A46', '#C97B2D', '#2D6FC9', '#8B5CF6', '#DC5A5A'];

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

export default function AdminPage() {
  const { user, status, isAuthenticated, logout, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');

  const [overview, setOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState(null);

  const [reports, setReports] = useState(null);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportsError, setReportsError] = useState(null);

  const [ordersList, setOrdersList] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState(null);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('');
  const [orderStatusPendingId, setOrderStatusPendingId] = useState(null);
  const [orderRowError, setOrderRowError] = useState(null);
  const [orderFormOpen, setOrderFormOpen] = useState(false);
  const [orderFormLoading, setOrderFormLoading] = useState(false);
  const [orderFormError, setOrderFormError] = useState(null);

  const [categoriesList, setCategoriesList] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState(null);
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryFormLoading, setCategoryFormLoading] = useState(false);
  const [categoryFormError, setCategoryFormError] = useState(null);
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState(null);
  const [deleteCategoryLoading, setDeleteCategoryLoading] = useState(false);

  const [sellerAccounts, setSellerAccounts] = useState([]);

  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsError, setSettingsError] = useState(null);
  const [settingsForm, setSettingsForm] = useState(null);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSaveError, setSettingsSaveError] = useState(null);
  const [profileForm, setProfileForm] = useState({ companyName: '', phone: '', country: '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState(null);

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

  const loadOverview = () => {
    setOverviewLoading(true);
    setOverviewError(null);
    admin
      .overview()
      .then(setOverview)
      .catch((err) => setOverviewError(err.message))
      .finally(() => setOverviewLoading(false));
  };

  const loadReports = () => {
    setReportsLoading(true);
    setReportsError(null);
    admin
      .reports()
      .then(setReports)
      .catch((err) => setReportsError(err.message))
      .finally(() => setReportsLoading(false));
  };

  const loadOrders = () => {
    setOrdersLoading(true);
    setOrdersError(null);
    adminOrders
      .list({ status: orderStatusFilter || undefined, q: orderSearch || undefined })
      .then((res) => setOrdersList(res.orders))
      .catch((err) => setOrdersError(err.message))
      .finally(() => setOrdersLoading(false));
  };

  const loadCategories = () => {
    setCategoriesLoading(true);
    setCategoriesError(null);
    adminCategories
      .list()
      .then((res) => setCategoriesList(res.categories))
      .catch((err) => setCategoriesError(err.message))
      .finally(() => setCategoriesLoading(false));
  };

  const loadSettings = () => {
    setSettingsLoading(true);
    setSettingsError(null);
    admin
      .getSettings()
      .then((res) => setSettingsForm(res.settings))
      .catch((err) => setSettingsError(err.message))
      .finally(() => setSettingsLoading(false));
  };

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      load();
      loadKyc();
      loadProducts();
      loadUsers();
      loadPromotions();
      loadOverview();
      loadReports();
      loadOrders();
      loadCategories();
      loadSettings();
      adminUsers.list({ role: 'seller' }).then((res) => setSellerAccounts(res.users)).catch(() => {});
      setProfileForm({ companyName: user.companyName || '', phone: user.phone || '', country: user.country || '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.role]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRoleFilter]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderStatusFilter]);

  const handleUpdateOrderStatus = async (order, status) => {
    if (status === order.status) return;
    setOrderStatusPendingId(order.id);
    setOrderRowError(null);
    try {
      const { order: updated } = await adminOrders.updateStatus(order.id, status);
      setOrdersList((current) => current.map((o) => (o.id === updated.id ? updated : o)));
      showToast('Order status updated');
    } catch (err) {
      setOrderRowError({ id: order.id, message: err.message });
    } finally {
      setOrderStatusPendingId(null);
    }
  };

  const handleCreateOrder = async (payload) => {
    setOrderFormLoading(true);
    setOrderFormError(null);
    try {
      await adminOrders.create(payload);
      setOrderFormOpen(false);
      showToast('Order recorded');
      loadOrders();
      loadOverview();
    } catch (err) {
      setOrderFormError(err.message);
    } finally {
      setOrderFormLoading(false);
    }
  };

  const openAddCategory = () => {
    setEditingCategory(null);
    setCategoryFormError(null);
    setCategoryFormOpen(true);
  };

  const openEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryFormError(null);
    setCategoryFormOpen(true);
  };

  const handleSubmitCategoryForm = async (payload) => {
    setCategoryFormLoading(true);
    setCategoryFormError(null);
    try {
      if (editingCategory) {
        await adminCategories.update(editingCategory.id, payload);
        showToast('Category updated');
      } else {
        await adminCategories.create(payload);
        showToast('Category added');
      }
      setCategoryFormOpen(false);
      loadCategories();
    } catch (err) {
      setCategoryFormError(err.message);
    } finally {
      setCategoryFormLoading(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deleteCategoryTarget) return;
    setDeleteCategoryLoading(true);
    try {
      await adminCategories.remove(deleteCategoryTarget.id);
      setDeleteCategoryTarget(null);
      showToast('Category deleted');
      loadCategories();
    } catch (err) {
      setCategoriesError(err.message);
    } finally {
      setDeleteCategoryLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSettingsSaving(true);
    setSettingsSaveError(null);
    try {
      const { settings: updated } = await admin.updateSettings({
        siteName: settingsForm.siteName,
        supportEmail: settingsForm.supportEmail,
        commissionRatePercent: Number(settingsForm.commissionRatePercent),
        currency: settingsForm.currency,
        maintenanceMode: settingsForm.maintenanceMode,
      });
      setSettingsForm(updated);
      showToast('Marketplace settings saved');
    } catch (err) {
      setSettingsSaveError(err.message);
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    setProfileSaving(true);
    setProfileSaveError(null);
    try {
      await updateProfile({ companyName: profileForm.companyName, phone: profileForm.phone, country: profileForm.country });
      showToast('Profile updated');
    } catch (err) {
      setProfileSaveError(err.message);
    } finally {
      setProfileSaving(false);
    }
  };

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

  // Independent of Verify — see Seller.officialStore. Same pending/error handling shape.
  const toggleOfficialStore = async (sellerRecord) => {
    setPendingId(sellerRecord.id);
    setActionError(null);
    try {
      const { seller: updated } = await admin.setSellerOfficialStore(sellerRecord.id, !sellerRecord.officialStore);
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
          <span className="hidden md:flex items-center gap-2 text-sm text-teal-mist truncate max-w-[260px]">
            <Avatar src={user.avatarUrl} size={26} iconSize={13} bgClassName="bg-white/15" iconClassName="text-white" />
            {user.companyName}
            <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-white bg-white/15 px-1.5 py-0.5 rounded">Admin</span>
          </span>
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

      <main className="flex-1 max-w-[1100px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-up">
        <div className="flex items-center gap-2 mb-8 border-b border-border overflow-x-auto no-scrollbar">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'products', label: 'Products' },
            { key: 'orders', label: 'Orders' },
            { key: 'stores', label: 'Verified Stores' },
            { key: 'kyc', label: 'Seller ID Verification' },
            { key: 'users', label: 'Users' },
            { key: 'categories', label: 'Categories' },
            { key: 'reports', label: 'Reports' },
            { key: 'settings', label: 'Settings' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`cursor-pointer whitespace-nowrap text-sm font-semibold px-1 pb-3 -mb-px border-b-2 transition-colors ${
                activeTab === tab.key ? 'text-green border-green' : 'text-text-muted border-transparent hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <>
            <div className="mb-6">
              <h1 className="font-display text-2xl font-bold text-ink tracking-tight">Overview</h1>
              <p className="text-sm text-text mt-1">A snapshot of the whole marketplace, right now.</p>
            </div>

            {overviewLoading && (
              <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-pulse bg-white border border-border rounded-2xl h-[92px]" />
                ))}
              </div>
            )}

            {!overviewLoading && overviewError && (
              <div className="bg-white border border-dashed border-border-strong rounded-2xl p-8 text-center text-orange-text text-sm">{overviewError}</div>
            )}

            {!overviewLoading && !overviewError && overview && (
              <>
                <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                  {[
                    { label: 'Total sellers', value: overview.totals.sellers.toLocaleString('en-US') },
                    { label: 'Total products', value: overview.totals.products.toLocaleString('en-US') },
                    { label: 'Total orders', value: overview.totals.orders.toLocaleString('en-US') },
                    { label: 'Total revenue', value: formatPKR(overview.totals.revenue) },
                    { label: 'Pending orders', value: overview.totals.pendingOrders.toLocaleString('en-US') },
                    { label: 'Pending seller approvals', value: overview.totals.pendingApprovals.toLocaleString('en-US') },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-white border border-border rounded-2xl p-5">
                      <div className="font-display text-xl font-bold text-ink">{stat.value}</div>
                      <div className="text-xs text-text-muted mt-0.5">{stat.label}</div>
                    </div>
                  ))}
                </div>

                <div className="grid gap-6 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
                  <div className="bg-white border border-border rounded-2xl overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-border">
                      <h2 className="font-display text-[15px] font-bold text-ink">Recent orders</h2>
                    </div>
                    {overview.recentOrders.length === 0 ? (
                      <p className="text-sm text-text-muted p-6 text-center">No orders yet.</p>
                    ) : (
                      overview.recentOrders.map((o) => (
                        <div key={o.id} className="flex items-center justify-between gap-3 px-5 py-3 border-b border-border last:border-0">
                          <div className="min-w-0">
                            <div className="font-semibold text-[13.5px] text-ink truncate">{o.buyerCompany}</div>
                            <div className="text-xs text-text-muted truncate">{o.sellerName} · {o.productName}</div>
                          </div>
                          <div className="shrink-0 text-right">
                            <div className="font-semibold text-[13.5px] text-ink">{formatPKR(o.total)}</div>
                            <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${statusBadgeClass(o.status)}`}>{o.status}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="bg-white border border-border rounded-2xl overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-border">
                      <h2 className="font-display text-[15px] font-bold text-ink">Recent seller registrations</h2>
                    </div>
                    {overview.recentSellers.length === 0 ? (
                      <p className="text-sm text-text-muted p-6 text-center">No sellers yet.</p>
                    ) : (
                      overview.recentSellers.map((s) => (
                        <div key={s.id} className="flex items-center justify-between gap-3 px-5 py-3 border-b border-border last:border-0">
                          <div className="min-w-0">
                            <div className="font-semibold text-[13.5px] text-ink truncate">{s.companyName}</div>
                            <div className="text-xs text-text-muted truncate">{s.email}</div>
                          </div>
                          <span
                            className={`shrink-0 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded capitalize ${
                              s.cnicStatus === 'approved'
                                ? 'bg-green-tint text-green'
                                : s.cnicStatus === 'rejected'
                                  ? 'bg-orange-tint text-orange-text'
                                  : 'bg-surface-muted text-text-muted'
                            }`}
                          >
                            {s.cnicStatus || 'pending'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        )}

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
                      {s.officialStore ? ' · Official Store' : ''}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={pendingId === s.id}
                    onClick={() => toggleOfficialStore(s)}
                    className={`cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 font-semibold text-xs px-4 py-2 rounded-full transition-colors ${
                      s.officialStore
                        ? 'bg-white border border-border text-text hover:bg-surface-muted'
                        : 'bg-orange hover:bg-orange-hover text-white'
                    }`}
                  >
                    {pendingId === s.id ? 'Saving…' : s.officialStore ? 'Remove official store' : 'Mark official store'}
                  </button>
                  <button
                    type="button"
                    disabled={pendingId === s.id}
                    onClick={() => toggleVerified(s)}
                    className={`cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 font-semibold text-xs px-4 py-2 rounded-full transition-colors ${
                      s.verified
                        ? 'bg-white border border-border text-text hover:bg-surface-muted'
                        : 'bg-green hover:bg-green-hover text-white'
                    }`}
                  >
                    {pendingId === s.id ? 'Saving…' : s.verified ? 'Remove verification' : 'Verify store'}
                  </button>
                </div>
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
                        <Avatar src={u.avatarUrl} size={36} iconSize={16} />
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

        {activeTab === 'orders' && (
          <>
            <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
              <div>
                <h1 className="font-display text-2xl font-bold text-ink tracking-tight">Orders</h1>
                <p className="text-sm text-text mt-1">Every order across every seller, in one place.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOrderFormError(null);
                  setOrderFormOpen(true);
                }}
                className="cursor-pointer flex items-center gap-1.5 bg-green hover:bg-green-hover text-white font-semibold text-sm px-4 py-2.5 rounded-full transition-colors"
              >
                <IconPlus width="15" height="15" />
                Record order
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                loadOrders();
              }}
              className="flex items-center gap-3 flex-wrap mb-5"
            >
              <input
                type="text"
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                placeholder="Search by buyer, product, or seller…"
                className="flex-1 min-w-[220px] px-3.5 py-2.5 border border-border rounded-lg text-sm outline-none focus:border-green bg-white"
              />
              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="px-3.5 py-2.5 border border-border rounded-lg text-sm outline-none focus:border-green bg-white"
              >
                <option value="">All statuses</option>
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="cursor-pointer bg-green hover:bg-green-hover text-white font-semibold text-sm px-5 py-2.5 rounded-full transition-colors"
              >
                Search
              </button>
            </form>

            {ordersLoading && (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="animate-pulse h-16 bg-white border border-border rounded-2xl" />
                ))}
              </div>
            )}

            {!ordersLoading && ordersError && (
              <div className="bg-white border border-dashed border-border-strong rounded-2xl p-8 text-center text-orange-text text-sm">{ordersError}</div>
            )}

            {!ordersLoading && !ordersError && ordersList.length === 0 && (
              <div className="bg-white border border-dashed border-border-strong rounded-2xl p-10 text-center">
                <span className="w-14 h-14 rounded-full bg-green-tint inline-flex items-center justify-center mb-4">
                  <IconReceipt width="24" height="24" className="text-green" />
                </span>
                <p className="text-sm text-text">No orders match yet. Record one manually, or wait for a seller's first sale.</p>
              </div>
            )}

            {!ordersLoading && !ordersError && ordersList.length > 0 && (
              <div className="bg-white border border-border rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[720px]">
                    <thead>
                      <tr className="border-b border-border text-left text-xs text-text-muted uppercase tracking-wide">
                        <th className="px-5 py-3 font-semibold">Seller</th>
                        <th className="px-5 py-3 font-semibold">Buyer</th>
                        <th className="px-5 py-3 font-semibold">Product</th>
                        <th className="px-5 py-3 font-semibold">Qty</th>
                        <th className="px-5 py-3 font-semibold">Total</th>
                        <th className="px-5 py-3 font-semibold">Date</th>
                        <th className="px-5 py-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ordersList.map((o) => (
                        <tr key={o.id} className="border-b border-border last:border-0 align-top">
                          <td className="px-5 py-4 text-ink-soft max-w-[160px]">{o.sellerName}</td>
                          <td className="px-5 py-4">
                            <div className="font-semibold text-ink">{o.buyerCompany}</div>
                            <div className="text-xs text-text-muted">{o.buyerCountry}</div>
                          </td>
                          <td className="px-5 py-4 text-text-muted max-w-[160px]">{o.productName}</td>
                          <td className="px-5 py-4 text-ink-soft whitespace-nowrap">{o.qty.toLocaleString('en-US')}</td>
                          <td className="px-5 py-4 font-semibold text-ink whitespace-nowrap">{formatPKR(o.total)}</td>
                          <td className="px-5 py-4 text-text-muted whitespace-nowrap">
                            {new Date(o.placedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-5 py-4">
                            <select
                              value={o.status}
                              disabled={orderStatusPendingId === o.id}
                              onChange={(e) => handleUpdateOrderStatus(o, e.target.value)}
                              className={`text-xs font-semibold px-2.5 py-1.5 rounded-full border-none outline-none cursor-pointer disabled:cursor-wait disabled:opacity-60 ${statusBadgeClass(o.status)}`}
                            >
                              {ORDER_STATUSES.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                            {orderRowError?.id === o.id && <div className="text-[11px] text-orange-text mt-1.5 max-w-[140px]">{orderRowError.message}</div>}
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

        {activeTab === 'categories' && (
          <>
            <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
              <div>
                <h1 className="font-display text-2xl font-bold text-ink tracking-tight">Categories</h1>
                <p className="text-sm text-text mt-1">The taxonomy buyers browse and sellers list products under.</p>
              </div>
              <button
                type="button"
                onClick={openAddCategory}
                className="cursor-pointer flex items-center gap-1.5 bg-green hover:bg-green-hover text-white font-semibold text-sm px-4 py-2.5 rounded-full transition-colors"
              >
                <IconPlus width="15" height="15" />
                Add category
              </button>
            </div>

            {categoriesLoading && (
              <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-pulse h-16 bg-white border border-border rounded-2xl" />
                ))}
              </div>
            )}

            {!categoriesLoading && categoriesError && (
              <div className="bg-white border border-dashed border-border-strong rounded-2xl p-8 text-center text-orange-text text-sm">{categoriesError}</div>
            )}

            {!categoriesLoading && !categoriesError && categoriesList.length === 0 && (
              <div className="bg-white border border-dashed border-border-strong rounded-2xl p-10 text-center">
                <span className="w-14 h-14 rounded-full bg-green-tint inline-flex items-center justify-center mb-4">
                  <IconLayers width="24" height="24" className="text-green" />
                </span>
                <p className="text-sm text-text">No categories yet — add the first one.</p>
              </div>
            )}

            {!categoriesLoading && !categoriesError && categoriesList.length > 0 && (
              <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                {categoriesList.map((c) => (
                  <div key={c.id} className="bg-white border border-border rounded-2xl p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-lg bg-green-tint flex items-center justify-center shrink-0">
                        {c.icon ? (
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0E5A46" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d={c.icon} />
                          </svg>
                        ) : (
                          <IconLayers width="15" height="15" className="text-green" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <div className="font-semibold text-[14px] text-ink truncate">{c.name}</div>
                        <div className="text-xs text-text-muted truncate">{c.key}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditCategory(c)}
                        aria-label="Edit category"
                        className="cursor-pointer flex items-center justify-center bg-white border border-border text-ink-soft p-2 rounded-full hover:bg-surface-muted transition-colors"
                      >
                        <IconEdit width="13" height="13" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteCategoryTarget(c)}
                        aria-label="Delete category"
                        className="cursor-pointer flex items-center justify-center bg-white border border-border text-orange-text p-2 rounded-full hover:bg-orange-tint transition-colors"
                      >
                        <IconTrash width="13" height="13" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'reports' && (
          <>
            <div className="mb-6">
              <h1 className="font-display text-2xl font-bold text-ink tracking-tight">Reports</h1>
              <p className="text-sm text-text mt-1">Sales, order, and seller performance statistics across the marketplace.</p>
            </div>

            {reportsLoading && (
              <div className="flex flex-col gap-4">
                <div className="animate-pulse bg-white border border-border rounded-2xl h-[280px]" />
                <div className="animate-pulse bg-white border border-border rounded-2xl h-[240px]" />
              </div>
            )}

            {!reportsLoading && reportsError && (
              <div className="bg-white border border-dashed border-border-strong rounded-2xl p-8 text-center text-orange-text text-sm">{reportsError}</div>
            )}

            {!reportsLoading && !reportsError && reports && (
              <>
                <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                  <div className="bg-white border border-border rounded-2xl p-5">
                    <div className="font-display text-xl font-bold text-ink">
                      {formatPKR(reports.daily.reduce((sum, d) => sum + d.revenue, 0))}
                    </div>
                    <div className="text-xs text-text-muted mt-0.5">Revenue (last 30 days)</div>
                  </div>
                  <div className="bg-white border border-border rounded-2xl p-5">
                    <div className="font-display text-xl font-bold text-ink">{reports.daily.reduce((sum, d) => sum + d.orders, 0)}</div>
                    <div className="text-xs text-text-muted mt-0.5">Orders (last 30 days)</div>
                  </div>
                  {Object.entries(reports.statusBreakdown).map(([statusKey, count]) => (
                    <div key={statusKey} className="bg-white border border-border rounded-2xl p-5">
                      <div className="font-display text-xl font-bold text-ink">{count}</div>
                      <div className="text-xs text-text-muted mt-0.5">{statusKey} orders</div>
                    </div>
                  ))}
                </div>

                <div className="bg-white border border-border rounded-2xl p-5 mb-6">
                  <h2 className="font-display text-base font-bold text-ink mb-4">Revenue trend</h2>
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={reports.daily.map((d) => ({ ...d, label: new Date(d.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) }))}
                        margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="adminRevenueFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#0E5A46" stopOpacity={0.25} />
                            <stop offset="100%" stopColor="#0E5A46" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E4E0D6" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#5A564C' }} axisLine={{ stroke: '#E4E0D6' }} tickLine={false} interval="preserveStartEnd" />
                        <YAxis tick={{ fontSize: 11, fill: '#5A564C' }} axisLine={false} tickLine={false} width={40} />
                        <Tooltip content={<ChartTooltip />} />
                        <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#0E5A46" strokeWidth={2} fill="url(#adminRevenueFill)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
                  <div className="bg-white border border-border rounded-2xl p-5">
                    <h2 className="font-display text-base font-bold text-ink mb-4">Top sellers by revenue</h2>
                    {reports.sellerPerformance.length === 0 ? (
                      <p className="text-sm text-text-muted py-6 text-center">No sales yet.</p>
                    ) : (
                      <div className="h-[240px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={reports.sellerPerformance} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E4E0D6" horizontal={false} />
                            <XAxis type="number" tick={{ fontSize: 11, fill: '#5A564C' }} axisLine={false} tickLine={false} />
                            <YAxis
                              type="category"
                              dataKey="name"
                              tick={{ fontSize: 11, fill: '#5A564C' }}
                              axisLine={false}
                              tickLine={false}
                              width={120}
                              tickFormatter={(v) => (v.length > 16 ? `${v.slice(0, 16)}…` : v)}
                            />
                            <Tooltip content={<ChartTooltip />} />
                            <Bar dataKey="revenue" name="Revenue" fill="#C97B2D" radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                  <div className="bg-white border border-border rounded-2xl p-5">
                    <h2 className="font-display text-base font-bold text-ink mb-4">Orders by status</h2>
                    <div className="h-[240px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={Object.entries(reports.statusBreakdown).map(([name, value]) => ({ name, value }))}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={85}
                            paddingAngle={2}
                          >
                            {Object.keys(reports.statusBreakdown).map((key, i) => (
                              <Cell key={key} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<ChartTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-center mt-2">
                      {Object.keys(reports.statusBreakdown).map((key, i) => (
                        <span key={key} className="flex items-center gap-1.5 text-xs text-text-muted">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                          {key}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {activeTab === 'settings' && (
          <>
            <div className="mb-6">
              <h1 className="font-display text-2xl font-bold text-ink tracking-tight">Settings</h1>
              <p className="text-sm text-text mt-1">Your admin profile, and basic marketplace-wide settings.</p>
            </div>

            <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
              <div className="bg-white border border-border rounded-2xl p-5">
                <h2 className="font-display text-base font-bold text-ink mb-4">Your profile</h2>
                {profileSaveError && <p className="text-sm text-orange-text bg-orange-tint rounded-lg px-3.5 py-2.5 mb-4">{profileSaveError}</p>}
                <div className="flex flex-col gap-3.5">
                  <div>
                    <label className="block text-[12.5px] font-semibold text-ink-soft mb-1.5">Name</label>
                    <input
                      type="text"
                      value={profileForm.companyName}
                      onChange={(e) => setProfileForm((f) => ({ ...f, companyName: e.target.value }))}
                      className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm outline-none focus:border-green bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[12.5px] font-semibold text-ink-soft mb-1.5">Phone</label>
                    <input
                      type="text"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))}
                      className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm outline-none focus:border-green bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[12.5px] font-semibold text-ink-soft mb-1.5">Country</label>
                    <input
                      type="text"
                      value={profileForm.country}
                      onChange={(e) => setProfileForm((f) => ({ ...f, country: e.target.value }))}
                      className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm outline-none focus:border-green bg-white"
                    />
                  </div>
                  <div className="text-xs text-text-muted">Email: {user.email}</div>
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={profileSaving || !profileForm.companyName.trim()}
                    className="self-start cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 bg-green hover:bg-green-hover text-white font-semibold text-sm px-5 py-2.5 rounded-full transition-colors"
                  >
                    {profileSaving ? 'Saving…' : 'Save profile'}
                  </button>
                </div>
              </div>

              <div className="bg-white border border-border rounded-2xl p-5">
                <h2 className="font-display text-base font-bold text-ink mb-4">Marketplace settings</h2>
                {settingsLoading && <div className="animate-pulse h-40 bg-surface-muted rounded-xl" />}
                {!settingsLoading && settingsError && <p className="text-sm text-orange-text">{settingsError}</p>}
                {!settingsLoading && !settingsError && settingsForm && (
                  <div className="flex flex-col gap-3.5">
                    {settingsSaveError && <p className="text-sm text-orange-text bg-orange-tint rounded-lg px-3.5 py-2.5">{settingsSaveError}</p>}
                    <div>
                      <label className="block text-[12.5px] font-semibold text-ink-soft mb-1.5">Marketplace name</label>
                      <input
                        type="text"
                        value={settingsForm.siteName}
                        onChange={(e) => setSettingsForm((f) => ({ ...f, siteName: e.target.value }))}
                        className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm outline-none focus:border-green bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[12.5px] font-semibold text-ink-soft mb-1.5">Support email</label>
                      <input
                        type="email"
                        value={settingsForm.supportEmail}
                        onChange={(e) => setSettingsForm((f) => ({ ...f, supportEmail: e.target.value }))}
                        className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm outline-none focus:border-green bg-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[12.5px] font-semibold text-ink-soft mb-1.5">Commission rate (%)</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={settingsForm.commissionRatePercent}
                          onChange={(e) => setSettingsForm((f) => ({ ...f, commissionRatePercent: e.target.value }))}
                          className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm outline-none focus:border-green bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[12.5px] font-semibold text-ink-soft mb-1.5">Currency</label>
                        <input
                          type="text"
                          value={settingsForm.currency}
                          onChange={(e) => setSettingsForm((f) => ({ ...f, currency: e.target.value }))}
                          className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm outline-none focus:border-green bg-white"
                        />
                      </div>
                    </div>
                    <label className="flex items-center gap-2.5 text-[13.5px] font-medium text-ink cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settingsForm.maintenanceMode}
                        onChange={(e) => setSettingsForm((f) => ({ ...f, maintenanceMode: e.target.checked }))}
                        className="w-4 h-4 accent-green cursor-pointer"
                      />
                      Maintenance mode
                    </label>
                    <button
                      type="button"
                      onClick={handleSaveSettings}
                      disabled={settingsSaving || !settingsForm.siteName?.trim()}
                      className="self-start cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 bg-green hover:bg-green-hover text-white font-semibold text-sm px-5 py-2.5 rounded-full transition-colors"
                    >
                      {settingsSaving ? 'Saving…' : 'Save settings'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>

      <AdminProductFormModal
        open={productFormOpen}
        product={editingProduct}
        sellersList={list}
        categoriesList={categoriesList}
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

      <AdminOrderFormModal
        open={orderFormOpen}
        sellersList={sellerAccounts}
        loading={orderFormLoading}
        error={orderFormError}
        onClose={() => setOrderFormOpen(false)}
        onSubmit={handleCreateOrder}
      />

      <AdminCategoryFormModal
        open={categoryFormOpen}
        category={editingCategory}
        loading={categoryFormLoading}
        error={categoryFormError}
        onClose={() => setCategoryFormOpen(false)}
        onSubmit={handleSubmitCategoryForm}
      />

      <ConfirmDialog
        open={Boolean(deleteCategoryTarget)}
        title="Delete this category?"
        message={`"${deleteCategoryTarget?.name}" will be permanently removed. This can't be undone.`}
        confirmLabel="Delete"
        loading={deleteCategoryLoading}
        onCancel={() => setDeleteCategoryTarget(null)}
        onConfirm={handleDeleteCategory}
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
