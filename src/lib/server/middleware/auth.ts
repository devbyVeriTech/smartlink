import { logger } from '$lib/server/utils/logger';
import type { RequestEvent } from '@sveltejs/kit';

export function generateRequestId(): string {
	return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function optionalAuth(event: RequestEvent): { id: string } | null {
	return (event.locals.user as { id: string } | null) ?? null;
}

export function logRequest(event: RequestEvent, requestId: string): void {
	const start = Date.now();
	const user = optionalAuth(event);

	logger.apiRequest(event.request.method, event.url.pathname, user?.id, requestId);

	event.locals.requestStart = start;
	event.locals.requestId = requestId;
}

export function logResponse(event: RequestEvent, statusCode: number): void {
	const start = event.locals.requestStart;
	const requestId = event.locals.requestId;
	const user = optionalAuth(event);

	const duration = start ? Date.now() - start : undefined;

	logger.apiResponse(
		event.request.method,
		event.url.pathname,
		statusCode,
		duration,
		user?.id,
		requestId
	);
}
