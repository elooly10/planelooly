<script lang="ts">
	import { onDestroy, onMount } from 'svelte';

	import { airports, type airportType } from '../airports';
	import { globals } from '../compiler';

	import { Confirm, getDescription, IATAtoAirport, mapUpdates, mapUpdatesClear } from '$lib/utils';
	import { addGate, removeGate } from '../gates';

	import { getLeaflet } from '$lib/utils/leaflet';
	import { pin } from './utils';
	import { HSLToHex } from '$lib/utils/basic';

	// airportID to bind to modal UI
	export let airportID;
	export let autoFire = false;
	export let dblClick = true;
	export let volatilePinSize = true;
	export let pinSize = 1;
	function changeID(ID) {
		airportID = ID;
	}
	//Leaflet things
	let leaflet,
		map,
		mapElement: HTMLDivElement,
		mounted = false;
	onMount(async () => {
		mounted = true;
		leaflet = await getLeaflet();
		map = leaflet.map(mapElement).setView([0, 0], 7);
		let airportsToUse = $airports.filter(v=>v.queryResult <= globals.level);
		window
			.matchMedia('(prefers-color-scheme: dark)')
			.addEventListener('change', (e) =>
				load($airports.filter(v=>v.queryResult <= globals.level), true)
			);
		load(airportsToUse, true);
		//$mapUpdates++;
	});

	// Manage popUp content
	function popUp(airport: airportType) {
		return `
		<div class='flex items-center justify-center flex-col gap-1'>
			<span class='font-bold text-2xl mb-1'>${airport.IATA}</span>
			<span>${airport.location}, ${airport.state}</span>
			<span class='m-0'>${getDescription(airport.enplanements)} popularity</span>
			<button onclick="planelooly.airports.go(${$airports.indexOf(airport)})"
				class="mt-1 outline-none inline-block cursor-pointer rounded-md bg-epsilon-700 px-4 py-3 text-center font-medium text-white hover:bg-epsilon-800 transition-all duration-150 bg-primary-700 text-white hover:bg-primary-800 dark:bg-primary-700 dark:hover:bg-primary-800">
				Navigate
			</button>
		</div>
	`;
	}
	function tileLayer() {
		leaflet
			.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
				attribution:
					'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
			})
			.addTo(map);
	}
	function load(airports: any[], purge: boolean = false) {
		if (map && purge) {
			map.remove();
			map = leaflet.map(mapElement);
		}
		if (!map) map = leaflet.map(mapElement);
		else tileLayer();
		var bounds = new leaflet.LatLngBounds(); // Create an empty bounding box
		let gatesList = [];
		//let markers = markerClusterGroup();
		airports.sort((a, b) => b.enplanements - a.enplanements);
		airports.forEach((airport: airportType) => {
			let airportPin = pin(airport, leaflet, {
				dark: true,
				size: { volatile: volatilePinSize, default: pinSize }
			});
			// if (airport.longitude - mean(airports.filter(v=>v.longitude)) > 160) {
			// 	airport.longitude -= 360;
			// }
			// if (airport.longitude - airports.getGroup('longitude').mean() < -160) {
			// 	airport.longitude += 360;
			// }
			let marker = leaflet.marker([airport.latitude, airport.longitude], { icon: airportPin });

			if (autoFire) {
				marker.on('click', () => changeID($airports.indexOf(airport)));
				marker.bindTooltip(`${airport.IATA} – ${getDescription(airport.enplanements)} popularity`);
			} else marker.bindPopup(popUp(airport));
			bounds.extend(marker.getLatLng());
			airport.gates.forEach((gate) => {
				if (!gatesList.includes([gate.IATA, airport.IATA])) {
					gatesList.push([gate.IATA, airport.IATA]);
					let airport2 = IATAtoAirport(gate.IATA);
					function getColor() {
						return HSLToHex(
							((65 +
								140 * airport.gates.filter(v=>v.IATA == gate.IATA).length) %
								360) +
								360,
							70,
							50,
						);
					}
					let line = leaflet.polyline(
						[
							[airport.latitude, airport.longitude],
							[airport2.latitude, airport2.longitude]
						],
						{
							color: getColor(),
							weight:
								airport.gates.filter(v=>v.IATA === gate.IATA).length > 10
									? 1.5 + 0.7 * airport.gates.filter(v=>v.IATA===gate.IATA).length
									: 2 + airport.gates.filter(v=>v.IATA === gate.IATA).length
						}
					);
					if (dblClick) {
						line.on('click', () => {
							if (Confirm(`Do you want to disconnect ${airport.IATA} and ${airport2.IATA}?`))
								removeGate($airports.indexOf(airport), $airports.indexOf(airport2));
						});
						line.on('contextmenu', () => {
							if (
								Confirm(
									`Do you want to add an additional gate between ${airport.IATA} and ${airport2.IATA}?`
								)
							)
								addGate($airports.indexOf(airport), $airports.indexOf(airport2), true);
						});
					}
					map.addLayer(line);
				}
			});
			map.addLayer(marker);
		});
		//map.addLayer(markers)
		if (purge) {
			map.fitBounds(bounds.pad(0.05));
		}
	}
	onDestroy(() => {
		if (map) {
			console.log('Unloading Leaflet map.');
			map.remove();
			map = null;
		}
	});

	// Update map
	mapUpdates.subscribe(() => {
		//console.warn(mounted);
		if (mounted) {
			setTimeout(() => load($airports.filter(v => v.queryResult <= globals.level)), 10);
		}
	});
	mapUpdatesClear.subscribe(() => {
		//console.warn(mounted);
		if (mounted) {
			setTimeout(() => load($airports.filter(v => v.queryResult <= globals.level), true), 10);
		}
	});
</script>

<div class="w-full h-full flex flex-col rounded-lg">
	<div id="map" class="flex-grow h-max rounded-lg" bind:this={mapElement} />
</div>

<style>
	@import 'leaflet/dist/leaflet.css';
	:global(.planelooly-mapModal-marker) {
		margin: -1rem 0 -1rem 0;
		color: white;
		text-align: center;
	}
</style>
