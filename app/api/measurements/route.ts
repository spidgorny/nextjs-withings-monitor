import { NextRequest, NextResponse } from 'next/server';
import { getMeasurements } from '@/lib/withings';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const accessToken = searchParams.get('access_token');

    if (!accessToken) {
        return NextResponse.json(
            { error: 'Access token required' },
            { status: 400 }
        );
    }

    try {
        const startdate = searchParams.get('startdate');
        const enddate = searchParams.get('enddate');

        const measurements = await getMeasurements(accessToken, {
            startdate: startdate ? parseInt(startdate) : undefined,
            enddate: enddate ? parseInt(enddate) : undefined,
        });

        return NextResponse.json(measurements);
    } catch (error) {
        console.error('Error fetching measurements:', error);
        return NextResponse.json(
            { error: 'Failed to fetch measurements' },
            { status: 500 }
        );
    }
}
