const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { validateOrder } = require('../middleware/validation');
const { generateOrderCode, calculateTotal } = require('../utils/helpers');
const { sendOrderToAppScript } = require('../utils/appscript');
const { generateOrderPaymentQR, formatOrderPaymentDescription } = require('../utils/paymentHelper');
const ComboService = require('../services/ComboService');
const { ErrorResponse, catchAsync } = require('../utils/errorResponse');
const ErrorLogger = require('../utils/errorLogger');
const { ERROR_CODES } = require('../constants/errorCodes');
const router = express.Router();

/**
 * @route   POST /api/orders
 * @desc    Create a new order
 * @access  Public
 */
router.post('/', validateOrder, catchAsync(async (req, res) => {
	ErrorLogger.logInfo('[ORDER] Order creation started', {
		timestamp: new Date().toISOString(),
		itemCount: req.body.items?.length || 0
	});

	const { studentId, fullName, email, phoneNumber, additionalNote, items, optimalPricing, useOptimalPricing = false } = req.body;

	if (!items || !Array.isArray(items) || items.length === 0) {
		throw ErrorResponse.validationError('Danh sách sản phẩm không hợp lệ', {
			field: 'items',
			received: items
		});
	}

	ErrorLogger.logDebug('[ORDER] Processing items', { itemCount: items.length });

	let totalAmount;
	let comboInfo = null;
	let orderItems = [];

	if (useOptimalPricing && optimalPricing) {
		ErrorLogger.logInfo('[ORDER] Using optimal pricing from frontend');

		const productIds = items.map(item => item.productId);
		const products = await Product.find({
			_id: { $in: productIds },
			available: true
		});

		if (products.length !== productIds.length) {
			const missingIds = productIds.filter(id => !products.find(p => p._id.toString() === id));
			throw ErrorResponse.productUnavailableError('một hoặc nhiều sản phẩm', {
				missingProductIds: missingIds,
				foundCount: products.length,
				requestedCount: productIds.length
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

		ErrorLogger.logDebug('[ORDER] Using optimal pricing', {
			originalTotal: optimalPricing.summary.originalTotal,
			finalTotal: totalAmount,
			savings: optimalPricing.summary.totalSavings
		});

	} else {
		ErrorLogger.logInfo('[ORDER] Using traditional combo detection');
		// Original combo detection logic as fallback
		let finalItems = items;

		ErrorLogger.logDebug('[ORDER] Applying combo detection');
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

		ErrorLogger.logDebug('[ORDER] Converting combo items to individual products');
		const expandedItems = ComboService.expandComboItems(finalItems);

		ErrorLogger.logDebug('[ORDER] Validating products in database');
		const productIds = expandedItems.map(item => item.productId).filter(id => id);
		const products = await Product.find({
			_id: { $in: productIds },
			available: true
		});

		if (products.length !== productIds.length) {
			const missingIds = productIds.filter(id => !products.find(p => p._id.toString() === id));
			throw ErrorResponse.productUnavailableError('một hoặc nhiều sản phẩm', {
				missingProductIds: missingIds,
				foundCount: products.length,
				requestedCount: productIds.length
			});
		}

		ErrorLogger.logDebug('[ORDER] Building order items with pricing');
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

		ErrorLogger.logDebug('[ORDER] Calculating total amount');
		if (comboInfo && finalItems.some(item => item.isCombo)) {
			totalAmount = finalItems.reduce((total, item) => {
				return total + (item.price * item.quantity);
			}, 0);
			ErrorLogger.logDebug('[ORDER] Total with combo pricing', { totalAmount });
		} else {
			totalAmount = calculateTotal(orderItems);
			ErrorLogger.logDebug('[ORDER] Total with individual pricing', { totalAmount });
		}
	}

	ErrorLogger.logDebug('[ORDER] Generating unique order code');
	let orderCode;
	let isUnique = false;
	let attempts = 0; while (!isUnique && attempts < 10) {
		orderCode = generateOrderCode();
		const existingOrder = await Order.findOne({ orderCode });
		if (!existingOrder) {
			isUnique = true;
		}
		attempts++;
	}

	if (!isUnique) {
		throw ErrorResponse.orderProcessingError('Không thể tạo mã đơn hàng duy nhất sau 10 lần thử', {
			attempts
		});
	}

	ErrorLogger.logInfo('[ORDER] Generated order code', { orderCode });

	ErrorLogger.logDebug('[ORDER] Creating order in database');
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
	ErrorLogger.logInfo('[ORDER] Order saved successfully', { orderId: order._id, orderCode });

	let qrUrl = null;
	let paymentDescription = null;
	try {
		qrUrl = await generateOrderPaymentQR(totalAmount, orderCode, studentId, fullName);
		paymentDescription = await formatOrderPaymentDescription(orderCode, studentId, fullName);
		ErrorLogger.logDebug('[ORDER] QR URL generated', { orderCode });
	} catch (qrError) {
		ErrorLogger.logExternalService('PaymentQR', qrError, {
			orderCode,
			totalAmount
		});
	}

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
	ErrorLogger.logDebug('[ORDER] Pushing to AppScript', { orderCode });

	setImmediate(() => {
		sendOrderToAppScript(appscriptData).catch(err => {
			ErrorLogger.logExternalService('AppScript', err, {
				orderCode,
				endpoint: 'sendOrder'
			});
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
			comboInfo: comboInfo,
			qrUrl: qrUrl,
			paymentDescription: paymentDescription
		}
	});
}));

/**
 * @route   GET /api/orders/:orderCode
 * @desc    Get order by order code (for customer tracking)
 * @access  Public
 */
router.get('/:orderCode', catchAsync(async (req, res) => {
	const { orderCode } = req.params;

	const order = await Order.findOne({
		orderCode: orderCode.toUpperCase()
	}).populate('items.productId', 'name description');

	if (!order) {
		throw ErrorResponse.notFoundError('Đơn hàng', {
			orderCode: orderCode.toUpperCase()
		});
	}

	let qrUrl = null;
	let paymentDescription = null;
	try {
		qrUrl = await generateOrderPaymentQR(
			order.totalAmount,
			order.orderCode,
			order.studentId,
			order.fullName
		);
		paymentDescription = await formatOrderPaymentDescription(
			order.orderCode,
			order.studentId,
			order.fullName
		);
	} catch (error) {
		ErrorLogger.logExternalService('PaymentQR', error, {
			orderCode: order.orderCode
		});
	}

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
			qrUrl: qrUrl,
			paymentDescription: paymentDescription,
			items: order.items.map(item => ({
				productName: item.productName,
				quantity: item.quantity,
				price: item.price
			}))
		}
	});
}));

module.exports = router;
