import type { RequestHandler } from './$types';
import { linkService } from '$lib/services/links';
import { json } from '@sveltejs/kit';
import { generateRequestId, logRequest, logResponse } from '$lib/server/middleware/auth';

export const POST: RequestHandler = async (event) => {
	const requestId = generateRequestId();
	logRequest(event, requestId);

	try {
		const slug = event.params.slug;
		if (!slug) {
			logResponse(event, 400);
			return json({ error: 'Slug is required' }, { status: 400 });
		}

		const link = await linkService.getLinkBySlug(slug);
		if (!link) {
			logResponse(event, 404);
			return json({ error: 'Link not found' }, { status: 404 });
		}

		if (!link.isPreRelease || !link.showPlatforms) {
			logResponse(event, 400);
			return json({ error: 'Pre-save is not available for this link' }, { status: 400 });
		}

		const body = await event.request.json();
		const { email } = body;

		if (!email || typeof email !== 'string' || !email.includes('@')) {
			logResponse(event, 400);
			return json({ error: 'Valid email is required' }, { status: 400 });
		}

		await linkService.capturePreReleaseEmail(link.id, email);

		logResponse(event, 200);
		return json({ success: true });
	} catch (error: any) {
		console.error('[presave] Error:', error);
		logResponse(event, 500);
		return json({ error: 'Failed to save email' }, { status: 500 });
	}
};
