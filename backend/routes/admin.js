const express = require('express');
const xlsx = require('xlsx');
const Order = require('../models/Order');
const Admin = require('../models/Admin');
const { authenticateAdmin, generateAdminToken } = require('../middleware/auth');
const { validateAdminLogin, validateOrderUpdate } = require('../middleware/validation');
const { getPaginationInfo, formatDate, formatCurrency } = require('../utils/helpers');
const router = express.Router();

/**
 * @route   POST /api/admin/login
 * @desc    Admin login
 * @access  Public
 */
router.post('/login', validateAdminLogin, async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find admin by username
    const admin = await Admin.findOne({ username, isActive: true });
    
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Tên đăng nhập hoặc mật khẩu không đúng'
      });
    }
    
    // Check password
    const isValidPassword = await admin.comparePassword(password);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Tên đăng nhập hoặc mật khẩu không đúng'
      });
    }
    
    // Update last login
    await admin.updateLastLogin();
    
    // Generate token
    const token = generateAdminToken(admin);
    
    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        token,
        admin: {
          id: admin._id,
          username: admin.username,
          lastLogin: admin.lastLogin
        }
      }
    });
    
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đăng nhập'
    });
  }
});

/**
 * @route   GET /api/admin/orders
 * @desc    Get all orders with pagination and search
 * @access  Private (Admin)
 */
router.get('/orders', authenticateAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      status = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    // Build search query
    let query = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (search.trim()) {
      query.$or = [
        { orderCode: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    // Get orders with pagination
    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Order.countDocuments(query)
    ]);
    
    // Get pagination info
    const pagination = getPaginationInfo(pageNum, limitNum, total);
    
    res.json({
      success: true,
      data: {
        orders,
        pagination
      }
    });
    
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách đơn hàng'
    });
  }
});

/**
 * @route   GET /api/admin/orders/:id
 * @desc    Get single order by ID
 * @access  Private (Admin)
 */
router.get('/orders/:id', authenticateAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }
    
    res.json({
      success: true,
      data: order
    });
    
  } catch (error) {
    console.error('Error fetching order:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID đơn hàng không hợp lệ'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin đơn hàng'
    });
  }
});

/**
 * @route   PUT /api/admin/orders/:id
 * @desc    Update order status
 * @access  Private (Admin)
 */
router.put('/orders/:id', authenticateAdmin, validateOrderUpdate, async (req, res) => {
  try {
    const { status, transactionCode, cancelReason } = req.body;
    
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }
    
    // Validate status transitions
    const validTransitions = {
      'confirmed': ['paid', 'cancelled'],
      'paid': ['delivered', 'cancelled'],
      'delivered': [], // Final state
      'cancelled': [] // Final state
    };
    
    if (!validTransitions[order.status].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Không thể chuyển từ trạng thái "${order.status}" sang "${status}"`
      });
    }
    
    // Update order
    order.status = status;
    order.statusUpdatedAt = new Date();
    
    // Handle specific status requirements
    if (status === 'paid') {
      if (!transactionCode) {
        return res.status(400).json({
          success: false,
          message: 'Mã giao dịch là bắt buộc khi cập nhật trạng thái "Đã thanh toán"'
        });
      }
      order.transactionCode = transactionCode;
    }
    
    if (status === 'cancelled') {
      if (!cancelReason) {
        return res.status(400).json({
          success: false,
          message: 'Lý do hủy là bắt buộc khi hủy đơn hàng'
        });
      }
      order.cancelReason = cancelReason;
    }
    
    await order.save();
    
    res.json({
      success: true,
      message: 'Cập nhật trạng thái đơn hàng thành công',
      data: order
    });
    
  } catch (error) {
    console.error('Error updating order:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID đơn hàng không hợp lệ'
      });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu cập nhật không hợp lệ',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật đơn hàng'
    });
  }
});

/**
 * @route   GET /api/admin/orders/export/excel
 * @desc    Export orders to Excel
 * @access  Private (Admin)
 */
router.get('/orders/export/excel', authenticateAdmin, async (req, res) => {
  try {
    const { status, search, startDate, endDate } = req.query;
    
    // Build query
    let query = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { orderCode: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    // Get orders
    const orders = await Order.find(query).sort({ createdAt: -1 }).lean();
    
    // Prepare data for Excel
    const excelData = orders.map(order => ({
      'Mã đơn hàng': order.orderCode,
      'Mã số sinh viên': order.studentId,
      'Họ tên': order.fullName,
      'Email': order.email,
      'Tổng tiền': formatCurrency(order.totalAmount),
      'Trạng thái': getStatusText(order.status),
      'Ngày đặt': formatDate(order.createdAt),
      'Ngày cập nhật': formatDate(order.statusUpdatedAt),
      'Mã giao dịch': order.transactionCode || '',
      'Lý do hủy': order.cancelReason || '',
      'Ghi chú': order.additionalNote || '',
      'Chi tiết sản phẩm': order.items.map(item => 
        `${item.productName} x${item.quantity} (${formatCurrency(item.price)})`
      ).join('; ')
    }));
    
    // Create workbook
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(excelData);
    
    // Auto-fit columns
    const colWidths = [
      { wch: 12 }, // Mã đơn hàng
      { wch: 15 }, // Mã số sinh viên
      { wch: 25 }, // Họ tên
      { wch: 30 }, // Email
      { wch: 15 }, // Tổng tiền
      { wch: 12 }, // Trạng thái
      { wch: 20 }, // Ngày đặt
      { wch: 20 }, // Ngày cập nhật
      { wch: 15 }, // Mã giao dịch
      { wch: 30 }, // Lý do hủy
      { wch: 30 }, // Ghi chú
      { wch: 50 }  // Chi tiết sản phẩm
    ];
    ws['!cols'] = colWidths;
    
    xlsx.utils.book_append_sheet(wb, ws, 'Đơn hàng');
    
    // Generate buffer
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    // Set headers for file download
    const filename = `don-hang-${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    
    res.send(buffer);
    
  } catch (error) {
    console.error('Error exporting orders:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xuất file Excel'
    });
  }
});

/**
 * @route   GET /api/admin/dashboard/stats
 * @desc    Get dashboard statistics
 * @access  Private (Admin)
 */
router.get('/dashboard/stats', authenticateAdmin, async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const [
      totalOrders,
      todayOrders,
      weekOrders,
      monthOrders,
      statusStats,
      revenueStats
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: startOfDay } }),
      Order.countDocuments({ createdAt: { $gte: startOfWeek } }),
      Order.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Order.aggregate([
        { $match: { status: { $in: ['paid', 'delivered'] } } },
        { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
      ])
    ]);
    
    const stats = {
      orders: {
        total: totalOrders,
        today: todayOrders,
        week: weekOrders,
        month: monthOrders
      },
      status: statusStats.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      revenue: revenueStats[0]?.totalRevenue || 0
    };
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê dashboard'
    });
  }
});

/**
 * Helper function to get status text in Vietnamese
 */
function getStatusText(status) {
  const statusMap = {
    'confirmed': 'Đã xác nhận',
    'paid': 'Đã thanh toán',
    'delivered': 'Đã giao hàng',
    'cancelled': 'Đã hủy'
  };
  return statusMap[status] || status;
}

module.exports = router;
