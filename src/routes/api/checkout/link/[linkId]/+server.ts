import { json } from '@sveltejs/kit';
import { app } from '$lib/utils/app';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request }) => {
	try {
		const { linkId } = params;
		const body = await request.json();
		const { buyerName, buyerEmail, buyerPhone, slug } = body;

		if (!buyerEmail || !buyerEmail.includes('@')) {
			return json({ error: 'Your email is required for payment' }, { status: 400 });
		}

		const origin = new URL(request.url).origin;

		const callbackUrl = slug
			? `${origin}/${slug}`
			: undefined;

		const res = await fetch(`${app.mainUrl}/api/links/buy`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				linkId,
				buyerName,
				buyerEmail,
				buyerPhone,
				callbackUrl
			})
		});

		const data = await res.json();

		if (!res.ok) {
			return json({ error: data.error || 'Failed to start checkout.' }, { status: res.status });
		}

		return json({
			url: data.url,
			reference: data.reference,
			orderId: data.orderId
		});
	} catch (error) {
		console.error('Checkout proxy failed:', error);
		return json({ error: 'Failed to start checkout. Please try again.' }, { status: 500 });
	}
};
