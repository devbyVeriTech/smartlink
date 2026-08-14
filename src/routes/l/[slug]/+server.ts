import type { RequestHandler } from './$types';
import { linkService } from '$lib/services/links';
import { analyticsService } from '$lib/services/analytics';
import { error, redirect } from '@sveltejs/kit';

function detectPlatform(userAgent: string | undefined): string | undefined {
	if (!userAgent) return undefined;

	const ua = userAgent.toLowerCase();

	if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
		if (ua.includes('instagram')) return 'instagram';
		if (ua.includes('tiktok')) return 'tiktok';
		if (ua.includes('facebook')) return 'facebook';
		if (ua.includes('twitter')) return 'twitter';
		if (ua.includes('snapchat')) return 'snapchat';
		return 'mobile';
	}

	if (ua.includes('windows') || ua.includes('mac') || ua.includes('linux')) {
		return 'desktop';
	}

	return 'other';
}

async function getCountryFromIP(ip: string): Promise<string | undefined> {
	try {
		// In production, you'd use a proper IP geolocation service
		// For now, we'll return undefined or use a simple lookup
		// This is where you'd integrate with services like:
		// - MaxMind GeoIP2
		// - IPGeolocation.io
		// - ip-api.com
		return undefined;
	} catch (error) {
		return undefined;
	}
}

export const GET: RequestHandler = async ({ params, request, getClientAddress }) => {
	try {
		const link = await linkService.getLinkBySlug(params.slug);

		if (!link) {
			throw error(404, 'Link not found');
		}

		// Get user agent and referer
		const userAgent = request.headers.get('user-agent') || undefined;
		const referer = request.headers.get('referer') || undefined;
		const ip = getClientAddress();

		// Detect platform from user agent
		const platform = detectPlatform(userAgent);

		// Get country from IP (placeholder for real geolocation)
		const country = await getCountryFromIP(ip);

		// Record the click with enhanced data
		await analyticsService.recordLinkClick(link.id, {
			clickId: `${link.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			ip,
			userAgent,
			referer,
			platform,
			country
		});

		// Redirect to the primary URL
		throw redirect(302, link.url);
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		console.error('Error handling link redirect:', err);
		throw error(500, 'Internal server error');
	}
};
