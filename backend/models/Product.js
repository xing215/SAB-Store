const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

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
  imageUrl: {
    type: String
  },
  category: {
    type: String,
    required: [true, 'Danh mục sản phẩm là bắt buộc']
  },
  available: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  stockQuantity: {
    type: Number,
    default: 0,
    min: [0, 'Số lượng tồn kho không được âm']
  },
  minOrderQuantity: {
    type: Number,
    default: 1,
    min: [1, 'Số lượng đặt hàng tối thiểu phải >= 1']
  },
  maxOrderQuantity: {
    type: Number,
    default: null
  },
  sku: {
    type: String,
    trim: true,
    unique: true,
    sparse: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  weight: {
    type: Number,
    min: [0, 'Trọng lượng không được âm']
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number
  },
  featured: {
    type: Boolean,
    default: false
  },
  salePrice: {
    type: Number,
    min: [0, 'Giá khuyến mãi không được âm']
  },
  saleStartDate: {
    type: Date
  },
  saleEndDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for better search performance
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ available: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ featured: 1 });
productSchema.index({ createdAt: -1 });

// Virtual for current price (considering sale)
productSchema.virtual('currentPrice').get(function() {
  const now = new Date();
  if (this.salePrice && 
      this.saleStartDate && 
      this.saleEndDate && 
      now >= this.saleStartDate && 
      now <= this.saleEndDate) {
    return this.salePrice;
  }
  return this.price;
});

// Virtual for sale status
productSchema.virtual('onSale').get(function() {
  const now = new Date();
  return !!(this.salePrice && 
           this.saleStartDate && 
           this.saleEndDate && 
           now >= this.saleStartDate && 
           now <= this.saleEndDate);
});

// Virtual for stock status
productSchema.virtual('inStock').get(function() {
  return this.stockQuantity > 0;
});

// Static method to find active products
productSchema.statics.findActive = function(filter = {}) {
  return this.find({ ...filter, isActive: true, available: true });
};

// Static method to find featured products
productSchema.statics.findFeatured = function(limit = 6) {
  return this.find({ 
    isActive: true, 
    available: true, 
    featured: true 
  }).limit(limit);
};

// Add pagination plugin
productSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Product', productSchema);
