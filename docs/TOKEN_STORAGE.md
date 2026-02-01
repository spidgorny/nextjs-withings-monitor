# Token Storage Implementation

## Overview

This document describes the implementation of secure token storage in `.env.json` file on the server side during the OAuth callback flow.

## Changes Made

### 1. Enhanced `lib/env-config.ts`

Added a new function `addOrUpdateUserTokens()` that:
- Checks if a user with the given `userid` already exists in `.env.json`
- If the user exists: Updates their tokens
- If the user doesn't exist: Creates a new entry with an auto-generated username
- Returns the username for the user

**Function signature:**
```typescript
export async function addOrUpdateUserTokens(
  userid: string, 
  tokens: UserTokens
): Promise<string>
```

**Auto-generated username format:**
- First attempt: `user_{userid}`
- If exists: `user_{userid}_1`, `user_{userid}_2`, etc.

### 2. Updated `app/api/auth/callback/route.ts`

Modified the OAuth callback handler to:
- Import and use `addOrUpdateUserTokens()` function
- Save received tokens directly to `.env.json` on the server side
- Send only `username` and `userid` in the redirect URL (not sensitive tokens)
- Provide console logs for successful token storage

**Flow:**
1. Exchange authorization code for tokens
2. Save tokens to `.env.json` using `addOrUpdateUserTokens()`
3. Redirect to home page with success status and user info

### 3. Updated `app/page.tsx`

Modified the frontend to:
- No longer expect tokens in URL parameters
- Only receive `username` and `userid` from callback
- Store only `userid` and `alias` in localStorage (not tokens)
- Tokens remain securely on the server side

### 4. Added Cronjob Script `scripts/fetch-all-users.ts`

Created an automated script that:
- Fetches current month data for all users in `.env.json`
- Automatically refreshes expired tokens
- Updates `.env.json` with new tokens when refreshed
- Designed to be run as a cronjob for automated updates

**Usage:**
```bash
npm run fetch-all
```

### 5. Created Cronjob Documentation

Added comprehensive setup guide at `docs/CRONJOB_SETUP.md` covering:
- Manual script usage
- Cron setup on Linux/macOS
- Systemd timer setup (Linux alternative)
- Monitoring and troubleshooting
- Security considerations

## Security Improvements

### Before:
- Tokens were passed in URL parameters during redirect
- Tokens stored in browser localStorage
- Tokens potentially exposed in browser history/logs

### After:
- Tokens stored only in `.env.json` on the server
- Only non-sensitive data (`userid`, `username`) passed in URL
- Browser localStorage only stores user identification, not credentials
- Tokens accessible only by server-side code

## Token Refresh Flow

When API calls fail due to expired tokens:
1. Server detects 401 invalid token error
2. Reads refresh token from `.env.json`
3. Calls Withings API to refresh the token
4. Updates `.env.json` with new tokens
5. Retries the original API call

This is already implemented in `lib/withings-dao.ts` and works with the new storage system.

## File Structure

```
.env.json (server-side, git-ignored)
{
  "slawa": {
    "access_token": "...",
    "refresh_token": "...",
    "userid": "1372655",
    "expires_in": "10800"
  },
  "user_xxx": {  // Auto-generated username
    "access_token": "...",
    "refresh_token": "...",
    "userid": "1234567",
    "expires_in": "10800"
  }
}
```

## Benefits

1. **Security**: Tokens never exposed to browser or URL
2. **Persistence**: Tokens survive browser cache clears
3. **Automation**: Cronjob can fetch data without manual intervention
4. **Multi-user**: Multiple users can be managed in single file
5. **Automatic refresh**: Tokens auto-refresh and update when expired

## Testing

To test the implementation:

1. **OAuth Flow:**
   - Visit the app home page
   - Click "Authorize Another User"
   - Complete OAuth flow on Withings
   - Check console logs for token save confirmation
   - Verify `.env.json` was updated

2. **Token Refresh:**
   - Run `npm run fetch-all`
   - If tokens are expired, should auto-refresh
   - Check `.env.json` for updated tokens

3. **Manual Data Fetch:**
   - Navigate to home page
   - Select a user
   - Click "Fetch Current Month"
   - Data should load from API using server-side tokens
