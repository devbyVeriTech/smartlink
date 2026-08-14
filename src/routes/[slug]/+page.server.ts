import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { linkService } from '$lib/services/links';

export const load: PageServerLoad = async ({ params, url }) => {
	const { slug } = params;

	if (!slug) {
		throw error(400, 'Slug is required');
	}

	// 1. Get the requested link by slug
	const link = await linkService.getLinkBySlug(slug);

	if (!link || !link.isPublic) {
		throw error(404, 'Link not found');
	}

	// 2. Get related links by the same user (excluding this one)
	let relatedAlbums = await linkService.getLinksByUserId(link.userId);

	// Filter out the current link and ensure they are all public
	relatedAlbums = relatedAlbums.filter((r) => r.id !== link.id && r.isPublic);

	// Build canonical URL
	const canonicalUrl = new URL(url.pathname, url.origin).href;

	return {
		link,
		relatedAlbums,
		canonicalUrl
	};
};