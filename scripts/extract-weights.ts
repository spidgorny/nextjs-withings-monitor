#!/usr/bin/env tsx

/**
 * Script to extract weight data from all measurement files for a specific user
 *
 * Usage:
 *   npm run extract-weights <userid>
 *   tsx scripts/extract-weights.ts 1372655
 *
 * Output:
 *   Creates output/<userid>-weights.json with format:
 *   {
 *     "timestamp": weight_in_kg,
 *     ...
 *   }
 */

import fs from 'fs/promises';
import path from 'path';
import findUp from 'find-up';

interface MeasurementData {
	userid: string;
	year: number;
	month: number;
	fetchedAt: string;
	measurements: {
		updatetime: number;
		timezone: string;
		measuregrps: Array<{
			grpid: number;
			attrib: number;
			date: number;
			created: number;
			modified: number;
			category: number;
			deviceid: string | null;
			hash_deviceid: string | null;
			measures: Array<{
				value: number;
				type: number;
				unit: number;
				algo: number;
				fm: number;
			}>;
			modelid: string | null;
			model: string | null;
			comment: string | null;
			timezone: string | null;
		}>;
	};
}

interface WeightOutput {
	[timestamp: string]: number;
}

async function extractWeightsForUser(userid: string) {
	console.log(`📊 Extracting weight data for user: ${userid}\n`);

	// Find project root
	const packageJsonPath = findUp.sync('package.json');
	if (!packageJsonPath) {
		throw new Error('Could not find package.json to determine project root');
	}
	const projectRoot = path.dirname(packageJsonPath);
	const dataDir = path.join(projectRoot, 'data', userid);
	const outputDir = path.join(projectRoot, 'output');

	// Check if user data directory exists
	try {
		await fs.access(dataDir);
	} catch {
		console.error(`❌ Error: Data directory not found for user ${userid}`);
		console.error(`   Expected: ${dataDir}`);
		process.exit(1);
	}

	// Read all JSON files in the user's data directory
	const files = await fs.readdir(dataDir);
	const jsonFiles = files.filter((f) => f.endsWith('.json'));

	if (jsonFiles.length === 0) {
		console.error(`❌ Error: No data files found for user ${userid}`);
		process.exit(1);
	}

	console.log(`Found ${jsonFiles.length} data file(s):\n`);

	const weights: WeightOutput = {};
	let totalMeasurements = 0;

	// Process each file
	for (const file of jsonFiles.sort()) {
		const filePath = path.join(dataDir, file);
		console.log(`  📄 Processing ${file}...`);

		try {
			const content = await fs.readFile(filePath, 'utf-8');
			const data: MeasurementData = JSON.parse(content);

			// Extract weights from measuregrps
			let fileCount = 0;
			for (const grp of data.measurements.measuregrps) {
				// Find weight measurement (type 1)
				const weightMeasure = grp.measures.find((m) => m.type === 1);

				if (weightMeasure) {
					// Convert value * 10^unit to get weight in kg
					const weightKg = weightMeasure.value * Math.pow(10, weightMeasure.unit);

					// Use the measurement date as timestamp
					weights[grp.date.toString()] = weightKg;
					fileCount++;
				}
			}

			totalMeasurements += fileCount;
			console.log(`     ✓ Extracted ${fileCount} measurement(s)`);
		} catch (error) {
			console.error(`     ❌ Failed to process ${file}:`, error instanceof Error ? error.message : 'Unknown error');
		}
	}

	// Sort weights by timestamp
	const sortedWeights: WeightOutput = {};
	Object.keys(weights)
		.sort((a, b) => parseInt(a) - parseInt(b))
		.forEach((timestamp) => {
			sortedWeights[timestamp] = weights[timestamp];
		});

	// Create output directory if it doesn't exist
	await fs.mkdir(outputDir, { recursive: true });

	// Write output file
	const outputFile = path.join(outputDir, `${userid}-weights.json`);
	await fs.writeFile(outputFile, JSON.stringify(sortedWeights, null, 2), 'utf-8');

	console.log('\n' + '='.repeat(50));
	console.log(`✅ Success!`);
	console.log(`   Total measurements: ${totalMeasurements}`);
	console.log(`   Output file: ${outputFile}`);
	console.log('='.repeat(50));

	// Show sample of data
	const timestamps = Object.keys(sortedWeights);
	if (timestamps.length > 0) {
		console.log('\n📋 Sample data (first 5 entries):');
		timestamps.slice(0, 5).forEach((ts) => {
			const date = new Date(parseInt(ts) * 1000);
			console.log(`   ${ts} (${date.toISOString()}) => ${sortedWeights[ts]} kg`);
		});

		if (timestamps.length > 5) {
			console.log(`   ... and ${timestamps.length - 5} more entries`);
		}
	}
}

// Main execution
const userid = process.argv[2];

if (!userid) {
	console.error('❌ Error: User ID is required');
	console.error('\nUsage:');
	console.error('  npm run extract-weights <userid>');
	console.error('  tsx scripts/extract-weights.ts 1372655');
	process.exit(1);
}

extractWeightsForUser(userid).catch((error) => {
	console.error('\n❌ Fatal error:', error instanceof Error ? error.message : 'Unknown error');
	process.exit(1);
});
