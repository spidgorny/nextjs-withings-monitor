'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import WeightChart from '@/components/WeightChart';
import Navbar from '@/components/Navbar';

// Force dynamic rendering to avoid SSR issues with localStorage
export const dynamic = 'force-dynamic';

interface User {
	userid: string;
	username: string;
}

interface UserWithAlias extends User {
	alias?: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function HomeContent() {
	const searchParams = useSearchParams();
	const [currentUserid, setCurrentUserid] = useState<string | null>(null);
	const [currentUser, setCurrentUser] = useState<UserWithAlias | null>(null);
	const [measurements, setMeasurements] = useState<any>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Fetch users from API using SWR
	const {
		data: usersData,
		error: usersError,
		mutate: mutateUsers,
	} = useSWR<{ users: User[] }>('/api/users', fetcher, {
		revalidateOnFocus: true,
		revalidateOnReconnect: true,
	});

	// Get user aliases from localStorage
	const getUserAliases = (): Record<string, string> => {
		const stored = localStorage.getItem('withings_user_aliases');
		return stored ? JSON.parse(stored) : {};
	};

	// Save user alias to localStorage
	const saveUserAlias = (userid: string, alias: string) => {
		const aliases = getUserAliases();
		aliases[userid] = alias;
		localStorage.setItem('withings_user_aliases', JSON.stringify(aliases));
	};

	// Get users with aliases
	const getUsersWithAliases = (): UserWithAlias[] => {
		if (!usersData?.users) return [];
		const aliases = getUserAliases();
		return usersData.users.map((user) => ({
			...user,
			alias: aliases[user.userid] || user.username,
		}));
	};

	// Switch to a specific user
	const switchToUser = (userid: string) => {
		const users = getUsersWithAliases();
		const user = users.find((u) => u.userid === userid);
		if (user) {
			setCurrentUserid(userid);
			setCurrentUser(user);
			localStorage.setItem('withings_current_userid', userid);
			setMeasurements(null); // Clear measurements when switching
		}
	};

	useEffect(() => {
		// Wait for users data to load
		if (!usersData?.users) return;

		const users = getUsersWithAliases();

		// Check if we got tokens from the callback
		if (searchParams.get('success') === 'true') {
			const userid = searchParams.get('userid') || undefined;
			const username = searchParams.get('username') || undefined;

			if (userid) {
				// Refresh users list from server
				mutateUsers();

				// Check if user already has an alias
				const aliases = getUserAliases();
				let alias = aliases[userid];

				// Prompt for alias only if it's a new user (no alias set)
				if (!alias && username) {
					const promptResult = prompt(`Enter an alias for user "${username}" (e.g., "John", "Mom", etc.):`);
					alias = promptResult || username;
					saveUserAlias(userid, alias);
				}

				// Set as current user
				setCurrentUserid(userid);
				const user = users.find((u) => u.userid === userid);
				if (user) {
					setCurrentUser({ ...user, alias: alias || user.username });
				}
				localStorage.setItem('withings_current_userid', userid);
			}
		} else if (searchParams.get('error')) {
			setError(searchParams.get('error') || 'Unknown error');
		} else {
			// Try to load the last active user
			const lastUserid = localStorage.getItem('withings_current_userid');
			if (lastUserid && users.length > 0) {
				const user = users.find((u) => u.userid === lastUserid);
				if (user) {
					setCurrentUserid(lastUserid);
					setCurrentUser(user);
				} else if (users.length > 0) {
					// Fallback to first user if last user not found
					setCurrentUserid(users[0].userid);
					setCurrentUser(users[0]);
				}
			} else if (users.length > 0) {
				// No last user, use first available
				setCurrentUserid(users[0].userid);
				setCurrentUser(users[0]);
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchParams, usersData]);

	const handleConnect = () => {
		window.location.href = '/api/auth/withings';
	};

	const handleGetMeasurements = async () => {
		if (!currentUserid) return;

		setLoading(true);
		setError(null);

		try {
			const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
			const now = Math.floor(Date.now() / 1000);

			const response = await fetch(
				`/api/measurements?userid=${currentUserid}&startdate=${thirtyDaysAgo}&enddate=${now}`
			);

			if (!response.ok) {
				throw new Error('Failed to fetch measurements');
			}

			const data = await response.json();
			setMeasurements(data);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to fetch measurements');
		} finally {
			setLoading(false);
		}
	};

	const handleDisconnect = async () => {
		if (!currentUserid) return;

		// Note: We don't actually remove the user from .env.json here
		// Just remove their alias and clear current selection
		const aliases = getUserAliases();
		delete aliases[currentUserid];
		localStorage.setItem('withings_user_aliases', JSON.stringify(aliases));

		const users = getUsersWithAliases();

		// Switch to another user if available, otherwise clear
		const otherUsers = users.filter((u) => u.userid !== currentUserid);
		if (otherUsers.length > 0) {
			switchToUser(otherUsers[0].userid);
		} else {
			setCurrentUserid(null);
			setCurrentUser(null);
			setMeasurements(null);
			localStorage.removeItem('withings_current_userid');
		}

		// Refresh users list
		mutateUsers();

		window.history.replaceState({}, '', '/');
	};

	const handleAddUser = () => {
		window.location.href = '/api/auth/withings';
	};

	return (
		<div className="min-h-screen bg-zinc-50 p-8 font-sans dark:bg-black">
			<main className="w-full">
				<div className="rounded-lg bg-white p-8 shadow-sm dark:bg-zinc-900">
					<Navbar currentUserid={currentUserid || undefined} onUserChange={switchToUser} onAddUser={handleAddUser} />

					{error && (
						<div className="mb-4 rounded-md bg-red-50 p-4 dark:bg-red-900/20">
							<p className="text-sm text-red-800 dark:text-red-400">Error: {error}</p>
						</div>
					)}

					{usersError && (
						<div className="mb-4 rounded-md bg-red-50 p-4 dark:bg-red-900/20">
							<p className="text-sm text-red-800 dark:text-red-400">Error loading users: {usersError.message}</p>
						</div>
					)}

					{!usersData ? (
						<div className="flex items-center gap-2">
							<div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-blue-600 dark:border-zinc-600 dark:border-t-blue-400"></div>
							<p className="text-zinc-500 dark:text-zinc-400">Loading users...</p>
						</div>
					) : !currentUser ? (
						<div className="space-y-4">
							<p className="text-zinc-600 dark:text-zinc-400">
								Connect your Withings account to view your health data.
							</p>
							<button
								onClick={handleConnect}
								className="rounded-md bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700"
							>
								Connect Withings Account
							</button>
						</div>
					) : (
						<div className="space-y-6">
							{/* Weight Chart */}
							{currentUser.userid && <WeightChart userid={currentUser.userid} />}

							<div className="space-y-3">
								<div className="flex gap-3">
									<button
										onClick={handleGetMeasurements}
										disabled={loading}
										className="rounded-md bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
									>
										{loading ? 'Loading...' : 'Get Measurements'}
									</button>
									<button
										onClick={handleDisconnect}
										className="rounded-md border border-zinc-300 px-6 py-3 text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
									>
										Disconnect
									</button>
								</div>

								<details className="rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
									<summary className="cursor-pointer font-medium text-zinc-900 dark:text-zinc-50">
										View User Info
									</summary>
									<pre className="mt-2 overflow-x-auto text-xs text-zinc-600 dark:text-zinc-400">
										{JSON.stringify(currentUser, null, 2)}
									</pre>
								</details>
							</div>

							{measurements && (
								<div className="rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
									<h2 className="mb-3 font-semibold text-zinc-900 dark:text-zinc-50">Measurements</h2>
									<pre className="overflow-x-auto text-xs text-zinc-600 dark:text-zinc-400">
										{JSON.stringify(measurements, null, 2)}
									</pre>
								</div>
							)}
						</div>
					)}
				</div>
			</main>
		</div>
	);
}

export default function Home() {
	return (
		<Suspense
			fallback={
				<div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
					<div className="text-zinc-600 dark:text-zinc-400">Loading...</div>
				</div>
			}
		>
			<HomeContent />
		</Suspense>
	);
}
