import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/withings';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
        return NextResponse.redirect(
            `${request.nextUrl.origin}?error=${encodeURIComponent(error)}`
        );
    }

    if (!code) {
        return NextResponse.redirect(
            `${request.nextUrl.origin}?error=no_code`
        );
    }

    const clientId = process.env.WITHINGS_CLIENT_ID;
    const clientSecret = process.env.WITHINGS_CLIENT_SECRET;
    const redirectUri = process.env.WITHINGS_REDIRECT_URI || `${request.nextUrl.origin}/api/auth/callback`;

    if (!clientId || !clientSecret) {
        return NextResponse.redirect(
            `${request.nextUrl.origin}?error=config_error`
        );
    }

    try {
        const tokens = await getAccessToken(clientId, clientSecret, code, redirectUri);

        // In a real app, you would:
        // 1. Store tokens securely in a database
        // 2. Create a session for the user
        // 3. Associate tokens with the user's account

        // For now, redirect back to home with success and tokens in URL (not secure for production!)
        const params = new URLSearchParams({
            success: 'true',
            userid: tokens.userid,
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expires_in: tokens.expires_in.toString(),
        });

        return NextResponse.redirect(
            `${request.nextUrl.origin}?${params.toString()}`
        );
    } catch (error) {
        console.error('Error exchanging code for token:', error);
        return NextResponse.redirect(
            `${request.nextUrl.origin}?error=token_exchange_failed`
        );
    }
}
