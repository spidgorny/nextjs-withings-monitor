'use client';

import useSWR from 'swr';
import WeightStatistics from './WeightStatistics';
import MonthlyWeightChart from './MonthlyWeightChart';
import DailyWeightChart from './DailyWeightChart';

interface WeightData {
	date: string;
	weight: number;
	timestamp: number;
}

interface WeightChartProps {
	userid: string;
	isFetching?: boolean;
	fetchError?: string | null;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function WeightChart({ userid, isFetching = false, fetchError = null }: WeightChartProps) {
	const { data, error, isLoading } = useSWR<{ weights: WeightData[]; lastModified: string | null }>(
		`/api/weights?userid=${userid}`,
		fetcher,
		{
			refreshInterval: 0, // Don't auto-refresh since data is static
			revalidateOnFocus: false,
		}
	);

	if (isLoading) {
		return (
			<div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
				<h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">Weight History</h2>
				<div className="flex h-64 items-center justify-center">
					<div className="flex items-center gap-2">
						<div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-blue-600 dark:border-zinc-600 dark:border-t-blue-400"></div>
						<p className="text-zinc-500 dark:text-zinc-400">Loading weight data...</p>
					</div>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-900/20">
				<h2 className="mb-4 text-xl font-semibold text-red-900 dark:text-red-400">Weight History</h2>
				<p className="text-sm text-red-800 dark:text-red-400">
					Error loading weight data: {error.message || 'Unknown error'}
				</p>
			</div>
		);
	}

	const weights = data?.weights || [];
	const lastModified = data?.lastModified;

	if (weights.length === 0) {
		return (
			<div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
				<h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">Weight History</h2>
				<div className="space-y-4">
					<p className="text-zinc-500 dark:text-zinc-400">
						No weight data available. Use the &quot;Fetch Current Month&quot; button in the navigation bar to fetch
						data, or run{' '}
						<code className="rounded bg-zinc-100 px-1 py-0.5 text-sm dark:bg-zinc-800">npm run fetch-year</code> to
						download historical data.
					</p>
					{fetchError && <p className="text-sm text-red-600 dark:text-red-400">Error: {fetchError}</p>}
				</div>
			</div>
		);
	}

	return (
		<div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
			<div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Weight History</h2>
				{lastModified && (
					<p className="text-xs text-zinc-500 dark:text-zinc-400">
						Last updated: {new Date(lastModified).toLocaleString()}
					</p>
				)}
			</div>

			{fetchError && (
				<div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-900/50 dark:bg-red-900/20">
					<p className="text-sm text-red-800 dark:text-red-400">Error: {fetchError}</p>
				</div>
			)}

			{/* Statistics */}
			<WeightStatistics weights={weights} />

			{/* Monthly Average Bar Chart */}
			<MonthlyWeightChart weights={weights} />

			{/* Daily Weight Line Chart */}
			<DailyWeightChart weights={weights} />
		</div>
	);
}
