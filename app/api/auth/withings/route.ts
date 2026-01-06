import { NextRequest, NextResponse } from 'next/server';
import { getAuthorizationUrl } from '@/lib/withings';

export async function GET(request: NextRequest) {
    const clientId = process.env.WITHINGS_CLIENT_ID;
    const redirectUri = process.env.WITHINGS_REDIRECT_URI || `${request.nextUrl.origin}/api/auth/callback`;
    console.log('redirectUrl:', redirectUri);

    if (!clientId) {
        return NextResponse.json(
            { error: 'Withings client ID not configured' },
            { status: 500 }
        );
    }

    // Generate a random state for CSRF protection
    const state = Math.random().toString(36).substring(7);

    const authUrl = getAuthorizationUrl(clientId, redirectUri, state);

    // Redirect user to Withings authorization page
    return NextResponse.redirect(authUrl);
}
