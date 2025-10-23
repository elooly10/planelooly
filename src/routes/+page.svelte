<script>
	import { airports } from '$lib/airports';
	import { levels } from '$lib/level';
	import Logo from '$lib/logo.svelte';
	import { clearTime } from '$lib/tick';
	import { onMount } from 'svelte';
	onMount(() => {
		airports.set([]);
		clearTime();
	});
</script>

<div class="w-screen">
	<div class="max-w-screen-md ml-auto mr-auto">
		<div class="flex flex-col max-w-screen-md ml-auto mr-auto">
			<a class="flex flex-col items-center pt-8" href="/airports" title="To airports guide"
				><Logo radius={20} />
				<h1 class="text-3xl font-bold">Planelooly</h1></a
			>
		</div>
		<div class="w-full flex justify-center">
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
		</div>
	</div>
</div>
