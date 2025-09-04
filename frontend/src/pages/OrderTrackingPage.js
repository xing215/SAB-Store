import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { orderService, formatCurrency, formatDate, getStatusText, getStatusColor } from '../services/api';
import { generateOrderPaymentQR, formatOrderPaymentDescription } from '../utils/payment';
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

    if (orderCode.trim().length < 5) {
      setError('Mã đơn hàng không hợp lệ');
      return;
    }

    setLoading(true);
    setError('');
    setOrder(null);

    try {
      const response = await orderService.getOrderByCode(orderCode.trim().toUpperCase());
      
      if (response.success) {
        setOrder(response.data);
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
            <i className="fas fa-search mr-3 text-blue-700"></i>
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
                    placeholder="Nhập mã đơn hàng"
                    className={`form-input flex-1 ${error ? 'form-input-error' : ''}`}
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
                    <div className="relative flex items-center justify-between">
                      {getStatusSteps(order.status).map((step, index) => (
                        <div key={step.key} className="flex flex-col items-center flex-1 relative">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 relative z-10 ${
                            step.completed 
                              ? 'bg-success-100 text-success-600' 
                              : step.active
                              ? 'bg-blue-100 text-blue-700'
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
                            <div className={`absolute top-5 left-1/2 h-0.5 ${
                              step.completed ? 'bg-success-300' : 'bg-gray-200'
                            }`} style={{ 
                              width: 'calc(100% - 20px)',
                              marginLeft: '10px'
                            }}></div>
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
                    <span className="text-blue-700">
                      {formatCurrency(order.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment QR Code - Show only if not paid and not cancelled */}
            {order.status !== 'paid' && order.status !== 'delivered' && order.status !== 'cancelled' && (
              <div className="card mt-6">
                <div className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 px-6 py-4 border-b border-red-100">
                  <h3 className="text-xl font-bold text-red-700 flex items-center">
                    <i className="fas fa-exclamation-triangle mr-2"></i>
                    Thanh toán đơn hàng
                  </h3>
                  <p className="text-red-600 text-sm mt-1">
                    Để được xử lý nhanh nhất, bạn vui lòng thanh toán sớm nhất có thể
                  </p>
                </div>
                
                <div>
                  <div className="text-center">
                    {/* QR Code */}
                    <div className="bg-white rounded-lg p-4 shadow-inner mb-4 inline-block">
                      <img 
                        src={generateOrderPaymentQR(
                          order.totalAmount,
                          order.orderCode,
                          order.studentId,
                          order.fullName
                        )}
                        alt="Payment QR Code"
                        className="w-48 h-48 mx-auto"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                      />
                      <div 
                        className="w-48 h-48 bg-gray-200 flex flex-col items-center justify-center text-gray-500"
                        style={{display: 'none'}}
                      >
                        <i className="fas fa-image text-2xl mb-2"></i>
                        <p className="text-sm">Không thể tải QR</p>
                      </div>
                    </div>

                    {/* Payment Instructions */}
                    <div className="text-left space-y-3">
                      <h4 className="font-semibold text-red-800 text-center">
                        <i className="fas fa-mobile-alt mr-2"></i>
                        Hướng dẫn thanh toán
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <ol className="space-y-2 text-red-700">
                          <li className="flex items-start">
                            <span className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">1</span>
                            Mở ứng dụng ngân hàng hoặc ví điện tử
                          </li>
                          <li className="flex items-start">
                            <span className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">2</span>
                            Quét mã VietQR bên trên
                          </li>
                          <li className="flex items-start">
                            <span className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">3</span>
                            Kiểm tra thông tin và xác nhận thanh toán
                          </li>
                        </ol>
                        
                        <div className="bg-white border-2 border-red-200 rounded-lg p-3">
                          <h5 className="font-semibold text-red-800 mb-2">Thông tin chuyển khoản</h5>
                          <div className="space-y-1 text-xs text-red-600">
                            <p><strong>Số tiền:</strong> {formatCurrency(order.totalAmount)}</p>
                            <p><strong>Nội dung:</strong> {formatOrderPaymentDescription(
                              order.orderCode,
                              order.studentId,
                              order.fullName
                            )}</p>
                            <p className="text-red-700 font-medium mt-2">
                              ⚠️ Không thay đổi nội dung chuyển khoản
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Payment Notice */}
                      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 mt-4">
                        <div className="flex items-start space-x-2">
                          <i className="fas fa-info-circle text-red-600 mt-0.5"></i>
                          <div className="text-red-800 text-sm">
                            <p className="font-semibold mb-1">Lưu ý:</p>
                            <ul className="space-y-1 text-xs">
                              <li>• SAB sẽ kiểm tra thông tin thanh toán của bạn trong vòng tối đa 7 ngày.</li>
                              <li>• Nếu cần hỗ trợ thêm, bạn có thể liên hệ với SAB qua email: <a href="mailto:sab@fit.hcmus.edu.vn" className="text-red-600 hover:text-red-800">sab@fit.hcmus.edu.vn</a></li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

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
      </div>
    </div>
  );
};

export default OrderTrackingPage;
