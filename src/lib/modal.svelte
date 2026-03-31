<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	export let onclose = () => {};
	export let show: boolean;

	/**
	 * Closes modal;
	 */
	function closeModal() {
		onclose();
	}
	function closeOnEscape(e: { key: string }) {
		if (e.key == 'Escape') {
			closeModal();
		}
	}
</script>

<svelte:window on:keydown={closeOnEscape} />

{#if show}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
	<div
		class="absolute top-0 bottom-0 right-0 left-0 bg-stone-100 dark:bg-zinc-900 opacity-30 z-[51] overflow-y-scroll"
		transition:fade
		on:click={closeModal}
		role="separator"
	/>
	<div
		class="absolute top-0 bottom-0 right-0 left-0 flex md:items-center items-start md:justify-center z-[52]"
	>
		<div
			class="bg-stone-100 dark:bg-zinc-700 rounded-0 md:rounded-2xl min-w-full md:min-w-[66.67%] lg:min-w-[33.33%] w-min shadow-xl opacity-100"
			transition:fly={{ y: 180, opacity: 0, duration: 400 }}
		>
			<div class='p-8 pb-2 md:pb-8'>
				<slot />
			</div>
		</div>
	</div>
{/if}
