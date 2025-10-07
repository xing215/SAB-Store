const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { authenticateSeller } = require('../middleware/better-auth');
const { validatePasswordChange } = require('../middleware/validation');
const { getPaginationInfo, formatDate, formatCurrency } = require('../utils/helpers');
const { sendOrderToAppScript } = require('../utils/appscript');
const ComboService = require('../services/ComboService');
const { auth } = require('../lib/auth');
const router = express.Router();

// Apply seller authentication to all routes
router.use(authenticateSeller);

/**
 * @route   POST /api/seller/change-password
 * @desc    Change seller password
 * @access  Private (Seller only)
 */
router.post('/change-password', validatePasswordChange, async (req, res) => {
	try {
		const { currentPassword, newPassword } = req.body;

		// Use Better Auth changePassword endpoint
		const result = await auth.api.changePassword({
			body: {
				currentPassword,
				newPassword,
				revokeOtherSessions: true
			},
			headers: req.headers
		});

		if (result.error) {
			return res.status(400).json({
				success: false,
				message: result.error.message || 'Không thể đổi mật khẩu'
			});
		}

		res.json({
			success: true,
			message: 'Đổi mật khẩu thành công'
		});

	} catch (error) {
		console.error('Error changing seller password:', error);
		res.status(500).json({
			success: false,
			message: 'Lỗi server khi đổi mật khẩu'
		});
	}
});

/**
 * @route   GET /api/seller/dashboard/stats
 * @desc    Get seller dashboard statistics
 * @access  Private (Seller)
 */
router.get('/dashboard/stats', async (req, res) => {
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

			// Delivered orders
			Order.countDocuments({ status: 'delivered' }),

			// Total revenue (from delivered orders)
			Order.aggregate([
				{ $match: { status: 'delivered' } },
				{ $group: { _id: null, total: { $sum: '$totalAmount' } } }
			]),

			// Product statistics
			Product.aggregate([
				{
					$group: {
						_id: null,
						totalProducts: { $sum: 1 },
						activeProducts: {
							$sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
						},
						totalStock: { $sum: '$stockQuantity' }
					}
				}
			])
		]);

		// Get recent orders
		const recentOrders = await Order.find()
			.populate('items.productId', 'name imageUrl')
			.sort({ createdAt: -1 })
			.limit(5)
			.lean();

		// Order status distribution
		const statusDistribution = await Order.aggregate([
			{
				$group: {
					_id: '$status',
					count: { $sum: 1 }
				}
			}
		]);

		res.json({
			success: true,
			data: {
				overview: {
					totalOrders,
					todayOrders,
					weekOrders,
					monthOrders,
					deliveredOrders,
					totalRevenue: totalRevenue[0]?.total || 0,
					deliveryRate: totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0
				},
				products: {
					total: productStats[0]?.totalProducts || 0,
					active: productStats[0]?.activeProducts || 0,
					totalStock: productStats[0]?.totalStock || 0
				},
				recentOrders: recentOrders.map(order => ({
					...order,
					statusText: getStatusInVietnamese(order.status),
					formattedDate: formatDate(order.createdAt),
					formattedTotal: formatCurrency(order.totalAmount)
				})),
				statusDistribution: statusDistribution.map(item => ({
					status: item._id,
					statusText: getStatusInVietnamese(item._id),
					count: item.count
				}))
			}
		});

	} catch (error) {
		console.error('Seller dashboard stats error:', error);
		res.status(500).json({
			success: false,
			message: 'Lỗi server khi lấy thống kê dashboard'
		});
	}
});

/**
 * @route   GET /api/seller/orders
 * @desc    Get orders for seller management
 * @access  Private (Seller)
 */
router.get('/orders', async (req, res) => {
	try {
		const {
			page = 1,
			limit = 10,
			status = '',
			search = '',
			startDate = '',
			endDate = '',
			sortBy = 'createdAt',
			sortOrder = 'desc'
		} = req.query;

		// Build filter
		const filter = {};

		if (status) {
			filter.status = status;
		}

		if (search) {
			filter.$or = [
				{ orderNumber: { $regex: search, $options: 'i' } },
				{ orderCode: { $regex: search, $options: 'i' } },
				{ fullName: { $regex: search, $options: 'i' } },
				{ studentId: { $regex: search, $options: 'i' } },
				{ email: { $regex: search, $options: 'i' } }
			];
		}

		if (startDate || endDate) {
			filter.createdAt = {};
			if (startDate) {
				filter.createdAt.$gte = new Date(startDate);
			}
			if (endDate) {
				filter.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
			}
		}

		// Build sort
		const sort = {};
		sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

		const options = {
			page: parseInt(page),
			limit: parseInt(limit),
			sort,
			populate: [
				{
					path: 'items.productId',
					select: 'name imageUrl price category'
				}
			]
		};

		const result = await Order.paginate(filter, options);

		// Format orders for response
		const formattedOrders = result.docs.map(order => ({
			...order.toObject(),
			statusText: getStatusInVietnamese(order.status),
			formattedDate: formatDate(order.createdAt),
			formattedTotal: formatCurrency(order.totalAmount)
		}));

		res.json({
			success: true,
			data: {
				orders: formattedOrders,
				pagination: {
					page: result.page,
					pages: result.totalPages,
					total: result.totalDocs,
					limit: result.limit
				}
			}
		});

	} catch (error) {
		console.error('Get orders error:', error);
		res.status(500).json({
			success: false,
			message: 'Lỗi server khi lấy danh sách đơn hàng'
		});
	}
});

/**
 * @route   PUT /api/seller/orders/:id/status
 * @desc    Update order status
 * @access  Private (Seller)
 */
router.put('/orders/:id/status', async (req, res) => {
	try {
		const { id } = req.params;
		const { status, transactionCode, cancelReason, note } = req.body;

		// Validate status
		const validStatuses = ['pending', 'confirmed', 'paid', 'delivered', 'cancelled'];
		if (!validStatuses.includes(status)) {
			return res.status(400).json({
				success: false,
				message: 'Trạng thái đơn hàng không hợp lệ'
			});
		}

		// Build update object
		const updateData = {
			status,
			lastUpdatedBy: req.seller.username
		};

		// Add transaction code if provided
		if (transactionCode) {
			updateData.transactionCode = transactionCode;
		}

		// Add cancel reason if provided
		if (cancelReason) {
			updateData.cancelReason = cancelReason;
		}

		// Build status history entry
		const historyEntry = {
			status,
			updatedAt: new Date(),
			updatedBy: req.seller.username
		};

		// Add transaction code to history if provided
		if (transactionCode) {
			historyEntry.transactionCode = transactionCode;
		}

		// Add cancel reason to history if provided
		if (cancelReason) {
			historyEntry.cancelReason = cancelReason;
		}

		const order = await Order.findByIdAndUpdate(
			id,
			{
				...updateData,
				$push: {
					statusHistory: historyEntry
				}
			},
			{ new: true }
		).populate('items.productId', 'name imageUrl price');

		if (!order) {
			return res.status(404).json({
				success: false,
				message: 'Không tìm thấy đơn hàng'
			});
		}

		const appscriptData = {
			orderCode: order.orderCode,
			studentId: order.studentId,
			fullName: order.fullName,
			email: order.email,
			additionalNote: order.additionalNote,
			items: order.items,
			totalAmount: order.totalAmount,
			transactionCode: order.transactionCode,
			cancelReason: order.cancelReason,
			status: order.status
		};
		console.log('Push to AppScript:', appscriptData);
		setImmediate(() => {
			sendOrderToAppScript(appscriptData).catch(err => {
				console.error('Gửi đơn hàng lên App Script thất bại:', err.message);
			});
		});

		res.json({
			success: true,
			message: 'Cập nhật trạng thái đơn hàng thành công',
			data: {
				order: {
					...order.toObject(),
					statusText: getStatusInVietnamese(order.status),
					formattedDate: formatDate(order.createdAt),
					formattedTotal: formatCurrency(order.totalAmount)
				}
			}
		});

	} catch (error) {
		console.error('Update order status error:', error);
		res.status(500).json({
			success: false,
			message: 'Lỗi server khi cập nhật trạng thái đơn hàng'
		});
	}
});

/**
 * @route   GET /api/seller/orders/:id
 * @desc    Get order details
 * @access  Private (Seller)
 */
router.get('/orders/:id', async (req, res) => {
	try {
		const { id } = req.params;

		const order = await Order.findById(id)
			.populate('items.productId', 'name imageUrl price category')
			.lean();

		if (!order) {
			return res.status(404).json({
				success: false,
				message: 'Không tìm thấy đơn hàng'
			});
		}

		res.json({
			success: true,
			data: {
				order: {
					...order,
					statusText: getStatusInVietnamese(order.status),
					formattedDate: formatDate(order.createdAt),
					formattedTotal: formatCurrency(order.totalAmount)
				}
			}
		});

	} catch (error) {
		console.error('Get order details error:', error);
		res.status(500).json({
			success: false,
			message: 'Lỗi server khi lấy chi tiết đơn hàng'
		});
	}
});

/**
 * @route   POST /api/seller/orders/direct
 * @desc    Create direct sale order
 * @access  Private (Seller)
 */
router.post('/orders/direct', async (req, res) => {
	try {
		const { items, optimalPricing, useOptimalPricing = false } = req.body;

		if (!items || !Array.isArray(items) || items.length === 0) {
			return res.status(400).json({
				success: false,
				message: 'Danh sách sản phẩm không hợp lệ'
			});
		}

		let totalAmount;
		let comboInfo = null;
		let orderItems = [];

		if (useOptimalPricing && optimalPricing) {
			console.log('💎 Direct sales using optimal pricing from frontend');

			// Validate products exist
			const productIds = items.map(item => item.productId);
			const products = await Product.find({
				_id: { $in: productIds },
				isActive: true
			});

			if (products.length !== productIds.length) {
				return res.status(400).json({
					success: false,
					message: 'Một hoặc nhiều sản phẩm không khả dụng'
				});
			}

			// Check stock quantities
			for (const item of items) {
				const product = products.find(p => p._id.toString() === item.productId);
				if (product.stockQuantity < item.quantity) {
					return res.status(400).json({
						success: false,
						message: `Sản phẩm ${product.name} không đủ số lượng trong kho`
					});
				}
			}

			// Use the calculated optimal pricing
			totalAmount = optimalPricing.summary.finalTotal;

			// Create order items and update stock
			for (const item of items) {
				const product = products.find(p => p._id.toString() === item.productId);

				orderItems.push({
					productId: product._id,
					productName: product.name,
					quantity: item.quantity,
					price: product.price, // Keep original price for reference
					total: product.price * item.quantity,
					fromCombo: false
				});

				// Update stock quantity
				product.stockQuantity -= item.quantity;
				await product.save();
			}

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

		} else {
			console.log('🔄 Direct sales using traditional combo detection');
			// Apply combo detection silently for direct sales
			const comboResult = await ComboService.detectAndApplyBestCombo(items, true);
			let finalItems = items;

			if (comboResult.success && comboResult.hasCombo) {
				finalItems = comboResult.finalItems;
				comboInfo = {
					comboId: comboResult.combo._id,
					comboName: comboResult.combo.name,
					savings: comboResult.savings
				};
			}

			// Convert combo items back to individual products for order storage
			const expandedItems = ComboService.expandComboItems(finalItems);

			// Calculate total amount and validate products
			for (const item of expandedItems) {
				if (!item.productId) continue; // Skip combo items without productId

				const product = await Product.findById(item.productId);

				if (!product || !product.isActive) {
					return res.status(400).json({
						success: false,
						message: `Sản phẩm ${item.productName || 'không xác định'} không khả dụng`
					});
				}

				if (product.stockQuantity < item.quantity) {
					return res.status(400).json({
						success: false,
						message: `Sản phẩm ${product.name} không đủ số lượng trong kho`
					});
				}

				const itemTotal = product.price * item.quantity;

				orderItems.push({
					productId: product._id,
					productName: product.name,
					quantity: item.quantity,
					price: product.price,
					total: itemTotal,
					fromCombo: item.fromCombo || false,
					comboId: item.comboId || null,
					comboName: item.comboName || null
				});

				// Update stock quantity
				product.stockQuantity -= item.quantity;
				await product.save();
			}

			// Calculate total with combo pricing if applicable
			if (comboInfo && finalItems.some(item => item.isCombo)) {
				totalAmount = finalItems.reduce((total, item) => {
					return total + (item.price * item.quantity);
				}, 0);
			} else {
				totalAmount = orderItems.reduce((total, item) => total + item.total, 0);
			}
		}

		// Generate order number for direct sales
		// Find the highest existing orderNumber to avoid duplicates
		let orderNumber;
		let orderNumberUnique = false;
		let orderNumberAttempts = 0;
		const MAX_ORDER_NUMBER_ATTEMPTS = 100;

		while (!orderNumberUnique && orderNumberAttempts < MAX_ORDER_NUMBER_ATTEMPTS) {
			const lastOrder = await Order.findOne(
				{ orderNumber: { $regex: /^SAB\d{6}$/ } },
				{ orderNumber: 1 }
			).sort({ orderNumber: -1 }).lean();

			let nextNumber = 1;
			if (lastOrder && lastOrder.orderNumber) {
				const currentNumber = parseInt(lastOrder.orderNumber.replace('SAB', ''));
				nextNumber = currentNumber + 1;
			}

			orderNumber = `SAB${String(nextNumber).padStart(6, '0')}`;

			// Check if orderNumber already exists
			const existingOrderNumber = await Order.findOne({ orderNumber });
			if (!existingOrderNumber) {
				orderNumberUnique = true;
			} else {
				orderNumberAttempts++;
			}
		}

		if (!orderNumberUnique) {
			return res.status(500).json({
				success: false,
				message: 'Không thể tạo số đơn hàng duy nhất sau nhiều lần thử'
			});
		}

		// Generate unique order code (different from orderNumber to avoid conflicts)
		let orderCode;
		let isUnique = false;
		let attempts = 0;

		while (!isUnique && attempts < 10) {
			orderCode = `D${String(Math.floor(Math.random() * 9000) + 1000)}`; // D1000-D9999 format for direct sales
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
			orderNumber,
			orderCode,  // Use generated unique code, not orderNumber
			// For direct sales, don't include customer data fields
			fullName: `NB: ${req.seller.username}`,
			items: orderItems,
			totalAmount,
			status: 'confirmed',
			isDirectSale: true,
			createdBy: req.seller?.id || null,
			lastUpdatedBy: req.seller?.username || req?.admin?.username || 'unknown',
			comboInfo: comboInfo, // Store combo information
			statusHistory: [
				{
					status: 'confirmed',
					updatedBy: req.seller?.username || req?.admin?.username || 'unknown',
					updatedAt: new Date(),
				}
			]
		});

		await order.save();

		// Populate order for response
		const populatedOrder = await Order.findById(order._id)
			.populate('items.productId', 'name imageUrl')
			.lean();

		res.status(201).json({
			success: true,
			message: 'Tạo đơn hàng bán trực tiếp thành công',
			data: {
				...populatedOrder,
				comboInfo: comboInfo, // Include combo information
				statusText: getStatusInVietnamese(populatedOrder.status),
				formattedTotal: formatCurrency(populatedOrder.totalAmount)
			}
		});

	} catch (error) {
		console.error('Create direct order error:', error);
		res.status(500).json({
			success: false,
			message: 'Lỗi server khi tạo đơn hàng bán trực tiếp'
		});
	}
});

/**
 * Helper function to get status in Vietnamese
 * @param {String} status - Order status
 */
function getStatusInVietnamese(status) {
	const statusMap = {
		'pending': 'Chờ xử lý',
		'confirmed': 'Đã xác nhận',
		'paid': 'Đã thanh toán',
		'delivered': 'Đã giao hàng',
		'cancelled': 'Đã hủy'
	};
	return statusMap[status] || status;
}

module.exports = router;
