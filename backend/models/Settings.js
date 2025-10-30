const mongoose = require('mongoose');

const SETTINGS_KEY = 'payment_config';

const settingsSchema = new mongoose.Schema({
	key: {
		type: String,
		required: true,
		unique: true,
		default: SETTINGS_KEY
	},
	bankNameId: {
		type: String,
		required: true,
		trim: true,
		description: 'Bank ID for VietQR (e.g., MB, VCB, TCB)'
	},
	bankAccountId: {
		type: String,
		required: true,
		trim: true,
		description: 'Bank account number'
	},
	prefixMessage: {
		type: String,
		required: true,
		trim: true,
		default: 'SAB',
		description: 'Prefix for payment messages'
	},
	updatedAt: {
		type: Date,
		default: Date.now
	},
	updatedBy: {
		type: String,
		default: 'system'
	}
}, {
	timestamps: true
});

settingsSchema.pre('save', function (next) {
	this.updatedAt = Date.now();
	next();
});

const Settings = mongoose.model('Settings', settingsSchema);

module.exports = Settings;
