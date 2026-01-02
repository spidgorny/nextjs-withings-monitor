'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function Home() {
  const searchParams = useSearchParams();
  const [tokens, setTokens] = useState<{
    access_token?: string;
    refresh_token?: string;
    userid?: string;
    expires_in?: string;
  } | null>(null);
  const [measurements, setMeasurements] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if we got tokens from the callback
    if (searchParams.get('success') === 'true') {
      const tokenData = {
        access_token: searchParams.get('access_token') || undefined,
        refresh_token: searchParams.get('refresh_token') || undefined,
        userid: searchParams.get('userid') || undefined,
        expires_in: searchParams.get('expires_in') || undefined,
      };
      setTokens(tokenData);
      
      // Store in localStorage for persistence (not secure for production!)
      if (tokenData.access_token) {
        localStorage.setItem('withings_tokens', JSON.stringify(tokenData));
      }
    } else if (searchParams.get('error')) {
      setError(searchParams.get('error') || 'Unknown error');
    } else {
      // Try to load tokens from localStorage
      const stored = localStorage.getItem('withings_tokens');
      if (stored) {
        setTokens(JSON.parse(stored));
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
    localStorage.removeItem('withings_tokens');
    setTokens(null);
    setMeasurements(null);
    window.history.replaceState({}, '', '/');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-8 font-sans dark:bg-black">
      <main className="w-full max-w-2xl">
        <div className="rounded-lg bg-white p-8 shadow-sm dark:bg-zinc-900">
          <h1 className="mb-6 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Withings Health Monitor
          </h1>

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
              <div className="rounded-md bg-green-50 p-4 dark:bg-green-900/20">
                <p className="text-sm font-medium text-green-800 dark:text-green-400">
                  ✓ Connected to Withings
                </p>
                <p className="mt-1 text-xs text-green-700 dark:text-green-500">
                  User ID: {tokens.userid}
                </p>
              </div>

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
