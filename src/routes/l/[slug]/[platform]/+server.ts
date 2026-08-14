import type { RequestHandler } from './$types';
import { linkService } from '$lib/services/links';
import { analyticsService } from '$lib/services/analytics';
import { error, redirect } from '@sveltejs/kit';

async function getCountryFromIP(ip: string): Promise<string | undefined> {
	try {
		// In production, you'd use a proper IP geolocation service
		return undefined;
	} catch (error) {
		return undefined;
	}
}

function detectDeviceType(userAgent: string | undefined): string {
	if (!userAgent) return 'other';
	
	const ua = userAgent.toLowerCase();
	if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
		return 'mobile';
	}
	if (ua.includes('tablet') || ua.includes('ipad')) {
		return 'tablet';
	}
	return 'desktop';
}

function detectBrowser(userAgent: string | undefined): string {
	if (!userAgent) return 'other';
	
	const ua = userAgent.toLowerCase();
	if (ua.includes('chrome')) return 'chrome';
	if (ua.includes('firefox')) return 'firefox';
	if (ua.includes('safari')) return 'safari';
	if (ua.includes('edge')) return 'edge';
	return 'other';
}

export const GET: RequestHandler = async ({ params, request, getClientAddress, url }) => {
	try {
		const link = await linkService.getLinkBySlug(params.slug);

		if (!link) {
			throw error(404, 'Link not found');
		}

		// Get user agent and referer
		const userAgent = request.headers.get('user-agent') || undefined;
		const referer = request.headers.get('referer') || undefined;
		const ip = getClientAddress();

		// Get country from IP
		const country = await getCountryFromIP(ip);

		// Determine which platform was clicked based on the URL path
		const pathname = url.pathname;
		let streamingPlatform = 'unknown';
		let redirectUrl = link.url; // Default to primary URL

		// Check which platform was clicked based on the path
		if (pathname.includes('/spotify')) {
			streamingPlatform = 'spotify';
			redirectUrl = link.spotify || link.url;
		} else if (pathname.includes('/apple-music')) {
			streamingPlatform = 'apple_music';
			redirectUrl = link.appleMusic || link.url;
		} else if (pathname.includes('/youtube')) {
			streamingPlatform = 'youtube';
			redirectUrl = link.youtube || link.url;
		} else if (pathname.includes('/soundcloud')) {
			streamingPlatform = 'soundcloud';
			redirectUrl = link.soundcloud || link.url;
		} else if (pathname.includes('/deezer')) {
			streamingPlatform = 'deezer';
			// Check additional platforms for Deezer
			if (link.additionalPlatforms) {
				const deezerPlatform = (link.additionalPlatforms as any[])?.find(p => p.name.toLowerCase() === 'deezer');
				redirectUrl = deezerPlatform?.url || link.url;
			}
		} else if (pathname.includes('/tidal')) {
			streamingPlatform = 'tidal';
			if (link.additionalPlatforms) {
				const tidalPlatform = (link.additionalPlatforms as any[])?.find(p => p.name.toLowerCase() === 'tidal');
				redirectUrl = tidalPlatform?.url || link.url;
			}
		} else if (pathname.includes('/audiomack')) {
			streamingPlatform = 'audiomack';
			if (link.additionalPlatforms) {
				const audiomackPlatform = (link.additionalPlatforms as any[])?.find(p => p.name.toLowerCase() === 'audiomack');
				redirectUrl = audiomackPlatform?.url || link.url;
			}
		} else {
			// Default platform click (main link)
			streamingPlatform = 'primary';
		}

		// Record the click with streaming platform data
		await analyticsService.recordLinkClick(link.id, {
			clickId: `${link.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			ip,
			userAgent,
			referer,
			platform: streamingPlatform, // This now tracks the streaming platform
			country,
			// Also track device info for additional analytics
			deviceType: detectDeviceType(userAgent),
			browser: detectBrowser(userAgent)
		});

		// Redirect to the specific platform URL
		throw redirect(302, redirectUrl);
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		console.error('Error handling platform redirect:', err);
		throw error(500, 'Internal server error');
	}
};
