import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { authClient } from '../../lib/auth-client';
import LoadingSpinner from '../../components/LoadingSpinner';
import Logo from '../../components/Logo';

const AdminLoginPage = () => {
	const navigate = useNavigate();
	const [formData, setFormData] = useState({
		email: '',
		password: ''
	});
	const [errors, setErrors] = useState({});
	const [isLoading, setIsLoading] = useState(false);

	// Redirect if already logged in
	useEffect(() => {
		const checkSession = async () => {
			try {
				const { data: session } = await authClient.getSession();
				if (session && session.user.role === 'admin') {
					navigate('/admin/dashboard', { replace: true });
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
			newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!validateForm()) {
			toast.error('Vui lòng kiểm tra lại thông tin đăng nhập');
			return;
		}

		setIsLoading(true);

		try {
			// Use better-auth email/password sign in
			const { data, error } = await authClient.signIn.email({
				email: formData.email.trim(),
				password: formData.password,
			});

			if (error) {
				throw new Error(error.message || 'Đăng nhập thất bại');
			}

			if (data && data.user) {
				if (data.user.role !== 'admin') {
					toast.error('Tài khoản này không có quyền truy cập admin');
					await authClient.signOut();
					return;
				}

				toast.success('Đăng nhập thành công!');
				navigate('/admin/dashboard', { replace: true });
			}
		} catch (error) {
			console.error('Login error:', error);
			toast.error(error.message || 'Đăng nhập thất bại');
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
			<div className="sm:mx-auto sm:w-full sm:max-w-md">
				{/* Header */}
				<div className="text-center">
					<Link to="/" className="inline-flex items-center text-2xl font-bold text-primary-600 hover:text-primary-700">
						<Logo />
					</Link>
					<h2 className="mt-6 text-3xl font-bold text-gray-900">
						Đăng nhập Admin
					</h2>
					<p className="mt-2 text-sm text-gray-600">
						Truy cập bảng điều khiển quản trị
					</p>
				</div>
			</div>

			<div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
				<div className="card">
					<div className="px-6 py-8">
						<form onSubmit={handleSubmit} className="space-y-6">
							{/* Email */}
							<div>
								<label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
									Email <span className="text-danger-500">*</span>
								</label>
								<div className="relative">
									<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
										<i className="fas fa-envelope text-gray-400"></i>
									</div>
									<input
										type="email"
										id="email"
										name="email"
										value={formData.email}
										onChange={handleInputChange}
										placeholder="Nhập email"
										className={`form-input pl-10 ${errors.email ? 'form-input-error' : ''}`}
										autoComplete="email"
									/>
								</div>
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
									Mật khẩu <span className="text-danger-500">*</span>
								</label>
								<div className="relative">
									<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
										<i className="fas fa-lock text-gray-400"></i>
									</div>
									<input
										type="password"
										id="password"
										name="password"
										value={formData.password}
										onChange={handleInputChange}
										placeholder="Nhập mật khẩu"
										className={`form-input pl-10 ${errors.password ? 'form-input-error' : ''}`}
										autoComplete="current-password"
									/>
								</div>
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
									className="btn-primary w-full py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
					</div>
				</div>

				{/* Back to Home */}
				<div className="mt-6 text-center">
					<Link
						to="/"
						className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
					>
						<i className="fas fa-arrow-left mr-1"></i>
						Quay về trang chủ
					</Link>
				</div>
			</div>
		</div>
	);
};

export default AdminLoginPage;
