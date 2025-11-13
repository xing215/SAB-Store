const express = require('express');
const ExcelJS = require('exceljs');
const Order = require('../../models/Order');
const { formatDate, formatCurrency } = require('../../utils/helpers');
const router = express.Router();

/**
 * Helper function to get status text in Vietnamese
 */
function getStatusText(status) {
	const statusMap = {
		'confirmed': 'Đã xác nhận',
		'paid': 'Đã thanh toán',
		'delivered': 'Đã giao hàng',
		'cancelled': 'Đã hủy'
	};
	return statusMap[status] || status;
}

/**
 * @route   GET /api/admin/orders/export/excel
 * @desc    Export orders to Excel
 * @access  Private (Admin authentication handled by parent router)
 */
router.get('/excel', async (req, res) => {
	try {
		const { status, search, startDate, endDate } = req.query;

		// Build query
		let query = {};

		if (status && status !== 'all') {
			query.status = status;
		}

		if (search) {
			query.$or = [
				{ orderCode: { $regex: search, $options: 'i' } },
				{ studentId: { $regex: search, $options: 'i' } },
				{ fullName: { $regex: search, $options: 'i' } },
				{ email: { $regex: search, $options: 'i' } }
			];
		}

		if (startDate || endDate) {
			query.createdAt = {};
			if (startDate) query.createdAt.$gte = new Date(startDate);
			if (endDate) query.createdAt.$lte = new Date(endDate);
		}

		// Get orders
		const orders = await Order.find(query).sort({ createdAt: -1 }).lean();

		// Create workbook
		const workbook = new ExcelJS.Workbook();
		const worksheet = workbook.addWorksheet('Đơn hàng');

		// Define columns
		worksheet.columns = [
			{ header: 'Mã vé', key: 'orderCode', width: 15 },
			{ header: 'Mã số sinh viên', key: 'studentId', width: 20 },
			{ header: 'Họ tên', key: 'fullName', width: 25 },
			{ header: 'Email', key: 'email', width: 30 },
			{ header: 'Số điện thoại', key: 'phoneNumber', width: 15 },
			{ header: 'Tổng tiền', key: 'totalAmount', width: 15 },
			{ header: 'Trạng thái', key: 'status', width: 15 },
			{ header: 'Ngày đặt', key: 'createdAt', width: 20 },
			{ header: 'Ngày cập nhật', key: 'statusUpdatedAt', width: 20 },
			{ header: 'Mã giao dịch', key: 'transactionCode', width: 15 },
			{ header: 'Lý do hủy', key: 'cancelReason', width: 30 },
			{ header: 'Ghi chú', key: 'additionalNote', width: 30 },
			{ header: 'Chi tiết sản phẩm', key: 'itemDetails', width: 50 }
		];

		// Style header row
		worksheet.getRow(1).font = { bold: true };
		worksheet.getRow(1).fill = {
			type: 'pattern',
			pattern: 'solid',
			fgColor: { argb: 'FFE3F2FD' }
		};

		// Add data
		orders.forEach(order => {
			const itemDetails = order.items.map(item =>
				`${item.productName} x${item.quantity} = ${formatCurrency(item.price * item.quantity)}`
			).join('\n');

			worksheet.addRow({
				orderCode: order.orderCode,
				studentId: order.studentId || '',
				fullName: order.fullName || '',
				email: order.email || '',
				phoneNumber: order.phoneNumber || '',
				totalAmount: formatCurrency(order.totalAmount),
				status: getStatusText(order.status),
				createdAt: formatDate(order.createdAt),
				statusUpdatedAt: order.statusUpdatedAt ? formatDate(order.statusUpdatedAt) : '',
				transactionCode: order.transactionCode || '',
				cancelReason: order.cancelReason || '',
				additionalNote: order.additionalNote || '',
				itemDetails
			});
		});

		// Generate buffer
		const buffer = await workbook.xlsx.writeBuffer();

		// Set headers for file download
		const filename = `don-hang-${new Date().toISOString().split('T')[0]}.xlsx`;
		res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
		res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

		res.send(buffer);

	} catch (error) {
		console.error('Error exporting orders:', error);
		res.status(500).json({
			success: false,
			message: 'Lỗi server khi xuất file Excel'
		});
	}
});

module.exports = router;
