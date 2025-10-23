<script lang="ts">
	import { page } from '$app/stores';
	import Logo from '$lib/logo.svelte';
	let classicLink: string = $page.url.pathname;
	if ($page.url.pathname.slice(0, 5) == '/game')
		classicLink = `/games${$page.url.pathname.slice(5)}`;
	if ($page.url.pathname.slice(0, 5) == '/tool')
		classicLink = `/tools${$page.url.pathname.slice(5)}`;
	if ($page.url.pathname.slice(0, 6) == '/block')
		classicLink = `/games/block${$page.url.pathname.slice(6)}`;
	classicLink = 'https://classic.elooly.com' + classicLink;
</script>

<svelte:head>
	<title>Error {$page.status}</title>
</svelte:head>
<div class="mt-12 p-8 h-full align-center text-stone-700 dark:text-gray-50">
	<div>
		<div class="flex flex-col justify-center">
			<Logo />
			<p class="text-5xl sm:text-10xl lg:text-20xl font-bold leading-none">Error {$page.status}</p>
		</div>
		{#if $page.status == 404}
			<p class="text-3xl sm:text-4xl mb-px leading-none font-medium">Invalid Link</p>
		{:else if String($page.status).slice(0, 1) == '5'}
			<p class="text-4xl mb-px leading-none font-medium">Something bad happened</p>
		{:else}
			<p class="text-4xl mb-3 leading-none">{$page.error.message}</p>
		{/if}
	</div>
	<code class="text-red-500 dark:text-red-600 opacity-80"
		>Error {$page.status}: {$page.error.message}</code
	>
</div>

<style>
</style>
