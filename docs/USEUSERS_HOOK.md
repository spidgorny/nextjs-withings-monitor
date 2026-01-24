# useUsers Custom Hook

## Summary

Successfully extracted SWR users functionality into a reusable custom hook `useUsers` that can be shared across all components.

---

## New File Created

### `hooks/useUsers.ts`

A custom React hook that encapsulates all user-related logic and SWR functionality.

**Exports:**
```typescript
export interface User {
  userid: string;
  username: string;
}

export interface UserWithAlias extends User {
  alias?: string;
}

export function useUsers() {
  // Returns object with utilities
}
```

**Returned Properties:**
```typescript
{
  users: User[];                           // Raw users from API
  usersWithAliases: UserWithAlias[];      // Users with aliases from localStorage
  isLoading: boolean;                      // Loading state
  isError: Error | undefined;              // Error state
  mutate: () => void;                      // Revalidate SWR cache
  getUserAlias: (userid: string) => string; // Get alias for a user
  saveUserAlias: (userid, alias) => void;   // Save alias to localStorage
  findUser: (userid) => User | undefined;   // Find user by userid
  findUserWithAlias: (userid) => UserWithAlias | undefined; // Find with alias
}
```

---

## Updated Files

### 1. `app/page.tsx` (Home Page)

**Before:**
```typescript
// Inline SWR and user management
const { data: usersData, error: usersError, mutate: mutateUsers } = 
  useSWR<{ users: User[] }>('/api/users', fetcher);

const getUserAliases = () => { ... };
const saveUserAlias = () => { ... };
const getUsersWithAliases = () => { ... };
```

**After:**
```typescript
// Clean hook usage
const { usersWithAliases, isLoading, isError, mutate, saveUserAlias, getUserAlias } = 
  useUsers();
```

**Benefits:**
- ✅ 40+ lines of code removed
- ✅ Cleaner component logic
- ✅ Reusable across components

### 2. `app/user/[userid]/page.tsx` (User Page)

**Before:**
```typescript
// Inline SWR
const { data: usersData, error: usersError } = useSWR(...);
const getUserAlias = (userid: string) => { ... };
const currentUser = usersData?.users.find(...);
```

**After:**
```typescript
// Clean hook usage
const { findUser, getUserAlias, isLoading, isError } = useUsers();
const currentUser = findUser(userid);
```

**Benefits:**
- ✅ Simpler user lookup
- ✅ Consistent API across pages
- ✅ Less code duplication

### 3. `components/Navbar.tsx`

**Before:**
```typescript
// Inline SWR and alias logic
const { data: usersData } = useSWR(...);
const getUserAliases = () => { ... };
const getUsersWithAliases = () => { ... };
const users = getUsersWithAliases();
```

**After:**
```typescript
// Clean hook usage
const { usersWithAliases } = useUsers();
```

**Benefits:**
- ✅ Component focused on rendering
- ✅ Data fetching abstracted
- ✅ Automatic revalidation

---

## Hook Features

### 🔄 **Automatic SWR Revalidation**
- Revalidates on window focus
- Revalidates on network reconnect
- Cached across components (same SWR key)

### 💾 **localStorage Integration**
- Reads/writes user aliases
- Handles SSR safely (`typeof window` check)
- JSON serialization/deserialization

### 🔍 **Helper Functions**
- `findUser()` - Find by userid
- `findUserWithAlias()` - Find with alias attached
- `getUserAlias()` - Get alias for specific user
- `saveUserAlias()` - Save alias to localStorage

### 📊 **State Management**
- `isLoading` - Loading state
- `isError` - Error state
- `mutate()` - Manual cache revalidation

---

## Usage Examples

### Basic Usage
```typescript
const { usersWithAliases, isLoading, isError } = useUsers();

if (isLoading) return <Loading />;
if (isError) return <Error message={isError.message} />;

return (
  <div>
    {usersWithAliases.map(user => (
      <UserCard key={user.userid} user={user} />
    ))}
  </div>
);
```

### Finding a User
```typescript
const { findUser, getUserAlias } = useUsers();

const user = findUser('1372655');
const alias = getUserAlias('1372655');
```

### Saving an Alias
```typescript
const { saveUserAlias, mutate } = useUsers();

const handleSaveAlias = (userid: string, alias: string) => {
  saveUserAlias(userid, alias);
  mutate(); // Revalidate to get fresh data
};
```

### OAuth Callback Handling
```typescript
const { mutate, saveUserAlias, getUserAlias } = useUsers();

useEffect(() => {
  if (searchParams.get('success') === 'true') {
    const userid = searchParams.get('userid');
    const username = searchParams.get('username');
    
    mutate(); // Refresh user list
    
    let alias = getUserAlias(userid);
    if (!alias || alias === userid) {
      alias = prompt('Enter alias') || username;
      saveUserAlias(userid, alias);
    }
    
    router.push(`/user/${userid}`);
  }
}, [searchParams]);
```

---

## Benefits of Extraction

### 1. **Code Reusability**
- Single source of truth for user logic
- Used in 3 different components
- Consistent behavior everywhere

### 2. **Easier Testing**
- Hook can be tested in isolation
- Mock SWR response once
- Test localStorage interactions

### 3. **Maintainability**
- Changes in one place
- No duplicate code
- Clear separation of concerns

### 4. **Performance**
- SWR caches data across components
- Single API call for all users
- Automatic deduplication

### 5. **Type Safety**
- Exported interfaces
- Consistent types across app
- Better TypeScript inference

---

## SWR Benefits (Preserved)

The custom hook maintains all SWR benefits:

- ✅ **Caching**: Same data across components
- ✅ **Revalidation**: Auto-refresh on focus
- ✅ **Deduplication**: Single request for multiple calls
- ✅ **Error Retry**: Automatic retry on failure
- ✅ **Optimistic Updates**: Via `mutate()`

---

## File Structure

```
hooks/
  └── useUsers.ts              (New custom hook)

app/
  ├── page.tsx                 (Uses hook)
  └── user/[userid]/
      └── page.tsx             (Uses hook)

components/
  └── Navbar.tsx               (Uses hook)
```

---

## Migration Summary

**Lines of Code Removed:**
- `app/page.tsx`: ~45 lines removed
- `app/user/[userid]/page.tsx`: ~25 lines removed
- `components/Navbar.tsx`: ~30 lines removed

**Total:** ~100 lines of duplicate code removed

**Lines Added:**
- `hooks/useUsers.ts`: ~75 lines (single source of truth)

**Net Result:** -25 lines, much cleaner code!

---

## Testing Checklist

- ✅ Home page displays user list
- ✅ User page finds correct user by userid
- ✅ Navbar shows users with aliases
- ✅ OAuth callback saves aliases
- ✅ User switching works
- ✅ SWR cache shared across components
- ✅ No TypeScript errors

---

## Summary

The extraction of user management logic into a custom `useUsers` hook is **complete and successful**! The application now has:

- ✅ Clean, reusable hook for all user operations
- ✅ Consistent API across all components
- ✅ Reduced code duplication (~100 lines)
- ✅ Better maintainability and testability
- ✅ All SWR benefits preserved

This is a significant improvement to code quality! 🎉
