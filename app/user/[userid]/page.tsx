'use client';

import { Suspense, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import WeightChart from '@/components/WeightChart';
import Navbar from '@/components/Navbar';
import { useUsers } from '@/hooks/useUsers';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

function UserPageContent() {
	const params = useParams();
	const router = useRouter();
	const userid = params.userid as string;

	const [error, setError] = useState<string | null>(null);
	const [isFetching, setIsFetching] = useState(false);
	const [fetchError, setFetchError] = useState<string | null>(null);

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

	const handleFetchCurrentMonth = async () => {
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
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to fetch data');
			}

			// Success - the SWR cache in WeightChart will auto-revalidate
		} catch (err) {
			setFetchError(err instanceof Error ? err.message : 'Unknown error');
		} finally {
			setIsFetching(false);
		}
	};

	if (usersError) {
		return (
			<div className="min-h-screen bg-zinc-50 p-4 font-sans dark:bg-black">
				<main className="w-full">
					<div className="rounded-lg bg-white p-6 shadow-sm dark:bg-zinc-900">
						<h1 className="mb-4 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
							<Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400">
								Withings Health Monitor
							</Link>
						</h1>
						<div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
							<p className="text-sm text-red-800 dark:text-red-400">Error loading users: {usersError.message}</p>
						</div>
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
			<div className="min-h-screen bg-zinc-50 p-4 font-sans dark:bg-black">
				<main className="w-full">
					<div className="rounded-lg bg-white p-6 shadow-sm dark:bg-zinc-900">
						<h1 className="mb-4 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
							<Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400">
								Withings Health Monitor
							</Link>
						</h1>
						<div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
							<p className="text-sm text-red-800 dark:text-red-400">User not found</p>
						</div>
					</div>
				</main>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-zinc-50 p-4 font-sans dark:bg-black">
			<main className="w-full">
				<div className="rounded-lg bg-white p-6 shadow-sm dark:bg-zinc-900">
					<Navbar
						currentUserid={userid}
						onUserChange={handleUserChange}
						onAddUser={handleAddUser}
						showFetchButton={true}
						onFetchMonth={handleFetchCurrentMonth}
						isFetching={isFetching}
					/>

					{error && (
						<div className="mb-4 rounded-md bg-red-50 p-4 dark:bg-red-900/20">
							<p className="text-sm text-red-800 dark:text-red-400">Error: {error}</p>
						</div>
					)}

					<div className="space-y-6">
						{/* Weight Chart */}
						<WeightChart userid={userid} isFetching={isFetching} fetchError={fetchError} />

						<details className="rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
							<summary className="cursor-pointer font-medium text-zinc-900 dark:text-zinc-50">View User Info</summary>
							<pre className="mt-2 overflow-x-auto text-xs text-zinc-600 dark:text-zinc-400">
								{JSON.stringify({ userid, username: currentUser.username, alias: userAlias }, null, 2)}
							</pre>
						</details>
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
