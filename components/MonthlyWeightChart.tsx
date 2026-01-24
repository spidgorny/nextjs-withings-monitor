'use client';

import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface WeightData {
	date: string;
	weight: number;
}

interface MonthlyWeightChartProps {
	weights: WeightData[];
}

export default function MonthlyWeightChart({ weights }: MonthlyWeightChartProps) {
	if (weights.length === 0) return null;

	// Calculate monthly averages
	const monthlyData: { [key: string]: { sum: number; count: number; month: string } } = {};
	weights.forEach((w) => {
		const date = new Date(w.date);
		const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
		const monthLabel = date.toLocaleDateString('en-US', {
			month: 'short',
			year: 'numeric',
		});

		if (!monthlyData[monthKey]) {
			monthlyData[monthKey] = { sum: 0, count: 0, month: monthLabel };
		}
		monthlyData[monthKey].sum += w.weight;
		monthlyData[monthKey].count += 1;
	});

	const monthlyChartData = Object.keys(monthlyData)
		.sort()
		.map((key) => ({
			month: monthlyData[key].month,
			avgWeight: monthlyData[key].sum / monthlyData[key].count,
		}));

	return (
		<div className="mb-6">
			<h3 className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">Average Weight per Month</h3>
			<ResponsiveContainer width="100%" height={200}>
				<BarChart data={monthlyChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
					<CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
					<XAxis
						dataKey="month"
						className="text-xs text-zinc-600 dark:text-zinc-400"
						tick={{ fill: 'currentColor' }}
						angle={-45}
						textAnchor="end"
						height={60}
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
						formatter={(value: unknown) => [`${typeof value === 'number' ? value.toFixed(1) : value} kg`, 'Avg Weight']}
					/>
					<Bar dataKey="avgWeight" fill="#10b981" name="Avg Weight (kg)" radius={[4, 4, 0, 0]}>
						<LabelList
							dataKey="avgWeight"
							position="top"
							formatter={(value: unknown) => (typeof value === 'number' ? value.toFixed(1) : '')}
							style={{ fontSize: '12px', fill: 'currentColor' }}
							className="text-zinc-700 dark:text-zinc-300"
						/>
					</Bar>
				</BarChart>
			</ResponsiveContainer>
		</div>
	);
}
