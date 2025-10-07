const express = require('express');
const Order = require('../../models/Order');
const Product = require('../../models/Product');
const { validateOrderUpdate } = require('../../middleware/validation');
const { getPaginationInfo } = require('../../utils/helpers');
const { sendOrderToAppScript } = require('../../utils/appscript');
const router = express.Router();

/**
 * @route   GET /api/admin/orders
 * @desc    Get all orders with pagination and search
 * @access  Private (Admin)
 */
router.get('/', async (req, res) => {
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
router.get('/:id', async (req, res) => {
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
router.put('/:id', validateOrderUpdate, async (req, res) => {
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

		// Store previous status to check if we need to restore stock
		const previousStatus = order.status;

		// Handle stock restoration when order is cancelled
		if (status === 'cancelled' && previousStatus !== 'cancelled') {
			console.log('📦 Restoring stock for cancelled order:', order.orderCode);
			
			// Restore stock for all items in the order
			for (const item of order.items) {
				try {
					const product = await Product.findById(item.productId);
					if (product) {
						product.stockQuantity += item.quantity;
						await product.save();
						console.log(`✅ Restored ${item.quantity} units of ${product.name} to stock`);
					} else {
						console.warn(`⚠️ Product ${item.productId} not found, skipping stock restoration`);
					}
				} catch (stockError) {
					console.error(`❌ Error restoring stock for product ${item.productId}:`, stockError);
					// Continue with other items even if one fails
				}
			}
		}

		// Handle stock deduction when order is un-cancelled (restored from cancelled to another status)
		if (previousStatus === 'cancelled' && status !== 'cancelled') {
			console.log('📦 Deducting stock for restored order:', order.orderCode);
			
			// Deduct stock for all items in the order
			for (const item of order.items) {
				try {
					const product = await Product.findById(item.productId);
					if (product) {
						// Check if we have enough stock
						if (product.stockQuantity < item.quantity) {
							return res.status(400).json({
								success: false,
								message: `Không đủ hàng trong kho cho sản phẩm ${product.name}. Còn lại: ${product.stockQuantity}, cần: ${item.quantity}`
							});
						}
						product.stockQuantity -= item.quantity;
						await product.save();
						console.log(`✅ Deducted ${item.quantity} units of ${product.name} from stock`);
					} else {
						console.warn(`⚠️ Product ${item.productId} not found, skipping stock deduction`);
					}
				} catch (stockError) {
					console.error(`❌ Error deducting stock for product ${item.productId}:`, stockError);
					return res.status(500).json({
						success: false,
						message: 'Lỗi khi cập nhật kho hàng'
					});
				}
			}
		}

		// Update order
		order.status = status;
		order.statusUpdatedAt = new Date();

		// Build status history entry
		const historyEntry = {
			status,
			updatedAt: new Date(),
			updatedBy: req.admin.username
		};

		// Handle specific status requirements
		if (status === 'paid') {
			if (transactionCode) {
				order.transactionCode = transactionCode;
				historyEntry.transactionCode = transactionCode;
			}
		}

		if (status === 'cancelled') {
			if (cancelReason) {
				order.cancelReason = cancelReason;
				historyEntry.cancelReason = cancelReason;
			}
		}

		// Add note to history if provided
		if (note) {
			historyEntry.note = note;
		}

		// Add to status history
		order.statusHistory = order.statusHistory || [];
		order.statusHistory.push(historyEntry);

		await order.save();

		// Tự động push lên App Script mỗi lần cập nhật trạng thái
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
				console.error('AppScript push error:', err.message);
			});
		});

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
			const errorMessages = Object.values(error.errors).map(err => err.message);
			return res.status(400).json({
				success: false,
				message: errorMessages.join(', ')
			});
		}

		res.status(500).json({
			success: false,
			message: 'Lỗi server khi cập nhật đơn hàng'
		});
	}
});

/**
 * @route   DELETE /api/admin/orders
 * @desc    Delete all orders (DANGEROUS - Admin only)
 * @access  Private (Admin)
 */
router.delete('/', async (req, res) => {
	try {
		console.log('🚨 DELETE ALL ORDERS Request:', {
			admin: req.admin.username,
			timestamp: new Date().toISOString(),
			userAgent: req.get('User-Agent')
		});

		// Count total orders before deletion for reporting
		const totalCount = await Order.countDocuments();

		if (totalCount === 0) {
			return res.json({
				success: true,
				message: 'Không có đơn hàng nào để xóa',
				data: {
					deletedCount: 0,
					totalCount: 0
				}
			});
		}

		console.log(`📊 Found ${totalCount} orders to delete`);

		// Perform bulk deletion
		const result = await Order.deleteMany({});

		console.log('✅ Bulk deletion completed:', {
			deletedCount: result.deletedCount,
			acknowledged: result.acknowledged,
			admin: req.admin.username
		});

		// Log the dangerous operation
		console.warn('🔥 CRITICAL OPERATION - ALL ORDERS DELETED:', {
			deletedCount: result.deletedCount,
			performedBy: req.admin.username,
			timestamp: new Date().toISOString(),
			originalTotal: totalCount
		});

		res.json({
			success: true,
			message: `Đã xóa thành công ${result.deletedCount} đơn hàng`,
			data: {
				deletedCount: result.deletedCount,
				totalCount: totalCount,
				performedBy: req.admin.username,
				timestamp: new Date().toISOString()
			}
		});

	} catch (error) {
		console.error('💥 Error deleting all orders:', error);

		// Log the failed dangerous operation
		console.error('🔥 CRITICAL OPERATION FAILED - DELETE ALL ORDERS:', {
			error: error.message,
			admin: req.admin.username,
			timestamp: new Date().toISOString()
		});

		res.status(500).json({
			success: false,
			message: 'Lỗi server khi xóa đơn hàng',
			error: process.env.NODE_ENV === 'development' ? error.message : undefined
		});
	}
});

/**
 * @route   POST /api/admin/orders/direct
 * @desc    Create direct sale order (admin)
 * @access  Private (Admin)
 */
router.post('/direct', async (req, res) => {
	try {
		console.log('🔵 Admin Direct Order Request:', {
			admin: req.admin.username,
			body: req.body,
			timestamp: new Date().toISOString()
		});

		const { items } = req.body;

		// Validate required fields
		if (!items || !Array.isArray(items) || items.length === 0) {
			return res.status(400).json({
				success: false,
				message: 'Danh sách sản phẩm không được để trống'
			});
		}

		// Validate items
		for (const item of items) {
			if (!item.productId || !item.quantity || item.quantity <= 0) {
				return res.status(400).json({
					success: false,
					message: 'Thông tin sản phẩm không hợp lệ'
				});
			}
		}

		console.log('✅ Validation passed, processing items...');

		// Calculate total amount and prepare order items
		let totalAmount = 0;
		const orderItems = [];

		for (const item of items) {
			const product = await Product.findById(item.productId);
			if (!product) {
				return res.status(404).json({
					success: false,
					message: `Không tìm thấy sản phẩm với ID: ${item.productId}`
				});
			}

			const itemTotal = product.price * item.quantity;
			totalAmount += itemTotal;

			orderItems.push({
				productId: product._id,
				productName: product.name,
				price: product.price,
				quantity: item.quantity,
				total: itemTotal
			});
		}

		// Generate order code
		const orderCount = await Order.countDocuments();
		const orderCode = `ORD${String(orderCount + 1).padStart(6, '0')}`;

		console.log('📋 Creating order with code:', orderCode);
		console.log('💰 Total amount:', totalAmount);
		console.log('📦 Order items:', orderItems);

		// Create direct sale order
		const order = new Order({
			fullName: `NB: ${req.admin.username}`,
			orderCode,
			studentId: `DIRECT_${Date.now()}`,
			fullName: 'Bán trực tiếp',
			email: 'direct@admin.local',
			items: orderItems,
			totalAmount,
			status: 'paid',
			statusHistory: [{
				status: 'paid',
				updatedAt: new Date(),
				updatedBy: req.admin.username,
				note: 'Bán trực tiếp tại cửa hàng'
			}],
			isDirectSale: true,
			createdBy: req.admin.username
		});

		await order.save();

		console.log('✅ Direct order created successfully:', orderCode);

		res.status(201).json({
			success: true,
			message: 'Tạo đơn hàng bán trực tiếp thành công',
			data: {
				order,
				orderCode,
				totalAmount
			}
		});

	} catch (error) {
		console.error('💥 Direct order creation error:', error);
		res.status(500).json({
			success: false,
			message: 'Lỗi server khi tạo đơn hàng'
		});
	}
});

module.exports = router;
