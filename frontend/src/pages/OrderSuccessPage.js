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
			return;
		}
	}, [orderData, navigate]);

	if (!orderData) {
		return null;
	}

	const { orderCode, totalAmount, customerInfo, qrUrl, paymentDescription } = orderData;

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
						Nhà Cá sẽ chuẩn bị hàng cho bạn sớm nhất 🐟
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
								Vui lòng <b>lưu lại mã này</b> để tra cứu đơn hàng
							</p>
						</div>

						{/* Customer Info */}
						<div className="border-t pt-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
								<div>
									<p className="text-sm text-gray-600">Khách hàng:</p>
									<p className="font-semibold text-gray-900">{customerInfo.studentId} - {customerInfo.fullName}</p>
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

				{/* Payment QR Code */}
				{qrUrl && (
					<div className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 rounded-lg p-6 mb-8">
						<div className="text-center">
							{/* Urgent Payment Header */}
							<div className="mb-4">
								<h3 className="text-xl font-bold text-red-700 mb-2">
									<i className="fas fa-exclamation-triangle mr-2"></i>
									Thanh toán đơn đặt hàng.
								</h3>
								<p className="text-red-600 text-sm">
									Để được xử lý nhanh nhất, bạn vui lòng thanh toán trong vòng 1 giờ
								</p>
							</div>

							{/* QR Code */}
							<div className="bg-white rounded-lg p-4 shadow-inner mb-4 inline-block">
								<img
									src={qrUrl}
									alt="Payment QR Code"
									className="w-64 h-64 mx-auto"
									onError={(e) => {
										e.target.style.display = 'none';
										e.target.nextSibling.style.display = 'block';
									}}
								/>
								<div
									className="w-64 h-64 bg-gray-200 flex items-center justify-center text-gray-500"
									style={{ display: 'none' }}
								>
									<i className="fas fa-image text-4xl"></i>
									<p>Không thể tải QR</p>
								</div>
							</div>

							{/* Payment Instructions */}
							<div className="text-left space-y-3">
								<h4 className="font-semibold text-gray-900 text-center">
									<i className="fas fa-mobile-alt mr-2"></i>
									Hướng dẫn thanh toán
								</h4>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
									<div className="p-3">
										<ol className="space-y-2 text-gray-700">
											<li className="flex items-start">
												<span className="bg-primary-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">1</span>
												Mở ứng dụng ngân hàng hoặc ví điện tử
											</li>
											<li className="flex items-start">
												<span className="bg-primary-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">2</span>
												Quét mã QR
											</li>
											<li className="flex items-start">
												<span className="bg-primary-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">3</span>
												Kiểm tra thông tin và xác nhận thanh toán
											</li>
										</ol>
									</div>
									<div className="bg-gray-50 rounded-lg p-3">
										<h5 className="font-semibold text-gray-900 mb-2">Thông tin chuyển khoản:</h5>
										<div className="space-y-1 text-xs text-gray-600">
											<p><strong>Số tiền:</strong> {formatCurrency(totalAmount)}</p>
											<p><strong>Nội dung:</strong> {paymentDescription}</p>
											<p className="text-red-600 font-medium">
												⚠️ Không thay đổi nội dung chuyển khoản
											</p>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Action Buttons */}
				<div className="flex flex-col sm:flex-row gap-4 justify-center">
					<Link
						to={`/order-tracking?code=${orderCode}`}
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
			</div>
		</div>
	);
};

export default OrderSuccessPage;
