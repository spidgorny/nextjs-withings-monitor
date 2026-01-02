# Multi-User .env.json Support - Implementation Summary

## Changes Made

### 1. Updated `scripts/fetch-year.ts`

**New Features:**
- ✅ Supports multi-user `.env.json` format
- ✅ Backwards compatible with legacy single-user format
- ✅ Username as first command-line argument
- ✅ Intelligent argument parsing (detects year vs username)
- ✅ Clear error messages with available users listed

**Function Changes:**

#### `loadConfig(username?: string)`
- Now accepts optional `username` parameter
- Detects multi-user format and extracts user config
- Falls back to legacy format if username not provided
- Provides helpful error messages listing available users

#### `fetchYear(username: string | undefined, year: number)`
- Updated to accept `username` parameter
- Passes username to `loadConfig()`

#### Command-Line Argument Parsing
```typescript
// Smart parsing that handles:
npx tsx scripts/fetch-year.ts                    // → username=undefined, year=2025
npx tsx scripts/fetch-year.ts 2024               // → username=undefined, year=2024
npx tsx scripts/fetch-year.ts slawa              // → username="slawa", year=2025
npx tsx scripts/fetch-year.ts slawa 2024         // → username="slawa", year=2024
```

### 2. Created `scripts/validate-env.ts`

**Purpose:** Validate and display information about `.env.json` configuration

**Features:**
- Detects format (multi-user vs legacy)
- Lists all available users
- Shows user IDs and token status
- Provides usage examples

**Usage:**
```bash
npm run validate-env
```

### 3. Updated Documentation

#### `README.md`
- Added multi-user format examples
- Updated fetch-year usage instructions
- Documented both formats side-by-side

#### `docs/MULTI_USER_CONFIG.md` (New)
- Comprehensive guide to multi-user support
- Usage examples with different argument combinations
- Error handling documentation
- Migration guide from legacy format

### 4. Updated `package.json`

Added new script:
```json
{
  "scripts": {
    "validate-env": "tsx scripts/validate-env.ts"
  }
}
```

## .env.json Format

### Multi-User Format (Current)

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

### Legacy Format (Still Supported)

```json
{
  "access_token": "...",
  "refresh_token": "...",
  "userid": "...",
  "expires_in": "10800"
}
```

## Usage Examples

### Multi-User Format

```bash
# Validate configuration
npm run validate-env

# Fetch data for Slawa, year 2024
npm run fetch-year slawa 2024

# Fetch data for Marina, year 2025
npm run fetch-year marina 2025

# Fetch data for Slawa, current year (2025)
npm run fetch-year slawa
```

### Legacy Format

```bash
# Fetch data for specific year
npm run fetch-year 2024

# Fetch data for current year
npm run fetch-year
```

## Error Handling

### User Not Found
```
✗ Error: User "unknown" not found in .env.json. Available users: slawa, marina
```

### Multi-User Without Username
```
✗ Error: Multi-user .env.json detected. Please provide a username.
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

## Data Directory Structure

Each user's data is stored in a separate directory:

```
data/
  ├── 1372655/          # Slawa's data (userid)
  │   ├── 2024-01.json
  │   ├── 2024-02.json
  │   └── ...
  └── 1393344/          # Marina's data (userid)
      ├── 2024-01.json
      ├── 2024-02.json
      └── ...
```

## Testing

All scripts have been updated and tested for:
- ✅ TypeScript compilation (no errors)
- ✅ Multi-user config parsing
- ✅ Legacy config backward compatibility
- ✅ Argument parsing logic
- ✅ Error handling and messaging

## Files Modified

1. ✏️ `scripts/fetch-year.ts` - Core functionality update
2. ✏️ `README.md` - Usage documentation
3. ✏️ `package.json` - New script added
4. ✨ `scripts/validate-env.ts` - New validation tool
5. ✨ `docs/MULTI_USER_CONFIG.md` - Comprehensive documentation

## Benefits

1. **Multi-User Support**: Can fetch data for multiple Withings accounts
2. **Backward Compatible**: Existing single-user setups continue to work
3. **Clear UX**: Helpful error messages guide users to correct usage
4. **Validated**: New validation script helps verify configuration
5. **Well Documented**: Complete documentation with examples

## Next Steps

Users can now:
1. Update their `.env.json` to multi-user format
2. Run `npm run validate-env` to verify configuration
3. Fetch data for any user: `npm run fetch-year <username> <year>`
4. View weight charts for any user via the web interface

