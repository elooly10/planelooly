<script lang="ts">
	import type { airportType } from '$lib/airports';
	export let airport: airportType;
	export let number: number;
</script>

<span class="not-prose"
	><p
		class="{airport.type === 'primary'
			? 'bg-primary-600'
			: airport.type === 'regional'
			? 'bg-secondary-700'
			: airport.type === 'altRegional'
			? 'bg-secondary-900'
			: airport.type === 'secondary'
			? 'bg-tertiary-600'
			: airport.type === 'focus'
			? 'bg-focus-600'
			: airport.type === 'altFocus'
			? 'bg-focus-800'
			: airport.gates === 0
			? 'bg-pretzel-500'
			: airport.enplanements >= 1
			? 'bg-stone-500 dark:bg-zinc-500'
			: 'bg-stone-600 dark:bg-zinc-600'} rounded-full p-2 m-2 h-8 w-8 text-white flex items-center justify-center transition-all duration-500"
	>
		<!-- {airport.gates ? airport.gates?.query('!exists').length : 0} -->
		{number}
	</p>
</span>

<style lang="postcss">
	* {
		@apply border-0 outline-0;
	}
	p {
		@apply border border-stone-700 border-opacity-40;
	}
</style>
