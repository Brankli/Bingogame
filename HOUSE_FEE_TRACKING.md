# House Fee Automatic Tracking Implementation

## Overview
Implemented automatic house fee tracking that updates user earnings when games start.

## How It Works

### When a Game Starts:
1. User clicks "Start Game" with registered cards
2. Frontend sends house fee per card (default: 2 Birr)
3. Backend calculates: `totalHouseFee = numberOfCards × houseFeePerCard`
4. Backend adds earnings to room owner using `userService.addEarnings()`
5. Both `houseFee` and `totalEarnings` are incremented

### Example:
- **10 cards registered** × **2 Birr per card** = **20 Birr house fee**
- Room owner's `houseFee`: 0 → 20 Birr
- Room owner's `totalEarnings`: 0 → 20 Birr

## Changes Made

### 1. Backend - Socket Gateway (`src/sockets/sockets.gateway.ts`)

#### Added UserService import and injection:
```typescript
import { UserService } from '../user/user.service';

constructor(
  // ... other services
  private readonly userService: UserService,
) {}
```

#### Updated NEW_MATCH handler:
```typescript
@SubscribeMessage(NEW_MATCH_EVENT)
async handleNewMatch(
  @ConnectedSocket() client: Socket,
  @MessageBody('roomId') roomId: number,
  @MessageBody('soldCards') soldCards: number,
  @MessageBody('houseFeePerCard') houseFeePerCard?: number,
): Promise<void> {
  // ... existing code ...
  
  // Calculate and add house fee earnings
  const feePerCard = houseFeePerCard || 2; // Default 2 Birr
  const totalHouseFee = soldCards * feePerCard;
  
  // Add earnings to room owner
  const roomOwnerId = room.owner?.id || user.id;
  await this.userService.addEarnings(roomOwnerId, totalHouseFee);
  
  this.logger.log(`Added ${totalHouseFee} Birr house fee to user ${roomOwnerId}`);
}
```

### 2. Frontend - BingoRoomView (`client/src/views/BingoRoomView.vue`)

#### Updated startNewGame to send house fee:
```typescript
client?.emit('new-match', {
  roomId: roomId.value,
  soldCards: registeredCards.value.length,
  houseFeePerCard: houseFee.value, // Send current house fee setting
});
```

## Field Definitions

### houseFee (Daily Accumulated)
- **Purpose**: Tracks fees collected today
- **Updates**: Increments when games start
- **Can be reset**: Use `userService.resetDailyHouseFee(userId)` for daily reset

### totalEarnings (Lifetime Total)
- **Purpose**: Tracks all-time earnings
- **Updates**: Increments when games start (never decreases)
- **Permanent**: Accumulates forever

## Testing

### Test the Implementation:

1. **Start Backend Server:**
```bash
npm run start:dev
```

2. **Login as Admin or Room Manager**

3. **Go to a Room and Register Cards:**
   - Click on card numbers to register them (they turn red)
   - Example: Register 5 cards

4. **Check Current Settings:**
   - Click "Betting Settings" button
   - Note the "House Fee per Card" value (default: 2 Birr)

5. **Start the Game:**
   - Click "Start Game"
   - Expected house fee: 5 cards × 2 Birr = 10 Birr

6. **Verify in Admin Dashboard:**
   - Go to Admin Dashboard → User Management
   - Find the room owner's row
   - Check "House Fee" column: should show "10.00 Birr"
   - Check "Total Earnings" column: should show "10.00 Birr"

7. **Start Another Game:**
   - Register 3 more cards
   - Start game again
   - Expected additional fee: 3 × 2 = 6 Birr
   - House Fee should now be: 16.00 Birr
   - Total Earnings should be: 16.00 Birr

## Configuration

### Change House Fee Per Card:
1. In the game room, click "Betting Settings"
2. Adjust "House Fee per Card" value
3. Click "Save Settings"
4. New games will use the updated fee

### Daily Reset (Optional):
To reset daily house fees at midnight, add a cron job:

```typescript
// In a cron service
import { Cron } from '@nestjs/schedule';

@Cron('0 0 * * *') // Run at midnight
async resetDailyFees() {
  const users = await this.userService.findAll();
  for (const user of users) {
    await this.userService.resetDailyHouseFee(user.id);
  }
  this.logger.log('Daily house fees reset');
}
```

## Database Verification

Check earnings directly in database:
```sql
SELECT id, username, houseFee, totalEarnings 
FROM users 
WHERE role = 'admin' OR role = 'user';
```

## Files Modified

1. ✅ `src/sockets/sockets.gateway.ts` - Added house fee tracking
2. ✅ `client/src/views/BingoRoomView.vue` - Send house fee to backend
3. ✅ Backend built successfully

## Status
✅ **Implementation Complete** - Restart backend server to activate automatic house fee tracking!

## Next Steps
1. Restart backend: `npm run start:dev`
2. Test by starting a game with registered cards
3. Check User Management to see updated earnings
