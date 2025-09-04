import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { adminService } from '../../services/api';
import Swal from 'sweetalert2';

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: 'Đăng xuất',
      text: 'Bạn có chắc chắn muốn đăng xuất?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Đăng xuất',
      cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
      adminService.logout();
      toast.success('Đã đăng xuất thành công');
      navigate('/admin/login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-4">
              <Link 
                to="/" 
                className="flex items-center space-x-2 text-xl font-bold text-primary-600 hover:text-primary-700"
              >
                <i className="fas fa-shopping-cart"></i>
                <span>Mini Preorder</span>
              </Link>
              <div className="hidden md:block h-6 w-px bg-gray-300"></div>
              <h1 className="hidden md:block text-lg font-semibold text-gray-900">
                Bảng điều khiển Admin
              </h1>
            </div>

            {/* Admin Actions */}
            <div className="flex items-center space-x-4">
              {/* View Site */}
              <Link
                to="/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-gray-900 transition-colors"
                title="Xem trang chủ"
              >
                <i className="fas fa-external-link-alt"></i>
              </Link>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                title="Đăng xuất"
              >
                <i className="fas fa-sign-out-alt"></i>
                <span className="hidden md:inline">Đăng xuất</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
