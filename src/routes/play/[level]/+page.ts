/*
 * This validates that this is in fact a viable route;
 */

/** @type {import('./$types').PageLoad} */

export async function load({ params }) {
	return params;
}
