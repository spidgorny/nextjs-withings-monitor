import fs from 'fs/promises';
import findUp from 'find-up';
import invariant from 'tiny-invariant';

export interface UserTokens {
	access_token: string;
	refresh_token: string;
	userid: string;
	expires_in: string;
}

export interface EnvConfig {
	[username: string]: UserTokens;
}

const ENV_FILE_PATH = await findUp('.env.json');
invariant(ENV_FILE_PATH, '.env.json file not found');

// Assert type after invariant check
const envFilePath: string = ENV_FILE_PATH;

/**
 * Read the .env.json file
 */
export async function readEnvConfig(): Promise<EnvConfig> {
	try {
		const content = await fs.readFile(envFilePath, 'utf-8');
		return JSON.parse(content);
	} catch (error) {
		console.error('Error reading .env.json:', error);
		throw new Error('Failed to read .env.json');
	}
}

/**
 * Write the .env.json file
 */
export async function writeEnvConfig(config: EnvConfig): Promise<void> {
	try {
		await fs.writeFile(envFilePath, JSON.stringify(config, null, 2), 'utf-8');
	} catch (error) {
		console.error('Error writing .env.json:', error);
		throw new Error('Failed to write .env.json');
	}
}

/**
 * Get tokens for a specific user by userid
 */
export async function getTokensByUserId(userid: string): Promise<{ username: string; tokens: UserTokens } | null> {
	const config = await readEnvConfig();

	for (const [username, tokens] of Object.entries(config)) {
		if (tokens.userid === userid) {
			return { username, tokens };
		}
	}

	return null;
}

/**
 * Get tokens for a specific user by username
 */
export async function getTokensByUsername(username: string): Promise<UserTokens | null> {
	const config = await readEnvConfig();
	return config[username] || null;
}

/**
 * Update tokens for a specific user
 */
export async function updateUserTokens(username: string, tokens: Partial<UserTokens>): Promise<void> {
	const config = await readEnvConfig();

	if (!config[username]) {
		throw new Error(`User "${username}" not found in .env.json`);
	}

	config[username] = {
		...config[username],
		...tokens,
	};

	await writeEnvConfig(config);
	console.log(`✓ Updated tokens for user "${username}" in .env.json`);
}

/**
 * Update tokens for a user by userid
 */
export async function updateUserTokensByUserId(userid: string, tokens: Partial<UserTokens>): Promise<void> {
	const config = await readEnvConfig();

	let found = false;
	for (const [username, userTokens] of Object.entries(config)) {
		if (userTokens.userid === userid) {
			config[username] = {
				...userTokens,
				...tokens,
			};
			found = true;
			console.log(`✓ Updated tokens for user "${username}" (userid: ${userid}) in .env.json`);
			break;
		}
	}

	if (!found) {
		throw new Error(`User with userid "${userid}" not found in .env.json`);
	}

	await writeEnvConfig(config);
}

/**
 * Add or update a user's tokens in .env.json
 * If the user doesn't exist, creates a new entry with a generated username
 * If the user exists (by userid), updates their tokens
 */
export async function addOrUpdateUserTokens(userid: string, tokens: UserTokens): Promise<string> {
	const config = await readEnvConfig();

	// Check if user already exists
	for (const [username, userTokens] of Object.entries(config)) {
		if (userTokens.userid === userid) {
			// User exists, update their tokens
			config[username] = tokens;
			await writeEnvConfig(config);
			console.log(`✓ Updated tokens for user "${username}" (userid: ${userid}) in .env.json`);
			return username;
		}
	}

	// User doesn't exist, create a new entry
	// Generate a username: user_<userid> or user_<count>
	let newUsername = `user_${userid}`;
	let counter = 1;
	while (config[newUsername]) {
		newUsername = `user_${userid}_${counter}`;
		counter++;
	}

	config[newUsername] = tokens;
	await writeEnvConfig(config);
	console.log(`✓ Added new user "${newUsername}" (userid: ${userid}) to .env.json`);
	return newUsername;
}
