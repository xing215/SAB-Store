import React, { useState } from 'react';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

const ChangePassword = ({ userType = 'admin', title = 'Đổi mật khẩu' }) => {
	const [formData, setFormData] = useState({
		currentPassword: '',
		newPassword: '',
		confirmPassword: ''
	});
	const [loading, setLoading] = useState(false);
	const [showModal, setShowModal] = useState(false);

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData(prev => ({
			...prev,
			[name]: value
		}));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (formData.newPassword !== formData.confirmPassword) {
			toast.error('Mật khẩu mới và xác nhận mật khẩu không khớp');
			return;
		}

		if (formData.newPassword.length < 6) {
			toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
			return;
		}

		try {
			setLoading(true);

			const endpoint = userType === 'admin' ? '/api/admin/change-password' : '/api/seller/change-password';

			const response = await fetch(endpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
				body: JSON.stringify({
					currentPassword: formData.currentPassword,
					newPassword: formData.newPassword
				})
			});

			const result = await response.json();

			if (result.success) {
				toast.success('Đổi mật khẩu thành công');
				setFormData({
					currentPassword: '',
					newPassword: '',
					confirmPassword: ''
				});
				setShowModal(false);

				// Show success message and suggest re-login
				Swal.fire({
					title: 'Đổi mật khẩu thành công!',
					text: 'Vì lý do bảo mật, phiên đăng nhập khác sẽ bị đăng xuất. Bạn có thể tiếp tục sử dụng phiên này.',
					icon: 'success',
					confirmButtonText: 'Đã hiểu'
				});
			} else {
				throw new Error(result.message);
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
									<input
										type="password"
										name="newPassword"
										value={formData.newPassword}
										onChange={handleInputChange}
										className="form-input"
										required
										minLength="6"
										placeholder="Nhập mật khẩu mới"
									/>
									<p className="text-xs text-gray-500 mt-1">
										Mật khẩu phải có ít nhất 6 ký tự
									</p>
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
										className="form-input"
										required
										minLength="6"
										placeholder="Nhập lại mật khẩu mới"
									/>
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
										disabled={loading}
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
										<p className="font-medium">Lưu ý bảo mật:</p>
										<p>Sau khi đổi mật khẩu, tất cả phiên đăng nhập khác sẽ bị đăng xuất để đảm bảo an toàn.</p>
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
