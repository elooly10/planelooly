import { IATAtoHSL } from '$lib/utils';
export function drawBarChart(
	data: any[],
	chart: HTMLCanvasElement,
	downloadURL: HTMLAnchorElement
) {
	if (!chart) return false;
	function drawRoundedRect(
		canvas: CanvasRenderingContext2D,
		x: number,
		y: number,
		width: any,
		height: any,
		radius: number
	) {
		canvas.beginPath();
		canvas.moveTo(x + radius, y);
		canvas.lineTo(x + width - radius, y);
		canvas.quadraticCurveTo(x + width, y, x + width, y + radius);
		canvas.lineTo(x + width, y + height);
		canvas.lineTo(x, y + height);
		canvas.lineTo(x, y + radius);
		canvas.quadraticCurveTo(x, y, x + radius, y);
		canvas.closePath();
		canvas.fill();
	}
	if (!chart.getContext) return false;
	const canvas = chart.getContext('2d');
	const chartHeight = chart.height;
	const chartWidth = chart.width;

	// Clear the canvas
	canvas.clearRect(0, 0, chartWidth, chartHeight);
	data.sort((a, b) => b.value - a.value);
	if (data[data.length - 2]?.value * 100 <= 0.1) {
		const other = {
			label: 'Other',
			value: 0
		};
		data.forEach((item) => {
			if (item.value < 0.001) other.value += item.value;
		});
		data = data.filter((v) => (v.value < 0.001 ? false : true));
		data.push(other);
	}
	if (data.length > 9) {
		const other = {
			label: 'Other',
			sublabel: [],
			value: 0
		};
		data.forEach((item, index) => {
			if (index >= 8) {
				other.value += item.value;
				other.sublabel.push(`${item.label} – ${Math.round(item.value * 1000) / 10}%`);
			}
		});
		other.sublabel = other.sublabel[0];
		data = data.filter((v, i) => (i >= 8 ? false : true));
		data.push(other);
	}
	const maxValue = Math.max(...data.map((item) => item.value)) > 0.5 ? 1 : 0.5;
	const barWidth = chartWidth / data.length;
	// Draw the bars
	data.forEach((item: { value: number; label: string; sublabel: string }, index: number) => {
		const barHeight = (item.value / maxValue) * (chartHeight - 10); // Leave space for the bottom line
		const x = index * barWidth;
		const y = chartHeight - barHeight;

		// Draw the bar
		let color = IATAtoHSL(item.label);
		canvas.fillStyle = `hsl(${color[0]}deg, ${color[1]}%, ${color[2]}%)`;
		drawRoundedRect(
			canvas,
			x,
			y,
			barWidth - (index == data.length - 1 ? 0 : chartHeight / 10),
			barHeight,
			chartHeight / 30
		);

		// Draw the label
		canvas.font = `${chartHeight / 22}pt Helvetica`;
		canvas.fillStyle = 'black';
		canvas.textAlign = 'center';
		canvas.fillText(
			item.label,
			x + barWidth / 2 - (index == data.length - 1 ? 0 : chartHeight / 20),
			chartHeight - (item.sublabel && data.length <= 6 ? chartHeight / 13 : chartHeight / 30)
		); // Label
		if (data.length > 8) canvas.font = `${chartHeight / 32}pt Helvetica`;
		canvas.fillText(
			`${Math.round(item.value * 1000) / 10}%`,
			x + barWidth / 2 - (index == data.length - 1 ? 0 : chartHeight / 20),
			data.length > 5 ? chartHeight / 15 : chartHeight / 10
		); // Value
		canvas.font = `${chartHeight / 40}pt Helvetica`;
		if (item.sublabel && data.length <= 6)
			canvas.fillText(
				item.sublabel,
				x + barWidth / 2 - (index == data.length - 1 ? 0 : chartHeight / 20),
				chartHeight - chartHeight / 30
			); // Sublabel
	});

	// Draw the bottom line
	canvas.beginPath();
	canvas.moveTo(0, chartHeight);
	canvas.lineTo(chartWidth, chartHeight);
	canvas.strokeStyle = 'black';
	canvas.stroke();
	downloadURL.href = chart.toDataURL('PNG');
}
export function drawPieChart(
	data: any[],
	chart: HTMLCanvasElement,
	downloadURL: HTMLAnchorElement
) {
	if (!chart.getContext) return false;
	const canvas = chart.getContext('2d');
	const chartHeight = chart.height;
	const chartWidth = chart.width;

	// Clear the canvas
	canvas.clearRect(0, 0, chartWidth, chartHeight);
	// Prep Data
	data.sort((a, b) => b.value - a.value);
	if (data[data.length - 2]?.value * 100 <= 0.1) {
		const other = {
			label: 'Other',
			value: 0
		};
		data.forEach((item) => {
			if (item.value < 0.001) other.value += item.value;
		});
		data = data.filter((v) => (v.value < 0.001 ? false : true));
		data.push(other);
	}
	// Draw the bars
	let lastArcEnd = 0;
	function getText(radius: number, center: [number, number], angle: number): [number, number] {
		const x = center[0] + radius * Math.cos(angle);
		const y = center[1] + radius * Math.sin(angle);
		return [x, y];
	}
	data.forEach((item: { value: number; label: string; sublabel: string }, index: number) => {
		const center: [number, number] = [chartWidth / 2, chartHeight / 2];

		// Draw the slice
		const color = IATAtoHSL(item.label);
		const currentArcEnd = lastArcEnd + item.value * 2 * Math.PI;
		const ArcCenter = (currentArcEnd - lastArcEnd) / 2 + lastArcEnd;
		//console.log(currentArcEnd)
		canvas.beginPath();
		canvas.fillStyle = `hsl(${color[0]}deg, ${color[1]}%, ${color[2]}%)`;
		canvas.moveTo(...center);
		canvas.arc(center[0], center[1], Math.min(chartWidth, chartHeight) / 3, lastArcEnd, ArcCenter);
		canvas.arc(
			center[0],
			center[1],
			Math.min(chartWidth, chartHeight) / 3,
			ArcCenter,
			currentArcEnd
		);
		canvas.fill();
		canvas.closePath();
		canvas.font = `${item.value > 0.05 ? chartWidth / 45 : chartWidth / 60}px Arial`;
		if (item.value > 0.03) {
			canvas.fillStyle = '#000';
			const location = getText(Math.min(chartWidth, chartHeight) / 2.4, center, ArcCenter);
			canvas.fillText(item.label, location[0], location[1]);
			if (item.value > 0.05) {
				canvas.font = `${chartWidth / 75}px Arial`;
				canvas.fillText(
					Math.round(item.value * 100) + '%',
					location[0],
					location[1] + chartHeight / 20
				);
			}
		}
		lastArcEnd = currentArcEnd;
	});

	// Draw the bottom line
	canvas.beginPath();
	canvas.moveTo(0, chartHeight);
	canvas.lineTo(chartWidth, chartHeight);
	canvas.strokeStyle = 'black';
	canvas.stroke();
	downloadURL.href = chart.toDataURL('PNG');
}
export function drawHistogram(data: number[], buckets: number[], chart: HTMLCanvasElement) {
	if (!chart) return false;
	if (!chart.getContext) return false;
	const canvas = chart.getContext('2d');
	const chartHeight = chart.height;
	const chartWidth = chart.width;
	let barsObj: {
		[x: string]: {
			minBucket: number;
			maxBucket: number;
			count: number;
		};
	} = {};
	//console.log(canvas, data);
	data.sort((a, b) => b - a);
	data.forEach((data) => {
		// buckets: [0, 5, 10]
		let bucket = buckets.reduce((wideRegion, narrowRegion) => {
			if (data > narrowRegion) return narrowRegion;
			return wideRegion;
		}, -Infinity);
		if (barsObj[bucket]) barsObj[bucket].count++;
		else {
			barsObj[bucket] = {
				minBucket: bucket,
				maxBucket: buckets[buckets.indexOf(bucket) + 1],
				count: 1
			};
		}
	});
	let bars = Object.values(barsObj).sort((a, b) => b.minBucket - a.minBucket);
	// Clear the canvas
	canvas.clearRect(0, 0, chartWidth, chartHeight);
	const maxValue = Math.max(...bars.map((v) => v.count));
	const barWidth = chartWidth / bars.length;
	// Draw the bars
	bars.forEach((item, index) => {
		const barHeight = (item.count / maxValue) * (chartHeight - 10); // Leave space for the bottom line
		const x = index * barWidth;
		const y = chartHeight - barHeight;

		// Draw the bar
		canvas.fillStyle = `hsl(${(index / (bars.length + 1)) * 360}deg, 80%, ${Math.round(
			(item.count / maxValue) * 40 + 40
		)}%)`;
		canvas.fillRect(x, y, barWidth, (barHeight / maxValue) * chartHeight);

		// Draw the label
		canvas.font = `${chartHeight / 22}pt Helvetica`;
		canvas.fillStyle = 'black';
		canvas.textAlign = 'left';
		if (item.maxBucket) canvas.fillText('' + item.maxBucket, x + barWidth * 0.1, chartHeight); // Label
		canvas.textAlign = 'right';
		if (item.minBucket) canvas.fillText('' + item.minBucket, x + barWidth * 0.9, chartHeight); // Label
		if (bars.length > 8) canvas.font = `${chartHeight / 32}pt Helvetica`;
		canvas.textAlign = 'center';
		canvas.fillText(
			'' + item.count,
			x + barWidth / 2,
			data.length > 5 ? chartHeight / 15 : chartHeight / 10
		); // Value
	});

	// Draw the bottom line
	canvas.beginPath();
	canvas.moveTo(0, chartHeight);
	canvas.lineTo(chartWidth, chartHeight);
	canvas.strokeStyle = 'black';
	canvas.stroke();
}
