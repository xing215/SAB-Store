const mongoose = require('mongoose');
require('dotenv').config();
const ErrorLogger = require('../utils/errorLogger');

let isConnected = false;

async function connectDB() {
	if (isConnected) {
		ErrorLogger.logInfo('MongoDB already connected via Mongoose');
		return mongoose.connection;
	}

	try {
		const mongoUri = process.env.MONGODB_URI;
		if (!mongoUri) {
			const error = new Error('MONGODB_URI environment variable is required');
			ErrorLogger.logDatabase('connect', error, { step: 'validation' });
			throw error;
		}

		ErrorLogger.logInfo('Connecting to MongoDB...', {
			host: mongoUri.split('@')[1]?.split('/')[0] || 'unknown'
		});

		await mongoose.connect(mongoUri);

		isConnected = true;
		ErrorLogger.logInfo('[OK] MongoDB connected successfully via Mongoose', {
			readyState: mongoose.connection.readyState
		});

		mongoose.connection.on('error', (err) => {
			ErrorLogger.logDatabase('connection_error', err, {
				readyState: mongoose.connection.readyState
			});
			isConnected = false;
		});

		mongoose.connection.on('disconnected', () => {
			ErrorLogger.logWarning('MongoDB disconnected', {
				readyState: mongoose.connection.readyState
			});
			isConnected = false;
		});

		mongoose.connection.on('reconnected', () => {
			ErrorLogger.logInfo('MongoDB reconnected', {
				readyState: mongoose.connection.readyState
			});
			isConnected = true;
		});

		return mongoose.connection;
	} catch (error) {
		ErrorLogger.logDatabase('connect', error, {
			mongoUri: process.env.MONGODB_URI ? 'configured' : 'missing',
			step: 'connection'
		});
		isConnected = false;
		throw error;
	}
}

function getDb() {
	if (!isConnected || !mongoose.connection.db) {
		const error = new Error('Database not connected. Call connectDB() first.');
		ErrorLogger.logDatabase('getDb', error, {
			isConnected,
			readyState: mongoose.connection.readyState
		});
		throw error;
	}
	return mongoose.connection.db;
}

function closeDB() {
	return mongoose.connection.close();
}

module.exports = { connectDB, getDb, closeDB };