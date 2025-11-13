const { body, validationResult } = require('express-validator');
const { createPasswordValidationRules } = require('../utils/passwordValidator');

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
	const errors = validationResult(req);

	if (!errors.isEmpty()) {
		return res.status(400).json({
			message: 'Dữ liệu không hợp lệ',
			errors: errors.array().map(error => ({
				field: error.path,
				message: error.msg,
				value: error.value
			}))
		});
	}

	next();
};

/**
 * Validation rules for creating an order
 */
const validateOrder = [
	body('studentId')
		.notEmpty()
		.withMessage('Mã số sinh viên là bắt buộc')
		.isLength({ min: 1, max: 20 })
		.withMessage('Mã số sinh viên phải từ 1-20 ký tự')
		.trim(),

	body('fullName')
		.notEmpty()
		.withMessage('Họ tên là bắt buộc')
		.isLength({ min: 2, max: 100 })
		.withMessage('Họ tên phải từ 2-100 ký tự')
		.matches(/^[a-zA-ZÀ-ỹ\s]+$/)
		.withMessage('Họ tên chỉ được chứa chữ cái và khoảng trắng')
		.trim(),

	body('email')
		.isEmail()
		.withMessage('Email không hợp lệ')
		.normalizeEmail()
		.isLength({ max: 100 })
		.withMessage('Email không được vượt quá 100 ký tự'),

	body('phoneNumber')
		.notEmpty()
		.withMessage('Số điện thoại là bắt buộc')
		.matches(/^0[0-9]{9}$/)
		.withMessage('Số điện thoại phải có 10 số và bắt đầu bằng 0')
		.trim(),

	body('school')
		.notEmpty()
		.withMessage('Tên trường là bắt buộc')
		.isLength({ min: 1, max: 200 })
		.withMessage('Tên trường phải từ 1-200 ký tự')
		.trim(),

	body('additionalNote')
		.optional()
		.isLength({ max: 500 })
		.withMessage('Ghi chú không được vượt quá 500 ký tự')
		.trim(),

	body('items')
		.isArray({ min: 1 })
		.withMessage('Đơn hàng phải có ít nhất 1 sản phẩm'),

	body('items.*.productId')
		.isMongoId()
		.withMessage('ID sản phẩm không hợp lệ'),

	body('items.*.quantity')
		.isInt({ min: 1, max: 100 })
		.withMessage('Số lượng phải từ 1-100'),

	handleValidationErrors
];

/**
 * Validation rules for updating order status
 */
const validateOrderUpdate = [
	body('status')
		.isIn(['confirmed', 'paid', 'delivered', 'cancelled'])
		.withMessage('Trạng thái không hợp lệ'),

	body('transactionCode')
		.optional()
		.isLength({ max: 50 })
		.withMessage('Mã giao dịch không được vượt quá 50 ký tự')
		.trim(),

	body('cancelReason')
		.optional()
		.isLength({ max: 500 })
		.withMessage('Lý do hủy không được vượt quá 500 ký tự')
		.trim(),

	body('note')
		.optional()
		.isLength({ max: 500 })
		.withMessage('Ghi chú không được vượt quá 500 ký tự')
		.trim(),

	handleValidationErrors
];

// validateSellerLogin removed - now handled by better-auth

/**
 * Validation rules for search parameters
 */
const validateSearch = [
	body('search')
		.optional()
		.isLength({ max: 100 })
		.withMessage('Từ khóa tìm kiếm không được vượt quá 100 ký tự')
		.trim(),

	body('status')
		.optional()
		.isIn(['confirmed', 'paid', 'delivered', 'cancelled'])
		.withMessage('Trạng thái không hợp lệ'),

	body('page')
		.optional()
		.isInt({ min: 1 })
		.withMessage('Trang phải là số nguyên dương'),

	body('limit')
		.optional()
		.isInt({ min: 1, max: 100 })
		.withMessage('Giới hạn phải từ 1-100'),

	handleValidationErrors
];

/**
 * Validation rules for changing password
 */
const validatePasswordChange = [
	body('currentPassword')
		.notEmpty()
		.withMessage('Mật khẩu hiện tại là bắt buộc')
		.trim(),

	...createPasswordValidationRules('newPassword'),

	handleValidationErrors
];

/**
 * Validation rules for user signup/registration  
 */
const validateUserRegistration = [
	body('email')
		.isEmail()
		.withMessage('Email không hợp lệ')
		.normalizeEmail()
		.isLength({ max: 100 })
		.withMessage('Email không được vượt quá 100 ký tự'),

	body('username')
		.notEmpty()
		.withMessage('Tên đăng nhập là bắt buộc')
		.isLength({ min: 3, max: 30 })
		.withMessage('Tên đăng nhập phải từ 3-30 ký tự')
		.matches(/^[a-zA-Z0-9_]+$/)
		.withMessage('Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới')
		.trim(),

	body('name')
		.notEmpty()
		.withMessage('Họ tên là bắt buộc')
		.isLength({ min: 2, max: 100 })
		.withMessage('Họ tên phải từ 2-100 ký tự')
		.matches(/^[a-zA-ZÀ-ỹ\s]+$/)
		.withMessage('Họ tên chỉ được chứa chữ cái và khoảng trắng')
		.trim(),

	...createPasswordValidationRules('password'),

	handleValidationErrors
];

/**
 * Validation rules for password reset
 */
const validatePasswordReset = [
	body('token')
		.notEmpty()
		.withMessage('Token đặt lại mật khẩu là bắt buộc')
		.trim(),

	...createPasswordValidationRules('newPassword'),

	handleValidationErrors
];

module.exports = {
	validateOrder,
	validateOrderUpdate,
	validateSearch,
	validatePasswordChange,
	validateUserRegistration,
	validatePasswordReset,
	handleValidationErrors
};
