export async function getLeaflet() {
	let leaflet = await import('leaflet');
	return leaflet.default;
}
