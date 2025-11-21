const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

// Schema for status history tracking
const statusHistorySchema = new mongoose.Schema({
	status: {
		type: String,
		required: true,
		enum: ['confirmed', 'paid', 'delivered', 'cancelled']
	},
	updatedBy: {
		type: String,
		required: true // Username of who made the change
	},
	updatedAt: {
		type: Date,
		default: Date.now
	},
	transactionCode: {
		type: String,
		trim: true
	},
	cancelReason: {
		type: String,
		trim: true
	},
	note: {
		type: String,
		trim: true,
		maxLength: [500, 'Ghi chú không được vượt quá 500 ký tự']
	}
});

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
	phoneNumber: {
		type: String,
		required: function () {
			return !this.isDirectSale;
		},
		trim: true,
		match: [/^0[0-9]{9}$/, 'Số điện thoại không hợp lệ'],
		maxLength: [10, 'Số điện thoại không được vượt quá 10 ký tự']
	},
	orderCode: {
		type: String,
		required: true,
		unique: true,
		uppercase: true,
		maxLength: 10  // Increased from length: 5 to accommodate both formats
	},
	orderNumber: {
		type: String,
		unique: true,
		sparse: true // Allow null values but enforce uniqueness when present
	},
	studentId: {
		type: String,
		required: function () {
			return !this.isDirectSale;
		},
		trim: true,
		maxLength: [20, 'Mã số sinh viên không được vượt quá 20 ký tự']
	},
	fullName: {
		type: String,
		required: function () {
			return !this.isDirectSale;
		},
		trim: true,
		maxLength: [100, 'Họ tên không được vượt quá 100 ký tự']
	},
	email: {
		type: String,
		required: function () {
			return !this.isDirectSale;
		},
		trim: true,
		lowercase: true,
		validate: {
			validator: function (v) {
				// Skip validation for direct sales or empty values
				if (this.isDirectSale || !v) return true;
				return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
			},
			message: 'Email không hợp lệ'
		}
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
		enum: ['pending', 'confirmed', 'paid', 'delivered', 'cancelled'],
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
	statusHistory: [statusHistorySchema], // Track all status changes
	lastUpdatedBy: {
		type: String,
		default: 'system' // Username of who last updated the order
	},
	statusUpdatedAt: {
		type: Date,
		default: Date.now
	},
	// Direct sale specific fields
	isDirectSale: {
		type: Boolean,
		default: false
	},
	createdBy: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User'
	},
	// Combo pricing information
	comboInfo: {
		type: mongoose.Schema.Types.Mixed,
		default: null
	}
}, {
	timestamps: true
});

// Indexes for better search performance  
// Note: orderCode and orderNumber already have unique indexes from schema definition
orderSchema.index({ studentId: 1 });
orderSchema.index({ email: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ isDirectSale: 1 });
orderSchema.index({ fullName: 'text', studentId: 'text', orderCode: 'text', orderNumber: 'text' });

// Middleware to update statusUpdatedAt and track status history when status changes
orderSchema.pre('save', function (next) {
	if (this.isModified('status')) {
		this.statusUpdatedAt = new Date();

		// Add to status history if this is not a new document
		if (!this.isNew) {
			const historyEntry = {
				status: this.status,
				updatedBy: this.lastUpdatedBy || 'system',
				updatedAt: new Date()
			};

			// Add transaction code if status is paid
			if (this.status === 'paid' && this.transactionCode) {
				historyEntry.transactionCode = this.transactionCode;
			}

			// Add cancel reason if status is cancelled
			if (this.status === 'cancelled' && this.cancelReason) {
				historyEntry.cancelReason = this.cancelReason;
			}

			this.statusHistory.push(historyEntry);
		}
	}
	next();
});

orderSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('Order', orderSchema);
