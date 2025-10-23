// Remove array duplicates
export function removeDuplicates(arr: any[]): any[] {
	return [...new Set(arr)];
}

//Pop from the middle
export function removeEntryByID(arr: any[], entryID: number) {
	return arr.filter((value, id) => id !== entryID);
}


export function delay(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export function sortAlphabetically(a: string, b: string): number {
	return a > b ? 1 : -1;
}

export function shuffle(array: any[]) {
	let currentIndex = array.length;

	// While there remain elements to shuffle...
	while (currentIndex != 0) {
		// Pick a remaining element...
		let randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex--;

		// And swap it with the current element.
		[array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
	}
	return array;
}
function RGBToHex(red: number, green: number, blue: number): string {
	// Remove the hash at the start if it's there
	let redHex = red.toString(16).padStart(2, '0');
	let greenHex = green.toString(16).padStart(2, '0');
	let blueHex = blue.toString(16).padStart(2, '0');
	return '#' + redHex + greenHex + blueHex;
}
function HSLToRGB(h: number, s: number, l: number): [number, number, number] {
	h = ((h % 360) + 360) % 360; // Ensure hue is between 0 and 360
	s = Math.max(0, Math.min(1, s)); // Ensure saturation is between 0 and 1
	l = Math.max(0, Math.min(1, l)); // Ensure lightness is between 0 and 1

	const c = (1 - Math.abs(2 * l - 1)) * s;
	const hDash = h / 60;
	const x = c * (1 - Math.abs((hDash % 2) - 1));
	const m = l - c / 2;

	let r = 0,
		g = 0,
		b = 0;

	if (hDash >= 0 && hDash < 1) {
		[r, g, b] = [c, x, 0];
	} else if (hDash >= 1 && hDash < 2) {
		[r, g, b] = [x, c, 0];
	} else if (hDash >= 2 && hDash < 3) {
		[r, g, b] = [0, c, x];
	} else if (hDash >= 3 && hDash < 4) {
		[r, g, b] = [0, x, c];
	} else if (hDash >= 4 && hDash < 5) {
		[r, g, b] = [x, 0, c];
	} else {
		[r, g, b] = [c, 0, x];
	}

	r = Math.round((r + m) * 255);
	g = Math.round((g + m) * 255);
	b = Math.round((b + m) * 255);

	return [r, g, b];
}
export function HSLToHex(h: number, s: number, l: number): string {
	return RGBToHex(...HSLToRGB(h, s / 100, l / 100));
}
export function mean(...v: number[]) {
	let sum = v.reduce((a, b) => a + b, 0)
	return sum / v.length;
}