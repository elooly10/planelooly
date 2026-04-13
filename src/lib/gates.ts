import { get } from 'svelte/store';
import { findGateIndex, findSpeed, mapUpdates, mapUpdatesClear, Confirm } from './utils';
import { airports } from './airports';
import { globals } from './compiler';
import { resetCache } from './travelAgent';
// Sell an Empty Gate
function sellGate(airportIDLocal) {
	mapUpdates.set(get(mapUpdates) + 1);
	if (get(airports)[airportIDLocal].gates.filter((v)=>!v).length) {
		let a: string | null | any;
		for (var i = 0; i < get(airports)[airportIDLocal].gates.length; i++) {
			a = get(airports)[airportIDLocal].gates.pop();
			if (a) get(airports)[airportIDLocal].gates.unshift(a);
			else break;
		}
		if (!a) globals.tokens += 1;
		if (a) alert("You currently don't have any unused gates!");
	}
}
// Connect two airports
export function addGate(airportAID: number, airportBID: number, hideAlert = false) {
	let airportA = new Proxy(get(airports)[airportAID], {});
	let airportB = new Proxy(get(airports)[airportBID], {});
	console.log(`Connecting ${airportA.IATA} and ${airportB.IATA}`);
	airportA.gates.sort((a, b) => {
		return a === null ? -1 : 1;
	});
	airportB.gates.sort((a, b) => {
		return a === null ? -1 : 1;
	});
	if (hideAlert || Confirm(`Connect ${airportA.IATA} and ${airportB.IATA}?`)) {
		if (globals.tokens < 2) {
			confirm("You can't afford to buy these gates.");
			return;
		}
		airportA.gates.unshift({
			IATA: airportB.IATA,
			speed: findSpeed(airportA, airportB)
		});
		airportB.gates.unshift({
			IATA: airportA.IATA,
			speed: findSpeed(airportB, airportA)
		});
		globals.tokens -= 2;
	}
	resetCache();
	mapUpdates.set(get(mapUpdates) + 1);
}
export function removeGate(airportAID, airportBID) {
	mapUpdatesClear.set(get(mapUpdatesClear) + 1);
	let airportA = new Proxy(get(airports)[airportAID], {});
	let airportB = new Proxy(get(airports)[airportBID], {});
	console.log(`Removing gate between ${airportA.IATA} and ${airportB.IATA}`);
	if (findGateIndex(airportA, airportB) > -1 && findGateIndex(airportB, airportA) > -1) {
		airportA.gates[findGateIndex(airportA, airportB)] = null;
		airportB.gates[findGateIndex(airportB, airportA)] = null;
		sellGate(airportAID);
		sellGate(airportBID);
	} else alert(`${airportA.IATA} and ${airportB.IATA} are not connected!`);
	resetCache();
}
