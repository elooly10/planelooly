<script lang="ts">
	import { airports, getAirports, type airportType } from '$lib/airports';
	import { filterEnplanements, getDescription, states } from '$lib/utils';
	import { onMount, onDestroy } from 'svelte';
	import { clearTime } from '$lib/tick';
	import { mean, removeDuplicates, sortAlphabetically } from '$lib/utils/basic';
	import { getLeaflet } from '$lib/utils/leaflet';
	import Loading from '$lib/loading.svelte';
	import { getPin } from '$lib/map/utils';
	import type * as LeafletType from 'leaflet';
	let mapElement: HTMLDivElement;
	let map: LeafletType.Map | undefined;
	let leaflet: typeof LeafletType;
	let loading = true;
	let inputFocus = false;
	async function mount() {
		if (!leaflet) {
			clearTime();
			leaflet = await getLeaflet();
		}
		loading = false;
		$airports = getAirports();
		load(searchValue);
		(window as any).airports = $airports;
	}
	onDestroy(async () => {
		if (map) {
			console.log('Unloading Leaflet map.');
			map.remove();
		}
	});

	let searchValue = 'All Airports';
	// 	function changeRegion(region: string) {
	// 	let shouldLoad = selectedRegion != region;
	// 	selectedRegion = region;
	// 	if (selectedRegion == 'US') $airports = [...getAirports('USA', ()=>true, month), ...getAirports('USA-MINOR', ()=>true, month)];
	// 	else if (selectedRegion == 'EU') $airports = getAirports('EU', ()=>true, month);
	// 	else if (selectedRegion == 'AU') $airports = getAirports('AU', ()=>true, month);
	// 	else if (selectedRegion == 'POLAR')
	// 		$airports = getAirports('ALL', ()=>true, month).filter(
	// 			(a) => a.latitude > 66.566667 || a.latitude < -66.566667
	// 		);
	// 	else {
	// 		$airports = getAirports(selectedRegion, ()=>true, month);
	// 	}

	// 	// Reload
	// 	if (!query.includes('Airports') && shouldLoad) {
	// 		if (query == searchValue) searchValue = 'All Airports';
	// 		query = 'All Airports';
	// 	}
	// 	if (shouldLoad) load(query);
	// }
	function search(value: string) {
		if (!value) return [];
		let searchContent = [
			{ title: 'All Airports', subtitle: '' },
			{ title: 'Major Airports', subtitle: '' },
			{ title: 'Popular Airports', subtitle: '' },
			{ title: 'Significant Airports', subtitle: '' },
			{ title: 'Minor Airports', subtitle: '' },
			{ title: 'Very Small Airports', subtitle: '' }
		];

		searchContent.push(
			...removeDuplicates(getAirports().map(v=>v.state)).map((st) => {
				return {
					title: states[st],
					subtitle: st
				};
			})
		);
		searchContent.push(
			...getAirports()
				.sort((a, b) => sortAlphabetically(a.IATA, b.IATA))
				.map((v) => {
					return { title: v.IATA, subtitle: `${v.location}, ${v.state}` };
				})
		);
		value = value.toLowerCase();
		let searchScores = searchContent.map((item) => {
			const twoPoint = (v) => v.split(' ').reduce((a, c) => c.startsWith(value) || a, false);
			let itemLowercase = item.title?.toLowerCase() ?? '';
			let itemSubLowercase = item.subtitle?.toLowerCase() ?? '';
			if (itemLowercase.startsWith(value) || itemSubLowercase.startsWith(value))
				return { content: item, points: 3 };
			else if (twoPoint(itemLowercase) || twoPoint(itemSubLowercase))
				return { content: item, points: 2 };
			else if (itemLowercase.includes(value) || itemSubLowercase.includes(value))
				return { content: item, points: 1 };
			return { content: item, points: 0 };
		});
		return searchScores
			.sort((a, b) => b.points - a.points)
			.filter((a) => a.points)
			.map(v=>v.content);
	}

	function popUpText(airport: airportType) {
		return `<div class='flex items-center justify-center flex-col gap-1'><span class='font-bold text-2xl mb-1'>${
			airport.IATA
		}</span><span>${airport.location}, ${airport.state}</span><span class='m-0'>${getDescription(
			airport.enplanements
		)} popularity</span></div>`;
	}
	function IATAtoAirport(iata): airportType {
		return getAirports().filter(v=>iata==v.IATA)?.[0];
	}
	let query = '';
	let results: { content: string; subtext?: string }[] = [];
	function tileLayer() {
		leaflet
			.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
				attribution:
					'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
			})
			.addTo(map);
	}
	function load(result: string) {
		console.log(`Loading ${result}`);
		results = [];
		query = result;
		if (map) map.remove();
		map = leaflet.map(mapElement);
		tileLayer();
		if (
			result === 'All Airports' ||
			result === 'Popular Airports' ||
			result === 'Major Airports' ||
			result === 'Significant Airports' ||
			result === 'Minor Airports' ||
			result === 'Very Small Airports'
		) {
			let airportsAll =
				result === 'Popular Airports'
					? $airports.filter(filterEnplanements(1))
					: result === 'Major Airports'
					? $airports.filter(filterEnplanements(0.75))
					: result === 'Significant Airports'
					? $airports.filter(filterEnplanements(0.1))
					: result === 'Minor Airports'
					? $airports.filter(filterEnplanements(0.1, false))
					: result === 'Very Small Airports'
					? $airports.filter(filterEnplanements(0.01, false))
					: $airports;
			airportsAll.sort((a, b) => b.enplanements - a.enplanements);
			airportsAll.forEach((airport: airportType) => {
				if (airport.nearbyAirports && dev) {
					airport.nearbyAirports.forEach((nearbyIATA) => {
						let nearby = IATAtoAirport(nearbyIATA);
						if (!nearby) {
							//console.log(`No ${nearbyIATA} found`);
							return;
						}
						if (!nearby.latitude || !nearby.longitude) {
							console.error(`Errored on ${nearbyIATA}`);
							return;
						}
						leaflet
							.polyline([
								[airport.latitude, airport.longitude],
								[nearby.latitude, nearby.longitude]
							])
							.addTo(map);
					});
				}
				leaflet
					.marker([airport.latitude, airport.longitude], {
						icon: getPin(leaflet, airport.enplanements)
					})
					.addTo(map)
					.bindPopup(popUpText(airport));
			});
			let coordinateAirports = airportsAll.filter((v)=>!['AK', 'AS', 'GU', 'MP', 'GU', 'MH', 'UM', 'PR', 'VI'].includes(v.state))
			map.setView(
				[mean(...coordinateAirports.map((v)=>v.latitude)), mean(...coordinateAirports.map(v=>v.longitude))],
				5
			);
		} else if (Object.values(states).includes(result)) {
			let airportsAll = $airports;
			let key = Object.entries(states).find((value) => value[1] == result)[0];
			let airportsBound = airportsAll.filter((a) => a.state == key);
			if (airportsBound.length == 1) {
				load(airportsBound[0].IATA);
			}
			let boundsValues = airportsBound.map((v) => leaflet.latLng(v.latitude, v.longitude));
			let bounds = new leaflet.LatLngBounds(boundsValues);
			//console.log('loading');
			airportsAll.forEach((airport: airportType) => {
				leaflet
					.marker([airport.latitude, airport.longitude], {
						icon: getPin(leaflet, airport.enplanements, airport.state == key ? 1 : 0.75)
					})
					.addTo(map)
					.bindPopup(popUpText(airport));
			});
			map.fitBounds(bounds.pad(0.1));
		} else if (IATAtoAirport(result)) {
			const airport = IATAtoAirport(result);
			map.setView([airport.latitude, airport.longitude], 9);
			let airportsAll = getAirports();
			airportsAll.forEach((airport2: airportType) => {
				if (airport2.IATA == result) return;
				let marker = leaflet
					.marker([airport2.latitude, airport2.longitude], {
						icon: getPin(leaflet, airport2.enplanements, airport2.state == result ? 1 : 0.75)
					})
					.addTo(map)
					.bindPopup(popUpText(airport2));
			});
			leaflet
				.marker([airport.latitude, airport.longitude], {
					icon: getPin(leaflet, airport.enplanements, 1.1)
				})
				.addTo(map)
				.bindPopup(popUpText(airport));
		} else {
			load('All Airports');
		}
	}

	// onMount(()=>{
	// 	window.evalAirports = () => {
	// 		let options = {
	// 			blue: 0,
	// 			teal: 0,
	// 			green: 0,
	// 			lime: 0,
	// 			yellow: 0,
	// 			orange: 0,
	// 			scarlet: 0,
	// 			red: 0,
	// 			pink: 0,
	// 			fuchsia: 0,
	// 			purple: 0,
	// 			gray: 0
	// 		};
	// 		$airports.forEach((v)=>{
	// 			let enplanements = v.enplanements;
	// 			if(enplanements>=10) options.blue++;
	// 			else if(enplanements>=5) options.teal++;
	// 			else if(enplanements>=2) options.green++;
	// 			else if(enplanements>=1) options.lime++;
	// 			else if(enplanements>=0.667) options.yellow++;
	// 			else if(enplanements>=0.333) options.orange++;
	// 			else if(enplanements>=0.15) options.scarlet++;
	// 			else if(enplanements>=0.1) options.red++;
	// 			else if(enplanements>=0.05) options.pink++;
	// 			else if(enplanements>=0.025) options.fuchsia++;
	// 			else if(enplanements>=0.01) options.purple++;
	// 			else options.gray++;
	// 		})
	// 		return Object.entries(options).sort((a, b)=>b[1]-a[1]);
	// 	}
	// });
	function performAnalysis(airports: airportType[]) {
		let groupTotals: {
			[x: string]: {
				name: string;
				count: number;
				airports: airportType[];
			};
		} = {};
		airports
			.sort((a, b) => b.enplanements - a.enplanements)
			.forEach((airport) => {
				let desc = getDescription(airport.enplanements);
				if (groupTotals[desc]) {
					groupTotals[desc].count++;
					groupTotals[desc].airports.push(airport);
				} else
					groupTotals[desc] = {
						name: desc,
						count: 1,
						airports: [airport]
					};
			});
		return Object.values(groupTotals);
	}
	let hoveringOver = false,
		dev = false;
	function blurInput() {
		if (searchValue == '/dev' || searchValue == '/dev on') {
			dev = true;
			searchValue = '';
		} else if (searchValue == '/dev hide') {
			dev = false;
			searchValue = '';
		}
		if (!hoveringOver) inputFocus = false;
	}
	onMount(mount);
</script>
<svelte:head>
	<title>Airports list - Planelooly</title>
	<meta name='desc' content='Airports map for Planelooly.'/>
</svelte:head>

{#if loading}
	<div class="w-screen h-screen relative bg-white top-0 left-0">
		<div class="m-auto">
			<Loading />
		</div>
	</div>
{/if}
<div class="relative h-screen bg-gray-200">
	<div class="absolute top-0 right-0 z-[9999] flex flex-col {dev ? 'h-screen' : 'h-max'}">
		<div class="{dev ? 'relative' : ''} w-96 p-4 flex-grow flex flex-col overflow-scroll">
			<div class="absolute top-4 right-0 w-full px-4 z-[10000]">
				<div class="w-full max-w-sm m-5 mx-auto">
					<input
						type="text"
						autocomplete="off"
						class="print:hidden w-full py-2 text-gray-900 bg-white dark:bg-zinc-700 rounded-md focus:border-blue-500 disabled:bg-zinc-100 disabled:dark:bg-zinc-800 dark:placeholder-zinc-400 dark:border-zinc-400 dark:text-zinc-100 disabled:border-0"
						placeholder="Search"
						bind:value={searchValue}
						on:focus={() => (inputFocus = true)}
						on:blur={blurInput}
					/>
					<!-- <div class="flex border border-zinc-500 p-2 my-2 bg-white dark:bg-zinc-700 rounded-md">
						{#each ['US', 'EU', 'AU'] as region}
							<button
								on:click={() => changeRegion(region)}
								class="w-full {selectedRegion == region
									? 'bg-gray-100 dark:bg-zinc-800 border border-gray-500 font-medium'
									: ''} py-1 rounded-md">{region}</button
							>
						{/each}
					</div> -->
					{#key searchValue}
						{#if search(searchValue).length > 0 && inputFocus}
							<div
								class="print:hidden w-full max-w-sm mt-1 bg-white dark:bg-zinc-700 border-gray-600 rounded-md shadow-lg h-full max-h-96 overflow-y-auto"
								on:mouseenter={() => (hoveringOver = true)}
								on:mouseleave={() => (hoveringOver = false)}
								role="search"
							>
								{#each search(searchValue) as result, i}
									<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
									<button
										class="bg-white dark:bg-zinc-700 w-full px-4 py-2 hover:bg-iron-100 active:bg-iron-100 dark:hover:bg-zinc-600 dark:active:bg-zinc-600 flex flex-wrap gap-2 items-baseline text-zinc-800 dark:text-zinc-50 {i ==
										0
											? 'rounded-t-md'
											: ''}"
										on:click={() => {
											searchValue = result.title;
											inputFocus = false;
											load(result.title);
										}}
									>
										{result.title}
										<div class="text-sm text-gray-500 dark:text-zinc-400">{result.subtitle}</div>
									</button>
								{/each}
							</div>
						{/if}
					{/key}
					<a href="/" class="hover:underline">Home</a>
				</div>
			</div>
			{#if dev}
				<div
					class="bg-black text-white bg-opacity-80 p-2 absolute top-0 right-0 h-screen flex items-center w-full"
				>
					<div class="overflow-scroll max-h-screen w-full">
						<a href="/game/plane/simulator" class="text-blue-100 bold underline">Simulator</a>
						<details>
							<summary class="text-xl font-bold text-white"
								>Airports ({getAirports().length})</summary
							>
								<div class="ml-2">
									<p>
										{getAirports().filter((a) => a.qrImpact < 0).length} damaged
										airports
									</p>
									<p>
										{getAirports().filter((a) => a.qrImpact > 0).length} raised
										airports
									</p>
									{#each performAnalysis(getAirports()) as analysis}
										<details>
											<summary class="text-lg text-white"
												>{analysis.name}: {analysis.count} ({analysis.airports[0].IATA} - {analysis
													.airports[analysis.airports.length - 1].IATA})</summary
											>
											<table class="neat neat-headers-blue">
												<tr><th>IATA</th><th>ENP</th><th>QRI</th></tr>
												{#each analysis.airports as airport}
													<tr
														><td>{airport.IATA}</td> <td>{airport.enplanements}</td>
														<td>{airport.qrImpact ?? 0}</td></tr
													>
												{/each}
											</table>
										</details>
									{/each}
								</div>
						</details>
					</div>
				</div>
			{/if}
		</div>
	</div>
	<div id="mainContent">
		<div id="map" bind:this={mapElement} />
	</div>
</div>

<style>
	@import 'leaflet/dist/leaflet.css';
	#map {
		height: 100vh;
		max-height: 100vh;
	}

	:global(.planelooly-airports-map-marker) {
		width: 0;
		height: 0;
		padding: 0.75rem;
		margin: -0.375rem 0 -0.375rem 0;
		border: 0.25rem solid #1f29374e;
		border-radius: 100%;
		background-color: #4b5563;
		color: white;
		text-align: center;
		display: flex;
		align-items: center;
		justify-content: center;
	}
</style>
