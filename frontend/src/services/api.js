import axios from 'axios';
import { authClient } from '../lib/auth-client';

// API Base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Create axios instance
const api = axios.create({
	baseURL: `${API_BASE_URL}/api`,
	timeout: 10000,
	headers: {
		'Content-Type': 'application/json',
	},
	withCredentials: true, // Important for better-auth session cookies
});

// Request interceptor to add session cookies
api.interceptors.request.use(
	async (config) => {
		// Better-auth handles session via cookies automatically
		// No manual token handling needed
		return config;
	},
	(error) => {
		return Promise.reject(error);
	}
);

// Response interceptor to handle common errors
api.interceptors.response.use(
	(response) => {
		return response;
	},
	async (error) => {
		if (error.response?.status === 401) {
			// Session expired or invalid - sign out user
			try {
				await authClient.signOut();

				// Redirect to unified login page
				window.location.href = '/login';
			} catch (signOutError) {
				console.error('Error signing out:', signOutError);
			}
		}
		return Promise.reject(error);
	}
);

// Product Services
export const productService = {
	// Get all products
	getProducts: async (params = {}) => {
		try {
			const response = await api.get('/products', { params });
			return response.data;
		} catch (error) {
			throw new Error(error.response?.data?.message || 'Lỗi khi lấy danh sách sản phẩm');
		}
	},

	// Get single product
	getProduct: async (id) => {
		try {
			const response = await api.get(`/products/${id}`);
			return response.data;
		} catch (error) {
			throw new Error(error.response?.data?.message || 'Lỗi khi lấy thông tin sản phẩm');
		}
	},

	// Get product categories
	getCategories: async () => {
		try {
			const response = await api.get('/products/categories/list');
			return response.data;
		} catch (error) {
			throw new Error(error.response?.data?.message || 'Lỗi khi lấy danh sách danh mục');
		}
	}
};

// Order Services
export const orderService = {
	// Create new order
	createOrder: async (orderData) => {
		try {
			const response = await api.post('/orders', orderData);
			return response.data;
		} catch (error) {
			throw new Error(error.response?.data?.message || 'Lỗi khi tạo đơn hàng');
		}
	},

	// Get order by code (for tracking)
	getOrderByCode: async (orderCode) => {
		try {
			const response = await api.get(`/orders/${orderCode}`);
			return response.data;
		} catch (error) {
			throw new Error(error.response?.data?.message || 'Không tìm thấy đơn hàng');
		}
	}
};

// Admin Services
export const adminService = {
	// Check if admin is logged in
	isLoggedIn: async () => {
		try {
			const { data: session } = await authClient.getSession();
			return session && session.user && session.user.role === 'admin';
		} catch (error) {
			return false;
		}
	},

	// Admin logout
	logout: async () => {
		try {
			await authClient.signOut();
			return { success: true };
		} catch (error) {
			console.error('Logout error:', error);
			throw error;
		}
	},

	// Get dashboard statistics
	getDashboardStats: async () => {
		try {
			const response = await api.get('/admin/dashboard/stats');
			return response.data;
		} catch (error) {
			throw new Error(error.response?.data?.message || 'Lỗi khi lấy thống kê');
		}
	},

	// Get all orders (admin)
	getOrders: async (params = {}) => {
		try {
			const response = await api.get('/admin/orders', { params });
			return response.data;
		} catch (error) {
			throw new Error(error.response?.data?.message || 'Lỗi khi lấy danh sách đơn hàng');
		}
	},

	// Get single order (admin)
	getOrder: async (id) => {
		try {
			const response = await api.get(`/admin/orders/${id}`);
			return response.data;
		} catch (error) {
			throw new Error(error.response?.data?.message || 'Lỗi khi lấy thông tin đơn hàng');
		}
	},

	// Update order status
	updateOrderStatus: async (id, updateData) => {
		try {
			// Use appropriate endpoint based on current user type
			const isSellerRoute = window.location.pathname.startsWith('/seller');
			const endpoint = isSellerRoute
				? `/seller/orders/${id}/status`
				: `/admin/orders/${id}`;

			const response = await api.put(endpoint, updateData);
			return response.data;
		} catch (error) {
			throw new Error(error.response?.data?.message || 'Lỗi khi cập nhật đơn hàng');
		}
	},

	// Product management
	getProducts: async () => {
		try {
			const response = await api.get('/admin/products');
			return response.data;
		} catch (error) {
			throw new Error(error.response?.data?.message || 'Lỗi khi lấy danh sách sản phẩm');
		}
	},

	createProduct: async (productData) => {
		try {
			const response = await api.post('/admin/products', productData);
			return response.data;
		} catch (error) {
			throw new Error(error.response?.data?.message || 'Lỗi khi tạo sản phẩm');
		}
	},

	updateProduct: async (id, productData) => {
		try {
			const response = await api.put(`/admin/products/${id}`, productData);
			return response.data;
		} catch (error) {
			throw new Error(error.response?.data?.message || 'Lỗi khi cập nhật sản phẩm');
		}
	},

	deleteProduct: async (id) => {
		try {
			const response = await api.delete(`/admin/products/${id}`);
			return response.data;
		} catch (error) {
			throw new Error(error.response?.data?.message || 'Lỗi khi xóa sản phẩm');
		}
	},

	// Seller management - DEPRECATED
	// These methods have been replaced by Better-Auth admin plugin
	// Use authClient.admin.* methods instead:
	// - authClient.admin.listUsers({query: {filterField: 'role', filterValue: 'seller'}})
	// - authClient.admin.createUser({email, password, name, role: 'seller'})
	// - authClient.admin.setRole({userId, role}) / authClient.admin.setUserPassword({userId, newPassword})
	// - authClient.admin.removeUser({userId})
	//
	// These legacy methods are kept for backwards compatibility but should be migrated:
	getSellers: async () => {
		console.warn('DEPRECATED: Use authClient.admin.listUsers() with role filter instead');
		try {
			// Import authClient here to avoid circular dependency
			const { authClient } = await import('../lib/auth-client');
			const result = await authClient.admin.listUsers({
				query: {
					filterField: 'role',
					filterValue: 'seller',
					filterOperator: 'eq',
					limit: 100
				}
			});

			if (result.error) {
				throw new Error(result.error.message);
			}

			return {
				success: true,
				data: {
					sellers: result.data.users || [],
					pagination: {
						total: result.data.total || 0
					}
				}
			};
		} catch (error) {
			throw new Error(error.message || 'Lỗi khi lấy danh sách seller');
		}
	},

	createSeller: async (sellerData) => {
		console.warn('DEPRECATED: Use authClient.admin.createUser() instead');
		try {
			const { authClient } = await import('../lib/auth-client');
			const result = await authClient.admin.createUser({
				email: sellerData.email,
				password: sellerData.password,
				name: sellerData.name || sellerData.username,
				username: sellerData.username,
				role: 'seller'
			});

			if (result.error) {
				throw new Error(result.error.message);
			}

			return {
				success: true,
				message: 'Tạo tài khoản seller thành công',
				data: { seller: result.data }
			};
		} catch (error) {
			throw new Error(error.message || 'Lỗi khi tạo seller');
		}
	},

	updateSeller: async (id, sellerData) => {
		console.warn('DEPRECATED: Use authClient.admin.setUserPassword() and authClient.admin.setRole() instead');
		try {
			const { authClient } = await import('../lib/auth-client');

			// Update password if provided
			if (sellerData.password) {
				const passwordResult = await authClient.admin.setUserPassword({
					userId: id,
					newPassword: sellerData.password
				});

				if (passwordResult.error) {
					throw new Error(passwordResult.error.message);
				}
			}

			// Update role if provided and different from seller
			if (sellerData.role && sellerData.role !== 'seller') {
				const roleResult = await authClient.admin.setRole({
					userId: id,
					role: sellerData.role
				});

				if (roleResult.error) {
					throw new Error(roleResult.error.message);
				}
			}

			return {
				success: true,
				message: 'Cập nhật seller thành công'
			};
		} catch (error) {
			throw new Error(error.message || 'Lỗi khi cập nhật seller');
		}
	},

	deleteSeller: async (id) => {
		console.warn('DEPRECATED: Use authClient.admin.removeUser() instead');
		try {
			const { authClient } = await import('../lib/auth-client');
			const result = await authClient.admin.removeUser({
				userId: id
			});

			if (result.error) {
				throw new Error(result.error.message);
			}

			return {
				success: true,
				message: 'Xóa seller thành công'
			};
		} catch (error) {
			throw new Error(error.message || 'Lỗi khi xóa seller');
		}
	},

	// Export orders to Excel
	exportOrders: async (params = {}) => {
		try {
			const response = await api.get('/admin/orders/export/excel', {
				params,
				responseType: 'blob'
			});

			// Create blob URL and trigger download
			const blob = new Blob([response.data], {
				type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
			});

			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `don-hang-${new Date().toISOString().split('T')[0]}.xlsx`;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);

			return { success: true, message: 'Xuất file Excel thành công' };
		} catch (error) {
			throw new Error(error.response?.data?.message || 'Lỗi khi xuất file Excel');
		}
	},

	// Create direct sale order (admin)
	createDirectOrder: async (orderData) => {
		try {
			const response = await api.post('/admin/orders/direct', orderData);
			return response.data;
		} catch (error) {
			console.error('API Error - createDirectOrder:', error.response?.data || error.message);
			throw error;
		}
	}
};

// Seller Services
export const sellerService = {
	// Check if seller is logged in
	isLoggedIn: async () => {
		try {
			const { data: session } = await authClient.getSession();
			return session && session.user && (session.user.role === 'seller' || session.user.role === 'admin');
		} catch (error) {
			return false;
		}
	},

	// Seller logout
	logout: async () => {
		try {
			await authClient.signOut();
			return { success: true };
		} catch (error) {
			console.error('Logout error:', error);
			throw error;
		}
	},

	// Get dashboard statistics
	getDashboardStats: async () => {
		try {
			const response = await api.get('/seller/dashboard/stats');
			return response.data;
		} catch (error) {
			throw new Error(error.response?.data?.message || 'Lỗi khi lấy thống kê');
		}
	},

	// Get all orders (seller)
	getOrders: async (params = {}) => {
		try {
			const response = await api.get('/seller/orders', { params });
			return response.data;
		} catch (error) {
			throw new Error(error.response?.data?.message || 'Lỗi khi lấy danh sách đơn hàng');
		}
	},

	// Get single order (seller)
	getOrder: async (id) => {
		try {
			const response = await api.get(`/seller/orders/${id}`);
			return response.data;
		} catch (error) {
			throw new Error(error.response?.data?.message || 'Lỗi khi lấy thông tin đơn hàng');
		}
	},

	// Update order status
	updateOrderStatus: async (id, updateData) => {
		try {
			const response = await api.put(`/seller/orders/${id}/status`, updateData);
			return response.data;
		} catch (error) {
			throw new Error(error.response?.data?.message || 'Lỗi khi cập nhật đơn hàng');
		}
	},

	// Create direct sale order
	createDirectOrder: async (orderData) => {
		try {
			const response = await api.post('/seller/orders/direct', orderData);
			return response.data;
		} catch (error) {
			throw new Error(error.response?.data?.message || 'Lỗi khi tạo đơn hàng trực tiếp');
		}
	}
};

// Utility function to format currency
export const formatCurrency = (amount) => {
	return new Intl.NumberFormat('vi-VN', {
		style: 'currency',
		currency: 'VND'
	}).format(amount);
};

// Utility function to format date
export const formatDate = (date) => {
	return new Intl.DateTimeFormat('vi-VN', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit'
	}).format(new Date(date));
};

// Status text mapping
export const getStatusText = (status) => {
	const statusMap = {
		'confirmed': 'Đã xác nhận',
		'paid': 'Đã thanh toán',
		'delivered': 'Đã giao hàng',
		'cancelled': 'Đã hủy'
	};
	return statusMap[status] || status;
};

// Status color mapping
export const getStatusColor = (status) => {
	const colorMap = {
		'confirmed': 'bg-primary-100 text-primary-800',
		'paid': 'bg-warning-100 text-warning-800',
		'delivered': 'bg-success-100 text-success-800',
		'cancelled': 'bg-danger-100 text-danger-800'
	};
	return colorMap[status] || 'bg-gray-100 text-gray-800';
};

export default api;
