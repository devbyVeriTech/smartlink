import type { RequestHandler } from './$types';
import { linkService } from '$lib/services/links';
import { incrementSharedPasscodeUsage } from '$lib/services/passcodes';
import { createErrorResponse } from '$lib/server/utils/errors';
import { generateRequestId, logRequest, logResponse } from '$lib/server/middleware/auth';
import { logger } from '$lib/server/utils/logger';
import { json } from '@sveltejs/kit';
import bcrypt from 'bcryptjs';
import { getVisitorKey, recordPreReleaseAccess } from '$lib/server/utils/pre-release-access';
import { verifyPasscode } from '$lib/server/utils/pre-release-passcode';
import { db } from '$lib/server/db';
import { orders, passcodes } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

export const POST: RequestHandler = async (event) => {
	const requestId = generateRequestId();
	logRequest(event, requestId);

	try {
		const slug = event.params.slug;
		if (!slug) {
			return json({ error: 'Slug is required' }, { status: 400 });
		}

		const link = await linkService.getLinkBySlug(slug);
		if (!link) {
			logResponse(event, 404);
			return json({ error: 'Link not found' }, { status: 404 });
		}

		const body = await event.request.json();
		const { email, name, passcode } = body;

		// 0. Pay-to-listen gate — the emailed unique passcode is the ONLY gate,
		// and it is bound to the purchaser's email (one email per passcode).
		if (link.buyEnabled) {
			if (!passcode) {
				return json({ error: 'Buy this track to receive your passcode by email' }, { status: 401 });
			}

			// Look up the passcode row bound to the submitted email.
			const passcodeRows = await db
				.select()
				.from(passcodes)
				.where(and(
					eq(passcodes.linkId, link.id),
					eq(passcodes.email, email),
					eq(passcodes.is_used, false)
				))
				.limit(1);

			const passcodeRow = passcodeRows[0];

			if (!passcodeRow) {
				return json({ error: 'Incorrect passcode or email mismatch' }, { status: 401 });
			}

			// Verify the passcode hash against the stored one.
			const valid = await bcrypt.compare(passcode, passcodeRow.passcode_hash);
			if (!valid) {
				return json({ error: 'Incorrect passcode' }, { status: 401 });
			}

			// Mark this passcode as used so it cannot be reused.
			await db
				.update(passcodes)
				.set({ is_used: true, used_at: new Date() })
				.where(eq(passcodes.id, passcodeRow.id));

			// Paid fans are never blocked by the unique-listener cap; log purely for stats.
			const paidVisitorKey = getVisitorKey(event);
			await recordPreReleaseAccess({ ...link, maxAccessCount: null }, paidVisitorKey);
		} else {
			// 1. Password Verification Gate
			if (link.requiresPassword) {
				if (!passcode) {
					return json(
						{ error: 'Passcode is required to unlock this pre-release' },
						{ status: 401 }
					);
				}

				const isMatch = await bcrypt.compare(passcode, link.passwordHash || '');
				if (!isMatch) {
					return json({ error: 'Incorrect passcode' }, { status: 401 });
				}

				// 1a. Shared passcode usage limit check
				if (link.passcodeUsageLimit !== undefined && link.passcodeUsageLimit !== null) {
					const usage = await incrementSharedPasscodeUsage(link.id);
					if (!usage.allowed) {
						return json(
							{ error: 'This passcode has reached its usage limit' },
							{ status: 403 }
						);
					}
				}
			}

			// 2. Email Capture Gate
			if (email) {
				// Basic validation
				if (!email.includes('@')) {
					return json({ error: 'Please enter a valid email address' }, { status: 400 });
				}
				await linkService.capturePreReleaseEmail(link.id, email, name);
				logger.info(`[PreReleaseGate] Email captured for link ${link.id}: ${email}`);
			}

			// 3. Access Limit Gate (cap unique listeners)
			const visitorKey = getVisitorKey(event);
			const decision = await recordPreReleaseAccess(link, visitorKey);
			if (!decision.allowed) {
				logResponse(event, 403);
				return json(
					{ error: 'This pre-release has reached its listener limit and is no longer open' },
					{ status: 403 }
				);
			}
		}

		// 4. Unlock Session Cookie
		event.cookies.set(`unlocked_pre_release_${link.id}`, 'true', {
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 // 1 day unlock duration
		});

		logger.info(`[PreReleaseGate] Successfully unlocked link ${link.id}`);
		logResponse(event, 200);

		return json({ success: true });
	} catch (error: any) {
		console.error('[PreReleaseGate] Error unlocking pre-release link:', error);
		logResponse(event, error?.statusCode || 500);
		const { error: message, status } = createErrorResponse(error);
		return json({ error: message }, { status });
	}
};
