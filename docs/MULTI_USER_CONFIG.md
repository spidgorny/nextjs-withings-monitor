# Multi-User .env.json Support

## Overview

The `scripts/fetch-year.ts` script has been updated to support multiple users in the `.env.json` file.

## .env.json Format

### Multi-User Format (Recommended)

```json
{
  "slawa": {
    "access_token": "xxx",
    "refresh_token": "xxx",
    "userid": "1372655",
    "expires_in": "10800"
  },
  "marina": {
    "access_token": "xxx",
    "refresh_token": "xxx",
    "userid": "1393344",
    "expires_in": "10800"
  }
}
```

### Legacy Single-User Format (Still Supported)

```json
{
  "access_token": "your_access_token",
  "refresh_token": "your_refresh_token",
  "userid": "your_user_id",
  "expires_in": "10800"
}
```

Or:

```json
{
  "WITHINGS_ACCESS_TOKEN": "your_access_token",
  "WITHINGS_USER_ID": "your_user_id"
}
```

## Usage

### Multi-User Format

When using the multi-user format, you must specify the username as the first argument:

```bash
# Fetch data for user 'slawa' for year 2024
npm run fetch-year slawa 2024

# Fetch data for user 'marina' for year 2025
npm run fetch-year marina 2025

# Fetch data for user 'slawa' for current year (2025)
npm run fetch-year slawa
```

### Legacy Format

When using the legacy format, you can omit the username:

```bash
# Fetch data for year 2024
npm run fetch-year 2024

# Fetch data for current year
npm run fetch-year
```

## Command Line Arguments

The script accepts arguments in the following order:

```bash
npx tsx scripts/fetch-year.ts [username] [year]
```

### Examples

| Command | Username | Year | Description |
|---------|----------|------|-------------|
| `npx tsx scripts/fetch-year.ts` | `undefined` | `2025` | Legacy mode, current year |
| `npx tsx scripts/fetch-year.ts 2024` | `undefined` | `2024` | Legacy mode, specific year |
| `npx tsx scripts/fetch-year.ts slawa` | `slawa` | `2025` | Multi-user, current year |
| `npx tsx scripts/fetch-year.ts slawa 2024` | `slawa` | `2024` | Multi-user, specific year |
| `npx tsx scripts/fetch-year.ts marina 2023` | `marina` | `2023` | Multi-user, specific year |

## Error Handling

### Username Not Found

If you specify a username that doesn't exist in `.env.json`:

```
Error: User "unknown" not found in .env.json. Available users: slawa, marina
```

### Multi-User Format Without Username

If the `.env.json` is in multi-user format but no username is provided:

```
Error: Multi-user .env.json detected. Please provide a username.
Available users: slawa, marina
Usage: npx tsx scripts/fetch-year.ts <username> [year]
```

### Invalid Year

```
Invalid year. Usage: npx tsx scripts/fetch-year.ts [username] [year]
Examples:
  npx tsx scripts/fetch-year.ts slawa 2025
  npx tsx scripts/fetch-year.ts slawa       (uses current year)
  npx tsx scripts/fetch-year.ts 2024       (legacy format)
```

## Data Storage

Data is stored in separate directories per user:

```
data/
  ├── 1372655/          # slawa's data
  │   ├── 2024-01.json
  │   ├── 2024-02.json
  │   └── ...
  └── 1393344/          # marina's data
      ├── 2024-01.json
      ├── 2024-02.json
      └── ...
```

## Migration from Legacy Format

To migrate from legacy format to multi-user format:

**Old `.env.json`:**
```json
{
  "access_token": "abc123",
  "refresh_token": "xyz789",
  "userid": "1372655"
}
```

**New `.env.json`:**
```json
{
  "username1": {
    "access_token": "abc123",
    "refresh_token": "xyz789",
    "userid": "1372655",
    "expires_in": "10800"
  }
}
```

Then update your commands from:
```bash
npm run fetch-year 2024
```

To:
```bash
npm run fetch-year username1 2024
```

