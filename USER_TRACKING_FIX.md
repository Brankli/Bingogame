# User Tracking Fields Fix

## Issue
The User Management table was showing "N/A" for House Fee, Total Earnings, Created, and Last Active columns.

## Root Cause
The backend `findAll()` method in `src/user/user.service.ts` was only selecting 4 fields: `['id', 'username', 'role', 'houseFee']`, missing the other tracking fields.

## Changes Made

### 1. Backend - User Service (`src/user/user.service.ts`)

#### Updated `findAll()` method to include all fields:
```typescript
async findAll(): Promise<User[]> {
  return this.userRepository.find({
    select: ['id', 'username', 'role', 'houseFee', 'totalEarnings', 'createdAt', 'lastActive'],
  });
}
```

#### Added helper methods for earnings tracking:
```typescript
async addEarnings(userId: number, amount: number): Promise<void> {
  const user = await this.userRepository.findOneBy({ id: userId });
  if (user) {
    await this.userRepository.update(
      { id: userId },
      {
        totalEarnings: (user.totalEarnings || 0) + amount,
        houseFee: (user.houseFee || 0) + amount,
      }
    );
  }
}

async resetDailyHouseFee(userId: number): Promise<void> {
  await this.userRepository.update({ id: userId }, { houseFee: 0 });
}
```

### 2. Database Verification
All required columns exist in the database:
- `houseFee` (float, default 0)
- `totalEarnings` (float, default 0)
- `createdAt` (datetime, default CURRENT_TIMESTAMP)
- `lastActive` (datetime, default CURRENT_TIMESTAMP, updates on change)

### 3. Frontend - Already Configured
The AdminDashboard.vue already has proper display logic:
- `formatFee()` - Formats currency values
- `formatDate()` - Formats dates with relative time
- Table columns properly mapped to user fields

## Field Definitions

### houseFee
- **Purpose**: Daily accumulated house fees from games
- **Type**: Float (Birr currency)
- **Editable**: Yes, admins can manually adjust in User Management
- **Auto-increment**: Can be incremented via `addEarnings()` method when games complete

### totalEarnings
- **Purpose**: Total lifetime earnings from all house fees
- **Type**: Float (Birr currency)
- **Editable**: No (calculated field)
- **Auto-increment**: Accumulates via `addEarnings()` method

### createdAt
- **Purpose**: User registration timestamp
- **Type**: DateTime
- **Auto-set**: Yes, on user creation

### lastActive
- **Purpose**: Last activity timestamp
- **Type**: DateTime
- **Auto-update**: Yes, updates on any user record change

## How to Apply Changes

### Step 1: Restart Backend Server
The backend needs to be restarted to load the updated code:

```bash
# Stop the current backend process (Ctrl+C if running in terminal)
# Then restart:
npm run start:dev
```

### Step 2: Verify API Response
Test the user endpoint returns all fields:
```bash
curl http://localhost:3000/api/user
```

Expected response should include all fields:
```json
[
  {
    "id": 10,
    "username": "admin",
    "role": "admin",
    "houseFee": 0,
    "totalEarnings": 0,
    "createdAt": "2026-05-07T06:56:18.000Z",
    "lastActive": "2026-05-07T06:56:18.000Z"
  }
]
```

### Step 3: Refresh Frontend
Hard refresh the browser (Ctrl+Shift+R or Cmd+Shift+R) to clear cache and reload the admin dashboard.

## Future Enhancements

### Automatic House Fee Tracking
To automatically track house fees when games complete, add this logic to the card verification success:

```typescript
// In card.service.ts or room.service.ts when a winner is verified
const totalCards = registeredCards.length;
const houseFeePerCard = 2; // or get from room settings
const totalHouseFee = totalCards * houseFeePerCard;

// Add to room owner or admin
await this.userService.addEarnings(roomOwnerId, totalHouseFee);
```

### Daily Reset
To reset daily house fees at midnight, create a scheduled task:

```typescript
// In a cron service
@Cron('0 0 * * *') // Run at midnight
async resetDailyFees() {
  const users = await this.userService.findAll();
  for (const user of users) {
    await this.userService.resetDailyHouseFee(user.id);
  }
}
```

## Testing Checklist

- [x] Backend code updated
- [x] Database columns verified
- [x] Frontend display logic confirmed
- [ ] Backend server restarted
- [ ] API endpoint tested
- [ ] Frontend displays data correctly
- [ ] Manual house fee edit works
- [ ] Date formatting displays correctly

## Status
✅ **Implementation Complete** - Requires backend restart to take effect.
