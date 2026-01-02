import axios from 'axios';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config({ path: '.env', debug: true });

const CLIENT_ID = process.env.WITHINGS_CLIENT_ID;
const CLIENT_SECRET = process.env.WITHINGS_CLIENT_SECRET;
const ACCESS_TOKEN = process.env.WITHINGS_ACCESS_TOKEN;
const REDIRECT_URI = process.env.WITHINGS_REDIRECT_URI || 'http://localhost:3000';
const API_ENDPOINT = 'https://wbsapi.withings.net';

interface UserData {
    email: string;
    external_id: string;
    shortname: string;
    firstname?: string;
    lastname?: string;
    birthdate: number; // Unix timestamp
    gender: 0 | 1; // 0 = MAN, 1 = WOMAN
    mailingpref: 0 | 1; // 0 = REFUSED, 1 = ACCEPTED
    measures: {
        weight: number; // in kg
        height: number; // in meters
    };
    unit_pref: {
        unit: 1 | 2 | 5 | 6; // 1=metric, 2=imperial, 5=UK imperial, 6=stone
    };
    preflang: string; // e.g., 'en_US', 'fr_FR'
    timezone: string; // e.g., 'America/New_York', 'Europe/Paris'
    phonenumber?: string; // E.164 format
    recovery_code?: string;
}

// Function to generate HMAC-SHA256 signature
function sign(params: Record<string, string>, clientSecret: string): string {
    const paramsToSign: Record<string, string> = {
        action: params.action,
        client_id: params.client_id,
    };

    // Add timestamp if present (for getNonce)
    if (params.timestamp) {
        paramsToSign.timestamp = params.timestamp;
    }

    // Add nonce if present (for actual API requests)
    if (params.nonce) {
        paramsToSign.nonce = params.nonce;
    }

    // Sort parameters alphabetically by key and join values with comma
    const sortedKeys = Object.keys(paramsToSign).sort();
    const sortedValues = sortedKeys.map(key => paramsToSign[key]).join(',');

    // Generate HMAC-SHA256 signature
    return crypto.createHmac('sha256', clientSecret).update(sortedValues).digest('hex');
}

// Function to get nonce from Withings API
async function getNonce(timestamp: number): Promise<string> {
    if (!CLIENT_ID || !CLIENT_SECRET) {
        throw new Error('CLIENT_ID and CLIENT_SECRET must be set in environment variables');
    }

    const params = {
        action: 'getnonce',
        client_id: CLIENT_ID,
        timestamp: timestamp.toString(),
    };

    const signature = sign(params, CLIENT_SECRET);

    try {
        const response = await axios.post(
            `${API_ENDPOINT}/v2/signature`,
            new URLSearchParams({ ...params, signature }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        );

        return response.data.body.nonce;
    } catch (error) {
        console.error('Error getting nonce:', error);
        throw error;
    }
}

// Function to create a Withings user
async function createUser(userData: UserData): Promise<string> {
    if (!CLIENT_ID || !CLIENT_SECRET) {
        throw new Error('CLIENT_ID and CLIENT_SECRET must be set in environment variables');
    }

    try {
        // Step 1: Get nonce
        const timestamp = Math.floor(Date.now() / 1000);
        const nonce = await getNonce(timestamp);
        console.log('Nonce obtained for user creation:', nonce);

        // Step 2: Prepare parameters for createuser
        const params = {
            action: 'createuser',
            client_id: CLIENT_ID,
            nonce: nonce,
        };

        const signature = sign(params, CLIENT_SECRET);

        // Step 3: Prepare full request body
        const requestBody: Record<string, string> = {
            ...params,
            signature,
            email: userData.email,
            external_id: userData.external_id,
            shortname: userData.shortname,
            birthdate: userData.birthdate.toString(),
            gender: userData.gender.toString(),
            mailingpref: userData.mailingpref.toString(),
            measures: JSON.stringify(userData.measures),
            unit_pref: JSON.stringify(userData.unit_pref),
            preflang: userData.preflang,
            timezone: userData.timezone,
        };

        // Add optional fields
        if (userData.firstname) requestBody.firstname = userData.firstname;
        if (userData.lastname) requestBody.lastname = userData.lastname;
        if (userData.phonenumber) requestBody.phonenumber = userData.phonenumber;
        if (userData.recovery_code) requestBody.recovery_code = userData.recovery_code;

        // Step 4: Make the createuser request
        const response = await axios.post(
            `${API_ENDPOINT}/v2/sdk`,
            new URLSearchParams(requestBody),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        );

        console.log('User created:', response.data);
        
        // Return the authorization code
        return response.data.body.user.code;
    } catch (error) {
        console.error('Error creating user:', error);
        throw error;
    }
}

// Function to get access token using authorization code
async function getAccessToken(authorizationCode: string): Promise<{ access_token: string; refresh_token: string; userid: string }> {
    if (!CLIENT_ID || !CLIENT_SECRET) {
        throw new Error('CLIENT_ID and CLIENT_SECRET must be set in environment variables');
    }

    try {
        // Step 1: Get nonce
        const timestamp = Math.floor(Date.now() / 1000);
        const nonce = await getNonce(timestamp);
        console.log('Nonce obtained for token request:', nonce);

        // Step 2: Prepare parameters for requesttoken
        const params = {
            action: 'requesttoken',
            client_id: CLIENT_ID,
            nonce: nonce,
        };

        const signature = sign(params, CLIENT_SECRET);

        // Step 3: Make the requesttoken request
        const response = await axios.post(
            `${API_ENDPOINT}/v2/oauth2`,
            new URLSearchParams({
                ...params,
                signature,
                grant_type: 'authorization_code',
                code: authorizationCode,
                redirect_uri: REDIRECT_URI,
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        );

        console.log('Access token obtained:', response.data);

        const { access_token, refresh_token, userid } = response.data.body;
        return { access_token, refresh_token, userid };
    } catch (error) {
        console.error('Error getting access token:', error);
        throw error;
    }
}

// Example: Create a new user and get measurements
const createUserAndGetMeasurements = async () => {
    try {
        // Example user data - replace with actual user information
        const userData: UserData = {
            email: 'test@example.com',
            external_id: 'user_12345', // Your unique identifier for this user
            shortname: 'TST', // 3 characters: letters or numbers only
            firstname: 'Test',
            lastname: 'User',
            birthdate: Math.floor(new Date('1990-01-01').getTime() / 1000), // Unix timestamp
            gender: 0, // 0 = MAN, 1 = WOMAN
            mailingpref: 0, // 0 = REFUSED, 1 = ACCEPTED
            measures: {
                weight: 70, // kg
                height: 1.75, // meters
            },
            unit_pref: {
                unit: 1, // 1 = metric
            },
            preflang: 'en_US',
            timezone: 'America/New_York',
            // Optional fields:
            // phonenumber: '+1234567890', // E.164 format
            // recovery_code: 'RECOVERY123',
        };

        // Step 1: Create user
        console.log('Creating user...');
        const authorizationCode = await createUser(userData);
        console.log('Authorization code:', authorizationCode);

        // Step 2: Get access token
        console.log('Getting access token...');
        const { access_token, refresh_token, userid } = await getAccessToken(authorizationCode);
        console.log('User ID:', userid);
        console.log('Access Token:', access_token);
        console.log('Refresh Token:', refresh_token);

        // Step 3: Get measurements using the access token
        console.log('Getting measurements...');
        const response = await axios.post(
            `${API_ENDPOINT}/measure`,
            new URLSearchParams({
                action: 'getmeas',
                startdate: '1727825531',
                enddate: '1728171131',
            }),
            {
                headers: {
                    'Authorization': `Bearer ${access_token}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        );

        console.log('Measurements:', response.data);
    } catch (error) {
        console.error('Error:', error);
    }
};

const getMeasurements = async () => {
    try {
        // If ACCESS_TOKEN is available, use Bearer token authentication
        if (ACCESS_TOKEN) {
            console.log('Using Bearer token authentication');
            
            const response = await axios.post(
                `${API_ENDPOINT}/measure`,
                new URLSearchParams({
                    action: 'getmeas',
                    startdate: '1727825531',
                    enddate: '1728171131',
                }),
                {
                    headers: {
                        'Authorization': `Bearer ${ACCESS_TOKEN}`,
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                }
            );

            console.log('Response:', response.data);
        } 
        // Otherwise, use signature-based authentication
        else if (CLIENT_ID && CLIENT_SECRET) {
            console.log('Using signature-based authentication');
            
            // Step 1: Get nonce
            const timestamp = Math.floor(Date.now() / 1000);
            const nonce = await getNonce(timestamp);
            console.log('Nonce obtained:', nonce);

            // Step 2: Sign the actual API request
            const params = {
                action: 'getmeas',
                client_id: CLIENT_ID,
                nonce: nonce,
            };

            const signature = sign(params, CLIENT_SECRET);

            // Step 3: Make the signed request
            const response = await axios.post(
                `${API_ENDPOINT}/measure`,
                new URLSearchParams({
                    ...params,
                    signature,
                    startdate: '1727825531',
                    enddate: '1728171131',
                }),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                }
            );

            console.log('Response:', response.data);
        } else {
            throw new Error('Either ACCESS_TOKEN or (CLIENT_ID and CLIENT_SECRET) must be set in environment variables');
        }
    } catch (error) {
        console.error('Error:', error);
    }
};

// Call the async function
// Uncomment the function you want to run:
createUserAndGetMeasurements(); // Use this to create a new user and get their measurements
//getMeasurements(); // Use this if you already have an ACCESS_TOKEN