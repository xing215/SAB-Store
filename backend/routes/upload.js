const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '..', 'uploads', 'products');
if (!fs.existsSync(uploadDir)) {
	fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, uploadDir);
	},
	filename: (req, file, cb) => {
		// Generate unique filename with timestamp
		const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
		const ext = path.extname(file.originalname);
		cb(null, file.fieldname + '-' + uniqueSuffix + ext);
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
		cb(new Error('Chỉ chấp nhận file ảnh (JPEG, JPG, PNG, GIF, WebP)'));
	}
};

const upload = multer({
	storage: storage,
	limits: {
		fileSize: 200 * 1024 * 1024 // 200MB limit
	},
	fileFilter: fileFilter
});

// Upload single product image
router.post('/product-image', upload.single('image'), (req, res) => {
	try {
		if (!req.file) {
			return res.status(400).json({
				success: false,
				message: 'Không có file nào được tải lên'
			});
		}

		const imageUrl = `/uploads/products/${req.file.filename}`;

		res.json({
			success: true,
			message: 'Tải ảnh thành công',
			imageUrl: imageUrl,
			filename: req.file.filename
		});
	} catch (error) {
		console.error('Upload error:', error);
		res.status(500).json({
			success: false,
			message: 'Lỗi server khi tải ảnh',
			error: error.message
		});
	}
});

// Upload multiple product images
router.post('/product-images', upload.array('images', 5), (req, res) => {
	try {
		if (!req.files || req.files.length === 0) {
			return res.status(400).json({
				success: false,
				message: 'Không có file nào được tải lên'
			});
		}

		const imageUrls = req.files.map(file => ({
			url: `/uploads/products/${file.filename}`,
			filename: file.filename
		}));

		res.json({
			success: true,
			message: `Tải ${req.files.length} ảnh thành công`,
			images: imageUrls
		});
	} catch (error) {
		console.error('Upload error:', error);
		res.status(500).json({
			success: false,
			message: 'Lỗi server khi tải ảnh',
			error: error.message
		});
	}
});

// Delete uploaded image
router.delete('/product-image/:filename', (req, res) => {
	try {
		const filename = req.params.filename;
		const filePath = path.join(uploadDir, filename);

		if (fs.existsSync(filePath)) {
			fs.unlinkSync(filePath);
			res.json({
				success: true,
				message: 'Xóa ảnh thành công'
			});
		} else {
			res.status(404).json({
				success: false,
				message: 'Không tìm thấy file'
			});
		}
	} catch (error) {
		console.error('Delete error:', error);
		res.status(500).json({
			success: false,
			message: 'Lỗi server khi xóa ảnh',
			error: error.message
		});
	}
});

module.exports = router;
