# Amharic Audio Files

This folder contains all Amharic voice recordings for the 75-Ball Bingo game.

## Folder Structure

```
audio/amharic/
├── numbers/        → 75 number announcement files (b-1.mp3 to o-75.mp3)
├── events/         → 15 game event announcement files
├── patterns/       → 8 pattern name announcement files
└── README.md       → This file
```

## Required Files

### Numbers Folder (75 files)
Place all number audio files here:
- `b-1.mp3` through `b-15.mp3` (B column: 1-15)
- `i-16.mp3` through `i-30.mp3` (I column: 16-30)
- `n-31.mp3` through `n-45.mp3` (N column: 31-45)
- `g-46.mp3` through `g-60.mp3` (G column: 46-60)
- `o-61.mp3` through `o-75.mp3` (O column: 61-75)

### Events Folder (15 files)
Place all game event audio files here:
- `game-start.mp3` - "ጨዋታው ተጀምሯል" (Game started)
- `bingo-called.mp3` - "ቢንጎ!" (BINGO!)
- `winner-valid.mp3` - "አሸናፊ ትክክለኛ ነው" (Winner is valid)
- `winner-invalid.mp3` - "ልክ ያልሆነ አሸናፊ" (Invalid winner)
- `game-paused.mp3` - "ጨዋታው ቆሟል" (Game paused)
- `game-resumed.mp3` - "ጨዋታው ቀጥሏል" (Game resumed)
- `game-reset.mp3` - "ጨዋታው እንደገና ተጀምሯል" (Game reset)
- `card-registered.mp3` - "ካርድ ተመዝግቧል" (Card registered)
- `card-locked.mp3` - "ካርድ ተቆልፏል" (Card locked)
- `please-wait.mp3` - "እባክዎ ይጠብቁ" (Please wait)
- `congratulations.mp3` - "እንኳን ደስ አለዎት" (Congratulations)
- `try-again.mp3` - "እንደገና ይሞክሩ" (Try again)
- `game-over.mp3` - "ጨዋታው አልቋል" (Game over)
- `new-game.mp3` - "አዲስ ጨዋታ" (New game)
- `all-numbers-called.mp3` - "ሁሉም ቁጥሮች ተጠርተዋል" (All numbers called)

### Patterns Folder (8 files)
Place all pattern name audio files here:
- `horizontal.mp3` - "አግድም መስመር" (Horizontal line)
- `vertical.mp3` - "ቀጥተኛ መስመር" (Vertical line)
- `diagonal.mp3` - "ሰያፍ መስመር" (Diagonal line)
- `corners.mp3` - "አራት ማዕዘናት" (Four corners)
- `x-pattern.mp3` - "ኤክስ ቅርጽ" (X pattern)
- `t-pattern.mp3` - "ቲ ቅርጽ" (T pattern)
- `l-pattern.mp3` - "ኤል ቅርጽ" (L pattern)
- `fullhouse.mp3` - "ሙሉ ቤት" (Full house)

## Audio Specifications

All audio files must meet these specifications:
- **Format**: MP3
- **Bitrate**: 128 kbps
- **Sample Rate**: 44.1 kHz
- **Channels**: Mono
- **Duration**: 1-3 seconds per file
- **Volume**: Normalized across all files

## How to Add Files

1. Record audio files according to the recording script
2. Convert to MP3 format with correct specifications
3. Rename files according to naming convention
4. Copy files to the appropriate folder:
   - Number files → `numbers/`
   - Event files → `events/`
   - Pattern files → `patterns/`

## Testing

After adding files, test them by:
1. Starting the application
2. Selecting Amharic language in the game room
3. Playing a game and listening to announcements
4. Verifying all audio files play correctly

## File Checklist

Use this checklist to track your progress:

### Numbers (75 files)
- [ ] B column (b-1.mp3 to b-15.mp3) - 15 files
- [ ] I column (i-16.mp3 to i-30.mp3) - 15 files
- [ ] N column (n-31.mp3 to n-45.mp3) - 15 files
- [ ] G column (g-46.mp3 to g-60.mp3) - 15 files
- [ ] O column (o-61.mp3 to o-75.mp3) - 15 files

### Events (15 files)
- [ ] game-start.mp3
- [ ] bingo-called.mp3
- [ ] winner-valid.mp3
- [ ] winner-invalid.mp3
- [ ] game-paused.mp3
- [ ] game-resumed.mp3
- [ ] game-reset.mp3
- [ ] card-registered.mp3
- [ ] card-locked.mp3
- [ ] please-wait.mp3
- [ ] congratulations.mp3
- [ ] try-again.mp3
- [ ] game-over.mp3
- [ ] new-game.mp3
- [ ] all-numbers-called.mp3

### Patterns (8 files)
- [ ] horizontal.mp3
- [ ] vertical.mp3
- [ ] diagonal.mp3
- [ ] corners.mp3
- [ ] x-pattern.mp3
- [ ] t-pattern.mp3
- [ ] l-pattern.mp3
- [ ] fullhouse.mp3

## Total: 98 files

## Support

For the complete recording script with Amharic text and pronunciation guide, see:
`.kiro/specs/amharic-voice-support/recording-script.md`
