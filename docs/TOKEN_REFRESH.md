# Token Refresh Implementation

## Overview

This document describes the automatic token refresh implementation for the Withings API integration.

## Problem

When access tokens expire (401 error with "invalid_token"), the system needs to automatically refresh them using the
refresh token and update the `.env.json` file so subsequent requests work.

## Solution

### 1. Created `lib/env-config.ts`

A utility module for managing the `.env.json` file with multi-user support:

- `readEnvConfig()` - Read the entire `.env.json` file
- `writeEnvConfig()` - Write the entire `.env.json` file
- `getTokensByUserId()` - Get tokens for a user by their userid
- `getTokensByUsername()` - Get tokens for a user by their username
- `updateUserTokens()` - Update tokens for a user by username
- `updateUserTokensByUserId()` - Update tokens for a user by userid

### 2. Enhanced `lib/withings.ts`

Added error detection:

- `WithingsError` interface for API errors
- `isInvalidTokenError()` - Detects 401 invalid token errors from Withings API

### 3. Updated `lib/withings-dao.ts`

Enhanced `fetchAndStore()` method to automatically handle token refresh:

1. Attempts to fetch measurements with current access token
2. If 401 error is detected, loads user's refresh token from `.env.json`
3. Calls Withings API to refresh the token
4. Updates `.env.json` with new tokens
5. Retries the request with the new access token

### 4. Created `app/api/refresh-token/route.ts`

New API endpoint for manually refreshing tokens:

- POST endpoint accepts `userid`
- Loads tokens from `.env.json`
- Refreshes the token using Withings API
- Updates `.env.json` with new tokens
- Returns new tokens to client

### 5. Updated `app/api/fetch-month/route.ts`

Enhanced to return refreshed tokens to the client:

- Calls `dao.fetchAndStore()` which handles token refresh internally
- After fetch completes, loads potentially updated tokens from `.env.json`
- Returns updated tokens in response so frontend can update localStorage

### 6. Updated `components/WeightChart.tsx`

Added callback prop for token updates:

- New `onTokensUpdated` callback prop
- When fetch-month API returns updated tokens, calls the callback
- Parent component can update localStorage and state

### 7. Updated `app/page.tsx`

Added token update handler:

- `handleTokensUpdated()` - Updates tokens in state and localStorage when refreshed
- Passes callback to `WeightChart` component

### 8. Updated `app/api/auth/callback/route.ts`

Now uses `WITHINGS_REDIRECT_URI` environment variable for all redirects instead of `request.nextUrl.origin`.

## Usage

### For Scripts (e.g., `scripts/fetch-year.ts`)

The token refresh is automatic. If a 401 error is detected:

1. Script will print "⚠ Access token expired, refreshing..."
2. Automatically refreshes the token using the refresh token from `.env.json`
3. Updates `.env.json` with new tokens
4. Prints "✓ Token refreshed successfully"
5. Retries the request

### For Web UI

When clicking "Fetch Current Month":

1. If token is expired, backend automatically refreshes it
2. New tokens are returned in the API response
3. Frontend updates localStorage with new tokens
4. User continues without interruption

### Manual Token Refresh

You can also manually refresh tokens via API:

```bash
curl -X POST http://localhost:3000/api/refresh-token \
  -H "Content-Type: application/json" \
  -d '{"userid": "1372655"}'
```

## Environment Variables Required

- `WITHINGS_CLIENT_ID` - Your Withings OAuth client ID
- `WITHINGS_CLIENT_SECRET` - Your Withings OAuth client secret
- `WITHINGS_REDIRECT_URI` - (Optional) OAuth redirect URI

## `.env.json` Format

```json
{
  "username1": {
    "access_token": "...",
    "refresh_token": "...",
    "userid": "...",
    "expires_in": "10800"
  },
  "username2": {
    "access_token": "...",
    "refresh_token": "...",
    "userid": "...",
    "expires_in": "10800"
  }
}
```

## Error Handling

The system detects 401 errors in multiple formats:

- `status: 401`
- Error message containing "invalid_token"
- Error message containing "The access token provided is invalid"

If token refresh fails, the original error is thrown and must be handled by the caller.

## Testing

To test token refresh:

1. Manually invalidate an access token in `.env.json` (change a character)
2. Run `npx tsx scripts/fetch-year.ts username 2025`
3. Should see token refresh message and successful completion
4. Check `.env.json` to verify tokens were updated

