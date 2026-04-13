import { get } from 'svelte/store';
import { airports, type airportType } from './airports';
import { IATAtoAirport } from './utils';
import { globals } from './compiler';
type cacheFormat = { order: string[]; sumTime: number };
type cacheType = { order: airportType[]; sumTime: number };
// Cache for storing pathfinding results
let cache: { [key: string]: cacheFormat } = {};
// Convert a returned cache to cacheFormat
function format(cacheType: cacheType): cacheFormat {
	let cacheFormat: cacheFormat = { order: [], sumTime: -cacheType.sumTime };
	cacheType.order.forEach((v) => {
		cacheFormat.order.push(v.IATA);
	});
	return cacheFormat;
}



// find path from cache or add to cache if necessary
export function findPath(airportA: airportType, airportB: airportType): cacheFormat {
	// Create a unique key for each pair of airports
	let key = `${airportA.IATA}-${airportB.IATA}`;

	// If the result is in the cache, return it
	if (cache[key]) {
		return cache[key];
	}

	// Otherwise, calculate the path
	let path = calculatePath(airportA, airportB);

	// Store the result in the cache
	cache[key] = format(path);

	return cache[key];
}
// Resets cache and initiates a rerun
export function resetCache() {
	// Delete cache
	cache = {};
	// Create airports list
	const validAirports = get(airports).filter((v)=>v.queryResult <= globals.day);
	validAirports.forEach((airportA: airportType) => {
		validAirports.forEach((airportB: airportType) => {
			if (airportA.IATA === airportB.IATA) return;
			findPath(airportA, airportB);
		});
	});
}

class MinPriorityQueue {
	heap = [];
	constructor() {
		this.heap = [];
	}

	// Insert an element with a given priority
	enqueue(
		element: { airport: airportType; time: any; order: any[] | undefined[] },
		priority: number
	) {
		this.heap.push({ element, priority });
		this.bubbleUp();
	}

	// Remove and return the element with the highest priority (lowest value)
	dequeue() {
		if (this.heap.length === 0) {
			return null;
		}
		const min = this.heap[0];
		const end = this.heap.pop();
		if (this.heap.length > 0) {
			this.heap[0] = end;
			this.bubbleDown();
		}
		return min;
	}

	// Check if the queue is empty
	isEmpty() {
		return this.heap.length === 0;
	}

	// Bubble up the last element to maintain the heap property
	bubbleUp() {
		let index = this.heap.length - 1;
		const element = this.heap[index];

		while (index > 0) {
			const parentIndex = Math.floor((index - 1) / 2);
			const parent = this.heap[parentIndex];

			if (element.priority >= parent.priority) {
				break;
			}

			this.heap[index] = parent;
			index = parentIndex;
		}
		this.heap[index] = element;
	}

	// Bubble down the root element to maintain the heap property
	bubbleDown() {
		let index = 0;
		const length = this.heap.length;
		const element = this.heap[0];

		while (true) {
			const leftChildIndex = 2 * index + 1;
			const rightChildIndex = 2 * index + 2;
			let leftChild: { priority: number }, rightChild: { priority: number };
			let swap = null;

			if (leftChildIndex < length) {
				leftChild = this.heap[leftChildIndex];
				if (leftChild.priority < element.priority) {
					swap = leftChildIndex;
				}
			}

			if (rightChildIndex < length) {
				rightChild = this.heap[rightChildIndex];
				if (
					(swap === null && rightChild.priority < element.priority) ||
					(swap !== null && rightChild.priority < leftChild.priority)
				) {
					swap = rightChildIndex;
				}
			}

			if (swap === null) {
				break;
			}

			this.heap[index] = this.heap[swap];
			index = swap;
		}
		this.heap[index] = element;
	}
}

function calculatePath(airportA: airportType, airportB: airportType): cacheType {
	try {
		if (!airportA.gates.length) {
			return { order: [], sumTime: -1 };
		}

		let queue = new MinPriorityQueue(); // Use a priority queue
		queue.enqueue({ airport: airportA, time: 0, order: [] }, 0);
		let visited = new Map(); // Store the shortest time to each airport

		while (!queue.isEmpty()) {
			let { airport, time, order } = queue.dequeue().element;

			// We made it!
			if (airport.IATA === airportB.IATA) {
				return { order: [...order, airportB], sumTime: time};
			}

			// Use better route if possible
			if (visited.has(airport.IATA) && visited.get(airport.IATA) <= time) {
				continue; // Skip if we have already found a better path
			}
			visited.set(airport.IATA, time);

			for (let gate of airport.gates) {
				let nextAirport = IATAtoAirport(gate.IATA);
				let newTime = time + gate.speed;
				let newOrder = [...order, airport];

				if (!visited.has(gate.IATA) || newTime < visited.get(gate.IATA)) {
					queue.enqueue({ airport: nextAirport, time: newTime, order: newOrder }, newTime);
				}
			}
		}

		return { order: [], sumTime: -1 };
	} catch (err) {
		console.error(err);
		return { order: [], sumTime: -1 };
	}
}
