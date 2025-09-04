import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const Header = () => {
  const { getCartItemCount, formatCurrency, getCartTotal } = useCart();
  const itemCount = getCartItemCount();
  const total = getCartTotal();

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center space-x-2 text-2xl font-bold text-primary-600 hover:text-primary-700 transition-colors"
          >
            <i className="fas fa-shopping-cart"></i>
            <span>Mini Preorder</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              to="/" 
              className="text-gray-700 hover:text-primary-600 transition-colors font-medium"
            >
              Trang chủ
            </Link>
            <Link 
              to="/order-tracking" 
              className="text-gray-700 hover:text-primary-600 transition-colors font-medium"
            >
              Tra cứu đơn hàng
            </Link>
          </nav>

          {/* Cart Summary */}
          <div className="flex items-center space-x-4">
            {/* Cart Icon with Count */}
            <div className="relative">
              <div className="flex items-center space-x-2 bg-gray-100 px-3 py-2 rounded-lg">
                <i className="fas fa-shopping-bag text-gray-600"></i>
                <div className="text-sm">
                  <div className="font-medium text-gray-900">
                    {itemCount} món
                  </div>
                  <div className="text-gray-600">
                    {formatCurrency(total)}
                  </div>
                </div>
              </div>
              
              {/* Cart Count Badge */}
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-danger-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </div>

            {/* Admin Link */}
            <Link 
              to="/admin/login" 
              className="text-gray-500 hover:text-gray-700 transition-colors p-2"
              title="Đăng nhập Admin"
            >
              <i className="fas fa-user-shield text-lg"></i>
            </Link>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden mt-4 flex items-center justify-center space-x-6 border-t pt-4">
          <Link 
            to="/" 
            className="text-gray-700 hover:text-primary-600 transition-colors font-medium"
          >
            <i className="fas fa-home mr-1"></i>
            Trang chủ
          </Link>
          <Link 
            to="/order-tracking" 
            className="text-gray-700 hover:text-primary-600 transition-colors font-medium"
          >
            <i className="fas fa-search mr-1"></i>
            Tra cứu
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
