require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { auth } = require('./lib/auth');
const { connectDB } = require('./lib/database');
const { toNodeHandler } = require('better-auth/node');



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
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: process.env.NODE_ENV === 'development' ? 1000 : 100, // More restrictive in production
	standardHeaders: true, // Return rate limit info in headers
	legacyHeaders: false, // Disable legacy headers
	// Skip successful requests to static files
	skip: (req) => {
		return req.url.includes('/health') || req.url.includes('/favicon');
	}
});
// CORS configuration - Must be before Better Auth handler
app.use(cors({
	origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
	credentials: true,
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
	exposedHeaders: ['Set-Cookie']
}));

app.use('/api', limiter);

// Better-auth API routes - Must be before express.json() middleware
app.all('/api/auth/*', toNodeHandler(auth));

// Body parsing middleware - Applied AFTER Better Auth handler
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

console.log('✅ Better-auth initialized successfully');

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

// Error handling middleware
app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).json({
		message: 'Something went wrong!',
		error: process.env.NODE_ENV === 'development' ? err.message : {}
	});
});

// 404 handler
app.use('*', (req, res) => {
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
