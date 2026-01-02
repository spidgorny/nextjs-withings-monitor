import fs from 'fs/promises';
import { WithingsDAO } from '../lib/withings-dao';

interface UserConfig {
    access_token: string;
    refresh_token: string;
    userid: string;
    expires_in: string;
}

interface EnvConfig {
    WITHINGS_ACCESS_TOKEN: string;
    WITHINGS_USER_ID: string;
}

async function loadConfig(username?: string): Promise<EnvConfig> {
    try {
        const content = await fs.readFile('.env.json', 'utf-8');
        const json = JSON.parse(content);

        // Check if it's the new multi-user format
        if (username) {
            // Multi-user format: { "slawa": { access_token, userid, ... }, "marina": { ... } }
            if (!json[username]) {
                const availableUsers = Object.keys(json).join(', ');
                throw new Error(`User "${username}" not found in .env.json. Available users: ${availableUsers}`);
            }
            const userConfig: UserConfig = json[username];
            return {
                WITHINGS_ACCESS_TOKEN: userConfig.access_token,
                WITHINGS_USER_ID: userConfig.userid,
            };
        } else {
            // Legacy format or single user: check if it has access_token directly
            if (json.access_token && json.userid) {
                return {
                    WITHINGS_ACCESS_TOKEN: json.access_token,
                    WITHINGS_USER_ID: json.userid,
                };
            } else if (json.WITHINGS_ACCESS_TOKEN && json.WITHINGS_USER_ID) {
                return {
                    WITHINGS_ACCESS_TOKEN: json.WITHINGS_ACCESS_TOKEN,
                    WITHINGS_USER_ID: json.WITHINGS_USER_ID,
                };
            } else {
                // It's multi-user format but no username provided
                const availableUsers = Object.keys(json).join(', ');
                throw new Error(`Multi-user .env.json detected. Please provide a username.\nAvailable users: ${availableUsers}\nUsage: npx tsx scripts/fetch-year.ts <username> [year]`);
            }
        }
    } catch (error) {
        if (error instanceof Error && error.message.includes('User "')) {
            throw error;
        }
        console.error('Error loading .env.json:', error);
        throw new Error('Failed to load .env.json. Make sure the file exists and is valid JSON.');
    }
}

async function fetchYear(username: string | undefined, year: number) {
    console.log(`\n=== Fetching Withings Data for ${year} ===\n`);

    // Load configuration
    const config = await loadConfig(username);
    const { WITHINGS_ACCESS_TOKEN, WITHINGS_USER_ID } = config;

    if (!WITHINGS_ACCESS_TOKEN || !WITHINGS_USER_ID) {
        throw new Error('WITHINGS_ACCESS_TOKEN and WITHINGS_USER_ID must be set in .env.json');
    }

    console.log(`User ID: ${WITHINGS_USER_ID}`);
    console.log(`Year: ${year}\n`);

    // Initialize DAO
    const dao = new WithingsDAO('data');

    // Fetch data for each month
    const errors: Array<{ month: number; error: string }> = [];

    for (let month = 1; month <= 12; month++) {
        try {
            // Check if data already exists
            const exists = await dao.exists(WITHINGS_USER_ID, year, month);
            if (exists) {
                console.log(`⊘ ${year}-${month.toString().padStart(2, '0')} already exists, skipping...`);
                continue;
            }

            // Fetch and store
            await dao.fetchAndStore(WITHINGS_ACCESS_TOKEN, WITHINGS_USER_ID, year, month);
            
            // Add a small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`✗ Error fetching ${year}-${month.toString().padStart(2, '0')}:`, errorMessage);
            errors.push({ month, error: errorMessage });
        }
    }

    console.log(`\n=== Summary ===`);
    console.log(`Total months: 12`);
    console.log(`Errors: ${errors.length}`);
    
    if (errors.length > 0) {
        console.log('\nFailed months:');
        errors.forEach(({ month, error }) => {
            console.log(`  - ${year}-${month.toString().padStart(2, '0')}: ${error}`);
        });
    }

    // List all available data for this user
    console.log('\n=== Available Data ===');
    const months = await dao.listMonths(WITHINGS_USER_ID);
    if (months.length === 0) {
        console.log('No data files found');
    } else {
        console.log(`Found ${months.length} month(s):`);
        months.forEach(({ year, month }) => {
            console.log(`  - ${year}-${month.toString().padStart(2, '0')}`);
        });
    }
}

// Parse command line arguments
// Usage: npx tsx scripts/fetch-year.ts [username] [year]
// Examples:
//   npx tsx scripts/fetch-year.ts slawa 2025
//   npx tsx scripts/fetch-year.ts slawa
//   npx tsx scripts/fetch-year.ts 2025 (legacy format, username optional)

let username: string | undefined;
let year: number;

const arg1 = process.argv[2];
const arg2 = process.argv[3];

if (!arg1) {
    // No arguments - use current year and no username
    username = undefined;
    year = 2025;
} else if (arg2) {
    // Two arguments - first is username, second is year
    username = arg1;
    year = parseInt(arg2, 10);
} else {
    // One argument - check if it's a year or username
    const parsedYear = parseInt(arg1, 10);
    if (!isNaN(parsedYear) && parsedYear >= 2000 && parsedYear <= 2100) {
        // It's a year
        username = undefined;
        year = parsedYear;
    } else {
        // It's a username, use current year
        username = arg1;
        year = 2025;
    }
}

if (isNaN(year) || year < 2000 || year > 2100) {
    console.error('Invalid year. Usage: npx tsx scripts/fetch-year.ts [username] [year]');
    console.error('Examples:');
    console.error('  npx tsx scripts/fetch-year.ts slawa 2025');
    console.error('  npx tsx scripts/fetch-year.ts slawa       (uses current year)');
    console.error('  npx tsx scripts/fetch-year.ts 2024       (legacy format)');
    process.exit(1);
}

fetchYear(username, year)
    .then(() => {
        console.log('\n✓ Done!');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n✗ Fatal error:', error);
        process.exit(1);
    });
