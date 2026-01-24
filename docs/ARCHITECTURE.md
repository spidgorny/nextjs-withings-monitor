# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  localStorage (Non-Sensitive Data Only)                         │
│  ├── withings_users: [{ userid, alias }]                       │
│  └── withings_current_userid: "1372655"                        │
│                                                                 │
│  React Components                                               │
│  ├── page.tsx (userid only)                                    │
│  └── WeightChart.tsx (userid only)                             │
│                                                                 │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │ HTTP Requests (userid only)
                     │
┌────────────────────▼────────────────────────────────────────────┐
│                      NEXT.JS SERVER                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  API Routes                                                     │
│  ├── /api/auth/callback                                        │
│  │   └── Saves tokens to .env.json                            │
│  ├── /api/measurements                                         │
│  │   └── Reads tokens from .env.json                          │
│  ├── /api/fetch-month                                          │
│  │   └── Reads tokens from .env.json                          │
│  └── /api/weights                                              │
│      └── Reads data from local files                           │
│                                                                 │
│  Token Management (lib/env-config.ts)                          │
│  ├── readEnvConfig()                                           │
│  ├── writeEnvConfig()                                          │
│  ├── getTokensByUserId()                                       │
│  ├── updateUserTokensByUserId()                                │
│  └── addOrUpdateUserTokens()                                   │
│                                                                 │
│  Withings API Client (lib/withings.ts)                         │
│  ├── getAccessToken()                                          │
│  ├── refreshAccessToken()                                      │
│  ├── getMeasurements()                                         │
│  └── isInvalidTokenError()                                     │
│                                                                 │
│  Data Access Layer (lib/withings-dao.ts)                       │
│  ├── fetchAndStore() - Auto token refresh                      │
│  ├── read()                                                    │
│  └── listMonths()                                              │
│                                                                 │
└────┬─────────────────────────────┬──────────────────────────────┘
     │                             │
     │                             │ API Calls (with tokens)
     │                             │
     ▼                             ▼
┌─────────────────────┐   ┌──────────────────────┐
│   .env.json         │   │  Withings API        │
│   (Server-Side)     │   │  wbsapi.withings.net │
├─────────────────────┤   └──────────────────────┘
│ {                   │
│   "slawa": {        │
│     "access_token", │
│     "refresh_token",│
│     "userid",       │
│     "expires_in"    │
│   },                │
│   "marina": {...}   │
│ }                   │
└─────────────────────┘
     │
     │ File I/O
     │
     ▼
┌─────────────────────┐
│   data/             │
│   ├── 1372655/      │
│   │   ├── 2024-01   │
│   │   └── 2025-01   │
│   └── 1393344/      │
│       └── 2025-01   │
└─────────────────────┘
```

## Data Flow

### 1. OAuth Authentication Flow
```
User → Browser → /api/auth/withings
                      ↓
              Withings OAuth Page
                      ↓
              User Authorizes
                      ↓
         /api/auth/callback (code)
                      ↓
         Exchange code for tokens
                      ↓
         Save to .env.json ✅
                      ↓
    Redirect with userid + username
                      ↓
         Browser (no tokens) ✅
```

### 2. Data Fetching Flow
```
User → Click "Fetch Month"
            ↓
  POST /api/fetch-month
  { userid: "1372655" }
            ↓
  Read tokens from .env.json
            ↓
  Call Withings API (with tokens)
            ↓
  Token expired? (401)
     ├─ NO → Store data → Return success
     └─ YES → Refresh token
                  ↓
          Update .env.json
                  ↓
          Retry API call
                  ↓
          Store data → Return success
```

### 3. Chart Display Flow
```
Browser → WeightChart Component
              ↓
    GET /api/weights?userid=1372655
              ↓
    Read from data/{userid}/*.json
              ↓
    Return weight data
              ↓
    Display chart (no API calls)
```

## Security Layers

```
┌─────────────────────────────────────────┐
│  Layer 1: Browser                       │
│  • No tokens stored                     │
│  • Only userid + alias in localStorage  │
│  • No sensitive data in DevTools        │
└─────────────────────────────────────────┘
              ↓ HTTPS
┌─────────────────────────────────────────┐
│  Layer 2: API Endpoints                 │
│  • Validate userid                      │
│  • Check user exists in .env.json       │
│  • Never expose tokens in response      │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Layer 3: Token Management              │
│  • Read-only access to .env.json        │
│  • Automatic token refresh              │
│  • Update tokens on refresh             │
└─────────────────────────────────────────┘
              ↓ HTTPS
┌─────────────────────────────────────────┐
│  Layer 4: Withings API                  │
│  • OAuth 2.0 authentication             │
│  • Token-based access                   │
│  • Rate limiting protection             │
└─────────────────────────────────────────┘
```

## Cronjob Integration

```
┌──────────────────┐
│  Cron Schedule   │
│  (e.g. daily)    │
└────────┬─────────┘
         │
         ▼
┌─────────────────────────────────┐
│  scripts/fetch-all-users.ts     │
│  1. Read all users from .env    │
│  2. For each user:              │
│     • Fetch current month       │
│     • Handle token refresh      │
│     • Update .env.json          │
│     • Store in data/            │
│  3. Log results                 │
└─────────────────────────────────┘
```

## Component Hierarchy

```
Home
 ├── Navbar
 │   ├── User selector dropdown
 │   └── "Authorize Another User" button
 │
 └── HomeContent
     ├── Error display
     ├── Connect button (if no users)
     └── User dashboard (if user selected)
         ├── WeightChart
         │   ├── Monthly average bar chart
         │   ├── Daily weight line chart
         │   └── "Fetch Current Month" button
         │
         ├── "Get Measurements" button
         ├── "Disconnect" button
         └── Token info (debugging only)
```

## Key Design Decisions

1. **Server-Side Token Storage**: Tokens never leave the server
2. **Userid-Based API**: All endpoints use userid for authentication
3. **Automatic Refresh**: 401 errors trigger token refresh transparently
4. **Local Data Cache**: Monthly data cached in JSON files
5. **Multi-User Support**: Single .env.json manages all users
6. **Cronjob Ready**: Automated fetching without browser interaction
