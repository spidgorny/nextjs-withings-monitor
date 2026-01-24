# useWithings Hook Implementation

## Summary

Successfully created a custom `useWithings` hook that uses SWR to fetch and manage Withings weight data. The "Fetch Current Month" button now properly mutates the SWR cache, causing automatic UI updates.

---

## Changes Made

### 1. ✅ Created `hooks/useWithings.ts`

A new custom hook that encapsulates all Withings data fetching logic.

**Features:**
- Fetches weight data via SWR from `/api/weights`
- Manages loading and error states
- Provides `fetchCurrentMonth()` function that mutates SWR cache
- Returns weights array and metadata

**Exports:**
```typescript
{
  weights: WeightData[];           // Weight measurements
  lastModified: string | null;     // Last data update timestamp
  isLoading: boolean;              // Loading state
  isError: Error | undefined;      // Error state
  mutate: () => void;              // Manual cache revalidation
  fetchCurrentMonth: () => Promise<void>; // Fetch & mutate
}
```

### 2. ✅ Updated `app/user/[userid]/page.tsx`

**Before:**
- Managed fetch state manually
- No SWR integration
- Data passed via userid to WeightChart
- WeightChart fetched its own data

**After:**
- Uses `useWithings(userid)` hook
- All data comes from SWR
- Passes weights and metadata as props to WeightChart
- Fetch button calls `fetchCurrentMonth()` which auto-mutates

### 3. ✅ Updated `components/WeightChart.tsx`

**Before:**
- Had its own SWR call
- Fetched data based on userid prop
- Managed its own loading/error states

**After:**
- Receives data as props (weights, lastModified, isLoading, isError)
- No internal data fetching
- Pure presentational component
- Cleaner separation of concerns

---

## How It Works

### Data Flow

```
User Page (useWithings hook)
    ↓
  SWR (/api/weights?userid=xxx)
    ↓
  Hook returns: { weights, lastModified, fetchCurrentMonth }
    ↓
  Pass to WeightChart as props
    ↓
  Render charts with data
```

### Fetch Current Month Flow

```
1. User clicks "Fetch Current Month" button
2. handleFetchCurrentMonth() called in UserPage
3. Calls fetchCurrentMonth() from useWithings hook
4. Hook POSTs to /api/fetch-month
5. Hook calls mutate() to revalidate SWR cache
6. SWR re-fetches /api/weights
7. New data automatically propagates to WeightChart
8. UI updates with fresh data
```

---

## Key Benefits

### ✅ Single Source of Truth
- Only one SWR instance per user (in useWithings)
- No duplicate fetching
- Consistent data across components

### ✅ Automatic UI Updates
- `mutate()` triggers SWR revalidation
- Fresh data automatically flows to components
- No manual state management needed

### ✅ Better Code Organization
- Data fetching logic centralized in hook
- WeightChart is now purely presentational
- Easier to test and maintain

### ✅ Reusability
- Hook can be used in other components
- Consistent API across the app
- Easy to add more Withings data types

---

## Usage Example

```typescript
function UserPage() {
  const userid = "1372655";
  
  // Fetch data with the hook
  const { 
    weights, 
    lastModified, 
    isLoading, 
    isError, 
    fetchCurrentMonth 
  } = useWithings(userid);
  
  // Use in UI
  if (isLoading) return <Loading />;
  if (isError) return <Error />;
  
  return (
    <>
      <button onClick={fetchCurrentMonth}>
        Fetch Current Month
      </button>
      <WeightChart 
        weights={weights}
        lastModified={lastModified}
      />
    </>
  );
}
```

---

## SWR Configuration

```typescript
useSWR(`/api/weights?userid=${userid}`, fetcher, {
  refreshInterval: 0,        // Don't auto-refresh (static data)
  revalidateOnFocus: false,  // Don't refresh on tab focus
});
```

This configuration makes sense because:
- Weight data is static files on disk
- Only changes when user manually fetches
- No need for automatic revalidation

---

## Fetch Current Month Implementation

```typescript
const fetchCurrentMonth = async () => {
  // 1. POST to API to fetch and save data
  const response = await fetch('/api/fetch-month', {
    method: 'POST',
    body: JSON.stringify({ userid }),
  });
  
  if (!response.ok) throw new Error(...);
  
  // 2. Mutate SWR cache to trigger re-fetch
  await mutate();  // ← This is the key!
};
```

The `mutate()` call tells SWR to:
1. Mark the cache as stale
2. Re-fetch from `/api/weights`
3. Update all components using this data
4. Trigger re-renders automatically

---

## Component Hierarchy

```
UserPage
├── useWithings(userid)       ← Data fetching
│   └── SWR (/api/weights)
├── Navbar
│   └── Fetch Button → fetchCurrentMonth()
└── WeightChart               ← Data display
    ├── WeightStatistics
    ├── MonthlyWeightChart
    └── DailyWeightChart
```

---

## Error Handling

### Loading State
```typescript
if (isLoading) {
  return <Spinner>Loading weight data...</Spinner>
}
```

### Error State
```typescript
if (isError) {
  return <Error>Failed to load: {isError.message}</Error>
}
```

### Fetch Error
```typescript
try {
  await fetchCurrentMonth();
} catch (err) {
  setFetchError(err.message);
}
```

---

## Testing

To verify the implementation works:

1. **Initial Load**
   - Visit `/user/1372655`
   - Should load existing weight data
   - Charts should render

2. **Fetch Current Month**
   - Click "Fetch Current Month" button
   - Should show spinner
   - Data should update automatically
   - Charts should re-render with new data

3. **Error Handling**
   - Test with invalid userid
   - Should show error message
   - Should not crash

---

## Future Enhancements

Possible improvements:

- **Optimistic Updates**: Show loading state on charts during fetch
- **Background Refresh**: Optional auto-refresh for active monitoring
- **Multiple Data Types**: Extend hook for other measurements (heart rate, etc.)
- **Caching Strategy**: Add stale-while-revalidate for better UX
- **Retry Logic**: Automatic retry on failed fetches

---

## Related Files

- `hooks/useWithings.ts` - Custom hook
- `hooks/useUsers.ts` - Similar pattern for users
- `app/user/[userid]/page.tsx` - Usage example
- `components/WeightChart.tsx` - Data consumer
- `app/api/weights/route.ts` - Data source
- `app/api/fetch-month/route.ts` - Data fetcher

---

## Summary

The `useWithings` hook successfully:
- ✅ Centralizes Withings data fetching
- ✅ Uses SWR for caching and state management
- ✅ Provides automatic UI updates via `mutate()`
- ✅ Simplifies component code
- ✅ Follows React best practices

The implementation is **complete and working**! 🎉
