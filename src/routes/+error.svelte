<script lang="ts">
	import { page } from '$app/state';
	import { ArrowLeft, Home } from '@hugeicons/core-free-icons';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import { browser } from '$app/environment';
	import { app } from '$lib/utils/app';

	// Track dark mode
	let isDark = $state(false);

	// Check system preference and local storage
	function checkDarkMode() {
		if (!browser) return false;

		const stored = localStorage.getItem('theme');
		if (stored === 'dark') return true;
		if (stored === 'light') return false;

		return window.matchMedia('(prefers-color-scheme: dark)').matches;
	}

	// Initialize dark mode
	isDark = checkDarkMode();

	// Listen for theme changes
	if (browser) {
		window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
			isDark = checkDarkMode();
		});

		window.addEventListener('storage', () => {
			isDark = checkDarkMode();
		});
	}
</script>

<svelte:head>
	<title>Error {page.status} - {app.name}</title>
</svelte:head>

<div class="error-container" class:dark={isDark}>
	<div class="error-content">
		<div class="error-visual">
			<div class="error-icon">
				<HugeiconsIcon icon={page.status === 404 ? Home : ArrowLeft} size="48" />
			</div>
		</div>

		<div class="error-text">
			<h1 class="error-title">
				{page.status === 404 ? 'Page not found' : 'Something went wrong'}
			</h1>
			<p class="error-message">
				{page.status === 404
					? "The page you're looking for doesn't exist or has been moved."
					: page.error?.message || 'An unexpected error occurred'}
			</p>

			<div class="error-actions">
				<a
					href="/"
					aria-label="Go home"
					title="Go home"
					role="button"
					tabindex="0"
					onclick={() => (window.location.href = '/')}
					class="btn btn-primary"
				>
					<span>Go home</span>
					<HugeiconsIcon icon={Home} size="16" />
				</a>
				{#if page.status !== 404}
					<button type="button" class="btn btn-ghost" onclick={() => window.history.back()}>
						<span>Go back</span>
						<HugeiconsIcon icon={ArrowLeft} size="16" />
					</button>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	/* CSS Variables for light/dark mode */
	.error-container {
		--bg: #f8f9fa;
		--bg-elevated: #ffffff;
		--card: rgba(255, 255, 255, 0.8);
		--border: transparent;
		--text: #0f172a;
		--text-secondary: #64748b;
		--text-muted: #94a3b8;
		--accent: #6366f1;
		--accent-soft: rgba(99, 102, 241, 0.1);
		--accent-glow: rgba(99, 102, 241, 0.08);
		--secondary-glow: rgba(45, 212, 191, 0.06);
	}

	.error-container.dark {
		--bg: #09090b;
		--bg-elevated: #131316;
		--card: rgba(24, 24, 27, 0.6);
		--border: rgba(255, 255, 255, 0.06);
		--text: #fafafa;
		--text-secondary: #a1a1aa;
		--text-muted: #71717a;
		--accent: #f97316;
		--accent-soft: rgba(249, 115, 22, 0.1);
		--accent-glow: rgba(249, 115, 22, 0.08);
		--secondary-glow: rgba(45, 212, 191, 0.06);
	}

	.error-container {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		background: var(--bg);
		position: relative;
		overflow: hidden;
	}

	.error-container::before {
		content: '';
		position: absolute;
		top: -20%;
		right: -10%;
		width: 50%;
		height: 50%;
		background: radial-gradient(circle, var(--accent-glow) 0%, transparent 70%);
		filter: blur(80px);
		pointer-events: none;
	}

	.error-container::after {
		content: '';
		position: absolute;
		bottom: 10%;
		left: -10%;
		width: 40%;
		height: 40%;
		background: radial-gradient(circle, var(--secondary-glow) 0%, transparent 70%);
		filter: blur(80px);
		pointer-events: none;
	}

	.error-content {
		display: grid;
		grid-template-columns: 1fr 2fr;
		gap: 4rem;
		align-items: center;
		max-width: 1000px;
		width: 100%;
		position: relative;
		z-index: 1;
	}

	.error-visual {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.error-icon {
		width: 120px;
		height: 120px;
		background: var(--card);
		border: 1px solid var(--border);
		border-radius: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text);
		box-shadow:
			0 0 0 1px rgba(0, 0, 0, 0.03),
			0 20px 50px rgba(0, 0, 0, 0.15),
			inset 0 1px 0 rgba(255, 255, 255, 0.5);
	}

	.error-container.dark .error-icon {
		box-shadow:
			0 0 0 1px rgba(255, 255, 255, 0.03),
			0 20px 50px rgba(0, 0, 0, 0.5),
			inset 0 1px 0 rgba(255, 255, 255, 0.05);
	}

	.error-text {
		text-align: center;
	}

	.error-title {
		font-family: 'Space Grotesk', sans-serif;
		font-size: clamp(2rem, 4vw, 2.75rem);
		font-weight: 600;
		letter-spacing: -0.02em;
		color: var(--text);
		margin-bottom: 1rem;
		line-height: 1.1;
	}

	.error-message {
		font-size: 1.125rem;
		color: var(--text-secondary);
		margin-bottom: 2.5rem;
		line-height: 1.6;
		max-width: 400px;
	}

	.error-actions {
		display: flex;
		gap: 1rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	.btn {
		padding: 0.7rem 1.4rem;
		border-radius: 8px;
		font-weight: 500;
		font-size: 0.9rem;
		cursor: pointer;
		transition: all 0.2s ease;
		text-decoration: none;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		border: none;
		font-family: inherit;
	}

	.btn-primary {
		background: var(--accent);
		color: white;
	}

	.btn-primary:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 20px rgba(99, 102, 241, 0.35);
	}

	.error-container.dark .btn-primary:hover {
		box-shadow: 0 4px 20px rgba(249, 115, 22, 0.35);
	}

	.btn-ghost {
		background: transparent;
		color: var(--text-secondary);
		border: 1px solid var(--border);
	}

	.btn-ghost:hover {
		background: rgba(0, 0, 0, 0.03);
		border-color: rgba(0, 0, 0, 0.1);
		color: var(--text);
	}

	.error-container.dark .btn-ghost:hover {
		background: rgba(255, 255, 255, 0.03);
		border-color: rgba(255, 255, 255, 0.1);
	}

	/* Responsive */
	@media (max-width: 768px) {
		.error-content {
			grid-template-columns: 1fr;
			gap: 2rem;
			text-align: center;
		}

		.error-actions {
			justify-content: center;
		}

		.error-title {
			font-size: 2rem;
		}

		.error-message {
			max-width: 100%;
		}
	}

	/* Reduced motion */
	@media (prefers-reduced-motion: reduce) {
		*,
		*::before,
		*::after {
			animation-duration: 0.01ms !important;
			transition-duration: 0.01ms !important;
		}
	}
</style>
