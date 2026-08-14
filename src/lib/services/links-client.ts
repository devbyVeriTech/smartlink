import type { Link } from '$lib/types/social';

class LinkClientService {
	private async apiCall<T>(url: string, options?: RequestInit): Promise<T> {
		const response = await fetch(url, {
			headers: {
				'Content-Type': 'application/json',
				...options?.headers
			},
			...options
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || 'Request failed');
		}

		return response.json();
	}

	async getLinkBySlug(slug: string): Promise<Link | null> {
		try {
			const response = await this.apiCall<{ link: Link }>(`/api/public/links/slug/${slug}`);
			return response.link;
		} catch {
			return null;
		}
	}
}

export const linkClientService = new LinkClientService();