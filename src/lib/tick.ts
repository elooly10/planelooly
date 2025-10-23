import { get } from 'svelte/store';
import { globals, compiler } from './compiler';
import { airports, type airportType } from './airports';
import { haversineDistance, mapUpdatesClear, sortTravelers } from './utils';
import { resetCache } from './travelAgent';
import { setFlights } from './flights';
import { browser } from '$app/environment';
import { mean } from './utils/basic';
let loading = true;
let lost = false;
export let lastTime = 0;
function incrementTime() {
	const airportCentral = get(airports).filter(v=>v.IATA === globals.centralAirport)[0];
	if (!loading) {
		airports.set(get(airports).map((v) => {
			if (v.travelers) v.travelers.sort((a, b) => sortTravelers(v, a, b));
			return v;
		}));
	}
	globals.day += globals.increment / 500;
	globals.level =
		globals.day * 0.85 +
		Math.max(0, airportCentral.queryResult, get(airports)[2].queryResult);
	if (Math.floor(globals.day) !== Math.floor(lastTime) && globals.increment) {
		globals.tokens += Math.round(
			globals.hardness *
				Math.ceil(
					Math.ceil(globals.day / 10) +
						get(airports)
							.filter(v=>
								v.queryResult <=
								Math.ceil(globals.day + 0.01) * 0.85 +
									Math.max(0, airportCentral.queryResult, get(airports)[2].queryResult)
								&& v.queryResult >=
								Math.floor(globals.day) * 0.85 +
									Math.max(0, airportCentral.queryResult, get(airports)[2].queryResult)
							).length *
							3
				)
		);
		console.log('Updated Tokens');
	}
	if (globals.day >= globals.starLevels[globals.stars]) {
		globals.stars++;
	}
	if (!(globals.stars - globals.starLevels.length)) {
		globals.increment = 0;
	}
}
function increasePopulation() {
	let gotAirports = get(airports);
	gotAirports.forEach((airport) => {
		/* Well, we need to set the population somewhere */
		if (globals.level >= airport.queryResult) {
			/* Set population */
			// If there is a new airport, assign it population
			const defaultPopulation =
				mean(...gotAirports.filter((v)=>v.queryResult <= globals.level).map(v => v.enplanements)) /
					8 +
				Math.sqrt(airport.enplanements) * 2 +
				12.2;
			if (
				(typeof airport.population !== 'number' || isNaN(airport.population)) &&
				airport.queryResult >= 0
			) {
				console.log(`New airport: ${airport.IATA}`);
				mapUpdatesClear.set(get(mapUpdatesClear) + 1);
				resetCache();
			}
			try {
				// Add to the population of an airport and change its growth rate (in interest view) to match.
				let growthRate =
					0.4 *
					(globals.day / 16 + 0.9375) *
					((globals.level - airport.queryResult) * 0.002 +
						Math.sqrt(airport.enplanements) * 0.1 +
						0.1);
				airport.population =
					typeof airport.population === 'number' && !isNaN(airport.population)
						? airport.population + growthRate * globals.increment
						: defaultPopulation;
				airport.growthRate = 500 * growthRate;
			} catch (error) {
				console.error(`Error during population assignment: ${error}`);
			}
		}
	});
	airports.set(gotAirports);
}

function calculateTravelers(
	airportA: airportType,
	airportB: airportType,
	meanEnplanements: number
) {
	const distance = Math.max(
		haversineDistance(airportA.latitude, airportA.longitude, airportB.latitude, airportB.longitude),
		5000
	);
	// Even if Buffalo is closer, you still are more likely to want to fly to New York City
	const popularityFactor =
		airportB.enplanements / meanEnplanements + Math.sqrt(airportB.enplanements) / 3;
	// But if Seattle is way closer than New York City, you'll end up wanting to go there!
	const distanceFactor = Math.max(Math.min(250 - 0.025 * distance, distance / 2) / 70, 0);
	const value = 2 * popularityFactor + distanceFactor;
	if (isNaN(value)) {
		return isNaN(popularityFactor) ? 1 : popularityFactor;
	}
	return Math.max(value, 0);
}
function addTravelers() {
	const gotAirports = get(airports);
	const receivedAirports = gotAirports.filter(v=>v.queryResult <= globals.level);
	const airportPopulationSum = receivedAirports.map(v => v.enplanements).reduce((a, b) => a + b, 0);
	gotAirports.filter(v=>v.queryResult <= globals.level).forEach((airport: airportType, i) => {
		const oldTravelers: { location: string; travelers: number; interest: number }[] = [];

		// Assign values to the oldTravelers array
		receivedAirports.forEach((value: airportType, j) => {
			const travelers: {
				location: string;
				travelers: number;
				interest: number;
			} = airport.travelers?.filter(v=>v.location == value.IATA)[0];
			/* Assign oldTravelers value */
			if (value.IATA !== airport.IATA) {
				//console.log(`${airport.location}→${value.location}: ${travelers?.travelers ?? 0} travelers`);
				try {
					oldTravelers.push({
						location: value.IATA,
						travelers: travelers?.travelers ?? 0,
						interest: travelers?.interest ?? 0
					});
				} catch (error) {
					// We don't really care what the error is, we should just add a blank one.
					oldTravelers.push({
						location: value.IATA,
						interest: 0,
						travelers: 0
					});
				}
			}
		});
		const totalTravelers = airport.travelers?.map(v => v.travelers).reduce((a, b) => a + b, 0)
		if (Math.round(airport.population) !== totalTravelers) {
			// #1: Calculate The percentages of each place using calculateTravelers(a, b, mean)
			const diff =
				Math.round(airport.population) - (totalTravelers ?? 0);
			const percentages: {
				airport: airportType;
				score: number;
			}[] = [];
			receivedAirports.forEach((airportB: airportType) => {
				if (airportB !== airport) {
					percentages.push({
						airport: airportB,
						score: calculateTravelers(
							airport,
							airportB,
							(airportPopulationSum - airport.enplanements) /
								(gotAirports
									.filter(v=>
										v.queryResult <= globals.level &&
										v.IATA == airport.IATA
									)
									.map(v=>v.enplanements).length -
									1)
						)
					});
				}
			});
			// #2: Assign
			const percentageSum = percentages.map(v=>v.score).reduce((a, b)=>a+b,0);
			percentages.map((value) => {
				value.score /= percentageSum;
			}); // The percentages are now actually percentages.

			const newTravelers = oldTravelers;

			// For each traveler, choose a random airport
			for (let j = 0; j < diff; j++) {
				const choiceNum = Math.random();
				let choice: airportType;
				let sumScore = 0;
				percentages.forEach((value) => {
					if (!newTravelers.find(v => v.location === value.airport.IATA)) return;
					newTravelers.find(v=>v.location === value.airport.IATA).interest = value.score;
					if (value.score + sumScore >= choiceNum && !choice) choice = value.airport;
					sumScore += value.score;
				});
				if (!choice) return;
				//console.log(`Picked ${choice.IATA} to delegate a ${airport.IATA} traveler to.`);
				newTravelers[
					newTravelers.indexOf(newTravelers.filter(v=>v.location == choice.IATA)[0])
				].travelers++;
			}
			// used if TSM = 'gates'
			gotAirports[i].travelers = newTravelers.sort((a, b) => sortTravelers(gotAirports[i], a, b));
		}
	});
	airports.set(gotAirports);
}
function checkForLoss() {
	if (
		Math.round(
			Math.max(
				...get(airports).filter(v=>v.queryResult <= globals.level).map(v=>v.population)
			)
		) >= 200 &&
		browser &&
		!lost
	) {
		lost = true;
		clearInterval(time);
		globals.increment = 0;
	}
	return lost;
}
function tick() {
	try {
		if (globals.increment !== 0 || loading) {
			incrementTime(); // Move time up, add tokens, add stars, etc.
			increasePopulation(); // Add new people to the airports that deserve them.
			addTravelers(); // Add to travelers
			if (!checkForLoss()) setFlights(); // Land flights
			lastTime = globals.day;
			loading = false;
		}
		checkForLoss();
	} catch (values) {
		if (values.important ?? false) alert(values);
		console.error(values);
	}
}
let time = null;
export function clearTime() {
	if (time) clearInterval(time);
}
export function startTime() {
	compiler();
	console.log('Initiating main play interval');
	loading = true;
	time = null;
	time = setInterval(tick, 200);
	tick();
}
