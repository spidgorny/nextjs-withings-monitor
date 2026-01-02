import axios from 'axios';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config({ path: '.env', debug: true });

const CLIENT_ID = process.env.WITHINGS_CLIENT_ID;
const CLIENT_SECRET = process.env.WITHINGS_CLIENT_SECRET;
const API_ENDPOINT = 'https://wbsapi.withings.net';

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

const getMeasurements = async () => {
    if (!CLIENT_ID || !CLIENT_SECRET) {
        throw new Error('CLIENT_ID and CLIENT_SECRET must be set in environment variables');
    }

    try {
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
                ...params, signature,
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
    } catch (error) {
        console.error('Error:', error);
    }
};

// Call the async function
getMeasurements();