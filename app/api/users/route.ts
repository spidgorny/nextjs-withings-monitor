import { NextResponse } from 'next/server';
import { readEnvConfig } from '@/lib/env-config';

export interface User {
	userid: string;
	username: string;
}

export async function GET() {
	try {
		// Read all users from .env.json
		const config = await readEnvConfig();

		// Transform to array of users
		const users: User[] = Object.entries(config).map(([username, tokens]) => ({
			userid: tokens.userid,
			username: username,
		}));

		return NextResponse.json({ users });
	} catch (error) {
		console.error('Error fetching users:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch users', details: error instanceof Error ? error.message : 'Unknown error' },
			{ status: 500 }
		);
	}
}
