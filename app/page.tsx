'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import WeightChart from '@/components/WeightChart';
import Navbar from '@/components/Navbar';

// Force dynamic rendering to avoid SSR issues with localStorage
export const dynamic = 'force-dynamic';

function HomeContent() {
  const searchParams = useSearchParams();
  const [currentUserid, setCurrentUserid] = useState<string | null>(null);
  // ...existing code...
  const [allUsers, setAllUsers] = useState<Array<{
    access_token?: string;
    refresh_token?: string;
    userid?: string;
    expires_in?: string;
    alias?: string;
  }>>([]);
  const [tokens, setTokens] = useState<{
    access_token?: string;
    refresh_token?: string;
    userid?: string;
    expires_in?: string;
    alias?: string;
  } | null>(null);
  const [measurements, setMeasurements] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load users from localStorage
  const loadUsers = () => {
    const stored = localStorage.getItem('withings_users');
    if (stored) {
      const users = JSON.parse(stored);
      setAllUsers(Array.isArray(users) ? users : []);
      return Array.isArray(users) ? users : [];
    }
    return [];
  };

  // Save users to localStorage
  const saveUsers = (users: typeof allUsers) => {
    localStorage.setItem('withings_users', JSON.stringify(users));
    setAllUsers(users);
  };

  // Switch to a specific user
  const switchToUser = (userid: string) => {
    const user = allUsers.find(u => u.userid === userid);
    if (user) {
      setCurrentUserid(userid);
      setTokens(user);
      localStorage.setItem('withings_current_userid', userid);
      setMeasurements(null); // Clear measurements when switching
    }
  };

  useEffect(() => {
    // Load all users
    const users = loadUsers();

    // Check if we got tokens from the callback
    if (searchParams.get('success') === 'true') {
      const userid = searchParams.get('userid') || undefined;

      if (userid) {
        // Check if user already exists
        const existingUser = users.find(u => u.userid === userid);

        let alias = existingUser?.alias;

        // Prompt for alias only if it's a new user (not already in the list)
        if (!existingUser) {
          alias = prompt('Enter an alias for this user (e.g., "John", "Mom", etc.):');
          if (!alias) {
            alias = `User ${userid}`;
          }
        }

        const tokenData = {
          access_token: searchParams.get('access_token') || undefined,
          refresh_token: searchParams.get('refresh_token') || undefined,
          userid: userid,
          expires_in: searchParams.get('expires_in') || undefined,
          alias: alias,
        };

        // Add or update user in the list
        const existingIndex = users.findIndex(u => u.userid === tokenData.userid);
        let updatedUsers;
        if (existingIndex >= 0) {
          updatedUsers = [...users];
          updatedUsers[existingIndex] = tokenData;
        } else {
          updatedUsers = [...users, tokenData];
        }

        localStorage.setItem('withings_users', JSON.stringify(updatedUsers));
        setAllUsers(updatedUsers);
        setCurrentUserid(tokenData.userid);
        setTokens(tokenData);
        localStorage.setItem('withings_current_userid', tokenData.userid);
      }
    } else if (searchParams.get('error')) {
      setError(searchParams.get('error') || 'Unknown error');
    } else {
      // Try to load the last active user
      const lastUserid = localStorage.getItem('withings_current_userid');
      if (lastUserid && users.length > 0) {
        const user = users.find(u => u.userid === lastUserid);
        if (user) {
          setCurrentUserid(lastUserid);
          setTokens(user);
        } else if (users.length > 0) {
          // Fallback to first user if last user not found
          setCurrentUserid(users[0].userid!);
          setTokens(users[0]);
        }
      } else if (users.length > 0) {
        // No last user, use first available
        setCurrentUserid(users[0].userid!);
        setTokens(users[0]);
      }
    }
  }, [searchParams]);

	const handleConnect = () => {
		window.location.href = '/api/auth/withings';
	};

	const handleGetMeasurements = async () => {
		if (!tokens?.access_token) return;

		setLoading(true);
		setError(null);

		try {
			const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
			const now = Math.floor(Date.now() / 1000);

			const response = await fetch(
				`/api/measurements?access_token=${tokens.access_token}&startdate=${thirtyDaysAgo}&enddate=${now}`
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

  const handleDisconnect = () => {
    if (!currentUserid) return;

    // Remove current user from the list
    const updatedUsers = allUsers.filter(u => u.userid !== currentUserid);
    saveUsers(updatedUsers);

    // Switch to another user if available, otherwise clear
    if (updatedUsers.length > 0) {
      switchToUser(updatedUsers[0].userid!);
    } else {
      setCurrentUserid(null);
      setTokens(null);
      setMeasurements(null);
      localStorage.removeItem('withings_current_userid');
    }

    window.history.replaceState({}, '', '/');
  };

  const handleAddUser = () => {
    window.location.href = '/api/auth/withings';
  };

  const handleTokensUpdated = (newTokens: {
    access_token: string;
    refresh_token: string;
    userid: string;
    expires_in: string;
  }) => {
    // Update the tokens in state
    const existingUser = allUsers.find(u => u.userid === newTokens.userid);
    const updatedTokens = {
      ...newTokens,
      alias: existingUser?.alias, // Preserve the alias
    };

    setTokens(updatedTokens);

    // Update the tokens in localStorage
    const existingIndex = allUsers.findIndex(u => u.userid === newTokens.userid);
    if (existingIndex >= 0) {
      const updatedUsers = [...allUsers];
      updatedUsers[existingIndex] = updatedTokens;
      saveUsers(updatedUsers);
    }
  };

	return (
		<div className="min-h-screen bg-zinc-50 p-8 font-sans dark:bg-black">
			<main className="w-full">
				<div className="rounded-lg bg-white p-8 shadow-sm dark:bg-zinc-900">
					<Navbar
						currentUserid={currentUserid || undefined}
						onUserChange={switchToUser}
						onAddUser={handleAddUser}
					/>

					{error && (
						<div className="mb-4 rounded-md bg-red-50 p-4 dark:bg-red-900/20">
							<p className="text-sm text-red-800 dark:text-red-400">
								Error: {error}
							</p>
						</div>
					)}

					{!tokens ? (
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
						{tokens.userid && (
							<WeightChart
								userid={tokens.userid}
								accessToken={tokens.access_token}
								onTokensUpdated={handleTokensUpdated}
							/>
						)}

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
										View Tokens
									</summary>
									<pre className="mt-2 overflow-x-auto text-xs text-zinc-600 dark:text-zinc-400">
                    {JSON.stringify(tokens, null, 2)}
									</pre>
								</details>
							</div>

							{measurements && (
								<div className="rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
									<h2 className="mb-3 font-semibold text-zinc-900 dark:text-zinc-50">
										Measurements
									</h2>
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
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
        <div className="text-zinc-600 dark:text-zinc-400">Loading...</div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}

