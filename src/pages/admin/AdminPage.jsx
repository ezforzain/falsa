import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { sellers, admin, adminUsers, adminOrders, adminCategories, adminFilters } from '../../lib/api';
import AdminProductFormModal from '../../components/AdminProductFormModal';
import AdminUserFormModal from '../../components/AdminUserFormModal';
import AdminCategoryFormModal from '../../components/AdminCategoryFormModal';
import AdminFilterFormModal from '../../components/AdminFilterFormModal';
import AdminOrderFormModal from '../../components/AdminOrderFormModal';
import ConfirmDialog from '../../components/ConfirmDialog';
import Toast from '../../components/Toast';
import { IconAlertCircle } from '../../components/icons';
import AdminLayout from './AdminLayout';
import { FILTER_SECTIONS } from './filterConstants';
import DashboardTab from './tabs/DashboardTab';
import ProductsTab from './tabs/ProductsTab';
import OrdersTab from './tabs/OrdersTab';
import SellersTab from './tabs/SellersTab';
import UsersTab from './tabs/UsersTab';
import CategoriesTab from './tabs/CategoriesTab';
import FiltersTab from './tabs/FiltersTab';
import ReportsTab from './tabs/ReportsTab';
import SettingsTab from './tabs/SettingsTab';

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
  // Live TCS tracking, fetched per order on demand (see GET /api/admin/orders/:id/tcs/track) —
  // keyed by order id so multiple rows can be checked independently.
  const [tcsTrackingById, setTcsTrackingById] = useState({});
  const [tcsTrackingLoadingId, setTcsTrackingLoadingId] = useState(null);

  const [categoriesList, setCategoriesList] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState(null);
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryFormLoading, setCategoryFormLoading] = useState(false);
  const [categoryFormError, setCategoryFormError] = useState(null);
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState(null);
  const [deleteCategoryLoading, setDeleteCategoryLoading] = useState(false);

  const [filtersList, setFiltersList] = useState([]);
  const [filtersLoading, setFiltersLoading] = useState(true);
  const [filtersError, setFiltersError] = useState(null);
  const [filterFormOpen, setFilterFormOpen] = useState(false);
  const [filterFormSection, setFilterFormSection] = useState(null); // section "Add filter" was clicked from
  const [editingFilter, setEditingFilter] = useState(null);
  const [filterFormLoading, setFilterFormLoading] = useState(false);
  const [filterFormError, setFilterFormError] = useState(null);
  const [filterRowPendingId, setFilterRowPendingId] = useState(null);
  const [deleteFilterTarget, setDeleteFilterTarget] = useState(null);
  const [deleteFilterLoading, setDeleteFilterLoading] = useState(false);

  const [sellerAccounts, setSellerAccounts] = useState([]);

  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsError, setSettingsError] = useState(null);
  const [settingsForm, setSettingsForm] = useState(null);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSaveError, setSettingsSaveError] = useState(null);
  const [profileForm, setProfileForm] = useState({ companyName: '', phone: '', country: '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState(null);

  // TCS cost centers are fetched on demand (not on every settings load) since it's a live call to
  // TCS's own Cost Center Inquiry API — see GET /api/admin/tcs/cost-centers.
  const [tcsCostCenters, setTcsCostCenters] = useState(null);
  const [tcsCostCentersLoading, setTcsCostCentersLoading] = useState(false);
  const [tcsCostCentersError, setTcsCostCentersError] = useState(null);

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingId, setPendingId] = useState(null);
  const [actionError, setActionError] = useState(null);

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
  const [deleteUserTarget, setDeleteUserTarget] = useState(null);
  const [deleteUserLoading, setDeleteUserLoading] = useState(false);
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [userPayouts, setUserPayouts] = useState([]);
  const [userPayoutsLoading, setUserPayoutsLoading] = useState(false);
  const [payoutForm, setPayoutForm] = useState({ amount: '', method: 'bank_transfer', reference: '', note: '' });
  const [payoutSubmitting, setPayoutSubmitting] = useState(false);
  const [payoutError, setPayoutError] = useState(null);
  const [userVerifyPendingId, setUserVerifyPendingId] = useState(null);
  const [banningUserId, setBanningUserId] = useState(null);
  const [banDays, setBanDays] = useState('7');
  const [banPending, setBanPending] = useState(false);
  const [permanentBanTarget, setPermanentBanTarget] = useState(null);
  const [reachPendingId, setReachPendingId] = useState(null);

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

  const loadFilters = () => {
    setFiltersLoading(true);
    setFiltersError(null);
    adminFilters
      .list()
      .then((res) => setFiltersList(res.filters))
      .catch((err) => setFiltersError(err.message))
      .finally(() => setFiltersLoading(false));
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
      loadProducts();
      loadUsers();
      loadPromotions();
      loadOverview();
      loadReports();
      loadOrders();
      loadCategories();
      loadFilters();
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

  const handleTrackTcsOrder = async (order) => {
    setTcsTrackingLoadingId(order.id);
    try {
      const { tracking } = await adminOrders.trackTcs(order.id);
      setTcsTrackingById((current) => ({ ...current, [order.id]: { tracking, error: null } }));
    } catch (err) {
      setTcsTrackingById((current) => ({ ...current, [order.id]: { tracking: null, error: err.message } }));
    } finally {
      setTcsTrackingLoadingId(null);
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

  const openAddFilter = (section) => {
    setFilterFormSection(section);
    setEditingFilter(null);
    setFilterFormError(null);
    setFilterFormOpen(true);
  };

  const openEditFilter = (filter) => {
    setFilterFormSection(filter.section);
    setEditingFilter(filter);
    setFilterFormError(null);
    setFilterFormOpen(true);
  };

  const handleSubmitFilterForm = async (payload) => {
    setFilterFormLoading(true);
    setFilterFormError(null);
    try {
      if (editingFilter) {
        await adminFilters.update(editingFilter.id, payload);
        showToast('Filter updated');
      } else {
        await adminFilters.create(payload);
        showToast('Filter added');
      }
      setFilterFormOpen(false);
      loadFilters();
    } catch (err) {
      setFilterFormError(err.message);
    } finally {
      setFilterFormLoading(false);
    }
  };

  const handleToggleFilterEnabled = async (f) => {
    setFilterRowPendingId(f.id);
    try {
      await adminFilters.update(f.id, { enabled: !f.enabled });
      loadFilters();
    } catch (err) {
      setFiltersError(err.message);
    } finally {
      setFilterRowPendingId(null);
    }
  };

  const handleMoveFilter = async (f, direction) => {
    setFilterRowPendingId(f.id);
    try {
      const { filters: sectionFilters } = await adminFilters.move(f.id, direction);
      setFiltersList((current) => [...current.filter((x) => x.section !== f.section), ...sectionFilters]);
    } catch (err) {
      setFiltersError(err.message);
    } finally {
      setFilterRowPendingId(null);
    }
  };

  const handleDeleteFilter = async () => {
    if (!deleteFilterTarget) return;
    setDeleteFilterLoading(true);
    try {
      await adminFilters.remove(deleteFilterTarget.id);
      setDeleteFilterTarget(null);
      showToast('Filter removed');
      loadFilters();
    } catch (err) {
      setFiltersError(err.message);
    } finally {
      setDeleteFilterLoading(false);
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
        tcsCostCenterCode: settingsForm.tcsCostCenterCode,
        tcsServiceCode: settingsForm.tcsServiceCode,
        tcsDefaultWeightKg: Number(settingsForm.tcsDefaultWeightKg),
      });
      setSettingsForm(updated);
      showToast('Marketplace settings saved');
    } catch (err) {
      setSettingsSaveError(err.message);
    } finally {
      setSettingsSaving(false);
    }
  };

  const loadTcsCostCenters = async () => {
    setTcsCostCentersLoading(true);
    setTcsCostCentersError(null);
    try {
      const { costCenters } = await admin.tcsCostCenters();
      setTcsCostCenters(costCenters);
    } catch (err) {
      setTcsCostCentersError(err.message);
    } finally {
      setTcsCostCentersLoading(false);
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

  // "suspended" with no future bannedUntil = permanent; with a future date = temporary.
  const banLabel = (u) => {
    if (u.status !== 'suspended') return null;
    if (!u.bannedUntil) return 'Permanently banned';
    const until = new Date(u.bannedUntil);
    if (until.getTime() <= Date.now()) return null;
    return `Banned until ${until.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`;
  };

  const handleToggleUserVerified = async (u) => {
    setUserVerifyPendingId(u.id);
    try {
      await adminUsers.setVerified(u.id, !u.verified);
      showToast(u.verified ? 'Blue tick removed' : 'Blue tick added');
      loadUsers();
    } catch (err) {
      showToast(err.message || 'Could not update verification');
    } finally {
      setUserVerifyPendingId(null);
    }
  };

  const submitBan = async (u, payload, label) => {
    setBanPending(true);
    try {
      await adminUsers.ban(u.id, payload);
      showToast(label);
      setBanningUserId(null);
      setPermanentBanTarget(null);
      loadUsers();
    } catch (err) {
      showToast(err.message || 'Could not update the ban');
    } finally {
      setBanPending(false);
    }
  };

  const handleSetReach = async (product, value) => {
    const next = Math.min(10, Math.max(1, value));
    if (next === (product.reachBoost || 1)) return;
    setReachPendingId(product.id);
    try {
      await admin.updateProduct(product.id, { reachBoost: next });
      showToast(`Reach set to ${next}×`);
      loadProducts();
    } catch (err) {
      showToast(err.message || 'Could not update reach');
    } finally {
      setReachPendingId(null);
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
        <div className="max-w-[420px] text-center bg-surface border border-border rounded-2xl shadow-xl p-8">
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

  return (
    <AdminLayout activeTab={activeTab} onTabChange={setActiveTab} user={user} onLogout={handleLogout}>
      {activeTab === 'overview' && (
        <DashboardTab
          overview={overview}
          overviewLoading={overviewLoading}
          overviewError={overviewError}
          usersList={usersList}
          reports={reports}
          reportsLoading={reportsLoading}
          products={products}
          onNavigate={setActiveTab}
        />
      )}

      {activeTab === 'products' && (
        <ProductsTab
          promotionRequests={promotionRequests}
          promotionsLoading={promotionsLoading}
          promotionsError={promotionsError}
          rejectingPromoId={rejectingPromoId}
          setRejectingPromoId={setRejectingPromoId}
          promoRejectReason={promoRejectReason}
          setPromoRejectReason={setPromoRejectReason}
          reviewingPromoId={reviewingPromoId}
          handleApprovePromotion={handleApprovePromotion}
          handleRejectPromotion={handleRejectPromotion}
          products={products}
          productsLoading={productsLoading}
          productsError={productsError}
          openAddProduct={openAddProduct}
          openEditProduct={openEditProduct}
          setDeleteProductTarget={setDeleteProductTarget}
          spotlightUpdatingId={spotlightUpdatingId}
          handleSetSpotlight={handleSetSpotlight}
          reachPendingId={reachPendingId}
          handleSetReach={handleSetReach}
        />
      )}

      {activeTab === 'orders' && (
        <OrdersTab
          ordersList={ordersList}
          ordersLoading={ordersLoading}
          ordersError={ordersError}
          orderSearch={orderSearch}
          setOrderSearch={setOrderSearch}
          orderStatusFilter={orderStatusFilter}
          setOrderStatusFilter={setOrderStatusFilter}
          loadOrders={loadOrders}
          orderStatusPendingId={orderStatusPendingId}
          orderRowError={orderRowError}
          handleUpdateOrderStatus={handleUpdateOrderStatus}
          tcsTrackingById={tcsTrackingById}
          tcsTrackingLoadingId={tcsTrackingLoadingId}
          handleTrackTcsOrder={handleTrackTcsOrder}
          setOrderFormOpen={setOrderFormOpen}
          setOrderFormError={setOrderFormError}
        />
      )}

      {activeTab === 'stores' && (
        <SellersTab
          list={list}
          loading={loading}
          error={error}
          actionError={actionError}
          pendingId={pendingId}
          toggleOfficialStore={toggleOfficialStore}
          toggleVerified={toggleVerified}
        />
      )}

      {activeTab === 'users' && (
        <UsersTab
          usersList={usersList}
          usersLoading={usersLoading}
          usersError={usersError}
          userSearch={userSearch}
          setUserSearch={setUserSearch}
          userRoleFilter={userRoleFilter}
          setUserRoleFilter={setUserRoleFilter}
          loadUsers={loadUsers}
          currentUser={user}
          banLabel={banLabel}
          expandedUserId={expandedUserId}
          toggleUserExpand={toggleUserExpand}
          openEditUser={openEditUser}
          userVerifyPendingId={userVerifyPendingId}
          handleToggleUserVerified={handleToggleUserVerified}
          banningUserId={banningUserId}
          setBanningUserId={setBanningUserId}
          banDays={banDays}
          setBanDays={setBanDays}
          banPending={banPending}
          submitBan={submitBan}
          setPermanentBanTarget={setPermanentBanTarget}
          setDeleteUserTarget={setDeleteUserTarget}
          userPayoutsLoading={userPayoutsLoading}
          userPayouts={userPayouts}
          payoutError={payoutError}
          payoutForm={payoutForm}
          setPayoutForm={setPayoutForm}
          payoutSubmitting={payoutSubmitting}
          handleAddPayout={handleAddPayout}
        />
      )}

      {activeTab === 'categories' && (
        <CategoriesTab
          categoriesList={categoriesList}
          categoriesLoading={categoriesLoading}
          categoriesError={categoriesError}
          openAddCategory={openAddCategory}
          openEditCategory={openEditCategory}
          setDeleteCategoryTarget={setDeleteCategoryTarget}
        />
      )}

      {activeTab === 'filters' && (
        <FiltersTab
          filtersList={filtersList}
          filtersLoading={filtersLoading}
          filtersError={filtersError}
          openAddFilter={openAddFilter}
          openEditFilter={openEditFilter}
          handleToggleFilterEnabled={handleToggleFilterEnabled}
          handleMoveFilter={handleMoveFilter}
          filterRowPendingId={filterRowPendingId}
          setDeleteFilterTarget={setDeleteFilterTarget}
        />
      )}

      {activeTab === 'reports' && <ReportsTab reports={reports} reportsLoading={reportsLoading} reportsError={reportsError} />}

      {activeTab === 'settings' && (
        <SettingsTab
          user={user}
          profileForm={profileForm}
          setProfileForm={setProfileForm}
          profileSaving={profileSaving}
          profileSaveError={profileSaveError}
          handleSaveProfile={handleSaveProfile}
          settingsLoading={settingsLoading}
          settingsError={settingsError}
          settingsForm={settingsForm}
          setSettingsForm={setSettingsForm}
          settingsSaving={settingsSaving}
          settingsSaveError={settingsSaveError}
          handleSaveSettings={handleSaveSettings}
          tcsCostCenters={tcsCostCenters}
          tcsCostCentersLoading={tcsCostCentersLoading}
          tcsCostCentersError={tcsCostCentersError}
          loadTcsCostCenters={loadTcsCostCenters}
        />
      )}

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

      <ConfirmDialog
        open={Boolean(permanentBanTarget)}
        title="Permanently ban this account?"
        message={`"${permanentBanTarget?.companyName}" will be locked out and signed off every device until an admin lifts the ban.`}
        confirmLabel="Permanently ban"
        loading={banPending}
        onCancel={() => setPermanentBanTarget(null)}
        onConfirm={() => permanentBanTarget && submitBan(permanentBanTarget, { permanent: true }, 'Account permanently banned')}
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

      <AdminFilterFormModal
        open={filterFormOpen}
        section={filterFormSection}
        existingTypes={filtersList.filter((f) => f.section === filterFormSection).map((f) => f.type)}
        filter={editingFilter}
        loading={filterFormLoading}
        error={filterFormError}
        onClose={() => setFilterFormOpen(false)}
        onSubmit={handleSubmitFilterForm}
      />

      <ConfirmDialog
        open={Boolean(deleteFilterTarget)}
        title="Remove this filter?"
        message={`"${deleteFilterTarget?.label}" will no longer appear on ${FILTER_SECTIONS.find((s) => s.key === deleteFilterTarget?.section)?.label || 'that section'}. You can add it back later.`}
        confirmLabel="Remove"
        loading={deleteFilterLoading}
        onCancel={() => setDeleteFilterTarget(null)}
        onConfirm={handleDeleteFilter}
      />

      <Toast message={toastMessage} show={toastVisible} onHide={() => setToastVisible(false)} />
    </AdminLayout>
  );
}
