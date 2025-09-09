const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { validateOrder } = require('../middleware/validation');
const { generateOrderCode, calculateTotal } = require('../utils/helpers');
const { sendOrderToAppScript } = require('../utils/appscript');
const ComboService = require('../services/ComboService');
const router = express.Router();

/**
 * @route   POST /api/orders
 * @desc    Create a new order
 * @access  Public
 */
router.post('/', validateOrder, async (req, res) => {
	try {
		console.log('📝 Order creation started:', {
			timestamp: new Date().toISOString(),
			body: { ...req.body, items: req.body.items?.length ? `${req.body.items.length} items` : 'no items' }
		});

		const { studentId, fullName, email, phoneNumber, additionalNote, items, optimalPricing, useOptimalPricing = false } = req.body;

		if (!items || !Array.isArray(items) || items.length === 0) {
			console.error('❌ Invalid items in request');
			return res.status(400).json({
				success: false,
				message: 'Danh sách sản phẩm không hợp lệ'
			});
		}

		console.log('🔍 Processing items:', items.map(item => ({ productId: item.productId, quantity: item.quantity })));

		let totalAmount;
		let comboInfo = null;
		let orderItems = [];

		if (useOptimalPricing && optimalPricing) {
			console.log('💎 Using optimal pricing from frontend');
			
			// Validate products exist
			const productIds = items.map(item => item.productId);
			const products = await Product.find({
				_id: { $in: productIds },
				available: true
			});

			if (products.length !== productIds.length) {
				console.error('❌ Product validation failed');
				return res.status(400).json({
					success: false,
					message: 'Một hoặc nhiều sản phẩm không tồn tại hoặc không khả dụng'
				});
			}

			// Use the calculated optimal pricing
			totalAmount = optimalPricing.summary.finalTotal;
			
			// Create order items with optimal pricing information
			orderItems = items.map(item => {
				const product = products.find(p => p._id.toString() === item.productId);
				return {
					productId: product._id,
					productName: product.name,
					price: product.price, // Keep original price for reference
					quantity: item.quantity,
					fromCombo: false // Individual items in cart
				};
			});

			// Add combo information if savings exist
			if (optimalPricing.summary.totalSavings > 0) {
				comboInfo = {
					savings: optimalPricing.summary.totalSavings,
					originalTotal: optimalPricing.summary.originalTotal,
					finalTotal: optimalPricing.summary.finalTotal,
					combos: optimalPricing.combos || [],
					breakdown: optimalPricing.breakdown || []
				};
			}

			console.log('✅ Using optimal pricing:', {
				originalTotal: optimalPricing.summary.originalTotal,
				finalTotal: totalAmount,
				savings: optimalPricing.summary.totalSavings
			});

		} else {
			console.log('🔄 Using traditional combo detection');
			// Original combo detection logic as fallback
			let finalItems = items;

			console.log('🎯 Applying combo detection...');
			const comboResult = await ComboService.detectAndApplyBestCombo(items, false);
			if (comboResult.success && comboResult.hasCombo) {
				finalItems = comboResult.finalItems;
				comboInfo = {
					comboId: comboResult.combo._id,
					comboName: comboResult.combo.name,
					savings: comboResult.savings,
					message: comboResult.message
				};
			}

			console.log('🔄 Converting combo items to individual products...');
			const expandedItems = ComboService.expandComboItems(finalItems);

			console.log('🔍 Validating products in database...');
			const productIds = expandedItems.map(item => item.productId).filter(id => id);
			const products = await Product.find({
				_id: { $in: productIds },
				available: true
			});

			if (products.length !== productIds.length) {
				console.error('❌ Product validation failed');
				return res.status(400).json({
					success: false,
					message: 'Một hoặc nhiều sản phẩm không tồn tại hoặc không khả dụng'
				});
			}

			console.log('💰 Building order items with pricing...');
			orderItems = expandedItems.map(item => {
				const product = products.find(p => p._id.toString() === item.productId);
				return {
					productId: product._id,
					productName: product.name,
					price: product.price,
					quantity: item.quantity,
					fromCombo: item.fromCombo || false,
					comboId: item.comboId || null,
					comboName: item.comboName || null
				};
			});

			console.log('📊 Calculating total amount...');
			if (comboInfo && finalItems.some(item => item.isCombo)) {
				totalAmount = finalItems.reduce((total, item) => {
					return total + (item.price * item.quantity);
				}, 0);
				console.log('💝 Total with combo pricing:', totalAmount);
			} else {
				totalAmount = calculateTotal(orderItems);
				console.log('💰 Total with individual pricing:', totalAmount);
			}
		}

		console.log('🏷️ Generating unique order code...');
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
			console.error('❌ Failed to generate unique order code after 10 attempts');
			return res.status(500).json({
				success: false,
				message: 'Không thể tạo mã đơn hàng duy nhất'
			});
		}

		console.log('✅ Generated order code:', orderCode);

		console.log('💾 Creating order in database...');
		// Create order
		const order = new Order({
			orderCode,
			studentId,
			fullName,
			email,
			phoneNumber,
			additionalNote,
			items: orderItems,
			totalAmount,
			status: 'confirmed',
			lastUpdatedBy: 'system',
			comboInfo: comboInfo, // Store combo information
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
		console.log('✅ Order saved successfully:', order._id);

		// Log dữ liệu gửi App Script
		const appscriptData = {
			orderCode,
			studentId,
			fullName,
			email,
			phoneNumber,
			additionalNote,
			items: orderItems,
			totalAmount
		};
		console.log('Push to AppScript:', appscriptData);
		// Gửi lên App Script sau, không chờ kết quả
		setImmediate(() => {
			sendOrderToAppScript(appscriptData).catch(err => {
				console.error('Gửi đơn hàng lên App Script thất bại:', err.message);
			});
		});

		res.status(201).json({
			success: true,
			message: 'Đơn hàng đã được tạo thành công',
			data: {
				orderCode,
				totalAmount,
				status: 'confirmed',
				createdAt: order.createdAt,
				comboInfo: comboInfo // Include combo information in response
			}
		});

	} catch (error) {
		console.error('💥 Error creating order:', {
			error: error.message,
			stack: error.stack,
			timestamp: new Date().toISOString()
		});

		// More specific error handling
		if (error.name === 'ValidationError') {
			console.error('❌ Validation error details:', error.errors);
			return res.status(400).json({
				success: false,
				message: 'Dữ liệu đơn hàng không hợp lệ',
				errors: Object.values(error.errors).map(err => err.message)
			});
		}

		if (error.name === 'MongoError' || error.name === 'MongoServerError') {
			console.error('❌ Database error:', error.message);
			return res.status(500).json({
				success: false,
				message: 'Lỗi cơ sở dữ liệu'
			});
		}

		res.status(500).json({
			success: false,
			message: 'Lỗi server khi tạo đơn hàng',
			...(process.env.NODE_ENV === 'development' && { debug: error.message })
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
