<script lang="ts">
	import { airports, type airportType } from '$lib/airports';
	import { globals } from '$lib/compiler';
	import Counter from '$lib/counter.svelte';
	import {
		count,
		findConnection,
		postalToState,
		mapUpdates,
		sortTravelers,
		getDescription,
		mapUpdatesClear
	} from '$lib/utils';
	import Infodot from '$lib/infodot.svelte';
	import { addGate, removeGate } from './gates';
	import { Percent, Unlink, User } from 'lucide-svelte';
	import { resetCache } from './travelAgent';
	export let airportID: number;
	let airport: airportType = $airports[airportID];
	let interestMode = false;
	let airportHub:
		| 'nonHub'
		| 'focus'
		| 'secondary'
		| 'altFocus'
		| 'altRegional'
		| 'regional'
		| 'primary' = 'nonHub';
	airports.subscribe(() => {
		(window as any).airports = $airports;
		airport = $airports[airportID];
		if (airport && airport?.type) airportHub = airport.type;
	});
	setInterval(() => {
		$airports = (window as any).airports;
		changeID(airportID);
	}, 100);
	function IATAtoAirport(IATA): airportType {
		return $airports.filter(v=>v.IATA === IATA)?.[0];
	}
	function getID(iata) {
		let tR = $airports.indexOf(IATAtoAirport(iata));
		return tR ?? 0;
	}
	function changeID(ID) {
		airportID = ID;
		airport = $airports[airportID];
		airportHub = airport?.type;

		if (!airport.interestMode) {
			if (globals.travelersSortMode == 'interest') {
				globals.travelersSortMode = 'travelers';
				sortAllTravelers();
			}
			interestMode = false;
		}
	}
	//console.log(Object.values(states).length);
	let connections: {
		amount: number;
		ending: string;
		connected: boolean;
		distance: number;
		locations: string[];
	}[] = [];
	function runFindConnection(i: number, airportIATA: string) {
		connections[i] = findConnection(airport, IATAtoAirport(airportIATA));
		return '';
	}
	function getTime(time: number) {
		time -= 0.044;
		const hours = Math.floor(time * 24);
		const minutes = Math.round(((time * 24) % (hours === 0 ? 1 : hours)) * 60);
		if (minutes === 60) {
			return `${hours + 1} hr 0 min`;
		} else return `${hours} hr ${minutes} min`;
	}
	function sortAllTravelers() {
		$airports.filter(v=>v.queryResult < globals.level).forEach((airport) => {
			airport.travelers.sort((a, b) => sortTravelers(airport, a, b));
		});
		let oldID = airportID;
		airportID = 0;
		airportID = oldID;
	}
	function sellAllGates() {
		if (confirm(`Are you sure you want to sell all the gates at ${airport.IATA}?`)) {
			let Airport = new Proxy($airports[airportID], {});
			let toRemoves = [];
			Airport.gates.forEach((v) => {
				toRemoves[toRemoves.length] = [getID(airport.IATA), getID(v.IATA)];
			});
			toRemoves.forEach((v) => {
				removeGate(v[0], v[1]);
			});
			airport = airport;
		}
	}
	function replaceMiddleEntries(array: any[]): any[] {
		if (array.length < 4) return array;
		else {
			return [array[0], '...', array[array.length - 1]];
		}
	}
	function switchInterestMode() {
		console.log('Switching interest mode');
		if (!interestMode && airport.interestMode) {
			console.log('Entering Interest Mode');
			interestMode = true;
		} else if (!interestMode && !airport.interestMode) {
			if (globals.tokens < 1) {
				alert('You cannot afford to unlock interest mode for this airport.');
				return;
			} else if (
				confirm(
					'Are you sure you want to spend 1 token to see the interest to other airports from this airport?'
				)
			) {
				globals.tokens--;
				airport.interestMode = true;
				interestMode = true;
				globals.travelersSortMode = 'interest'
			}
		} else {
			console.log('Exiting Interest Mode');
			interestMode = false;
		}
	}
</script>

<div class="h-full">
	{#key airportID}
		<div
			class="transition-all duration-500 overflow-y-auto sticky top-[105px] h-[calc(100vh-130px)] w-full rounded-xl {airportHub ===
			'primary'
				? 'text-primary-800 dark:text-primary-300 bg-primary-500 border-primary-500'
				: airportHub === 'regional'
				? 'text-secondary-800 dark:text-secondary-400 bg-secondary-500 border-secondary-600'
				: airportHub === 'altRegional'
				? 'text-secondary-950 dark:text-secondary-200 bg-secondary-700 border-secondary-800'
				: airportHub === 'secondary'
				? 'text-tertiary-800 dark:text-tertiary-400 bg-tertiary-500 border-tertiary-600'
				: airportHub === 'focus'
				? 'text-focus-800 dark:text-focus-300 bg-focus-500 border-focus-500'
				: airportHub === 'altFocus'
				? 'text-focus-900 dark:text-focus-200 bg-focus-900 border-focus-900'
				: 'text-stone-800 dark:text-zinc-400 bg-stone-400 border-stone-400 dark:bg-zinc-400 dark:border-zinc-400'} bg-opacity-10 dark:bg-opacity-10 flex flex-col items-center bottom-2 border"
		>
			<div class="flex flex-col flex-grow p-4 w-full">
				<div class="flex flex-col items-center p-0 prose-headings:m-1.5 w-full">
					<h2 class="text-6xl md:text-12xl xl:text-14xl leading-none font-bold">
						{airport.IATA}
					</h2>
					<h3
						class="{airport.location.length > 15
							? 'text-xl mb-1 leading-tight mx-1'
							: 'text-2xl m-2'} font-bold"
					>
						{airport.location}, {postalToState(airport.state)}
						<button
							class="rounded-full p-2 transition-all duration-500 {airportHub === 'primary'
								? 'bg-primary-200 hover:bg-primary-300 dark:bg-primary-700 dark:hover:bg-primary-800'
								: airportHub === 'regional'
								? 'bg-secondary-300 hover:bg-secondary-400 dark:bg-secondary-700 dark:hover:bg-secondary-800'
								: airportHub === 'altRegional'
								? 'bg-secondary-300 hover:bg-secondary-600 dark:bg-secondary-900 dark:hover:bg-secondary-800'
								: airportHub === 'secondary'
								? 'bg-tertiary-200 hover:bg-tertiary-300 dark:bg-tertiary-700 dark:hover:bg-tertiary-800'
								: airportHub === 'focus'
								? 'bg-focus-200 hover:bg-focus-300 dark:bg-focus-700 dark:hover:bg-focus-800'
								: airportHub === 'altFocus'
								? 'bg-focus-300 hover:bg-focus-400 hover:text-focus-50 dark:bg-focus-900 dark:hover:bg-focus-800'
								: 'bg-stone-200 hover:bg-stone-300 dark:bg-zinc-700 dark:hover:bg-zinc-800'} text-black dark:text-white"
							on:click={switchInterestMode}
							title={interestMode ? 'Exit interest mode' : 'Enter interest mode'}
						>
							{#if interestMode}
								<User size="14pt" />
							{:else}
								<Percent size="14pt" />
							{/if}
						</button>
					</h3>
					<div class="flex flex-wrap items-center justify-center gap-2">
						<span class="font-bold"
							>{airport.popularityChange > 1 ? '↑' : airport.popularityChange < 1 ? '↓' : ''}</span
						>
						{getDescription(airport.enplanements)} popularity
						<div class="h-2 w-2 rounded-full bg-current" />
						{interestMode
							? `+${Math.round(airport.growthRate)} travelers/day`
							: count(Math.round(airport.population), 'traveler', 's')}
						<div class="h-2 w-2 rounded-full bg-current" />
						{count(airport.gates?.length, 'gate', 's')}
						<button
							class="rounded-full p-2 transition-all duration-500 {airportHub === 'primary'
								? 'bg-primary-200 hover:bg-primary-300 dark:bg-primary-700 dark:hover:bg-primary-800'
								: airportHub === 'regional'
								? 'bg-secondary-300 hover:bg-secondary-400 dark:bg-secondary-700 dark:hover:bg-secondary-800'
								: airportHub === 'altRegional'
								? 'bg-secondary-300 hover:bg-secondary-600 dark:bg-secondary-900 dark:hover:bg-secondary-800'
								: airportHub === 'secondary'
								? 'bg-tertiary-200 hover:bg-tertiary-300 dark:bg-tertiary-700 dark:hover:bg-tertiary-800'
								: airportHub === 'focus'
								? 'bg-focus-200 hover:bg-focus-300 dark:bg-focus-700 dark:hover:bg-focus-800'
								: airportHub === 'altFocus'
								? 'bg-focus-300 hover:bg-focus-400 hover:text-focus-50 dark:bg-focus-900 dark:hover:bg-focus-800'
								: 'bg-stone-200 hover:bg-stone-300 dark:bg-zinc-700 dark:hover:bg-zinc-800'} text-black dark:text-white"
							on:click={sellAllGates}
							title="Sell all gates"><Unlink size="14pt" /></button
						>
					</div>
					<select
						bind:value={airportHub}
						on:change={() => {
							if ($airports && $airports[airportID]) $airports[airportID].type = airportHub;
							$mapUpdates++;
							resetCache();
						}}
						class="bg-opacity-20 m-2 transition-all duration-500 rounded p-1.5 w-[55%] ring-0 focus:ring-0 {airportHub ===
						'primary'
							? 'bg-primary-400 border-primary-600 focus:border-primary-700 dark:bg-primary-700 dark:border-primary-500 dark:focus:border-primary-400'
							: airportHub === 'regional'
							? 'bg-secondary-400 border-secondary-700 focus:border-secondary-800 dark:bg-secondary-900 dark:border-secondary-700 dark:focus:border-secondary-700'
							: airportHub === 'altRegional'
							? 'bg-secondary-600 border-secondary-900 focus:border-secondary-900 dark:bg-secondary-950 dark:border-secondary-900 dark:focus:border-secondary-800'
							: airportHub === 'secondary'
							? 'bg-tertiary-400 border-tertiary-700 focus:border-tertiary-800 dark:bg-tertiary-800 dark:border-tertiary-700 dark:focus:border-tertiary-700'
							: airportHub === 'focus'
							? 'bg-focus-400 border-focus-600  focus:border-focus-700 dark:bg-focus-700 dark:border-focus-500 dark:focus:border-focus-400'
							: airportHub === 'altFocus'
							? 'bg-focus-500 border-focus-800 focus:border-focus-800 dark:bg-focus-900 dark:border-focus-800 dark:focus:border-focus-700'
							: 'bg-stone-300 border-stone-700 focus:border-stone-800 dark:bg-zinc-700 dark:border-zinc-500 dark:focus:border-zinc-400'}"
					>
						<option value="primary">Primary Hub</option>
						<option value="secondary">Secondary Hub</option>
						<option value="regional">Regional Hub</option>
						<option value="altRegional">Alt. Regional Hub</option>
						<option value="focus">Focus City</option>
						<option value="altFocus">Alt. Focus City</option>
						<option value="nonHub">Not a Hub</option>
					</select>
				</div>
				{#key $mapUpdatesClear}
					<table class="neatTable w-full text-md transition-all duration-500">
						{#if airport.travelers}
							{#each airport.travelers as otherAirport, i}
								{runFindConnection(i, otherAirport.location)}
								<tr on:click={() => changeID(getID(otherAirport.location))} class="">
									<td
										class="font-bold text-mg"
										title="{IATAtoAirport(otherAirport.location).location}, {postalToState(
											IATAtoAirport(otherAirport.location).state
										)}">{otherAirport.location}</td
									>
									{#if interestMode}
										<td>{Math.round(otherAirport.interest * 100)}% interest</td>
									{:else}
										<td>{count(otherAirport.travelers, 'traveler', 's')}</td>
									{/if}
									{#if connections[i].amount <= 0}
										<td colspan="2">No connection</td>
									{:else if connections[i].connected}
										<td colspan="2"
											>{connections[i].connected ? '' : '>'}{getTime(connections[i].distance)}</td
										>
									{:else}
										<td colspan="1">&gt;{getTime(connections[i].distance)}</td>
										<td>
											<p class="p-0 text-center">
												{connections[i].amount} stop{connections[i].ending}
											</p>
											<p class="text-[0.65rem] text-center opacity-80 p-0">
												{replaceMiddleEntries(connections[i].locations).join(', ')}
											</p>
										</td>
									{/if}
									<td
										class="flex items-center justify-center {otherAirport.gates
											? ''
											: 'opacity-70'}"
										title="Direct gates to {otherAirport.location}"
									>
										<Infodot
											airport={IATAtoAirport(otherAirport.location)}
											number={connections[i].connected ? connections[i].amount : 0}
										/>
									</td>
									<td class="w-14">
										<Counter
											add={() => {
												addGate(airportID, getID(otherAirport.location), true);
											}}
											subtract={() => removeGate(airportID, getID(otherAirport.location))}
										/>
									</td>
								</tr>
							{/each}
						{/if}
					</table>
				{/key}
			</div>
			<label for="sortType" class="w-full text-left px-2 pb-1">Airports are sorted by:</label>
			<select
				class="w-full border-b-0 border-l-0 border-r-0 border-t focus:border-t-2 transition-all duration-500 {airportHub ===
				'primary'
					? 'bg-primary-200 border-t-primary-500 focus:border-t-primary-500 dark:bg-primary-700'
					: airportHub === 'regional'
					? 'bg-secondary-200 border-t-secondary-600 focus:border-t-secondary-600 dark:bg-secondary-900'
					: airportHub === 'altRegional'
					? 'bg-opacity-20 bg-secondary-600 border-t-secondary-800 focus:border-t-secondary-800 dark:bg-secondary-900'
					: airportHub === 'secondary'
					? 'bg-tertiary-200 border-t-tertiary-500 focus:border-t-tertiary-500 dark:bg-tertiary-800'
					: airportHub === 'focus'
					? 'bg-focus-200 border-t-focus-500 focus:border-t-focus-500 dark:bg-focus-700'
					: airportHub === 'altFocus'
					? 'bg-opacity-20 bg-focus-600 border-t-focus-600 focus:border-t-focus-600 dark:bg-focus-900'
					: 'bg-stone-200 border-t-stone-500 focus:border-t-stone-500 dark:bg-zinc-700 dark:border-t-zinc-500 dark:focus:border-t-zinc-500'}"
				bind:value={globals.travelersSortMode}
				on:change={sortAllTravelers}
			>
				<option value="travelers">Travelers</option>
				<option value="distance">Distance</option>
				<option value="type">Hub type</option>
				<option value="gates">Gates</option>
				{#if airport.interestMode}<option value="interest">Interest</option>{/if}
			</select>
		</div>
	{/key}
</div>
<style lang="postcss">
	.neatTable,
	.neatTable tr,
	.neatTable tr td {
		@apply text-left border-0 outline-0 p-2;
	}
	.neatTable * tr:not(:last-child),
	.neatTable tr:not(:last-child) {
		@apply border-b border-opacity-10 border-black;
	}
</style>
