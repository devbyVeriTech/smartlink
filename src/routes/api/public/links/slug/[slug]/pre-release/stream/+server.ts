import type { RequestHandler } from './$types';
import { linkService } from '$lib/services/links';
import { signCdnAudioUrl } from '$lib/server/utils/audio-cdn';

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

		// If passcode, email capture, an access limit, or a pay gate is set, require an unlock cookie
		const needsGate =
			link.requiresPassword ||
			link.requiresEmailCapture ||
			Boolean(link.maxAccessCount) ||
			Boolean(link.buyEnabled);

		if (needsGate && !isUnlocked) {
			return new Response('Access denied: Gated pre-release track', { status: 403 });
		}

		// Prepare range headers to forward to Cloudinary
		const range = event.request.headers.get('range');
		const fetchHeaders: Record<string, string> = {};
		if (range) {
			fetchHeaders['range'] = range;
		}

		// Fetch the audio from the CDN — the R2 bucket is private, so
		// cdn.xoniq.pro requires a short-lived HMAC token on the URL.
		const signedUrl = signCdnAudioUrl(link.audioFileUrl);
		const cloudinaryResponse = await fetch(signedUrl, {
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
