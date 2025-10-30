import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useCart } from '../context/CartContext';
import { orderService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const CheckoutPage = () => {
	const navigate = useNavigate();
	const { cart, getCartTotal, formatCurrency, clearCart, getPricingBreakdown } = useCart();

	const [formData, setFormData] = useState({
		studentId: '',
		fullName: '',
		email: '',
		phoneNumber: '',
		additionalNote: ''
	});

	const [errors, setErrors] = useState({});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [orderCompleted, setOrderCompleted] = useState(false);

	// Redirect if cart is empty (but not if order was just completed)
	useEffect(() => {
		if (cart.items.length === 0 && !orderCompleted && !isSubmitting) {
			toast.warning('Giỏ hàng trống. Vui lòng thêm sản phẩm trước khi thanh toán.');
			navigate('/');
		}
	}, [cart.items.length, navigate, orderCompleted, isSubmitting]);

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData(prev => ({
			...prev,
			[name]: value
		}));

		// Clear error when user starts typing
		if (errors[name]) {
			setErrors(prev => ({
				...prev,
				[name]: ''
			}));
		}
	};

	const validateForm = () => {
		// Phone number validation
		const newErrors = {};
		if (!formData.phoneNumber.trim()) {
			newErrors.phoneNumber = 'Số điện thoại là bắt buộc';
		} else if (!/^0[0-9]{9}$/.test(formData.phoneNumber.trim())) {
			newErrors.phoneNumber = 'Số điện thoại không hợp lệ';
		}

		// Student ID validation
		const mssvRegex = /^(1[6-9]|2[0-5])[0-9]{6}$/;
		if (!formData.studentId.trim()) {
			newErrors.studentId = 'Mã số sinh viên là bắt buộc';
		} else if (!mssvRegex.test(formData.studentId.trim())) {
			newErrors.studentId = 'Mã số sinh viên không hợp lệ';
		}

		// Full name validation
		if (!formData.fullName.trim()) {
			newErrors.fullName = 'Họ tên là bắt buộc';
		} else if (formData.fullName.trim().length < 2) {
			newErrors.fullName = 'Họ tên phải có ít nhất 2 ký tự';
		} else if (!/^[a-zA-ZÀ-ỹ\s]+$/.test(formData.fullName.trim())) {
			newErrors.fullName = 'Họ tên chỉ được chứa chữ cái và khoảng trắng';
		}

		// Email validation
		if (!formData.email.trim()) {
			newErrors.email = 'Email là bắt buộc';
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
			newErrors.email = 'Email không hợp lệ';
		}

		// Additional note validation (optional but length check)
		if (formData.additionalNote.length > 500) {
			newErrors.additionalNote = 'Ghi chú không được vượt quá 500 ký tự';
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!validateForm()) {
			toast.error('Vui lòng kiểm tra lại thông tin đã nhập');
			return;
		}

		if (cart.items.length === 0) {
			toast.error('Giỏ hàng trống');
			return;
		}

		setIsSubmitting(true);

		try {
			// Get optimal pricing breakdown to send to backend
			const pricingBreakdown = getPricingBreakdown();

			const orderData = {
				studentId: formData.studentId.trim(),
				fullName: formData.fullName.trim(),
				email: formData.email.trim().toLowerCase(),
				phoneNumber: formData.phoneNumber.trim(),
				additionalNote: formData.additionalNote.trim(),
				items: cart.items.map(item => ({
					productId: item.productId,
					quantity: item.quantity
				})),
				// Include optimal pricing information
				optimalPricing: pricingBreakdown,
				useOptimalPricing: pricingBreakdown.summary.totalSavings > 0
			};

			const response = await orderService.createOrder(orderData);

			if (response.success) {
				// Set order completed flag to prevent useEffect redirect
				setOrderCompleted(true);

				// Clear cart
				clearCart();

				// Show success message
				toast.success('Đơn hàng đã được tạo thành công!');

				// Small delay to ensure toast is shown before navigation
				setTimeout(() => {
					// Redirect to success page with order info
					navigate('/order-success', {
						state: {
							orderCode: response.data.orderCode,
							totalAmount: response.data.totalAmount,
							qrUrl: response.data.qrUrl,
							customerInfo: {
								studentId: formData.studentId.trim(),
								fullName: formData.fullName.trim(),
								email: formData.email.trim()
							}
						}
					});
				}, 100);
			}
		} catch (error) {
			console.error('Order creation error:', error);
			toast.error(error.message || 'Có lỗi xảy ra khi tạo đơn hàng');
		} finally {
			setIsSubmitting(false);
		}
	};

	const total = getCartTotal();
	const pricingBreakdown = getPricingBreakdown();

	if (cart.items.length === 0 && !orderCompleted) {
		return null; // Will redirect in useEffect
	}

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="max-w-4xl mx-auto">
				{/* Header */}
				<div className="text-center mb-8">
					<h1 className="text-3xl font-bold text-gray-900 mb-2">
						<i className="fas fa-credit-card mr-3 text-blue-700"></i>
						Xác nhận đơn hàng
					</h1>
					<p className="text-gray-600">
						Vui lòng điền đầy đủ thông tin để hoàn tất đơn hàng
					</p>
				</div>

				<div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
					{/* Order Form */}
					<div className="xl:col-span-2">
						<div className="card">
							<div className="bg-blue-50 px-6 py-4 border-b border-blue-100">
								<h2 className="text-xl font-semibold text-gray-900">
									Thông tin đặt hàng
								</h2>
							</div>

							<form id="checkout-form" onSubmit={handleSubmit} className="p-6 space-y-6">
								{/* Student ID */}
								<div>
									<label htmlFor="studentId" className="block text-sm font-medium text-gray-700 mb-2">
										Mã số sinh viên <span className="text-danger-500">*</span>
									</label>
									<input
										type="text"
										id="studentId"
										name="studentId"
										value={formData.studentId}
										onChange={handleInputChange}
										placeholder="Nhập mã số sinh viên"
										className={`form-input ${errors.studentId ? 'form-input-error' : ''}`}
										maxLength="20"
									/>
									{errors.studentId && (
										<p className="text-danger-500 text-sm mt-1">
											<i className="fas fa-exclamation-circle mr-1"></i>
											{errors.studentId}
										</p>
									)}
								</div>

								{/* Full Name */}
								<div>
									<label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
										Họ tên <span className="text-danger-500">*</span>
									</label>
									<input
										type="text"
										id="fullName"
										name="fullName"
										value={formData.fullName}
										onChange={handleInputChange}
										placeholder="Nhập họ tên đầy đủ"
										className={`form-input ${errors.fullName ? 'form-input-error' : ''}`}
										maxLength="100"
									/>
									{errors.fullName && (
										<p className="text-danger-500 text-sm mt-1">
											<i className="fas fa-exclamation-circle mr-1"></i>
											{errors.fullName}
										</p>
									)}
								</div>

								{/* Email */}
								<div>
									<label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
										Email <span className="text-danger-500">*</span>
									</label>
									<input
										type="email"
										id="email"
										name="email"
										value={formData.email}
										onChange={handleInputChange}
										placeholder="Nhập địa chỉ email"
										className={`form-input ${errors.email ? 'form-input-error' : ''}`}
										maxLength="100"
									/>
									{errors.email && (
										<p className="text-danger-500 text-sm mt-1">
											<i className="fas fa-exclamation-circle mr-1"></i>
											{errors.email}
										</p>
									)}
									<p className="text-gray-500 text-sm mt-1">
										Email sẽ được sử dụng để gửi xác nhận đơn hàng
									</p>
								</div>

								{/* Phone Number */}
								<div>
									<label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
										Số điện thoại <span className="text-danger-500">*</span>
									</label>
									<input
										type="text"
										id="phoneNumber"
										name="phoneNumber"
										value={formData.phoneNumber}
										onChange={handleInputChange}
										placeholder="Nhập số điện thoại"
										className={`form-input ${errors.phoneNumber ? 'form-input-error' : ''}`}
										maxLength="10"
									/>
									{errors.phoneNumber && (
										<p className="text-danger-500 text-sm mt-1">
											<i className="fas fa-exclamation-circle mr-1"></i>
											{errors.phoneNumber}
										</p>
									)}
									<p className="text-gray-500 text-sm mt-1">
										Ưu tiên số điện thoại có sử dụng Zalo.
									</p>
								</div>

								{/* Additional Note */}
								<div>
									<label htmlFor="additionalNote" className="block text-sm font-medium text-gray-700 mb-2">
										Ghi chú
									</label>
									<textarea
										id="additionalNote"
										name="additionalNote"
										value={formData.additionalNote}
										onChange={handleInputChange}
										placeholder="Nếu còn điều gì cần lưu ý với SAB, bạn hãy điền vào đây nhé!"
										rows="3"
										className={`form-input ${errors.additionalNote ? 'form-input-error' : ''}`}
										maxLength="500"
									/>
									<div className="flex justify-between mt-1">
										{errors.additionalNote && (
											<p className="text-danger-500 text-sm">
												<i className="fas fa-exclamation-circle mr-1"></i>
												{errors.additionalNote}
											</p>
										)}
										<p className="text-gray-500 text-sm ml-auto">
											{formData.additionalNote.length}/500
										</p>
									</div>
								</div>
							</form>
						</div>
					</div>

					{/* Order Summary */}
					<div className="xl:col-span-1">
						<div className="card sticky top-24 xl:w-[380px] w-full">
							<div className="bg-blue-50 px-6 py-4 border-b border-blue-100">
								<h3 className="text-lg font-semibold text-gray-900">
									Tóm tắt đơn hàng
								</h3>
							</div>

							<div className="p-6">
								{/* Order Items */}
								<div className="space-y-3 mb-6">
									{cart.items.map(item => (
										<div key={item.productId} className="flex justify-between items-start">
											<div className="flex-1 mr-2">
												<h4 className="font-medium text-gray-900 text-sm line-clamp-2">
													{item.productName}
												</h4>
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

								{/* Combo Savings Display */}
								{pricingBreakdown.summary.totalSavings > 0 && (
									<div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
										<div className="flex items-center justify-between mb-2">
											<span className="text-green-800 font-medium text-sm">
												<i className="fas fa-gift mr-2"></i>
												Combo tối ưu được áp dụng
											</span>
											<span className="text-green-700 font-bold">
												-{formatCurrency(pricingBreakdown.summary.totalSavings)}
											</span>
										</div>

										{pricingBreakdown.combos && pricingBreakdown.combos.length > 0 && (
											<div className="text-sm text-green-700 space-y-1">
												{pricingBreakdown.combos.map((combo, index) => (
													<div key={index} className="flex justify-between">
														<span>{combo.name} x{combo.applications}</span>
														<span>{formatCurrency(combo.totalPrice)}</span>
													</div>
												))}
											</div>
										)}

										<div className="text-xs text-green-600 mt-2">
											Giá gốc: {formatCurrency(pricingBreakdown.summary.originalTotal)} →
											Giá sau combo: {formatCurrency(pricingBreakdown.summary.finalTotal)}
										</div>
									</div>
								)}

								{/* Total */}
								<div className="border-t pt-4">
									<div className="flex justify-between items-center text-lg font-bold">
										<span className="text-gray-900">Tổng cộng:</span>
										<span className="text-blue-700">
											{formatCurrency(total)}
										</span>
									</div>
								</div>

								{/* Important Notes */}
								<div className="mt-6 p-4 bg-warning-50 border border-warning-200 rounded-lg">
									<h4 className="font-semibold text-warning-800 mb-2">
										<i className="fas fa-info-circle mr-1"></i>
										Lưu ý quan trọng:
									</h4>
									<ul className="text-warning-700 text-sm space-y-1 list-disc ml-4">
										<li>Vui lòng kiểm tra kỹ thông tin trước khi xác nhận</li>
										<li>Sau khi xác nhận, bạn vui lòng quét mã chuyển khoản trong vòng 1 giờ</li>
										<li>SAB sẽ gửi thông tin xác nhận thanh toán <b>trong vòng 7 ngày</b></li>
										<li>Thời gian nhận hàng dự kiến từ ngày T4 08/10/2025 đến ngày 19/10/2025 tại <b>Cơ sở 1 - 227 Nguyễn Văn Cừ, Phường Chợ Quán</b></li>
									</ul>
								</div>

								{/* Submit Button */}
								<div className="mt-6">
									<button
										type="submit"
										form="checkout-form"
										disabled={isSubmitting}
										className="btn-success w-full text-lg py-3 disabled:opacity-50 disabled:cursor-not-allowed"
									>
										{isSubmitting ? (
											<LoadingSpinner size="small" text="Đang xử lý..." />
										) : (
											<>
												<i className="fas fa-check mr-2"></i>
												Xác nhận đặt hàng
											</>
										)}
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default CheckoutPage;
