'use client';

import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';

interface User {
	userid: string;
	username: string;
}

interface UserWithAlias extends User {
	alias?: string;
}

interface NavbarProps {
	currentUserid?: string;
	onUserChange: (userid: string) => void;
	onAddUser: () => void;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Navbar({ currentUserid, onUserChange, onAddUser }: NavbarProps) {
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);

	// Fetch users from API using SWR
	const { data: usersData } = useSWR<{ users: User[] }>('/api/users', fetcher, {
		revalidateOnFocus: true,
	});

	// Get user aliases from localStorage
	const getUserAliases = (): Record<string, string> => {
		if (typeof window === 'undefined') return {};
		const stored = localStorage.getItem('withings_user_aliases');
		return stored ? JSON.parse(stored) : {};
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

	const users = getUsersWithAliases();
	const currentUser = users.find((u) => u.userid === currentUserid);

	const handleUserSwitch = (userid: string) => {
		onUserChange(userid);
		setIsDropdownOpen(false);
	};

	return (
		<nav className="mb-6 flex items-center justify-between border-b border-zinc-200 pb-4 dark:border-zinc-800">
			<h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
				<Link href="/">Withings Health Monitor</Link>
			</h1>

			{users.length > 0 && (
				<div className="flex items-center gap-3">
					{/* User Switcher Dropdown */}
					<div className="relative">
						<button
							onClick={() => setIsDropdownOpen(!isDropdownOpen)}
							className="flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
						>
							<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
								/>
							</svg>
							<span>{currentUser?.alias || currentUser?.username || 'None'}</span>
							<svg
								className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
							</svg>
						</button>

						{isDropdownOpen && (
							<>
								{/* Backdrop */}
								<div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />

								{/* Dropdown Menu */}
								<div className="absolute right-0 z-20 mt-2 w-64 rounded-md border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
									<div className="p-2">
										<div className="mb-2 px-3 py-2 text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">
											Switch User
										</div>
										{users.map((user) => (
											<button
												key={user.userid}
												onClick={() => handleUserSwitch(user.userid!)}
												className={`w-full rounded px-3 py-2 text-left text-sm transition-colors ${
													user.userid === currentUserid
														? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
														: 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700'
												}`}
											>
												<div className="flex items-center justify-between">
													<div className="flex flex-col">
														<span className="font-medium">{user.alias || `User ${user.userid}`}</span>
														<span className="text-xs text-zinc-500 dark:text-zinc-400">ID: {user.userid}</span>
													</div>
													{user.userid === currentUserid && (
														<svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
															<path
																fillRule="evenodd"
																d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
																clipRule="evenodd"
															/>
														</svg>
													)}
												</div>
											</button>
										))}
									</div>
								</div>
							</>
						)}
					</div>

					{/* Add User Button */}
					<button
						onClick={onAddUser}
						className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
					>
						<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
						</svg>
						Add User
					</button>
				</div>
			)}
		</nav>
	);
}
