import { json, error } from '@sveltejs/kit';

// iTunes Search API interfaces
interface iTunesResult {
	trackId: number;
	trackName: string;
	artistName: string;
	previewUrl: string;
	collectionName: string;
}

interface iTunesResponse {
	resultCount: number;
	results: iTunesResult[];
}

/**
 * Search iTunes for track preview URL
 * Free public API, no auth required
 */
async function searchItunesPreview(artist: string, title: string): Promise<string | null> {
	try {
		const query = encodeURIComponent(`${artist} ${title}`);
		const response = await fetch(
			`https://itunes.apple.com/search?term=${query}&entity=song&limit=1`,
			{ headers: { Accept: 'application/json' } }
		);

		if (!response.ok) return null;

		const data = (await response.json()) as iTunesResponse;
		if (data.resultCount > 0 && data.results[0]?.previewUrl) {
			return data.results[0].previewUrl;
		}
	} catch {
		// Silently fail, preview is optional
	}
	return null;
}

/**
 * Fetch track preview from iTunes Search API
 * Free public API, no authentication required
 */
export async function POST({ request }) {
	try {
		const { artist, title } = await request.json();

		if (!title) {
			throw error(400, 'Title is required');
		}

		const previewUrl = await searchItunesPreview(artist || '', title);

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
