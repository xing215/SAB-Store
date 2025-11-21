const express = require('express');
const Product = require('../models/Product');
const { ErrorResponse, catchAsync } = require('../utils/errorResponse');
const ErrorLogger = require('../utils/errorLogger');
const router = express.Router();

/**
 * @route   GET /api/products
 * @desc    Get all products
 * @access  Public
 */
router.get('/', catchAsync(async (req, res) => {
	const { category, search, available } = req.query;

	// Build query
	let query = {};

	// Filter by availability (default: only available products)
	if (available !== 'all') {
		query.available = available === 'false' ? false : true;
	}

	// Filter by category
	if (category && category !== 'all') {
		query.category = category;
	}

	// Search by name or description
	if (search) {
		query.$or = [
			{ name: { $regex: search, $options: 'i' } },
			{ description: { $regex: search, $options: 'i' } }
		];
	}

	// Get products with sorting
	const products = await Product.find(query)
		.sort({ category: 1, name: 1 })
		.lean();

	// Group products by category
	const categories = [...new Set(products.map(p => p.category))];
	const groupedProducts = categories.reduce((acc, category) => {
		acc[category] = products.filter(p => p.category === category);
		return acc;
	}, {});

	res.json({
		success: true,
		data: {
			products,
			groupedProducts,
			categories,
			total: products.length
		}
	});
}));/**
 * @route   GET /api/products/direct-sales
 * @desc    Get products available for direct sales (filters by isActive instead of available)
 * @access  Public
 */
router.get('/direct-sales', catchAsync(async (req, res) => {
	const { category, search } = req.query;

	// Build query - for direct sales, only filter by isActive (not available)
	let query = {
		isActive: true  // Only active products can be sold in direct sales
	};

	// Filter by category
	if (category && category !== 'all') {
		query.category = category;
	}

	// Search by name or description
	if (search) {
		query.$or = [
			{ name: { $regex: search, $options: 'i' } },
			{ description: { $regex: search, $options: 'i' } }
		];
	}

	// Get products with sorting
	const products = await Product.find(query)
		.sort({ category: 1, name: 1 })
		.lean();

	// Group products by category
	const categories = [...new Set(products.map(p => p.category))];
	const groupedProducts = categories.reduce((acc, category) => {
		acc[category] = products.filter(p => p.category === category);
		return acc;
	}, {});

	res.json({
		success: true,
		data: {
			products,
			groupedProducts,
			categories,
			total: products.length
		}
	});
}));/**
 * @route   GET /api/products/:id
 * @desc    Get single product by ID
 * @access  Public
 */
router.get('/:id', catchAsync(async (req, res) => {
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

/**
 * @route   GET /api/products/categories/list
 * @desc    Get all product categories
 * @access  Public
 */
router.get('/categories/list', catchAsync(async (req, res) => {
	const categories = await Product.distinct('category');

	res.json({
		success: true,
		data: categories.sort()
	});
}));

module.exports = router;
