'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface WeightData {
  date: string;
  weight: number;
  timestamp: number;
}

interface WeightChartProps {
  userid: string;
  accessToken?: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function WeightChart({ userid, accessToken }: WeightChartProps) {
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const { data, error, isLoading, mutate } = useSWR<{ weights: WeightData[], lastModified: string | null }>(
    `/api/weights?userid=${userid}`,
    fetcher,
    {
      refreshInterval: 0, // Don't auto-refresh since data is static
      revalidateOnFocus: false,
    }
  );

  const handleFetchCurrentMonth = async () => {
    if (!accessToken) {
      setFetchError('No access token available. Please reconnect your Withings account.');
      return;
    }

    setIsFetching(true);
    setFetchError(null);

    try {
      const response = await fetch('/api/fetch-month', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userid,
          access_token: accessToken,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch data');
      }

      // Revalidate SWR cache to get the updated data
      await mutate();
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsFetching(false);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Weight History
        </h2>
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
        <h2 className="mb-4 text-xl font-semibold text-red-900 dark:text-red-400">
          Weight History
        </h2>
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
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Weight History
          </h2>
        </div>
        <div className="space-y-4">
          <p className="text-zinc-500 dark:text-zinc-400">
            No weight data available. Click the button below to fetch the current month&apos;s data or run <code className="rounded bg-zinc-100 px-1 py-0.5 text-sm dark:bg-zinc-800">npm run fetch-year</code> to download historical data.
          </p>
          {accessToken && (
            <button
              onClick={handleFetchCurrentMonth}
              disabled={isFetching}
              className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              {isFetching && (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              )}
              {isFetching ? 'Fetching...' : 'Fetch Current Month'}
            </button>
          )}
          {fetchError && (
            <p className="text-sm text-red-600 dark:text-red-400">
              Error: {fetchError}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Format data for the chart
  const chartData = weights.map((w) => ({
    date: new Date(w.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: weights.length > 90 ? 'numeric' : undefined, // Show year if more than 3 months of data
    }),
    weight: w.weight,
  }));

  // Calculate statistics
  const currentWeight = weights[weights.length - 1]?.weight;
  const startWeight = weights[0]?.weight;
  const weightChange = currentWeight - startWeight;
  const minWeight = Math.min(...weights.map((w) => w.weight));
  const maxWeight = Math.max(...weights.map((w) => w.weight));
  const avgWeight = weights.reduce((sum, w) => sum + w.weight, 0) / weights.length;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Weight History
        </h2>
        <div className="flex flex-col gap-2 sm:items-end">
          {accessToken && (
            <button
              onClick={handleFetchCurrentMonth}
              disabled={isFetching}
              className="flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              {isFetching && (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              )}
              {isFetching ? 'Fetching...' : 'Fetch Current Month'}
            </button>
          )}
          {lastModified && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Last updated: {new Date(lastModified).toLocaleString()}
            </p>
          )}
        </div>
      </div>

      {fetchError && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-900/50 dark:bg-red-900/20">
          <p className="text-sm text-red-800 dark:text-red-400">
            Error: {fetchError}
          </p>
        </div>
      )}

      {/* Statistics */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-md bg-zinc-50 p-3 dark:bg-zinc-800/50">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Current</p>
          <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {currentWeight.toFixed(1)} kg
          </p>
        </div>
        <div className="rounded-md bg-zinc-50 p-3 dark:bg-zinc-800/50">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Change</p>
          <p className={`text-lg font-semibold ${weightChange > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`}>
            {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} kg
          </p>
        </div>
        <div className="rounded-md bg-zinc-50 p-3 dark:bg-zinc-800/50">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Min / Max</p>
          <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {minWeight.toFixed(1)} / {maxWeight.toFixed(1)}
          </p>
        </div>
        <div className="rounded-md bg-zinc-50 p-3 dark:bg-zinc-800/50">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Average</p>
          <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {avgWeight.toFixed(1)} kg
          </p>
        </div>
      </div>

      {/* Chart */}
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
        Showing {weights.length} measurements from {new Date(weights[0].date).toLocaleDateString()} to {new Date(weights[weights.length - 1].date).toLocaleDateString()}
      </p>
    </div>
  );
}

