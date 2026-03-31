<script>
	import { airports } from '$lib/airports';
	import { levels } from '$lib/level';
	import Logo from '$lib/logo.svelte';
	import Modal from '$lib/modal.svelte';
	import { clearTime } from '$lib/tick';
	import { onMount } from 'svelte';
	onMount(() => {
		airports.set([]);
		clearTime();
	});
	let screenModal = true;
</script>
<svelte:head>
	<title>Planelooly</title>
	<meta name='desc' content='Connect airports to keep passenger counts low in this strategy game.'/>
</svelte:head>
<div class="md:hidden">
	<Modal show={screenModal}>
		<div class="text-center *:mt-4">
			<p class="text-xl">This game is designed for tablets, laptops, and desktop computers.</p>
			<p>
				To access it from your computer, go to <a href="https://planelooly.com" class="link"
					>https://planelooly.com</a
				>.
			</p>
		</div>
		<p class="px-2 text-left text-sm">
			<button class="link-gray" on:click={() => (screenModal = false)}>Play on this device</button>
		</p>
	</Modal>
</div>
<div class="w-screen">
	<div class="max-w-screen-md ml-auto mr-auto">
		<div class="flex flex-col max-w-screen-md ml-auto mr-auto">
			<a class="flex flex-col items-center pt-8" href="/airports" title="To airports guide"
				><Logo radius={20} />
				<h1 class="text-3xl font-bold">Planelooly</h1></a
			>
		</div>
		<main class="w-full flex justify-center">
			<div class="flex flex-col w-full divide-y divide-stone-300 dark:divide-zinc-600">
				{#each levels as level, i}
					<a class="w-full flex items-center p-4 gap-4" href="/play/{i}/">
						<h2 class="text-xl font-bold">{level.number}</h2>
						<p class="text-xl">{level.name}</p>
						<div class="ml-auto" />
						<div class="btn-compact color-btn-game-primary">Play!</div>
					</a>
				{/each}
			</div>
		</main>
		<footer class="pt-4 pb-8">
			<p class="text-center text-lg">
				<a
					href="https://www.congressionalappchallenge.us/25-id01/"
					class="text-tertiary-600 hover:text-tertiary-700 dark:text-tertiary-400 dark:hover:text-tertiary-500"
					>Congressional App Challenge Winner</a
				>
				– Made by
				<a
					href="https://myleshardy.com"
					class="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-500"
					>Myles Hardy</a
				>
			</p>
		</footer>
	</div>
</div>
