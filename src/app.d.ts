declare module '@paystack/inline-js';

declare global {
	namespace App {
		interface Locals {
			user: { id: string } | null;
			requestStart?: number;
			requestId?: string;
		}
		// interface Error {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};