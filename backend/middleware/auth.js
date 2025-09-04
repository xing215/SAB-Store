const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const User = require('../models/User');

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
 * Authentication middleware for seller routes
 */
const authenticateSeller = async (req, res, next) => {
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
    
    // Find seller user
    const seller = await User.findById(decoded.sellerId).select('-password');
    
    if (!seller || seller.role !== 'seller') {
      return res.status(401).json({ 
        message: 'Token không hợp lệ, seller không tồn tại' 
      });
    }

    if (!seller.isActive) {
      return res.status(401).json({ 
        message: 'Tài khoản seller đã bị vô hiệu hóa' 
      });
    }

    // Add seller to request
    req.seller = seller;
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

    console.error('Seller auth middleware error:', error);
    res.status(500).json({ 
      message: 'Lỗi server khi xác thực seller' 
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

/**
 * Generate JWT token for seller
 * @param {Object} seller - Seller object
 * @returns {string} JWT token
 */
const generateSellerToken = (seller) => {
  return jwt.sign(
    { 
      sellerId: seller._id,
      username: seller.username,
      role: seller.role
    },
    process.env.JWT_SECRET,
    { 
      expiresIn: '24h' // Token expires in 24 hours
    }
  );
};

module.exports = {
  authenticateAdmin,
  authenticateSeller,
  generateAdminToken,
  generateSellerToken
};
