import { WithingsDAO } from '../lib/withings-dao';

async function testWeightData() {
  const dao = new WithingsDAO();
  const userid = '1372655';

  console.log('Testing weight data loading...\n');

  const months = await dao.listMonths(userid);
  console.log(`Found ${months.length} months of data`);
  console.log('First 3 months:', months.slice(0, 3));

  if (months.length > 0) {
    const { year, month } = months[0];
    const data = await dao.read(userid, year, month);

    if (data && data.measurements && data.measurements.measuregrps) {
      const grp = data.measurements.measuregrps[0];
      const weightMeasure = grp.measures?.find((m: { type: number; value: number; unit: number }) => m.type === 1);

      if (weightMeasure) {
        const weight = weightMeasure.value * Math.pow(10, weightMeasure.unit);
        console.log(`\nSample weight: ${weight.toFixed(2)} kg`);
        console.log(`Date: ${new Date(grp.date * 1000).toLocaleString()}`);
      }
    }
  }
}

testWeightData().catch(console.error);

