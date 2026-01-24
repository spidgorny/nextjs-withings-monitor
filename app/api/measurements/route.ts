import { NextRequest, NextResponse } from 'next/server';
import { getMeasurements, refreshAccessToken, isInvalidTokenError } from '@/lib/withings';
import { getTokensByUserId, updateUserTokensByUserId } from '@/lib/env-config';

export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams;
	const userid = searchParams.get('userid');

	if (!userid) {
		return NextResponse.json({ error: 'User ID required' }, { status: 400 });
	}

	try {
		// Get user tokens from .env.json
		const userConfig = await getTokensByUserId(userid);
		if (!userConfig) {
			return NextResponse.json({ error: 'User not found in configuration' }, { status: 404 });
		}

		const startdate = searchParams.get('startdate');
		const enddate = searchParams.get('enddate');

		let measurements;
		try {
			measurements = await getMeasurements(userConfig.tokens.access_token, {
				startdate: startdate ? parseInt(startdate) : undefined,
				enddate: enddate ? parseInt(enddate) : undefined,
			});
		} catch (error) {
			// Check if it's a 401 invalid token error
			if (isInvalidTokenError(error)) {
				console.log('Access token expired, refreshing...');

				const clientId = process.env.WITHINGS_CLIENT_ID;
				const clientSecret = process.env.WITHINGS_CLIENT_SECRET;

				if (!clientId || !clientSecret) {
					throw new Error('WITHINGS_CLIENT_ID and WITHINGS_CLIENT_SECRET must be set');
				}

				// Refresh the token
				const newTokens = await refreshAccessToken(clientId, clientSecret, userConfig.tokens.refresh_token);

				// Update .env.json with new tokens
				await updateUserTokensByUserId(userid, {
					access_token: newTokens.access_token,
					refresh_token: newTokens.refresh_token,
					expires_in: newTokens.expires_in.toString(),
					issued_at: new Date().toISOString(),
				});

				console.log('Token refreshed successfully');

				// Retry with new token
				measurements = await getMeasurements(newTokens.access_token, {
					startdate: startdate ? parseInt(startdate) : undefined,
					enddate: enddate ? parseInt(enddate) : undefined,
				});
			} else {
				throw error;
			}
		}

		return NextResponse.json(measurements);
	} catch (error) {
		console.error('Error fetching measurements:', error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : 'Failed to fetch measurements' },
			{ status: 500 }
		);
	}
}
