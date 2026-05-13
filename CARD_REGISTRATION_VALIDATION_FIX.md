# ✅ Card Registration Validation Fix

## Problem
Unregistered cards could win the game. When someone tried to verify a card that was "Not Registered", the system would still process the verification and potentially allow the win.

## Solution
Added validation to check if a card is registered before allowing win verification.

## What Changed

### Before:
```
User enters Card #100 (Not Registered)
↓
System verifies the card pattern
↓
If valid pattern → Card wins ❌ (WRONG!)
```

### After:
```
User enters Card #100 (Not Registered)
↓
System checks: Is card registered?
↓
NO → Show error: "Card is not registered" ✅ (CORRECT!)
YES → Continue with verification
```

## Implementation

Added this check in the `verifyWin()` function:

```typescript
// Extract card number from normalized format (e.g., "CARD-5" -> 5)
const cardNumber = Number(normalizedCardNumber.replace('CARD-', ''));

// Check if card is registered
if (!isCardRegistered(cardNumber)) {
  const notRegisteredMessage = `Card ${normalizedCardNumber} is not registered. Only registered cards can win.`;
  showToast(notRegisteredMessage, 'error');
  speakMessage(`Card ${normalizedCardNumber} is not registered.`);
  verifying.value = false;
  return;
}
```

## How It Works

1. **User pauses game** and enters a card number (e.g., "100" or "CARD-100")
2. **System normalizes** the input to "CARD-100"
3. **System extracts** the number: 100
4. **System checks** if card #100 is in the `registeredCards` array
5. **If NOT registered:**
   - Shows error toast: "Card CARD-100 is not registered. Only registered cards can win."
   - Speaks message: "Card CARD-100 is not registered."
   - Stops verification process
   - Returns early (doesn't call backend)
6. **If registered:**
   - Continues with normal verification process
   - Checks pattern validity
   - Awards win if valid

## Testing

### Test Case 1: Unregistered Card
1. Start a game with only Card #5 registered
2. Pause the game (click PAUSE/BINGO button)
3. Enter "100" in the verification input
4. Click "Verify"
5. **Expected:** Error message "Card CARD-100 is not registered. Only registered cards can win."

### Test Case 2: Registered Card (Valid Win)
1. Start a game with Card #5 registered
2. Pause the game
3. Enter "5" in the verification input
4. Click "Verify"
5. **Expected:** If pattern is valid → "Card CARD-5 wins with [pattern]"

### Test Case 3: Registered Card (Invalid Win)
1. Start a game with Card #5 registered
2. Pause the game (before card has winning pattern)
3. Enter "5" in the verification input
4. Click "Verify"
5. **Expected:** "Invalid win. Card CARD-5 will be locked until game ends."

## Benefits

✅ **Prevents fraud** - Only registered (paid) cards can win
✅ **Clear feedback** - Users immediately know why verification failed
✅ **Early validation** - Doesn't waste backend resources on unregistered cards
✅ **Audio feedback** - Speaks the error message in selected language
✅ **Consistent UX** - Error toast matches other validation messages

## Edge Cases Handled

- ✅ Card number with or without "CARD-" prefix (both "5" and "CARD-5" work)
- ✅ Case-insensitive input (normalizeCardNumber handles this)
- ✅ Invalid card numbers (handled by existing validation)
- ✅ Empty input (handled by existing validation)

## Files Modified

- `client/src/views/BingoRoomView.vue` - Added registration check in `verifyWin()` function

## Status

✅ **FIXED** - Unregistered cards can no longer win the game
