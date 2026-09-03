<script lang="ts">
	import { onMount } from 'svelte';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		LockKeyIcon,
		CheckmarkCircle01Icon,
		WalletNotFound01Icon
	} from '@hugeicons/core-free-icons';
	import { app } from '$lib/utils/app';

	let {
		reference,
		onDismiss
	}: {
		reference: string;
		onDismiss?: () => void;
	} = $props();

	let passcode = $state<string | null>(null);
	let productName = $state('');
	let buyerName = $state('');
	let loading = $state(true);
	let error = $state<string | null>(null);

	onMount(async () => {
		try {
			const res = await fetch(`${app.mainUrl}/api/links/verify-purchase?reference=${encodeURIComponent(reference)}`);
			const data = await res.json();

			if (!res.ok || !data.success) {
				error = data.error || 'Failed to verify payment.';
			} else {
				passcode = data.passcode;
				productName = data.productName || '';
				buyerName = data.buyerName || '';
			}
		} catch {
			error = 'Unable to verify payment. Please check your email for a receipt.';
		} finally {
			loading = false;
		}
	});
</script>

{#if loading}
	<div
		class="rounded-2xl border border-[#e2e8f0] bg-white p-6 dark:border-[var(--border)] dark:bg-[var(--card)]"
		style="box-shadow: 0px 10px 30px 0px #0b12201a;"
	>
		<div class="flex items-center gap-3">
			<span
				class="size-5 animate-spin rounded-full border-2 border-[var(--teal)]/30 border-t-[var(--teal)] dark:border-[var(--accent)]/30 dark:border-t-[var(--accent)]"
			></span>
			<p class="text-sm font-medium text-[#64748b] dark:text-[var(--text-secondary)]">
				Verifying your payment…
			</p>
		</div>
	</div>
{:else if error}
	<div
		class="rounded-2xl border border-dashed border-red-200 bg-red-50 p-6 dark:border-red-500/30 dark:bg-red-500/5"
		style="box-shadow: 0px 10px 30px 0px #0b12201a;"
	>
		<div class="flex items-start gap-3">
			<div
				class="grid size-10 shrink-0 place-content-center rounded-full bg-red-100 dark:bg-red-500/15"
			>
				<HugeiconsIcon
					icon={WalletNotFound01Icon}
					className="size-5 text-red-500 dark:text-red-400"
				/>
			</div>
			<div>
				<p class="text-sm font-medium text-red-600 dark:text-red-400">
					{error}
				</p>
				<p class="mt-1 text-xs text-red-500/80 dark:text-red-400/80">
					Check your email for the receipt and passcode.
				</p>
			</div>
		</div>
	</div>
{:else if passcode}
	<div
		class="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-500/30 dark:bg-emerald-500/5"
		style="box-shadow: 0px 10px 30px 0px #0b12201a;"
	>
		<div class="flex items-start gap-3 mb-4">
			<div
				class="grid size-10 shrink-0 place-content-center rounded-full bg-emerald-100 dark:bg-emerald-500/15"
			>
				<HugeiconsIcon
					icon={CheckmarkCircle01Icon}
					className="size-5 text-emerald-600 dark:text-emerald-400"
				/>
			</div>
			<div>
				<p class="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
					Payment Successful
				</p>
				<p class="mt-0.5 text-xs text-emerald-600 dark:text-emerald-400">
					{#if buyerName}Thanks, {buyerName}!{:else}Thanks for your order!{/if} Your purchase of {productName} is confirmed.
				</p>
			</div>
		</div>

		<div class="rounded-xl bg-white p-4 text-center dark:bg-[var(--card)]">
			<div
				class="gap-1.5 font-semibold tracking-widest flex items-center justify-center text-[11px] text-[#94a3b8] uppercase"
			>
				<HugeiconsIcon icon={LockKeyIcon} className="size-3" />
				Your listen passcode
			</div>
			<div
				class="mt-2 font-mono font-extrabold text-[22px] tracking-[4px] text-[var(--teal)] select-all dark:text-[var(--accent)]"
			>
				{passcode}
			</div>
			<p class="mt-1.5 text-[11px] text-[#94a3b8]">
				Enter it below to unlock streaming. We also emailed it to you.
			</p>
		</div>

		{#if onDismiss}
			<button
				type="button"
				onclick={onDismiss}
				class="mt-4 w-full text-center text-xs font-medium text-[#64748b] hover:text-[#0f172a] dark:text-[var(--text-secondary)] dark:hover:text-[var(--text)]"
			>
				Dismiss
			</button>
		{/if}
	</div>
{/if}
