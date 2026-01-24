'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUsers } from '@/hooks/useUsers';

// Force dynamic rendering to avoid SSR issues with localStorage
export const dynamic = 'force-dynamic';

function HomeContent() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const [error, setError] = useState<string | null>(null);

	// Use custom hook for users
	const { usersWithAliases, isLoading, isError, mutate, saveUserAlias, getUserAlias } = useUsers();

	useEffect(() => {
		// Handle OAuth callback
		if (searchParams.get('success') === 'true') {
			const userid = searchParams.get('userid');
			const username = searchParams.get('username');

			if (userid && username) {
				// Refresh users list from server
				mutate();

				// Check if user already has an alias
				let alias = getUserAlias(userid);

				// Prompt for alias only if it's a new user (no alias set)
				if (!alias || alias === userid) {
					const promptResult = prompt(`Enter an alias for user "${username}" (e.g., "John", "Mom", etc.):`);
					alias = promptResult || username;
					saveUserAlias(userid, alias);
				}

				// Redirect to user page
				router.push(`/user/${userid}`);
			}
		} else if (searchParams.get('error')) {
			setError(searchParams.get('error') || 'Unknown error');
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchParams]);

	const handleConnect = () => {
		window.location.href = '/api/auth/withings';
	};

	const handleUserClick = (userid: string) => {
		router.push(`/user/${userid}`);
	};

	// Format seconds into human-readable time
	const formatTimeRemaining = (seconds: number | undefined): string => {
		if (seconds === undefined) return 'Unknown';
		if (seconds <= 0) return 'Expired';

		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const secs = seconds % 60;

		if (hours > 0) {
			return `${hours}h ${minutes}m`;
		} else if (minutes > 0) {
			return `${minutes}m ${secs}s`;
		} else {
			return `${secs}s`;
		}
	};

	return (
		<div className="min-h-screen bg-zinc-50 p-4 font-sans dark:bg-black">
			<main className="mx-auto max-w-7xl">
				<div className="rounded-lg bg-white p-6 shadow-sm dark:bg-zinc-900">
					<h1 className="mb-6 text-3xl font-bold text-zinc-900 dark:text-zinc-50">Withings Health Monitor</h1>

					{error && (
						<div className="mb-4 rounded-md bg-red-50 p-4 dark:bg-red-900/20">
							<p className="text-sm text-red-800 dark:text-red-400">Error: {error}</p>
						</div>
					)}

					{isError && (
						<div className="mb-4 rounded-md bg-red-50 p-4 dark:bg-red-900/20">
							<p className="text-sm text-red-800 dark:text-red-400">Error loading users: {isError.message}</p>
						</div>
					)}

					{isLoading ? (
						<div className="flex items-center gap-2">
							<div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-blue-600 dark:border-zinc-600 dark:border-t-blue-400"></div>
							<p className="text-zinc-500 dark:text-zinc-400">Loading users...</p>
						</div>
					) : usersWithAliases.length === 0 ? (
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
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Your Accounts</h2>
									<button
										onClick={handleConnect}
										className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
									>
										<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
										</svg>
										Add Another Account
									</button>
								</div>

								<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
									{usersWithAliases.map((user) => (
										<button
											key={user.userid}
											onClick={() => handleUserClick(user.userid)}
											className="group relative flex flex-col items-start gap-3 rounded-lg border border-zinc-200 bg-white p-6 text-left transition-all hover:border-blue-500 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-400"
										>
											<div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
												<svg
													className="h-6 w-6 text-blue-600 dark:text-blue-400"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
													/>
												</svg>
											</div>
											<div className="flex-1">
												<h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{user.alias}</h3>
												<p className="text-sm text-zinc-500 dark:text-zinc-400">@{user.username}</p>
												{user.expiresInSeconds !== undefined && (
													<div className="mt-2 flex items-center gap-1">
														<svg
															className={`h-3 w-3 ${user.tokenExpired ? 'text-red-500' : 'text-green-500'}`}
															fill="currentColor"
															viewBox="0 0 20 20"
														>
															<path
																fillRule="evenodd"
																d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
																clipRule="evenodd"
															/>
														</svg>
														<span
															className={`text-xs ${user.tokenExpired ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}
														>
															{user.tokenExpired
																? 'Token expired'
																: `Expires in ${formatTimeRemaining(user.expiresInSeconds)}`}
														</span>
													</div>
												)}
											</div>
											<div className="flex items-center gap-2 text-sm font-medium text-blue-600 transition-colors group-hover:text-blue-700 dark:text-blue-400 dark:group-hover:text-blue-300">
												View Dashboard
												<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
												</svg>
											</div>
										</button>
									))}
								</div>
							</div>
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
