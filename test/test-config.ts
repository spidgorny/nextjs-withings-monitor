import fs from 'fs/promises';

async function testConfig() {
	const content = await fs.readFile('.env.json', 'utf-8');
	const json = JSON.parse(content);

	console.log('Raw JSON:', JSON.stringify(json, null, 2));
	console.log('\nAvailable users:', Object.keys(json).join(', '));

	const username = 'slawa';
	if (json[username]) {
		console.log(`\n${username} config:`, json[username]);
	}

	const username2 = 'marina';
	if (json[username2]) {
		console.log(`\n${username2} config:`, json[username2]);
	}
}

testConfig().catch(console.error);
