'use client';

import { Suspense, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import WeightChart from '@/components/WeightChart';
import Navbar from '@/components/Navbar';
import { useUsers } from '@/hooks/useUsers';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

function UserPageContent() {
	const params = useParams();
	const router = useRouter();
	const userid = params.userid as string;

	const [measurements, setMeasurements] = useState<any>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Use custom hook for users
	const { findUser, getUserAlias, isLoading: usersLoading, isError: usersError } = useUsers();

	// Find current user
	const currentUser = findUser(userid);
	const userAlias = currentUser ? getUserAlias(currentUser.userid) : userid;

	const handleUserChange = (newUserid: string) => {
		router.push(`/user/${newUserid}`);
	};

	const handleAddUser = () => {
		window.location.href = '/api/auth/withings';
	};

	const handleGetMeasurements = async () => {
		if (!userid) return;

		setLoading(true);
		setError(null);

		try {
			const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
			const now = Math.floor(Date.now() / 1000);

			const response = await fetch(`/api/measurements?userid=${userid}&startdate=${thirtyDaysAgo}&enddate=${now}`);

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

	const handleBackToHome = () => {
		router.push('/');
	};

	if (usersError) {
		return (
			<div className="min-h-screen bg-zinc-50 p-8 font-sans dark:bg-black">
				<main className="w-full">
					<div className="rounded-lg bg-white p-8 shadow-sm dark:bg-zinc-900">
						<div className="mb-4 rounded-md bg-red-50 p-4 dark:bg-red-900/20">
							<p className="text-sm text-red-800 dark:text-red-400">Error loading users: {usersError.message}</p>
						</div>
						<button
							onClick={handleBackToHome}
							className="rounded-md bg-zinc-600 px-6 py-3 text-white transition-colors hover:bg-zinc-700"
						>
							← Back to Home
						</button>
					</div>
				</main>
			</div>
		);
	}

	if (usersLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
				<div className="flex items-center gap-2">
					<div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-blue-600 dark:border-zinc-600 dark:border-t-blue-400"></div>
					<p className="text-zinc-500 dark:text-zinc-400">Loading...</p>
				</div>
			</div>
		);
	}

	if (!currentUser) {
		return (
			<div className="min-h-screen bg-zinc-50 p-8 font-sans dark:bg-black">
				<main className="w-full">
					<div className="rounded-lg bg-white p-8 shadow-sm dark:bg-zinc-900">
						<div className="mb-4 rounded-md bg-red-50 p-4 dark:bg-red-900/20">
							<p className="text-sm text-red-800 dark:text-red-400">User not found</p>
						</div>
						<button
							onClick={handleBackToHome}
							className="rounded-md bg-zinc-600 px-6 py-3 text-white transition-colors hover:bg-zinc-700"
						>
							← Back to Home
						</button>
					</div>
				</main>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-zinc-50 p-8 font-sans dark:bg-black">
			<main className="w-full">
				<div className="rounded-lg bg-white p-8 shadow-sm dark:bg-zinc-900">
					<Navbar currentUserid={userid} onUserChange={handleUserChange} onAddUser={handleAddUser} />

					{error && (
						<div className="mb-4 rounded-md bg-red-50 p-4 dark:bg-red-900/20">
							<p className="text-sm text-red-800 dark:text-red-400">Error: {error}</p>
						</div>
					)}

					<div className="mb-6">
						<button
							onClick={handleBackToHome}
							className="flex items-center gap-2 text-sm text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
						>
							<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
							</svg>
							Back to Home
						</button>
					</div>

					<div className="space-y-6">
						{/* Weight Chart */}
						<WeightChart userid={userid} />

						<div className="space-y-3">
							<div className="flex gap-3">
								<button
									onClick={handleGetMeasurements}
									disabled={loading}
									className="rounded-md bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
								>
									{loading ? 'Loading...' : 'Get Measurements'}
								</button>
							</div>

							<details className="rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
								<summary className="cursor-pointer font-medium text-zinc-900 dark:text-zinc-50">View User Info</summary>
								<pre className="mt-2 overflow-x-auto text-xs text-zinc-600 dark:text-zinc-400">
									{JSON.stringify({ userid, username: currentUser.username, alias: userAlias }, null, 2)}
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
				</div>
			</main>
		</div>
	);
}

export default function UserPage() {
	return (
		<Suspense
			fallback={
				<div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
					<div className="text-zinc-600 dark:text-zinc-400">Loading...</div>
				</div>
			}
		>
			<UserPageContent />
		</Suspense>
	);
}
