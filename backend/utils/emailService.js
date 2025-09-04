const nodemailer = require('nodemailer');
const { formatCurrency, formatDate } = require('./helpers');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

/**
 * Generate order confirmation email HTML
 * @param {Object} order - Order data
 * @returns {string} HTML content
 */
const generateOrderEmailHTML = (order) => {
  const itemsHTML = order.items.map(item => `
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 10px; text-align: left;">${item.productName}</td>
      <td style="padding: 10px; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; text-align: right;">${formatCurrency(item.price)}</td>
      <td style="padding: 10px; text-align: right; font-weight: bold;">${formatCurrency(item.price * item.quantity)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Xác nhận đơn hàng</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 30px; }
        .order-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .order-info h3 { margin-top: 0; color: #495057; }
        .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .table th { background: #e9ecef; padding: 12px; text-align: left; font-weight: bold; }
        .table td { padding: 10px; border-bottom: 1px solid #dee2e6; }
        .total { background: #28a745; color: white; font-weight: bold; font-size: 18px; }
        .footer { background: #6c757d; color: white; padding: 20px; text-align: center; font-size: 14px; }
        .order-code { background: #ffc107; color: #212529; padding: 10px 20px; border-radius: 5px; font-weight: bold; font-size: 24px; display: inline-block; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Xác nhận đơn hàng</h1>
          <p>Cảm ơn bạn đã đặt hàng!</p>
        </div>
        
        <div class="content">
          <div class="order-info">
            <h3>📋 Thông tin đơn hàng</h3>
            <p><strong>Mã đơn hàng:</strong> <span class="order-code">${order.orderCode}</span></p>
            <p><strong>Ngày đặt:</strong> ${formatDate(order.createdAt)}</p>
            <p><strong>Trạng thái:</strong> <span style="color: #28a745; font-weight: bold;">Đã xác nhận</span></p>
          </div>

          <div class="order-info">
            <h3>👤 Thông tin khách hàng</h3>
            <p><strong>Họ tên:</strong> ${order.fullName}</p>
            <p><strong>Mã số sinh viên:</strong> ${order.studentId}</p>
            <p><strong>Email:</strong> ${order.email}</p>
            ${order.additionalNote ? `<p><strong>Ghi chú:</strong> ${order.additionalNote}</p>` : ''}
          </div>

          <h3>🛍️ Chi tiết đơn hàng</h3>
          <table class="table">
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th style="text-align: center;">Số lượng</th>
                <th style="text-align: right;">Đơn giá</th>
                <th style="text-align: right;">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
              <tr class="total">
                <td colspan="3" style="text-align: right; padding: 15px;"><strong>Tổng cộng:</strong></td>
                <td style="text-align: right; padding: 15px;"><strong>${formatCurrency(order.totalAmount)}</strong></td>
              </tr>
            </tbody>
          </table>

          <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #1976d2;">📞 Hỗ trợ khách hàng</h4>
            <p>Nếu bạn có bất kỳ câu hỏi nào về đơn hàng, vui lòng liên hệ:</p>
            <p>📧 Email: support@minipreorder.com</p>
            <p>📱 Hotline: 0123 456 789</p>
          </div>
        </div>

        <div class="footer">
          <p>&copy; 2024 Mini Preorder System. Tất cả quyền được bảo lưu.</p>
          <p>Email này được gửi tự động, vui lòng không trả lời.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Send order confirmation email
 * @param {Object} order - Order data
 * @returns {Promise}
 */
const sendOrderConfirmationEmail = async (order) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠️ Email configuration not found. Skipping email send.');
    return { success: false, message: 'Email not configured' };
  }

  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: {
        name: 'Mini Preorder System',
        address: process.env.EMAIL_USER
      },
      to: order.email,
      subject: `✅ Xác nhận đơn hàng #${order.orderCode} - Mini Preorder`,
      html: generateOrderEmailHTML(order),
      text: `
Xin chào ${order.fullName},

Cảm ơn bạn đã đặt hàng tại Mini Preorder System!

Thông tin đơn hàng:
- Mã đơn hàng: ${order.orderCode}
- Ngày đặt: ${formatDate(order.createdAt)}
- Tổng tiền: ${formatCurrency(order.totalAmount)}

Chi tiết sản phẩm:
${order.items.map(item => `- ${item.productName} x${item.quantity}: ${formatCurrency(item.price * item.quantity)}`).join('\n')}

Đơn hàng của bạn đã được xác nhận và đang được xử lý.

Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!

Mini Preorder System
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Order confirmation email sent to ${order.email}`);
    return { success: true, message: 'Email sent successfully' };
    
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Test email configuration
 * @returns {Promise}
 */
const testEmailConnection = async () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return { success: false, message: 'Email configuration not found' };
  }

  try {
    const transporter = createTransporter();
    await transporter.verify();
    return { success: true, message: 'Email configuration is valid' };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

module.exports = {
  sendOrderConfirmationEmail,
  testEmailConnection,
  generateOrderEmailHTML
};
