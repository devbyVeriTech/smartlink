import type { RequestHandler } from './$types';
import { linkService } from '$lib/services/links';

export const GET: RequestHandler = async (event) => {
	try {
		const slug = event.params.slug;
		if (!slug) {
			return new Response('Slug is required', { status: 400 });
		}

		const link = await linkService.getLinkBySlug(slug);
		if (!link || !link.audioFileUrl) {
			return new Response('Track not found', { status: 404 });
		}

		// Check gating requirements & cookies
		const isUnlocked = event.cookies.get(`unlocked_pre_release_${link.id}`) === 'true';
		
		// If passcode or email capture is required, check if user has unlocked it
		const needsGate = link.requiresPassword || link.isPreRelease;
		
		if (needsGate && !isUnlocked) {
			// Check if they are the owner of the link (allow preview for creators)
			// event.locals.user is set by authentication middleware
			const localsUser = (event.locals as any).user;
			const isOwner = localsUser && localsUser.id === link.userId;
			
			if (!isOwner) {
				return new Response('Access denied: Gated pre-release track', { status: 403 });
			}
		}

		// Prepare range headers to forward to Cloudinary
		const range = event.request.headers.get('range');
		const fetchHeaders: Record<string, string> = {};
		if (range) {
			fetchHeaders['range'] = range;
		}

		// Fetch the audio content from Cloudinary
		const cloudinaryResponse = await fetch(link.audioFileUrl, {
			headers: fetchHeaders
		});

		// Build response headers
		const responseHeaders = new Headers();
		cloudinaryResponse.headers.forEach((value, key) => {
			const lowerKey = key.toLowerCase();
			if (
				lowerKey === 'content-type' ||
				lowerKey === 'content-length' ||
				lowerKey === 'content-range' ||
				lowerKey === 'accept-ranges' ||
				lowerKey === 'cache-control'
			) {
				responseHeaders.set(key, value);
			}
		});

		// Make sure stream content-type is set to audio
		if (!responseHeaders.has('content-type')) {
			responseHeaders.set('content-type', 'audio/mpeg');
		}

		return new Response(cloudinaryResponse.body, {
			status: cloudinaryResponse.status,
			headers: responseHeaders
		});
	} catch (error) {
		console.error('[PreReleaseStream] Error streaming audio:', error);
		return new Response('Failed to stream audio track', { status: 500 });
	}
};
