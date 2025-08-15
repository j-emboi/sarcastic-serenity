<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';
	import { initSettingsFromStorage } from '$lib/stores/settings';
	
	let { children } = $props();

	onMount(async () => {
		initSettingsFromStorage();
		if ('serviceWorker' in navigator) {
			try {
				await navigator.serviceWorker.register('/sw.js');
			} catch (err) {
				console.error('SW registration failed', err);
			}
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children?.()}
