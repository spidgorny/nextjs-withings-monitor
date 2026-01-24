import useSWR from 'swr';

interface WeightData {
	date: string;
	weight: number;
	timestamp: number;
}

interface WithingsData {
	weights: WeightData[];
	lastModified: string | null;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

/**
 * Custom hook to fetch Withings weight data for a specific user
 */
export function useWithings(userid: string) {
	const { data, error, isLoading, mutate } = useSWR<WithingsData>(
		userid ? `/api/weights?userid=${userid}` : null,
		fetcher,
		{
			refreshInterval: 0, // Don't auto-refresh since data is static
			revalidateOnFocus: false,
		}
	);

	const fetchCurrentMonth = async () => {
		try {
			const response = await fetch('/api/fetch-month', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					userid,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to fetch data');
			}

			// Revalidate SWR cache to get the updated data
			await mutate();
		} catch (err) {
			throw err;
		}
	};

	return {
		weights: data?.weights || [],
		lastModified: data?.lastModified || null,
		isLoading,
		isError: error,
		mutate,
		fetchCurrentMonth,
	};
}
