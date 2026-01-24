#!/usr/bin/env ts-node

/**
 * Script to refresh OAuth tokens for all users
 *
 * Usage:
 *   npm run refresh-tokens
 *
 * This script:
 * - Reads all users from .env.json
 * - Refreshes the access token for each user
 * - Updates .env.json with new tokens
 */

import { readEnvConfig, updateUserTokensByUserId } from '@/lib/env-config';
import { refreshAccessToken } from '@/lib/withings';
import dotenv from 'dotenv';
import findUp from 'find-up';

async function refreshAllTokens() {
	console.log('🔄 Starting token refresh for all users...\n');

	// Check environment variables
	const clientId = process.env.WITHINGS_CLIENT_ID;
	const clientSecret = process.env.WITHINGS_CLIENT_SECRET;

	if (!clientId || !clientSecret) {
		console.error('❌ Error: WITHINGS_CLIENT_ID and WITHINGS_CLIENT_SECRET must be set in environment');
		process.exit(1);
	}

	try {
		// Read all users from .env.json
		const config = await readEnvConfig();
		const usernames = Object.keys(config);

		if (usernames.length === 0) {
			console.log('⚠️  No users found in .env.json');
			return;
		}

		console.log(`Found ${usernames.length} user(s): ${usernames.join(', ')}\n`);

		let successCount = 0;
		let failureCount = 0;

		// Refresh token for each user
		for (const username of usernames) {
			const userConfig = config[username];
			console.log(`\n📝 Processing user: ${username} (userid: ${userConfig.userid})`);

			try {
				// Refresh the token
				console.log('  ⏳ Refreshing access token...');
				const newTokens = await refreshAccessToken(clientId, clientSecret, userConfig.refresh_token);

				// Update .env.json with new tokens
				await updateUserTokensByUserId(userConfig.userid, {
					access_token: newTokens.access_token,
					refresh_token: newTokens.refresh_token,
					expires_in: newTokens.expires_in.toString(),
					issued_at: new Date().toISOString(),
				});

				console.log('  ✅ Token refreshed successfully');
				console.log(`  📅 New expiration: ${new Date(Date.now() + newTokens.expires_in * 1000).toLocaleString()}`);
				successCount++;
			} catch (error) {
				console.error(`  ❌ Failed to refresh token: ${error instanceof Error ? error.message : 'Unknown error'}`);
				failureCount++;
			}
		}

		// Summary
		console.log('\n' + '='.repeat(50));
		console.log('📊 Summary:');
		console.log(`  ✅ Success: ${successCount}`);
		console.log(`  ❌ Failed: ${failureCount}`);
		console.log(`  📝 Total: ${usernames.length}`);
		console.log('='.repeat(50));

		if (failureCount > 0) {
			process.exit(1);
		}
	} catch (error) {
		console.error('\n❌ Fatal error:', error instanceof Error ? error.message : 'Unknown error');
		process.exit(1);
	}
}

// Run the script
dotenv.config({ path: await findUp('.env') });
refreshAllTokens().catch((error) => {
	console.error('❌ Unhandled error:', error);
	process.exit(1);
});
