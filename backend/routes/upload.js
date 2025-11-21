const express = require('express');
const multer = require('multer');
const path = require('path');
const { uploadFile, deleteFile } = require('../lib/minio');
const { validateImageFile, generateSecureFilename, sanitizeFilename, MAX_FILE_SIZE } = require('../utils/fileValidator');
const ErrorLogger = require('../utils/errorLogger');
const router = express.Router();

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
	const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

	if (!allowedMimeTypes.includes(file.mimetype)) {
		return cb(new Error('Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WebP)'));
	}

	cb(null, true);
};

const upload = multer({
	storage: storage,
	limits: {
		fileSize: MAX_FILE_SIZE
	},
	fileFilter: fileFilter
});

router.post('/product-image', upload.single('image'), async (req, res) => {
	try {
		if (!req.file) {
			return res.status(400).json({
				success: false,
				message: 'Không có file nào được tải lên'
			});
		}

		await validateImageFile(req.file);

		const filename = generateSecureFilename(req.file.originalname);
		const objectName = `products/${filename}`;

		await uploadFile(objectName, req.file.buffer, req.file.mimetype);

		const imageUrl = `/uploads/${objectName}`;

		res.json({
			success: true,
			message: 'Tải ảnh thành công',
			imageUrl: imageUrl,
			filename: filename
		});
	} catch (error) {
		console.error('Upload error:', error);

		if (error.message.includes('File signature') ||
			error.message.includes('Invalid') ||
			error.message.includes('exceeds') ||
			error.message.includes('Filename validation')) {
			return res.status(400).json({
				success: false,
				message: error.message
			});
		}

		res.status(500).json({
			success: false,
			message: 'Lỗi server khi tải ảnh',
			error: error.message
		});
	}
});

router.post('/product-images', upload.array('images', 5), async (req, res) => {
	try {
		if (!req.files || req.files.length === 0) {
			return res.status(400).json({
				success: false,
				message: 'Không có file nào được tải lên'
			});
		}

		for (const file of req.files) {
			await validateImageFile(file);
		}

		const imageUrls = [];

		for (const file of req.files) {
			const filename = generateSecureFilename(file.originalname);
			const objectName = `products/${filename}`;

			await uploadFile(objectName, file.buffer, file.mimetype);

			imageUrls.push({
				url: `/uploads/${objectName}`,
				filename: filename
			});
		}

		res.json({
			success: true,
			message: `Tải ${req.files.length} ảnh thành công`,
			images: imageUrls
		});
	} catch (error) {
		ErrorLogger.logRoute(error, 'POST /upload/product-images', req);

		if (error.message.includes('File signature') ||
			error.message.includes('Invalid') ||
			error.message.includes('exceeds') ||
			error.message.includes('Filename validation')) {
			return res.status(400).json({
				success: false,
				message: error.message
			});
		}

		res.status(500).json({
			success: false,
			message: 'Lỗi server khi tải ảnh',
			error: error.message
		});
	}
});

router.delete('/product-image/:filename', async (req, res) => {
	try {
		const filename = sanitizeFilename(req.params.filename);
		const objectName = `products/${filename}`;

		await deleteFile(objectName);

		res.json({
			success: true,
			message: 'Xóa ảnh thành công'
		});
	} catch (error) {
		ErrorLogger.logRoute(error, 'DELETE /upload/product-image/:filename', req);

		if (error.message.includes('Invalid filename')) {
			return res.status(400).json({
				success: false,
				message: 'Tên file không hợp lệ'
			});
		}

		if (error.code === 'NotFound') {
			return res.status(404).json({
				success: false,
				message: 'Không tìm thấy file'
			});
		}

		res.status(500).json({
			success: false,
			message: 'Lỗi server khi xóa ảnh',
			error: error.message
		});
	}
});

module.exports = router;
