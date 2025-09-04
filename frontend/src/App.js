import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Context
import { CartProvider } from './context/CartContext';

// Pages
import HomePage from './pages/HomePage';
import CheckoutPage from './pages/CheckoutPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import OrderTrackingPage from './pages/OrderTrackingPage';

// Admin Pages
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import ProductsManagement from './pages/admin/ProductsManagement';
import SellersManagement from './pages/admin/SellersManagement';

// Seller Pages
import SellerLoginPage from './pages/seller/SellerLoginPage';
import SellerDashboard from './pages/seller/SellerDashboard';
import DirectSalesPage from './pages/seller/DirectSalesPage';

// Components
import Layout from './components/Layout';
import AdminLayout from './components/admin/AdminLayout';
import SellerLayout from './components/seller/SellerLayout';
import ProtectedRoute from './components/admin/ProtectedRoute';
import SellerProtectedRoute from './components/seller/SellerProtectedRoute';

function App() {
  return (
    <Router>
      <CartProvider>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="checkout" element={<CheckoutPage />} />
              <Route path="order-success" element={<OrderSuccessPage />} />
              <Route path="order-tracking" element={<OrderTrackingPage />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin">
              <Route index element={<Navigate to="/admin/login" replace />} />
              <Route path="login" element={<AdminLoginPage />} />
              <Route path="dashboard" element={
                <ProtectedRoute>
                  <AdminLayout>
                    <AdminDashboard />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="products" element={
                <ProtectedRoute>
                  <AdminLayout>
                    <ProductsManagement />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="sellers" element={
                <ProtectedRoute>
                  <AdminLayout>
                    <SellersManagement />
                  </AdminLayout>
                </ProtectedRoute>
              } />
            </Route>

            {/* Seller Routes */}
            <Route path="/seller">
              <Route index element={<Navigate to="/seller/login" replace />} />
              <Route path="login" element={<SellerLoginPage />} />
              <Route path="dashboard" element={
                <SellerProtectedRoute>
                  <SellerLayout>
                    <SellerDashboard />
                  </SellerLayout>
                </SellerProtectedRoute>
              } />
              <Route path="direct-sales" element={
                <SellerProtectedRoute>
                  <SellerLayout>
                    <DirectSalesPage />
                  </SellerLayout>
                </SellerProtectedRoute>
              } />
            </Route>

            {/* Legacy redirect for old dashboard route */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <AdminLayout>
                  <AdminDashboard />
                </AdminLayout>
              </ProtectedRoute>
            } />
          </Routes>

          {/* Toast Notifications */}
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
            toastClassName="vietnamese-text"
          />
        </div>
      </CartProvider>
    </Router>
  );
}

export default App;
