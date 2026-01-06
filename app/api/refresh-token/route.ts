import { NextRequest, NextResponse } from 'next/server';
import { refreshAccessToken } from '@/lib/withings';
import { getTokensByUserId, updateUserTokensByUserId } from '@/lib/env-config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userid } = body;

    if (!userid) {
      return NextResponse.json(
        { error: 'userid is required' },
        { status: 400 }
      );
    }

    // Get user tokens from .env.json
    const userConfig = await getTokensByUserId(userid);
    if (!userConfig) {
      return NextResponse.json(
        { error: `User with userid "${userid}" not found in .env.json` },
        { status: 404 }
      );
    }

    const clientId = process.env.WITHINGS_CLIENT_ID;
    const clientSecret = process.env.WITHINGS_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'WITHINGS_CLIENT_ID and WITHINGS_CLIENT_SECRET must be configured' },
        { status: 500 }
      );
    }

    // Refresh the token
    const newTokens = await refreshAccessToken(
      clientId,
      clientSecret,
      userConfig.tokens.refresh_token
    );

    // Update .env.json with new tokens
    await updateUserTokensByUserId(userid, {
      access_token: newTokens.access_token,
      refresh_token: newTokens.refresh_token,
      expires_in: newTokens.expires_in.toString(),
    });

    return NextResponse.json({
      success: true,
      access_token: newTokens.access_token,
      refresh_token: newTokens.refresh_token,
      userid: newTokens.userid,
      expires_in: newTokens.expires_in,
    });
  } catch (error) {
    console.error('Error refreshing token:', error);
    return NextResponse.json(
      { error: 'Failed to refresh token', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

