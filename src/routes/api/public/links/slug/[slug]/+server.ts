import type { RequestHandler } from './$types';
import { linkService } from '$lib/services/links';
import { createErrorResponse } from '$lib/server/utils/errors';
import { generateRequestId, logRequest, logResponse } from '$lib/server/middleware/auth';
import { logger } from '$lib/server/utils/logger';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async (event) => {
	const requestId = generateRequestId();
	logRequest(event, requestId);

	try {
		const slug = event.params.slug;
		
		if (!slug) {
			return json({ error: 'Slug is required' }, { status: 400 });
		}

		// Get link by slug without authentication (public access)
		const link = await linkService.getLinkBySlug(slug);

		if (!link) {
			logResponse(event, 404);
			return json({ error: 'Link not found' }, { status: 404 });
		}

		// Additional check: ensure link is public
		if (!link.isPublic) {
			logResponse(event, 404);
			return json({ error: 'Link not found' }, { status: 404 });
		}

		logResponse(event, 200);
		return json({ link });
	} catch (error: any) {
		logResponse(event, error?.statusCode || 500);
		const { error: message, status } = createErrorResponse(error);
		return json({ error: message }, { status });
	}
};
