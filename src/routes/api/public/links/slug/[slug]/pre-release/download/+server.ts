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

		// Downloads are only available for download-type pre-releases
		if (!link.isPreRelease || link.accessType === 'stream_only') {
			return new Response('Download not available for this track', { status: 403 });
		}

		// Check gating requirements & cookies
		const isUnlocked = event.cookies.get(`unlocked_pre_release_${link.id}`) === 'true';
		const needsGate =
			link.requiresPassword ||
			link.requiresEmailCapture ||
			Boolean(link.maxAccessCount) ||
			Boolean(link.buyEnabled);

		if (needsGate && !isUnlocked) {
			return new Response('Access denied: Gated pre-release track', { status: 403 });
		}

		// Fetch the audio content from Cloudinary
		const cloudinaryResponse = await fetch(link.audioFileUrl);
		if (!cloudinaryResponse.ok) {
			return new Response('Failed to download audio track', {
				status: cloudinaryResponse.status
			});
		}

		const contentType =
			cloudinaryResponse.headers.get('content-type') || 'application/octet-stream';
		const filename = link.title
			? `${link.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.mp3`
			: 'pre-release.mp3';

		return new Response(cloudinaryResponse.body, {
			headers: {
				'content-type': contentType,
				'content-disposition': `attachment; filename="${filename}"`,
				'cache-control': 'private, no-store',
				'accept-ranges': 'bytes'
			}
		});
	} catch (error) {
		console.error('[PreReleaseDownload] Error downloading audio:', error);
		return new Response('Failed to download audio track', { status: 500 });
	}
};
