import { NextRequest, NextResponse } from 'next/server';
import { WithingsDAO } from '@/lib/withings-dao';
import { getTokensByUserId } from '@/lib/env-config';

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { userid, year, month } = body;

		if (!userid) {
			return NextResponse.json({ error: 'userid is required' }, { status: 400 });
		}

		// Get user tokens from .env.json
		const userConfig = await getTokensByUserId(userid);
		if (!userConfig) {
			return NextResponse.json({ error: 'User not found in configuration' }, { status: 404 });
		}

		const now = new Date();
		const targetYear = year || now.getFullYear();
		const targetMonth = month || now.getMonth() + 1;

		const dao = new WithingsDAO();

		// Fetch and store the data (this will handle token refresh internally if needed)
		await dao.fetchAndStore(userConfig.tokens.access_token, userid, targetYear, targetMonth);

		return NextResponse.json({
			success: true,
			year: targetYear,
			month: targetMonth,
		});
	} catch (error) {
		console.error('Error fetching month data:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch data', details: error instanceof Error ? error.message : 'Unknown error' },
			{ status: 500 }
		);
	}
}
