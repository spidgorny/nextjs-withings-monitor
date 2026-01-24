import { readEnvConfig } from '../lib/env-config';
import { WithingsDAO } from '../lib/withings-dao';
import dotenv from 'dotenv';
import findUp from 'find-up';

/**
 * Fetch current month data for all users configured in .env.json
 * This script is designed to be run as a cronjob to keep data up-to-date
 */
async function fetchAllUsers() {
	console.log(`\n=== Withings Data Fetch - ${new Date().toISOString()} ===\n`);

	try {
		// Check for required environment variables
		const clientId = process.env.WITHINGS_CLIENT_ID;
		const clientSecret = process.env.WITHINGS_CLIENT_SECRET;

		if (!clientId || !clientSecret) {
			console.error('⚠ WITHINGS_CLIENT_ID and WITHINGS_CLIENT_SECRET environment variables are not set.');
			console.error(
				'These are required for token refresh. The script will continue but may fail if tokens are expired.'
			);
			console.error('\nTo set them, create a .env file or export them:');
			console.error('  export WITHINGS_CLIENT_ID=your_client_id');
			console.error('  export WITHINGS_CLIENT_SECRET=your_client_secret\n');
		}

		// Load all user configurations
		const config = await readEnvConfig();
		const usernames = Object.keys(config);

		if (usernames.length === 0) {
			console.log('⚠ No users found in .env.json');
			return;
		}

		console.log(`Found ${usernames.length} user(s): ${usernames.join(', ')}\n`);

		// Initialize DAO
		const dao = new WithingsDAO('data');

		// Get current year and month
		const now = new Date();
		const year = now.getFullYear();
		const month = now.getMonth() + 1; // JavaScript months are 0-indexed

		const results: Array<{ username: string; userid: string; success: boolean; error?: string }> = [];

		// Fetch data for each user
		for (const username of usernames) {
			const userConfig = config[username];
			const { access_token, userid } = userConfig;

			console.log(`\n--- Processing user: ${username} (userid: ${userid}) ---`);

			try {
				// Fetch and store current month data
				await dao.fetchAndStore(access_token, userid, year, month);

				console.log(`✓ Successfully fetched data for ${username}`);
				results.push({ username, userid, success: true });

				// Add a small delay to avoid rate limiting
				await new Promise((resolve) => setTimeout(resolve, 1000));
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : String(error);
				console.error(`✗ Error fetching data for ${username}:`, errorMessage);
				results.push({ username, userid, success: false, error: errorMessage });
			}
		}

		// Print summary
		console.log(`\n=== Summary ===`);
		console.log(`Total users: ${results.length}`);
		console.log(`Successful: ${results.filter((r) => r.success).length}`);
		console.log(`Failed: ${results.filter((r) => !r.success).length}`);

		if (results.some((r) => !r.success)) {
			console.log('\nFailed users:');
			results
				.filter((r) => !r.success)
				.forEach(({ username, error }) => {
					console.log(`  - ${username}: ${error}`);
				});
		}

		console.log('\n✓ Fetch completed!');
		process.exit(0);
	} catch (error) {
		console.error('\n✗ Fatal error:', error);
		process.exit(1);
	}
}

// Run the script
dotenv.config({ path: await findUp('.env') });
await fetchAllUsers();
