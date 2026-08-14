export class AppError extends Error {
	public statusCode: number;
	public isOperational: boolean;

	constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
		super(message);
		this.statusCode = statusCode;
		this.isOperational = isOperational;

		Error.captureStackTrace(this, this.constructor);
	}
}

export class ValidationError extends AppError {
	constructor(message: string) {
		super(message, 400);
	}
}

export class NotFoundError extends AppError {
	constructor(message: string = 'Resource not found') {
		super(message, 404);
	}
}

export class UnauthorizedError extends AppError {
	constructor(message: string = 'Unauthorized') {
		super(message, 401);
	}
}

export class ForbiddenError extends AppError {
	constructor(message: string = 'Forbidden') {
		super(message, 403);
	}
}

export class DatabaseError extends AppError {
	constructor(message: string = 'Database operation failed') {
		super(message, 500);
	}
}

export class PaymentError extends AppError {
	constructor(message: string = 'Payment processing failed') {
		super(message, 400);
	}
}

export function handleApiError(error: any): { error: string; statusCode: number } {
	if (error instanceof AppError) {
		return {
			error: error.message,
			statusCode: error.statusCode
		};
	}

	// Log unexpected errors
	console.error('Unexpected error:', error);

	return {
		error: 'Internal server error',
		statusCode: 500
	};
}

export function createErrorResponse(error: any, status?: number) {
	const { error: message, statusCode } = handleApiError(error);
	return {
		error: message,
		status: status || statusCode
	};
}
