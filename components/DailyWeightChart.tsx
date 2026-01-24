'use client';

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface WeightData {
	date: string;
	weight: number;
}

interface DailyWeightChartProps {
	weights: WeightData[];
}

export default function DailyWeightChart({ weights }: DailyWeightChartProps) {
	if (weights.length === 0) return null;

	// Format data for the chart
	const chartData = weights.map((w) => ({
		date: new Date(w.date).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: weights.length > 90 ? 'numeric' : undefined, // Show year if more than 3 months of data
		}),
		weight: w.weight,
	}));

	return (
		<div>
			<h3 className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">Daily Weight Measurements</h3>
			<ResponsiveContainer width="100%" height={300}>
				<LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
					<CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
					<XAxis
						dataKey="date"
						className="text-xs text-zinc-600 dark:text-zinc-400"
						tick={{ fill: 'currentColor' }}
						angle={-45}
						textAnchor="end"
						height={60}
						interval={Math.floor(chartData.length / 10) || 0} // Show ~10 labels
					/>
					<YAxis
						domain={['dataMin - 2', 'dataMax + 2']}
						className="text-xs text-zinc-600 dark:text-zinc-400"
						tick={{ fill: 'currentColor' }}
						label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft', style: { fill: 'currentColor' } }}
					/>
					<Tooltip
						contentStyle={{
							backgroundColor: 'var(--tooltip-bg, white)',
							border: '1px solid var(--tooltip-border, #e4e4e7)',
							borderRadius: '0.375rem',
							fontSize: '0.875rem',
						}}
						labelStyle={{ color: 'var(--tooltip-text, #18181b)' }}
					/>
					<Legend />
					<Line
						type="monotone"
						dataKey="weight"
						stroke="#3b82f6"
						strokeWidth={2}
						dot={{ fill: '#3b82f6', r: 3 }}
						activeDot={{ r: 5 }}
						name="Weight (kg)"
					/>
				</LineChart>
			</ResponsiveContainer>

			<p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
				Showing {weights.length} measurements from {new Date(weights[0].date).toLocaleDateString()} to{' '}
				{new Date(weights[weights.length - 1].date).toLocaleDateString()}
			</p>
		</div>
	);
}
