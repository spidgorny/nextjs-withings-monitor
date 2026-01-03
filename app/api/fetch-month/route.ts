import { NextRequest, NextResponse } from 'next/server';
import { WithingsDAO } from '@/lib/withings-dao';

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

    // Fetch and store the data
    await dao.fetchAndStore(access_token, userid, targetYear, targetMonth);

    return NextResponse.json({
      success: true,
      year: targetYear,
      month: targetMonth
    });
  } catch (error) {
    console.error('Error fetching month data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

