import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/withings';
import { addOrUpdateUserTokens } from '@/lib/env-config';

export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams;
	const code = searchParams.get('code');
	const error = searchParams.get('error');

	const clientId = process.env.WITHINGS_CLIENT_ID;
	const clientSecret = process.env.WITHINGS_CLIENT_SECRET;
	const redirectUri = process.env.WITHINGS_REDIRECT_URI || `${request.nextUrl.origin}/api/auth/callback`;
	const homeUrl = process.env.WITHINGS_REDIRECT_URI
		? process.env.WITHINGS_REDIRECT_URI.replace('/api/auth/callback', '')
		: request.nextUrl.origin;

	if (error) {
		return NextResponse.redirect(`${homeUrl}?error=${encodeURIComponent(error)}`);
	}

	if (!code) {
		return NextResponse.redirect(`${homeUrl}?error=no_code`);
	}

	if (!clientId || !clientSecret) {
		return NextResponse.redirect(`${homeUrl}?error=config_error`);
	}

	try {
		const tokens = await getAccessToken(clientId, clientSecret, code, redirectUri);

		// Save tokens to .env.json
		// This will either update existing user or create a new entry
		const username = await addOrUpdateUserTokens(tokens.userid, {
			access_token: tokens.access_token,
			refresh_token: tokens.refresh_token,
			userid: tokens.userid,
			expires_in: tokens.expires_in.toString(),
		});

		console.log(`✓ Tokens saved for user "${username}" (userid: ${tokens.userid})`);

		// Redirect back to home with success
		const params = new URLSearchParams({
			success: 'true',
			username: username,
			userid: tokens.userid,
		});

		return NextResponse.redirect(`${homeUrl}?${params.toString()}`);
	} catch (error) {
		console.error('Error exchanging code for token:', error);
		return NextResponse.redirect(`${homeUrl}?error=token_exchange_failed`);
	}
}
