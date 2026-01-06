import { NextRequest, NextResponse } from 'next/server';
import { WithingsDAO } from '@/lib/withings-dao';
import { getTokensByUserId } from '@/lib/env-config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userid, access_token, year, month } = body;

    if (!userid || !access_token) {
      return NextResponse.json(
        { error: 'userid and access_token are required' },
        { status: 400 }
      );
    }

    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month || now.getMonth() + 1;

    const dao = new WithingsDAO();

    // Fetch and store the data (this will handle token refresh internally if needed)
    await dao.fetchAndStore(access_token, userid, targetYear, targetMonth);

    // Get the potentially updated tokens from .env.json
    const userConfig = await getTokensByUserId(userid);
    const updatedTokens = userConfig ? userConfig.tokens : undefined;

    return NextResponse.json({
      success: true,
      year: targetYear,
      month: targetMonth,
      tokens: updatedTokens ? {
        access_token: updatedTokens.access_token,
        refresh_token: updatedTokens.refresh_token,
        userid: updatedTokens.userid,
        expires_in: updatedTokens.expires_in,
      } : undefined,
    });
  } catch (error) {
    console.error('Error fetching month data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

