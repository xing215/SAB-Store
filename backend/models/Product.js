const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tên sản phẩm là bắt buộc'],
    trim: true,
    maxLength: [100, 'Tên sản phẩm không được vượt quá 100 ký tự']
  },
  description: {
    type: String,
    required: [true, 'Mô tả sản phẩm là bắt buộc'],
    trim: true,
    maxLength: [500, 'Mô tả không được vượt quá 500 ký tự']
  },
  price: {
    type: Number,
    required: [true, 'Giá sản phẩm là bắt buộc'],
    min: [0, 'Giá không được âm']
  },
  image: {
    type: String,
    required: [true, 'Hình ảnh sản phẩm là bắt buộc']
  },
  category: {
    type: String,
    required: [true, 'Danh mục sản phẩm là bắt buộc'],
    enum: ['Đồ ăn', 'Đồ uống', 'Tráng miệng', 'Khác']
  },
  available: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better search performance
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ available: 1 });

module.exports = mongoose.model('Product', productSchema);
