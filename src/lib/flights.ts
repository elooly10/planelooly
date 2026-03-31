import { get } from 'svelte/store';
import { airports, type airportType } from './airports';
import { globals } from './compiler';
import { findStops, IATAtoAirport } from './utils';
import { lastTime } from './tick';
import { shuffle } from './utils/basic';
let flights: {
	passengers: { destination: string; count: number }[];
	arrivalTime: number;
}[][] = [];
let slots: number[][] = [];
function getID(airport) {
	return get(airports).indexOf(airport);
}
// This file is used to have people sit on the planes

// Calculate what planes each A-B set is taking and then seat them
export function sendFlight(fromID: number, toID: number, finalDestination: airportType) {
	if (isNaN(fromID) || isNaN(toID)) return;
	//Create Proxies
	const from = new Proxy(get(airports)[fromID], {});
	const to = new Proxy(get(airports)[toID], {});
	const index = from.travelers.findIndex(v=>v.location === finalDestination.IATA);
	let travelers = new Proxy(from.travelers[index], {});

	// First, we need to see how many of these travelers can fly
	const amountMoving = Math.min(travelers.travelers, slots[from.IATA][to.IATA]);
	// Then, we need to remove those seats from the slot
	slots[from.IATA][to.IATA] -= amountMoving;
	travelers.travelers -= amountMoving;
	from.population -= amountMoving;
	// Then, they need to board the plane and prepare for takeoff
	if (!flights[from.IATA]) flights[from.IATA] = [];
	if (!flights[from.IATA][to.IATA]) flights[from.IATA][to.IATA] = {};
	const plane: {
		passengers: number[];
		arrivalTime: number;
	} = new Proxy(flights[from.IATA][to.IATA], {});
	if (!plane.passengers) plane.passengers = [];
	plane.passengers[finalDestination.IATA] = amountMoving; // Plane boarded
	plane.arrivalTime = from.gates.filter(v=>v.IATA == to.IATA)[0].speed + globals.day;
	//console.log(`${from.IATA}->${to.IATA}`, plane);
}
// Find what planes are landing
function landPlanes() {
	let flightDepartureLocations = Object.keys(flights);
	flightDepartureLocations.forEach((flightDepartureLocationCode) => {
		let flightDepartureLocation = flights[flightDepartureLocationCode];
		let flightIDs = Object.keys(flightDepartureLocation);
		flightIDs.forEach((flightArrivalLocation) => {
			land(flightDepartureLocationCode, flightArrivalLocation);
		});
	});
}
// Prepare for landing
function land(flightDepartureLocation: string, flightArrivalLocation: string) {
	let flight: {
		passengers?: { destination: string; count: number }[];
		arrivalTime?: number;
	} = new Proxy(flights[flightDepartureLocation][flightArrivalLocation], {});
	// Ok. Now that we have the flight we need to assess if it should land
	if (flight.arrivalTime < globals.day) {
		// Prepare for landing
		flight.passengers.forEach((group) => {
			if (group.destination === flightArrivalLocation) {
				// Thank you for flying with Planelooly airlines, and please fly again soon
				return;
			} else {
				// If you are connecting, your bags will be automatically transferred to your next flight
				let nextAirportProxy = IATAtoAirport(flightArrivalLocation);
				let nextAirport = new Proxy(get(airports).find(v=>v==nextAirportProxy), {});
				// Add the passengers to their destination
				nextAirport.population += group.count;
				let travelersProxy: any = nextAirport.travelers.filter(v=>
					v.location
					==
					group.destination
				);
				let travelerGroupID = nextAirport.travelers.indexOf(travelersProxy);
				nextAirport.travelers[travelerGroupID].travelers += group.count;
			}
		});
	}
	//Clear the flight
	flight = {};
}
function getSlots(airport) {
	//Calculate how many slots there are on each flight
	if (!airport.gates.filter(v=>!!v).length) return;
	airport.gates.forEach((value) => {
		if (value !== null) {
			if (!slots[airport.IATA]) slots[airport.IATA] = [];
			slots[airport.IATA][value.IATA] = 20;
		}
	});
}
function resetSlots(airports: airportType[]) {
	// Reset the slots and reassign
	slots = [];
	airports.forEach(getSlots);
}

//Takes a list of IATAs and a airportType.gates and finds one connected one
function gatesInList(gates: any[], list: string[]) {
	let options = [];
	gates.forEach((value) => {
		if (list.includes(value.IATA)) options.push(value.IATA);
	});
	return options;
}

// The entire airport's functions bottled down into a single function. I guess we get to ignore TSA.
export function setFlights() {
	const airportsNow: airportType[] = get(airports).filter(v=>v.queryResult <= globals.level);
	resetSlots(airportsNow);
	airportsNow.map((airportA) => {
		shuffle(airportsNow
			.filter(v=>v.IATA != airportA.IATA))
			.forEach((airportB) => {
				// Find what gate you need to be at and board.
				if (!airportB.gates.filter(v=>!!v).length) return;
				if (airportA !== airportB) {
					const stops = findStops(airportA.IATA, airportB.IATA, airportsNow);
					//console.log(stops);
					if (!stops) return;
					const firstDestination = IATAtoAirport(gatesInList(airportA.gates, stops)[0]);
					if (firstDestination) {
						let matchingGates = airportA.gates
							.filter(v=>v.IATA==firstDestination.IATA);
						const gate: { speed: number; IATA: string; count: number } = {
							speed: matchingGates[0].speed,
							IATA: firstDestination.IATA,
							count: matchingGates.length
						};
						if (!gate || !gate.speed) {
							console.error("Error: Its hard to fly to places that don't exist", {
								airportA: airportA,
								airportB: airportB,
								gate: gate,
								firstDestination: firstDestination,
								stops: stops,
								steps: [airportA.gates.filter(v=>!!v), firstDestination.IATA]
							});
							return;
						}
						//console.log(gate);
						let takeoffDistance = gate.speed / gate.count;
						if (lastTime % takeoffDistance > globals.day % takeoffDistance) {
							console.log(`Sending flight from ${airportA.IATA} to ${firstDestination.IATA}`);
							sendFlight(getID(airportA), getID(firstDestination), airportB);
						}
					}
				}
			});
	});
	landPlanes();
}
