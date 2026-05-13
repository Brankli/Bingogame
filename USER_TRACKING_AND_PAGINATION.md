# User Tracking & Pagination Feature

## Overview
Implemented comprehensive user tracking with house fee earnings and pagination for admin lists.

## Features Implemented

### 1. User Tracking Fields

**New Database Columns:**
- `totalEarnings` (FLOAT) - Tracks total earnings for regular users
- `createdAt` (DATETIME) - When user account was created
- `lastActive` (DATETIME) - Last activity timestamp (auto-updates)

**User Entity Updates:**
```typescript
@Column({ type: 'float', default: 0 })
totalEarnings!: number;

@Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
createdAt!: Date;

@Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
lastActive!: Date;
```

### 2. Pagination System

**Admin Dashboard Pagination:**
- Users list: 10 per page (configurable)
- Rooms list: 10 per page (configurable)
- Vuetify pagination component
- Page navigation controls

**Implementation:**
```typescript
// Pagination state
const usersPage = ref(1);
const usersPerPage = ref(10);
const roomsPage = ref(1);
const roomsPerPage = ref(10);

// Computed paginated data
const paginatedUsers = computed(() => {
  const start = (usersPage.value - 1) * usersPerPage.value;
  const end = start + usersPerPage.value;
  return users.value.slice(start, end);
});

const totalUsersPages = computed(() => 
  Math.ceil(users.value.length / usersPerPage.value)
);
```

### 3. Enhanced User Table

**New Columns Displayed:**
- Username
- Role (Admin/User badge)
- House Fee (editable)
- **Total Earnings** (for regular users only)
- **Created Date** (with relative time)
- **Last Active** (with relative time)
- Actions (Edit, Make Admin, Delete)

**Total Earnings Display:**
- Shows only for regular users (role='user')
- Displayed in green chip
- Formatted as currency (Birr)
- Admins show "-" instead

### 4. Date Formatting

**Relative Time Display:**
- "Just now" - Less than 1 minute
- "5m ago" - Minutes ago
- "3h ago" - Hours ago
- "2d ago" - Days ago
- Full date/time - Older than 7 days

**Implementation:**
```typescript
function formatDate(date: string | Date) {
  if (!date) return 'N/A';
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  // ... more logic
}
```

### 5. Total Earnings Summary

**Dashboard Stats:**
- Shows total earnings for all regular users
- Displayed in info alert at top of user list
- Format: "Total User Earnings: 1,234.56 Birr"

**Computed Property:**
```typescript
const totalUserEarnings = computed(() => {
  return users.value
    .filter(u => u.role === 'user')
    .reduce((sum, u) => sum + (u.totalEarnings || 0), 0);
});
```

## Database Migration

**File:** `migrations/002_add_user_tracking.sql`

**Steps to Apply:**
```bash
# Using MySQL client
mysql -u bingo -p bingo < migrations/002_add_user_tracking.sql

# Or using Docker
docker-compose exec db mysql -u bingo -p bingo < migrations/002_add_user_tracking.sql
```

**Migration Contents:**
1. Adds `totalEarnings` column (FLOAT, default 0)
2. Adds `createdAt` column (DATETIME, default CURRENT_TIMESTAMP)
3. Adds `lastActive` column (DATETIME, auto-updates)
4. Updates existing users with current timestamp

## UI Changes

### Users Table
**Before:**
- 3 columns (Username, Role, House Fee)
- No pagination
- All users shown at once

**After:**
- 6 columns (Username, Role, House Fee, Total Earnings, Created, Last Active)
- Pagination (10 per page)
- Relative time display
- Total earnings summary

### Rooms List
**Before:**
- All rooms shown at once
- No pagination

**After:**
- Pagination (10 per page)
- Page navigation controls

## Usage Examples

### For Admins:

**View User Earnings:**
1. Go to Admin Dashboard
2. Click "User Management" tab
3. See "Total Earnings" column for each user
4. See total at top: "Total User Earnings: X Birr"

**Navigate Pages:**
1. If more than 10 users/rooms
2. Pagination controls appear at bottom
3. Click page numbers to navigate
4. Shows "Page 1 of 5" style navigation

**Check User Activity:**
1. View "Created" column - when user joined
2. View "Last Active" column - recent activity
3. Relative time shows "2h ago", "3d ago", etc.

### Tracking House Fees:

**Update User Earnings:**
```typescript
// When a game completes, update user earnings
await userService.update(userId, {
  totalEarnings: currentEarnings + houseFeeFromGame
});
```

**View Total Earnings:**
- Admin dashboard shows aggregate
- Individual user shows their total
- Only for regular users (not admins)

## API Integration

**User Service Methods:**
```typescript
// Update user earnings
async update(id: number, userData: Partial<User>) {
  // Updates totalEarnings, lastActive auto-updates
  return this.userRepository.update({ id }, userData);
}

// Get all users with tracking data
async findAll(): Promise<User[]> {
  return this.userRepository.find({
    select: ['id', 'username', 'role', 'houseFee', 
             'totalEarnings', 'createdAt', 'lastActive'],
  });
}
```

## Benefits

### For Admins:
✅ Track user earnings over time
✅ See when users joined
✅ Monitor user activity
✅ Manage large user lists easily
✅ Quick navigation with pagination

### For System:
✅ Better performance with pagination
✅ Cleaner UI with organized data
✅ Historical tracking of user activity
✅ Audit trail with timestamps

### For Users:
✅ Transparent earnings tracking
✅ Activity history
✅ Professional dashboard

## Configuration

**Adjust Items Per Page:**
```typescript
// In AdminDashboard.vue
const usersPerPage = ref(10);  // Change to 20, 50, etc.
const roomsPerPage = ref(10);  // Change to 20, 50, etc.
```

**Customize Date Format:**
```typescript
// In formatDate function
// Adjust thresholds for relative time
if (diffMins < 60) return `${diffMins}m ago`;  // Change 60 to other value
if (diffHours < 24) return `${diffHours}h ago`; // Change 24 to other value
```

## Testing Checklist

### Database:
- [ ] Run migration successfully
- [ ] Verify new columns exist
- [ ] Check default values applied
- [ ] Test auto-update on lastActive

### UI:
- [ ] Users table shows new columns
- [ ] Pagination appears when > 10 items
- [ ] Page navigation works
- [ ] Total earnings displays correctly
- [ ] Dates show relative time
- [ ] Rooms pagination works

### Functionality:
- [ ] Edit user updates lastActive
- [ ] New users get createdAt timestamp
- [ ] Total earnings calculates correctly
- [ ] Only users show earnings (not admins)
- [ ] Pagination doesn't break editing

## Future Enhancements

1. **Earnings History**
   - Track individual transactions
   - Show earnings breakdown
   - Export earnings reports

2. **Activity Log**
   - Detailed activity tracking
   - Login/logout history
   - Game participation log

3. **Advanced Pagination**
   - Search/filter within pages
   - Sort by columns
   - Adjustable items per page

4. **Analytics Dashboard**
   - Earnings charts
   - User growth graphs
   - Activity heatmaps

5. **Export Features**
   - Export user list to CSV
   - Export earnings report
   - Generate PDF reports

## Files Modified

### Backend:
1. **src/user/entities/user.entity.ts**
   - Added `totalEarnings` column
   - Added `createdAt` column
   - Added `lastActive` column

### Frontend:
2. **client/src/views/AdminDashboard.vue**
   - Added pagination variables
   - Added paginated computed properties
   - Updated users table with new columns
   - Updated rooms list with pagination
   - Added `formatDate()` helper function
   - Added `totalUserEarnings` computed property

### Database:
3. **migrations/002_add_user_tracking.sql**
   - Migration script for new columns

## Performance Considerations

**Pagination Benefits:**
- Reduces DOM elements rendered
- Faster initial page load
- Better browser performance
- Smoother scrolling

**Database Queries:**
- No change to query performance
- All data still fetched at once
- Pagination happens client-side
- Consider server-side pagination for 1000+ users

## Summary

✅ **User tracking implemented** - totalEarnings, createdAt, lastActive
✅ **Pagination added** - Users and rooms lists
✅ **Enhanced UI** - More columns, better formatting
✅ **Date formatting** - Relative time display
✅ **Total earnings** - Aggregate view for admins
✅ **Migration ready** - SQL script provided
✅ **Performance improved** - Better handling of large lists

The system now provides comprehensive user tracking and efficient list management for administrators.
