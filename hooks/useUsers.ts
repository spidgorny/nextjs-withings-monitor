import useSWR from 'swr';

export interface User {
	userid: string;
	username: string;
	expiresInSeconds?: number;
	tokenExpired?: boolean;
	issuedAt?: string;
}

export interface UserWithAlias extends User {
	alias?: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

/**
 * Custom hook to fetch and manage users with aliases
 */
export function useUsers() {
	// Fetch users from API using SWR
	const { data, error, mutate } = useSWR<{ users: User[] }>('/api/users', fetcher, {
		revalidateOnFocus: true,
		revalidateOnReconnect: true,
	});

	// Get user aliases from localStorage
	const getUserAliases = (): Record<string, string> => {
		if (typeof window === 'undefined') return {};
		const stored = localStorage.getItem('withings_user_aliases');
		return stored ? JSON.parse(stored) : {};
	};

	// Save user alias to localStorage
	const saveUserAlias = (userid: string, alias: string) => {
		const aliases = getUserAliases();
		aliases[userid] = alias;
		localStorage.setItem('withings_user_aliases', JSON.stringify(aliases));
	};

	// Get user alias for a specific userid
	const getUserAlias = (userid: string): string => {
		const aliases = getUserAliases();
		return aliases[userid] || userid;
	};

	// Get users with aliases
	const getUsersWithAliases = (): UserWithAlias[] => {
		if (!data?.users) return [];
		const aliases = getUserAliases();
		return data.users.map((user) => ({
			...user,
			alias: aliases[user.userid] || user.username,
		}));
	};

	// Find a user by userid
	const findUser = (userid: string): User | undefined => {
		return data?.users.find((u) => u.userid === userid);
	};

	// Find a user with alias by userid
	const findUserWithAlias = (userid: string): UserWithAlias | undefined => {
		const users = getUsersWithAliases();
		return users.find((u) => u.userid === userid);
	};

	return {
		users: data?.users || [],
		usersWithAliases: getUsersWithAliases(),
		isLoading: !error && !data,
		isError: error,
		mutate,
		getUserAlias,
		saveUserAlias,
		findUser,
		findUserWithAlias,
	};
}
