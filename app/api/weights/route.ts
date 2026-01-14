import { NextRequest, NextResponse } from 'next/server';
import { WithingsDAO } from '@/lib/withings-dao';

export interface WeightData {
  date: string;
  weight: number;
  timestamp: number;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userid = searchParams.get('userid');

  if (!userid) {
    return NextResponse.json(
      { error: 'userid parameter is required' },
      { status: 400 }
    );
  }

  try {
    const dao = new WithingsDAO();
    const months = await dao.listMonths(userid);

    if (months.length === 0) {
      return NextResponse.json({ weights: [], lastModified: null });
    }

    const weights: WeightData[] = [];

    // Read all available months and extract weight data
    for (const { year, month } of months) {
      const data = await dao.read(userid, year, month);

      if (data && data.measurements && data.measurements.measuregrps) {
        for (const grp of data.measurements.measuregrps) {
          // Find weight measurement (type 1 is weight in kg)
          const weightMeasure = grp.measures?.find((m: { type: number; value: number; unit: number }) => m.type === 1);

          if (weightMeasure) {
            // Calculate actual weight: value * 10^unit
            const weight = weightMeasure.value * Math.pow(10, weightMeasure.unit);

            weights.push({
              date: new Date(grp.date * 1000).toISOString(),
              weight: Math.round(weight * 100) / 100, // Round to 2 decimal places
              timestamp: grp.date,
            });
          }
        }
      }
    }

    // Sort by timestamp ascending
    weights.sort((a, b) => a.timestamp - b.timestamp);

    // Filter to only last 365 days to reduce data transfer
    const now = new Date();
    const oneYearAgo = new Date(now);
    oneYearAgo.setDate(now.getDate() - 365);

    const filteredWeights = weights.filter((w) => {
      const weightDate = new Date(w.date);
      return weightDate >= oneYearAgo;
    });

    // Get last modified timestamp for the current month
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const lastModified = await dao.getLastModified(userid, currentYear, currentMonth);

    return NextResponse.json({
      weights: filteredWeights,
      lastModified: lastModified ? lastModified.toISOString() : null
    });
  } catch (error) {
    console.error('Error fetching weight data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weight data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

