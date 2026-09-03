declare module '@paystack/inline-js' {
	export default class PaystackPop {
		checkout(options: {
			accessCode: string;
			onSuccess?: (transaction: { reference: string; status: string }) => void;
			onCancel?: () => void;
			onLoad?: (response: any) => void;
			onError?: (error: any) => void;
		}): void;
		resumeTransaction(
			accessCode: string,
			callbacks?: {
				onSuccess?: (transaction: { reference: string; status: string }) => void;
				onCancel?: () => void;
				onLoad?: (response: any) => void;
				onError?: (error: any) => void;
			}
		): void;
	}
}
