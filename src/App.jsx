import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AuthContext } from './context/AuthContext';
import ProtectedRoute from './components/shared/ProtectedRoute';
import ToastContainer from './components/shared/Toast';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Customer
import CustomerHome from './pages/customer/CustomerHome';
import ProductListingPage from './pages/customer/ProductListingPage';
import ProductDetailPage from './pages/customer/ProductDetailPage';
import CartPage from './pages/customer/CartPage';
import OrderHistoryPage from './pages/customer/OrderHistoryPage';
import OrderTrackingPage from './pages/customer/OrderTrackingPage';
import CustomerProfile from './pages/customer/CustomerProfile';

// Store Owner
import StoreOwnerDashboard from './pages/store/StoreOwnerDashboard';
import ProductManagementPage from './pages/store/ProductManagementPage';
import StoreOrdersPage from './pages/store/StoreOrdersPage';

// Delivery
import DeliveryDashboard from './pages/delivery/DeliveryDashboard';

// Shared Components
import Navbar from './components/shared/Navbar';
import BottomNav from './components/shared/BottomNav';

function AppShell() {
  const { profile } = useContext(AuthContext);

  return (
    <div className="min-h-screen bg-[#FAFEFF] text-[#1A1A2E] font-sans pb-20 md:pb-0">
      <Navbar />
      <ToastContainer />
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Customer Routes */}
        <Route path="/home" element={
          <ProtectedRoute role="customer"><CustomerHome /></ProtectedRoute>
        } />
        <Route path="/products" element={
          <ProtectedRoute role="customer"><ProductListingPage /></ProtectedRoute>
        } />
        <Route path="/product/:id" element={
          <ProtectedRoute role="customer"><ProductDetailPage /></ProtectedRoute>
        } />
        <Route path="/cart" element={
          <ProtectedRoute role="customer"><CartPage /></ProtectedRoute>
        } />
        <Route path="/orders" element={
          <ProtectedRoute role="customer"><OrderHistoryPage /></ProtectedRoute>
        } />
        <Route path="/track/:id" element={
          <ProtectedRoute role="customer"><OrderTrackingPage /></ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute role="customer"><CustomerProfile /></ProtectedRoute>
        } />

        {/* Store Owner Routes */}
        <Route path="/store/dashboard" element={
          <ProtectedRoute role="store_owner"><StoreOwnerDashboard /></ProtectedRoute>
        } />
        <Route path="/store/products" element={
          <ProtectedRoute role="store_owner"><ProductManagementPage /></ProtectedRoute>
        } />
        <Route path="/store/orders" element={
          <ProtectedRoute role="store_owner"><StoreOrdersPage /></ProtectedRoute>
        } />

        {/* Delivery Routes */}
        <Route path="/delivery/dashboard" element={
          <ProtectedRoute role="delivery_partner"><DeliveryDashboard /></ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      {profile?.role === 'customer' && <BottomNav />}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
