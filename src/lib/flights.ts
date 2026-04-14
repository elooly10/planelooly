import { get } from 'svelte/store';
import { airports, type airportType, type iata } from './airports';
import { findStops, getActiveAirports, IATAtoAirport } from './utils';
import { lastTime } from './tick';
import { shuffle } from './utils/basic';
import { globals } from './compiler';
let flights: {
	passengers: { destination: string; count: number }[];
	arrivalTime: number;
}[][] = [];
let slots: number[][] = [];
// This file is used to have people sit on the planes

// Calculate what planes each A-B set is taking and then seat them
export function sendFlight(from: airportType, to: airportType, finalDestination: airportType) {
	const connection = from.connections[finalDestination.IATA];

	// First, we need to see how many of these travelers can fly
	const amountMoving = Math.min(connection.travelers, slots[from.IATA][to.IATA]);
	// Then, we need to remove those seats from the slot
	slots[from.IATA][to.IATA] -= amountMoving;
	connection.travelers -= amountMoving;
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
	plane.arrivalTime = connection.speed + globals.day;
	//console.log(`${from.IATA}->${to.IATA}`, plane);
}
// Find what planes are landing
function landPlanes() {
	let flightDepartureLocations: iata[] = Object.keys(flights) as [];
	flightDepartureLocations.forEach((flightDepartureLocationCode) => {
		let flightDepartureLocation = flights[flightDepartureLocationCode];
		let flightIDs = Object.keys(flightDepartureLocation);
		flightIDs.forEach((flightArrivalLocation: iata) => {
			land(flightDepartureLocationCode, flightArrivalLocation);
		});
	});
}
// Prepare for landing
function land(flightDepartureLocation: iata, flightArrivalLocation: iata) {
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

				let travelerGroupID = nextAirport.connections[group.destination];
				nextAirport.connections[travelerGroupID].travelers += group.count;
			}
		});
	}
	//Clear the flight
	flight = {};
}
function getSlots(airport: airportType) {
	//Calculate how many slots there are on each flight
	if (!airport.gates) return;
	Object.values(airport.connections).forEach((value) => {
		if (value.gates) {
			if (!slots[airport.IATA]) slots[airport.IATA] = [];
			slots[airport.IATA][value.location] = 20;
		}
	});
}
function resetSlots(airports: airportType[]) {
	// Reset the slots and reassign
	slots = [];
	airports.forEach(getSlots);
}

// The entire airport's functions bottled down into a single function. I guess we get to ignore TSA.
export function setFlights() {
	const airportsNow: airportType[] = getActiveAirports(get(airports), globals.level);
	resetSlots(airportsNow);
	airportsNow.forEach((airportA) => {
		shuffle(airportsNow
			.filter(v=>v.IATA != airportA.IATA))
			.forEach((airportB) => {
				// Find what gate you need to be at and board.
				if (!airportB.gates) return;
				if (airportA !== airportB) {
					const stops = findStops(airportA.IATA, airportB.IATA, airportsNow);
					//console.log(stops);
					if (!stops) return;
					if (stops[0]) {
						let gate = airportA.connections[stops[1]];
						if (!gate || !gate.speed) {
							console.error("Error: Its hard to fly to places that don't exist", {
								airportA: airportA,
								airportB: airportB,
								gate: gate,
								stops: stops
							});
							return;
						}
						//console.log(gate);
						let takeoffDistance = gate.speed / gate.gates;
						if (lastTime % takeoffDistance > globals.day % takeoffDistance) {
							console.log(`Sending flight from ${airportA.IATA} to ${stops[1]}`);
							sendFlight(airportA, IATAtoAirport(stops[1]), airportB);
						}
					}
				}
			});
	});
	landPlanes();
}
