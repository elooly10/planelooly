import { get, writable } from 'svelte/store';
import { airports, type airportClass, type airportType } from '$lib/airports';
import { globals } from '../compiler';
import { findPath } from '../travelAgent';
export const states = {
	DC: 'DC',
	AL: 'Alabama',
	AK: 'Alaska',
	AS: 'American Samoa',
	AZ: 'Arizona',
	AR: 'Arkansas',
	CA: 'California',
	CO: 'Colorado',
	CT: 'Connecticut',
	DE: 'Delaware',
	FL: 'Florida',
	GA: 'Georgia',
	GU: 'Guam',
	HI: 'Hawaii',
	ID: 'Idaho',
	IL: 'Illinois',
	IN: 'Indiana',
	IA: 'Iowa',
	KS: 'Kansas',
	KY: 'Kentucky',
	LA: 'Louisiana',
	ME: 'Maine',
	MD: 'Maryland',
	MA: 'Massachusetts',
	MI: 'Michigan',
	MN: 'Minnesota',
	MS: 'Mississippi',
	MO: 'Missouri',
	MT: 'Montana',
	NE: 'Nebraska',
	NV: 'Nevada',
	NH: 'New Hampshire',
	NM: 'New Mexico',
	NJ: 'New Jersey',
	NY: 'New York',
	NC: 'North Carolina',
	ND: 'North Dakota',
	MP: 'Northern Marianas',
	OH: 'Ohio',
	OK: 'Oklahoma',
	OR: 'Oregon',
	PA: 'Pennsylvania',
	PR: 'Puerto Rico',
	RI: 'Rhode Island',
	SC: 'South Carolina',
	SD: 'South Dakota',
	TN: 'Tennessee',
	TX: 'Texas',
	UT: 'Utah',
	VT: 'Vermont',
	VA: 'Virginia',
	WA: 'Washington',
	WV: 'West Virginia',
	WI: 'Wisconsin',
	WY: 'Wyoming',
	VI: 'Virgin Islands',
	PW: 'Palau',
	MH: 'Marshall Islands',
	UM: 'United States'
};
export function postalToState(code) {
	return states[code];
}
export function findConnection(airportA: airportType, airportB: airportType) {
	try {
		if (!airportA || !airportB) throw new Error('Invalid Airport');
		const gates = [];
		airportA.gates.forEach((value) => {
			if (value === null) return;
			if (value.IATA === airportB.IATA) gates.push(value);
		});
		const gateCount = gates.length;
		if (gateCount) {
			return {
				amount: gateCount,
				ending: gateCount !== 1 ? 's' : '',
				connected: true,
				distance: gates[0].speed,
				locations: []
			};
		} else {
			const stops = findStops(airportA.IATA, airportB.IATA, get(airports));
			let time = 0;
			if (!stops) {
				return {
					amount: 0,
					ending: '',
					connected: false,
					distance: 0,
					locations: []
				};
			}
			stops.forEach((value, index, arr) => {
				const stop = IATAtoAirport(value);
				const flight: { IATA: string; speed: number } = stop.gates
					.filter((v)=>!!v && v.IATA === arr[index + 1])?.[0];
				time += !flight ? 0 : flight.speed;
			});
			function getMiddleEntries(arr) {
				// Check if the array has more than 2 elements
				if (arr.length <= 2) {
					return []; // Return an empty array if there are no middle entries
				}

				// Use slice to get the middle entries
				return arr.slice(1, arr.length - 1);
			}
			return {
				amount: stops.length - 2,
				ending: stops.length === 3 ? '' : 's',
				connected: false,
				distance: time,
				locations: getMiddleEntries(stops)
			};
		}
	} catch (error) {
		console.error(`findConnection: ${error}`);
		return {
			amount: 0,
			ending: '',
			connected: false,
			distance: 0,
			locations: []
		};
	}
}
function toRadians(degrees: number) {
	return degrees * (Math.PI / 180);
}
/* Better distance calculator than A+B */
export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
	const R = 6371; // Radius of the Earth in km
	const dLat = toRadians(lat2 - lat1);
	const dLon = toRadians(lon2 - lon1);
	const lat1Rad = toRadians(lat1);
	const lat2Rad = toRadians(lat2);

	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1Rad) * Math.cos(lat2Rad);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	const d = R * c;
	return d;
}
export function count(number: number, word: string, ending: string) {
	return `${number} ${word}${number !== 1 ? ending : ''}`;
}
export function findSpeed(airportA: airportType, airportB: airportType) {
	const distance = haversineDistance(
		airportA.latitude,
		airportA.longitude,
		airportB.latitude,
		airportB.longitude
	);
	const speed = 0.00005; // ~518mph
	const taxing = 0.07; // Other conditions not distance-dependant, e.g. taxing
	return distance * speed + taxing;
}
export function IATAtoAirport(node) {
	return get(airports).find((a) => a.IATA === node);
}
export function findStops(airportA: string, airportB: string, airports: airportType[]) {
	let store = findPath(IATAtoAirport(airportA), IATAtoAirport(airportB));
	if (store.sumTime === -1) return null;
	else return store.order;
}

// Find the Index of the connecting gate given two airports
export function findGateIndex(airport: airportType, survey: airportType): number {
	let index = -1;
	airport.gates?.forEach((value, i) => {
		if (!value) return false; /* Continue on Null */
		if (value.IATA === survey.IATA) index = i;
	});
	return index;
}

export let mapUpdates = writable(Number.MIN_SAFE_INTEGER + 1);
export let mapUpdatesClear = writable(Number.MIN_SAFE_INTEGER + 1);
function findLength(connection: {
	amount: number;
	ending: string;
	connected: boolean;
	distance: any;
}) {
	if (connection.connected) return connection.amount;
	else if (!connection.amount) return -Infinity;
	else return -connection.amount;
}
export function sortTravelers(
	airport: airportType,
	a: { location: string; travelers: number; interest: number },
	b: { location: string; travelers: number; interest: number }
) {
	let airportA = IATAtoAirport(a.location);
	let airportB = IATAtoAirport(b.location);
	if (
		globals.travelersSortMode === 'travelers' ||
		(globals.travelersSortMode === 'interest' && !airport.interestMode)
	)
		return b.travelers - a.travelers;
	else if (globals.travelersSortMode === 'gates')
		return (
			findLength(findConnection(airport, airportB)) - findLength(findConnection(airport, airportA))
		);
	else if (globals.travelersSortMode === 'distance') {
		return (
			haversineDistance(
				airport.latitude,
				airport.longitude,
				airportA.latitude,
				airportA.longitude
			) -
			haversineDistance(airport.latitude, airport.longitude, airportB.latitude, airportB.longitude)
		);
	} else if (globals.travelersSortMode === 'type') {
		console.log(
			airportB.type,
			airportA.type,
			typeToValue(airportB.type),
			typeToValue(airportA.type)
		);
		return typeToValue(airportB.type) - typeToValue(airportA.type);
	} else if (globals.travelersSortMode === 'interest') {
		return b.interest - a.interest;
	} else {
		console.log(globals.travelersSortMode);
		return 0;
	}
}
export let Confirm = (...data) => confirm(...data);
export function removeConfirmation() {
	Confirm = (...data) => true;
}
export function restateConfirmation() {
	Confirm = (...data) => confirm(...data);
}
export function ConfirmIsRegular() {
	console.log(Confirm.toString(), Confirm.toString() === '(...data) => confirm(...data)');
	if (Confirm.toString() === '(...data) => confirm(...data)') return true;
	else return false;
}

export function getDescription(enplanements: number): string {
	let enplanementsLevel = 'Medium';
	if (enplanements >= 10) enplanementsLevel = 'Very high';
	else if (enplanements >= 1) enplanementsLevel = 'High';
	else if (enplanements >= 0.5) enplanementsLevel = 'Medium-high';
	else if (enplanements < 0.01) enplanementsLevel = 'Very low';
	else if (enplanements < 0.1) enplanementsLevel = 'Low';
	else if (enplanements < 0.15) enplanementsLevel = 'Medium-low';
	return enplanementsLevel;
}
export function typeToValue(
	type: airportClass
) {
	switch (type) {
		case 'nonHub':
			return 0;
		case 'altFocus':
			return 1;
		case 'focus':
			return 2;
		case 'altRegional':
			return 3;
		case 'regional':
			return 4;
		case 'secondary':
			return 5;
		case 'primary':
			return 6;
	}
}

export function funFact() {
	let funFacts = [
		'Planelooly includes 6 airports that serve Los Angeles.',
		'The airport in Jackson, Wyoming is in Grand Teton National Park.',
		'Atlanta\'s Hartsfield-Jackson International Airport is the busiest in the world.',
		'Florida and California both have 12 high-popularity airports.',
		'43 states have a high-popularity or very high-popularity airport.'
	];
	return funFacts[Math.floor(Math.random() * funFacts.length)];
}

export function IATAtoHSL(iata) {
	const characters = iata.toUpperCase().split('');

	// Get ASCII values of the letters
	const ascii1 = characters[0].charCodeAt(0) - 65;
	const ascii2 = characters[1].charCodeAt(0) - 65;
	const ascii3 = characters[2].charCodeAt(0) - 65;

	// Calculate a unique hue based on the ASCII values
	const hue = ((ascii1 * 26 + ascii2) / 676) * 360;
	const saturation = ((ascii3 * 26 + ascii2) / 676) * 80 + 20;
	const lightness = ((ascii2 * 26 + ascii1) / 676) * 20 + 70;
	return [hue, saturation, lightness];
}

export function IATAfilter(airport: airportType, IATAs: string[], excludes: boolean = false) {
	if (IATAs.includes(airport.IATA)) return !excludes;
	else return excludes;
}
export function filterEnplanements(level: number, up: boolean = true) {
	return (airport: airportType) => {
		if (airport.enplanements > level) return up;
		else return !up;
	}
}
