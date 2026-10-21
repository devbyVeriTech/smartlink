import { json, error } from '@sveltejs/kit';
import { LinkService } from '$lib/services/links';
import {
	collectAppleUrls,
	countryCandidates,
	lookupPreview,
	parseAppleUrl,
	searchPreview
} from '$lib/server/itunes';

/**
 * Resolve the 30s iTunes preview clip for a link.
 *
 * Resolution order (exact before fuzzy):
 *  1. Apple/iTunes track URLs stored on the link → lookup by track id
 *  2. Apple/iTunes album URLs → lookup by album id across storefronts
 *  3. The link's UPC → lookup across storefronts
 *  4. Fuzzy search by artist+title — artist-plausible results only, so a
 *     wrong-artist first hit can never become the preview
 * Nothing matched → previewUrl null ("Preview not available").
 */
export async function POST({ request }) {
	try {
		const { artist, title, slug } = await request.json();

		if (!title) {
			throw error(400, 'Title is required');
		}

		let previewUrl: string | null = null;
		let derivedCountry: string | undefined;

		if (typeof slug === 'string' && slug) {
			const link = await new LinkService().getLinkBySlug(slug);
			if (link) {
				const refs = collectAppleUrls(link)
					.map(parseAppleUrl)
					.filter((r): r is NonNullable<typeof r> => r !== null);
				derivedCountry = refs.find((r) => r.country)?.country;

				const seenTrackIds = new Set<string>();
				for (const ref of refs) {
					if (ref.kind !== 'track' || seenTrackIds.has(ref.id)) continue;
					seenTrackIds.add(ref.id);
					previewUrl = await lookupPreview({
						trackId: ref.id,
						queryArtist: artist,
						queryTitle: title
					});
					if (previewUrl) break;
				}

				if (!previewUrl) {
					for (const ref of refs) {
						if (ref.kind !== 'album') continue;
						previewUrl = await lookupPreview({
							albumId: ref.id,
							countries: countryCandidates(derivedCountry),
							queryArtist: artist,
							queryTitle: title
						});
						if (previewUrl) break;
					}
				}

				if (!previewUrl && link.upc) {
					previewUrl = await lookupPreview({
						upc: link.upc,
						countries: countryCandidates(derivedCountry),
						queryArtist: artist,
						queryTitle: title
					});
				}
			}
		}

		if (!previewUrl) {
			previewUrl = await searchPreview(artist || '', title, countryCandidates(derivedCountry));
		}

		return json({
			success: true,
			previewUrl,
			hasPreview: previewUrl !== null,
			platform: previewUrl ? 'itunes' : null,
			title,
			artist
		});
	} catch (err) {
		if (err instanceof Error && 'status' in err) {
			throw err;
		}
		throw error(500, 'Failed to fetch preview');
	}
}
