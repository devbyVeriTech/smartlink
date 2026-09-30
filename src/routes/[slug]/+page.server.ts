import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { linkService } from '$lib/services/links';
import { app } from '$lib/utils/app';
import type { Link } from '$lib/types/social';

/** Trim trailing slash + lowercase origin only (paths are case-sensitive). */
function normalizeUrl(raw: string): string | null {
	try {
		const parsed = new URL(raw.trim());
		if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
		const path = parsed.pathname.replace(/\/+$/, '');
		return `${parsed.origin.toLowerCase()}${path}${parsed.search}`;
	} catch {
		return null;
	}
}

/** True when the URL points back at this landing page (/{slug} on the links domain). */
function isSelfLink(raw: string, slug: string): boolean {
	try {
		const parsed = new URL(raw.trim());
		const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
		const landingHost = new URL(app.linksUrl).hostname.toLowerCase().replace(/^www\./, '');
		const path = parsed.pathname.replace(/\/+$/, '');
		return host === landingHost && path === `/${slug}`;
	} catch {
		return false;
	}
}

/**
 * Ordered list of external destinations for a link: url → spotify → appleMusic →
 * platforms[] → additionalPlatforms[] → other platform columns. Filters invalid,
 * non-http(s), self-referential, and duplicate URLs.
 */
function externalTargets(link: Link, slug: string): string[] {
	const candidates: Array<string | undefined | null> = [
		link.url,
		link.spotify,
		link.appleMusic,
		...(link.platforms ?? []).map((p) => p.url),
		...(link.additionalPlatforms ?? []).map((p) => p.url),
		link.youtube,
		link.soundcloud,
		link.audiomack,
		link.boomplay,
		link.anghami,
		link.napster,
		link.bandcamp,
		link.tidal,
		link.deezer,
		link.amazonMusic,
		link.beatport,
		link.musicbed
	];

	const out: string[] = [];
	const seen = new Set<string>();
	for (const candidate of candidates) {
		if (!candidate) continue;
		const norm = normalizeUrl(candidate);
		if (!norm) continue;
		if (seen.has(norm)) continue;
		if (isSelfLink(candidate, slug)) continue;
		seen.add(norm);
		out.push(candidate.trim());
	}
	return out;
}

function firstArtist(artist: string): string | null {
	const first = artist.split(',')[0]?.trim();
	return first ? first.toLowerCase() : null;
}

export const load: PageServerLoad = async ({ params, url }) => {
	const { slug } = params;

	if (!slug) {
		throw error(400, 'Slug is required');
	}

	// 1. Get the requested link by slug
	let link = await linkService.getLinkBySlug(slug);

	if (!link || !link.isPublic) {
		throw error(404, 'Link not found');
	}

	// 2. Pre-release expiry handling
	const isExpired =
		Boolean(link.isPreRelease) && Boolean(link.expiresAt) && new Date() > new Date(link.expiresAt!);

	if (isExpired) {
		const targets = externalTargets(link, slug);

		// No release identifiers and nowhere to send the fan → bounce off the landing.
		// Fallback chain: artist page on the main app → homepage (never a self-loop).
		if (!link.upc && !link.isrc && targets.length === 0) {
			const artistSlug = link.artist ? firstArtist(link.artist) : null;
			throw redirect(
				302,
				artistSlug ? `${app.mainUrl}/a/${encodeURIComponent(artistSlug)}` : app.mainUrl
			);
		}

		// Stay → release mode. Resolve platform links into the DB once (lazy, like
		// the main app's create-link flow), then pick up the merged result.
		if (!link.platformsResolvedAt && targets.length > 0) {
			try {
				await fetch(`${app.mainUrl}/api/links/${link.id}/resolve-platforms`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					signal: AbortSignal.timeout(8000)
				});
				link = (await linkService.getLinkBySlug(slug)) ?? link;
			} catch (resolveError) {
				console.error('[PreRelease] Platform resolve failed for link', link.id, resolveError);
			}
		}
	}

	// 3. Get related links by the same user (excluding this one) — hide pre-releases from public carousel
	let relatedAlbums = await linkService.getLinksByUserId(link.userId);

	// Filter out the current link, non-public, and all pre-releases (private shares only via direct link)
	relatedAlbums = relatedAlbums.filter((r) => r.id !== link.id && r.isPublic && !r.isPreRelease);

	// Build canonical URL
	const canonicalUrl = new URL(url.pathname, url.origin).href;

	return {
		link,
		relatedAlbums,
		canonicalUrl
	};
};
