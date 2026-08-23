<script lang="ts">
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import { onMount } from 'svelte';
	import { Badge } from '$lib/components/ui/badge';
	import {
		ExternalLink,
		PlayIcon,
		MusicNote01Icon,
		Download01Icon,
		ShoppingBag01Icon,
		Clock02Icon,
		ArrowRight01Icon
	} from '@hugeicons/core-free-icons';

	import { PauseIcon } from '@hugeicons/core-free-icons';
	import { toast } from 'svelte-sonner';
	import { getMainArtist } from '$lib/utils/string';
	import { app } from '$lib/utils/app';
	import { getPlatformSvg, getPlatformColor } from '$lib/utils/platforms';
	import PreReleaseUnlockDialog from '$lib/components/PreReleaseUnlockDialog.svelte';

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

	// Pre-release surfaces
	let linkNeedsGate = $derived(
		Boolean(link.isPreRelease) &&
			(link.requiresPassword ||
				link.requiresEmailCapture ||
				Boolean(link.maxAccessCount) ||
				Boolean(link.buyEnabled))
	);
	let canDownload = $derived(
		link.isPreRelease && (link.accessType === 'downloadable' || link.accessType === 'both')
	);
	let buyUrl = $derived(
		link.buyEnabled && link.buyPrice ? `${app.mainUrl}/checkout/link/${link.id}` : null
	);
	let buyDisplay = $derived(
		link.buyEnabled && link.buyPrice
			? `₦${(link.buyPrice / 100).toLocaleString('en-NG', { maximumFractionDigits: 0 })}`
			: null
	);
	let downloadLoading = $state(false);
	let countdown = $state<{ d: number; h: number; m: number; s: number } | null>(null);

	let mainArtist = $derived(getMainArtist(artist));
	let filteredRelatedAlbums = $derived(
		relatedAlbums.filter(
			(album: any) => getMainArtist(album.artist).toLowerCase() === mainArtist.toLowerCase() && !album.isPreRelease
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

	let lastPositionUpdate = 0;

	function supportsMediaSession(): boolean {
		return typeof navigator !== 'undefined' && 'mediaSession' in navigator;
	}

	function setMediaMetadata() {
		if (!supportsMediaSession() || !albumTitle) return;
		try {
			const artworkSrc = coverUrl || app.logo;
			const artwork = artworkSrc
				? [
						{ src: artworkSrc, sizes: '512x512', type: 'image/jpeg' },
						{ src: artworkSrc, sizes: '256x256', type: 'image/jpeg' },
						{ src: artworkSrc, sizes: '96x96', type: 'image/jpeg' }
					]
				: [];
			navigator.mediaSession.metadata = new MediaMetadata({
				title: albumTitle,
				artist: artist || 'Unknown Artist',
				album: albumTitle,
				artwork
			});
		} catch {}
	}

	function updatePositionState() {
		if (!supportsMediaSession() || !audio) return;
		const ms = navigator.mediaSession as any;
		if (typeof ms.setPositionState !== 'function') return;
		const duration = audio.duration;
		if (!Number.isFinite(duration) || duration <= 0) return;
		const now = Date.now();
		if (now - lastPositionUpdate < 800 && audio.currentTime !== 0 && audio.currentTime !== duration) return;
		lastPositionUpdate = now;
		try {
			ms.setPositionState({
				duration,
				playbackRate: audio.playbackRate || 1,
				position: Math.min(Math.max(0, audio.currentTime), duration)
			});
		} catch {}
	}

	function setMediaActionHandlers() {
		if (!supportsMediaSession() || !audio) return;
		try {
			navigator.mediaSession.setActionHandler('play', async () => {
				try {
					await audio?.play();
				} catch {}
			});
			navigator.mediaSession.setActionHandler('pause', () => {
				audio?.pause();
			});
			navigator.mediaSession.setActionHandler('stop', () => {
				if (audio) {
					audio.pause();
					audio.currentTime = 0;
					isPlaying = false;
				}
				try {
					(navigator.mediaSession as any).playbackState = 'none';
				} catch {}
			});
			navigator.mediaSession.setActionHandler('seekbackward', (details: any) => {
				if (!audio) return;
				const offset = details?.seekOffset ?? 10;
				audio.currentTime = Math.max(0, audio.currentTime - offset);
				updatePositionState();
			});
			navigator.mediaSession.setActionHandler('seekforward', (details: any) => {
				if (!audio || !Number.isFinite(audio.duration)) return;
				const offset = details?.seekOffset ?? 10;
				audio.currentTime = Math.min(audio.duration, audio.currentTime + offset);
				updatePositionState();
			});
			navigator.mediaSession.setActionHandler('seekto', (details: any) => {
				if (!audio || !Number.isFinite(audio.duration)) return;
				if (details?.fastSeek && 'fastSeek' in audio) {
					(audio as any).fastSeek(details.seekTime);
					return;
				}
				audio.currentTime = Math.min(
					Math.max(0, details.seekTime ?? 0),
					audio.duration
				);
				updatePositionState();
			});
		} catch {}
	}

	function clearMediaSessionHandlers() {
		if (!supportsMediaSession()) return;
		for (const action of [
			'play',
			'pause',
			'stop',
			'seekbackward',
			'seekforward',
			'seekto'
		] as const) {
			try {
				navigator.mediaSession.setActionHandler(action, null);
			} catch {}
		}
	}

	function clearMediaSession() {
		if (!supportsMediaSession()) return;
		try {
			navigator.mediaSession.metadata = null;
		} catch {}
		try {
			(navigator.mediaSession as any).playbackState = 'none';
		} catch {}
		clearMediaSessionHandlers();
	}

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
		if ((link.requiresPassword || link.buyEnabled) && !unlockPasscode.trim()) {
			unlockError = link.buyEnabled
				? 'Enter the passcode you received by email after buying.'
				: 'Passcode is required to unlock this track.';
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

	async function togglePlayback() {
		if (isPlaying && audio) {
			audio.pause();
			audio.currentTime = 0;
			isPlaying = false;
			if (supportsMediaSession()) {
				try {
					(navigator.mediaSession as any).playbackState = 'paused';
				} catch {}
			}
			return;
		}

		if (audio && !isPlaying) {
			setMediaMetadata();
			setMediaActionHandlers();
			await audio.play();
			isPlaying = true;
			if (supportsMediaSession()) {
				try {
					(navigator.mediaSession as any).playbackState = 'playing';
				} catch {}
				updatePositionState();
			}
			return;
		}

		const hasPreview = link.isPreRelease && !!link.audioFileUrl;
		if (hasPreview && linkNeedsGate && !preReleaseUnlocked) {
			showUnlockModal = true;
			return;
		}

		isLoading = true;
		previewError = null;

		try {
			let url = previewUrl;
			if (hasPreview) {
				url = streamBlobUrl || (await loadPreReleaseStream());
			}

			if (!url) {
				if (!hasPreview) {
					url = await fetchPreviewUrl();
					previewUrl = url;
				}
			}

			if (!url) {
				previewError = hasPreview
					? 'Pre-release audio is not available yet.'
					: 'Preview not available for this track';
				toast.error(previewError);
				return;
			}

			audio = new Audio(url);
			audio.preload = 'metadata';

			audio.addEventListener('loadedmetadata', () => {
				updatePositionState();
			});
			audio.addEventListener('timeupdate', () => {
				updatePositionState();
			});
			audio.addEventListener('seeked', () => {
				updatePositionState();
			});
			audio.addEventListener('play', () => {
				isPlaying = true;
				if (supportsMediaSession()) {
					try {
						(navigator.mediaSession as any).playbackState = 'playing';
					} catch {}
				}
			});
			audio.addEventListener('pause', () => {
				isPlaying = false;
				if (supportsMediaSession()) {
					try {
						(navigator.mediaSession as any).playbackState = 'paused';
					} catch {}
				}
			});
			audio.addEventListener('ended', () => {
				isPlaying = false;
				if (supportsMediaSession()) {
					try {
						(navigator.mediaSession as any).playbackState = 'none';
					} catch {}
					const ms = navigator.mediaSession as any;
					if (typeof ms.setPositionState === 'function' && audio && Number.isFinite(audio.duration)) {
						try {
							ms.setPositionState({ duration: audio.duration, playbackRate: 1, position: 0 });
						} catch {}
					}
				}
			});

			audio.addEventListener('error', () => {
				previewError = 'Failed to play preview';
				toast.error(previewError);
				isPlaying = false;
				clearMediaSession();
			});

			setMediaMetadata();
			setMediaActionHandlers();
			await audio.play();
			isPlaying = true;
			if (supportsMediaSession()) {
				try {
					(navigator.mediaSession as any).playbackState = 'playing';
				} catch {}
				updatePositionState();
			}
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
		const _currentSlug = link.slug;

		return () => {
			if (audio) {
				audio.pause();
				audio.src = '';
				audio.load();
				audio = null;
			}
			if (streamBlobUrl) {
				URL.revokeObjectURL(streamBlobUrl);
			}
			clearMediaSession();
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
			lastPositionUpdate = 0;
		};
	});

	// Live countdown to expiry for pre-releases
	$effect(() => {
		if (!link.isPreRelease || !link.expiresAt) {
			countdown = null;
			return;
		}
		const compute = () => {
			const diff = new Date(link.expiresAt).getTime() - Date.now();
			if (diff <= 0) {
				countdown = null;
				return;
			}
			countdown = {
				d: Math.floor(diff / 86400000),
				h: Math.floor(diff / 3600000) % 24,
				m: Math.floor(diff / 60000) % 60,
				s: Math.floor(diff / 1000) % 60
			};
		};
		compute();
		const id = setInterval(compute, 1000);
		return () => clearInterval(id);
	});

	// Restore unlock state on reload when the unlock cookie is still present
	onMount(() => {
		if (link.isPreRelease && document.cookie.includes(`unlocked_pre_release_${link.id}=true`)) {
			preReleaseUnlocked = true;
		}
	});

	async function downloadPreRelease() {
		if (linkNeedsGate && !preReleaseUnlocked) {
			showUnlockModal = true;
			return;
		}

		downloadLoading = true;
		try {
			const response = await fetch(`/api/public/links/slug/${link.slug}/pre-release/download`, {
				credentials: 'include'
			});

			if (!response.ok) {
				const data = await response.json().catch(() => ({}));
				throw new Error(data.error || 'Download not available for this track');
			}

			const blob = await response.blob();
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `${link.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.mp3`;
			document.body.appendChild(a);
			a.click();
			a.remove();
			URL.revokeObjectURL(url);
		} catch (err: any) {
			toast.error(err?.message || 'Unable to download track');
		} finally {
			downloadLoading = false;
		}
	}
</script>

<div
	class="relative min-h-screen pb-24 font-sans text-black transition-colors duration-500 selection:bg-[var(--teal)]/30 dark:text-white dark:selection:bg-[var(--accent)]/30"
>
	<!-- Dynamic Blurred Background -->
	<div
		class="fixed inset-0 z-0 h-full w-full overflow-hidden bg-white transition-colors duration-500 dark:bg-[#0A0A0B]"
	>
		{#if coverUrl}
			<img
				src={coverUrl}
				alt="Background"
				class="h-full w-full scale-110 object-cover opacity-30 mix-blend-multiply blur-[120px] saturate-150 transition-opacity duration-500 dark:opacity-60 dark:mix-blend-screen"
			/>
		{/if}
		<div
			class="absolute inset-0 bg-gradient-to-b from-white/40 via-white/70 to-white/95 backdrop-blur-[20px] transition-colors duration-500 dark:from-black/20 dark:via-black/60 dark:to-black/90"
		></div>
	</div>

	<div class="relative z-10 flex min-h-screen flex-col">
		<main
			class="mx-auto flex w-full max-w-5xl flex-col items-center gap-12 px-6 pt-12 md:flex-row md:items-start md:gap-16"
		>
			<!-- Album Sticky Profile -->
			<section
				class="flex flex-shrink-0 flex-col items-center text-center md:sticky md:top-32 md:w-[350px] md:items-start md:text-left"
			>
				<div class="group relative mb-6 aspect-square w-52 md:w-64 lg:w-full">
					<div
						class="absolute -inset-4 rounded-3xl bg-black/5 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100 dark:bg-white/5"
					></div>
					<button
						onclick={togglePlayback}
						disabled={isLoading || !link.title}
						title={!link.title ? 'Preview not available for this album' : ''}
						class="absolute inset-0 z-20 flex items-center justify-center rounded-2xl border-transparent bg-transparent transition-all duration-300 hover:bg-black/10 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-white/10"
					>
						<div
							class="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 shadow-lg backdrop-blur-sm transition-transform duration-300 group-hover:scale-110 md:h-16 md:w-16 dark:border-(--border) dark:bg-black/30"
						>
							{#if isLoading}
								<svg
									class="size-6 animate-spin text-(--teal) md:size-8 dark:text-(--accent)"
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
						class="absolute top-2 left-2 z-20 w-fit border-black/10 bg-black/5 text-[10px] font-bold tracking-wider text-black/60 uppercase backdrop-blur-sm md:hidden dark:border-white/20 dark:bg-white/10 dark:text-white/70"
					>
						{albumType}
					</Badge>
					<img
						src={coverUrl}
						alt="Album Cover"
						class="relative z-10 h-full w-full rounded-2xl border border-black/5 object-cover shadow-[0_20px_40px_rgba(0,0,0,0.15)] transition-transform duration-500 group-hover:scale-[1.02] dark:border-white/10 dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
					/>
				</div>

				<div class="mb-4 w-full space-y-2">
					<div class="flex items-center justify-center gap-2 md:justify-start">
						<h1
							class="text-3xl leading-tight font-extrabold tracking-tight text-black drop-shadow-sm transition-colors duration-500 md:text-4xl dark:text-white dark:drop-shadow-lg"
						>
							{albumTitle}
						</h1>
						<Badge
							class="hidden w-fit border-black/10 bg-black/5 text-[10px] font-bold tracking-wider text-black/60 uppercase md:block dark:border-white/20 dark:bg-white/10 dark:text-white/70"
						>
							{albumType}
						</Badge>
						{#if link.isPreRelease}
							<Badge
								class="hidden w-fit border-[var(--teal)]/20 bg-[var(--teal)]/10 text-[10px] font-bold tracking-wider text-(--teal) uppercase md:inline-flex dark:border-[var(--accent)]/25 dark:bg-[var(--accent)]/10 dark:text-(--accent)"
							>
								Pre-Release
							</Badge>
						{/if}
					</div>
					<div
						class="text-xl font-semibold text-(--teal) drop-shadow-sm transition-colors duration-500 dark:text-(--accent) dark:drop-shadow-md"
					>
						{#each artist.split(',') as artistName, index}
							<button
								onclick={() => navigateToArtist(artistName.trim())}
								disabled={navigatingArtist === artistName.trim()}
								class="transition-colors hover:text-(--teal) hover:underline disabled:cursor-not-allowed disabled:opacity-50 dark:hover:text-(--accent)"
							>
								{#if navigatingArtist === artistName.trim()}
									<svg
										class="mr-1 inline size-4 animate-spin"
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

			<section class="flex w-full max-w-lg min-w-0 flex-1 flex-col md:flex-grow">
				{#if !link.isPreRelease || availablePlatforms.length > 0}
					<h3
						class="mb-6 pl-2 text-lg font-bold tracking-widest text-black/80 uppercase drop-shadow-sm transition-colors duration-500 dark:text-white/90 dark:drop-shadow-md"
					>
						{link.isPreRelease ? 'Pre-save On' : 'Available On'}
					</h3>
					{#if link.isPreRelease && availablePlatforms.length > 0}
						<p class="mb-4 pl-2 text-sm text-black/60 dark:text-white/70">
							Fans can pre-save on Spotify and Apple Music while this track remains unreleased.
						</p>
					{/if}
					<div class="flex flex-col gap-3">
						{#each availablePlatforms as platform}
						<button
							onclick={() => onPlatformClick(platform.url, platform.name)}
							class="group relative flex w-full cursor-pointer items-center justify-between rounded-2xl border border-black/5 bg-white/40 p-3 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-black/10 hover:bg-white/60 hover:shadow-[var(--teal)]/10 hover:shadow-xl md:p-4 dark:border-white/5 dark:bg-white/5 dark:hover:border-white/20 dark:hover:bg-white/10 dark:hover:shadow-[var(--accent)]/10 dark:hover:shadow-2xl"
						>
							<div class="flex items-center gap-3 md:gap-4">
								<div
									class="flex h-10 w-10 items-center justify-center rounded-[14px] shadow-lg transition-transform duration-300 group-hover:scale-110 md:h-12 md:w-12"
									style="background: {getPlatformColor(platform.name)}"
								>
									{#if getPlatformSvg(platform.name)}
										<img
											src={getPlatformSvg(platform.name)}
											alt={platform.name}
											class="size-5 shrink-0 drop-shadow-md md:size-6"
										/>
									{:else}
										<span
											class="flex size-5 items-center justify-center text-xs font-bold text-white drop-shadow-md md:size-6"
										>
											{platform.name.slice(0, 2).toUpperCase()}
										</span>
									{/if}
								</div>
								<span
									class="text-base font-bold text-black/80 drop-shadow-sm transition-colors duration-500 group-hover:text-black md:text-lg dark:text-white/90 dark:group-hover:text-white"
								>
									{platform.name}
								</span>
							</div>

							<div class="pr-1 md:pr-2">
								{#if clickedNames.includes(platform.name)}
									<Badge
										class="border-black/5 bg-black/5 text-[9px] font-bold tracking-widest text-black/60 uppercase backdrop-blur-md dark:border-white/10 dark:bg-white/20 dark:text-white"
										>Opened</Badge
									>
								{:else}
									<div
										class="flex h-7 w-7 items-center justify-center rounded-full bg-black/5 transition-colors group-hover:bg-black/10 md:h-8 md:w-8 dark:bg-white/5 dark:group-hover:bg-white/20"
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
				{/if}

				{#if link.isPreRelease}
					<div
						class="mt-12 rounded-[22px] border border-[var(--teal)]/20 bg-[var(--teal)]/10 p-5 backdrop-blur-xl md:p-6 dark:border-[var(--accent)]/25 dark:bg-[var(--accent)]/10"
					>
						<div class="mb-4 flex flex-wrap items-center justify-between gap-3">
							<h3
								class="text-lg font-bold tracking-widest text-black/80 uppercase transition-colors duration-500 dark:text-white/90"
							>
								Pre-Release
							</h3>
							{#if countdown}
								<span
									class="inline-flex items-center gap-1.5 rounded-full bg-black/5 px-3 py-1 text-xs font-bold text-black/70 tabular-nums dark:bg-white/10 dark:text-white/80"
								>
									<HugeiconsIcon
										icon={Clock02Icon}
										className="size-4 text-(--teal) dark:text-(--accent)"
									/>
									Drops in {countdown.d}d {countdown.h}h {countdown.m}m {countdown.s}s
								</span>
							{/if}
						</div>

						<div class="flex flex-col gap-3">
							{#if canDownload}
								<button
									onclick={downloadPreRelease}
									disabled={downloadLoading}
									class="group relative flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border border-black/5 bg-white/50 p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/5"
								>
									<span class="flex items-center gap-3">
										<span
											class="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[var(--teal)]/10 dark:bg-[var(--accent)]/10"
										>
											<HugeiconsIcon
												icon={Download01Icon}
												className="size-5 text-(--teal) dark:text-(--accent)"
											/>
										</span>
										<span class="text-left">
											<span class="block text-base font-bold text-black/80 dark:text-white/90"
												>{downloadLoading ? 'Downloading...' : 'Download'}</span
											>
											<span class="block text-xs font-medium text-black/50 dark:text-white/50"
												>Grab the track before everyone else</span
											>
										</span>
									</span>
									<span class="pr-1 text-sm font-bold text-(--teal) uppercase dark:text-(--accent)"
										>Free</span
									>
								</button>
							{/if}

							{#if buyUrl}
								<a
									href={buyUrl}
									target="_blank"
									rel="noopener noreferrer"
									class="group relative flex w-full items-center justify-between gap-3 rounded-2xl border bg-[var(--teal)] p-4 shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl dark:bg-[var(--accent)] dark:hover:shadow-[var(--accent)]/30"
								>
									<span class="flex items-center gap-3">
										<span
											class="flex h-10 w-10 items-center justify-center rounded-[14px] bg-black/10 text-black dark:text-black"
										>
											<HugeiconsIcon icon={ShoppingBag01Icon} className="size-5" />
										</span>
										<span class="text-left">
											<span class="block text-base font-extrabold text-black dark:text-black"
												>Buy • {buyDisplay}</span
											>
											<span class="block text-xs font-semibold text-black/70 dark:text-black/70"
												>Pay once — your listen passcode is emailed instantly</span
											>
										</span>
									</span>
									<HugeiconsIcon
										icon={ArrowRight01Icon}
										className="size-5 text-black dark:text-black"
									/>
								</a>
							{/if}

							{#if link.maxAccessCount}
								<p class="text-xs font-medium text-black/50 dark:text-white/50">
									Limited to {link.maxAccessCount} listener{link.maxAccessCount === 1 ? '' : 's'} —
									{link.accessCount ?? 0} already claimed.
								</p>
							{/if}

							{#if !canDownload && !buyUrl && !link.maxAccessCount}
								<p class="text-xs font-medium text-black/50 dark:text-white/50">
									Pre-save or pre-order this track to be first in line when it drops.
								</p>
							{/if}
						</div>
					</div>
				{/if}

				{#if !link.isPreRelease && filteredRelatedAlbums.length > 0}
					<div class="mt-20">
						<div class="mb-8 flex items-center justify-between pl-2">
							<h3
								class="text-lg font-bold tracking-widest text-black/80 uppercase drop-shadow-sm transition-colors duration-500 dark:text-white/90 dark:drop-shadow-md"
							>
								More By {mainArtist}
							</h3>
						</div>

						<div
							class="hide-scrollbar flex snap-x snap-mandatory gap-6 overflow-x-auto pb-8 md:grid md:grid-cols-2 lg:grid-cols-2"
						>
							{#each filteredRelatedAlbums as album}
								<a
									href={`/${album.slug}`}
									class="group relative block w-[180px] flex-shrink-0 cursor-pointer snap-start md:w-full"
								>
									<div
										class="mb-4 aspect-square overflow-hidden rounded-2xl border border-black/5 bg-black/5 shadow-lg shadow-black/10 backdrop-blur-sm transition-all duration-500 dark:border-white/10 dark:bg-white/5 dark:shadow-xl dark:shadow-black/40"
									>
										<img
											src={album.artwork || album.thumbnail}
											alt={album.title}
											class="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 group-hover:brightness-110"
										/>
									</div>
									<div class="flex items-start justify-between gap-3 px-1">
										<div class="min-w-0">
											<h4
												class="truncate text-base font-bold text-black/80 transition-colors group-hover:text-black dark:text-white/90 dark:group-hover:text-white"
											>
												{album.title}
											</h4>
											<p class="mt-1 text-sm font-medium text-black/50 dark:text-white/50">
												{new Date(album.createdAt).getFullYear()}
											</p>
										</div>
										{#if album.genre}
											<span
												class="mt-1 flex-shrink-0 rounded border border-black/10 bg-black/5 px-2 py-0.5 text-[10px] font-bold text-black/60 dark:border-white/20 dark:bg-white/10 dark:text-white/70"
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
			{#if link.isPreRelease}
				<PreReleaseUnlockDialog
					bind:open={showUnlockModal}
					{link}
					{isUnlocking}
					{unlockError}
					bind:unlockPasscode
					bind:unlockEmail
					bind:unlockName
					onUnlock={unlockPreRelease}
				/>
			{/if}
		</main>

		<footer
			class="relative z-10 py-8 pb-24 text-center text-sm text-black/40 transition-colors duration-500 dark:text-white/40"
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
