const mongoose = require('mongoose');

// Better-auth Account schema
const accountSchema = new mongoose.Schema({
	id: {
		type: String,
		required: true,
		unique: true
	},
	userId: {
		type: String,
		required: true,
		ref: 'User'
	},
	providerId: {
		type: String,
		required: true,
		enum: ['credential', 'google', 'facebook', 'github'] // Add providers as needed
	},
	accountId: {
		type: String,
		required: true
	},
	password: {
		type: String,
		required: function () {
			return this.providerId === 'credential';
		}
	},
	accessToken: {
		type: String,
		default: null
	},
	refreshToken: {
		type: String,
		default: null
	},
	idToken: {
		type: String,
		default: null
	},
	accessTokenExpiresAt: {
		type: Date,
		default: null
	},
	refreshTokenExpiresAt: {
		type: Date,
		default: null
	},
	scope: {
		type: String,
		default: null
	},
	createdAt: {
		type: Date,
		default: Date.now
	},
	updatedAt: {
		type: Date,
		default: Date.now
	}
}, {
	timestamps: true,
	collection: 'account' // Better-auth expects 'account' collection name
});

// Indexes for better-auth queries
accountSchema.index({ userId: 1, providerId: 1 }, { unique: true });
accountSchema.index({ userId: 1 });
accountSchema.index({ providerId: 1 });

// Pre-save middleware to update 'updatedAt'
accountSchema.pre('save', function (next) {
	this.updatedAt = new Date();
	next();
});

module.exports = mongoose.model('Account', accountSchema);
