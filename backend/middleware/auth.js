const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

/**
 * Authentication middleware for admin routes
 */
const authenticateAdmin = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: 'Không có token xác thực, truy cập bị từ chối' 
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find admin user
    const admin = await Admin.findById(decoded.adminId).select('-password');
    
    if (!admin) {
      return res.status(401).json({ 
        message: 'Token không hợp lệ, admin không tồn tại' 
      });
    }

    if (!admin.isActive) {
      return res.status(401).json({ 
        message: 'Tài khoản admin đã bị vô hiệu hóa' 
      });
    }

    // Add admin to request
    req.admin = admin;
    next();
    
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Token không hợp lệ' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token đã hết hạn' 
      });
    }

    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      message: 'Lỗi server khi xác thực' 
    });
  }
};

/**
 * Generate JWT token for admin
 * @param {Object} admin - Admin object
 * @returns {string} JWT token
 */
const generateAdminToken = (admin) => {
  return jwt.sign(
    { 
      adminId: admin._id,
      username: admin.username 
    },
    process.env.JWT_SECRET,
    { 
      expiresIn: '24h' // Token expires in 24 hours
    }
  );
};

module.exports = {
  authenticateAdmin,
  generateAdminToken
};
