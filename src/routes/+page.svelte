<script lang="ts">
	/* eslint-disable svelte/no-navigation-without-resolve -- external absolute URL (main app origin), resolve() only applies to internal paths */
	import { app } from '$lib/utils/app';
	import { env } from '$env/dynamic/public';
</script>

<svelte:head>
	<title>{app.name}</title>
</svelte:head>

<div class="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
	<img src="/uploads/logos/light-logo.webp" alt={app.name} class="h-16 w-16 rounded-full" />
	<h1 class="text-2xl font-bold text-[var(--text)]">{app.name}</h1>
	<p class="text-[var(--text-secondary)]">Smart links for music on every platform.</p>
	<a
		href={env.PUBLIC_MAIN_URL || 'https://www.xoniq.pro'}
		class="rounded-xl bg-[var(--teal)] px-4 py-2 font-semibold text-[#0f172a]">Visit Xoniq</a
	>
</div>
