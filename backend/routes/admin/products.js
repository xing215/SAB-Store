const express = require('express');
const Product = require('../../models/Product');
const router = express.Router();

/**
 * @route   GET /api/admin/products
 * @desc    Get all products for admin management
 * @access  Private (Admin authentication handled by parent router)
 */
router.get('/', async (req, res) => {
	try {
		const { page = 1, limit = 10, search = '', category = '', status = '' } = req.query;

		// Build filter
		const filter = {};
		if (search) {
			filter.$or = [
				{ name: { $regex: search, $options: 'i' } },
				{ description: { $regex: search, $options: 'i' } }
			];
		}
		if (category) {
			filter.category = category;
		}
		if (status !== '') {
			filter.available = status === 'true';
		}

		const options = {
			page: parseInt(page),
			limit: parseInt(limit),
			sort: { createdAt: -1 }
		};

		const products = await Product.paginate(filter, options);

		res.json({
			success: true,
			data: {
				products: products.docs,
				pagination: {
					page: products.page,
					pages: products.totalPages,
					total: products.totalDocs,
					limit: products.limit
				}
			}
		});
	} catch (error) {
		console.error('Get products error:', error);
		res.status(500).json({
			success: false,
			message: 'Lỗi server khi lấy danh sách sản phẩm'
		});
	}
});

/**
 * @route   POST /api/admin/products
 * @desc    Create new product
 * @access  Private (Admin)
 */
router.post('/', async (req, res) => {
	try {
		const {
			name,
			description,
			price,
			category,
			imageUrl,
			available,
			isActive,
			stockQuantity,
			minOrderQuantity
		} = req.body;

		// Validate required fields
		if (!name || !price || !category) {
			return res.status(400).json({
				success: false,
				message: 'Tên, giá và danh mục sản phẩm là bắt buộc'
			});
		}

		const product = new Product({
			name,
			description,
			price,
			category,
			imageUrl: imageUrl || undefined, // Let the schema default handle it
			available: available !== undefined ? available : true,
			isActive: isActive !== undefined ? isActive : true,
			stockQuantity: stockQuantity || 0,
			minOrderQuantity: minOrderQuantity || 1
		});

		await product.save();

		res.status(201).json({
			success: true,
			message: 'Tạo sản phẩm thành công',
			data: { product }
		});
	} catch (error) {
		console.error('Create product error:', error);

		// Handle validation errors
		if (error.name === 'ValidationError') {
			const errorMessages = Object.values(error.errors).map(err => err.message);
			return res.status(400).json({
				success: false,
				message: errorMessages.join(', ')
			});
		}

		// Handle duplicate key errors
		if (error.code === 11000) {
			return res.status(400).json({
				success: false,
				message: 'Sản phẩm với thông tin này đã tồn tại'
			});
		}

		res.status(500).json({
			success: false,
			message: 'Lỗi server khi tạo sản phẩm'
		});
	}
});

/**
 * @route   PUT /api/admin/products/:id
 * @desc    Update product
 * @access  Private (Admin)
 */
router.put('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const updateData = { ...req.body };

		// Handle imageUrl field - only update if provided and not empty
		if (updateData.imageUrl === '') {
			delete updateData.imageUrl; // Let existing value remain
		}

		const product = await Product.findByIdAndUpdate(
			id,
			updateData,
			{ new: true, runValidators: true }
		);

		if (!product) {
			return res.status(404).json({
				success: false,
				message: 'Không tìm thấy sản phẩm'
			});
		}

		res.json({
			success: true,
			message: 'Cập nhật sản phẩm thành công',
			data: { product }
		});
	} catch (error) {
		console.error('Update product error:', error);

		// Handle validation errors
		if (error.name === 'ValidationError') {
			const errorMessages = Object.values(error.errors).map(err => err.message);
			return res.status(400).json({
				success: false,
				message: errorMessages.join(', ')
			});
		}

		// Handle cast errors (invalid ID)
		if (error.name === 'CastError') {
			return res.status(400).json({
				success: false,
				message: 'ID sản phẩm không hợp lệ'
			});
		}

		// Handle duplicate key errors
		if (error.code === 11000) {
			return res.status(400).json({
				success: false,
				message: 'Sản phẩm với thông tin này đã tồn tại'
			});
		}

		res.status(500).json({
			success: false,
			message: 'Lỗi server khi cập nhật sản phẩm'
		});
	}
});

/**
 * @route   DELETE /api/admin/products/:id
 * @desc    Delete product
 * @access  Private (Admin)
 */
router.delete('/:id', async (req, res) => {
	try {
		const { id } = req.params;

		const product = await Product.findByIdAndDelete(id);

		if (!product) {
			return res.status(404).json({
				success: false,
				message: 'Không tìm thấy sản phẩm'
			});
		}

		res.json({
			success: true,
			message: 'Xóa sản phẩm thành công'
		});
	} catch (error) {
		console.error('Delete product error:', error);

		// Handle cast errors (invalid ID)
		if (error.name === 'CastError') {
			return res.status(400).json({
				success: false,
				message: 'ID sản phẩm không hợp lệ'
			});
		}

		res.status(500).json({
			success: false,
			message: 'Lỗi server khi xóa sản phẩm'
		});
	}
});

module.exports = router;
