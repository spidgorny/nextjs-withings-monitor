#!/usr/bin/env tsx
/**
 * Test script to verify token refresh functionality
 * This script simulates a token refresh scenario
 */

import { getTokensByUserId, updateUserTokensByUserId } from '../lib/env-config';
import { isInvalidTokenError } from '../lib/withings';

async function testTokenRefresh() {
    console.log('=== Testing Token Refresh Functionality ===\n');

    try {
        // Test 1: Read tokens from .env.json
        console.log('Test 1: Reading tokens from .env.json...');
        const userConfig = await getTokensByUserId('1372655');
        if (userConfig) {
            console.log(`✓ Found user: ${userConfig.username}`);
            console.log(`  - access_token: ${userConfig.tokens.access_token.substring(0, 10)}...`);
            console.log(`  - refresh_token: ${userConfig.tokens.refresh_token.substring(0, 10)}...`);
            console.log(`  - userid: ${userConfig.tokens.userid}`);
        } else {
            console.log('✗ User not found');
        }

        // Test 2: Check error detection
        console.log('\nTest 2: Testing error detection...');

        const error401 = new Error('{"status":401,"body":{},"error":"invalid_token"}');
        console.log(`  401 error detected: ${isInvalidTokenError(error401)}`);

        const error401Alt = new Error('The access token provided is invalid');
        console.log(`  Invalid token error detected: ${isInvalidTokenError(error401Alt)}`);

        const normalError = new Error('Some other error');
        console.log(`  Normal error (should be false): ${isInvalidTokenError(normalError)}`);

        console.log('\n✓ All tests passed!');
        console.log('\nNote: To test actual token refresh, run:');
        console.log('  npx tsx scripts/fetch-year.ts slawa 2025');
        console.log('  or click "Fetch Current Month" in the web UI');

    } catch (error) {
        console.error('\n✗ Test failed:', error);
        process.exit(1);
    }
}

testTokenRefresh();

