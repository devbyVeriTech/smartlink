import type { Link } from '$lib/types/social';

/** Loose iTunes lookup/search payload — fields vary per result kind. */
export interface ItunesResultItem {
	wrapperType?: string;
	trackId?: number;
	trackName?: string;
	artistName?: string;
	collectionName?: string;
	previewUrl?: string;
}

export interface AppleIdRef {
	id: string;
	kind: 'track' | 'album';
	country?: string;
}

const APPLE_HOST = /^(?:geo\.)?(?:music|itunes)\.apple\.com$/i;
const COUNTRY_IN_PATH = /^\/([a-z]{2})\//i;

/**
 * Extract an iTunes catalog id (track or album) and storefront country from an
 * Apple Music / iTunes URL. Handles `?i=` track deep links, `/song/{slug}/{id}`
 * links, and `/album/{slug}/{id}` collection links (including the geo.music
 * Apple Music album URLs Odesli stores).
 */
export function parseAppleUrl(rawUrl: string): AppleIdRef | null {
	let url: URL;
	try {
		url = new URL(rawUrl.trim());
	} catch {
		return null;
	}
	if (!APPLE_HOST.test(url.hostname)) return null;

	const country = url.pathname.match(COUNTRY_IN_PATH)?.[1]?.toLowerCase();

	const trackParam = url.searchParams.get('i');
	if (trackParam && /^\d+$/.test(trackParam)) {
		return { id: trackParam, kind: 'track', country };
	}

	const segments = url.pathname.split('/').filter(Boolean);
	const kindIndex = segments.findIndex((s) => s === 'song' || s === 'album');
	if (kindIndex === -1) return null;
	// Last path segment after /song/ or /album/ is the numeric catalog id
	// (the optional slug segment before it may contain anything).
	const id = segments[segments.length - 1];
	if (!/^\d+$/.test(id)) return null;
	return { id, kind: segments[kindIndex] === 'song' ? 'track' : 'album', country };
}

/**
 * Conservative relevance check for blind catalog-search results — port of the
 * main app's matcher: accept only when the result's artist shares a token with
 * the searched artist — or, when we have no artist, when its title contains
 * the searched title. Playing/attaching an unrelated track is worse than
 * finding nothing.
 */
export function isPlausibleCatalogMatch(
	resultArtist: string,
	resultTitle: string,
	queryArtist: string,
	queryTitle: string
): boolean {
	const tokenize = (value: string) =>
		value
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, ' ')
			.split(' ')
			.filter((token) => token.length >= 2);

	const queryTokens = tokenize(queryArtist);
	if (queryTokens.length > 0) {
		const resultTokens = new Set(tokenize(resultArtist));
		return queryTokens.some((token) => resultTokens.has(token));
	}

	const normalize = (value: string) =>
		value
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, ' ')
			.trim();
	const query = normalize(queryTitle);
	return query.length > 0 && normalize(resultTitle).includes(query);
}

/** First item whose artist/title plausibly matches the query, if any. */
export function pickPlausibleResult<T>(
	items: Array<T> | undefined,
	getArtist: (item: T) => string,
	getTitle: (item: T) => string,
	queryArtist: string,
	queryTitle: string
): T | undefined {
	if (!Array.isArray(items)) return undefined;
	return items.find((item) =>
		isPlausibleCatalogMatch(getArtist(item), getTitle(item), queryArtist, queryTitle)
	);
}

const isTrackRow = (row: ItunesResultItem) =>
	(row.wrapperType === 'track' || Boolean(row.trackId)) && Boolean(row.previewUrl);

/**
 * Storefronts to try for id/UPC lookups and the search fallback. Track-id
 * lookups are storefront-independent, but album-id and UPC lookups only return
 * the track row (with its previewUrl) from the release's real storefront — so
 * try the derived country first, then US, then NG.
 */
export function countryCandidates(derived?: string): string[] {
	return [...new Set([derived, 'us', 'ng'].filter((c): c is string => Boolean(c)))];
}

async function fetchLookup(params: URLSearchParams): Promise<ItunesResultItem[] | null> {
	try {
		const response = await fetch(`https://itunes.apple.com/lookup?${params}`, {
			headers: { Accept: 'application/json' }
		});
		if (!response.ok) return null;
		const data = (await response.json()) as { results?: ItunesResultItem[] };
		return data.results ?? [];
	} catch {
		return null;
	}
}

/**
 * Resolve an exact iTunes preview clip by catalog id. Track ids resolve with a
 * single storefront-independent call; album ids and UPCs iterate the given
 * storefronts until one returns a track row with a previewUrl.
 */
export async function lookupPreview(opts: {
	trackId?: string;
	albumId?: string;
	upc?: string;
	countries?: string[];
	queryArtist?: string;
	queryTitle?: string;
}): Promise<string | null> {
	const { trackId, albumId, upc, countries, queryArtist = '', queryTitle = '' } = opts;

	if (trackId && /^\d+$/.test(trackId)) {
		const params = new URLSearchParams({ id: trackId });
		const rows = await fetchLookup(params);
		const track = rows?.find((r) => String(r.trackId) === trackId && r.previewUrl);
		return track?.previewUrl ?? null;
	}

	const idParam = albumId && /^\d+$/.test(albumId) ? { key: 'id', value: albumId } : null;
	// UPC-A (12 digits) or GTIN-13/14 barcode forms — iTunes accepts either.
	const upcDigits = upc?.replace(/\D/g, '') ?? '';
	const upcParam = /^\d{12,14}$/.test(upcDigits) ? upcDigits : null;
	if (!idParam && !upcParam) return null;

	for (const country of countries ?? ['us']) {
		const params = new URLSearchParams({ entity: 'song', country });
		if (idParam) params.set(idParam.key, idParam.value);
		if (upcParam) params.set('upc', upcParam);
		const rows = await fetchLookup(params);
		const tracks = (rows ?? []).filter(isTrackRow);
		if (tracks.length === 0) continue;
		const chosen =
			(tracks.length === 1 ? tracks[0] : undefined) ??
			pickPlausibleResult(
				tracks,
				(r) => r.artistName ?? '',
				(r) => r.trackName ?? r.collectionName ?? '',
				queryArtist,
				queryTitle
			) ??
			tracks[0];
		if (chosen?.previewUrl) return chosen.previewUrl;
	}
	return null;
}

/**
 * Fuzzy iTunes search fallback: first *artist-plausible* result with a
 * preview clip — never a wrong-artist track. Tries each storefront in order.
 */
export async function searchPreview(
	artist: string,
	title: string,
	countries: string[] = ['us']
): Promise<string | null> {
	const term = `${artist} ${title}`.trim();
	if (!title) return null;

	for (const country of countries) {
		try {
			const params = new URLSearchParams({
				term,
				entity: 'song',
				limit: '10',
				country
			});
			const response = await fetch(`https://itunes.apple.com/search?${params}`, {
				headers: { Accept: 'application/json' }
			});
			if (!response.ok) continue;
			const data = (await response.json()) as { results?: ItunesResultItem[] };
			const chosen = pickPlausibleResult(
				data.results,
				(r) => r.artistName ?? '',
				(r) => r.trackName ?? r.collectionName ?? '',
				artist,
				title
			);
			if (chosen?.previewUrl) return chosen.previewUrl;
		} catch {
			// best-effort — try the next storefront
		}
	}
	return null;
}

/** Apple/iTunes URLs stored on a link, in candidate order. */
export function collectAppleUrls(link: Pick<Link, 'platforms' | 'appleMusic' | 'url'>): string[] {
	const urls: string[] = [];
	for (const p of link.platforms ?? []) {
		if (p?.url && /music\.apple\.com|itunes\.apple\.com/i.test(p.url)) urls.push(p.url);
	}
	if (link.appleMusic && /music\.apple\.com|itunes\.apple\.com/i.test(link.appleMusic)) {
		urls.push(link.appleMusic);
	}
	if (link.url && /music\.apple\.com|itunes\.apple\.com/i.test(link.url)) urls.push(link.url);
	return urls;
}
