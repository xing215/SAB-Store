import React from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';

const Header = () => {
  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center space-x-3 text-2xl font-bold text-blue-800 hover:text-blue-900 transition-colors"
          >
            <Logo size="lg" />
            <span className="text-blue-800 hidden sm:inline">
              <span className="text-yellow-500">|</span> Workshop
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              to="/" 
              className="text-gray-700 hover:text-blue-700 transition-colors font-medium"
            >
              Trang chủ
            </Link>
            <Link 
              to="/order-tracking" 
              className="text-gray-700 hover:text-blue-700 transition-colors font-medium"
            >
              Tra cứu vé tham dự
            </Link>
          </nav>

        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden mt-4 flex items-center justify-center space-x-6">
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
