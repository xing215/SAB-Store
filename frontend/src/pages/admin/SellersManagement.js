import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { adminService, formatDate } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

const SellersManagement = () => {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSeller, setEditingSeller] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    fullName: '',
    isActive: true
  });

  // Fetch sellers
  useEffect(() => {
    fetchSellers();
  }, []);

  const fetchSellers = async () => {
    try {
      setLoading(true);
      const response = await adminService.getSellers();
      if (response.success) {
        setSellers(response.data.sellers);
      }
    } catch (error) {
      console.error('Error fetching sellers:', error);
      toast.error('Lỗi khi tải danh sách seller');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let response;
      if (editingSeller) {
        // For editing, only send password if it's changed
        const updateData = { ...formData };
        if (!updateData.password) {
          delete updateData.password;
        }
        response = await adminService.updateSeller(editingSeller._id, updateData);
      } else {
        response = await adminService.createSeller(formData);
      }

      if (response.success) {
        toast.success(editingSeller ? 'Cập nhật seller thành công' : 'Thêm seller thành công');
        setShowModal(false);
        setEditingSeller(null);
        setFormData({
          username: '',
          password: '',
          email: '',
          fullName: '',
          isActive: true
        });
        fetchSellers();
      }
    } catch (error) {
      console.error('Error saving seller:', error);
      toast.error(error.message || 'Lỗi khi lưu seller');
    }
  };

  const handleEdit = (seller) => {
    setEditingSeller(seller);
    setFormData({
      username: seller.username,
      password: '', // Don't populate password for security
      email: seller.email || '',
      fullName: seller.fullName || '',
      isActive: seller.isActive
    });
    setShowModal(true);
  };

  const handleDelete = async (sellerId) => {
    const result = await Swal.fire({
      title: 'Xác nhận xóa seller',
      text: 'Bạn có chắc chắn muốn xóa seller này? Hành động này không thể hoàn tác.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
      try {
        const response = await adminService.deleteSeller(sellerId);
        if (response.success) {
          toast.success('Xóa seller thành công');
          fetchSellers();
        }
      } catch (error) {
        console.error('Error deleting seller:', error);
        toast.error('Lỗi khi xóa seller');
      }
    }
  };

  const handleToggleStatus = async (sellerId, currentStatus) => {
    try {
      const response = await adminService.updateSeller(sellerId, { 
        isActive: !currentStatus 
      });
      if (response.success) {
        toast.success('Cập nhật trạng thái seller thành công');
        fetchSellers();
      }
    } catch (error) {
      console.error('Error updating seller status:', error);
      toast.error('Lỗi khi cập nhật trạng thái');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner size="large" text="Đang tải danh sách seller..." />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Seller</h1>
          <p className="text-gray-600">Thêm, sửa, xóa và quản lý tài khoản seller</p>
        </div>
        <button
          onClick={() => {
            setEditingSeller(null);
            setFormData({
              username: '',
              password: '',
              email: '',
              fullName: '',
              isActive: true
            });
            setShowModal(true);
          }}
          className="btn-primary"
        >
          <i className="fas fa-plus mr-2"></i>
          Thêm seller mới
        </button>
      </div>

      {/* Sellers Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thông tin seller
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Username
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
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
              {sellers.map((seller) => (
                <tr key={seller._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {seller.fullName || 'Chưa cập nhật'}
                      </div>
                      <div className="text-sm text-gray-500">
                        ID: {seller._id.slice(-8)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {seller.username}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {seller.email || 'Chưa cập nhật'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleStatus(seller._id, seller.isActive)}
                      className={`badge ${seller.isActive ? 'badge-success cursor-pointer hover:bg-green-200' : 'badge-danger cursor-pointer hover:bg-red-200'}`}
                      title={`Click để ${seller.isActive ? 'vô hiệu hóa' : 'kích hoạt'}`}
                    >
                      {seller.isActive ? 'Hoạt động' : 'Vô hiệu hóa'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(seller.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(seller)}
                      className="text-primary-600 hover:text-primary-900 mr-3"
                    >
                      <i className="fas fa-edit mr-1"></i>
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(seller._id)}
                      className="text-danger-600 hover:text-danger-900"
                    >
                      <i className="fas fa-trash mr-1"></i>
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {sellers.length === 0 && (
            <div className="text-center py-12">
              <i className="fas fa-users text-6xl text-gray-300 mb-4"></i>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có seller</h3>
              <p className="text-gray-600">Thêm seller đầu tiên để bắt đầu</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingSeller ? 'Chỉnh sửa seller' : 'Thêm seller mới'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                    minLength="3"
                    maxLength="30"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {editingSeller ? 'Mật khẩu mới (để trống nếu không đổi)' : 'Mật khẩu *'}
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="form-input"
                    required={!editingSeller}
                    minLength="6"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Họ tên
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isActive"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                    Tài khoản đang hoạt động
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn-secondary"
                  >
                    Hủy
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingSeller ? 'Cập nhật' : 'Thêm mới'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellersManagement;
