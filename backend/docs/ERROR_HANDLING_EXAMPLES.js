const { ErrorResponse, catchAsync } = require('../utils/errorResponse');
const ErrorLogger = require('../utils/errorLogger');
const { ERROR_CODES } = require('../constants/errorCodes');

// EXAMPLE 1: Basic Route with Error Handling
router.get('/products/:id', catchAsync(async (req, res) => {
	const product = await Product.findById(req.params.id);

	if (!product) {
		throw ErrorResponse.notFoundError('Sản phẩm', {
			productId: req.params.id
		});
	}

	res.json({
		success: true,
		data: product
	});
}));

// EXAMPLE 2: Validation Error with Details
router.post('/orders', catchAsync(async (req, res) => {
	const { items, studentId, fullName } = req.body;

	if (!items || !Array.isArray(items) || items.length === 0) {
		throw ErrorResponse.validationError('Danh sách sản phẩm không hợp lệ', {
			field: 'items',
			received: items,
			expected: 'non-empty array'
		});
	}

	if (!studentId || studentId.length < 5) {
		throw ErrorResponse.validationError('Mã sinh viên không hợp lệ', {
			field: 'studentId',
			minLength: 5,
			received: studentId?.length || 0
		});
	}

	ErrorLogger.logInfo('[ORDER] Creating order', {
		studentId,
		itemCount: items.length
	});

	const order = await Order.create({
		studentId,
		fullName,
		items
	});

	res.status(201).json({
		success: true,
		data: order
	});
}));

// EXAMPLE 3: Database Error Handling
router.put('/products/:id', catchAsync(async (req, res) => {
	const { name, price, stockQuantity } = req.body;

	const product = await Product.findById(req.params.id);
	if (!product) {
		throw ErrorResponse.notFoundError('Sản phẩm', {
			productId: req.params.id
		});
	}

	try {
		product.name = name;
		product.price = price;
		product.stockQuantity = stockQuantity;
		await product.save();
	} catch (error) {
		if (error.code === 11000) {
			throw ErrorResponse.conflictError('Tên sản phẩm đã tồn tại', {
				field: 'name',
				value: name
			});
		}
		throw error;
	}

	ErrorLogger.logInfo('[PRODUCT] Product updated', {
		productId: product._id,
		changes: { name, price, stockQuantity }
	});

	res.json({
		success: true,
		data: product
	});
}));

// EXAMPLE 4: External Service Error
router.post('/orders/:id/notify', catchAsync(async (req, res) => {
	const order = await Order.findById(req.params.id);

	if (!order) {
		throw ErrorResponse.notFoundError('Đơn hàng', {
			orderId: req.params.id
		});
	}

	try {
		await sendOrderToAppScript(order);
		ErrorLogger.logInfo('[APPSCRIPT] Order sent successfully', {
			orderId: order._id
		});
	} catch (error) {
		ErrorLogger.logExternalService('AppScript', error, {
			endpoint: '/sendOrder',
			orderId: order._id,
			statusCode: error.response?.status
		});

		throw ErrorResponse.externalServiceError('Google Apps Script', {
			service: 'AppScript',
			operation: 'sendOrder',
			orderId: order._id,
			originalError: error.message
		});
	}

	res.json({
		success: true,
		message: 'Đơn hàng đã được gửi'
	});
}));

// EXAMPLE 5: Product Availability Check
router.post('/cart/validate', catchAsync(async (req, res) => {
	const { items } = req.body;

	const productIds = items.map(item => item.productId);
	const products = await Product.find({
		_id: { $in: productIds },
		available: true
	});

	if (products.length !== productIds.length) {
		const foundIds = products.map(p => p._id.toString());
		const missingIds = productIds.filter(id => !foundIds.includes(id));

		throw ErrorResponse.productUnavailableError('một hoặc nhiều sản phẩm', {
			requestedCount: productIds.length,
			foundCount: products.length,
			missingProductIds: missingIds
		});
	}

	const unavailableProducts = [];
	for (const item of items) {
		const product = products.find(p => p._id.toString() === item.productId);
		if (product.stockQuantity < item.quantity) {
			unavailableProducts.push({
				productId: product._id,
				productName: product.name,
				requested: item.quantity,
				available: product.stockQuantity
			});
		}
	}

	if (unavailableProducts.length > 0) {
		throw ErrorResponse.productUnavailableError('sản phẩm không đủ số lượng', {
			unavailableProducts
		});
	}

	res.json({
		success: true,
		message: 'Tất cả sản phẩm đều khả dụng'
	});
}));

// EXAMPLE 6: Authorization Error
router.delete('/products/:id', authenticateAdmin, catchAsync(async (req, res) => {
	if (req.user.role !== 'admin') {
		throw ErrorResponse.forbiddenError('Chỉ admin mới có quyền xóa sản phẩm', {
			userId: req.user.id,
			userRole: req.user.role,
			requiredRole: 'admin'
		});
	}

	const product = await Product.findById(req.params.id);
	if (!product) {
		throw ErrorResponse.notFoundError('Sản phẩm', {
			productId: req.params.id
		});
	}

	await product.deleteOne();

	ErrorLogger.logInfo('[PRODUCT] Product deleted', {
		productId: product._id,
		deletedBy: req.user.id
	});

	res.json({
		success: true,
		message: 'Sản phẩm đã được xóa'
	});
}));

// EXAMPLE 7: Multiple Validation Errors
router.post('/users', catchAsync(async (req, res) => {
	const { email, password, phoneNumber } = req.body;
	const errors = [];

	if (!email || !email.includes('@')) {
		errors.push({
			field: 'email',
			message: 'Email không hợp lệ',
			value: email
		});
	}

	if (!password || password.length < 8) {
		errors.push({
			field: 'password',
			message: 'Mật khẩu phải có ít nhất 8 ký tự',
			minLength: 8,
			received: password?.length || 0
		});
	}

	if (!phoneNumber || !/^\d{10}$/.test(phoneNumber)) {
		errors.push({
			field: 'phoneNumber',
			message: 'Số điện thoại phải có 10 chữ số',
			pattern: '^\\d{10}$',
			received: phoneNumber
		});
	}

	if (errors.length > 0) {
		throw ErrorResponse.validationError('Dữ liệu không hợp lệ', {
			errors
		});
	}

	const user = await User.create({ email, password, phoneNumber });

	res.status(201).json({
		success: true,
		data: user
	});
}));

// EXAMPLE 8: Custom Error Code
router.post('/orders/:id/cancel', catchAsync(async (req, res) => {
	const order = await Order.findById(req.params.id);

	if (!order) {
		throw ErrorResponse.notFoundError('Đơn hàng', {
			orderId: req.params.id
		});
	}

	if (order.status === 'delivered') {
		throw ErrorResponse.createError(
			ERROR_CODES.CONFLICT,
			'Không thể hủy đơn hàng đã giao',
			{
				orderId: order._id,
				currentStatus: order.status,
				allowedStatuses: ['confirmed', 'processing']
			}
		);
	}

	order.status = 'cancelled';
	order.statusHistory.push({
		status: 'cancelled',
		updatedBy: req.user.id,
		updatedAt: new Date(),
		note: req.body.reason || 'Khách hàng yêu cầu hủy'
	});

	await order.save();

	ErrorLogger.logInfo('[ORDER] Order cancelled', {
		orderId: order._id,
		cancelledBy: req.user.id,
		reason: req.body.reason
	});

	res.json({
		success: true,
		message: 'Đơn hàng đã được hủy'
	});
}));

// EXAMPLE 9: Logging Levels
router.post('/process-batch', catchAsync(async (req, res) => {
	const { items } = req.body;

	ErrorLogger.logInfo('[BATCH] Starting batch process', {
		itemCount: items.length
	});

	const results = {
		success: [],
		failed: []
	};

	for (const item of items) {
		try {
			ErrorLogger.logDebug('[BATCH] Processing item', {
				itemId: item.id
			});

			await processItem(item);
			results.success.push(item.id);

		} catch (error) {
			ErrorLogger.logWarning('[BATCH] Item processing failed', {
				itemId: item.id,
				error: error.message
			});
			results.failed.push({
				itemId: item.id,
				error: error.message
			});
		}
	}

	ErrorLogger.logInfo('[BATCH] Batch process completed', {
		successCount: results.success.length,
		failedCount: results.failed.length
	});

	res.json({
		success: true,
		data: results
	});
}));

// EXAMPLE 10: Request Context Logging
router.post('/sensitive-operation', authenticateAdmin, catchAsync(async (req, res) => {
	ErrorLogger.logRequest(req);

	const operation = req.body.operation;
	const targetId = req.body.targetId;

	ErrorLogger.logInfo('[ADMIN] Sensitive operation requested', {
		operation,
		targetId,
		requestedBy: req.user.id,
		ip: req.ip,
		userAgent: req.get('user-agent')
	});

	await performSensitiveOperation(operation, targetId);

	res.json({
		success: true,
		message: 'Thao tác đã được thực hiện'
	});
}));
