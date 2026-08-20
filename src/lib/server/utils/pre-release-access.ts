import { db } from '$lib/server/db';
import { links, preReleaseAccessLog } from '$lib/server/db/schema';
import { eq, and, count } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { createHash } from 'node:crypto';

const VISITOR_COOKIE = 'xoniq_vid';
const VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function sha256(input: string): string {
	return createHash('sha256').update(input).digest('hex');
}

/** Reads (or creates) the visitor id cookie and derives a per-visitor fingerprint key. */
export function getVisitorKey(event: any): string {
	let id = event.cookies?.get(VISITOR_COOKIE) || '';
	if (!id) {
		id = crypto.randomUUID();
		event.cookies.set(VISITOR_COOKIE, id, {
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'lax',
			maxAge: VISITOR_COOKIE_MAX_AGE
		});
	}

	const ip = event.getClientAddress?.() || 'unknown';
	const ua = event.request?.headers?.get('user-agent') || '';
	return sha256(`${id}|${ip}|${ua}`);
}

export interface AccessDecision {
	allowed: boolean;
	alreadyCounted: boolean;
}

/**
 * Enforces the per-unique-listener access cap for a pre-release.
 * A visitor is counted once (cookie + IP + User-Agent fingerprint). Once the cap
 * is reached, new visitors are denied but already-counted visitors can continue.
 */
export async function recordPreReleaseAccess(
	link: { id: string; maxAccessCount?: number | null },
	visitorKey: string
): Promise<AccessDecision> {
	const existing = await db
		.select({ id: preReleaseAccessLog.id })
		.from(preReleaseAccessLog)
		.where(
			and(eq(preReleaseAccessLog.linkId, link.id), eq(preReleaseAccessLog.visitorKey, visitorKey))
		)
		.limit(1);

	if (existing.length > 0) {
		return { allowed: true, alreadyCounted: true };
	}

	const rows = await db
		.select({ n: count() })
		.from(preReleaseAccessLog)
		.where(eq(preReleaseAccessLog.linkId, link.id));
	const current = Number(rows[0]?.n || 0);

	if (link.maxAccessCount && current >= link.maxAccessCount) {
		return { allowed: false, alreadyCounted: false };
	}

	await db
		.insert(preReleaseAccessLog)
		.values({ id: nanoid(), linkId: link.id, visitorKey, createdAt: new Date() });

	await db
		.update(links)
		.set({ accessCount: current + 1, updatedAt: new Date() })
		.where(eq(links.id, link.id));

	return { allowed: true, alreadyCounted: false };
}
