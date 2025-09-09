const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../uploads/products');
if (!fs.existsSync(uploadDir)) {
	fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, uploadDir);
	},
	filename: (req, file, cb) => {
		// Generate unique filename
		const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
		const fileExtension = path.extname(file.originalname);
		cb(null, 'product-' + uniqueSuffix + fileExtension);
	}
});

// File filter for images only
const fileFilter = (req, file, cb) => {
	const allowedTypes = /jpeg|jpg|png|gif|webp/;
	const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
	const mimetype = allowedTypes.test(file.mimetype);

	if (mimetype && extname) {
		return cb(null, true);
	} else {
		cb(new Error('Chỉ cho phép upload file hình ảnh (JPG, JPEG, PNG, GIF, WEBP)'));
	}
};

const upload = multer({
	storage: storage,
	limits: {
		fileSize: 200 * 1024 * 1024 // 200MB limit
	},
	fileFilter: fileFilter
});

/**
 * @route   POST /api/upload/image
 * @desc    Upload product image
 * @access  Private (Admin)
 */
router.post('/image', upload.single('image'), (req, res) => {
	try {
		if (!req.file) {
			return res.status(400).json({
				success: false,
				message: 'Không có file được upload'
			});
		}

		// Get base URL from environment or construct from request
		const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
		// Return the full URL to the uploaded image
		const imageUrl = `${baseUrl}/uploads/products/${req.file.filename}`;

		res.json({
			success: true,
			message: 'Upload hình ảnh thành công',
			data: {
				imageUrl: imageUrl,
				filename: req.file.filename,
				originalName: req.file.originalname,
				size: req.file.size
			}
		});

	} catch (error) {
		console.error('Upload image error:', error);
		res.status(500).json({
			success: false,
			message: 'Lỗi server khi upload hình ảnh'
		});
	}
});

/**
 * @route   DELETE /api/upload/image/:filename
 * @desc    Delete uploaded image
 * @access  Private (Admin)
 */
router.delete('/image/:filename', (req, res) => {
	try {
		const { filename } = req.params;
		const filePath = path.join(uploadDir, filename);

		// Check if file exists
		if (!fs.existsSync(filePath)) {
			return res.status(404).json({
				success: false,
				message: 'File không tồn tại'
			});
		}

		// Delete file
		fs.unlinkSync(filePath);

		res.json({
			success: true,
			message: 'Xóa hình ảnh thành công'
		});

	} catch (error) {
		console.error('Delete image error:', error);
		res.status(500).json({
			success: false,
			message: 'Lỗi server khi xóa hình ảnh'
		});
	}
});

module.exports = router;
