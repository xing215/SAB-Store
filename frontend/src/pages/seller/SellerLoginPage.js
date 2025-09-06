import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { authClient } from '../../lib/auth-client';
import LoadingSpinner from '../../components/LoadingSpinner';
import Logo from '../../components/Logo';

const SellerLoginPage = () => {
	const [formData, setFormData] = useState({
		email: '',
		password: ''
	});
	const [isLoading, setIsLoading] = useState(false);
	const [errors, setErrors] = useState({});

	const navigate = useNavigate();
	const location = useLocation();

	// Check if already logged in
	useEffect(() => {
		const checkSession = async () => {
			try {
				const { data: session } = await authClient.getSession();
				if (session && (session.user.role === 'seller' || session.user.role === 'admin')) {
					navigate('/seller/dashboard');
				}
			} catch (error) {
				// No session or error getting session, stay on login page
			}
		};
		checkSession();
	}, [navigate]);

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
		const newErrors = {};

		if (!formData.email.trim()) {
			newErrors.email = 'Email là bắt buộc';
		} else if (!/\S+@\S+\.\S+/.test(formData.email)) {
			newErrors.email = 'Email không hợp lệ';
		}

		if (!formData.password) {
			newErrors.password = 'Mật khẩu là bắt buộc';
		} else if (formData.password.length < 6) {
			newErrors.password = 'Mật khẩu phải từ 6 ký tự trở lên';
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!validateForm()) {
			return;
		}

		setIsLoading(true);

		try {
			const { data, error } = await authClient.signIn.email({
				email: formData.email.trim(),
				password: formData.password,
			});

			if (error) {
				throw new Error(error.message || 'Đăng nhập thất bại');
			}

			if (data && data.user) {
				if (data.user.role !== 'seller' && data.user.role !== 'admin') {
					toast.error('Tài khoản này không có quyền truy cập seller');
					await authClient.signOut();
					return;
				}

				toast.success('Đăng nhập thành công!');

				// Redirect to intended page or dashboard
				const from = location.state?.from?.pathname || '/seller/dashboard';
				navigate(from, { replace: true });
			}
		} catch (error) {
			console.error('Login error:', error);
			toast.error(error.message || 'Lỗi đăng nhập');
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
			<div className="sm:mx-auto sm:w-full sm:max-w-md">
				<div className="text-center">
					<Link to="/" className="inline-flex items-center text-2xl font-bold text-primary-600 hover:text-primary-700">
						<Logo />
					</Link>
					<h2 className="mt-6 text-3xl font-bold text-gray-900 mb-2">
						Đăng nhập Seller
					</h2>
					<p className="text-gray-600">
						Đăng nhập để quản lý đơn hàng và sản phẩm
					</p>
				</div>
			</div>

			<div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
				<div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
					<form onSubmit={handleSubmit} className="space-y-6">
						{/* Email */}
						<div>
							<label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
								Email
							</label>
							<input
								type="email"
								id="email"
								name="email"
								value={formData.email}
								onChange={handleInputChange}
								placeholder="Nhập email"
								className={`form-input ${errors.email ? 'form-input-error' : ''}`}
								disabled={isLoading}
								autoComplete="email"
							/>
							{errors.email && (
								<p className="text-danger-500 text-sm mt-1">
									<i className="fas fa-exclamation-circle mr-1"></i>
									{errors.email}
								</p>
							)}
						</div>

						{/* Password */}
						<div>
							<label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
								Mật khẩu
							</label>
							<input
								type="password"
								id="password"
								name="password"
								value={formData.password}
								onChange={handleInputChange}
								placeholder="Nhập mật khẩu"
								className={`form-input ${errors.password ? 'form-input-error' : ''}`}
								disabled={isLoading}
								autoComplete="current-password"
							/>
							{errors.password && (
								<p className="text-danger-500 text-sm mt-1">
									<i className="fas fa-exclamation-circle mr-1"></i>
									{errors.password}
								</p>
							)}
						</div>

						{/* Submit Button */}
						<div>
							<button
								type="submit"
								disabled={isLoading}
								className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{isLoading ? (
									<LoadingSpinner size="small" text="Đang đăng nhập..." />
								) : (
									<>
										<i className="fas fa-sign-in-alt mr-2"></i>
										Đăng nhập
									</>
								)}
							</button>
						</div>
					</form>

					{/* Links */}
					<div className="mt-6 text-center">
						<a
							href="/"
							className="text-primary-600 hover:text-primary-500 text-sm font-medium"
						>
							<i className="fas fa-home mr-1"></i>
							Quay về trang chủ
						</a>
					</div>
				</div>
			</div>
		</div>
	);
};

export default SellerLoginPage;
