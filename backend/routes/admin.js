const express = require('express');
const ExcelJS = require('exceljs');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Admin = require('../models/Admin');
const User = require('../models/User');
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
 * @route   GET /api/admin/dashboard/stats
 * @desc    Get dashboard statistics
 * @access  Private (Admin)
 */
router.get('/dashboard/stats', authenticateAdmin, async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Orders statistics
    const [
      totalOrders,
      todayOrders,
      weekOrders,
      monthOrders,
      deliveredOrders,
      totalRevenue,
      productStats
    ] = await Promise.all([
      // Total orders
      Order.countDocuments(),
      
      // Today's orders
      Order.countDocuments({ createdAt: { $gte: startOfToday } }),
      
      // This week's orders
      Order.countDocuments({ createdAt: { $gte: startOfWeek } }),
      
      // This month's orders
      Order.countDocuments({ createdAt: { $gte: startOfMonth } }),
      
      // Delivered orders (for revenue calculation)
      Order.find({ status: { $in: ['delivered', 'paid'] } }),
      
      // Total revenue from delivered/paid orders
      Order.aggregate([
        { $match: { status: { $in: ['delivered', 'paid'] } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      
      // Product statistics from orders
      Order.aggregate([
        { $unwind: '$items' },
        { $group: {
          _id: {
            productId: '$items.productId',
            productName: '$items.productName'
          },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }},
        { $sort: { totalQuantity: -1 } },
        { $limit: 10 }
      ])
    ]);

    // Get all products for complete statistics
    const allProducts = await Product.find({}, 'name category available');
    
    // Calculate product statistics
    const productsByCategory = allProducts.reduce((acc, product) => {
      acc[product.category] = (acc[product.category] || 0) + 1;
      return acc;
    }, {});

    const availableProducts = allProducts.filter(p => p.available).length;
    const unavailableProducts = allProducts.filter(p => !p.available).length;

    res.json({
      success: true,
      data: {
        orders: {
          total: totalOrders,
          today: todayOrders,
          week: weekOrders,
          month: monthOrders
        },
        revenue: totalRevenue[0]?.total || 0,
        products: {
          total: allProducts.length,
          available: availableProducts,
          unavailable: unavailableProducts,
          byCategory: productsByCategory,
          topSelling: productStats.map(item => ({
            productId: item._id.productId,
            productName: item._id.productName,
            totalQuantity: item.totalQuantity,
            totalRevenue: item.totalRevenue
          }))
        }
      }
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
    const { status, transactionCode, cancelReason, note } = req.body;
    
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    // Admin có thể thay đổi trạng thái bất kỳ - không có ràng buộc flow
    // Record who made the change
    order.lastUpdatedBy = req.admin.username; // Get username from authenticated admin
    
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
    
    // Create workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Đơn hàng');
    
    // Define columns
    worksheet.columns = [
      { header: 'Mã đơn hàng', key: 'orderCode', width: 15 },
      { header: 'Mã số sinh viên', key: 'studentId', width: 20 },
      { header: 'Họ tên', key: 'fullName', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Tổng tiền', key: 'totalAmount', width: 15 },
      { header: 'Trạng thái', key: 'status', width: 15 },
      { header: 'Ngày đặt', key: 'createdAt', width: 20 },
      { header: 'Ngày cập nhật', key: 'statusUpdatedAt', width: 20 },
      { header: 'Mã giao dịch', key: 'transactionCode', width: 15 },
      { header: 'Lý do hủy', key: 'cancelReason', width: 30 },
      { header: 'Ghi chú', key: 'additionalNote', width: 30 },
      { header: 'Chi tiết sản phẩm', key: 'itemDetails', width: 50 }
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE3F2FD' }
    };

    // Add data
    orders.forEach(order => {
      worksheet.addRow({
        orderCode: order.orderCode,
        studentId: order.studentId,
        fullName: order.fullName,
        email: order.email,
        totalAmount: order.totalAmount,
        status: getStatusText(order.status),
        createdAt: formatDate(order.createdAt),
        statusUpdatedAt: formatDate(order.statusUpdatedAt),
        transactionCode: order.transactionCode || '',
        cancelReason: order.cancelReason || '',
        additionalNote: order.additionalNote || '',
        itemDetails: order.items.map(item => 
          `${item.productName} x${item.quantity} (${formatCurrency(item.price)})`
        ).join('; ')
      });
    });
    
    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    
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

/**
 * @route   GET /api/admin/products
 * @desc    Get all products for admin management
 * @access  Private (Admin)
 */
router.get('/products', authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', category = '', status = '' } = req.query;
    
    // Build filter
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (category) {
      filter.category = category;
    }
    if (status !== '') {
      filter.isActive = status === 'active';
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 }
    };

    const products = await Product.paginate(filter, options);

    res.json({
      success: true,
      data: {
        products: products.docs,
        pagination: {
          page: products.page,
          pages: products.totalPages,
          total: products.totalDocs,
          limit: products.limit
        }
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách sản phẩm'
    });
  }
});

/**
 * @route   POST /api/admin/products
 * @desc    Create new product
 * @access  Private (Admin)
 */
router.post('/products', authenticateAdmin, async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      imageUrl,
      isActive,
      stockQuantity,
      minOrderQuantity
    } = req.body;

    // Validate required fields
    if (!name || !price || !category) {
      return res.status(400).json({
        success: false,
        message: 'Tên, giá và danh mục sản phẩm là bắt buộc'
      });
    }

    const product = new Product({
      name,
      description,
      price,
      category,
      imageUrl,
      isActive: isActive !== undefined ? isActive : true,
      stockQuantity: stockQuantity || 0,
      minOrderQuantity: minOrderQuantity || 1
    });

    await product.save();

    res.status(201).json({
      success: true,
      message: 'Tạo sản phẩm thành công',
      data: { product }
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo sản phẩm'
    });
  }
});

/**
 * @route   PUT /api/admin/products/:id
 * @desc    Update product
 * @access  Private (Admin)
 */
router.put('/products/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const product = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }

    res.json({
      success: true,
      message: 'Cập nhật sản phẩm thành công',
      data: { product }
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật sản phẩm'
    });
  }
});

/**
 * @route   DELETE /api/admin/products/:id
 * @desc    Delete product
 * @access  Private (Admin)
 */
router.delete('/products/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }

    res.json({
      success: true,
      message: 'Xóa sản phẩm thành công'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa sản phẩm'
    });
  }
});

/**
 * @route   GET /api/admin/sellers
 * @desc    Get all sellers for admin management
 * @access  Private (Admin)
 */
router.get('/sellers', authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '' } = req.query;
    
    // Build filter for sellers (users with role seller)
    const filter = { role: 'seller' };
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (status !== '') {
      filter.isActive = status === 'active';
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      select: '-password' // Exclude password from results
    };

    const sellers = await User.paginate(filter, options);

    res.json({
      success: true,
      data: {
        sellers: sellers.docs,
        pagination: {
          page: sellers.page,
          pages: sellers.totalPages,
          total: sellers.totalDocs,
          limit: sellers.limit
        }
      }
    });
  } catch (error) {
    console.error('Get sellers error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách seller'
    });
  }
});

/**
 * @route   POST /api/admin/sellers
 * @desc    Create new seller account
 * @access  Private (Admin)
 */
router.post('/sellers', authenticateAdmin, async (req, res) => {
  try {
    const { username, email, password, isActive } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email và password là bắt buộc'
      });
    }

    // Check if username or email already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username hoặc email đã tồn tại'
      });
    }

    const seller = new User({
      username,
      email,
      password,
      role: 'seller',
      isActive: isActive !== undefined ? isActive : true
    });

    await seller.save();

    // Remove password from response
    const sellerResponse = seller.toObject();
    delete sellerResponse.password;

    res.status(201).json({
      success: true,
      message: 'Tạo tài khoản seller thành công',
      data: { seller: sellerResponse }
    });
  } catch (error) {
    console.error('Create seller error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo tài khoản seller'
    });
  }
});

/**
 * @route   PUT /api/admin/sellers/:id
 * @desc    Update seller account
 * @access  Private (Admin)
 */
router.put('/sellers/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Remove password from update data if not provided or empty
    if (!updateData.password) {
      delete updateData.password;
    }

    const seller = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true, select: '-password' }
    );

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy seller'
      });
    }

    res.json({
      success: true,
      message: 'Cập nhật seller thành công',
      data: { seller }
    });
  } catch (error) {
    console.error('Update seller error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật seller'
    });
  }
});

/**
 * @route   DELETE /api/admin/sellers/:id
 * @desc    Delete seller account
 * @access  Private (Admin)
 */
router.delete('/sellers/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const seller = await User.findByIdAndDelete(id);

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy seller'
      });
    }

    res.json({
      success: true,
      message: 'Xóa seller thành công'
    });
  } catch (error) {
    console.error('Delete seller error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa seller'
    });
  }
});

module.exports = router;
