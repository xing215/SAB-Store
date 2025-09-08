const express = require('express');
const Combo = require('../models/Combo');
const Product = require('../models/Product');
const { auth, hasRole } = require('../middleware/better-auth');
const router = express.Router();

/**
 * @route   GET /api/combos
 * @desc    Get all combos (admin only)
 * @access  Private/Admin
 */
router.get('/', auth, hasRole('admin'), async (req, res) => {
	try {
		const { active } = req.query;

		let query = {};
		if (active === 'true') {
			query.isActive = true;
		} else if (active === 'false') {
			query.isActive = false;
		}

		const combos = await Combo.find(query)
			.sort({ priority: -1, createdAt: -1 })
			.lean();

		res.json({
			success: true,
			data: { combos }
		});
	} catch (error) {
		console.error('Get combos error:', error);
		res.status(500).json({
			success: false,
			message: 'Lỗi server khi lấy danh sách combo'
		});
	}
});

/**
 * @route   GET /api/combos/active
 * @desc    Get active combos for combo detection
 * @access  Public
 */
router.get('/active', async (req, res) => {
	try {
		const combos = await Combo.findActive();

		res.json({
			success: true,
			data: { combos }
		});
	} catch (error) {
		console.error('Get active combos error:', error);
		res.status(500).json({
			success: false,
			message: 'Lỗi server khi lấy danh sách combo'
		});
	}
});

/**
 * @route   POST /api/combos/detect
 * @desc    Detect applicable combos for given products
 * @access  Public
 */
router.post('/detect', async (req, res) => {
	try {
		const { items } = req.body;

		if (!items || !Array.isArray(items) || items.length === 0) {
			return res.status(400).json({
				success: false,
				message: 'Danh sách sản phẩm là bắt buộc'
			});
		}

		// Get product details for all items
		const productIds = items.map(item => item.productId);
		const products = await Product.find({ _id: { $in: productIds } });

		// Create products with quantities
		const productsWithQuantities = items.map(item => {
			const product = products.find(p => p._id.toString() === item.productId);
			return {
				product,
				quantity: item.quantity
			};
		}).filter(item => item.product); // Remove items where product not found

		// Get active combos
		const combos = await Combo.findActive();

		// Find applicable combos
		const applicableCombos = combos.filter(combo => {
			return combo.canApplyToProducts(productsWithQuantities);
		});

		// Calculate savings for each applicable combo
		const combosWithSavings = applicableCombos.map(combo => {
			const savings = combo.calculateSavings(productsWithQuantities);
			return {
				...combo.toObject(),
				savings,
				isBetterDeal: savings > 0
			};
		});

		// Sort by savings (highest first)
		combosWithSavings.sort((a, b) => b.savings - a.savings);

		res.json({
			success: true,
			data: {
				applicableCombos: combosWithSavings,
				bestCombo: combosWithSavings.length > 0 ? combosWithSavings[0] : null
			}
		});
	} catch (error) {
		console.error('Detect combos error:', error);
		res.status(500).json({
			success: false,
			message: 'Lỗi server khi phát hiện combo'
		});
	}
});

/**
 * @route   POST /api/combos
 * @desc    Create new combo
 * @access  Private/Admin
 */
router.post('/', auth, hasRole('admin'), async (req, res) => {
	try {
		const { name, description, price, categoryRequirements, priority } = req.body;

		// Validate required fields
		if (!name || !price || !categoryRequirements || !Array.isArray(categoryRequirements)) {
			return res.status(400).json({
				success: false,
				message: 'Tên, giá và yêu cầu danh mục là bắt buộc'
			});
		}

		// Validate categoryRequirements
		if (categoryRequirements.length === 0) {
			return res.status(400).json({
				success: false,
				message: 'Combo phải có ít nhất một yêu cầu danh mục'
			});
		}

		// Check if all categories exist in products
		const categories = categoryRequirements.map(req => req.category);
		const existingCategories = await Product.distinct('category');
		const invalidCategories = categories.filter(cat => !existingCategories.includes(cat));

		if (invalidCategories.length > 0) {
			return res.status(400).json({
				success: false,
				message: `Danh mục không tồn tại: ${invalidCategories.join(', ')}`
			});
		}

		const combo = new Combo({
			name,
			description,
			price,
			categoryRequirements,
			priority: priority || 0
		});

		await combo.save();

		res.status(201).json({
			success: true,
			data: { combo },
			message: 'Tạo combo thành công'
		});
	} catch (error) {
		console.error('Create combo error:', error);

		if (error.name === 'ValidationError') {
			const errors = Object.values(error.errors).map(err => err.message);
			return res.status(400).json({
				success: false,
				message: errors.join(', ')
			});
		}

		res.status(500).json({
			success: false,
			message: 'Lỗi server khi tạo combo'
		});
	}
});

/**
 * @route   PUT /api/combos/:id
 * @desc    Update combo
 * @access  Private/Admin
 */
router.put('/:id', auth, hasRole('admin'), async (req, res) => {
	try {
		const { id } = req.params;
		const { name, description, price, categoryRequirements, priority, isActive } = req.body;

		const combo = await Combo.findById(id);
		if (!combo) {
			return res.status(404).json({
				success: false,
				message: 'Không tìm thấy combo'
			});
		}

		// Validate categoryRequirements if provided
		if (categoryRequirements) {
			if (!Array.isArray(categoryRequirements) || categoryRequirements.length === 0) {
				return res.status(400).json({
					success: false,
					message: 'Combo phải có ít nhất một yêu cầu danh mục'
				});
			}

			// Check if all categories exist
			const categories = categoryRequirements.map(req => req.category);
			const existingCategories = await Product.distinct('category');
			const invalidCategories = categories.filter(cat => !existingCategories.includes(cat));

			if (invalidCategories.length > 0) {
				return res.status(400).json({
					success: false,
					message: `Danh mục không tồn tại: ${invalidCategories.join(', ')}`
				});
			}
		}

		// Update fields
		if (name !== undefined) combo.name = name;
		if (description !== undefined) combo.description = description;
		if (price !== undefined) combo.price = price;
		if (categoryRequirements !== undefined) combo.categoryRequirements = categoryRequirements;
		if (priority !== undefined) combo.priority = priority;
		if (isActive !== undefined) combo.isActive = isActive;

		await combo.save();

		res.json({
			success: true,
			data: { combo },
			message: 'Cập nhật combo thành công'
		});
	} catch (error) {
		console.error('Update combo error:', error);

		if (error.name === 'ValidationError') {
			const errors = Object.values(error.errors).map(err => err.message);
			return res.status(400).json({
				success: false,
				message: errors.join(', ')
			});
		}

		res.status(500).json({
			success: false,
			message: 'Lỗi server khi cập nhật combo'
		});
	}
});

/**
 * @route   DELETE /api/combos/:id
 * @desc    Delete combo
 * @access  Private/Admin
 */
router.delete('/:id', auth, hasRole('admin'), async (req, res) => {
	try {
		const { id } = req.params;

		const combo = await Combo.findById(id);
		if (!combo) {
			return res.status(404).json({
				success: false,
				message: 'Không tìm thấy combo'
			});
		}

		await Combo.findByIdAndDelete(id);

		res.json({
			success: true,
			message: 'Xóa combo thành công'
		});
	} catch (error) {
		console.error('Delete combo error:', error);
		res.status(500).json({
			success: false,
			message: 'Lỗi server khi xóa combo'
		});
	}
});

/**
 * @route   GET /api/combos/:id
 * @desc    Get combo by ID
 * @access  Private/Admin
 */
router.get('/:id', auth, hasRole('admin'), async (req, res) => {
	try {
		const { id } = req.params;

		const combo = await Combo.findById(id);
		if (!combo) {
			return res.status(404).json({
				success: false,
				message: 'Không tìm thấy combo'
			});
		}

		res.json({
			success: true,
			data: { combo }
		});
	} catch (error) {
		console.error('Get combo error:', error);
		res.status(500).json({
			success: false,
			message: 'Lỗi server khi lấy thông tin combo'
		});
	}
});

module.exports = router;
