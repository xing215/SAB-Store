import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { adminService, formatCurrency, formatDate, getStatusText, getStatusColor } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Filters and pagination
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState(null);

  // Fetch dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await adminService.getDashboardStats();
        if (response.success) {
          setStats(response.data);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
        toast.error('Lỗi khi tải thống kê');
      }
    };

    fetchStats();
  }, []);

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setOrdersLoading(true);
        const response = await adminService.getOrders(filters);
        
        if (response.success) {
          setOrders(response.data.orders);
          setPagination(response.data.pagination);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
        setError(error.message);
        toast.error('Lỗi khi tải danh sách đơn hàng');
      } finally {
        setOrdersLoading(false);
        setLoading(false);
      }
    };

    fetchOrders();
  }, [filters]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filtering
    }));
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
  };

  // Handle order status update
  const handleStatusUpdate = async (orderId, currentStatus) => {
    const statusOptions = {
      'confirmed': ['paid', 'cancelled'],
      'paid': ['delivered', 'cancelled'],
      'delivered': [],
      'cancelled': []
    };

    const availableStatuses = statusOptions[currentStatus] || [];
    
    if (availableStatuses.length === 0) {
      toast.warning('Không thể thay đổi trạng thái của đơn hàng này');
      return;
    }

    const statusLabels = {
      'paid': 'Đã thanh toán',
      'delivered': 'Đã giao hàng',
      'cancelled': 'Hủy đơn hàng'
    };

    const options = availableStatuses.map(status => ({
      value: status,
      label: statusLabels[status]
    }));

    const { value: selectedStatus } = await Swal.fire({
      title: 'Cập nhật trạng thái',
      text: 'Chọn trạng thái mới cho đơn hàng:',
      input: 'select',
      inputOptions: options.reduce((acc, option) => {
        acc[option.value] = option.label;
        return acc;
      }, {}),
      showCancelButton: true,
      confirmButtonText: 'Cập nhật',
      cancelButtonText: 'Hủy',
      inputValidator: (value) => {
        if (!value) {
          return 'Vui lòng chọn trạng thái!';
        }
      }
    });

    if (!selectedStatus) return;

    let updateData = { status: selectedStatus };

    // Handle specific status requirements
    if (selectedStatus === 'paid') {
      const { value: transactionCode } = await Swal.fire({
        title: 'Mã giao dịch',
        text: 'Nhập mã giao dịch thanh toán:',
        input: 'text',
        inputPlaceholder: 'Ví dụ: TXN123456789',
        showCancelButton: true,
        confirmButtonText: 'Xác nhận',
        cancelButtonText: 'Hủy',
        inputValidator: (value) => {
          if (!value || value.trim().length === 0) {
            return 'Mã giao dịch là bắt buộc!';
          }
          if (value.trim().length > 50) {
            return 'Mã giao dịch không được vượt quá 50 ký tự!';
          }
        }
      });

      if (!transactionCode) return;
      updateData.transactionCode = transactionCode.trim();
    }

    if (selectedStatus === 'delivered') {
      const result = await Swal.fire({
        title: 'Xác nhận giao hàng',
        text: 'Bạn có chắc chắn đơn hàng này đã được giao thành công?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#22c55e',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Xác nhận',
        cancelButtonText: 'Hủy'
      });

      if (!result.isConfirmed) return;
    }

    if (selectedStatus === 'cancelled') {
      const { value: cancelReason } = await Swal.fire({
        title: 'Lý do hủy đơn hàng',
        text: 'Nhập lý do hủy đơn hàng:',
        input: 'textarea',
        inputPlaceholder: 'Ví dụ: Hết hàng, khách hàng yêu cầu hủy...',
        showCancelButton: true,
        confirmButtonText: 'Hủy đơn hàng',
        cancelButtonText: 'Quay lại',
        confirmButtonColor: '#ef4444',
        inputValidator: (value) => {
          if (!value || value.trim().length === 0) {
            return 'Lý do hủy là bắt buộc!';
          }
          if (value.trim().length > 500) {
            return 'Lý do hủy không được vượt quá 500 ký tự!';
          }
        }
      });

      if (!cancelReason) return;
      updateData.cancelReason = cancelReason.trim();
    }

    try {
      const response = await adminService.updateOrder(orderId, updateData);
      
      if (response.success) {
        toast.success('Cập nhật trạng thái đơn hàng thành công');
        
        // Refresh orders list
        const ordersResponse = await adminService.getOrders(filters);
        if (ordersResponse.success) {
          setOrders(ordersResponse.data.orders);
          setPagination(ordersResponse.data.pagination);
        }
      }
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error(error.message || 'Lỗi khi cập nhật đơn hàng');
    }
  };

  // Handle export to Excel
  const handleExport = async () => {
    try {
      const exportFilters = {
        status: filters.status,
        search: filters.search
      };
      
      await adminService.exportOrders(exportFilters);
      toast.success('Xuất file Excel thành công');
    } catch (error) {
      console.error('Export error:', error);
      toast.error(error.message || 'Lỗi khi xuất file Excel');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner size="large" text="Đang tải dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <i className="fas fa-exclamation-triangle text-6xl text-danger-500 mb-4"></i>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Có lỗi xảy ra</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="btn-primary"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Dashboard Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Quản lý đơn hàng và thống kê</p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Orders */}
          <div className="card">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Tổng đơn hàng</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.orders.total}</p>
                </div>
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-shopping-cart text-primary-600 text-xl"></i>
                </div>
              </div>
            </div>
          </div>

          {/* Today Orders */}
          <div className="card">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Hôm nay</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.orders.today}</p>
                </div>
                <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-calendar-day text-success-600 text-xl"></i>
                </div>
              </div>
            </div>
          </div>

          {/* This Week */}
          <div className="card">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Tuần này</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.orders.week}</p>
                </div>
                <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-calendar-week text-warning-600 text-xl"></i>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue */}
          <div className="card">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Doanh thu</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(stats.revenue)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-dollar-sign text-green-600 text-xl"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Orders Management */}
      <div className="card">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
            <h2 className="text-xl font-semibold text-gray-900">
              Quản lý đơn hàng
            </h2>
            
            {/* Filters and Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative">
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                <input
                  type="text"
                  placeholder="Tìm theo mã đơn, MSSV, tên..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="form-input pl-10 w-full sm:w-64"
                />
              </div>
              
              {/* Status Filter */}
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="form-input w-full sm:w-40"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="confirmed">Đã xác nhận</option>
                <option value="paid">Đã thanh toán</option>
                <option value="delivered">Đã giao hàng</option>
                <option value="cancelled">Đã hủy</option>
              </select>
              
              {/* Export Button */}
              <button
                onClick={handleExport}
                className="btn-success whitespace-nowrap"
              >
                <i className="fas fa-file-excel mr-2"></i>
                Xuất Excel
              </button>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto">
          {ordersLoading ? (
            <div className="p-12 text-center">
              <LoadingSpinner size="large" text="Đang tải đơn hàng..." />
            </div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center">
              <i className="fas fa-inbox text-6xl text-gray-300 mb-4"></i>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Không có đơn hàng
              </h3>
              <p className="text-gray-600">
                {filters.search || filters.status 
                  ? 'Không tìm thấy đơn hàng phù hợp với bộ lọc'
                  : 'Chưa có đơn hàng nào được tạo'
                }
              </p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Đơn hàng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Khách hàng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tổng tiền
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày tạo
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          #{order.orderCode}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.items.length} sản phẩm
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{order.fullName}</div>
                      <div className="text-sm text-gray-500">{order.studentId}</div>
                      <div className="text-sm text-gray-500">{order.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(order.totalAmount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`badge ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleStatusUpdate(order._id, order.status)}
                        className="text-primary-600 hover:text-primary-900 mr-3"
                        disabled={order.status === 'delivered' || order.status === 'cancelled'}
                      >
                        <i className="fas fa-edit mr-1"></i>
                        Cập nhật
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Hiển thị {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} đến{' '}
                {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} trong{' '}
                {pagination.totalItems} đơn hàng
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrev}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <i className="fas fa-chevron-left"></i>
                </button>
                
                <span className="px-3 py-2 text-sm text-gray-700">
                  Trang {pagination.currentPage} / {pagination.totalPages}
                </span>
                
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNext}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
