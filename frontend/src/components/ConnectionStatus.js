import React, { useState, useEffect } from 'react';
import wsService from '../../services/websocket';

const ConnectionStatus = () => {
	const [status, setStatus] = useState({
		connected: false,
		reconnectAttempts: 0,
		lastError: null
	});

	useEffect(() => {
		const updateStatus = () => {
			const connectionStatus = wsService.getConnectionStatus();
			setStatus({
				connected: connectionStatus.connected,
				reconnectAttempts: connectionStatus.reconnectAttempts,
				lastError: null
			});
		};

		const handleConnectionError = (error) => {
			setStatus(prev => ({
				...prev,
				connected: false,
				lastError: error.message
			}));
		};

		const handleConnected = () => {
			setStatus(prev => ({
				...prev,
				connected: true,
				reconnectAttempts: 0,
				lastError: null
			}));
		};

		const handleDisconnected = () => {
			setStatus(prev => ({
				...prev,
				connected: false
			}));
		};

		// Set up event listeners
		wsService.on('connected', handleConnected);
		wsService.on('disconnected', handleDisconnected);
		wsService.on('connectionError', handleConnectionError);

		// Initial status update
		updateStatus();

		// Update status every 5 seconds
		const interval = setInterval(updateStatus, 5000);

		return () => {
			wsService.off('connected', handleConnected);
			wsService.off('disconnected', handleDisconnected);
			wsService.off('connectionError', handleConnectionError);
			clearInterval(interval);
		};
	}, []);

	const handleRetry = async () => {
		await wsService.retry();
	};

	const getStatusColor = () => {
		if (status.connected) return 'text-green-600';
		if (status.reconnectAttempts > 0) return 'text-yellow-600';
		return 'text-red-600';
	};

	const getStatusIcon = () => {
		if (status.connected) return 'fas fa-circle';
		if (status.reconnectAttempts > 0) return 'fas fa-circle-notch fa-spin';
		return 'fas fa-circle';
	};

	const getStatusText = () => {
		if (status.connected) return 'Đã kết nối';
		if (status.reconnectAttempts > 0) return `Đang kết nối lại (${status.reconnectAttempts}/5)`;
		return 'Mất kết nối';
	};

	return (
		<div className="flex items-center space-x-2 text-sm">
			<i className={`${getStatusIcon()} ${getStatusColor()}`}></i>
			<span className={getStatusColor()}>
				{getStatusText()}
			</span>
			{!status.connected && status.reconnectAttempts === 0 && (
				<button
					onClick={handleRetry}
					className="text-blue-600 hover:text-blue-800 underline text-xs"
					title="Thử kết nối lại"
				>
					Thử lại
				</button>
			)}
		</div>
	);
};

export default ConnectionStatus;
