declare module '@paystack/inline-js' {
	type PaystackCallbackResponse = { message?: string };
	type PaystackCallbackError = { message?: string } | string;

	export default class PaystackPop {
		checkout(options: {
			accessCode: string;
			onSuccess?: (transaction: { reference: string; status: string }) => void;
			onCancel?: () => void;
			onLoad?: (response: PaystackCallbackResponse) => void;
			onError?: (error: PaystackCallbackError) => void;
		}): void;
		resumeTransaction(
			accessCode: string,
			callbacks?: {
				onSuccess?: (transaction: { reference: string; status: string }) => void;
				onCancel?: () => void;
				onLoad?: (response: PaystackCallbackResponse) => void;
				onError?: (error: PaystackCallbackError) => void;
			}
		): void;
	}
}
