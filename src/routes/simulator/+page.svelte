<script lang="ts">
	import { levels, STATE } from '$lib/level';
	import { onMount } from 'svelte';
	import { getDescription, IATAtoAirport, IATAtoHSL, postalToState } from '$lib/utils';
	import { airports, getAirports, type airportType, type iata } from '$lib/airports';
	import Loading from '$lib/loading.svelte';
	import { drawBarChart, drawPieChart, drawHistogram } from './charts';
	import Logo from '$lib/logo.svelte';
	import { formatTime, mean } from '$lib/utils/basic';
	let levelID = 1;
	let level = levels[levelID];
	let chart: HTMLCanvasElement;
	let starterChoices = [];
	let a: HTMLAnchorElement,
		dataArr = [],
		accuracy = 0,
		pie = false;
	let chart2: HTMLCanvasElement;
	let bucketType = 'desc';
	let histoLoading = false;
	let IATA: iata = 'BOI';
	function starterChoicesChart() {
		let starterAirport = level.starterAirport();
		starterChoices.push(starterAirport);
		accuracy++;
		let data: { [key: string]: { label: string; value: number; sublabel?: string } } = {};
		starterChoices.forEach((choice) => {
			if (!data[choice])
				data[choice] = {
					label: choice,
					sublabel: IATAtoAirport(choice).location,
					value: 1 / starterChoices.length
				};
			else data[choice].value += 1 / starterChoices.length;
		});
		dataArr = Object.values(data);
		//console.log(pie)
		if (pie) drawPieChart(dataArr, chart, a);
		else drawBarChart(dataArr, chart, a);
	}

	onMount(() => {
		updateType();
		updateHistogram();
		setInterval(() => {
			for (var i = 0; i < 10; i++) starterChoicesChart();
		}, 10);
		simulateCompile();
	});
	function updateType() {
		ranges = [];
		if (!levelID || isNaN(levelID)) levelID = 0;
		if (levelID >= levels.length) levelID = levels.length - 1;
		starterChoices = [];
		accuracy = 0;
		level = levels[levelID];
		let oldLevelID = levelID;
		levelID = oldLevelID;
		level.airportsList();
		starterChoicesChart();
		simulateCompile();
	}
	function updateHistogram() {
		histoLoading = true;
		let data = getAirports().map((a) => a.enplanements);
		if (bucketType == 'wide') drawHistogram(data, [0, 0.01, 0.1, 1, 10], chart2);
		else if (bucketType == 'desc') drawHistogram(data, [0, 0.01, 0.1, 0.15, 0.5, 1, 10], chart2);
		else if (bucketType == 'pinColor')
			drawHistogram(
				data,
				[0, 0.005, 0.01, 0.025, 0.05, 0.1, 0.15, 0.325, 0.5, 1, 2, 5, 10],
				chart2
			);
		histoLoading = false;
	}
	async function simulateCompile() {
		IATA = IATA.toUpperCase() as iata;
		level.airportsList();
		let central = $airports.find(v=>v.IATA == IATA);
		let compiled = level.compiler($airports, central).sort((a, b) => a.queryResult - b.queryResult);
		let minQR = Math.max(0, compiled[2].queryResult);
		compiled.forEach((value, i) => {
			if (!ranges[i])
				ranges[i] = {
					a: [value.queryResult],
					t: value.queryResult
				};
			else {
				ranges[i].a.push(value.queryResult);
				ranges[i].t = mean(...ranges[i].a);
			}
			value.queryResult = (value.queryResult - minQR) / 0.85;
		});

	}
	let ranges: { a: number[]; t: number }[] = [];
</script>
<svelte:head>
	<title>Simulator – Planelooly</title>
</svelte:head>
<div class="p-8 w-full">
	<h1 class="text-3xl font-bold">
		<a href="/" class="gap-4 flex items-center hover:underline"
			><Logo radius={14} /> Planelooly data simulator</a
		>
	</h1>
	<details open>
		<summary class="font-bold text-lg">Level Simulator</summary>
		<div class="w-full h-[40vh] flex">
			<canvas bind:this={chart} width="1500" height="500" class="h-full dark:invert" />
			<div class="max-h-full overflow-y-scroll mx-4 mt-3">
				{#key starterChoices}
					<h2 class="text-2xl font-bold inline">Level {level.number} ({level.name})</h2>
					<p class={accuracy > 2000 ? 'text-black dark:text-white' : 'text-red-600'}>
						Accuracy: {100 - Math.round(1000000 / accuracy) / 10000}%; {dataArr.length} airports
					</p>
				{/key}
				<div class="inputGroup max-w-full my-2">
					<label class="label" for="levelID">Level ID</label>
					<input
						bind:value={levelID}
						on:input={updateType}
						type="number"
						id="levelID"
						class="mx-1 input"
						min="0"
						max={levels.length}
					/>
				</div>
				<div class="h-max">
					<table class="neat h-max">
						{#each dataArr as data}
							{@const hsl = IATAtoHSL(data.label)}
							<tr class="max-h-max">
								<td
									style="background: hsl({hsl[0]}deg, {hsl[1]}%, {hsl[2]}%); color: hsl({hsl[0]}deg, {hsl[1]}%, 10%)"
									class="dark:invert"
									on:click={() => {
										IATA = data.label;
										simulateCompile();
									}}>{data.label}</td
								>
								
								<td class="w-full">{IATAtoAirport(data.label).location}</td>
								<!-- <td>{IATAtoAirport(data.label).enplanements}</td> -->
								<td>{Math.round(data.value * 10000) / 100}%</td>
								<!-- <td>{Math.round(IATAtoAirport(data.label).enplanements/tableSum*10000)/100}%</td> -->
							</tr>
						{/each}
					</table>
				</div>
			</div>
		</div>
		<p>
			<a href="#top" class="link" bind:this={a} download="level{level.number}chart.png"
				>Download Chart</a
			>
			–
			<button class="link" on:click={() => (pie = !pie)}>{pie ? 'Bar Chart' : 'Pie Chart'}</button>
		</p>
	</details>

	<!-- <div class="m-2">
		<input class="input" type="number" bind:value={range} min="1" max={$airports.length} />
		<ul class="list-inside list-disc">
			{#each new Set([range, 5, 20, 40].sort((a, b) => a - b)) as value}
				{#if ranges.length > value}
					<li>
						{value}: QR: ~{Math.round((ranges[value - 1]?.t - ranges[2]?.t) * 100) / 100}; Day {Math.round(
							(ranges[value - 1]?.t - ranges[2]?.t) * 120
						) / 100}
					</li>
				{/if}
			{/each}
		</ul>
	</div> -->
	<details>
		<summary class="font-bold text-lg">Airport Histogram</summary>
		{#if histoLoading}
			<Loading />
		{:else}
			<canvas bind:this={chart2} width="2500" height="500" class="w-5/6" />
			<form class="flex flex-col gap-4 p-2" on:submit|preventDefault={updateHistogram}>
				<div class="flex justify-between gap-4 w-full">
					<div class="flex flex-col w-full gap-4">
						<div class="flex items-center gap-2">
							<input
								type="radio"
								id="wide"
								name="bucket"
								value="wide"
								bind:group={bucketType}
								on:change={updateHistogram}
							/>
							<label for="wide">Wide groups</label>
						</div>
						<div class="flex items-center gap-2">
							<input
								type="radio"
								id="desc"
								name="bucket"
								value="desc"
								bind:group={bucketType}
								on:change={updateHistogram}
							/>
							<label for="desc">Description groups</label>
						</div>
						<div class="flex items-center gap-2">
							<input
								type="radio"
								id="pinColor"
								name="bucket"
								value="pinColor"
								bind:group={bucketType}
								on:change={updateHistogram}
							/>
							<label for="pinColor">Pin groups</label>
						</div>
					</div>
				</div>
			</form>
		{/if}
	</details>
	<details open>
		<summary class="font-bold text-lg">Level Simulator</summary>
		<div class="flex gap-4 items-center">
			<div class="flex flex-col">
				<label for="IATA" class="label">IATA</label>
				<input
					id="IATA"
					class="input max-w-xs"
					bind:value={IATA}
					maxLength="3"
					on:change={simulateCompile}
				/>
			</div>
			<button
				on:click={() => {
					simulateCompile();
				}}
				class="ml-auto btn-no-margins color-btn-blue">Simulate</button
			>
		</div>
		<div class="flex flex-col items-center w-full">
			{#key 0}
				<table class="my-2 p-2 w-11/12 min-w-max text-center overflow-y-scroll">
					<tr class="bg-blue-200 dark:bg-blue-800 sticky top-0">
						<th>Rank</th>
						<th>Day Seen</th>
						<th>IATA</th>
						<th>Name</th>
						<th>State</th>
						<th>Popularity</th>
					</tr>
					{#each $airports as airport, i}
						{#key airport.queryResult}
							<tr class="{airport.enplanements > 1 ? 'font-bold' : ''} {airport.queryResult == 0 ? 'border-b border-black/80' : ''}">
								<td class="bg-blue-100 dark:bg-blue-900 w-12">{i + 1}</td>
								<td class="bg-blue-100 dark:bg-blue-900"
									>{formatTime(airport.queryResult)}</td
								>
								<td on:click={()=>{IATA = airport.IATA; simulateCompile()}}>{airport.IATA}</td>
								<td>{airport.location}</td>
								<td>{postalToState(airport.state)}</td>
								<td>{getDescription(airport.enplanements)}</td>
							</tr>
						{/key}
					{/each}
				</table>
			{/key}
		</div>
	</details>
</div>
