const express = require('express');
const multer = require('multer');
const path = require('path');
const { uploadFile, deleteFile } = require('../lib/minio');
const router = express.Router();

const storage = multer.memoryStorage();

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
		fileSize: 200 * 1024 * 1024
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

		const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
		const ext = path.extname(req.file.originalname);
		const filename = `image-${uniqueSuffix}${ext}`;
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

		const imageUrls = [];

		for (const file of req.files) {
			const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
			const ext = path.extname(file.originalname);
			const filename = `image-${uniqueSuffix}${ext}`;
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
		console.error('Upload error:', error);
		res.status(500).json({
			success: false,
			message: 'Lỗi server khi tải ảnh',
			error: error.message
		});
	}
});

router.delete('/product-image/:filename', async (req, res) => {
	try {
		const filename = req.params.filename;
		const objectName = `products/${filename}`;

		await deleteFile(objectName);

		res.json({
			success: true,
			message: 'Xóa ảnh thành công'
		});
	} catch (error) {
		console.error('Delete error:', error);

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
