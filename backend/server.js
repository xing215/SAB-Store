require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { auth } = require('./lib/auth');
const { connectDB } = require('./lib/database');
const { toNodeHandler } = require('better-auth/node');



console.log('[DEBUG] CORS_ORIGIN:', process.env.CORS_ORIGIN);
console.log('[DEBUG] NODE_ENV:', process.env.NODE_ENV);
console.log('[DEBUG] All env vars:', Object.keys(process.env).filter(k => k.includes('CORS')));

const app = express();

// Trust proxy configuration - secure setup for rate limiting
// Only trust first proxy (recommended for most deployments)
// Set to false if not behind a proxy, or configure specific trusted IPs
app.set('trust proxy', process.env.NODE_ENV === 'production' ? 1 : false);

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting with secure configuration
const limiter = rateLimit({
	windowMs: 5 * 60 * 1000, // 15 minutes
	max: process.env.NODE_ENV === 'development' ? 1000 : 100, // More restrictive in production
	standardHeaders: true, // Return rate limit info in headers
	legacyHeaders: false, // Disable legacy headers
	// Skip successful requests to static files
	skip: (req) => {
		return req.url.includes('/health') || req.url.includes('/favicon');
	},
	// Custom handler to ensure CORS headers are added to rate limit responses
	handler: (req, res) => {
		// Add CORS headers to rate limit response
		const allowedOrigins = [
			...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(o => o.trim()) : []),
			'https://store.sab.edu.vn',
			'https://api.store.sab.edu.vn',
			'http://localhost:3000',
			'http://127.0.0.1:3000'
		];

		const origin = req.headers.origin;
		if (!origin || allowedOrigins.includes(origin)) {
			res.header('Access-Control-Allow-Origin', origin || '*');
			res.header('Access-Control-Allow-Credentials', 'true');
			res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
			res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie, X-Requested-With');
		}

		console.log(`[RATE LIMIT] Request from ${origin} exceeded rate limit`);
		res.status(429).json({
			error: 'Too many requests, please try again later.',
			retryAfter: Math.round(15 * 60) // 15 minutes in seconds
		});
	}
});
// CORS configuration - Must be before Better Auth handler
const corsOptions = {
	origin: function (origin, callback) {
		// Allow requests with no origin (like mobile apps or curl requests)
		if (!origin) return callback(null, true);

		// Support multiple origins from environment variable (comma-separated)
		const allowedOrigins = [
			...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(o => o.trim()) : []),
			'https://store.sab.edu.vn',
			'https://api.store.sab.edu.vn',
			'http://localhost:3000', // Development
			'http://127.0.0.1:3000'  // Development
		];

		if (allowedOrigins.includes(origin)) {
			return callback(null, true);
		}

		console.warn(`[CORS] Blocked origin: ${origin}`);
		callback(new Error('Not allowed by CORS'));
	},
	credentials: true,
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With'],
	exposedHeaders: ['Set-Cookie'],
	preflightContinue: false,
	optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Handle preflight OPTIONS requests explicitly
app.options('*', (req, res) => {
	res.header('Access-Control-Allow-Origin', req.headers.origin);
	res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
	res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie, X-Requested-With');
	res.header('Access-Control-Allow-Credentials', 'true');
	res.sendStatus(200);
});

app.use('/api', limiter);

// Body parsing middleware - Must be BEFORE Better Auth handler
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global CORS headers middleware for all responses
app.use((req, res, next) => {
	const allowedOrigins = [
		...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(o => o.trim()) : []),
		'https://store.sab.edu.vn',
		'https://api.store.sab.edu.vn',
		'http://localhost:3000',
		'http://127.0.0.1:3000'
	];

	const origin = req.headers.origin;
	if (!origin || allowedOrigins.includes(origin)) {
		res.header('Access-Control-Allow-Origin', origin || '*');
		res.header('Access-Control-Allow-Credentials', 'true');
		res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
		res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie, X-Requested-With');
	}

	next();
});

// Better-auth API routes - Must be AFTER body parsing middleware
app.all('/api/auth/*', toNodeHandler(auth));
// Routes - temporarily disabled for auth testing
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/seller', require('./routes/seller'));

// Health check
app.get('/health', (req, res) => {
	res.status(200).json({
		status: 'OK',
		timestamp: new Date().toISOString(),
		uptime: process.uptime()
	});
});

// CORS test endpoint - no auth required
app.get('/api/test-cors', (req, res) => {
	console.log(`[TEST] CORS test from origin: ${req.headers.origin}`);
	res.json({
		success: true,
		message: 'CORS test successful',
		origin: req.headers.origin,
		timestamp: new Date().toISOString()
	});
});

// CORS test endpoint with PUT method - no auth required
app.put('/api/test-cors', (req, res) => {
	console.log(`[TEST] CORS PUT test from origin: ${req.headers.origin}`);
	res.json({
		success: true,
		message: 'CORS PUT test successful',
		origin: req.headers.origin,
		timestamp: new Date().toISOString(),
		body: req.body
	});
});

// Error handling middleware
app.use((err, req, res, next) => {
	console.error('[ERROR] Unhandled error:', err);
	console.error('[ERROR] Stack trace:', err.stack);
	console.error('[ERROR] Request URL:', req.url);
	console.error('[ERROR] Request method:', req.method);
	console.error('[ERROR] Request origin:', req.headers.origin);

	// Ensure CORS headers are present in error responses
	const allowedOrigins = [
		...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(o => o.trim()) : []),
		'https://store.sab.edu.vn',
		'https://api.store.sab.edu.vn',
		'http://localhost:3000',
		'http://127.0.0.1:3000'
	];

	const origin = req.headers.origin;
	if (!origin || allowedOrigins.includes(origin)) {
		res.header('Access-Control-Allow-Origin', origin || '*');
		res.header('Access-Control-Allow-Credentials', 'true');
		res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
		res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie, X-Requested-With');
	}

	// Send appropriate error response
	res.status(500).json({
		success: false,
		message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
		error: process.env.NODE_ENV === 'development' ? {
			message: err.message,
			stack: err.stack,
			name: err.name
		} : {}
	});
});

// 404 handler
app.use('*', (req, res) => {
	// Ensure CORS headers are present in 404 responses
	const allowedOrigins = [
		...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(o => o.trim()) : []),
		'https://store.sab.edu.vn',
		'https://api.store.sab.edu.vn',
		'http://localhost:3000',
		'http://127.0.0.1:3000'
	];

	const origin = req.headers.origin;
	if (!origin || allowedOrigins.includes(origin)) {
		res.header('Access-Control-Allow-Origin', origin || '*');
		res.header('Access-Control-Allow-Credentials', 'true');
		res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
		res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie, X-Requested-With');
	}

	res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

// Start server with database connection
async function startServer() {
	try {
		// Connect to MongoDB via Mongoose
		await connectDB();

		app.listen(PORT, () => {
			console.log(`🚀 Server running on port ${PORT}`);
			console.log(`📱 Environment: ${process.env.NODE_ENV}`);
			console.log(`🔗 API URL: http://localhost:${PORT}/api`);
		});
	} catch (error) {
		console.error('❌ Failed to start server:', error);
		process.exit(1);
	}
}

startServer();
