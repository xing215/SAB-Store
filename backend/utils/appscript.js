const axios = require('axios');

const APPSCRIPT_URL = process.env.APPSCRIPT_URL;

/**
 * Gửi dữ liệu đơn hàng lên Google Forms qua App Script
 * @param {Object} orderData - Thông tin đơn hàng
 * @returns {Promise}
 */
async function sendOrderToAppScript(orderData) {
  if (!APPSCRIPT_URL) throw new Error('APPSCRIPT_URL chưa được cấu hình trong biến môi trường');
  return axios.post(APPSCRIPT_URL, orderData);
}

module.exports = { sendOrderToAppScript };
