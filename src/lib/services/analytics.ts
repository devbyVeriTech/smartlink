import { db } from '$lib/server/db';
import { analytics, links } from '$lib/server/db/schema';
import { eq, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export interface ClickData {
	clickId: string;
	ip?: string;
	userAgent?: string;
	country?: string;
	city?: string;
	referer?: string;
	platform?: string;
	deviceType?: string;
	browser?: string;
}

export class AnalyticsService {
	async recordLinkClick(linkId: string, clickData: ClickData): Promise<void> {
		try {
			// Record analytics
			await db.insert(analytics).values({
				id: nanoid(),
				linkId,
				...clickData,
				timestamp: new Date()
			});

			// Update link click counts
			await db
				.update(links)
				.set({
					clicks: sql`${links.clicks} + 1`,
					updatedAt: new Date()
				})
				.where(eq(links.id, linkId));
		} catch (error) {
			console.error('Failed to record click:', error);
			// Don't throw error here to avoid breaking user experience
		}
	}
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
