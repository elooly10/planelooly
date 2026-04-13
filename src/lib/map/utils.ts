import type { airportType } from '$lib/airports';

export function getPin(leaflet: typeof import('leaflet'), enplanements: number, size: number = 1) {
	function pin(color: string, size: number = 95) {
		return leaflet.icon({
			iconUrl: `/pins/${color}.svg`,
			iconSize: [0.4 * size, size],
			iconAnchor: [0.2 * size, size / 1.5],
			popupAnchor: [0, 0],
			shadowUrl: '',
			shadowSize: [0, 0],
			shadowAnchor: [0, 0]
		});
	}
	return pin(
		enplanements >= 10
			? 'blue'
			: enplanements >= 5
			? 'teal'
			: enplanements >= 2
			? 'green'
			: enplanements >= 1
			? 'lime'
			: enplanements >= 0.5
			? 'yellow'
			: enplanements >= 0.325
			? 'orange'
			: enplanements >= 0.15
			? 'scarlet'
			: enplanements >= 0.1
			? 'red'
			: enplanements >= 0.05
			? 'pink'
			: enplanements >= 0.025
			? 'fuchsia'
			: enplanements >= 0.01
			? 'violet'
			: enplanements >= 0.005
			? 'smokeStone'
			: 'stone',
		size * (enplanements >= 10 ? 105 : enplanements >= 5 ? 100 : enplanements < 0.01 ? 85 : 95)
	);
}

export function pin(
	airport: airportType,
	leaflet: typeof import('leaflet'),
	details: { dark: boolean; size: { volatile: boolean; default: number } }
) {
	function getPin(color: string, size: number = 95) {
		return leaflet.icon({
			iconUrl: `/pins/${color}.svg`,
			iconSize: [0.4 * size, size],
			iconAnchor: [0.2 * size, size / 1.5],
			popupAnchor: [0, 0],
			shadowUrl: '',
			shadowSize: [0, 0],
			shadowAnchor: [0, 0]
		});
	}
	return getPin(
		airport.type === 'primary'
			? 'navy'
			: airport.type === 'regional'
			? 'darkGreen'
			: airport.type === 'altRegional'
			? 'forest'
			: airport.type === 'secondary'
			? 'maroon'
			: airport.type === 'focus'
			? 'plum'
			: airport.type === 'altFocus'
			? 'darkPlum'
			: airport.gates === 0
			? 'scarlet'
			: airport.enplanements >= 1
			? 'smokeStone'
			: 'stone',
		(details.size.volatile
			? airport.enplanements >= 10
				? 104.5
				: airport.enplanements >= 1
				? 99.75
				: airport.enplanements < 0.01
				? 85.5
				: airport.enplanements < 0.1
				? 90.25
				: 95
			: 95) * details.size.default
	);
}
