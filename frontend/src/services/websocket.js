import { io } from 'socket.io-client';
import { authClient } from '../lib/auth-client';

class WebSocketService {
	constructor() {
		this.socket = null;
		this.eventListeners = new Map();
		this.connected = false;
		this.reconnectAttempts = 0;
		this.maxReconnectAttempts = 5;
		this.reconnectInterval = 3000;
		this.reconnectTimeout = null;
		this.heartbeatInterval = null;
	}

	async connect() {
		try {
			// Clear any existing reconnect timeout
			if (this.reconnectTimeout) {
				clearTimeout(this.reconnectTimeout);
				this.reconnectTimeout = null;
			}

			// Get current session to ensure user is authenticated
			const session = await authClient.getSession();
			if (!session.data?.user) {
				console.warn('[WS] User not authenticated, cannot connect to WebSocket');
				return false;
			}

			const wsUrl = process.env.NODE_ENV === 'production'
				? 'wss://api.lanyard.sab.edu.vn'
				: 'http://localhost:5000';

			console.log(`[WS] Attempting to connect to: ${wsUrl}`);

			this.socket = io(wsUrl, {
				withCredentials: true,
				transports: ['websocket', 'polling'],
				timeout: 10000,
				forceNew: true
			});

			this.setupEventHandlers();
			return true;
		} catch (error) {
			console.error('[WS] Connection failed:', error);
			this.emit('connectionFailed', error);
			return false;
		}
	}

	setupEventHandlers() {
		if (!this.socket) return;

		this.socket.on('connect', () => {
			console.log('[WS] Connected to WebSocket server');
			this.connected = true;
			this.reconnectAttempts = 0;

			// Trigger connect event for listeners
			this.emit('connected');
		});

		this.socket.on('disconnect', (reason) => {
			console.log(`[WS] Disconnected from WebSocket server: ${reason}`);
			this.connected = false;

			// Trigger disconnect event for listeners
			this.emit('disconnected', reason);

			// Auto-reconnect if not manually disconnected
			if (reason !== 'io client disconnect') {
				this.handleReconnect();
			}
		});

		this.socket.on('connect_error', (error) => {
			console.error('[WS] Connection error:', error.message || 'Unknown error');
			this.connected = false;

			// Emit error event for UI components to handle
			this.emit('connectionError', {
				message: error.message || 'Connection failed',
				attempt: this.reconnectAttempts + 1,
				maxAttempts: this.maxReconnectAttempts
			});

			this.handleReconnect();
		});

		// Order event handlers
		this.socket.on('orderCreated', (data) => {
			console.log('[WS] New order created:', data);
			this.emit('orderCreated', data);
		});

		this.socket.on('orderStatusUpdated', (data) => {
			console.log('[WS] Order status updated:', data);
			this.emit('orderStatusUpdated', data);
		});

		// Ping/pong for connection health
		this.socket.on('pong', () => {
			// Connection is healthy
		});

		// Send periodic ping
		this.startHeartbeat();
	}

	handleReconnect() {
		if (this.reconnectAttempts >= this.maxReconnectAttempts) {
			console.error(`[WS] Max reconnection attempts reached (${this.maxReconnectAttempts})`);
			this.emit('maxReconnectAttemptsReached');
			return;
		}

		this.reconnectAttempts++;
		console.log(`[WS] Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

		// Use exponential backoff for reconnection
		const backoffDelay = Math.min(this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1), 30000);

		this.reconnectTimeout = setTimeout(async () => {
			const success = await this.connect();
			if (!success && this.reconnectAttempts < this.maxReconnectAttempts) {
				// Only continue if we haven't reached max attempts and connection failed
				this.handleReconnect();
			}
		}, backoffDelay);
	}

	startHeartbeat() {
		if (this.heartbeatInterval) {
			clearInterval(this.heartbeatInterval);
		}

		this.heartbeatInterval = setInterval(() => {
			if (this.connected && this.socket) {
				this.socket.emit('ping');
			}
		}, 30000); // Send ping every 30 seconds
	}

	disconnect() {
		if (this.socket) {
			this.socket.disconnect();
			this.socket = null;
		}

		if (this.heartbeatInterval) {
			clearInterval(this.heartbeatInterval);
			this.heartbeatInterval = null;
		}

		if (this.reconnectTimeout) {
			clearTimeout(this.reconnectTimeout);
			this.reconnectTimeout = null;
		}

		this.connected = false;
		this.reconnectAttempts = 0; // Reset reconnect attempts
		console.log('[WS] WebSocket disconnected manually');
	}

	// Event listener management
	on(event, callback) {
		if (!this.eventListeners.has(event)) {
			this.eventListeners.set(event, []);
		}
		this.eventListeners.get(event).push(callback);
	}

	off(event, callback) {
		if (this.eventListeners.has(event)) {
			const listeners = this.eventListeners.get(event);
			const index = listeners.indexOf(callback);
			if (index > -1) {
				listeners.splice(index, 1);
			}
		}
	}

	emit(event, data) {
		if (this.eventListeners.has(event)) {
			this.eventListeners.get(event).forEach(callback => {
				try {
					callback(data);
				} catch (error) {
					console.error(`[WS] Error in event listener for ${event}:`, error);
				}
			});
		}
	}

	// Utility methods
	isConnected() {
		return this.connected && this.socket?.connected;
	}

	getConnectionStatus() {
		return {
			connected: this.connected,
			reconnectAttempts: this.reconnectAttempts,
			socketId: this.socket?.id
		};
	}

	// Reset connection state - useful for retrying after max attempts reached
	resetConnectionState() {
		this.reconnectAttempts = 0;
		this.connected = false;
		if (this.reconnectTimeout) {
			clearTimeout(this.reconnectTimeout);
			this.reconnectTimeout = null;
		}
		console.log('[WS] Connection state reset');
	}

	// Manual retry method
	async retry() {
		this.resetConnectionState();
		return await this.connect();
	}
}

// Create singleton instance
const wsService = new WebSocketService();

export default wsService;
