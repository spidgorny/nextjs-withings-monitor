import axios from 'axios';

const API_ENDPOINT = 'https://wbsapi.withings.net';

export interface WithingsTokens {
    access_token: string;
    refresh_token: string;
    userid: string;
    expires_in: number;
}

/**
 * Generate the Withings OAuth authorization URL
 */
export function getAuthorizationUrl(
    clientId: string,
    redirectUri: string,
    state?: string
): string {
    const scope = 'user.info,user.metrics,user.activity';
    const params = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: scope,
        ...(state && { state }),
    });

    return `https://account.withings.com/oauth2_user/authorize2?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function getAccessToken(
    clientId: string,
    clientSecret: string,
    authorizationCode: string,
    redirectUri: string
): Promise<WithingsTokens> {
    try {
        const response = await axios.post(
            `${API_ENDPOINT}/v2/oauth2`,
            new URLSearchParams({
                action: 'requesttoken',
                grant_type: 'authorization_code',
                client_id: clientId,
                client_secret: clientSecret,
                code: authorizationCode,
                redirect_uri: redirectUri,
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        );

        if (response.data.status !== 0) {
            throw new Error(`Withings API Error: ${JSON.stringify(response.data)}`);
        }

        return response.data.body;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            throw new Error(`Failed to get access token: ${error.response?.data?.error || error.message}`);
        }
        throw error;
    }
}

/**
 * Refresh an expired access token
 */
export async function refreshAccessToken(
    clientId: string,
    clientSecret: string,
    refreshToken: string
): Promise<WithingsTokens> {
    try {
        const response = await axios.post(
            `${API_ENDPOINT}/v2/oauth2`,
            new URLSearchParams({
                action: 'requesttoken',
                grant_type: 'refresh_token',
                client_id: clientId,
                client_secret: clientSecret,
                refresh_token: refreshToken,
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        );

        if (response.data.status !== 0) {
            throw new Error(`Withings API Error: ${JSON.stringify(response.data)}`);
        }

        return response.data.body;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            throw new Error(`Failed to refresh token: ${error.response?.data?.error || error.message}`);
        }
        throw error;
    }
}

/**
 * Get measurements from Withings API
 */
export async function getMeasurements(
    accessToken: string,
    options?: {
        startdate?: number;
        enddate?: number;
        meastypes?: string;
    }
) {
    try {
        const params: Record<string, string> = {
            action: 'getmeas',
            meastypes: options?.meastypes || '1,4,5,6,8,11,12,54,71,73,76,77,88,91,123',
        };

        if (options?.startdate) {
            params.startdate = options.startdate.toString();
        }
        if (options?.enddate) {
            params.enddate = options.enddate.toString();
        }

        const response = await axios.post(
            `${API_ENDPOINT}/measure`,
            new URLSearchParams(params),
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        );

        if (response.data.status !== 0) {
            throw new Error(`Withings API Error: ${JSON.stringify(response.data)}`);
        }

        return response.data.body;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            throw new Error(`Failed to get measurements: ${error.response?.data?.error || error.message}`);
        }
        throw error;
    }
}
