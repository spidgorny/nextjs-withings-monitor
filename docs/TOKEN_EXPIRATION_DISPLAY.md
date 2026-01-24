# Token Expiration Display Implementation

## Summary

Successfully added token expiration time display on the home page for each user. The system now tracks when tokens are issued and calculates the remaining time until expiration.

---

## Changes Made

### 1. Updated `lib/env-config.ts`

**Added `issued_at` field to UserTokens:**
```typescript
export interface UserTokens {
  access_token: string;
  refresh_token: string;
  userid: string;
  expires_in: string;
  issued_at?: string; // ISO timestamp when token was issued/refreshed
}
```

This timestamp allows us to calculate when the token will expire.

### 2. Updated Token Creation & Refresh Points

All places where tokens are created or refreshed now include the `issued_at` timestamp:

**Files Updated:**
- `app/api/auth/callback/route.ts` - OAuth callback sets `issued_at`
- `lib/withings-dao.ts` - Token refresh sets `issued_at`
- `app/api/measurements/route.ts` - Token refresh sets `issued_at`

**Example:**
```typescript
await addOrUpdateUserTokens(tokens.userid, {
  access_token: tokens.access_token,
  refresh_token: tokens.refresh_token,
  userid: tokens.userid,
  expires_in: tokens.expires_in.toString(),
  issued_at: new Date().toISOString(), // ← NEW
});
```

### 3. Updated `/api/users` Endpoint

**Added expiration calculation:**
```typescript
export interface User {
  userid: string;
  username: string;
  expiresInSeconds?: number;  // Calculated remaining seconds
  tokenExpired?: boolean;     // Whether token has expired
  issuedAt?: string;          // When token was issued
}
```

**Calculation Logic:**
```typescript
if (issuedAt) {
  const issuedTime = new Date(issuedAt).getTime();
  const expiresTime = issuedTime + expiresIn * 1000;
  const now = Date.now();
  const remainingMs = expiresTime - now;
  
  expiresInSeconds = Math.floor(remainingMs / 1000);
  tokenExpired = expiresInSeconds <= 0;
}
```

### 4. Updated `hooks/useUsers.ts`

Added new fields to User interface:
```typescript
export interface User {
  userid: string;
  username: string;
  expiresInSeconds?: number;
  tokenExpired?: boolean;
  issuedAt?: string;
}
```

### 5. Updated Home Page (`app/page.tsx`)

**Added time formatting function:**
```typescript
const formatTimeRemaining = (seconds: number | undefined): string => {
  if (seconds === undefined) return 'Unknown';
  if (seconds <= 0) return 'Expired';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  else if (minutes > 0) return `${minutes}m ${secs}s`;
  else return `${secs}s`;
};
```

**Added token status display on user cards:**
```tsx
{user.expiresInSeconds !== undefined && (
  <div className="mt-2 flex items-center gap-1">
    <svg className={`h-3 w-3 ${user.tokenExpired ? 'text-red-500' : 'text-green-500'}`}>
      {/* Clock icon */}
    </svg>
    <span className={`text-xs ${user.tokenExpired ? 'text-red-600' : 'text-green-600'}`}>
      {user.tokenExpired 
        ? 'Token expired' 
        : `Expires in ${formatTimeRemaining(user.expiresInSeconds)}`
      }
    </span>
  </div>
)}
```

---

## Visual Display

### User Card with Token Status

Each user card now shows:
```
┌─────────────────────────────────┐
│  👤 [Avatar]                    │
│                                 │
│  John                           │
│  @slawa                         │
│  🕐 Expires in 2h 45m           │ ← NEW
│                                 │
│  View Dashboard →               │
└─────────────────────────────────┘
```

### Status Colors

- **Green** with clock icon: Token is valid
  - Shows: "Expires in 2h 45m"
  
- **Red** with clock icon: Token has expired
  - Shows: "Token expired"

### Time Format Examples

- `2h 45m` - More than an hour remaining
- `45m 30s` - Less than an hour
- `30s` - Less than a minute
- `Token expired` - Expired token
- Not shown if no `issued_at` timestamp (legacy tokens)

---

## Data Flow

### When User Authorizes:
```
1. Withings OAuth → Get tokens
2. Server saves to .env.json with issued_at
3. Frontend displays "Expires in 3h 0m"
```

### As Time Passes:
```
1. SWR revalidates /api/users
2. Backend calculates remaining time
3. Frontend updates display
4. "Expires in 2h 45m" → "Expires in 2h 44m"
```

### When Token Expires:
```
1. expiresInSeconds becomes negative
2. tokenExpired flag set to true
3. Display shows "Token expired" in red
4. Next API call will auto-refresh token
5. New issued_at timestamp saved
6. Display updates to "Expires in 3h 0m"
```

---

## Token Lifecycle

### Withings Token Details:
- **Duration:** 3 hours (10,800 seconds)
- **Auto-refresh:** Yes, when used and expired
- **Stored in:** `.env.json` on server

### Tracking:
```json
{
  "slawa": {
    "access_token": "...",
    "refresh_token": "...",
    "userid": "1372655",
    "expires_in": "10800",
    "issued_at": "2026-01-24T20:00:00.000Z"  ← Tracks when issued
  }
}
```

### Calculation:
```
issued_at: 2026-01-24T20:00:00.000Z
expires_in: 10800 seconds (3 hours)
expires_at: 2026-01-24T23:00:00.000Z

Current time: 2026-01-24T22:15:00.000Z
Remaining: 45 minutes
Display: "Expires in 45m 0s"
```

---

## Benefits

### 1. **Visibility**
- Users can see when tokens need refreshing
- No surprise authentication failures

### 2. **Proactive Monitoring**
- Identify stale tokens before they're needed
- Can manually trigger refresh if needed

### 3. **Automatic Handling**
- Expired tokens auto-refresh on next API call
- Display updates immediately after refresh

### 4. **Better UX**
- Color-coded status (green/red)
- Human-readable time format
- Clock icon for quick scanning

---

## Migration Notes

### For Existing Users:

**Old `.env.json` (no `issued_at`):**
```json
{
  "slawa": {
    "access_token": "...",
    "refresh_token": "...",
    "userid": "1372655",
    "expires_in": "10800"
  }
}
```

**Result:**
- No expiration time displayed on home page
- Works normally otherwise
- `issued_at` added on next token refresh

**After First Refresh:**
```json
{
  "slawa": {
    "access_token": "...",
    "refresh_token": "...",
    "userid": "1372655",
    "expires_in": "10800",
    "issued_at": "2026-01-24T20:00:00.000Z"
  }
}
```

**Result:**
- Expiration time now displayed
- Updates in real-time via SWR

---

## SWR Revalidation

The token status updates automatically because:

1. **SWR revalidates on focus** - When you switch back to the tab
2. **Revalidates on reconnect** - When network connection restored
3. **Calculation is server-side** - Always accurate

This means the countdown updates automatically without client-side timers!

---

## Testing Checklist

- ✅ New OAuth shows expiration time
- ✅ Time counts down correctly
- ✅ Expired tokens show in red
- ✅ Format displays correctly (hours/minutes/seconds)
- ✅ Legacy tokens (no issued_at) don't break
- ✅ Token refresh updates issued_at
- ✅ Display updates after refresh
- ✅ Color coding works (green/red)
- ✅ Clock icon displays

---

## Future Enhancements

Possible additions:
- Real-time countdown timer (client-side)
- Warning when token expires soon (< 30 min)
- Manual refresh button on home page
- Notification when token expires
- Token history/audit log

---

## Summary

Successfully implemented token expiration display! The home page now shows:

- ✅ Time remaining until token expires
- ✅ Color-coded status (green = valid, red = expired)
- ✅ Human-readable format (2h 45m)
- ✅ Clock icon for visual recognition
- ✅ Automatic updates via SWR
- ✅ Backwards compatible with old data

Users can now easily monitor their token status at a glance! 🎉
