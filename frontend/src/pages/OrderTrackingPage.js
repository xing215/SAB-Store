import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { orderService, formatCurrency, formatDate, getStatusText, getStatusColor } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const OrderTrackingPage = () => {
  const [orderCode, setOrderCode] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!orderCode.trim()) {
      setError('Vui lòng nhập mã đơn hàng');
      return;
    }

    if (orderCode.trim().length !== 5) {
      setError('Mã đơn hàng phải có 5 ký tự');
      return;
    }

    setLoading(true);
    setError('');
    setOrder(null);

    try {
      const response = await orderService.getOrderByCode(orderCode.trim().toUpperCase());
      
      if (response.success) {
        setOrder(response.data);
        toast.success('Tìm thấy đơn hàng!');
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setOrderCode('');
    setOrder(null);
    setError('');
  };

  const getStatusSteps = (currentStatus) => {
    const steps = [
      { key: 'confirmed', label: 'Đã xác nhận', icon: 'fas fa-check-circle' },
      { key: 'paid', label: 'Đã thanh toán', icon: 'fas fa-credit-card' },
      { key: 'delivered', label: 'Đã giao hàng', icon: 'fas fa-truck' }
    ];

    const statusOrder = ['confirmed', 'paid', 'delivered'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const isCancelled = currentStatus === 'cancelled';

    return steps.map((step, index) => ({
      ...step,
      completed: !isCancelled && index <= currentIndex,
      active: !isCancelled && index === currentIndex,
      cancelled: isCancelled
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            <i className="fas fa-search mr-3 text-primary-600"></i>
            Tra cứu đơn hàng
          </h1>
          <p className="text-gray-600">
            Nhập mã đơn hàng để xem trạng thái và chi tiết đơn hàng
          </p>
        </div>

        {/* Search Form */}
        <div className="card mb-8">
          <form onSubmit={handleSearch} className="p-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="orderCode" className="block text-sm font-medium text-gray-700 mb-2">
                  Mã đơn hàng <span className="text-danger-500">*</span>
                </label>
                <div className="flex space-x-3">
                  <input
                    type="text"
                    id="orderCode"
                    value={orderCode}
                    onChange={(e) => {
                      setOrderCode(e.target.value.toUpperCase());
                      setError('');
                    }}
                    placeholder="Nhập mã đơn hàng (5 ký tự)"
                    className={`form-input flex-1 ${error ? 'form-input-error' : ''}`}
                    maxLength="5"
                    style={{ textTransform: 'uppercase' }}
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary px-6"
                  >
                    {loading ? (
                      <LoadingSpinner size="small" />
                    ) : (
                      <>
                        <i className="fas fa-search mr-2"></i>
                        Tìm kiếm
                      </>
                    )}
                  </button>
                </div>
                {error && (
                  <p className="text-danger-500 text-sm mt-2">
                    <i className="fas fa-exclamation-circle mr-1"></i>
                    {error}
                  </p>
                )}
              </div>
              
              <p className="text-gray-500 text-sm">
                <i className="fas fa-info-circle mr-1"></i>
                Mã đơn hàng gồm 5 ký tự (chữ và số), được gửi qua email xác nhận
              </p>
            </div>
          </form>
        </div>

        {/* Order Details */}
        {order && (
          <div className="space-y-6">
            {/* Order Status */}
            <div className="card">
              <div className="bg-primary-50 px-6 py-4 border-b border-primary-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Đơn hàng #{order.orderCode}
                  </h2>
                  <span className={`badge ${getStatusColor(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                </div>
              </div>
              
              <div className="p-6">
                {/* Order Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-600">Ngày đặt hàng:</p>
                    <p className="font-semibold text-gray-900">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Cập nhật lần cuối:</p>
                    <p className="font-semibold text-gray-900">
                      {formatDate(order.statusUpdatedAt)}
                    </p>
                  </div>
                </div>

                {/* Status Timeline */}
                {order.status !== 'cancelled' ? (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Tiến trình đơn hàng:</h3>
                    <div className="flex items-center justify-between">
                      {getStatusSteps(order.status).map((step, index) => (
                        <div key={step.key} className="flex flex-col items-center flex-1">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                            step.completed 
                              ? 'bg-success-100 text-success-600' 
                              : step.active
                              ? 'bg-primary-100 text-primary-600'
                              : 'bg-gray-100 text-gray-400'
                          }`}>
                            <i className={step.icon}></i>
                          </div>
                          <span className={`text-xs text-center ${
                            step.completed || step.active
                              ? 'text-gray-900 font-medium'
                              : 'text-gray-400'
                          }`}>
                            {step.label}
                          </span>
                          
                          {/* Connector line */}
                          {index < getStatusSteps(order.status).length - 1 && (
                            <div className={`hidden md:block absolute h-0.5 w-24 mt-5 ${
                              step.completed ? 'bg-success-300' : 'bg-gray-200'
                            }`} style={{ marginLeft: '80px' }}></div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <i className="fas fa-times-circle text-danger-600"></i>
                      <h3 className="font-semibold text-danger-900">Đơn hàng đã bị hủy</h3>
                    </div>
                    <p className="text-danger-700 text-sm mt-1">
                      Đơn hàng này đã được hủy vào {formatDate(order.statusUpdatedAt)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div className="card">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">
                  Chi tiết đơn hàng
                </h3>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.productName}</h4>
                        <p className="text-gray-600 text-sm">
                          {formatCurrency(item.price)} x {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Total */}
                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span className="text-gray-900">Tổng cộng:</span>
                    <span className="text-primary-600">
                      {formatCurrency(order.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleReset}
                className="btn-secondary"
              >
                <i className="fas fa-search mr-2"></i>
                Tra cứu đơn khác
              </button>
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-2">
            <i className="fas fa-question-circle mr-2"></i>
            Cần hỗ trợ?
          </h4>
          <p className="text-gray-600 text-sm mb-2">
            Nếu bạn không tìm thấy đơn hàng hoặc có thắc mắc, vui lòng liên hệ:
          </p>
          <div className="flex flex-col sm:flex-row gap-2 text-sm">
            <span className="text-gray-700">
              <i className="fas fa-phone mr-1"></i>
              Hotline: 0123 456 789
            </span>
            <span className="text-gray-700">
              <i className="fas fa-envelope mr-1"></i>
              Email: support@minipreorder.com
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTrackingPage;
