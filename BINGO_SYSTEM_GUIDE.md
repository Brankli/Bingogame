# 5x5 Digital Bingo System - Complete Guide

## 🎯 Overview
This system has been upgraded from a 90-ball Italian Tombola to a full-featured **75-ball American Bingo** system with:
- ✅ 5x5 Digital Card Generation (B-I-N-G-O format)
- ✅ Automatic Pattern Detection
- ✅ Real-time Card Validation
- ✅ Admin Verification Panel
- ✅ Player Auto-Marking Interface

## 🎲 Game Rules

### Card Structure
- **5x5 Grid** with 24 numbers + 1 FREE space (center)
- **Column Ranges:**
  - **B**: 1-15
  - **I**: 16-30
  - **N**: 31-45 (center is FREE)
  - **G**: 46-60
  - **O**: 61-75

### Winning Patterns
1. **Horizontal Line**: Any complete row
2. **Vertical Line**: Any complete column
3. **Diagonal**: Main diagonals (top-left to bottom-right or top-right to bottom-left)
4. **Four Corners**: All four corner cells
5. **X Pattern**: Both diagonals combined
6. **T Pattern**: Top row + middle column
7. **L Pattern**: Left column + bottom row
8. **Full House**: All 24 numbers marked

## 🚀 Quick Start

### For Admin/Room Owner:

1. **Create a Room** from the home page
2. **Join the Room** - you'll see the admin controls
3. **Generate Cards:**
   - Click "Show Admin Panel"
   - Go to "Generate Cards" tab
   - Enter quantity (e.g., 10 cards)
   - Click "Generate Cards"
   - Note down the card numbers for distribution

4. **Start Game:**
   - Select the winning pattern (e.g., "Horizontal Line")
   - Click "Start New Game"
   - Numbers will be called automatically

5. **Verify Wins:**
   - When a player claims BINGO
   - Click "Show Admin Panel"
   - Go to "Verify Win" tab
   - Enter the player's card number
   - Select the pattern
   - Click "Verify Win"
   - System shows if it's valid ✅ or invalid ❌

### For Players:

1. **Get Your Card Number** from the admin (e.g., CARD-ABC123)
2. **Join the Room**
3. **Enter Your Card Number** in the "Your Card" section
4. **Click "Load Card"** - your card will appear
5. **Watch the Numbers** - they auto-mark on your card
6. **When You Win:**
   - Click the "BINGO!" button on your card
   - System verifies automatically
   - If valid, you win! 🎉

## 📡 API Endpoints

### Card Management
```
POST   /api/cards                    - Generate new cards
GET    /api/cards                    - Get all cards
GET    /api/cards/:identifier        - Get specific card
POST   /api/cards/verify             - Verify a win
POST   /api/cards/:cardId/assign/:userId - Assign card to user
GET    /api/cards/room/:roomId       - Get cards for a room
DELETE /api/cards/:id                - Delete a card
```

### Example: Generate Cards
```javascript
POST /api/cards
{
  "quantity": 10,
  "roomId": 1  // optional
}
```

### Example: Verify Win
```javascript
POST /api/cards/verify
{
  "cardNumber": "CARD-ABC123",
  "calledNumbers": [1, 5, 12, 16, 23, ...],
  "pattern": "horizontal"
}
```

## 🎨 Frontend Components

### BingoCard.vue
Digital 5x5 bingo card with:
- Auto-marking when numbers are called
- Visual highlighting of winning patterns
- "BINGO!" claim button
- Responsive design

### AdminPanel.vue
Complete admin interface with:
- Card generation
- Win verification
- Card management
- Pattern selection

### BingoRoomView.vue
Full game room with:
- Live number calling
- 75-number board display
- Player card interface
- Admin controls

## 🔧 Technical Implementation

### Pattern Detection Algorithm
```typescript
// Patterns defined as coordinate arrays
const patterns = {
  horizontal: [
    [[0,0], [0,1], [0,2], [0,3], [0,4]], // Row 0
    [[1,0], [1,1], [1,2], [1,3], [1,4]], // Row 1
    // ... etc
  ],
  diagonal: [
    [[0,0], [1,1], [2,2], [3,3], [4,4]], // Main diagonal
    [[0,4], [1,3], [2,2], [3,1], [4,0]]  // Anti-diagonal
  ]
};
```

### Card Generation Logic
```typescript
// Each column has specific range
B: 1-15   → Pick 5 random, sort ascending
I: 16-30  → Pick 5 random, sort ascending
N: 31-45  → Pick 5 random, center = FREE (0)
G: 46-60  → Pick 5 random, sort ascending
O: 61-75  → Pick 5 random, sort ascending
```

### Validation Process
1. Retrieve card grid from database
2. Create boolean matrix of marked cells
3. Check if called numbers match card numbers
4. Test against pattern coordinates
5. Return valid/invalid + visual map

## 🎯 Usage Scenarios

### Scenario 1: Physical Cards + Digital Verification
- Admin generates cards and prints them
- Players use physical cards
- Admin calls numbers digitally
- Players mark physical cards
- Admin verifies wins using card number

### Scenario 2: Fully Digital
- Admin generates cards
- Players load cards on their devices
- Numbers auto-mark on player screens
- Players click "BINGO!" when they win
- System auto-verifies

### Scenario 3: Hybrid
- Some players use physical cards
- Some players use digital cards
- Admin controls the game
- Both types can win and be verified

## 🔐 Security Features
- JWT authentication for card generation
- Owner-only admin controls
- Card assignment to prevent fraud
- Server-side validation (can't cheat)

## 📊 Database Schema

### Card Entity
```typescript
{
  id: number;
  cardNumber: string;        // Unique identifier
  grid: number[][];          // 5x5 matrix
  assignedUser?: User;       // Optional user assignment
  room?: Room;               // Optional room assignment
  createdAt: Date;
  isActive: boolean;
}
```

## 🎮 Game Flow

1. **Setup Phase**
   - Admin creates room
   - Admin generates cards
   - Admin distributes card numbers
   - Admin selects winning pattern

2. **Play Phase**
   - Admin starts game
   - System calls numbers (1-75)
   - Players mark their cards
   - Numbers announced via text-to-speech

3. **Win Phase**
   - Player claims BINGO
   - Admin verifies card number
   - System checks pattern match
   - Winner announced if valid

4. **Reset Phase**
   - Admin resets game
   - New pattern selected
   - Game starts again

## 🚨 Troubleshooting

**Cards not generating?**
- Check if you're logged in
- Verify backend is running
- Check browser console for errors

**Verification failing?**
- Ensure correct card number format
- Check pattern selection matches game
- Verify all called numbers are included

**Auto-marking not working?**
- Reload the card
- Check WebSocket connection
- Verify room ID matches

## 🎉 Features Summary

✅ **Automated Number Calling** (1-75)
✅ **8 Winning Patterns** (Line, Diagonal, Corners, X, T, L, Full House)
✅ **Digital Card Generation** (B-I-N-G-O format)
✅ **Real-time Validation** (Instant win verification)
✅ **Auto-Marking** (Numbers mark automatically)
✅ **Admin Panel** (Complete game management)
✅ **Text-to-Speech** (Number announcements)
✅ **Responsive Design** (Works on all devices)
✅ **Multi-player Support** (Unlimited players)
✅ **Card Management** (Generate, assign, delete)

Enjoy your fully-featured 5x5 Digital Bingo System! 🎊
