import { createHmac } from 'node:crypto';
import { env } from '$env/dynamic/private';

// Must match muzikhub's AUDIO_TOKEN_SECRET/SESSION_SECRET so both apps
// mint tokens the cdn.xoniq.pro Worker accepts.
function getSecret(): string {
	const s = env.AUDIO_TOKEN_SECRET || env.SESSION_SECRET;
	if (!s) throw new Error('AUDIO_TOKEN_SECRET or SESSION_SECRET is not set');
	return s;
}

function b64urlEncode(buf: Buffer): string {
	return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function createAudioToken(publicId: string, ttlSeconds = 300): string {
	const secret = getSecret();
	const expiry = Math.floor(Date.now() / 1000) + ttlSeconds;
	const payload = `${publicId}.${expiry}`;
	const sig = createHmac('sha256', secret).update(payload).digest('hex');
	return b64urlEncode(Buffer.from(`${expiry}.${sig}`, 'utf8'));
}

/**
 * Append a short-lived token to a private CDN audio URL.
 * Cloudinary and already-signed URLs pass through unchanged.
 */
export function signCdnAudioUrl(url: string, ttlSeconds = 300): string {
	if (!url.includes('cdn.xoniq.pro')) return url;
	try {
		const u = new URL(url);
		const last = u.pathname.split('/').pop() || '';
		const publicId = last.split('.')[0];
		if (!publicId) return url;
		u.searchParams.set('token', createAudioToken(publicId, ttlSeconds));
		return u.toString();
	} catch {
		return url;
	}
}
