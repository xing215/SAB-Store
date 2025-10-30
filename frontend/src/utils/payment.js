/**
 * Utility functions for payment processing and direct sales
 */

/**
 * Convert Vietnamese text to ASCII
 * @param {string} text - Vietnamese text to convert
 * @returns {string} ASCII text
 */
export const toAscii = (text) => {
	const vietnameseMap = {
		'à': 'a', 'á': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
		'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
		'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
		'è': 'e', 'é': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
		'ê': 'e', 'ề': 'e', 'ế': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
		'ì': 'i', 'í': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
		'ò': 'o', 'ó': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
		'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
		'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
		'ù': 'u', 'ú': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
		'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
		'ỳ': 'y', 'ý': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y',
		'đ': 'd',
		'À': 'A', 'Á': 'A', 'Ả': 'A', 'Ã': 'A', 'Ạ': 'A',
		'Ă': 'A', 'Ằ': 'A', 'Ắ': 'A', 'Ẳ': 'A', 'Ẵ': 'A', 'Ặ': 'A',
		'Â': 'A', 'Ầ': 'A', 'Ấ': 'A', 'Ẩ': 'A', 'Ẫ': 'A', 'Ậ': 'A',
		'È': 'E', 'É': 'E', 'Ẻ': 'E', 'Ẽ': 'E', 'Ẹ': 'E',
		'Ê': 'E', 'Ề': 'E', 'Ế': 'E', 'Ể': 'E', 'Ễ': 'E', 'Ệ': 'E',
		'Ì': 'I', 'Í': 'I', 'Ỉ': 'I', 'Ĩ': 'I', 'Ị': 'I',
		'Ò': 'O', 'Ó': 'O', 'Ỏ': 'O', 'Õ': 'O', 'Ọ': 'O',
		'Ô': 'O', 'Ồ': 'O', 'Ố': 'O', 'Ổ': 'O', 'Ỗ': 'O', 'Ộ': 'O',
		'Ơ': 'O', 'Ờ': 'O', 'Ớ': 'O', 'Ở': 'O', 'Ỡ': 'O', 'Ợ': 'O',
		'Ù': 'U', 'Ú': 'U', 'Ủ': 'U', 'Ũ': 'U', 'Ụ': 'U',
		'Ư': 'U', 'Ừ': 'U', 'Ứ': 'U', 'Ử': 'U', 'Ữ': 'U', 'Ự': 'U',
		'Ỳ': 'Y', 'Ý': 'Y', 'Ỷ': 'Y', 'Ỹ': 'Y', 'Ỵ': 'Y',
		'Đ': 'D'
	};

	return text.split('').map(char => vietnameseMap[char] || char).join('');
};

/**
 * Format payment description for QR code
 * @param {string} orderCode - Order code
 * @returns {string} Formatted description
 * @deprecated Use backend-generated QR codes instead. This function is DEPRECATED and should not be used.
 */
export const formatPaymentDescription = (orderCode) => {
	console.warn('[DEPRECATED] formatPaymentDescription should not be used. Backend generates payment QR codes.');

	// Fallback implementation (should never be called in production)
	const now = new Date();
	const yymmdd = now.toISOString().slice(2, 10).replace(/-/g, '');
	const hhmmss = now.toTimeString().slice(0, 8).replace(/:/g, '');

	return `SAB ${orderCode} ${yymmdd} ${hhmmss}`;
};

/**
 * Generate short name from full name
 * Example: "Nguyễn Văn Tiến" => "NVTien"
 * @param {string} fullName - Full name
 * @returns {string} Short name in ASCII
 */
export const generateShortName = (fullName) => {
	if (!fullName || typeof fullName !== 'string') {
		return '';
	}

	// Split name into parts and remove empty strings
	const nameParts = fullName.trim().split(/\s+/).filter(part => part.length > 0);

	if (nameParts.length === 0) {
		return '';
	}

	if (nameParts.length === 1) {
		// Single name, return as is (converted to ASCII)
		return toAscii(nameParts[0]);
	}

	// Get first letters of all parts except the last one
	const initials = nameParts.slice(0, -1).map(part => toAscii(part)[0]).join('');

	// Get the last part (surname) converted to ASCII
	const lastName = toAscii(nameParts[nameParts.length - 1]);

	return initials + lastName;
};

/**
 * Format payment description for orders
 * @deprecated This function is deprecated. Payment description is now returned by the API.
 * @param {string} orderId - Order ID
 * @param {string} studentId - Student ID
 * @param {string} fullName - Customer full name
 * @returns {string} Formatted description
 */
export const formatOrderPaymentDescription = (orderId, studentId, fullName) => {
	const shortName = generateShortName(fullName);
	return `SAB ${orderId} ${studentId} ${shortName}`;
};
