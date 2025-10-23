<script lang="ts">
	import { globals } from '$lib/compiler';
	let date = globals.day;
	let hour = (date % 1) * 24 + 12 + 24;
	let minute = (hour % 1) * 60;
	// {Math.floor(globals.day) + 1}, {Math.floor((globals.day % 1) * 24)}:{Math.round(
	// 						(globals.day % (1 / 24)) * 60 * 24
	// 					)
	// 						.toString()
	// 						.padStart(2, '0')}

	const refresh = setInterval(() => {
		if (date != globals.day) date = globals.day;
		else if (globals.increment !== 0) date += globals.increment / 750;
		//console.log(date, globals.day)
		hour = (date % 1) * 24 + 24;
		minute = (hour % 1) * 60;
	}, 75);
	// {Math.floor(globals.day + 1)} at {Math.floor(
	// 					(((globals.day % 1) * 24 + 12 + 24 - 1) % 12) + 1
	// 				)
	// 					.toString()
	// 					.padStart(2, '0')}:{Math.floor((((globals.day % 1) * 24 + 12 + 24) % 1) * 60)
	// 					.toString()
	// 					.padStart(2, '0')}
	// 				{Math.floor((globals.day % 1) * 24 + 12 + 24 - 1) % 12 ===
	// 				Math.floor((globals.day % 1) * 24 + 12 + 24 - 1) % 24
	// 					? 'PM'
	// 					: 'AM'}
</script>

<div
	class="text-sm p-1.5 rounded border border-gray-200 flex flex-col items-center justify-between not-prose"
>
	<h3 class="text-2xl font-bold leading-none">Day {Math.floor(date + 1)}</h3>
	{Math.floor(((hour - 1) % 12) + 1)
		.toString()
		.padStart(2, '0')}:{Math.floor(minute).toString().padStart(2, '0')}
	{hour % 12 === hour % 24 ? 'AM' : 'PM'}
</div>
