import { nanoid } from 'nanoid';
import { eq, and, asc, desc } from 'drizzle-orm';
import type { Link } from '$lib/types/social';
import { links, preReleaseEmails } from '$lib/server/db/schema';
import { db } from '$lib/server/db';

export class LinkService {
	async getLinksByUserId(userId: string): Promise<Link[]> {
		try {
			const result = await db
				.select()
				.from(links)
				.where(and(eq(links.userId, userId), eq(links.isArchived, false)))
				.orderBy(asc(links.sortOrder), desc(links.createdAt));

			return result.map(this.mapDbToLink);
		} catch (error) {
			console.error('Failed to get links by user ID:', error);
			return [];
		}
	}

	async getLinkBySlug(slug: string): Promise<Link | null> {
		try {
			const result = await db
				.select()
				.from(links)
				.where(
					and(eq(links.slug, slug), eq(links.isPublic, true), eq(links.isArchived, false))
				)
				.limit(1);

			return result.length > 0 ? this.mapDbToLink(result[0]) : null;
		} catch (error) {
			console.error('Failed to get link by slug:', error);
			return null;
		}
	}

	private mapDbToLink(dbLink: any): Link {
		return {
			id: dbLink.id,
			userId: dbLink.userId,
			artistId: dbLink.artistId,
			title: dbLink.title,
			artist: dbLink.artist,
			slug: dbLink.slug,
			description: dbLink.description || undefined,
			artwork: dbLink.artwork || undefined,
			thumbnail: dbLink.thumbnail || undefined,
			genre: dbLink.genre || undefined,
			tags: dbLink.tags ? JSON.parse(dbLink.tags) : [],
			url: dbLink.url,
			customUrl: dbLink.customUrl || undefined,
			isPublic: dbLink.isPublic,
			isFeatured: dbLink.isFeatured,
			notifyFollowers: dbLink.notifyFollowers || false,
			clicks: dbLink.clicks || 0,
			uniqueClicks: dbLink.uniqueClicks || 0,
			spotify: dbLink.spotify || undefined,
			appleMusic: dbLink.appleMusic || undefined,
			youtube: dbLink.youtube || undefined,
			soundcloud: dbLink.soundcloud || undefined,
			platforms: dbLink.platforms || undefined,
			additionalPlatforms: dbLink.additionalPlatforms || [],
			albumType: dbLink.albumType || undefined,
			createdAt: dbLink.createdAt,
			updatedAt: dbLink.updatedAt,
			upc: dbLink.upc || null,
			isrc: dbLink.isrc || null,
			isPreRelease: dbLink.isPreRelease ?? false,
			requiresPassword: dbLink.requiresPassword ?? false,
			requiresEmailCapture: dbLink.requiresEmailCapture ?? false,
			passwordHash: dbLink.passwordHash || undefined,
			expiresAt: dbLink.expiresAt || undefined,
			accessType: dbLink.accessType || undefined,
			audioFileUrl: dbLink.audioFileUrl || undefined,
			audioFileCloudinaryId: dbLink.audioFileCloudinaryId || undefined,
			maxAccessCount: dbLink.maxAccessCount ?? undefined,
			accessCount: dbLink.accessCount ?? 0,
			buyPrice: dbLink.buyPrice ?? undefined,
			buyCurrency: dbLink.buyCurrency ?? 'NGN',
		buyEnabled: dbLink.buyEnabled ?? false,
		passcodeUsageLimit: dbLink.passcodeUsageLimit ?? undefined,
		sortOrder: dbLink.sortOrder ?? 0,
			isArchived: dbLink.isArchived ?? false
		};
	}

	async capturePreReleaseEmail(linkId: string, email: string, name?: string): Promise<void> {
		try {
			await db.insert(preReleaseEmails).values({
				id: nanoid(),
				linkId,
				email: email.trim().toLowerCase(),
				name: name ? name.trim() : null,
				createdAt: new Date()
			});
		} catch (error) {
			console.error('Failed to capture pre-release email:', error);
			throw new Error('Failed to save email for pre-release');
		}
	}
}

// Export singleton instance
export const linkService = new LinkService();
