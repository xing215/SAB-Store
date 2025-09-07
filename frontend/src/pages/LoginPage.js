import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { authClient } from '../lib/auth-client';
import LoadingSpinner from '../components/LoadingSpinner';
import Logo from '../components/Logo';

const ROLE_REDIRECTS = {
	admin: '/admin/dashboard',
	seller: '/seller/dashboard'
};

const LoginPage = () => {
	const navigate = useNavigate();
	const location = useLocation();

	const [formData, setFormData] = useState({
		username: '',
		password: ''
	});
	const [errors, setErrors] = useState({});
	const [isLoading, setIsLoading] = useState(false);

	// Check if already logged in and redirect appropriately
	useEffect(() => {
		const checkSession = async () => {
			try {
				let jwtToken = null;
				const { data: session } = await authClient.getSession({
					fetchOptions: {
						onSuccess: (ctx) => {
							jwtToken = ctx.response.headers.get("set-auth-jwt");
						}
					}
				});

				if (session && session.user) {
					let userRole = session.user.role;

					// If role not in session, try to extract from JWT payload
					if (!userRole && jwtToken) {
						try {
							// Decode JWT payload (middle part of JWT)
							const payload = JSON.parse(atob(jwtToken.split('.')[1]));
							userRole = payload.role;
						} catch (jwtError) {
							console.error('Failed to decode JWT:', jwtError);
						}
					}

					console.log('Session user role:', userRole);
					const redirectPath = ROLE_REDIRECTS[userRole];

					if (redirectPath) {
						navigate(redirectPath, { replace: true });
					}
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

		if (!formData.username.trim()) {
			newErrors.username = 'Tên đăng nhập là bắt buộc';
		} else if (formData.username.length < 3) {
			newErrors.username = 'Tên đăng nhập phải có ít nhất 3 ký tự';
		}

		if (!formData.password) {
			newErrors.password = 'Mật khẩu là bắt buộc';
		} else if (formData.password.length < 6) {
			newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const getErrorMessage = (error) => {
		// Better Auth error handling with Vietnamese translations
		if (!error) return 'Đăng nhập thất bại';

		const { message, code } = error;

		// Map common better-auth error codes to Vietnamese messages
		const errorMessages = {
			'INVALID_CREDENTIALS': 'Tên đăng nhập hoặc mật khẩu không chính xác',
			'USER_NOT_FOUND': 'Tài khoản không tồn tại',
			'INVALID_PASSWORD': 'Mật khẩu không chính xác',
			'ACCOUNT_LOCKED': 'Tài khoản đã bị khóa',
			'TOO_MANY_REQUESTS': 'Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau',
			'NETWORK_ERROR': 'Lỗi kết nối mạng. Vui lòng thử lại',
			'SERVER_ERROR': 'Lỗi server. Vui lòng thử lại sau'
		};

		if (code && errorMessages[code]) {
			return errorMessages[code];
		}

		// Fallback to message or generic error
		if (message) {
			// Handle some common English error messages
			if (message.toLowerCase().includes('invalid') ||
				message.toLowerCase().includes('credentials')) {
				return 'Tên đăng nhập hoặc mật khẩu không chính xác';
			}
			if (message.toLowerCase().includes('not found')) {
				return 'Tài khoản không tồn tại';
			}
			return message;
		}

		return 'Đăng nhập thất bại';
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!validateForm()) {
			toast.error('Vui lòng kiểm tra lại thông tin đăng nhập');
			return;
		}

		setIsLoading(true);

		try {
			// Use better-auth username/password sign in
			const { data, error } = await authClient.signIn.username({
				username: formData.username.trim(),
				password: formData.password,
			});

			console.log('Sign in response data:', data);
			console.log('Sign in response error:', error);

			if (error) {
				throw error;
			}

			if (data && data.user) {
				console.log('User from sign in:', data.user);
				let userRole = data.user.role;

				// If role not available in data.user, get session with JWT
				if (!userRole) {
					try {
						let jwtToken = null;
						const { data: session } = await authClient.getSession({
							fetchOptions: {
								onSuccess: (ctx) => {
									jwtToken = ctx.response.headers.get("set-auth-jwt");
								}
							}
						});

						if (session && session.user && session.user.role) {
							userRole = session.user.role;
						} else if (jwtToken) {
							// Decode JWT payload to extract role
							const payload = JSON.parse(atob(jwtToken.split('.')[1]));
							userRole = payload.role;
						}
					} catch (jwtError) {
						console.error('Failed to get role from session/JWT:', jwtError);
					}
				}

				console.log('User role from sign in:', userRole);

				toast.success('Đăng nhập thành công!');

				// Redirect based on user role automatically
				const redirectPath = ROLE_REDIRECTS[userRole];

				if (!redirectPath) {
					toast.error('Tài khoản này không có quyền truy cập hệ thống');
					await authClient.signOut();
					return;
				}

				// Check if there's a redirect from location state
				const from = location.state?.from?.pathname;
				const finalRedirectPath = from || redirectPath;

				navigate(finalRedirectPath, { replace: true });
			}
		} catch (error) {
			console.error('Login error:', error);
			const errorMessage = getErrorMessage(error);
			toast.error(errorMessage);
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
						Đăng nhập hệ thống
					</h2>
					<p className="mt-2 text-sm text-gray-600">
						Hệ thống sẽ tự động chuyển hướng dựa trên quyền của bạn
					</p>
				</div>
			</div>

			<div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
				<div className="card">
					<div className="px-6 py-8">
						<form onSubmit={handleSubmit} className="space-y-6">
							{/* Username */}
							<div>
								<label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
									Tên đăng nhập <span className="text-danger-500">*</span>
								</label>
								<div className="relative">
									<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
										<i className="fas fa-user text-gray-400"></i>
									</div>
									<input
										type="text"
										id="username"
										name="username"
										value={formData.username}
										onChange={handleInputChange}
										placeholder="Nhập tên đăng nhập"
										className={`form-input pl-10 ${errors.username ? 'form-input-error' : ''}`}
										autoComplete="username"
										disabled={isLoading}
									/>
								</div>
								{errors.username && (
									<p className="text-danger-500 text-sm mt-1">
										<i className="fas fa-exclamation-circle mr-1"></i>
										{errors.username}
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
										disabled={isLoading}
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

export default LoginPage;
