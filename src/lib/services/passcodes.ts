import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { passcodes } from '$lib/server/db/schema';

/**
 * Creates a shared passcodes row at link creation time.
 * Called when a musician saves a link with requiresPassword = true (not bought).
 */
export async function createSharedPasscode(
	linkId: string,
	passcodeHash: string,
	usageLimit?: number | null
): Promise<void> {
	await db.insert(passcodes).values({
		id: nanoid(),
		linkId,
		email: null,
		passcode_hash: passcodeHash,
		is_used: false,
		usage_limit: usageLimit ?? null,
		current_uses: 0,
		created_at: new Date()
	});
}

/**
 * Removes the shared passcodes row when a link is updated to no longer use requiresPassword.
 */
export async function removeSharedPasscode(linkId: string): Promise<void> {
	await db.delete(passcodes).where(eq(passcodes.linkId, linkId));
}

/**
 * Increments usage count for a shared passcode and checks the usage limit.
 * Returns whether access is allowed and the current usage count.
 */
export async function incrementSharedPasscodeUsage(
	linkId: string
): Promise<{ allowed: boolean; currentUses: number }> {
	const rows = await db
		.select()
		.from(passcodes)
		.where(eq(passcodes.linkId, linkId))
		.limit(1);

	const row = rows[0];
	if (!row) {
		return { allowed: false, currentUses: 0 };
	}

	if (row.usage_limit !== null && row.current_uses >= row.usage_limit) {
		return { allowed: false, currentUses: row.current_uses };
	}

	await db
		.update(passcodes)
		.set({ current_uses: row.current_uses + 1 })
		.where(eq(passcodes.id, row.id));

	return { allowed: true, currentUses: row.current_uses + 1 };
}
