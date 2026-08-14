<script lang="ts">
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import { Badge } from '$lib/components/ui/badge';
	import {
		ExternalLink,
		PlayIcon,
		MusicNote01Icon
	} from '@hugeicons/core-free-icons';

	import { PauseIcon } from '@hugeicons/core-free-icons';
	import { toast } from 'svelte-sonner';
	import { getMainArtist } from '$lib/utils/string';
	import { app } from '$lib/utils/app';
	import { getPlatformSvg, getPlatformColor } from '$lib/utils/platforms';

	let {
		link,
		relatedAlbums = [],
		availablePlatforms,
		clickedPlatforms = new Set(),
		handlePlatformClick = defaultHandlePlatformClick
	} = $props();

	function defaultHandlePlatformClick(url: string, name: string) {
		window.open(url, '_blank', 'noopener,noreferrer');
	}

	let clickedNames = $state<string[]>([]);

	function onPlatformClick(url: string, name: string) {
		if (!clickedNames.includes(name)) {
			clickedNames = [...clickedNames, name];
		}
		handlePlatformClick(url, name);
	}

	// Simple audio preview state (no auth needed)
	let audio = $state<HTMLAudioElement | null>(null);
	let isPlaying = $state(false);
	let isLoading = $state(false);
	let previewError = $state<string | null>(null);
	let previewUrl = $state<string | null>(null);
	let navigatingArtist = $state<string | null>(null);

	let streamBlobUrl = $state<string | null>(null);
	let showUnlockModal = $state(false);
	let preReleaseUnlocked = $state(false);
	let unlockPasscode = $state('');
	let unlockEmail = $state('');
	let unlockName = $state('');
	let unlockError = $state<string | null>(null);
	let isUnlocking = $state(false);

	let artist = $derived(link.artist);
	let albumTitle = $derived(link.title);
	let coverUrl = $derived(link.artwork);

	let mainArtist = $derived(getMainArtist(artist));
	let filteredRelatedAlbums = $derived(
		relatedAlbums.filter(
			(album: any) => getMainArtist(album.artist).toLowerCase() === mainArtist.toLowerCase()
		)
	);

	async function navigateToArtist(artistName: string) {
		navigatingArtist = artistName;
		window.location.href = `${app.mainUrl}/a/${artistName.trim().toLowerCase()}`;
	}

	function getAlbumType(): 'single' | 'album' | 'ep' {
		if (link.albumType) return link.albumType;
		// Infer from title if not set
		const titleLower = albumTitle.toLowerCase();
		if (titleLower.includes('single') || titleLower.includes('- single')) return 'single';
		if (titleLower.includes('ep') || titleLower.includes('- ep')) return 'ep';
		return 'album';
	}

	let albumType = $derived(getAlbumType());

	// let {
	// 	artist = 'Cherrydee',
	// 	albumTitle = 'Dey (feat. KDream & YCHINZ) - Single',
	// 	coverUrl = '',
	// 	meta = 'WORLDWIDE • 2021',
	// 	tracks = [{ id: 1, title: 'Dey (feat. KDream & YCHINZ)', isPlaying: false }],
	// 	releaseInfo = {
	// 		date: '18 December 2021',
	// 		duration: '1 song, 2 minutes',
	// 		copyright: '℗ 2021 Cherrydee Beatstore'
	// 	},
	// 	relatedAlbums = [
	// 		{
	// 			id: 1,
	// 			title: 'Fashion - Single',
	// 			year: '2024',
	// 			explicit: true,
	// 			cover:
	// 				'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
	// 		},
	// 		{
	// 			id: 2,
	// 			title: 'Available (feat. Beejay & Chilling OG) - Single',
	// 			year: '2019',
	// 			explicit: false,
	// 			cover:
	// 				'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
	// 		}
	// 	]
	// }: {
	// 	artist: string;
	// 	albumTitle: string;
	// 	coverUrl: string;
	// 	meta: string;
	// 	tracks: { id: number; title: string; isPlaying: boolean }[];
	// 	releaseInfo: { date: string; duration: string; copyright: string };
	// 	relatedAlbums: { id: number; title: string; year: string; explicit: boolean; cover: string }[];
	// } = $props();
	// let releaseInfo = {
	// 	date: '18 December 2021',
	// 	duration: '1 song, 2 minutes',
	// 	copyright: '℗ 2021 Cherrydee Beatstore'
	// };

	// Fetch preview URL from iTunes API (direct search, no Odesli)
	async function fetchPreviewUrl(): Promise<string | null> {
		// Need at least a title to search
		if (!link.title) {
			return null;
		}

		try {
			const response = await fetch('/api/preview', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					artist: link.artist,
					title: link.title
				})
			});

			if (!response.ok) return null;

			const data = await response.json();
			return data.previewUrl || null;
		} catch {
			return null;
		}
	}

	async function loadPreReleaseStream(): Promise<string | null> {
		if (!link.slug) {
			return null;
		}

		const response = await fetch(`/api/public/links/slug/${link.slug}/pre-release/stream`, {
			credentials: 'include'
		});

		if (!response.ok) {
			return null;
		}

		const blob = await response.blob();
		const url = URL.createObjectURL(blob);
		if (streamBlobUrl) {
			URL.revokeObjectURL(streamBlobUrl);
		}
		streamBlobUrl = url;
		return url;
	}

	async function unlockPreRelease() {
		unlockError = null;
		if (link.requiresPassword && !unlockPasscode.trim()) {
			unlockError = 'Passcode is required to unlock this track.';
			return;
		}

		if (link.requiresEmailCapture && !unlockEmail.includes('@')) {
			unlockError = 'Please enter a valid email address to unlock.';
			return;
		}

		isUnlocking = true;

		try {
			const response = await fetch(`/api/public/links/slug/${link.slug}/pre-release/gate`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: unlockEmail || undefined,
					name: unlockName || undefined,
					passcode: unlockPasscode || undefined
				})
			});

			if (!response.ok) {
				const errorResponse = await response.json().catch(() => ({}));
				throw new Error(errorResponse.error || 'Failed to unlock pre-release track');
			}

			preReleaseUnlocked = true;
			showUnlockModal = false;
			unlockPasscode = '';
			await loadPreReleaseStream();
			await togglePlayback();
		} catch (err: any) {
			unlockError = err?.message || 'Unable to unlock pre-release track';
		} finally {
			isUnlocking = false;
		}
	}

	// Simple play/pause toggle with direct MP3
	async function togglePlayback() {
		// If already playing, pause
		if (isPlaying && audio) {
			audio.pause();
			audio.currentTime = 0;
			isPlaying = false;
			return;
		}

		// If paused, resume
		if (audio && !isPlaying) {
			await audio.play();
			isPlaying = true;
			return;
		}

		const needsPreReleaseUnlock = link.isPreRelease && !!link.audioFileUrl;
		if (needsPreReleaseUnlock && !preReleaseUnlocked) {
			showUnlockModal = true;
			return;
		}

		isLoading = true;
		previewError = null;

		try {
			let url = previewUrl;
			if (needsPreReleaseUnlock) {
				url = streamBlobUrl || (await loadPreReleaseStream());
			}

			if (!url) {
				if (!needsPreReleaseUnlock) {
					url = await fetchPreviewUrl();
					previewUrl = url;
				}
			}

			if (!url) {
				previewError = needsPreReleaseUnlock
					? 'Pre-release audio is not available yet.'
					: 'Preview not available for this track';
				toast.error(previewError);
				return;
			}

			audio = new Audio(url);

			audio.addEventListener('ended', () => {
				isPlaying = false;
			});

			audio.addEventListener('error', () => {
				previewError = 'Failed to play preview';
				toast.error(previewError);
				isPlaying = false;
			});

			await audio.play();
			isPlaying = true;
		} catch (err) {
			console.error('Playback error:', err);
			previewError = 'Failed to play preview';
			toast.error(previewError);
		} finally {
			isLoading = false;
		}
	}

	// Reset audio when navigating to a different song (SvelteKit reuses the component)
	$effect(() => {
		// Track the current link slug — when it changes, clean up audio
		const _currentSlug = link.slug;

		return () => {
			// Cleanup runs when slug changes or component unmounts
			if (audio) {
				audio.pause();
				audio = null;
			}
			if (streamBlobUrl) {
				URL.revokeObjectURL(streamBlobUrl);
			}
			isPlaying = false;
			isLoading = false;
			previewUrl = null;
			previewError = null;
			streamBlobUrl = null;
			showUnlockModal = false;
			preReleaseUnlocked = false;
			unlockPasscode = '';
			unlockEmail = '';
			unlockName = '';
			unlockError = null;
			navigatingArtist = null;
		};
	});
</script>

<div
	class="pb-24 font-sans text-black dark:text-white relative min-h-screen transition-colors duration-500 selection:bg-[var(--teal)]/30 dark:selection:bg-[var(--accent)]/30"
>
	<!-- Dynamic Blurred Background -->
	<div
		class="inset-0 bg-white fixed z-0 h-full w-full overflow-hidden transition-colors duration-500 dark:bg-[#0A0A0B]"
	>
		{#if coverUrl}
			<img
				src={coverUrl}
				alt="Background"
				class="h-full w-full scale-110 object-cover opacity-30 mix-blend-multiply blur-[120px] saturate-150 transition-opacity duration-500 dark:opacity-60 dark:mix-blend-screen"
			/>
		{/if}
		<div
			class="inset-0 from-white/40 via-white/70 to-white/95 dark:from-black/20 dark:via-black/60 dark:to-black/90 absolute bg-gradient-to-b backdrop-blur-[20px] transition-colors duration-500"
		></div>
	</div>

	<div class="relative z-10 flex min-h-screen flex-col">
		<main
			class="max-w-5xl gap-12 px-6 pt-12 md:flex-row md:items-start md:gap-16 mx-auto flex w-full flex-col items-center"
		>
			<!-- Album Sticky Profile -->
			<section
				class="md:sticky md:top-32 md:w-[350px] md:items-start md:text-left flex flex-shrink-0 flex-col items-center text-center"
			>
				<div class="mb-6 group w-52 md:w-64 lg:w-full relative aspect-square">
					<div
						class="-inset-4 rounded-3xl bg-black/5 dark:bg-white/5 blur-xl absolute opacity-0 transition-opacity duration-500 group-hover:opacity-100"
					></div>
					<button
						onclick={togglePlayback}
						disabled={isLoading || !link.title}
						title={!link.title ? 'Preview not available for this album' : ''}
						class="inset-0 rounded-2xl hover:bg-black/10 dark:hover:bg-white/10 absolute z-20 flex items-center justify-center border-transparent bg-transparent transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50"
					>
						<div
							class="h-12 w-12 md:h-16 md:w-16 bg-white/10 dark:bg-black/30 backdrop-blur-sm border-white/20 shadow-lg flex items-center justify-center rounded-full border transition-transform duration-300 group-hover:scale-110 dark:border-(--border)"
						>
							{#if isLoading}
								<svg
									class="animate-spin size-6 md:size-8 text-(--teal) dark:text-(--accent)"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
								>
									<circle
										class="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										stroke-width="4"
									></circle>
									<path
										class="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									></path>
								</svg>
							{:else if isPlaying}
								<HugeiconsIcon
									icon={PauseIcon}
									className="size-6 md:size-8 text-(--teal) dark:text-(--accent)"
								/>
							{:else}
								<HugeiconsIcon
									icon={PlayIcon}
									className="size-6 md:size-8 text-(--teal) dark:text-(--accent)"
								/>
							{/if}
						</div>
					</button>
					<Badge
						class="md:hidden bg-black/5 backdrop-blur-sm top-2 left-2 dark:bg-white/10 text-black/60 dark:text-white/70 border-black/10 dark:border-white/20 font-bold tracking-wider absolute z-20 w-fit text-[10px] uppercase"
					>
						{albumType}
					</Badge>
					<img
						src={coverUrl}
						alt="Album Cover"
						class="rounded-2xl border-black/5 dark:border-white/10 relative z-10 h-full w-full border object-cover shadow-[0_20px_40px_rgba(0,0,0,0.15)] transition-transform duration-500 group-hover:scale-[1.02] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
					/>
				</div>

				<div class="mb-4 space-y-2 w-full">
					<div class="gap-2 md:justify-start flex items-center justify-center">
						<h1
							class="text-3xl md:text-4xl leading-tight font-extrabold text-black dark:text-white tracking-tight drop-shadow-sm dark:drop-shadow-lg transition-colors duration-500"
						>
							{albumTitle}
						</h1>
						<Badge
							class="md:block bg-black/5 dark:bg-white/10 text-black/60 dark:text-white/70 border-black/10 dark:border-white/20 font-bold tracking-wider hidden w-fit text-[10px] uppercase"
						>
							{albumType}
						</Badge>
					</div>
					<div
						class="text-xl font-semibold text-(--teal) dark:text-(--accent) drop-shadow-sm dark:drop-shadow-md transition-colors duration-500"
					>
						{#each artist.split(',') as artistName, index}
							<button
								onclick={() => navigateToArtist(artistName.trim())}
								disabled={navigatingArtist === artistName.trim()}
								class="transition-colors hover:text-(--teal) hover:underline disabled:cursor-not-allowed disabled:opacity-50 dark:hover:text-(--accent)"
							>
								{#if navigatingArtist === artistName.trim()}
									<svg
										class="animate-spin size-4 mr-1 inline"
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
									>
										<circle
											class="opacity-25"
											cx="12"
											cy="12"
											r="10"
											stroke="currentColor"
											stroke-width="4"
										></circle>
										<path
											class="opacity-75"
											fill="currentColor"
											d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
										></path>
									</svg>
								{/if}
								{artistName.trim()}
							</button>
							{#if index < artist.split(',').length - 1}
								<span class="mx-1">•</span>
							{/if}
						{/each}
					</div>
				</div>

				<!-- {#if previewError}
					<div
						class="mt-3 px-4 py-2 rounded-lg bg-red-500/10 border-red-500/20 text-red-400 text-sm border text-center"
					>
						{previewError}
					</div>
				{/if} -->
			</section>

			<section class="min-w-0 max-w-lg md:flex-grow flex w-full flex-1 flex-col">
				<h3
					class="mb-6 text-lg font-bold text-black/80 dark:text-white/90 drop-shadow-sm dark:drop-shadow-md tracking-widest pl-2 uppercase transition-colors duration-500"
				>
					{link.isPreRelease ? 'Pre-save On' : 'Available On'}
				</h3>
				{#if link.isPreRelease}
					{#if availablePlatforms.length > 0}
						<p class="mb-4 text-sm text-black/60 dark:text-white/70 pl-2">
							Fans can pre-save on Spotify and Apple Music while this track remains unreleased.
						</p>
					{:else}
						<p class="mb-4 text-sm text-black/60 dark:text-white/70 pl-2">
							This pre-save campaign is active. Add Spotify or Apple Music URLs in the dashboard to
							enable pre-save buttons.
						</p>
					{/if}
				{/if}
				<div class="gap-3 flex flex-col">
					{#each availablePlatforms as platform}
						<button
							onclick={() => onPlatformClick(platform.url, platform.name)}
							class="group rounded-2xl border-black/5 dark:border-white/5 bg-white/40 dark:bg-white/5 p-3 md:p-4 backdrop-blur-xl hover:-translate-y-1 hover:border-black/10 dark:hover:border-white/20 hover:bg-white/60 dark:hover:bg-white/10 hover:shadow-xl dark:hover:shadow-2xl relative flex w-full cursor-pointer items-center justify-between border transition-all duration-300 hover:shadow-[var(--teal)]/10 dark:hover:shadow-[var(--accent)]/10"
						>
							<div class="gap-3 md:gap-4 flex items-center">
						<div
								class="h-10 w-10 md:h-12 md:w-12 shadow-lg flex items-center justify-center rounded-[14px] transition-transform duration-300 group-hover:scale-110"
								style="background: {getPlatformColor(platform.name)}"
							>
								{#if getPlatformSvg(platform.name)}
									<img
										src={getPlatformSvg(platform.name)}
										alt={platform.name}
										class="size-5 md:size-6 shrink-0 drop-shadow-md"
									/>
								{:else}
									<span
										class="size-5 md:size-6 flex items-center justify-center text-white text-xs font-bold drop-shadow-md"
									>
										{platform.name.slice(0, 2).toUpperCase()}
									</span>
								{/if}
							</div>
								<span
									class="font-bold text-base md:text-lg text-black/80 dark:text-white/90 drop-shadow-sm group-hover:text-black dark:group-hover:text-white transition-colors duration-500"
								>
									{platform.name}
								</span>
							</div>

							<div class="pr-1 md:pr-2">
								{#if clickedNames.includes(platform.name)}
									<Badge
										class="bg-black/5 dark:bg-white/20 text-black/60 dark:text-white backdrop-blur-md border-black/5 dark:border-white/10 tracking-widest font-bold text-[9px] uppercase"
										>Opened</Badge
									>
								{:else}
									<div
										class="h-7 w-7 md:h-8 md:w-8 bg-black/5 dark:bg-white/5 group-hover:bg-black/10 dark:group-hover:bg-white/20 flex items-center justify-center rounded-full transition-colors"
									>
										<HugeiconsIcon
											icon={ExternalLink}
											className="size-3.5 md:size-4 text-black/40 dark:text-white/60 group-hover:text-black/80 dark:group-hover:text-white"
										/>
									</div>
								{/if}
							</div>
						</button>
					{/each}
				</div>

				{#if filteredRelatedAlbums.length > 0}
					<div class="mt-20">
						<div class="mb-8 pl-2 flex items-center justify-between">
							<h3
								class="text-lg font-bold text-black/80 dark:text-white/90 tracking-widest drop-shadow-sm dark:drop-shadow-md uppercase transition-colors duration-500"
							>
								More By {mainArtist}
							</h3>
						</div>

						<div
							class="hide-scrollbar gap-6 pb-8 md:grid md:grid-cols-2 lg:grid-cols-2 flex snap-x snap-mandatory overflow-x-auto"
						>
							{#each filteredRelatedAlbums as album}
								<a
									href={`/${album.slug}`}
									class="group md:w-full relative block w-[180px] flex-shrink-0 cursor-pointer snap-start"
								>
									<div
										class="mb-4 rounded-2xl shadow-lg dark:shadow-xl shadow-black/10 dark:shadow-black/40 border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5 backdrop-blur-sm aspect-square overflow-hidden border transition-all duration-500"
									>
										<img
											src={album.artwork || album.thumbnail}
											alt={album.title}
											class="ease-out h-full w-full object-cover transition-transform duration-700 group-hover:scale-110 group-hover:brightness-110"
										/>
									</div>
									<div class="gap-3 px-1 flex items-start justify-between">
										<div class="min-w-0">
											<h4
												class="text-base font-bold text-black/80 dark:text-white/90 group-hover:text-black dark:group-hover:text-white truncate transition-colors"
											>
												{album.title}
											</h4>
											<p class="mt-1 text-sm font-medium text-black/50 dark:text-white/50">
												{new Date(album.createdAt).getFullYear()}
											</p>
										</div>
										{#if album.genre}
											<span
												class="mt-1 rounded bg-black/5 dark:bg-white/10 px-2 py-0.5 font-bold text-black/60 dark:text-white/70 border-black/10 dark:border-white/20 flex-shrink-0 border text-[10px]"
												>{album.genre}</span
											>
										{/if}
									</div>
								</a>
							{/each}
						</div>
					</div>
				{/if}
			</section>
			{#if showUnlockModal}
				<!-- class="mt-4 rounded-3xl bg-white/95 p-4 shadow-sm absolute z-50 border border-[#e2e8f0] dark:border-[var(--border)] dark:bg-[var(--card)]" -->
				<div class="top-0 left-0 fixed z-20 grid h-full w-full place-items-center">
					<div class="inset-0 bg-black/30 backdrop-blur-lg fixed dark:bg-(--bg)/20"></div>
					<div
						class="max-w-sm gap-6 bg-white backdrop-blur-lg p-6 rounded-[18px] border-transparent dark:border-[var(--border)] dark:bg-[var(--card)]"
						style="box-shadow: 0px 10px 30px 0px #0b12201a;"
					>
						<p class="mb-3 text-sm font-semibold text-[#0f172a] dark:text-[var(--text)]">
							Unlock early access to this pre-release track
						</p>
						{#if link.requiresPassword}
							<label
								for="unlock-passcode"
								class="mb-1 font-semibold block text-[12px] text-[#475569] dark:text-[var(--text-secondary)]"
							>
								Passcode
							</label>
							<input
								id="unlock-passcode"
								type="text"
								bind:value={unlockPasscode}
								class="mb-3 px-3 py-2 text-sm w-full rounded-[12px] border border-[#e2e8f0] bg-[#f8fafc] text-[#0f172a] transition outline-none focus:border-[var(--teal)] dark:border-[var(--border)] dark:bg-[var(--card)] dark:text-[var(--text)]"
							/>
						{/if}
						{#if link.requiresEmailCapture}
							<label
								for="unlock-email"
								class="mb-1 font-semibold block text-[12px] text-[#475569] dark:text-[var(--text-secondary)]"
							>
								Email address
							</label>
							<input
								id="unlock-email"
								type="email"
								bind:value={unlockEmail}
								class="mb-3 px-3 py-2 text-sm w-full rounded-[12px] border border-[#e2e8f0] bg-[#f8fafc] text-[#0f172a] transition outline-none focus:border-[var(--teal)] dark:border-[var(--border)] dark:bg-[var(--card)] dark:text-[var(--text)]"
							/>
							<label
								for="unlock-name"
								class="mb-1 font-semibold block text-[12px] text-[#475569] dark:text-[var(--text-secondary)]"
							>
								Name (optional)
							</label>
							<input
								id="unlock-name"
								type="text"
								bind:value={unlockName}
								class="mb-3 px-3 py-2 text-sm w-full rounded-[12px] border border-[#e2e8f0] bg-[#f8fafc] text-[#0f172a] transition outline-none focus:border-[var(--teal)] dark:border-[var(--border)] dark:bg-[var(--card)] dark:text-[var(--text)]"
							/>
						{/if}
						{#if unlockError}
							<p class="mb-3 text-sm text-red-500">{unlockError}</p>
						{/if}
						<div class="gap-3 flex flex-wrap">
							<button
								onclick={unlockPreRelease}
								disabled={isUnlocking}
								class="px-4 py-2 text-sm font-semibold inline-flex items-center justify-center rounded-[12px] bg-[var(--teal)] text-[#0f172a] transition hover:bg-[#22c55e] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[var(--accent)] dark:hover:bg-[var(--accent)]/90"
							>
								{#if isUnlocking}Unlocking...{:else}Unlock Access{/if}
							</button>
							<button
								onclick={() => (showUnlockModal = false)}
								type="button"
								class="px-4 py-2 text-sm font-semibold inline-flex items-center justify-center rounded-[12px] border border-[#cbd5e1] bg-transparent text-[#475569] transition hover:bg-[#f8fafc] dark:border-[var(--border)] dark:text-[var(--text)] dark:hover:bg-[var(--border)]"
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			{/if}
		</main>

		<footer
			class="py-8 pb-24 text-center text-sm text-black/40 dark:text-white/40 relative z-10 transition-colors duration-500"
		>
			<p>© {new Date().getFullYear()} {app.name}. All rights reserved.</p>
		</footer>
	</div>
</div>

<style>
	/* Utility to hide the scrollbar for the horizontal album list on mobile, but keep functionality */
	.hide-scrollbar::-webkit-scrollbar {
		display: none;
	}
	.hide-scrollbar {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
</style>
