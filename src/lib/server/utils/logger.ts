type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
	timestamp: string;
	level: LogLevel;
	message: string;
	userId?: string;
	requestId?: string;
	metadata?: Record<string, any>;
}

class Logger {
	private isDevelopment = process.env.NODE_ENV === 'development';

	private formatMessage(entry: LogEntry): string {
		const { timestamp, level, message, userId, requestId, metadata } = entry;

		let formatted = `[${timestamp}] ${level.toUpperCase()}: ${message}`;

		if (userId) formatted += ` (user: ${userId})`;
		if (requestId) formatted += ` (request: ${requestId})`;
		if (metadata) formatted += ` ${JSON.stringify(metadata)}`;

		return formatted;
	}

	private log(
		level: LogLevel,
		message: string,
		metadata?: Record<string, any>,
		userId?: string,
		requestId?: string
	): void {
		const entry: LogEntry = {
			timestamp: new Date().toISOString(),
			level,
			message,
			userId,
			requestId,
			metadata
		};

		const formattedMessage = this.formatMessage(entry);

		switch (level) {
			case 'debug':
				if (this.isDevelopment) console.debug(formattedMessage);
				break;
			case 'info':
				console.info(formattedMessage);
				break;
			case 'warn':
				console.warn(formattedMessage);
				break;
			case 'error':
				console.error(formattedMessage);
				break;
		}

		// In production, you might want to send logs to a service like Sentry, LogRocket, etc.
		if (!this.isDevelopment && level === 'error') {
			// Send to external logging service
			this.sendToExternalService(entry);
		}
	}

	private sendToExternalService(entry: LogEntry): void {
		// Placeholder for external logging service integration
		// Examples: Sentry, LogRocket, DataDog, etc.
		console.log('Would send to external service:', entry);
	}

	debug(
		message: string,
		metadata?: Record<string, any>,
		userId?: string,
		requestId?: string
	): void {
		this.log('debug', message, metadata, userId, requestId);
	}

	info(message: string, metadata?: Record<string, any>, userId?: string, requestId?: string): void {
		this.log('info', message, metadata, userId, requestId);
	}

	warn(message: string, metadata?: Record<string, any>, userId?: string, requestId?: string): void {
		this.log('warn', message, metadata, userId, requestId);
	}

	error(
		message: string,
		metadata?: Record<string, any>,
		userId?: string,
		requestId?: string
	): void {
		this.log('error', message, metadata, userId, requestId);
	}

	// Convenience methods for common operations
	userAction(action: string, userId: string, metadata?: Record<string, any>): void {
		this.info(`User action: ${action}`, metadata, userId);
	}

	apiRequest(method: string, path: string, userId?: string, requestId?: string): void {
		this.debug(`API Request: ${method} ${path}`, undefined, userId, requestId);
	}

	apiResponse(
		method: string,
		path: string,
		statusCode: number,
		duration?: number,
		userId?: string,
		requestId?: string
	): void {
		const metadata = { statusCode, duration };
		this.debug(`API Response: ${method} ${path} - ${statusCode}`, metadata, userId, requestId);
	}

	databaseQuery(query: string, duration?: number, userId?: string): void {
		const metadata = { query, duration };
		this.debug('Database query executed', metadata, userId);
	}

	paymentEvent(event: string, userId?: string, metadata?: Record<string, any>): void {
		this.info(`Payment event: ${event}`, metadata, userId);
	}

	securityEvent(event: string, userId?: string, metadata?: Record<string, any>): void {
		this.warn(`Security event: ${event}`, metadata, userId);
	}
}

// Export singleton instance
export const logger = new Logger();

// Helper function to create request-specific logger
export function createRequestLogger(requestId: string, userId?: string) {
	return {
		debug: (message: string, metadata?: Record<string, any>) =>
			logger.debug(message, metadata, userId, requestId),
		info: (message: string, metadata?: Record<string, any>) =>
			logger.info(message, metadata, userId, requestId),
		warn: (message: string, metadata?: Record<string, any>) =>
			logger.warn(message, metadata, userId, requestId),
		error: (message: string, metadata?: Record<string, any>) =>
			logger.error(message, metadata, userId, requestId)
	};
}
