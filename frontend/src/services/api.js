import axios from 'axios';

// API Base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Check for admin token first, then seller token
    const adminToken = localStorage.getItem('admin_token');
    const sellerToken = localStorage.getItem('sellerToken');
    
    if (adminToken && config.url.includes('/admin/')) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    } else if (sellerToken && config.url.includes('/seller/')) {
      config.headers.Authorization = `Bearer ${sellerToken}`;
    } else if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    } else if (sellerToken) {
      config.headers.Authorization = `Bearer ${sellerToken}`;
    }
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
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      if (error.config.url.includes('/admin/')) {
        localStorage.removeItem('admin_token');
        if (window.location.pathname.startsWith('/admin') || window.location.pathname === '/dashboard') {
          window.location.href = '/admin/login';
        }
      } else if (error.config.url.includes('/seller/')) {
        localStorage.removeItem('sellerToken');
        if (window.location.pathname.startsWith('/seller')) {
          window.location.href = '/seller/login';
        }
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
  // Admin login
  login: async (credentials) => {
    try {
      const response = await api.post('/admin/login', credentials);
      if (response.data.success && response.data.data.token) {
        localStorage.setItem('admin_token', response.data.data.token);
      }
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi đăng nhập');
    }
  },

  // Admin logout
  logout: () => {
    localStorage.removeItem('admin_token');
  },

  // Check if admin is logged in
  isLoggedIn: () => {
    return !!localStorage.getItem('admin_token');
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
      const response = await api.put(`/admin/orders/${id}`, updateData);
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

  // Seller management
  getSellers: async () => {
    try {
      const response = await api.get('/admin/sellers');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi lấy danh sách seller');
    }
  },

  createSeller: async (sellerData) => {
    try {
      const response = await api.post('/admin/sellers', sellerData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi tạo seller');
    }
  },

  updateSeller: async (id, sellerData) => {
    try {
      const response = await api.put(`/admin/sellers/${id}`, sellerData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi cập nhật seller');
    }
  },

  deleteSeller: async (id) => {
    try {
      const response = await api.delete(`/admin/sellers/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi xóa seller');
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
  }
};

// Seller Services
export const sellerService = {
  // Seller login
  login: async (credentials) => {
    try {
      const response = await api.post('/seller/login', credentials);
      if (response.data.success && response.data.data.token) {
        localStorage.setItem('sellerToken', response.data.data.token);
        // Save seller info for later use
        if (response.data.data.seller) {
          localStorage.setItem('sellerInfo', JSON.stringify({
            username: response.data.data.seller.username,
            fullName: response.data.data.seller.fullName
          }));
        }
      }
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi đăng nhập');
    }
  },

  // Seller logout
  logout: () => {
    localStorage.removeItem('sellerToken');
    localStorage.removeItem('sellerInfo');
  },

  // Check if seller is logged in
  isLoggedIn: () => {
    return !!localStorage.getItem('sellerToken');
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
      const response = await api.put(`/seller/orders/${id}`, updateData);
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
