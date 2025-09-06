#!/usr/bin/env node

const { spawn } = require('child_process');
const { connectDB } = require('./lib/database');

async function waitForMongoDB() {
	console.log('Waiting for MongoDB to be ready...');
	const maxRetries = 30;
	let retries = 0;

	while (retries < maxRetries) {
		try {
			await connectDB();
			console.log('✅ MongoDB is ready');
			return true;
		} catch (error) {
			retries++;
			console.log(`MongoDB not ready, retrying... (${retries}/${maxRetries})`);
			await new Promise(resolve => setTimeout(resolve, 2000));
		}
	}

	throw new Error('MongoDB failed to become ready within timeout');
}

async function initializeDatabase() {
	console.log('Initializing database...');

	return new Promise((resolve, reject) => {
		const initProcess = spawn('node', ['init-database.js'], {
			stdio: 'inherit',
			env: process.env
		});

		initProcess.on('close', (code) => {
			if (code === 0) {
				console.log('✅ Database initialized successfully');
				resolve();
			} else {
				console.log('⚠️  Database initialization completed with warnings or was skipped');
				resolve(); // Don't fail if init has warnings
			}
		});

		initProcess.on('error', (error) => {
			console.error('❌ Database initialization error:', error);
			reject(error);
		});
	});
}

async function startServer() {
	console.log('Starting server...');

	const serverProcess = spawn('node', ['server.js'], {
		stdio: 'inherit',
		env: process.env
	});

	serverProcess.on('error', (error) => {
		console.error('❌ Server start error:', error);
		process.exit(1);
	});

	// Forward signals to server process
	process.on('SIGTERM', () => serverProcess.kill('SIGTERM'));
	process.on('SIGINT', () => serverProcess.kill('SIGINT'));
}

async function main() {
	try {
		await waitForMongoDB();
		await initializeDatabase();
		await startServer();
	} catch (error) {
		console.error('❌ Startup failed:', error);
		process.exit(1);
	}
}

main();
