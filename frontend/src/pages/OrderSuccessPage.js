import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { formatCurrency } from '../services/api';

const OrderSuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const orderData = location.state;

  useEffect(() => {
    // Redirect to home if no order data
    if (!orderData || !orderData.orderCode) {
      navigate('/', { replace: true });
    }
  }, [orderData, navigate]);

  if (!orderData) {
    return null;
  }

  const { orderCode, totalAmount, customerInfo } = orderData;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto text-center">
        {/* Success Icon */}
        <div className="mb-8">
          <div className="w-20 h-20 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-check text-3xl text-success-600"></i>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Đặt hàng thành công! 🎉
          </h1>
          <p className="text-gray-600 text-lg">
            Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi
          </p>
        </div>

        {/* Order Information */}
        <div className="card mb-8">
          <div className="bg-success-50 px-6 py-4 border-b border-success-100">
            <h2 className="text-xl font-semibold text-gray-900">
              Thông tin đơn hàng
            </h2>
          </div>
          
          <div className="p-6 space-y-4">
            {/* Order Code */}
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Mã đơn hàng của bạn:</p>
              <div className="bg-primary-100 text-primary-800 px-4 py-3 rounded-lg inline-block">
                <span className="text-2xl font-bold font-mono tracking-wider">
                  {orderCode}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Vui lòng lưu lại mã này để tra cứu đơn hàng
              </p>
            </div>

            {/* Customer Info */}
            <div className="border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div>
                  <p className="text-sm text-gray-600">Khách hàng:</p>
                  <p className="font-semibold text-gray-900">{customerInfo.fullName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email:</p>
                  <p className="font-semibold text-gray-900">{customerInfo.email}</p>
                </div>
              </div>
            </div>

            {/* Total Amount */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-900">Tổng tiền:</span>
                <span className="text-xl font-bold text-primary-600">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Email Notification */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex items-start space-x-3">
            <i className="fas fa-envelope text-blue-600 mt-1"></i>
            <div className="text-left">
              <h3 className="font-semibold text-blue-900 mb-1">
                Email xác nhận đã được gửi
              </h3>
              <p className="text-blue-700 text-sm">
                Chúng tôi đã gửi email xác nhận đơn hàng đến <strong>{customerInfo.email}</strong>. 
                Vui lòng kiểm tra hộp thư đến (và cả thư mục spam) để xem chi tiết đơn hàng.
              </p>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="card mb-8">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Các bước tiếp theo:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-primary-600 font-bold">1</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">Xác nhận</h4>
                <p className="text-gray-600">
                  Đơn hàng đã được xác nhận và đang được xử lý
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-warning-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-warning-600 font-bold">2</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">Chuẩn bị</h4>
                <p className="text-gray-600">
                  Chúng tôi sẽ chuẩn bị đơn hàng trong 15-30 phút
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-success-600 font-bold">3</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">Giao hàng</h4>
                <p className="text-gray-600">
                  Đơn hàng sẽ được giao đến bạn
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/order-tracking"
            className="btn-primary"
          >
            <i className="fas fa-search mr-2"></i>
            Tra cứu đơn hàng
          </Link>
          
          <Link
            to="/"
            className="btn-secondary"
          >
            <i className="fas fa-home mr-2"></i>
            Về trang chủ
          </Link>
        </div>

        {/* Support Info */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-2">
            <i className="fas fa-headset mr-2"></i>
            Cần hỗ trợ?
          </h4>
          <p className="text-gray-600 text-sm mb-2">
            Nếu bạn có bất kỳ câu hỏi nào về đơn hàng, vui lòng liên hệ:
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center text-sm">
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

export default OrderSuccessPage;
