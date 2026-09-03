<script lang="ts">
	import {
		Root as DialogRoot,
		Content as DialogContent,
		Header as DialogHeader,
		Title as DialogTitle,
		Description as DialogDescription,
		Footer as DialogFooter,
		Close as DialogClose
	} from '$lib/components/ui/dialog/index.js';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		MusicNote01Icon,
		LockKeyIcon,
		CreditCardIcon
	} from '@hugeicons/core-free-icons';
	import type { Link } from '$lib/types/social';
	import { env } from '$env/dynamic/public';

	let {
		open = $bindable(false),
		link,
		onSuccess
	}: {
		open?: boolean;
		link: Link;
		onSuccess?: () => void;
	} = $props();

	let buyerName = $state('');
	let buyerEmail = $state('');
	let buyerPhone = $state('');
	let loading = $state(false);
	let errorMessage = $state('');

	const priceDisplay = $derived(
		link.buyPrice
			? `₦${(link.buyPrice / 100).toLocaleString('en-NG', { maximumFractionDigits: 0 })}`
			: ''
	);

	async function placePreOrder() {
		if (!buyerEmail || !buyerEmail.includes('@')) {
			errorMessage = 'Please enter a valid email address.';
			return;
		}
		if (loading) return;

		loading = true;
		errorMessage = '';

		try {
			const res = await fetch(`/api/checkout/link/${link.id}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					buyerName,
					buyerEmail,
					buyerPhone,
					slug: link.slug
				})
			});

			const result = await res.json();
			if (!res.ok) {
				errorMessage = result.error || 'Failed to start checkout.';
				loading = false;
				return;
			}

			if (!result.accessCode) {
				errorMessage = 'Failed to initialize payment. Please try again.';
				loading = false;
				return;
			}

			const { default: PaystackPop } = await import('@paystack/inline-js');
			const popup = new PaystackPop();

			open = false;
			loading = false;

			popup.resumeTransaction(result.accessCode, {
				onSuccess: (transaction: { reference: string }) => {
					window.location.href = `/${link.slug}?reference=${transaction.reference}`;
				},
				onCancel: () => {}
			});
		} catch (err) {
			console.error('Checkout failed:', err);
			errorMessage = 'Something went wrong. Please try again.';
			loading = false;
		}
	}

	function handleOpenChange(isOpen: boolean) {
		open = isOpen;
		if (!isOpen) {
			errorMessage = '';
		}
	}
</script>

<DialogRoot bind:open onOpenChange={handleOpenChange}>
	<DialogContent
		class="rounded-[15px] border-none bg-[#F8F9FA] sm:max-w-md dark:border dark:border-[var(--border)] dark:bg-[var(--card)]"
	>
		<DialogHeader class="pb-4">
			<DialogTitle class="text-lg font-semibold text-[#0f172a] dark:text-[var(--text)]">
				Buy Track
			</DialogTitle>
			<DialogDescription class="text-sm text-[#64748b] dark:text-[var(--text-secondary)]">
				Pay now to start listening — your passcode is emailed right after payment.
			</DialogDescription>
		</DialogHeader>

		<div class="max-h-96 space-y-4 overflow-y-auto">
			<div
				class="flex items-center gap-4 rounded-xl border border-[#e2e8f0] bg-white p-4 dark:border-[var(--border)] dark:bg-[var(--card)]"
			>
				<div
					class="size-16 shrink-0 overflow-hidden rounded-[10px] bg-gray-100 dark:bg-gray-800 grid place-items-center"
				>
					{#if link.artwork}
						<img
							src={link.artwork}
							alt={link.title}
							class="h-full w-full object-cover"
						/>
					{:else}
						<HugeiconsIcon icon={MusicNote01Icon} className="size-6 text-gray-400" />
					{/if}
				</div>
				<div class="min-w-0 flex-1">
					<p class="text-sm font-semibold truncate text-[#0f172a] dark:text-[var(--text)]">
						{link.title}
					</p>
					<p class="text-xs text-[#94a3b8]">
						{link.artist}
					</p>
					<p class="mt-1 text-sm font-bold text-[var(--teal)] dark:text-[var(--accent)]">
						{priceDisplay}
					</p>
				</div>
			</div>

			<div class="space-y-3">
				<div class="gap-2 flex items-center">
					<HugeiconsIcon icon={CreditCardIcon} className="size-4 text-[#94a3b8]" />
					<span class="text-[13px] font-semibold text-[#0f172a] dark:text-[var(--text)]">
						Contact Details
					</span>
				</div>

				<div>
					<label
						for="co-name"
						class="mb-1.5 block text-[12px] font-semibold text-[#0f172a] dark:text-[var(--text)]"
					>
						Full Name
					</label>
					<input
						id="co-name"
						type="text"
						bind:value={buyerName}
						placeholder="e.g. Jane Doe"
						class="w-full rounded-[10px] border border-[#e2e8f0] bg-white px-3 py-2.5 text-[13px] text-[#0f172a] outline-none transition focus:border-[var(--teal)] dark:border-[var(--border)] dark:bg-[var(--card)] dark:text-[var(--text)]"
					/>
				</div>

				<div>
					<label
						for="co-email"
						class="mb-1.5 block text-[12px] font-semibold text-[#0f172a] dark:text-[var(--text)]"
					>
						Email <span class="text-red-500">*</span>
					</label>
					<input
						id="co-email"
						type="email"
						bind:value={buyerEmail}
						placeholder="you@example.com"
						class="w-full rounded-[10px] border border-[#e2e8f0] bg-white px-3 py-2.5 text-[13px] text-[#0f172a] outline-none transition focus:border-[var(--teal)] dark:border-[var(--border)] dark:bg-[var(--card)] dark:text-[var(--text)]"
					/>
				</div>

				<div>
					<label
						for="co-phone"
						class="mb-1.5 block text-[12px] font-semibold text-[#0f172a] dark:text-[var(--text)]"
					>
						Phone Number
					</label>
					<input
						id="co-phone"
						type="tel"
						bind:value={buyerPhone}
						placeholder="+234 ..."
						class="w-full rounded-[10px] border border-[#e2e8f0] bg-white px-3 py-2.5 text-[13px] text-[#0f172a] outline-none transition focus:border-[var(--teal)] dark:border-[var(--border)] dark:bg-[var(--card)] dark:text-[var(--text)]"
					/>
				</div>
			</div>

			{#if errorMessage}
				<div
					class="rounded-[10px] border border-dashed border-red-200 bg-red-50 px-4 py-3 text-[12px] text-red-600 dark:border-red-500/30 dark:bg-red-500/5 dark:text-red-400"
				>
					{errorMessage}
				</div>
			{/if}

			<div
				class="gap-1.5 flex items-center justify-center rounded-[10px] bg-[var(--teal)]/5 px-3 py-2 text-center text-[11px] text-[#64748b] dark:bg-[var(--accent)]/10 dark:text-[#94a3b8]"
			>
				<HugeiconsIcon icon={LockKeyIcon} className="size-3 shrink-0" />
				Once payment confirms, we'll email you a unique passcode to unlock this track.
			</div>
		</div>

		<DialogFooter class="pt-4">
			<div class="flex w-full flex-col gap-2">
				<button
					type="button"
					onclick={placePreOrder}
					disabled={loading}
					class="gap-2 px-4 py-3 font-semibold flex w-full items-center justify-center rounded-[10px] bg-[var(--teal)] text-[#0f172a] transition-colors hover:bg-[var(--teal)]/90 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[var(--accent)] dark:text-[var(--text)]"
				>
					{#if loading}
						<span
							class="size-4 animate-spin rounded-full border-2 border-[#0f172a]/30 border-t-[#0f172a] dark:border-[var(--text)]/30 dark:border-t-[var(--text)]"
						></span>
						Processing…
					{:else}
						{priceDisplay} · Buy & Listen
					{/if}
				</button>
				<DialogClose
					class="inline-flex items-center justify-center rounded-[10px] border border-[#e2e8f0] bg-white px-4 py-2.5 text-[13px] font-medium text-[#0f172a] transition hover:bg-gray-50 dark:border-[var(--border)] dark:bg-[var(--card)] dark:text-[var(--text)] dark:hover:bg-[var(--accent-soft)]"
				>
					Cancel
				</DialogClose>
			</div>
			<p class="mt-3 gap-1.5 flex items-center justify-center text-[11px] text-[#94a3b8]">
				<HugeiconsIcon icon={LockKeyIcon} className="size-3" />
				Payments are processed securely by Paystack.
			</p>
		</DialogFooter>
	</DialogContent>
</DialogRoot>
