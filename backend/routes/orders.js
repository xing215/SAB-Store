const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { validateOrder } = require('../middleware/validation');
const { generateOrderCode, calculateTotal } = require('../utils/helpers');
const { sendOrderConfirmationEmail } = require('../utils/emailService');
const router = express.Router();

/**
 * @route   POST /api/orders
 * @desc    Create a new order
 * @access  Public
 */
router.post('/', validateOrder, async (req, res) => {
  try {
    const { studentId, fullName, email, additionalNote, items } = req.body;
    
    // Validate products exist and get current prices
    const productIds = items.map(item => item.productId);
    const products = await Product.find({ 
      _id: { $in: productIds },
      available: true 
    });
    
    if (products.length !== items.length) {
      return res.status(400).json({
        success: false,
        message: 'Một hoặc nhiều sản phẩm không tồn tại hoặc không khả dụng'
      });
    }
    
    // Build order items with current product information
    const orderItems = items.map(item => {
      const product = products.find(p => p._id.toString() === item.productId);
      return {
        productId: product._id,
        productName: product.name,
        price: product.price, // Use current price from database
        quantity: item.quantity
      };
    });
    
    // Calculate total amount
    const totalAmount = calculateTotal(orderItems);
    
    // Generate unique order code
    let orderCode;
    let isUnique = false;
    let attempts = 0;
    
    while (!isUnique && attempts < 10) {
      orderCode = generateOrderCode();
      const existingOrder = await Order.findOne({ orderCode });
      if (!existingOrder) {
        isUnique = true;
      }
      attempts++;
    }
    
    if (!isUnique) {
      return res.status(500).json({
        success: false,
        message: 'Không thể tạo mã đơn hàng duy nhất'
      });
    }
    
    // Create order
    const order = new Order({
      orderCode,
      studentId,
      fullName,
      email,
      additionalNote,
      items: orderItems,
      totalAmount,
      status: 'confirmed',
      lastUpdatedBy: 'system',
      statusHistory: [
        {
          status: 'confirmed',
          updatedBy: 'system',
          updatedAt: new Date(),
          note: 'Đơn hàng được tạo từ hệ thống'
        }
      ]
    });
    
    await order.save();
    
    // Send confirmation email (non-blocking)
    sendOrderConfirmationEmail(order).catch(error => {
      console.error('Email sending failed:', error);
    });
    
    res.status(201).json({
      success: true,
      message: 'Đơn hàng đã được tạo thành công',
      data: {
        orderCode,
        totalAmount,
        status: 'confirmed',
        createdAt: order.createdAt
      }
    });
    
  } catch (error) {
    console.error('Error creating order:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu đơn hàng không hợp lệ',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo đơn hàng'
    });
  }
});

/**
 * @route   GET /api/orders/:orderCode
 * @desc    Get order by order code (for customer tracking)
 * @access  Public
 */
router.get('/:orderCode', async (req, res) => {
  try {
    const { orderCode } = req.params;
    
    const order = await Order.findOne({ 
      orderCode: orderCode.toUpperCase() 
    }).populate('items.productId', 'name description');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng với mã này'
      });
    }
    
    // Return order information including payment details
    res.json({
      success: true,
      data: {
        orderCode: order.orderCode,
        studentId: order.studentId,
        fullName: order.fullName,
        status: order.status,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
        statusUpdatedAt: order.statusUpdatedAt,
        items: order.items.map(item => ({
          productName: item.productName,
          quantity: item.quantity,
          price: item.price
        }))
      }
    });
    
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin đơn hàng'
    });
  }
});

module.exports = router;
