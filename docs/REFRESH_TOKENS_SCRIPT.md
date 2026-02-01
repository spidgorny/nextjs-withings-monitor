# Token Refresh Script

## Overview

The `refresh-tokens.ts` script refreshes OAuth access tokens for all users stored in `.env.json`. This is useful for maintaining valid tokens without requiring users to re-authenticate.

## Usage

### Manual Refresh

To refresh tokens for all users:

```bash
npm run refresh-tokens
```

### Automated Refresh (Cron)

You can set up a cron job to automatically refresh tokens periodically. Since Withings tokens expire after 3 hours, you might want to refresh them daily or weekly.

#### Example Crontab Entry

Refresh tokens every day at 2 AM:

```bash
0 2 * * * cd /path/to/nextjs-withings-monitor && npm run refresh-tokens >> /var/log/withings-token-refresh.log 2>&1
```

Refresh tokens every 6 hours:

```bash
0 */6 * * * cd /path/to/nextjs-withings-monitor && npm run refresh-tokens >> /var/log/withings-token-refresh.log 2>&1
```

## What It Does

1. **Reads all users** from `.env.json`
2. **For each user:**
   - Uses the `refresh_token` to request a new `access_token`
   - Updates `.env.json` with the new tokens
   - Sets `issued_at` timestamp for tracking
3. **Reports results** - Shows success/failure for each user

## Output Example

```
🔄 Starting token refresh for all users...

Found 2 user(s): slawa, xxx

📝 Processing user: slawa (userid: 1372655)
  ⏳ Refreshing access token...
  ✅ Token refreshed successfully
  📅 New expiration: Jan 24, 2026, 11:30:00 PM

📝 Processing user: xxx (userid: 1234567)
  ⏳ Refreshing access token...
  ✅ Token refreshed successfully
  📅 New expiration: Jan 24, 2026, 11:30:05 PM

==================================================
📊 Summary:
  ✅ Success: 2
  ❌ Failed: 0
  📝 Total: 2
==================================================
```

## Error Handling

### Missing Environment Variables

If `WITHINGS_CLIENT_ID` or `WITHINGS_CLIENT_SECRET` are not set:

```
❌ Error: WITHINGS_CLIENT_ID and WITHINGS_CLIENT_SECRET must be set in environment
```

**Solution:** Set the environment variables in your shell or `.env` file.

### Invalid Refresh Token

If a user's refresh token is invalid or expired:

```
📝 Processing user: slawa (userid: 1372655)
  ⏳ Refreshing access token...
  ❌ Failed to refresh token: invalid_grant
```

**Solution:** The user needs to re-authenticate through the OAuth flow in the web UI.

### Network Issues

If the Withings API is unreachable:

```
❌ Failed to refresh token: Network error
```

**Solution:** Check your internet connection and try again.

## Exit Codes

- **0** - All tokens refreshed successfully
- **1** - One or more tokens failed to refresh, or fatal error

This makes the script suitable for use in automated systems that check exit codes.

## Integration with Other Scripts

This script works well with:

- **`fetch-all-users.ts`** - Fetches data for all users (uses tokens)
- **Cronjob wrapper** - Can be combined for automated data fetching

### Combined Workflow Example

```bash
#!/bin/bash
# Refresh tokens, then fetch data for all users

npm run refresh-tokens && npm run fetch-all
```

## Token Lifecycle

1. **Initial Auth** - User authorizes via OAuth → tokens saved to `.env.json`
2. **Token Expires** - After 3 hours (10,800 seconds)
3. **Auto-Refresh** - API endpoints automatically refresh when detecting 401 errors
4. **Manual Refresh** - This script can proactively refresh before expiration
5. **Re-Authentication** - If refresh token expires, user must re-authorize

## Best Practices

### When to Use This Script

✅ **Good use cases:**
- Periodic maintenance (daily/weekly cron)
- Before running batch data fetch operations
- After system downtime to ensure fresh tokens

❌ **Not needed:**
- Before every API call (endpoints auto-refresh)
- Multiple times per hour (wasteful)

### Monitoring

Monitor the log file to catch authentication issues:

```bash
tail -f /var/log/withings-token-refresh.log
```

Look for patterns of failures that might indicate:
- Users who need to re-authenticate
- API issues
- Configuration problems

## Security Notes

- Script reads credentials from `.env.json` (server-side only)
- Never exposes tokens in logs or console output
- Updates are atomic (file write is all-or-nothing)
- Failed refreshes don't corrupt existing tokens

## Troubleshooting

### Script won't run

**Check tsx is installed:**
```bash
npm install tsx --save-dev
```

### Permission denied

**Make script executable:**
```bash
chmod +x scripts/refresh-tokens.ts
```

### TypeScript errors

**Ensure all dependencies are installed:**
```bash
npm install
```

## Related Documentation

- [TOKEN_REFRESH.md](./TOKEN_REFRESH.md) - How token refresh works
- [CRONJOB_SETUP.md](./CRONJOB_SETUP.md) - Setting up automated tasks
- [TOKEN_STORAGE.md](./TOKEN_STORAGE.md) - Where tokens are stored
