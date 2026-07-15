import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/HomePage';
import SpotlightPage from './pages/SpotlightPage';
import SearchPage from './pages/SearchPage';
import ProductPage from './pages/ProductPage';
import StorePage from './pages/StorePage';
import CartPage from './pages/CartPage';
import CategoriesPage from './pages/CategoriesPage';
import MessengerPage from './pages/MessengerPage';
import AccountPage from './pages/AccountPage';
import AuthPage from './pages/AuthPage';
import SellerLayout from './pages/seller/SellerLayout';
import SellerDashboard from './pages/seller/SellerDashboard';
import SellerProducts from './pages/seller/SellerProducts';
import SellerProductDetail from './pages/seller/SellerProductDetail';
import SellerOrders from './pages/seller/SellerOrders';
import SellerSettings from './pages/seller/SellerSettings';
import AdminPage from './pages/admin/AdminPage';

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/spotlight" element={<SpotlightPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="/store/:id" element={<StorePage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/messenger" element={<MessengerPage />} />
        <Route path="/account" element={<AccountPage />} />
      </Route>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/seller" element={<SellerLayout />}>
        <Route index element={<SellerDashboard />} />
        <Route path="products" element={<SellerProducts />} />
        <Route path="products/:id" element={<SellerProductDetail />} />
        <Route path="orders" element={<SellerOrders />} />
        <Route path="settings" element={<SellerSettings />} />
      </Route>
      <Route path="/admin" element={<AdminPage />} />
    </Routes>
  );
}
