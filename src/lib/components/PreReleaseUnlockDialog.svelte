<script lang="ts">
	import type { Snippet } from 'svelte';
	import {
		Root as DialogRoot,
		Content as DialogContent,
		Header as DialogHeader,
		Title as DialogTitle,
		Description as DialogDescription,
		Footer as DialogFooter,
		Close as DialogClose,
		Trigger as DialogTrigger
	} from '$lib/components/ui/dialog/index.js';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		LockKeyIcon,
		Mail01Icon,
		WalletNotFound01Icon,
		PlayListAddIcon
	} from '@hugeicons/core-free-icons';
	import type { Link } from '$lib/types/social';

	let {
		open = $bindable(false),
		link,
		isUnlocking = false,
		unlockError = null,
		unlockPasscode = $bindable(''),
		unlockEmail = $bindable(''),
		unlockName = $bindable(''),
		onUnlock,
		children
	}: {
		open?: boolean;
		link: Link;
		isUnlocking?: boolean;
		unlockError?: string | null;
		unlockPasscode?: string;
		unlockEmail?: string;
		unlockName?: string;
		onUnlock: () => void;
		children?: Snippet;
	} = $props();

	const title = $derived(
		link.buyEnabled
			? 'Unlock your purchase to listen'
			: link.requiresPassword || link.requiresEmailCapture
				? 'Unlock early access to this pre-release track'
				: 'Limited early access to this pre-release track'
	);

	const description = $derived(
		link.buyEnabled
			? 'Enter the passcode we emailed you after your checkout to unlock streaming and downloads.'
			: 'This pre-release is exclusive to early listeners — unlock it to start listening.'
	);

	const showPasscode = $derived(link.requiresPassword || link.buyEnabled);
	const showEmailCapture = $derived(link.requiresEmailCapture && !link.buyEnabled);
	const showLimitOnly = $derived(
		Boolean(link.maxAccessCount) &&
			!link.buyEnabled &&
			!link.requiresPassword &&
			!link.requiresEmailCapture
	);

	function handleOpenChange(isOpen: boolean) {
		open = isOpen;
	}
</script>

<DialogRoot bind:open onOpenChange={handleOpenChange}>
	{#if children}
		<DialogTrigger class="w-full text-left">
			{@render children()}
		</DialogTrigger>
	{/if}

	<DialogContent
		class="rounded-[15px] border-none bg-[#F8F9FA] sm:max-w-md dark:border dark:border-[var(--border)] dark:bg-[var(--card)]"
	>
		<DialogHeader class="pb-4">
			<DialogTitle class="text-lg font-semibold text-[#0f172a] dark:text-[var(--text)]">
				{title}
			</DialogTitle>
			<DialogDescription class="text-sm text-[#64748b] dark:text-[var(--text-secondary)]">
				{description}
			</DialogDescription>
		</DialogHeader>

		<div class="max-h-96 space-y-3 overflow-y-auto">
			{#if showPasscode}
				<div
					class="flex items-start gap-4 rounded-lg border border-[#e2e8f0] bg-white p-4 dark:border-[var(--border)] dark:bg-[var(--card)]"
				>
					<div class="flex-shrink-0">
						<div
							class="grid h-10 w-10 place-content-center rounded-full bg-[#f8fafc] dark:bg-[var(--accent-soft)]"
						>
							<HugeiconsIcon
								icon={LockKeyIcon}
								className="size-5 text-[#64748b] dark:text-[var(--text-secondary)]"
							/>
						</div>
					</div>

					<div class="min-w-0 flex-1">
						<label
							for="unlock-passcode"
							class="mb-1.5 block text-[12px] font-semibold text-[#0f172a] dark:text-[var(--text)]"
						>
							{link.buyEnabled ? 'Passcode (from your email)' : 'Passcode'}
						</label>
						<input
							id="unlock-passcode"
							type="text"
							bind:value={unlockPasscode}
							placeholder={link.buyEnabled ? 'e.g. K7MP-4X9Q' : ''}
							class="w-full rounded-[12px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 text-sm text-[#0f172a] transition outline-none focus:border-[var(--teal)] dark:border-[var(--border)] dark:bg-[var(--card)] dark:text-[var(--text)]"
						/>
						{#if link.buyEnabled}
							<p
								class="mt-1.5 text-xs font-medium text-[#64748b] dark:text-[var(--text-secondary)]"
							>
								Works on any device — keep it secret, it's yours alone.
							</p>
						{/if}
					</div>
				</div>
			{/if}

			{#if link.buyEnabled}
				<div
					class="flex items-start gap-4 rounded-lg border border-[#e2e8f0] bg-white p-4 dark:border-[var(--border)] dark:bg-[var(--card)]"
				>
					<div class="flex-shrink-0">
						<div
							class="grid h-10 w-10 place-content-center rounded-full bg-[#f8fafc] dark:bg-[var(--accent-soft)]"
						>
							<HugeiconsIcon
								icon={Mail01Icon}
								className="size-5 text-[#64748b] dark:text-[var(--text-secondary)]"
							/>
						</div>
					</div>

					<div class="min-w-0 flex-1">
						<p class="text-sm font-medium text-[#0f172a] dark:text-[var(--text)]">
							Check your inbox
						</p>
						<p class="mt-0.5 text-xs font-medium text-[#64748b] dark:text-[var(--text-secondary)]">
							We emailed your passcode with your receipt right after payment. If it hasn't arrived,
							check your spam folder.
						</p>
					</div>
				</div>
			{/if}

			{#if showEmailCapture}
				<div
					class="flex items-start gap-4 rounded-lg border border-[#e2e8f0] bg-white p-4 dark:border-[var(--border)] dark:bg-[var(--card)]"
				>
					<div class="flex-shrink-0">
						<div
							class="grid h-10 w-10 place-content-center rounded-full bg-[#f8fafc] dark:bg-[var(--accent-soft)]"
						>
							<HugeiconsIcon
								icon={Mail01Icon}
								className="size-5 text-[#64748b] dark:text-[var(--text-secondary)]"
							/>
						</div>
					</div>

					<div class="min-w-0 flex-1">
						<label
							for="unlock-email"
							class="mb-1.5 block text-[12px] font-semibold text-[#0f172a] dark:text-[var(--text)]"
						>
							Email address
						</label>
						<input
							id="unlock-email"
							type="email"
							bind:value={unlockEmail}
							class="w-full rounded-[12px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 text-sm text-[#0f172a] transition outline-none focus:border-[var(--teal)] dark:border-[var(--border)] dark:bg-[var(--card)] dark:text-[var(--text)]"
						/>
						<label
							for="unlock-name"
							class="mt-3 mb-1.5 block text-[12px] font-semibold text-[#0f172a] dark:text-[var(--text)]"
						>
							Name (optional)
						</label>
						<input
							id="unlock-name"
							type="text"
							bind:value={unlockName}
							class="w-full rounded-[12px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 text-sm text-[#0f172a] transition outline-none focus:border-[var(--teal)] dark:border-[var(--border)] dark:bg-[var(--card)] dark:text-[var(--text)]"
						/>
					</div>
				</div>
			{/if}

			{#if showLimitOnly}
				<div
					class="flex items-start gap-4 rounded-lg border border-[#e2e8f0] bg-white p-4 dark:border-[var(--border)] dark:bg-[var(--card)]"
				>
					<div class="flex-shrink-0">
						<div
							class="grid h-10 w-10 place-content-center rounded-full bg-[#f8fafc] dark:bg-[var(--accent-soft)]"
						>
							<HugeiconsIcon
								icon={PlayListAddIcon}
								className="size-5 text-[#64748b] dark:text-[var(--text-secondary)]"
							/>
						</div>
					</div>

					<div class="min-w-0 flex-1">
						<p class="text-sm font-medium text-[#0f172a] dark:text-[var(--text)]">
							Claim your slot
						</p>
						<p class="mt-0.5 text-xs font-medium text-[#64748b] dark:text-[var(--text-secondary)]">
							This preview is limited to {link.maxAccessCount} listener
							{link.maxAccessCount === 1 ? '' : 's'} — claim your slot to listen.
						</p>
					</div>
				</div>
			{/if}

			{#if unlockError}
				<div
					class="rounded-lg border border-dashed border-red-200 bg-red-50 p-6 text-center dark:border-red-500/30 dark:bg-red-500/5"
				>
					<div
						class="mx-auto grid h-10 w-10 place-content-center rounded-full bg-red-100 dark:bg-red-500/15"
					>
						<HugeiconsIcon
							icon={WalletNotFound01Icon}
							className="size-5 text-red-500 dark:text-red-400"
						/>
					</div>
					<p class="mt-2 text-sm font-medium text-red-600 dark:text-red-400">
						{unlockError}
					</p>
				</div>
			{/if}
		</div>

		<DialogFooter class="pt-4">
			<div class="flex w-full justify-end gap-2">
				<DialogClose
					class="bg-background inline-flex items-center justify-center rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground dark:border-[var(--border)] dark:bg-[var(--card)] dark:text-[var(--text)] dark:hover:bg-[var(--accent-soft)]"
				>
					Cancel
				</DialogClose>
				<button
					type="button"
					onclick={onUnlock}
					disabled={isUnlocking}
					class="inline-flex items-center justify-center gap-2 rounded-md bg-[var(--teal)] px-4 py-2 text-sm font-semibold text-[#0f172a] transition hover:bg-[var(--teal)]/90 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[var(--accent)] dark:text-[var(--text)]"
				>
					{#if isUnlocking}
						<span
							class="size-3.5 animate-spin rounded-full border-2 border-[#0f172a]/30 border-t-[#0f172a] dark:border-[var(--text)]/30 dark:border-t-[var(--text)]"
						></span>
						Unlocking…
					{:else}
						Unlock Access
					{/if}
				</button>
			</div>
		</DialogFooter>
	</DialogContent>
</DialogRoot>
