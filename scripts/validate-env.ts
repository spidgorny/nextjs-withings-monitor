#!/usr/bin/env npx tsx

import fs from 'fs/promises';

interface UserConfig {
    access_token: string;
    refresh_token: string;
    userid: string;
    expires_in: string;
}

async function validateEnvJson() {
    console.log('🔍 Validating .env.json file...\n');

    try {
        const content = await fs.readFile('.env.json', 'utf-8');
        const json = JSON.parse(content);

        console.log('✓ File exists and is valid JSON\n');

        // Check format
        const keys = Object.keys(json);

        if (json.access_token || json.WITHINGS_ACCESS_TOKEN) {
            console.log('📋 Format: Legacy single-user');
            console.log('   User ID:', json.userid || json.WITHINGS_USER_ID);
            console.log('   Access token:', json.access_token ? '✓' : '✗');
            console.log('   Refresh token:', json.refresh_token ? '✓' : '✗');
        } else {
            console.log('📋 Format: Multi-user');
            console.log(`   Found ${keys.length} user(s): ${keys.join(', ')}\n`);

            for (const username of keys) {
                const user: UserConfig = json[username];
                console.log(`   👤 ${username}:`);
                console.log(`      User ID: ${user.userid}`);
                console.log(`      Access token: ${user.access_token ? '✓' : '✗'}`);
                console.log(`      Refresh token: ${user.refresh_token ? '✓' : '✗'}`);
                console.log(`      Expires in: ${user.expires_in}s`);
                console.log('');
            }

            console.log('💡 Usage examples:');
            for (const username of keys) {
                console.log(`   npm run fetch-year ${username} 2024`);
            }
        }

        console.log('\n✅ Configuration is valid!');
    } catch (error) {
        console.error('❌ Error:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
}

validateEnvJson();

