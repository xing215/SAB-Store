const express = require('express');
const Settings = require('../../models/Settings');
const { authenticateAdmin } = require('../../middleware/better-auth');
const router = express.Router();

const SETTINGS_KEY = 'payment_config';

router.use(authenticateAdmin);

/**
 * @route   GET /api/admin/settings
 * @desc    Get payment settings
 * @access  Private (Admin only)
 */
router.get('/', async (req, res) => {
	try {
		const settings = await Settings.findOne({ key: SETTINGS_KEY });

		if (!settings) {
			return res.status(404).json({
				success: false,
				message: 'Chưa có cấu hình thanh toán'
			});
		}

		res.json({
			success: true,
			data: {
				bankNameId: settings.bankNameId,
				bankAccountId: settings.bankAccountId,
				prefixMessage: settings.prefixMessage,
				updatedAt: settings.updatedAt,
				updatedBy: settings.updatedBy
			}
		});

	} catch (error) {
		console.error('Error fetching settings:', error);
		res.status(500).json({
			success: false,
			message: 'Lỗi server khi lấy cấu hình'
		});
	}
});

/**
 * @route   PUT /api/admin/settings
 * @desc    Update payment settings
 * @access  Private (Admin only)
 */
router.put('/', async (req, res) => {
	try {
		const { bankNameId, bankAccountId, prefixMessage } = req.body;

		if (!bankNameId || !bankAccountId || !prefixMessage) {
			return res.status(400).json({
				success: false,
				message: 'Vui lòng cung cấp đầy đủ thông tin: bankNameId, bankAccountId, prefixMessage'
			});
		}

		const updateData = {
			bankNameId: bankNameId.trim(),
			bankAccountId: bankAccountId.trim(),
			prefixMessage: prefixMessage.trim(),
			updatedBy: req.admin?.username || 'admin'
		};

		const settings = await Settings.findOneAndUpdate(
			{ key: SETTINGS_KEY },
			updateData,
			{
				new: true,
				upsert: true,
				runValidators: true
			}
		);

		res.json({
			success: true,
			message: 'Cập nhật cấu hình thanh toán thành công',
			data: {
				bankNameId: settings.bankNameId,
				bankAccountId: settings.bankAccountId,
				prefixMessage: settings.prefixMessage,
				updatedAt: settings.updatedAt,
				updatedBy: settings.updatedBy
			}
		});

	} catch (error) {
		console.error('Error updating settings:', error);

		if (error.name === 'ValidationError') {
			return res.status(400).json({
				success: false,
				message: 'Dữ liệu không hợp lệ',
				errors: Object.values(error.errors).map(err => err.message)
			});
		}

		res.status(500).json({
			success: false,
			message: 'Lỗi server khi cập nhật cấu hình'
		});
	}
});

module.exports = router;
