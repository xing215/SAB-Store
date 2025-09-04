const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  }
});

const orderSchema = new mongoose.Schema({
  orderCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    length: 5
  },
  studentId: {
    type: String,
    required: [true, 'Mã số sinh viên là bắt buộc'],
    trim: true,
    maxLength: [20, 'Mã số sinh viên không được vượt quá 20 ký tự']
  },
  fullName: {
    type: String,
    required: [true, 'Họ tên là bắt buộc'],
    trim: true,
    maxLength: [100, 'Họ tên không được vượt quá 100 ký tự']
  },
  email: {
    type: String,
    required: [true, 'Email là bắt buộc'],
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email không hợp lệ']
  },
  additionalNote: {
    type: String,
    trim: true,
    maxLength: [500, 'Ghi chú không được vượt quá 500 ký tự']
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['confirmed', 'paid', 'delivered', 'cancelled'],
    default: 'confirmed'
  },
  transactionCode: {
    type: String,
    trim: true,
    maxLength: [50, 'Mã giao dịch không được vượt quá 50 ký tự']
  },
  cancelReason: {
    type: String,
    trim: true,
    maxLength: [500, 'Lý do hủy không được vượt quá 500 ký tự']
  },
  statusUpdatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better search performance
orderSchema.index({ orderCode: 1 });
orderSchema.index({ studentId: 1 });
orderSchema.index({ email: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ fullName: 'text', studentId: 'text', orderCode: 'text' });

// Middleware to update statusUpdatedAt when status changes
orderSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.statusUpdatedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
