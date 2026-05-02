import { airports } from '$lib/airports';
import { mode } from '$lib/level';
import { get, writable } from 'svelte/store';
import { goto } from '$app/navigation';

// Important stuff
const globalWritable = writable({
	day: 0, //Day, whole
	level: 0, //Where .queryResult means go vs. stop
	tokens: 0, // Tokens
	increment: 1, //User-set speed (ex: 1x)
	hardness: 1, // Give extra tokens
	travelersSortMode: 'travelers', // How AM sorts travelers
	centralAirport: 'BOI', // Where game starts
	stars: 0, // Stars
	starLevels: [] // Where you get stars
});
export const globals = new Proxy(get(globalWritable), {});
export function resetGlobals() {
	globals.day = 0;
	globals.level = 0;
	globals.tokens = 0;
	globals.increment = 1;
	globals.hardness = 1;
	globals.stars = 0;
}
// Prep
let airportCentral = null;

// Prepare for playing
export function compiler() {
	if (mode && typeof mode?.airportsList == 'function') {
		// Read level and get list
		console.log('Compiling airports list');
		mode.airportsList();
		let start = mode.starterAirport()
		airportCentral = get(airports).filter((v)=>v.IATA === start)[0];
		globals.centralAirport = airportCentral.IATA;
		console.log(`Central Airport Identified as ${airportCentral.IATA}`);
		mode.compiler(get(airports), airportCentral);
		console.log('Level compiled, identifying star ratings');
		globals.starLevels = mode.ratings;

		// Sort list
		airports.set(get(airports).sort((a, b) => a.queryResult - (b.queryResult ?? 0)).slice(0, 100));

		// Assign Tokens
		globals.tokens = Math.round(
			(get(airports).filter((v)=>
				v.queryResult <
				0.86 + Math.max(0, airportCentral.queryResult, get(airports)[2].queryResult)
			).length *
				3 -
				3) *
				globals.hardness
		);
	} else goto('/');
}
export let j = 0;
