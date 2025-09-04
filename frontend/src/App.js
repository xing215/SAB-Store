import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Context
import { CartProvider } from './context/CartContext';

// Pages
import HomePage from './pages/HomePage';
import CheckoutPage from './pages/CheckoutPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';

// Components
import Layout from './components/Layout';
import AdminLayout from './components/admin/AdminLayout';
import ProtectedRoute from './components/admin/ProtectedRoute';

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
              <Route path="login" element={<AdminLoginPage />} />
              <Route path="dashboard" element={
                <ProtectedRoute>
                  <AdminLayout>
                    <AdminDashboard />
                  </AdminLayout>
                </ProtectedRoute>
              } />
            </Route>

            {/* Redirect /dashboard to /admin/dashboard */}
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
