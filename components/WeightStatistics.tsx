import { useMemo } from 'react';

interface WeightStatisticsProps {
	weights: Array<{ weight: number; date: string; timestamp: number }>;
}

interface TimeRangeStats {
	change: number;
	minWeight: number;
	maxWeight: number;
	avgWeight: number;
	dataPoints: number;
}

function calculateStats(weights: Array<{ weight: number; date: string; timestamp: number }>): TimeRangeStats | null {
	if (weights.length === 0) return null;

	const currentWeight = weights[weights.length - 1]?.weight;
	const startWeight = weights[0]?.weight;
	const change = currentWeight - startWeight;
	const minWeight = Math.min(...weights.map((w) => w.weight));
	const maxWeight = Math.max(...weights.map((w) => w.weight));
	const avgWeight = weights.reduce((sum, w) => sum + w.weight, 0) / weights.length;

	return {
		change,
		minWeight,
		maxWeight,
		avgWeight,
		dataPoints: weights.length,
	};
}

export default function WeightStatistics({ weights }: WeightStatisticsProps) {
	// Calculate time ranges and stats using useMemo to avoid impure function calls during render
	const { stats7d, stats30d, stats1y } = useMemo(() => {
		const now = Date.now();
		const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
		const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
		const oneYearAgo = now - 365 * 24 * 60 * 60 * 1000;

		// Filter weights by time range
		const last7Days = weights.filter((w) => w.timestamp * 1000 >= sevenDaysAgo);
		const last30Days = weights.filter((w) => w.timestamp * 1000 >= thirtyDaysAgo);
		const lastYear = weights.filter((w) => w.timestamp * 1000 >= oneYearAgo);

		// Calculate stats for each range
		return {
			stats7d: calculateStats(last7Days),
			stats30d: calculateStats(last30Days),
			stats1y: calculateStats(lastYear),
		};
	}, [weights]);

	if (weights.length === 0) return null;

	const currentWeight = weights[weights.length - 1]?.weight;
	const previousWeight = weights.length > 1 ? weights[weights.length - 2]?.weight : null;
	const diffFromPrevious = previousWeight !== null ? currentWeight - previousWeight : null;

	const StatCard = ({
		label,
		stats,
		timeRange,
	}: {
		label: string;
		stats: TimeRangeStats | null;
		timeRange: string;
	}) => {
		if (!stats || stats.dataPoints === 0) return null;

		return (
			<div className="rounded-md border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-800/50">
				<div className="mb-2 flex items-center justify-between">
					<p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{label}</p>
					<p className="text-xs text-zinc-400 dark:text-zinc-500">{timeRange}</p>
				</div>
				<div className="space-y-1">
					<div className="flex items-baseline justify-between">
						<span className="text-xs text-zinc-500 dark:text-zinc-400">Change</span>
						<span
							className={`text-sm font-semibold ${stats.change > 0 ? 'text-orange-600 dark:text-orange-400' : stats.change < 0 ? 'text-green-600 dark:text-green-400' : 'text-zinc-600 dark:text-zinc-400'}`}
						>
							{stats.change > 0 ? '+' : ''}
							{stats.change.toFixed(1)} kg
						</span>
					</div>
					<div className="flex items-baseline justify-between">
						<span className="text-xs text-zinc-500 dark:text-zinc-400">Min / Max</span>
						<span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
							{stats.minWeight.toFixed(1)} / {stats.maxWeight.toFixed(1)}
							<span className="ml-1 text-xs text-zinc-400 dark:text-zinc-500">
								({(stats.maxWeight - stats.minWeight).toFixed(1)})
							</span>
						</span>
					</div>
					<div className="flex items-baseline justify-between">
						<span className="text-xs text-zinc-500 dark:text-zinc-400">Average</span>
						<span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
							{stats.avgWeight.toFixed(1)} kg
						</span>
					</div>
				</div>
			</div>
		);
	};

	return (
		<div className="mb-6 space-y-4">
			{/* Time Range Statistics */}
			<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
				<StatCard label="Last Year" stats={stats1y} timeRange={`${stats1y?.dataPoints || 0} points`} />
				<StatCard label="Last 30 Days" stats={stats30d} timeRange={`${stats30d?.dataPoints || 0} points`} />
				<StatCard label="Last 7 Days" stats={stats7d} timeRange={`${stats7d?.dataPoints || 0} points`} />

				{/* Current Weight - Prominent Display */}
				<div className="rounded-lg border-2 border-blue-200 bg-blue-50/50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
					<p className="mb-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">Current Weight</p>
					<div className="flex items-baseline gap-2">
						<p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{currentWeight.toFixed(1)} kg</p>
						{diffFromPrevious !== null && (
							<span
								className={`text-lg font-semibold ${diffFromPrevious > 0 ? 'text-orange-600 dark:text-orange-400' : diffFromPrevious < 0 ? 'text-green-600 dark:text-green-400' : 'text-zinc-600 dark:text-zinc-400'}`}
							>
								{diffFromPrevious > 0 ? '+' : ''}
								{diffFromPrevious.toFixed(1)}
							</span>
						)}
					</div>
					<p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
						Last measured: {new Date(weights[weights.length - 1].date).toLocaleDateString()}
					</p>
				</div>
			</div>
		</div>
	);
}
