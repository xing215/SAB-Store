import React, { useState } from 'react';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { validatePassword } from '../utils/passwordValidator';
import PasswordStrengthIndicator from './PasswordStrengthIndicator';
import RandomPasswordButton from './RandomPasswordButton';
import { adminService, sellerService } from '../services/api';

const ChangePassword = ({ userType = 'admin', title = 'Đổi mật khẩu' }) => {
	const [formData, setFormData] = useState({
		currentPassword: '',
		newPassword: '',
		confirmPassword: ''
	});
	const [loading, setLoading] = useState(false);
	const [showModal, setShowModal] = useState(false);
	const [passwordValidation, setPasswordValidation] = useState(null);

	const handlePasswordGenerated = (newPassword) => {
		setFormData(prev => ({
			...prev,
			newPassword: newPassword,
			confirmPassword: '' // Clear confirm password to force re-entry
		}));
		setPasswordValidation(validatePassword(newPassword));
	};

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData(prev => ({
			...prev,
			[name]: value
		}));

		// Real-time password validation
		if (name === 'newPassword') {
			setPasswordValidation(validatePassword(value));
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		// Client-side validation
		if (formData.newPassword !== formData.confirmPassword) {
			toast.error('Mật khẩu mới và xác nhận mật khẩu không khớp');
			return;
		}

		// Validate password strength
		const validation = validatePassword(formData.newPassword);
		if (!validation.isValid) {
			toast.error('Mật khẩu không đáp ứng yêu cầu bảo mật');
			return;
		}

		try {
			setLoading(true);

			const service = userType === 'admin' ? adminService : sellerService;
			const result = await service.changePassword(
				formData.currentPassword,
				formData.newPassword
			);

			if (result.success) {
				toast.success('Đổi mật khẩu thành công');
				setFormData({
					currentPassword: '',
					newPassword: '',
					confirmPassword: ''
				});
				setPasswordValidation(null);
				setShowModal(false);

				// Show success message and suggest re-login
				Swal.fire({
					title: 'Đổi mật khẩu thành công!',
					text: 'Vì lý do bảo mật, phiên đăng nhập khác sẽ bị đăng xuất. Bạn có thể tiếp tục sử dụng phiên này.',
					icon: 'success',
					confirmButtonText: 'Đã hiểu'
				});
			} else {
				// Handle validation errors from server
				if (result.errors && Array.isArray(result.errors)) {
					const errorMessages = result.errors.map(err => err.message).join('. ');
					toast.error(errorMessages);
				} else {
					throw new Error(result.message);
				}
			}
		} catch (error) {
			console.error('Error changing password:', error);
			toast.error(error.message || 'Lỗi khi đổi mật khẩu');
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			{/* Trigger Button */}
			<button
				onClick={() => setShowModal(true)}
				className="btn-primary"
			>
				<i className="fas fa-key mr-2"></i>
				{title}
			</button>

			{/* Modal */}
			{showModal && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
					<div className="bg-white rounded-lg max-w-md w-full">
						<div className="p-6">
							<div className="flex justify-between items-center mb-6">
								<h2 className="text-xl font-semibold text-gray-900">
									{title}
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
										Mật khẩu hiện tại *
									</label>
									<input
										type="password"
										name="currentPassword"
										value={formData.currentPassword}
										onChange={handleInputChange}
										className="form-input"
										required
										placeholder="Nhập mật khẩu hiện tại"
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Mật khẩu mới *
									</label>
									<div className="flex space-x-2">
										<input
											type="password"
											name="newPassword"
											value={formData.newPassword}
											onChange={handleInputChange}
											className={`form-input flex-1 ${passwordValidation && !passwordValidation.isValid
												? 'border-red-300 focus:ring-red-500 focus:border-red-500'
												: passwordValidation && passwordValidation.isValid
													? 'border-green-300 focus:ring-green-500 focus:border-green-500'
													: ''
												}`}
											required
											placeholder="Nhập mật khẩu mới"
										/>
										<RandomPasswordButton
											onPasswordGenerated={handlePasswordGenerated}
											length={10}
											title="Tạo mật khẩu ngẫu nhiên"
										/>
									</div>

									{/* Password Strength Indicator */}
									<PasswordStrengthIndicator
										password={formData.newPassword}
										showRequirements={true}
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Xác nhận mật khẩu mới *
									</label>
									<input
										type="password"
										name="confirmPassword"
										value={formData.confirmPassword}
										onChange={handleInputChange}
										className={`form-input ${formData.confirmPassword && formData.newPassword !== formData.confirmPassword
											? 'border-red-300 focus:ring-red-500 focus:border-red-500'
											: formData.confirmPassword && formData.newPassword === formData.confirmPassword
												? 'border-green-300 focus:ring-green-500 focus:border-green-500'
												: ''
											}`}
										required
										placeholder="Nhập lại mật khẩu mới"
									/>
									{formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
										<p className="text-xs text-red-600 mt-1 flex items-center">
											<i className="fas fa-exclamation-circle mr-1" />
											Mật khẩu xác nhận không khớp
										</p>
									)}
									{formData.confirmPassword && formData.newPassword === formData.confirmPassword && (
										<p className="text-xs text-green-600 mt-1 flex items-center">
											<i className="fas fa-check-circle mr-1" />
											Mật khẩu xác nhận khớp
										</p>
									)}
								</div>

								<div className="flex justify-end space-x-3 pt-4">
									<button
										type="button"
										onClick={() => setShowModal(false)}
										className="btn-secondary"
										disabled={loading}
									>
										Hủy
									</button>
									<button
										type="submit"
										className="btn-primary"
										disabled={loading || (passwordValidation && !passwordValidation.isValid)}
									>
										{loading ? (
											<>
												<i className="fas fa-spinner fa-spin mr-2"></i>
												Đang xử lý...
											</>
										) : (
											'Đổi mật khẩu'
										)}
									</button>
								</div>
							</form>

							{/* Security Notice */}
							<div className="mt-4 p-3 bg-blue-50 rounded-md">
								<div className="flex">
									<i className="fas fa-info-circle text-blue-400 mr-2 mt-0.5"></i>
									<div className="text-sm text-blue-700">
										<p className="font-medium">Yêu cầu mật khẩu bảo mật:</p>
										<ul className="list-disc list-inside mt-1 space-y-1">
											<li>Ít nhất 6 ký tự</li>
											<li>Chứa chữ thường và chữ hoa</li>
											<li>Không sử dụng mật khẩu phổ biến</li>
											<li>Tất cả phiên đăng nhập khác sẽ bị đăng xuất</li>
										</ul>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}
		</>
	);
};

export default ChangePassword;
