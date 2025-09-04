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
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
      localStorage.removeItem('admin_token');
      if (window.location.pathname.startsWith('/admin') || window.location.pathname === '/dashboard') {
        window.location.href = '/admin/login';
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
  updateOrder: async (id, updateData) => {
    try {
      const response = await api.put(`/admin/orders/${id}`, updateData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi cập nhật đơn hàng');
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
