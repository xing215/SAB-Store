const mongoose = require('mongoose');
require('dotenv').config();

let isConnected = false;

async function connectDB() {
	if (isConnected) {
		console.log('MongoDB already connected via Mongoose');
		return mongoose.connection;
	}

	try {
		const mongoUri = process.env.MONGODB_URI;
		if (!mongoUri) {
			throw new Error('MONGODB_URI environment variable is required');
		}

		await mongoose.connect(mongoUri, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		});

		isConnected = true;
		console.log('✅ MongoDB connected successfully via Mongoose');

		// Handle connection events
		mongoose.connection.on('error', (err) => {
			console.error('MongoDB connection error:', err);
			isConnected = false;
		});

		mongoose.connection.on('disconnected', () => {
			console.log('MongoDB disconnected');
			isConnected = false;
		});

		return mongoose.connection;
	} catch (error) {
		console.error('MongoDB connection failed:', error);
		isConnected = false;
		throw error;
	}
}

function getDb() {
	if (!isConnected || !mongoose.connection.db) {
		throw new Error('Database not connected. Call connectDB() first.');
	}
	return mongoose.connection.db;
}

function closeDB() {
	return mongoose.connection.close();
}

module.exports = { connectDB, getDb, closeDB };