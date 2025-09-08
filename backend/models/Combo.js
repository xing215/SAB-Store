const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const categoryRequirementSchema = new mongoose.Schema({
	category: {
		type: String,
		required: [true, 'Danh mục là bắt buộc'],
		trim: true
	},
	quantity: {
		type: Number,
		required: [true, 'Số lượng là bắt buộc'],
		min: [1, 'Số lượng phải >= 1']
	}
});

const comboSchema = new mongoose.Schema({
	name: {
		type: String,
		required: [true, 'Tên combo là bắt buộc'],
		trim: true,
		maxLength: [100, 'Tên combo không được vượt quá 100 ký tự']
	},
	description: {
		type: String,
		trim: true,
		maxLength: [500, 'Mô tả không được vượt quá 500 ký tự']
	},
	price: {
		type: Number,
		required: [true, 'Giá combo là bắt buộc'],
		min: [0, 'Giá không được âm']
	},
	categoryRequirements: {
		type: [categoryRequirementSchema],
		required: [true, 'Yêu cầu danh mục là bắt buộc'],
		validate: {
			validator: function (v) {
				return v && v.length > 0;
			},
			message: 'Combo phải có ít nhất một yêu cầu danh mục'
		}
	},
	isActive: {
		type: Boolean,
		default: true
	},
	priority: {
		type: Number,
		default: 0,
		comment: 'Độ ưu tiên combo, số cao hơn được ưu tiên áp dụng trước'
	}
}, {
	timestamps: true
});

// Index for better performance
comboSchema.index({ isActive: 1 });
comboSchema.index({ priority: -1 });
comboSchema.index({ createdAt: -1 });

// Virtual for total required quantity
comboSchema.virtual('totalRequiredQuantity').get(function () {
	return this.categoryRequirements.reduce((total, req) => total + req.quantity, 0);
});

// Static method to find active combos
comboSchema.statics.findActive = function (filter = {}) {
	return this.find({ ...filter, isActive: true }).sort({ priority: -1, createdAt: -1 });
};

// Method to check if products can satisfy this combo
comboSchema.methods.canApplyToProducts = function (products) {
	const productsByCategory = {};

	// Group products by category
	products.forEach(item => {
		if (!productsByCategory[item.product.category]) {
			productsByCategory[item.product.category] = 0;
		}
		productsByCategory[item.product.category] += item.quantity;
	});

	// Check if all category requirements are met
	return this.categoryRequirements.every(requirement => {
		const availableQuantity = productsByCategory[requirement.category] || 0;
		return availableQuantity >= requirement.quantity;
	});
};

// Method to calculate savings compared to individual product prices
comboSchema.methods.calculateSavings = function (products) {
	const individualTotal = products.reduce((total, item) => {
		return total + (item.product.price * item.quantity);
	}, 0);

	return Math.max(0, individualTotal - this.price);
};

// Add pagination plugin
comboSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Combo', comboSchema);
