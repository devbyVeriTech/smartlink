import type { RequestHandler } from './$types';
import { linkService } from '$lib/services/links';
import { createErrorResponse } from '$lib/server/utils/errors';
import { generateRequestId, logRequest, logResponse } from '$lib/server/middleware/auth';
import { logger } from '$lib/server/utils/logger';
import { json } from '@sveltejs/kit';
import bcrypt from 'bcryptjs';

export const POST: RequestHandler = async (event) => {
	const requestId = generateRequestId();
	logRequest(event, requestId);

	try {
		const slug = event.params.slug;
		if (!slug) {
			return json({ error: 'Slug is required' }, { status: 400 });
		}

		const link = await linkService.getLinkBySlug(slug);
		if (!link) {
			logResponse(event, 404);
			return json({ error: 'Link not found' }, { status: 404 });
		}

		const body = await event.request.json();
		const { email, name, passcode } = body;

		// 1. Password Verification Gate
		if (link.requiresPassword) {
			if (!passcode) {
				return json({ error: 'Passcode is required to unlock this pre-release' }, { status: 401 });
			}

			const isMatch = await bcrypt.compare(passcode, link.passwordHash || '');
			if (!isMatch) {
				return json({ error: 'Incorrect passcode' }, { status: 401 });
			}
		}

		// 2. Email Capture Gate
		if (email) {
			// Basic validation
			if (!email.includes('@')) {
				return json({ error: 'Please enter a valid email address' }, { status: 400 });
			}
			await linkService.capturePreReleaseEmail(link.id, email, name);
			logger.info(`[PreReleaseGate] Email captured for link ${link.id}: ${email}`);
		}

		// 3. Unlock Session Cookie
		event.cookies.set(`unlocked_pre_release_${link.id}`, 'true', {
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 // 1 day unlock duration
		});

		logger.info(`[PreReleaseGate] Successfully unlocked link ${link.id}`);
		logResponse(event, 200);

		return json({ success: true });
	} catch (error: any) {
		console.error('[PreReleaseGate] Error unlocking pre-release link:', error);
		logResponse(event, error?.statusCode || 500);
		const { error: message, status } = createErrorResponse(error);
		return json({ error: message }, { status });
	}
};
