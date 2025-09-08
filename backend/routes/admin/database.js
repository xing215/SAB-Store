const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');

// Import models
const User = require('../../models/User');
const Product = require('../../models/Product');
const Order = require('../../models/Order');
const Account = require('../../models/Account');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: 50 * 1024 * 1024 // 50MB limit
	},
	fileFilter: (req, file, cb) => {
		if (file.mimetype === 'application/json') {
			cb(null, true);
		} else {
			cb(new Error('Only JSON files are allowed'), false);
		}
	}
});

/**
 * Export entire database as JSON
 * GET /api/admin/database/export
 * Admin authentication handled by parent router
 */
router.get('/export', async (req, res) => {
	try {
		console.log(`[${new Date().toISOString()}] Database export requested by admin: ${req.user.email}`);

		// Export all collections
		const [users, products, orders, accounts] = await Promise.all([
			User.find({}).lean(),
			Product.find({}).lean(),
			Order.find({}).lean(),
			Account.find({}).lean()
		]);

		const exportData = {
			metadata: {
				exportDate: new Date().toISOString(),
				exportedBy: req.user.email,
				version: '1.0',
				collections: {
					users: users.length,
					products: products.length,
					orders: orders.length,
					accounts: accounts.length
				}
			},
			data: {
				users,
				products,
				orders,
				accounts
			}
		};

		// Set response headers for file download
		const filename = `database-export-${new Date().toISOString().split('T')[0]}.json`;
		res.setHeader('Content-Type', 'application/json');
		res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

		console.log(`[${new Date().toISOString()}] Database export completed: ${Object.keys(exportData.data).map(k => `${k}: ${exportData.data[k].length}`).join(', ')}`);

		res.json(exportData);
	} catch (error) {
		console.error('Database export error:', error);
		res.status(500).json({
			error: 'Export failed',
			code: 'EXPORT_ERROR',
			message: error.message
		});
	}
});

/**
 * Import data from JSON file
 * POST /api/admin/database/import
 * Admin authentication handled by parent router
 */
router.post('/import', upload.single('dataFile'), async (req, res) => {
	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		if (!req.file) {
			return res.status(400).json({
				error: 'No file uploaded',
				code: 'NO_FILE'
			});
		}

		console.log(`[${new Date().toISOString()}] Database import started by admin: ${req.user.email}`);

		// Parse JSON data
		const importData = JSON.parse(req.file.buffer.toString());

		// Validate import data structure
		if (!importData.data || typeof importData.data !== 'object') {
			return res.status(400).json({
				error: 'Invalid import data format',
				code: 'INVALID_FORMAT'
			});
		}

		const { data } = importData;
		const importResults = {
			users: { imported: 0, skipped: 0, errors: 0 },
			products: { imported: 0, skipped: 0, errors: 0 },
			orders: { imported: 0, skipped: 0, errors: 0 },
			accounts: { imported: 0, skipped: 0, errors: 0 }
		};

		// Import Users (skip existing by email)
		if (data.users && Array.isArray(data.users)) {
			for (const userData of data.users) {
				try {
					const existing = await User.findOne({ email: userData.email }).session(session);
					if (!existing) {
						await User.create([userData], { session });
						importResults.users.imported++;
					} else {
						importResults.users.skipped++;
					}
				} catch (error) {
					console.error('User import error:', error.message);
					importResults.users.errors++;
				}
			}
		}

		// Import Products (skip existing by name)
		if (data.products && Array.isArray(data.products)) {
			for (const productData of data.products) {
				try {
					const existing = await Product.findOne({ name: productData.name }).session(session);
					if (!existing) {
						await Product.create([productData], { session });
						importResults.products.imported++;
					} else {
						importResults.products.skipped++;
					}
				} catch (error) {
					console.error('Product import error:', error.message);
					importResults.products.errors++;
				}
			}
		}

		// Import Orders (skip existing by _id if provided)
		if (data.orders && Array.isArray(data.orders)) {
			for (const orderData of data.orders) {
				try {
					if (orderData._id) {
						const existing = await Order.findById(orderData._id).session(session);
						if (!existing) {
							await Order.create([orderData], { session });
							importResults.orders.imported++;
						} else {
							importResults.orders.skipped++;
						}
					} else {
						await Order.create([orderData], { session });
						importResults.orders.imported++;
					}
				} catch (error) {
					console.error('Order import error:', error.message);
					importResults.orders.errors++;
				}
			}
		}

		// Import Accounts (skip existing by userId)
		if (data.accounts && Array.isArray(data.accounts)) {
			for (const accountData of data.accounts) {
				try {
					const existing = await Account.findOne({ userId: accountData.userId }).session(session);
					if (!existing) {
						await Account.create([accountData], { session });
						importResults.accounts.imported++;
					} else {
						importResults.accounts.skipped++;
					}
				} catch (error) {
					console.error('Account import error:', error.message);
					importResults.accounts.errors++;
				}
			}
		}

		await session.commitTransaction();

		console.log(`[${new Date().toISOString()}] Database import completed:`, importResults);

		res.json({
			success: true,
			message: 'Database import completed',
			results: importResults,
			metadata: {
				importDate: new Date().toISOString(),
				importedBy: req.user.email,
				sourceMetadata: importData.metadata
			}
		});

	} catch (error) {
		await session.abortTransaction();
		console.error('Database import error:', error);

		if (error instanceof SyntaxError) {
			return res.status(400).json({
				error: 'Invalid JSON file',
				code: 'INVALID_JSON',
				message: error.message
			});
		}

		res.status(500).json({
			error: 'Import failed',
			code: 'IMPORT_ERROR',
			message: error.message
		});
	} finally {
		session.endSession();
	}
});

/**
 * Get database statistics
 * GET /api/admin/database/stats
 * Admin authentication handled by parent router
 */
router.get('/stats', async (req, res) => {
	try {
		const [userCount, productCount, orderCount, accountCount] = await Promise.all([
			User.countDocuments({}),
			Product.countDocuments({}),
			Order.countDocuments({}),
			Account.countDocuments({})
		]);

		const stats = {
			collections: {
				users: userCount,
				products: productCount,
				orders: orderCount,
				accounts: accountCount,
				total: userCount + productCount + orderCount + accountCount
			},
			lastUpdated: new Date().toISOString()
		};

		res.json(stats);
	} catch (error) {
		console.error('Database stats error:', error);
		res.status(500).json({
			error: 'Failed to get database statistics',
			code: 'STATS_ERROR'
		});
	}
});

module.exports = router;
