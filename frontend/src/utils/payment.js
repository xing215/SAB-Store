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
 * Generate payment QR code URL for direct sales
 * @param {number} amount - Payment amount
 * @param {string} orderCode - Order code
 * @param {string} studentId - Student ID
 * @param {string} customerName - Customer name
 * @returns {string} QR code URL
 */
export const generatePaymentQR = (amount, orderCode) => {
  // Payment description for QR
  const description = formatPaymentDescription(orderCode);
  
  const bankId = process.env.REACT_APP_BANK_ID;
  const accountNo = process.env.REACT_APP_ACCOUNT_NO;
  
  if (!bankId || !accountNo) {
    console.error('Bank information not configured in environment variables');
    return null;
  }
  
  // Generate VietQR URL
  const qrData = `https://img.vietqr.io/image/${bankId}-${accountNo}-qr_only.png?amount=${amount}&addInfo=${encodeURIComponent(description)}`;
  
  return qrData;
};

/**
 * Format payment description for QR code
 * @param {string} orderCode - Order code
 * @param {string} studentId - Student ID
 * @param {string} customerName - Customer name
 * @returns {string} Formatted description
 */
export const formatPaymentDescription = (orderCode) => {
  // For direct sales, create TAC format
    const now = new Date();
    const yymmdd = now.toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD
    const hhmmss = now.toTimeString().slice(0, 8).replace(/:/g, ''); // HHMMSS
    const username = localStorage.getItem('sellerInfo') ? 
        JSON.parse(localStorage.getItem('sellerInfo')).username || 'seller' : 'seller';

    return `SAB ${orderCode} TAC ${username} ${yymmdd} ${hhmmss}`;
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
 * Generate VietQR payment URL for orders
 * @param {number} amount - Payment amount
 * @param {string} orderId - Order ID
 * @param {string} studentId - Student ID
 * @param {string} fullName - Customer full name
 * @returns {string} VietQR URL
 */
export const generateOrderPaymentQR = (amount, orderId, studentId, fullName) => {
  const bankId = process.env.REACT_APP_BANK_ID;
  const accountNo = process.env.REACT_APP_ACCOUNT_NO;
  
  if (!bankId || !accountNo) {
    console.error('Bank information not configured in environment variables');
    return null;
  }
  
  const shortName = generateShortName(fullName);
  const description = `SAB ${orderId} ${studentId} ${shortName}`;
  
  const baseUrl = 'https://img.vietqr.io/image';
  const qrUrl = `${baseUrl}/${bankId}-${accountNo}-qr_only.png?amount=${amount}&addInfo=${encodeURIComponent(description)}`;
  
  return qrUrl;
};

/**
 * Format payment description for orders
 * @param {string} orderId - Order ID
 * @param {string} studentId - Student ID
 * @param {string} fullName - Customer full name
 * @returns {string} Formatted description
 */
export const formatOrderPaymentDescription = (orderId, studentId, fullName) => {
  const shortName = generateShortName(fullName);
  return `SAB ${orderId} ${studentId} ${shortName}`;
};
