import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '$env/dynamic/private';

// Must match the secret in muzikhub's .env so both apps derive the same codes.
const SECRET = env.PRERELEASE_PASSCODE_SECRET || 'dev-prerelease-passcode-secret';

// Unambiguous alphabet: no 0/O, 1/I/L, or similar-looking characters.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function derive(orderId: string): string {
	const digest = createHmac('sha256', SECRET).update(orderId).digest();
	let code = '';
	for (let i = 0; i < 8; i++) {
		code += ALPHABET[digest[i] % ALPHABET.length];
	}
	return `${code.slice(0, 4)}-${code.slice(4)}`;
}

const normalize = (input: string) => input.toUpperCase().replace(/[^A-Z0-9]/g, '');

/** Deterministic, unique-per-order passcode. Recomputable anytime (no plaintext stored). */
export function generatePasscode(orderId: string): string {
	return derive(orderId);
}

/** Constant-time comparison of a submitted code against an order's derived code. */
export function verifyPasscode(orderId: string, submitted: string): boolean {
	const expected = normalize(derive(orderId));
	const actual = normalize(submitted);
	if (expected.length !== actual.length) return false;
	return timingSafeEqual(Buffer.from(expected), Buffer.from(actual));
}
