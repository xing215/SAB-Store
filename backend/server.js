require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { Server } = require('socket.io');
const { auth } = require('./lib/auth');
const { connectDB } = require('./lib/database');
const { toNodeHandler } = require('better-auth/node');


const app = express();
const server = http.createServer(app);

// Trust proxy configuration - secure setup for rate limiting
// Only trust first proxy (recommended for most deployments)
// Set to false if not behind a proxy, or configure specific trusted IPs
app.set('trust proxy', process.env.NODE_ENV === 'production' ? 1 : false);

// Security middleware with CSP configuration for WebSocket support
app.use(helmet({
	contentSecurityPolicy: {
		directives: {
			defaultSrc: ["'self'"],
			connectSrc: [
				"'self'",
				"ws://localhost:5000",
				"wss://localhost:5000",
				"https://localhost:5000",
				"http://localhost:5000",
				"ws://api.store.sab.edu.vn",
				"wss://api.store.sab.edu.vn",
				"https://api.store.sab.edu.vn",
				"https://store.sab.edu.vn"
			],
			scriptSrc: ["'self'", "'unsafe-inline'"],
			styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
			fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
			imgSrc: ["'self'", "data:", "blob:", "https:"],
			manifestSrc: ["'self'"],
			objectSrc: ["'none'"],
			baseUri: ["'self'"],
			formAction: ["'self'"],
			frameAncestors: ["'none'"],
			upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
		}
	}
}));
app.use(compression());

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

// Socket.IO setup with CORS configuration
const io = new Server(server, {
	cors: {
		origin: function (origin, callback) {
			// Allow requests with no origin (like mobile apps)
			if (!origin) return callback(null, true);

			const allowedOrigins = [
				...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(o => o.trim()) : []),
				'https://store.sab.edu.vn',
				'https://api.store.sab.edu.vn',
				'http://localhost:3000',
				'http://127.0.0.1:3000'
			];

			if (allowedOrigins.includes(origin)) {
				return callback(null, true);
			}
			callback(new Error('Not allowed by CORS'));
		},
		credentials: true,
		methods: ['GET', 'POST']
	}
});

// Socket.IO authentication middleware
io.use(async (socket, next) => {
	try {
		// Get session from cookies or token
		const cookies = socket.handshake.headers.cookie;
		if (!cookies) {
			return next(new Error('Authentication required'));
		}

		// Parse cookies and get session
		const cookieObj = {};
		cookies.split(';').forEach(cookie => {
			const [key, value] = cookie.trim().split('=');
			cookieObj[key] = value;
		});

		// Verify session with better-auth
		const session = await auth.api.getSession({
			headers: { cookie: cookies }
		});

		if (!session || !session.user) {
			return next(new Error('Invalid session'));
		}

		// Attach user info to socket
		socket.userId = session.user.id;
		socket.userRole = session.user.role;
		socket.userEmail = session.user.email;

		console.log(`[SOCKET] User connected: ${session.user.email} (${session.user.role})`);
		next();
	} catch (error) {
		console.error('[SOCKET] Authentication error:', error);
		next(new Error('Authentication failed'));
	}
});

// Socket.IO connection handling
io.on('connection', (socket) => {
	console.log(`[SOCKET] Client connected: ${socket.id} (${socket.userEmail})`);

	// Join room based on user role
	if (socket.userRole === 'admin') {
		socket.join('admin');
		socket.join('orders'); // Admins can see all orders
	} else if (socket.userRole === 'seller') {
		socket.join('seller');
		socket.join('orders'); // Sellers can see relevant orders
	} else {
		socket.join('user');
	}

	// Handle disconnection
	socket.on('disconnect', (reason) => {
		console.log(`[SOCKET] Client disconnected: ${socket.id} (${socket.userEmail}) - ${reason}`);
	});

	// Handle ping/pong for connection health
	socket.on('ping', () => {
		socket.emit('pong');
	});
});

// Make io globally available for routes
global.io = io;

// Handle preflight OPTIONS requests explicitly
app.options('*', (req, res) => {
	res.header('Access-Control-Allow-Origin', req.headers.origin);
	res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
	res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie, X-Requested-With');
	res.header('Access-Control-Allow-Credentials', 'true');
	res.sendStatus(200);
});

// Body parsing middleware - Must be BEFORE Better Auth handler
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

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
app.use('/api/combos', require('./routes/combos'));
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

		server.listen(PORT, () => {
			console.log(`[OK] Server running on port ${PORT}`);
			console.log(`[ENV] Environment: ${process.env.NODE_ENV}`);
			console.log(`[API] API URL: http://localhost:${PORT}/api`);
			console.log(`[WS] WebSocket server initialized`);
		});
	} catch (error) {
		console.error('[ERROR] Failed to start server:', error);
		process.exit(1);
	}
}

startServer();
