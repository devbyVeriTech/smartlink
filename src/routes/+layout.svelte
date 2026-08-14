<script lang="ts">
	import '../app.css';
	import './theme.css';

	import { browser } from '$app/environment';
	import { Toaster } from 'svelte-sonner';

	let { children } = $props();

	function applyTheme(theme: string | null) {
		if (!browser) return;
		const resolved = theme ?? 'system';
		const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		const isDark = resolved === 'dark' || (resolved === 'system' && prefersDark);
		document.documentElement.classList.toggle('dark', isDark);
	}

	$effect(() => {
		if (browser) {
			applyTheme(localStorage.getItem('theme'));
		}
	});

	if (browser) {
		window
			.matchMedia('(prefers-color-scheme: dark)')
			.addEventListener('change', () => applyTheme(localStorage.getItem('theme')));
		window.addEventListener('storage', (e) => {
			if (e.key === 'theme') applyTheme(e.newValue);
		});
	}
</script>

<svelte:head>
	<link rel="icon" href="/uploads/logos/favicon.webp" type="image/webp" />
</svelte:head>

<Toaster />

{@render children()}