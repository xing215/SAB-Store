# Unhandled Error Handling & Advanced Logging

## Overview

Backend đã được bổ sung hệ thống xử lý unhandled errors, graceful shutdown, performance monitoring và request tracking toàn diện.

## Tính năng mới

### 1. Unhandled Exception Handler

Tự động catch và log tất cả uncaught exceptions:

```javascript
process.on('uncaughtException', (error) => {
	ErrorLogger.logUncaughtException(error, 'uncaughtException');
	
	// Shutdown gracefully nếu là non-operational error
	if (!error.isOperational) {
		gracefulShutdown('uncaughtException');
	}
});
```

**Log format:**
```json
{
	"timestamp": "2025-11-21T15:30:45.123Z",
	"level": "CRITICAL",
	"type": "uncaughtException",
	"error": {
		"name": "TypeError",
		"message": "Cannot read property 'x' of undefined",
		"stack": "..."
	},
	"process": {
		"uptime": 3600,
		"memoryUsage": {...},
		"cpuUsage": {...},
		"nodeVersion": "v20.x",
		"platform": "linux",
		"pid": 12345
	}
}
```

### 2. Unhandled Rejection Handler

Catch tất cả unhandled promise rejections:

```javascript
process.on('unhandledRejection', (reason, promise) => {
	ErrorLogger.logUnhandledRejection(reason, promise);
	
	// Production mode sẽ shutdown để đảm bảo stability
	if (process.env.NODE_ENV === 'production') {
		gracefulShutdown('unhandledRejection');
	}
});
```

**Log format:**
```json
{
	"timestamp": "2025-11-21T15:30:45.123Z",
	"level": "CRITICAL",
	"type": "unhandledRejection",
	"reason": "Connection timeout",
	"error": {
		"name": "TimeoutError",
		"message": "Connection timeout",
		"stack": "..."
	},
	"promise": "[object Promise]",
	"process": {
		"uptime": 3600,
		"memoryUsage": {...}
	}
}
```

### 3. Graceful Shutdown

Xử lý shutdown an toàn với cleanup:

```javascript
// Signals: SIGTERM, SIGINT, uncaughtException, unhandledRejection
async function gracefulShutdown(signal) {
	// 1. Log shutdown event
	ErrorLogger.logShutdown(signal);
	
	// 2. Stop accepting new connections
	server.close();
	
	// 3. Close database connections
	await closeDB();
	
	// 4. Exit process
	process.exit(0);
	
	// 5. Force exit after 10s timeout
	setTimeout(() => process.exit(1), 10000);
}
```

**Features:**
- ✅ Graceful connection closure
- ✅ Database cleanup
- ✅ 10s timeout for forced shutdown
- ✅ Detailed shutdown logging
- ✅ Support SIGTERM, SIGINT signals

### 4. Request Logger Middleware

Track tất cả requests với timing và status:

```javascript
app.use(requestLogger);
```

**Features:**
- ✅ Log mọi request với method, url, ip, user agent
- ✅ Track response time
- ✅ Warning cho slow requests (>5s)
- ✅ Warning cho 4xx/5xx responses
- ✅ Debug log cho successful requests

**Log example:**
```
[INFO] 2025-11-21T15:30:45.123Z - Request completed {
	method: 'POST',
	url: '/api/orders',
	statusCode: 201,
	duration: '245ms',
	ip: '192.168.1.1',
	userId: 'user123'
}
```

### 5. Error Rate Limiter

Phát hiện high error rate và cảnh báo:

```javascript
app.use(errorRateLimiter());
```

**Features:**
- ✅ Track error count per IP per error code
- ✅ Time window: 60 seconds
- ✅ Threshold: 100 errors
- ✅ Critical log khi vượt threshold

### 6. Enhanced Health Check

Health check endpoint với metrics chi tiết:

```
GET /health
```

**Response:**
```json
{
	"status": "OK",
	"timestamp": "2025-11-21T15:30:45.123Z",
	"uptime": 3600,
	"memory": {
		"used": 145,
		"total": 512,
		"external": 25
	},
	"cpu": {
		"user": 1234567,
		"system": 234567
	},
	"nodeVersion": "v20.x",
	"pid": 12345,
	"warnings": ["High memory usage detected"]
}
```

### 7. Performance Monitor

Tự động monitor memory và performance:

```javascript
setupProcessMonitoring();
```

**Features:**
- ✅ Check health mỗi 60 giây
- ✅ Track memory usage, CPU, requests, errors
- ✅ Warning khi memory > 80%
- ✅ Critical alert khi memory > 90%
- ✅ Auto garbage collection khi cần
- ✅ Calculate error rate

**Log example:**
```json
{
	"uptime": 3600,
	"memory": {
		"used": 145,
		"total": 512,
		"percentage": "28.32",
		"rss": 234,
		"external": 25
	},
	"cpu": {...},
	"requests": 1234,
	"errors": 12,
	"slowRequests": 5,
	"errorRate": "0.97"
}
```

### 8. Memory Leak Tracking

Optional tracking để detect memory leaks:

```bash
# Enable trong .env
TRACK_MEMORY_LEAKS=true

# Run with --expose-gc flag
node --expose-gc server.js
```

**Features:**
- ✅ Sample memory mỗi 5 phút
- ✅ Track 10 samples gần nhất
- ✅ Detect increasing trend
- ✅ Warning khi tăng > 50MB liên tục

### 9. Process Warning Handler

Log tất cả Node.js warnings:

```javascript
process.on('warning', (warning) => {
	ErrorLogger.logWarning('Process warning detected', {
		name: warning.name,
		message: warning.message,
		stack: warning.stack
	});
});
```

### 10. New ErrorLogger Methods

#### `logCritical(message, error, context)`
Log critical errors với full context:

```javascript
ErrorLogger.logCritical('High memory usage', 
	new Error('Memory threshold exceeded'),
	{ memoryUsage: 95, threshold: 90 }
);
```

#### `logUncaughtException(error, origin)`
Log uncaught exceptions:

```javascript
ErrorLogger.logUncaughtException(error, 'uncaughtException');
```

#### `logUnhandledRejection(reason, promise)`
Log unhandled rejections:

```javascript
ErrorLogger.logUnhandledRejection(reason, promise);
```

#### `logShutdown(signal, context)`
Log shutdown events:

```javascript
ErrorLogger.logShutdown('SIGTERM', {
	activeConnections: 5
});
```

## Configuration

### Environment Variables

```bash
# Enable debug logs
DEBUG=true

# Track memory leaks
TRACK_MEMORY_LEAKS=true

# Node environment
NODE_ENV=production
```

### Run with GC exposure

```bash
# For memory leak tracking
node --expose-gc server.js

# Or in package.json
"start": "node --expose-gc server.js"
```

## Monitoring Integration

### Log Format

Tất cả logs đều ở format JSON, dễ dàng parse cho monitoring tools:

```json
{
	"timestamp": "2025-11-21T15:30:45.123Z",
	"level": "INFO|WARN|CRITICAL",
	"message": "...",
	"context": {...}
}
```

### Compatible với

- ✅ **ELK Stack** (Elasticsearch, Logstash, Kibana)
- ✅ **CloudWatch Logs** (AWS)
- ✅ **Datadog** (APM)
- ✅ **Sentry** (Error tracking)
- ✅ **Grafana** (Metrics visualization)
- ✅ **Prometheus** (Metrics collection)

## Production Recommendations

### 1. Enable PM2 for process management

```bash
pm2 start server.js --name api --instances 4 --log-date-format "YYYY-MM-DD HH:mm:ss Z"
```

### 2. Set up log rotation

```javascript
// pm2 ecosystem.config.js
module.exports = {
	apps: [{
		name: 'api',
		script: 'server.js',
		instances: 4,
		exec_mode: 'cluster',
		max_memory_restart: '1G',
		error_file: './logs/err.log',
		out_file: './logs/out.log',
		log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
	}]
};
```

### 3. Monitor metrics

```bash
# Get health status
curl http://localhost:5000/health

# Monitor logs
tail -f logs/out.log | grep CRITICAL
tail -f logs/out.log | grep "High memory"
```

### 4. Set up alerts

- Memory usage > 80%: Warning
- Memory usage > 90%: Critical
- Error rate > 5%: Warning
- Slow requests > 100: Warning
- Uncaught exceptions: Critical

## Testing

### Test uncaught exception

```javascript
// Add to a route for testing
router.get('/test-error', (req, res) => {
	throw new Error('Test uncaught exception');
});
```

### Test unhandled rejection

```javascript
router.get('/test-rejection', (req, res) => {
	Promise.reject(new Error('Test unhandled rejection'));
	res.json({ ok: true });
});
```

### Test memory warning

```javascript
router.get('/test-memory', (req, res) => {
	const bigArray = new Array(1000000).fill('x'.repeat(1000));
	res.json({ allocated: bigArray.length });
});
```

### Test graceful shutdown

```bash
# Send SIGTERM
kill -TERM <pid>

# Send SIGINT (Ctrl+C)
# Check logs for shutdown sequence
```

## Benefits

### Stability
- ✅ Auto-recovery from errors
- ✅ Graceful shutdown prevents data loss
- ✅ Memory leak detection
- ✅ Error rate limiting

### Observability
- ✅ Full request/response tracking
- ✅ Performance metrics
- ✅ Error tracking with context
- ✅ Health check endpoint

### Debugging
- ✅ Detailed error logs
- ✅ Stack traces
- ✅ Process info
- ✅ Memory snapshots

### Production Ready
- ✅ Auto-restart on critical errors
- ✅ Monitoring integration ready
- ✅ Alert-friendly log format
- ✅ Performance optimized

## Summary

**Files Added:**
- `middleware/logger.js` - Request logging, error rate limiting
- `utils/performanceMonitor.js` - Performance & memory monitoring

**Files Updated:**
- `server.js` - Unhandled error handlers, graceful shutdown
- `start.js` - Process error handlers
- `utils/errorLogger.js` - New logging methods

**New Features:**
- Unhandled exception handler
- Unhandled rejection handler
- Graceful shutdown
- Request logger middleware
- Error rate limiter
- Enhanced health check
- Performance monitor
- Memory leak tracking
- Process warning handler
- 5 new ErrorLogger methods
