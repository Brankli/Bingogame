# 🎯 Any Line Pattern - New Feature

## Overview
Added a new bingo pattern called **"Any Line"** that allows players to win by completing ANY single line - whether it's horizontal, vertical, or diagonal.

## What is "Any Line" Pattern?

The "Any Line" pattern is the most flexible winning pattern. A player wins if they complete:
- **ANY horizontal row** (5 rows possible)
- **OR ANY vertical column** (5 columns possible)
- **OR ANY diagonal** (2 diagonals possible)

**Total winning possibilities: 12 different lines**

## Visual Examples

### Horizontal Lines (5 options):
```
Row 0: [X][X][X][X][X]  ← Winner!
Row 1: [ ][ ][ ][ ][ ]
Row 2: [ ][ ][F][ ][ ]
Row 3: [ ][ ][ ][ ][ ]
Row 4: [ ][ ][ ][ ][ ]
```

### Vertical Lines (5 options):
```
Col 0: [X][ ][ ][ ][ ]
       [X][ ][ ][ ][ ]
       [X][F][ ][ ][ ]
       [X][ ][ ][ ][ ]
       [X][ ][ ][ ][ ]
        ↑ Winner!
```

### Diagonal Lines (2 options):
```
Diagonal \:              Diagonal /:
[X][ ][ ][ ][ ]          [ ][ ][ ][ ][X]
[ ][X][ ][ ][ ]          [ ][ ][ ][X][ ]
[ ][ ][F][ ][ ]          [ ][ ][F][ ][ ]
[ ][ ][ ][X][ ]          [ ][X][ ][ ][ ]
[ ][ ][ ][ ][X]          [X][ ][ ][ ][ ]
 ↘ Winner!                ↙ Winner!
```

## How It Works

### Backend (card.service.ts)
The pattern validation checks all 12 possible lines:
- 5 horizontal rows
- 5 vertical columns
- 2 diagonal lines

If ANY of these 12 lines are completely marked, the card wins.

### Frontend (BingoRoomView.vue)
- Added to pattern dropdown as first option
- Shows all possible winning lines in the pattern preview
- Displays as: "Any Line (Horizontal, Vertical, or Diagonal)"

## Usage

### For Room Managers:
1. Create or enter a room
2. Select pattern: **"Any Line (Horizontal, Vertical, or Diagonal)"**
3. Start the game
4. First player to complete ANY line wins

### For Players:
- Complete any horizontal row (B-I-N-G-O in one row)
- OR complete any vertical column (all 5 numbers in one column)
- OR complete any diagonal (corner to corner)
- Call BINGO when you complete any line

## Pattern Comparison

| Pattern | Lines to Win | Difficulty | Speed |
|---------|--------------|------------|-------|
| **Any Line** | 1 line (12 options) | Easiest | Fastest |
| Horizontal | 1 horizontal (5 options) | Easy | Fast |
| Vertical | 1 vertical (5 options) | Easy | Fast |
| Diagonal | 1 diagonal (2 options) | Medium | Medium |
| Four Corners | 4 corners | Easy | Fast |
| X Pattern | Both diagonals | Hard | Slow |
| T Pattern | Top row + middle column | Hard | Slow |
| L Pattern | Left column + bottom row | Hard | Slow |
| Full House | All 25 cells | Hardest | Slowest |

## Game Strategy

### Why Use "Any Line"?
- **Fastest games** - Most winning options
- **Beginner friendly** - Easy to understand
- **High excitement** - Multiple ways to win
- **Quick rounds** - Good for busy rooms

### When to Use Other Patterns?
- **Longer games** → Use X, T, L, or Full House
- **Specific challenge** → Use Horizontal, Vertical, or Diagonal only
- **Quick warm-up** → Use Four Corners or Any Line

## Implementation Details

### Backend Changes
**File:** `src/card/card.service.ts`
**Function:** `getPatternCoordinates()`

Added `anyline` pattern with all 12 possible winning lines:
```typescript
anyline: [
  // 5 horizontal rows
  [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]], // Row 0
  [[1, 0], [1, 1], [1, 2], [1, 3], [1, 4]], // Row 1
  [[2, 0], [2, 1], [2, 2], [2, 3], [2, 4]], // Row 2
  [[3, 0], [3, 1], [3, 2], [3, 3], [3, 4]], // Row 3
  [[4, 0], [4, 1], [4, 2], [4, 3], [4, 4]], // Row 4
  
  // 5 vertical columns
  [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]], // Col 0
  [[0, 1], [1, 1], [2, 1], [3, 1], [4, 1]], // Col 1
  [[0, 2], [1, 2], [2, 2], [3, 2], [4, 2]], // Col 2
  [[0, 3], [1, 3], [2, 3], [3, 3], [4, 3]], // Col 3
  [[0, 4], [1, 4], [2, 4], [3, 4], [4, 4]], // Col 4
  
  // 2 diagonals
  [[0, 0], [1, 1], [2, 2], [3, 3], [4, 4]], // \
  [[0, 4], [1, 3], [2, 2], [3, 1], [4, 0]], // /
]
```

### Frontend Changes
**File:** `client/src/views/BingoRoomView.vue`

1. **Added to patterns array:**
```typescript
{ title: 'Any Line (Horizontal, Vertical, or Diagonal)', value: 'anyline' }
```

2. **Added pattern visualization:**
Shows all 12 possible winning lines in the pattern preview

## Testing

### Test Case 1: Horizontal Win
1. Select "Any Line" pattern
2. Start game
3. Complete any horizontal row (e.g., Row 2: B-I-N-G-O)
4. Verify win
5. **Expected:** "Card CARD-X wins with anyline"

### Test Case 2: Vertical Win
1. Select "Any Line" pattern
2. Start game
3. Complete any vertical column (e.g., Column N: 31-32-FREE-38-40)
4. Verify win
5. **Expected:** "Card CARD-X wins with anyline"

### Test Case 3: Diagonal Win
1. Select "Any Line" pattern
2. Start game
3. Complete any diagonal (e.g., B-I-FREE-G-O from top-left to bottom-right)
4. Verify win
5. **Expected:** "Card CARD-X wins with anyline"

### Test Case 4: Invalid Win
1. Select "Any Line" pattern
2. Start game
3. Try to verify a card without a complete line
4. **Expected:** "Invalid win. Card CARD-X will be locked until game ends."

## Benefits

✅ **Faster games** - More winning options means quicker rounds
✅ **More excitement** - Players have 12 ways to win instead of 2-5
✅ **Beginner friendly** - Easy to understand and play
✅ **Flexible** - Works well for any room size or player count
✅ **Fair** - All players have equal chances with multiple winning paths

## Files Modified

1. `src/card/card.service.ts` - Added `anyline` pattern validation
2. `client/src/views/BingoRoomView.vue` - Added pattern to dropdown and visualization

## Status

✅ **IMPLEMENTED** - Ready to use in games!

## How to Use

1. **Create/Enter a room**
2. **Select pattern:** "Any Line (Horizontal, Vertical, or Diagonal)"
3. **Register cards**
4. **Start game**
5. **First to complete any line wins!**

Enjoy faster, more exciting bingo games! 🎉
