import { NextResponse } from 'next/server';
import { readEnvConfig } from '@/lib/env-config';

export interface User {
	userid: string;
	username: string;
	expiresInSeconds?: number; // seconds until expiration (null if unknown)
	tokenExpired?: boolean;
	issuedAt?: string; // ISO timestamp
}

export async function GET() {
	try {
		// Read all users from .env.json
		const config = await readEnvConfig();

		// Transform to array of users with expiration info
		const users: User[] = Object.entries(config).map(([username, tokens]) => {
			const expiresIn = parseInt(tokens.expires_in || '10800', 10);
			const issuedAt = tokens.issued_at;

			let expiresInSeconds: number | undefined;
			let tokenExpired = false;

			if (issuedAt) {
				// Calculate time remaining based on when token was issued
				const issuedTime = new Date(issuedAt).getTime();
				const expiresTime = issuedTime + expiresIn * 1000;
				const now = Date.now();
				const remainingMs = expiresTime - now;

				expiresInSeconds = Math.floor(remainingMs / 1000);
				tokenExpired = expiresInSeconds <= 0;
			}

			return {
				userid: tokens.userid,
				username: username,
				expiresInSeconds: expiresInSeconds,
				tokenExpired: tokenExpired,
				issuedAt: issuedAt,
			};
		});

		return NextResponse.json({ users });
	} catch (error) {
		console.error('Error fetching users:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch users', details: error instanceof Error ? error.message : 'Unknown error' },
			{ status: 500 }
		);
	}
}
