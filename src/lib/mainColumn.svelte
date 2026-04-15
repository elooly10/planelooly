<script lang="ts">
	import Logo from '$lib/logo.svelte';
	import { airports, type airportType } from '$lib/airports';
	import { globals } from '$lib/compiler';
	import { count, mapUpdates, mapUpdatesClear, states, typeToValue } from '$lib/utils';

	export let airportID = 0;
	export let hideNotifications = false;


	let sortType: 'population' | 'gates' | 'kind' | 'alphabetical' = 'population';
	let displayMessage: string = null;

	// Reactive variables
	let allAirports: airportType[] = [];
	let currentAps = [];
	let i = `${Math.random()}${Math.random()}`;

	// Reactive statement to update `allAirports` and `currentAps`
	$: {
		allAirports = $airports.filter(v=>v.queryResult <= globals.level);
		allAirports.map((v) => (v.population = Math.round(v.population * 100) / 100));
		currentAps = $airports;
	}
	// Reactive statements for displayMessage
	$: checkForStateCompletion($airports);
	$: checkForNewAirports(allAirports);
	function updateI() {
		i = `${Math.random()}${Math.random()}`;
		checkForStateCompletion($airports);
		checkForNewAirports(allAirports);
	}
	function getPopulation(airports: number[]) {
		let sum = 0;
		airports.forEach((airport) => {
			if (!isNaN(+airport)) sum += Math.round(airport);
		});
		return sum;
	}

	function toType(
		type: 'primary' | 'regional' | 'altRegional' | 'secondary' | 'focus' | 'altFocus' | 'nonHub'
	) {
		switch (type) {
			case 'primary':
				return 'Primary Hub';
			case 'regional':
				return 'Regional Hub';
			case 'altRegional':
				return 'Alt. Regional Hub';
			case 'secondary':
				return 'Secondary Hub';
			case 'focus':
				return 'Focus City';
			case 'altFocus':
				return 'Alt. Focus City';
			case 'nonHub':
				return '';
		}
	}

	function getID(airport) {
		return $airports.indexOf(airport);
	}

	function changeTo(ID) {
		airportID = ID;
	}

	function toList(list: string[]) {
		if (list.length === 1 || !list.length) return list[0];
		if (list.length === 2) return list.join(' and ');
		return list.slice(0, -1).join(', ') + ', and ' + list[list.length - 1];
	}

	function checkForNewAirports(airports) {
		let list = [];
		airports.forEach((airport) => {
			if (!airport.gates) list.push(airport.IATA);
		});
		if (!list.length) displayMessage = null;
		else if (list.length > 4) {
			list[3] = `${list.length - 3} more`;
			displayMessage = `New airports: ${toList(list.slice(0, 4))}`;
		} else displayMessage = `New airport${list.length !== 1 ? 's' : ''}: ${toList(list)}`;
	}

	function checkForStateCompletion(airports: airportType[]) {
		//console.log('Hi')
		let { level, day, increment } = globals;
		let list = [];
		let statesList = Object.keys(states);
		statesList.forEach((state, i) => {
			let airportsInState = airports.filter(v=>v.state === state);
			//console.log(state, airportsInState.getGroup('queryResult'), airportsInState.length, airportsInState, airportsInState.length === airportsInState.groupQuery('queryResult', '<=', globals.level).length, (level-Math.max(...airportsInState.getGroup('queryResult'))))
			if (
				airportsInState.length ===
					airportsInState.filter(v=>v.queryResult <= globals.level).length &&
				(level - Math.max(...airportsInState.map(v=>v.queryResult)) < 0.25 * increment ||
					day <= 0.25 * increment) &&
				increment != 0 &&
				airportsInState.length !== 0 &&
				state != 'AU' &&
				state != 'ACT' &&
				state != 'US' &&
				state != 'UK'
			) {
				list.push(Object.values(states)[i]);
			}
		});
		//console.log(list);
		if (list.length) displayMessage = `You now have all the destinations in ${toList(list)}!`;
	}

	function sort(
		a: airportType,
		b: airportType,
		type: 'population' | 'gates' | 'kind' | 'alphabetical'
	) {
		switch (type) {
			case 'population':
				return b.population - a.population;
			case 'gates':
				return b.gates - a.gates;
			case 'kind':
				return typeToValue(b.type) - typeToValue(a.type);
			case 'alphabetical':
				return a.IATA > b.IATA ? 1 : -1;
		}
	}
	mapUpdates.subscribe(updateI);
	mapUpdatesClear.subscribe(updateI);
</script>

<div class="flex flex-col h-full w-full items-center p-2 overflow-clip">
	<!-- Logo -->
	<div class="flex gap-4">
		<Logo radius={20} />
		<div class="flex flex-col">
			<span>"The early bird catches the flight"</span>
			<div class="flex flex-wrap divide-x-2 divide-stone-700 dark:divide-zinc-700 quickinfo w-full">
				<span class="flex-grow text-center"
					>{count(getPopulation(allAirports.map(v=>v.population)), 'traveler', 's')}</span
				>
				{#if sortType == 'gates'}
					<span class="flex-grow text-center"
						>{count(allAirports.map((a) => a.gates).reduce((a,b)=>a+b,0), 'gate', 's')}</span
					>
				{:else if sortType == 'kind'}
					<span class="flex-grow text-center"
						>{count(allAirports.map((a) => (a.type == 'nonHub' ? 0 : 1)).reduce((a,b)=>a+b,0), 'hub', 's')}</span
					>
				{:else}
					<span class="flex-grow text-center">{count(allAirports.length, 'destination', 's')}</span>
				{/if}
			</div>
		</div>
	</div>
	<!-- quickinfo -->

	<!-- List of Places-->
	<div
		class="w-full md:max-w-[50vw] flex flex-col items-center h-full max-h-full overflow-y-auto"
	>
		<div class="inputGroup pb-1">
			<label class="ml-1 label" for="mainColSort">Airports are sorted by:</label>
			<select class="ml-1 input-select" id="mainColSort" bind:value={sortType}>
				<option value="population">Travelers</option>
				<option value="gates">Gates</option>
				<option value="kind">Hub type</option>
				<option value="alphabetical">Airport Code</option>
			</select>
		</div>
		{#key i}
			<table class="w-full">
				{#each allAirports.sort((a, b) => sort(a, b, sortType)) as airport}
					<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
					<tr
						class="hover:bg-stone-200 active:bg-slate-300 dark:hover:bg-zinc-600 dark:active:bg-zinc-500 transition duration-300 table-row-group align-middle w-full max-h-11 h-11"
						on:click={() => changeTo(getID(airport))}
						on:keyup={() => changeTo(getID(airport))}
					>
						<td
							class="font-bold w-11 h-11 px-2 rounded-l-lg"
							title="{airport.location}, {airport.state}"
						>
							{airport.IATA}
						</td>
						<td class="min-w-[7rem] text-white h-11 no-prose">
						{#if !airport.gates}
							<span
								class="text-sm opacity-70 dark:opacity-80 rounded p-2 bg-pretzel-600"
							>
								New
							</span>
						{/if}
						{#if airport.type != 'nonHub'}
							<span
								class="text-sm opacity-70 dark:opacity-80 rounded p-2 transition-all duration-300 {airport.type ===
								'primary'
									? 'bg-primary-600'
									: airport.type === 'regional'
									? 'bg-secondary-800'
									: airport.type === 'altRegional'
									? 'bg-secondary-900'
									: airport.type === 'secondary'
									? 'bg-tertiary-800'
									: airport.type === 'focus'
									? 'bg-focus-700'
									: airport.type === 'altFocus'
									? 'bg-focus-900'
									: 'bg-orange-700'}"
							>
								{toType(airport.type)}
							</span>
						{/if}
						</td>
						<td class="h-11">{count(Math.round(airport.population), 'traveler', 's')}</td>
						<td class="h-11 pr-2 rounded-r-lg">{count(airport.gates, 'gate', 's')}</td>
					</tr>
				{/each}
			</table>
		{/key}
	</div>
	<!-- alerts -->
	<div
		class="absolute top-4 md:bottom-6 md:top-auto left-auto right-auto rounded-full bg-stone-600 dark:bg-zinc-600 {displayMessage &&
		!hideNotifications
			? 'flex'
			: 'hidden'} items-center justify-center text-white p-4 m-4 max-w-[90vh] h-12 z-50"
	>
		{displayMessage}
	</div>
</div>

<style lang="postcss">
	.quickinfo * {
		@apply px-2;
	}
</style>
