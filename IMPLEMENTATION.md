# Implementation Summary: Multi-User Support & Weight Chart

## Features Implemented

### 1. Weight Chart Component (`components/WeightChart.tsx`)

- **SWR Integration**: Uses SWR for data fetching with automatic caching
- **Recharts Visualization**:
    - **Monthly Average Bar Chart**: Shows average weight per month in a bar chart format with value labels
    - **Daily Weight Line Chart**: Beautiful line chart showing weight history over time
- **Statistics Display**: Shows current weight, total change, min/max, and average
- **Responsive Design**: Adapts to full-width layout
- **Data Source**: Loads data from local JSON files via the weights API (pre-filtered to last 365 days)
- **Fetch Current Month**: Button to fetch latest data from Withings API with loading spinner
- **Last Updated**: Displays when the data was last updated based on file timestamps

### 2. Weights API Endpoint (`app/api/weights/route.ts`)

- **Data Loading**: Uses `WithingsDAO` to read all available months for a user
- **Weight Extraction**: Parses measurement groups to extract weight data (type 1)
- **Calculation**: Converts raw values using `value * 10^unit` formula
- **365-Day Filter**: Filters data to only last 365 days before sending to client (reduces data transfer)
- **Sorting**: Returns data sorted chronologically
- **Error Handling**: Proper error responses and logging

### 3. Multi-User Support

#### Navbar Component (`components/Navbar.tsx`)

- **User Switcher Dropdown**: Displays all connected users with their aliases
- **Visual Indicators**: Shows current active user with checkmark
- **User Display**: Shows user alias (e.g., "John", "Mom") instead of user ID
- **User ID Display**: Shows user ID as secondary information in dropdown
- **Add User Button**: Allows connecting additional Withings accounts
- **Responsive Design**: Clean UI with proper dark mode support

#### Updated Home Page (`app/page.tsx`)

- **Multi-User State Management**:
    - `allUsers`: Array of all connected user tokens with aliases
    - `currentUserid`: Currently active user
    - `loadUsers()`: Loads users from localStorage
    - `saveUsers()`: Persists users to localStorage
    - `switchToUser()`: Changes active user

- **User Persistence**:
    - Users stored in `localStorage` under key `withings_users`
    - Current user stored under key `withings_current_userid`
    - Each user has an alias field for friendly display names
    - Automatically restores last active user on page load

- **Add User Flow**:
    - Click "Add User" button → redirects to Withings OAuth
    - After successful auth, prompts for a user alias (e.g., "John", "Mom")
    - New user is added to the list with alias (or updated if already exists)
    - Automatically switches to the newly connected user

- **Disconnect Flow**:
    - Removes only the current user from the list
    - Automatically switches to another user if available
    - Clears state completely if no users remain

### 4. Full-Width Layout

- Removed max-width constraint from the main container
- Chart now uses full available screen width
- Better visualization of historical data

## Usage

### Viewing Weight Data

1. Connect a Withings account
2. Ensure you have historical data in the `data/{userid}/` directory
3. The weight chart will automatically load and display all available data

### Adding Multiple Users

1. Click the "Add User" button in the navbar
2. Authorize another Withings account
3. Switch between users using the dropdown menu

### Switching Users

1. Click on the user dropdown in the navbar
2. Select a different user from the list
3. The chart and all data will update automatically

## Technical Details

### Dependencies Added

- `swr`: Data fetching and caching library
- `recharts`: React charting library

### Data Flow

```
User clicks → WeightChart component
           → useSWR fetches from /api/weights?userid={userid}
           → API reads data files via WithingsDAO
           → Parses measurements and extracts weights
           → Filters to last 365 days (server-side)
           → Returns sorted, filtered weight data
           → Component calculates monthly averages
           → Renders bar chart (monthly avg) and line chart (daily) with statistics
```

### Storage Structure

**localStorage:**

```javascript
{
  "withings_users": [
    {
      "access_token": "...",
      "refresh_token": "...",
      "userid": "1372655",
      "expires_in": "...",
      "alias": "John"
    },
    // ... more users
  ],
  "withings_current_userid": "1372655"
}
```

**File system:**

```
data/
  └── {userid}/
      ├── 2024-01.json  (contains measurements)
      ├── 2024-02.json
      └── ...
```

## Notes

- The page uses `'use client'` directive and `export const dynamic = 'force-dynamic'` to avoid SSR issues with
  localStorage
- The HomeContent component is wrapped in a Suspense boundary to handle useSearchParams() properly
- Weight measurements are identified by `type: 1` in the Withings API response
- **Data is filtered to last 365 days on the API side** to reduce data transfer and improve performance
- The monthly average bar chart automatically groups data by month and calculates the mean weight
- Bar chart labels display the exact average weight value for each month
- The daily line chart automatically adjusts the number of x-axis labels based on data density
- Both charts use the same Y-axis domain for consistent visualization
- Dark mode is fully supported across all components

