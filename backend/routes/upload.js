const express = require('express');
const multer = require('multer');
const path = require('path');
const { uploadFile, deleteFile } = require('../lib/minio');
const { validateImageFile, generateSecureFilename, sanitizeFilename, MAX_FILE_SIZE } = require('../utils/fileValidator');
const { ErrorResponse, catchAsync } = require('../utils/errorResponse');
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

router.post('/product-image', upload.single('image'), catchAsync(async (req, res) => {
	if (!req.file) {
		throw ErrorResponse.badRequestError('Không có file nào được tải lên');
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
}));

router.post('/product-images', upload.array('images', 5), catchAsync(async (req, res) => {
	if (!req.files || req.files.length === 0) {
		throw ErrorResponse.badRequestError('Không có file nào được tải lên');
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
}));

router.delete('/product-image/:filename', catchAsync(async (req, res) => {
	const filename = sanitizeFilename(req.params.filename);
	const objectName = `products/${filename}`;

	await deleteFile(objectName);

	res.json({
		success: true,
		message: 'Xóa ảnh thành công'
	});
}));

module.exports = router;
