<script lang="ts">
	export let add: (e: MouseEvent) => void;
	export let subtract: (e: MouseEvent) => void;
</script>

<div class="flex divide-x divide-black divide-opacity-0 hover:divide-opacity-25 not-prose">
	<button class="plus" on:click|preventDefault|stopPropagation={add}> + </button>
	<button class="minus" on:click|preventDefault|stopPropagation={subtract}> − </button>
</div>

<style lang="postcss">
	.plus,
	.minus {
		@apply w-7 h-7 bg-neutral-900 bg-opacity-10 hover:bg-opacity-20 flex items-center justify-center;
	}
	.plus {
		@apply rounded-l-full;
	}
	.minus {
		@apply rounded-r-full;
	}
	* {
		@apply border-0;
	}
</style>
