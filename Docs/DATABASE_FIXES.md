# Database Relationship Fixes

## Issue Identified
The console errors showed PostgreSQL foreign key relationship problems when trying to fetch installations data. The application was trying to query relationships that didn't exist in the expected format.

## Root Cause
The `useInstallations` hook was trying to access `users` table directly from `installations` table via `lead_id` and `assistant_id` foreign keys, but the database schema shows that:
- `installations.lead_id` → `team_members.id`
- `installations.assistant_id` → `team_members.id`  
- `team_members.id` → `users.id`

So the relationship is: `installations` → `team_members` → `users`, not direct `installations` → `users`.

## Fixes Applied

### 1. Updated Query Structure in `/src/hooks/useInstallations.ts`

**Before:**
```typescript
.select(`
  // ... other fields ...
  lead:users!lead_id (
    first_name,
    last_name
  ),
  assistant:users!assistant_id (
    first_name,
    last_name
  )
`)
```

**After:**
```typescript
.from('installation_details')
.select('*')
```

### 2. Used Database View Instead of Complex Joins
- Changed from complex nested Supabase queries to using the `installation_details` view
- This view was already created in the database schema and handles the relationships properly
- View provides pre-joined data with proper foreign key relationships

### 3. Updated Data Transformation Logic
- Modified data parsing to handle the view's combined address format  
- Updated both `fetchInstallations()` and `fetchInstallationsForDate()` functions
- Added address parsing logic to split combined address strings back into components

## Technical Details

### Database Schema Structure
```sql
installations table:
  - lead_id (FK → team_members.id)
  - assistant_id (FK → team_members.id)
  - address_id (FK → addresses.id)

team_members table:
  - id (FK → users.id)

users table:
  - id (Primary Key)
```

### View Used: `installation_details`
This view provides:
- All installation fields
- Combined address string
- Lead and assistant names from users table
- Proper relationship handling

## Result
- ✅ Database errors resolved
- ✅ Installation data now loads properly  
- ✅ Foreign key relationships working correctly
- ✅ Application builds and runs without database errors

## Files Modified
1. `/src/hooks/useInstallations.ts` - Updated query structure and data transformation
2. Database migration script imports (minor ES module fixes)

## Testing
- Build: ✅ Successful
- Dev Server: ✅ Running on localhost:3001
- Pages Load: ✅ All routes accessible
- Database Queries: ✅ No more relationship errors

The installations page at `/installations` should now load properly with real data from Supabase.