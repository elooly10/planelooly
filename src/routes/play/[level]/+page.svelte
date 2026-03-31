<script lang="ts">
	import { airports } from '$lib/airports';
	import AirportModal from '$lib/airportModal.svelte';
	import Clock from '$lib/clock.svelte';
	import { globals, resetGlobals } from '$lib/compiler';
	import Image from '$lib/image.svelte';
	import { setLevel } from '$lib/level';
	import Logo from '$lib/logo.svelte';
	import MainColumn from '$lib/mainColumn.svelte';
	import MapModal from '$lib/map/modal.svelte';
	import { startTime } from '$lib/tick';
	import {
		mapUpdates,
		mapUpdatesClear,
		removeConfirmation,
		restateConfirmation,
		ConfirmIsRegular,
		funFact
	} from '$lib/utils';
	import { onDestroy, onMount } from 'svelte';
	import Loading from '$lib/loading.svelte';
	import Modal from '$lib/modal.svelte';
	import { goto } from '$app/navigation';
	export let data;

	// Level
	let level = setLevel(Number(data.level));
	console.log(level);
	// Settings
	let playSpeed = 1;
	let showTutorial = level.number == 'T';
	let won = false,
		lost = false;
	let autoFire = true;
	let dblClick = true;
	let volatilePinSize = true;
	let pinSize = 1;
	let hideNotifications = false;
	let options: [boolean, boolean, boolean, boolean, string, boolean, string] = [
		true,
		false,
		true,
		true,
		'0',
		false,
		'1'
	];

	function openSettingsPanel() {
		resetSettings();
		showSettings = true;
	}
	function closeSettingsPanel() {
		if (confirm('Confirm these changes?')) activateSettings();
		else resetSettings();
		showSettings = false;
	}
	function enterSettings() {
		if (!showTutorial && !showLoss && showSettings && playSpeed) playButton();
		else if (!showSettings) {
			pauseButton();
		}
		if (!showSettings) openSettingsPanel();
		else closeSettingsPanel();
	}
	function activateSettings() {
		console.log(options[0]);
		if (options[0]) removeConfirmation();
		else restateConfirmation();
		autoFire = options[1];
		dblClick = options[2];
		volatilePinSize = options[3];
		pinSize =
			options[4] == 'largest'
				? 1.2
				: options[4] == 'larger'
				? 1.1
				: options[4] == 'smaller'
				? 0.9
				: options[4] == 'smallest'
				? 0.8
				: 1;
		hideNotifications = options[5];
		playSpeed = Number(options[6]);
		playButton();
		showSettings = false;
	}
	function resetSettings() {
		if (ConfirmIsRegular()) options[0] = false;
		else options[0] = true;
		options[1] = autoFire;
		options[2] = dblClick;
		options[3] = volatilePinSize;
		options[4] =
			pinSize == 1.2
				? 'largest'
				: pinSize == 1.1
				? 'larger'
				: pinSize == 0.9
				? 'smaller'
				: pinSize == 0.8
				? 'smallest'
				: 'normal';
		options[5] = hideNotifications;
		options[6] = String(playSpeed) ?? '1';
	}
	// Setup stuff
	globals.increment = 0;
	let i = 0;
	setInterval(() => {
		i++;
		lost =
			Math.round(
				Math.max(...$airports.filter(v=>v.queryResult <= globals.level).map(v=>v.population))
			) >= 200;
		showLoss = lost && !blockShow;
		if (lost) globals.increment = 0;
		won = !(globals.stars - globals.starLevels.length) && !blockShow && !lost;
		showWin = won && !blockShow;
	}, 200);
	let airportID = 0;

	let showLoss: boolean = false,
		showWin = false,
		showSettings = false,
		blockShow = false;

	// Click play!
	function playButton() {
		if (showTutorial || showLoss || showSettings || showWin || blockShow) return;
		else {
			globals.increment = playSpeed ? playSpeed : 1;
		}
	}

	// Pause
	function pauseButton() {
		console.log('Pausing...');
		playSpeed = globals.increment ? globals.increment : 1;
		globals.increment = 0;
	}

	// Developer tools
	let inDevMode = false;
	function increaseSpeed(key = false) {
		let speed = globals.increment;
		switch (speed) {
			case 1:
				speed = 2;
				break;
			case 2:
				speed = 5;
				break;
			case 5:
				speed = 10;
				break;
			case 10:
				speed = key ? 10 : 1;
				break;
		}
		options[6] = String(speed);
		globals.increment = speed;
	}
	function readKey(event) {
		if (event.key === ' ') {
			globals.increment ? pauseButton() : playButton();
		} else if (event.key === 'ArrowUp' && globals.increment) {
			increaseSpeed(true);
		} else if (event.key === 'ArrowDown' && globals.increment) {
			let speed = globals.increment;
			switch (speed) {
				case 2:
					speed = 1;
					break;
				case 5:
					speed = 2;
					break;
				case 10:
					speed = 5;
					break;
			}
			options[6] = String(speed);
			globals.increment = speed;
		} else if (event.key === 's') {
			enterSettings();
		}
		if (event.key === '/') {
			if (!inDevMode) console.log('Enabling Dev Mode');
			// Enter special mode
			inDevMode = !inDevMode;
		}
		// Data dumps...
		else if (event.key === 'Q' && inDevMode) {
			console.log($airports);
		} else if (event.key === 'q' && inDevMode) {
			console.log($airports.map(v=>v.IATA).join(', '));
		} else if (event.key === 'G' && inDevMode) {
			console.log(globals);
		} else if (event.key === 'g' && inDevMode) {
			console.log(JSON.stringify(globals, null, 2).slice(1, -1));
		} else if (event.key === 'm' && inDevMode) {
			console.log(
				`Times map was updated but not reset: ${$mapUpdates - (Number.MIN_SAFE_INTEGER + 1)}.`
			);
			console.log(
				`Times where map updated & was reset: ${$mapUpdatesClear - (Number.MIN_SAFE_INTEGER + 1)}.`
			);
			console.log(
				`Times map was updated: ${
					$mapUpdatesClear -
					(Number.MIN_SAFE_INTEGER + 1) +
					$mapUpdates -
					(Number.MIN_SAFE_INTEGER + 1)
				}.`
			);
		} else if (event.key === 'L' && inDevMode) {
			console.log(level);
		} else if (event.key === 'l' && inDevMode) {
			console.log(`Level ID: ${data.level}`);
			console.log(`Level #: ${level.number}`);
		}
	}
	// Go!
	let loading = true;
	onMount(() => {
		removeConfirmation();
		console.log('Page Loaded', data);
		if (!data || isNaN(Number(data?.level)) || !level) {
			goto('/');
		}
		console.log('Starting Time');
		startTime();
		airportID = $airports.indexOf($airports.find((value) => value.queryResult == 0));
		loading = false;
	});
	onDestroy(() => {
		if (!level) return;
		resetGlobals();
		level.airportsList();
	});
	function refresh() {
		window.location.reload();
		resetGlobals();
		level.airportsList();
	}
</script>
<svelte:head>
	<title>Level {level.number} - Planelooly</title>
	<meta name='desc' content='Connect {(typeof level.number == 'number' && level.number < 57)? level.name + ' ' : ''}airports to keep passenger counts low in this strategy game.'/>
</svelte:head>
<svelte:window on:keydown={readKey} />
<!-- * Ready To Go! -->
<div class="flex flex-wrap flex-col items-center overflow-hidden">
	{#if loading}
		<div class="w-screen h-screen flex items-center justify-center">
			<Loading placeholder={funFact()} />
		</div>
	{:else}
		<!-- Heading -->
		<div class="">
			<Modal bind:show={showSettings} onclose={closeSettingsPanel}>
				<form on:submit|preventDefault={activateSettings}>
					<div class="flex items-center justify-between">
						<h2 class='text-2xl font-bold'>Settings</h2>
						<button
							class="flex-grow-0 hover:bg-stone-300 dark:hover:bg-zinc-800 rounded-full w-12 h-12 text-2xl font-bold"
							on:click={() => (showTutorial = false)}>&times;</button
						>
					</div>
					<h3 class="text-xl font-bold">Notifications</h3>
					<div class="flex items-center justify-between gap-2 p-1">
						<label for="disableConf">Disable buy/sell gate confirmations</label>
						<input id="disableConf" type="checkbox" bind:checked={options[0]} class="input" />
					</div>
					<div class="flex items-center justify-between gap-2 p-1">
						<label for="largePins">Hide new airport notifications</label>
						<input id="largePins" type="checkbox" bind:checked={options[5]} class="input" />
					</div>
					<h3 class="text-xl font-bold">Map</h3>
					<div class="flex items-center justify-between gap-2 p-1">
						<label for="autoFire">Automatically switch modal when map pin is clicked</label>
						<input id="autoFire" type="checkbox" bind:checked={options[1]} class="input" />
					</div>
					<div class="flex items-center justify-between gap-2 p-1">
						<label for="dblClick"
							>Clicking on route removes a gate<br />Right-clicking on route adds a gate</label
						>
						<input id="dblClick" type="checkbox" bind:checked={options[2]} class="input" />
					</div>
					<div class="flex items-center justify-between gap-2 p-1">
						<label for="volatilePinSize">Map pin size reflects popularity</label>
						<input id="volatilePinSize" type="checkbox" bind:checked={options[3]} class="input" />
					</div>
					<div class="flex items-center justify-between gap-4 p-1">
						<label for="speed">Map pin size:</label>
						<select bind:value={options[4]} id="speed" class="input-select text-md py-1">
							<option value="largest">Largest</option>
							<option value="larger">Larger</option>
							<option value="normal">Normal</option>
							<option value="smaller">Smaller</option>
							<option value="smallest">Smallest</option>
						</select>
					</div>
					<h3 class="text-xl font-bold">Other</h3>
					<div class="flex items-center justify-between gap-4 p-1">
						<label for="speed">Game speed:</label>
						<select bind:value={options[6]} id="speed" class="input-select py-1 text-md">
							<option value="1">1x</option>
							<option value="2">2x</option>
							<option value="5">5x</option>
							<option value="10">10x</option>
						</select>
					</div>
					<button type="submit" class="btn color-btn-game-primary">Confirm changes</button>
					<button
						type="button"
						class="btn color-btn-game-secondary"
						on:click={() => (showTutorial = true)}>View instructions</button
					>
				</form>
			</Modal>
			<Modal bind:show={showTutorial}>
				<div
					class="prose prose-headings:my-2 dark:prose-invert w-max max-h-[80vh] overflow-y-scroll p-2"
				>
					<div class="flex items-center justify-between">
						<h1>How to Play</h1>
						<button
							class="flex-grow-0 hover:bg-stone-300 dark:hover:bg-zinc-800 rounded-full w-12 h-12 text-2xl font-bold"
							on:click={() => (showTutorial = false)}>&times;</button
						>
					</div>
					<p>The goal of the game is to keep the passenger count at every airport below 200.</p>
					<p>
						To do this, you will connect airports by purchasing gates. Buying connecting gates costs
						two tokens, and unspent tokens can be viewed at the top of the screen.
					</p>
					<p>
						On the left side of the screen, there is a modal where you can view an airport's
						traveler count and connect it to other locations. Towards the top of this modal, you can
						view the airport's IATA code, location, and the total travelers at the airport. There is also a
						dropdown menu to select your airport's designation. The designation changes the color of
						the modal and gate dots, making it easier to find. Further below on the modal, other
						airports are listed. The amount of gates or stops between the two locations is viewable,
						as well as the amount of travelers between the two locations. Clicking on the plus or
						minus symbols on the right of each row allows you to purchase or sell gates at both
						locations. Clicking elsewhere in this row lets you navigate to the airport listed.
					</p>
					<p>
						The far top of the screen provides useful information. Clicking on the Planelooly logo
						at the leftmost portion quits the game, which cannot be resumed at a later date. To the
						right, the current level, the amount of tokens, and the current time
						are included. At the end of each day, new tokens are rewarded. The far top-right
						includes the play/pause button as well as the settings, which can be clicked on to
						adjust game speed, and view these instructions while in the game. Clicking the <kbd
							class="kbd">s</kbd
						>
						key opens the settings. Clicking the <kbd class="kbd">▲</kbd> or
						<kbd class="kbd">▼</kbd> key adjusts the speed quickly.
					</p>
					<p>
						Below the top right portion of the screen a quick glance of the system is provided,
						including the amount of travelers currently needing to board a plane and the
						current amount of airports. Clicking on any airport navigates the left modal to the
						airport.
					</p>
					<p>
						The bottom right corner of the screen is a map showing each airport and its
						connections. Clicking on a pin navigates to the associated airport in the modal located
						on the left of the screen.
					</p>
					<p>
						Depending on how you perform in the game, you will receive a number of stars. 
						If you last long enough to receive all three stars, you beat the level.
					</p>
					<p class="opacity-70 text-sm">
						Data for Planelooly is from <a
							href="https://www.faa.gov/airports/planning_capacity/passenger_allcargo_stats/passenger"
							>the Federal Aviation Administration (FAA)</a
						>.
					</p>
				</div>
			</Modal>
			<Modal bind:show={showLoss} onclose={() => (blockShow = true)}>
				<div class="flex items-center justify-between">
					<h2 class='text-2xl font-bold'>You lost</h2>
					<button
						class="flex-grow-0 hover:bg-stone-300 dark:hover:bg-zinc-800 rounded-full w-12 h-12 text-2xl font-bold"
						on:click={() => (showLoss = false)}>&times;</button
					>
				</div>
				<div class="flex-col">
					<span
						>You lost on Day {Math.floor(globals.day + 1)} at {Math.floor(
							(((globals.day % 1) * 24 + 12 + 24 - 1) % 12) + 1
						)
							.toString()
							.padStart(2, '0')}:{Math.floor((((globals.day % 1) * 24 + 12 + 24) % 1) * 60)
							.toString()
							.padStart(2, '0')}
						{Math.floor((globals.day % 1) * 24 + 12 + 24 - 1) % 12 ===
						Math.floor((globals.day % 1) * 24 + 12 + 24 - 1) % 24
							? 'PM'
							: 'AM'}.
					</span>
					<span>You received {globals.stars}/{globals.starLevels.length} stars.</span>
					<div class="flex">
						<button class="btn color-btn-game-secondary" on:click={refresh} data-sveltekit-reload
							>Play Again</button
						>
						<a class="btn color-btn-game-primary" href="/">More Levels</a>
					</div>
				</div>
			</Modal>
			<Modal bind:show={showWin} onclose={() => blockShow = true}>
				<div class="flex items-center justify-between">
					<h2 class='text-2xl font-bold'>You won!</h2>
					<button
						class="flex-grow-0 hover:bg-stone-300 dark:hover:bg-zinc-800 rounded-full w-12 h-12 text-2xl font-bold"
						on:click={() => (showWin = false)}>&times;</button
					>
				</div>
				<div class="flex-col">
					<span
						>You survived to Day {Math.floor(globals.day + 1)} and received all {globals.stars} stars.</span
					>
					<div class="flex">
						<button class="btn color-btn-game-secondary" on:click={refresh} data-sveltekit-reload
							>Play Again</button
						>
						<a class="btn color-btn-game-primary" href="/">More levels</a>
					</div>
				</div>
			</Modal>
		</div>
		<div class="sticky w-full top-0 body px-2 z-50">
			<div class="flex flex-wrap items-center justify-between max-w-none w-full p-2">
				<a class="flex items-center gap-2 no-underline hover:underline" href="/">
					<Logo radius={14} />
					<h1 class="flex items-center text-4xl xl:text-5xl font-bold">Planelooly</h1>
				</a>
				<!-- <div class="hidden md:block bg-black dark:bg-white rounded-sm h-1.5 w-6" /> -->
				<div class="flex items-center gap-2">
					<img
						src={level.image}
						alt=""
						class="h-10 w-10 lg:h-16 lg:w-16 xl:w-20 xl:h-20 flex items-center justify-center"
					/>
					<h2 class="text-2xl xl:text-3xl font-bold">
						{level.name}
						{typeof level.number == 'number' ? `(Level ${level.number})` : ``}
					</h2>
				</div>
				<!-- <div class="hidden md:block bg-black dark:bg-white rounded-sm h-1.5 w-6" /> -->
				<div class="flex items-center gap-2" title="tokens">
					<span class="hidden lg:block"
						><Image src="/ticket" spreadHeight={10} spreadWidth={10} height="100%" /></span
					>
					<span class="lg:hidden"
						><Image src="/ticket" spreadHeight={8} spreadWidth={8} height="100%" /></span
					>
					{#key i}
						<h3 class="text-2xl font-bold">{globals.tokens}</h3>
					{/key}
				</div>
				<Clock />
				<!-- <div class="hidden md:block bg-black dark:bg-white opacity-80 rounded-sm h-1.5 w-6" /> -->
				{#if lost}
					<h3 class="text-2xl font-bold">You lost with {globals.stars} stars.</h3>
				{:else if won}
					<h3 class="text-2xl font-bold">You won!</h3>
				{:else}
					<div class="flex items-center gap-2">
						{#if globals.increment}
							<button
								class="hidden lg:block text-2xl font-medium w-12 h-12 m-2 rounded hover:bg-stone-500 dark:hover:bg-zinc-500 dark:hover:bg-opacity-30 hover:bg-opacity-30"
								on:click={() => increaseSpeed()}
							>
								{globals.increment}x
							</button>
						{/if}
						<button class="text-4xl text-stone-800 dark:text-zinc-200" on:click={enterSettings}>
							<Image src="settings" spreadHeight={8} spreadWidth={8} height="100%" />
						</button>
						<div
							class="pl-2 w-10 flex items-center justify-center opacity-90 hover:opacity-80 text-4xl text-stone-800 dark:text-zinc-200"
						>
							{#if !globals.increment}
								<button on:click={playButton}>
									<Image src="play" spreadHeight={12} spreadWidth={12} height="100%" />
								</button>
							{:else}
								<button on:click={pauseButton}>
									<Image src="pause" spreadHeight={10} spreadWidth={10} height="100%" />
								</button>
							{/if}
						</div>
					</div>
				{/if}
			</div>
		</div>
		<div class="w-screen flex flex-col md:flex-row p-2 md:items-stretch">
			<div class="w-full md:w-[50%] lg:w-[35%] flex-grow-0">
				{#if $airports.length}<AirportModal bind:airportID />{/if}
			</div>
			<!-- </div> -->
			<div
				class="h-[calc(100vh - 100px)] flex-grow flex-shrink-0 flex flex-col-reverse md:flex-col"
			>
				<div class="w-full md:w-auto h-[34vh] min-w-[50%] overflow-y-scroll">
					<MainColumn bind:airportID {hideNotifications} />
				</div>
				<div class="h-[50vh] sticky bottom-2">
					<div
						class="w-[calc(100% - 2rem)] h-full border border-stone-400 dark:border-zinc-400 m-4 bg-stone-200 dark:bg-zinc-700 flex flex-col text-center rounded-lg"
					>
						{#key Number(dblClick) * 4 + Number(autoFire) * 2 + Number(volatilePinSize)}
							{#key pinSize}
								<MapModal bind:airportID {autoFire} {volatilePinSize} {dblClick} {pinSize} />
							{/key}
						{/key}
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>
