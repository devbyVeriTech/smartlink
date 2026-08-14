import { linkClientService } from '$lib/services/links-client';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url }) => {
	const { slug } = params;
	try {
		async function loadLink() {
			const loadedLink = await linkClientService.getLinkBySlug(slug);
			if (loadedLink) {
				throw redirect(303, `/${loadedLink.slug}`);
			}
		}
		await loadLink();
		// return;
	} catch (e) {
		throw Error;
	}

	// Build canonical URL
	const canonicalUrl = new URL(url.pathname, url.origin).href;

	return {
		link: {
			slug,
			title: 'Mine',
			artist: 'Cherrydee',
			artwork: 'https://i.scdn.co/image/ab67616d0000b273f14c23cc60dbf36ef13a566a',
			platformIds: {
				spotify: '4uLU6hMCjMI75M1A2tKUQC',
				apple: '1650849708',
				youtube: 'dQw4w9WgXcQ',
				audiomack: 'https://audiomack.com/cherrydee/song/market-smile'
			},
			platforms: [
				{
					id: 'spotify',
					name: 'Spotify',
					url: 'https://open.spotify.com'
				},
				{
					id: 'apple',
					name: 'Apple Music',
					url: 'https://music.apple.com'
				},
				{
					id: 'youtube',
					name: 'YouTube Music',
					url: 'https://music.youtube.com'
				},
				{
					id: 'audiomack',
					name: 'Audiomack',
					url: 'https://audiomack.com'
				}
			]
		},
		canonicalUrl
	};
};
