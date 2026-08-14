<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import type { Link } from '$lib/types/social';
	import {
		ExternalLink,
		PlayIcon,
		MusicNote01Icon
	} from '@hugeicons/core-free-icons';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import AlbumView from '$lib/components/AlbumView.svelte';
	import { page } from '$app/state';
	import { app } from '$lib/utils/app.js';

	let { data } = $props();

	let link = $derived(data.link);
	let relatedAlbums = $derived(data.relatedAlbums);
	let clickedPlatforms = $state<Set<string>>(new Set());

	async function handlePlatformClick(url: string, platformName: string) {
		if (!link) return;

		// Track click via the platform tracking endpoint, which records analytics
		// and redirects the user to the exact platform URL they clicked.
		clickedPlatforms = new Set([...clickedPlatforms, platformName]);

		const platformSlug = platformName.toLowerCase().replace(/\s+/g, '-');
		window.open(`/l/${link.slug}/${platformSlug}?url=${encodeURIComponent(url)}`, '_blank');
	}

	function shareLink() {
		if (!link) return;

		if (navigator.share) {
			navigator.share({
				title: `${link.title} by ${link.artist}`,
				text: link.description || `Listen to ${link.title} on your favorite platform`,
				url: window.location.href
			});
		} else {
			navigator.clipboard.writeText(window.location.href);
			// Show toast or feedback
		}
	}

	function handleShare() {
		shareLink();
	}

	function getAvailablePlatforms() {
		if (!link) return [];

		if (link.platforms && link.platforms.length > 0) {
			return link.platforms.map((p) => ({ name: p.name, url: p.url }));
		}

		const platforms = [];

		if (link.spotify) platforms.push({ name: 'Spotify', url: link.spotify });
		if (link.appleMusic) platforms.push({ name: 'Apple Music', url: link.appleMusic });
		if (link.youtube) platforms.push({ name: 'YouTube Music', url: link.youtube });
		if (link.soundcloud) platforms.push({ name: 'SoundCloud', url: link.soundcloud });
		if (link.audiomack) platforms.push({ name: 'Audiomack', url: link.audiomack });
		if (link.bandcamp) platforms.push({ name: 'Bandcamp', url: link.bandcamp });
		if (link.tidal) platforms.push({ name: 'Tidal', url: link.tidal });
		if (link.deezer) platforms.push({ name: 'Deezer', url: link.deezer });
		if (link.amazonMusic) platforms.push({ name: 'Amazon Music', url: link.amazonMusic });
		if (link.beatport) platforms.push({ name: 'Beatport', url: link.beatport });
		if (link.musicbed) platforms.push({ name: 'Musicbed', url: link.musicbed });

		if (link.additionalPlatforms) {
			platforms.push(...link.additionalPlatforms);
		}

		if (platforms.length === 0 && link.url) {
			if (link.url.includes('spotify')) platforms.push({ name: 'Spotify', url: link.url });
			else if (link.url.includes('apple')) platforms.push({ name: 'Apple Music', url: link.url });
			else if (link.url.includes('youtube'))
				platforms.push({ name: 'YouTube Music', url: link.url });
			else if (link.url.includes('soundcloud'))
				platforms.push({ name: 'SoundCloud', url: link.url });
			else platforms.push({ name: 'Listen Now', url: link.url });
		}

		return platforms;
	}
</script>

<svelte:head>
	{#if link}
		<title>{link.title} • {link.artist} | {app.name}</title>
		<meta
			name="description"
			content={link.description ||
				`Listen to ${link.title} by ${link.artist} on all streaming platforms`}
		/>
		<meta property="og:title" content="{link.title} • {link.artist}" />
		<meta
			property="og:description"
			content={link.description || `Listen to ${link.title} by ${link.artist}`}
		/>
		<meta
			property="og:image"
			content={link.artwork?.startsWith('http')
				? link.artwork
				: `${page.url.origin}${link.artwork}`}
		/>
		<meta property="og:url" content={page.url.href} />
		<meta name="twitter:card" content="summary_large_image" />
		<meta name="twitter:title" content="{link.title} • {link.artist}" />
		<meta
			name="twitter:description"
			content={link.description || `Listen to ${link.title} by ${link.artist}`}
		/>
		<meta
			name="twitter:image"
			content={link.artwork?.startsWith('http')
				? link.artwork
				: `${page.url.origin}${link.artwork}`}
		/>
		{#if data.canonicalUrl}
			<link rel="canonical" href={data.canonicalUrl} />
		{/if}
	{/if}
</svelte:head>

{#if link}
	<AlbumView
		{link}
		{relatedAlbums}
		availablePlatforms={getAvailablePlatforms()}
		{clickedPlatforms}
		{handlePlatformClick}
	/>

	<!-- Share button - sticks to bottom-right on smaller screens -->
	<div
		class="right-5 bottom-5 lg:hidden fixed z-50 flex h-[60px] w-[60px] cursor-pointer items-center justify-center rounded-[16px] border-4 border-[#f8fafc] bg-[#2dd4bf] shadow-[0_10px_25px_rgba(45,212,191,0.4)] transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-105 active:scale-95 dark:border-[var(--card)] dark:bg-[var(--accent)] dark:shadow-[0_10px_25px_var(--accent)]/40"
		role="button"
		tabindex="0"
		aria-label="Share this link"
		onkeydown={(e) => e.key === 'Enter' && handleShare()}
		onclick={handleShare}
	>
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="#ffffff"
			stroke-width="2.5"
			stroke-linecap="round"
			stroke-linejoin="round"
			class="h-[26px] w-[26px]"
		>
			<circle cx="18" cy="5" r="3"></circle>
			<circle cx="6" cy="12" r="3"></circle>
			<circle cx="18" cy="19" r="3"></circle>
			<line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
			<line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
		</svg>
	</div>
{:else}
	<div class="flex min-h-screen items-center justify-center bg-[#F8F9FA] dark:bg-[var(--bg)]">
		<div
			class="bg-white p-8 rounded-[18px] text-center dark:bg-[var(--card)]"
			style="box-shadow: 0px 10px 30px 0px #0b12201a;"
		>
			<HugeiconsIcon
				icon={MusicNote01Icon}
				className="text-[#94a3b8] dark:text-[var(--text-secondary)] mx-auto mb-4 size-12"
			/>
			<h1 class="mb-2 font-bold text-[24px] text-[#0f172a] dark:text-[var(--text)]">
				Link Not Found
			</h1>
			<p class="mb-6 text-[#94a3b8] dark:text-[var(--text-secondary)]">
				This smart link doesn't exist or has been removed.
			</p>
			<Button
				href="/"
				class="px-4 py-2 rounded-[10px] bg-[#2dd4bf] text-[#0f172a] hover:bg-[#2dd4bf]/90 dark:bg-[var(--accent)] dark:text-[var(--text)] dark:hover:bg-[var(--accent)]/90"
				>Go Home</Button
			>
		</div>
	</div>
{/if}
