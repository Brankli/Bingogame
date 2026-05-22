# Amharic Toast Audio Files

This directory contains Amharic audio files for toast notifications.

## Required Audio Files

### Game Messages
- `game-started.mp3` - "ጨዋታው በተሳካ ሁኔታ ተጀምሯል!" (Game started successfully!)
- `game-paused.mp3` - "ጨዋታው ቆሟል። ቢንጎ ተጠርቷል!" (Game paused. BINGO called!)
- `game-resumed.mp3` - "ጨዋታው ቀጥሏል። ቁጥሮችን መጥራት ቀጥሏል።" (Game resumed. Continuing to call numbers.)
- `game-finished.mp3` - "ጨዋታው አልቋል! ለሁሉም አሸናፊዎች እንኳን ደስ አላችሁ!" (Game finished! Congratulations to all winners!)

### Winner Messages
- `winner-valid.mp3` - "ትክክለኛ አሸናፊ! እንኳን ደስ አለህ!" (Valid win! Congratulations!)
- `winner-invalid.mp3` - "ትክክለኛ አሸናፊ አይደለም። ካርዱ ይቆለፋል።" (Invalid win. Card will be locked.)
- `winner-late.mp3` - "ዘግይተህ ጠርተሃል! ቢንጎን ወዲያውኑ መጥራት አለብህ።" (Late claim! You must call BINGO immediately.)

### Card Messages
- `card-registered.mp3` - "ካርድ በተሳካ ሁኔታ ተመዝግቧል!" (Card registered successfully!)
- `card-unregistered.mp3` - "ካርድ ተሰርዟል።" (Card unregistered.)
- `card-locked.mp3` - "ካርዱ በተሳሳተ ጥያቄ ምክንያት ተቆልፏል።" (Card is locked due to invalid claim.)

### Speed Control
- `speed-changed.mp3` - "የጥሪ ፍጥነት ተቀይሯል" (Calling speed changed)

### Connection Messages
- `connected.mp3` - "ከጨዋታ አገልጋይ ጋር ተገናኝቷል" (Connected to game server)
- `disconnected.mp3` - "ከአገልጋይ ተቋርጧል። እንደገና በመገናኘት ላይ..." (Disconnected from server. Reconnecting...)
- `connection-error.mp3` - "የግንኙነት ስህተት። እባክዎ በይነመረብዎን ያረጋግጡ።" (Connection error. Please check your internet.)

### Error Messages
- `no-cards-registered.mp3` - "እባክዎ ከመጀመርዎ በፊት ቢያንስ አንድ ካርድ ያስመዝግቡ።" (Please register at least one card before starting.)
- `permission-denied.mp3` - "ይህን ድርጊት ማከናወን የሚችለው አስተዳዳሪ ወይም ስራ አስኪያጅ ብቻ ነው።" (Only admin or manager can perform this action.)

### Success Messages
- `success.mp3` - "ስራው በተሳካ ሁኔታ ተጠናቋል!" (Operation completed successfully!)
- `saved.mp3` - "ቅንብሮች በተሳካ ሁኔታ ተቀምጠዋል!" (Settings saved successfully!)

## How to Record

1. **Use a native Amharic speaker**
2. **Record in MP3 format** (128kbps or higher)
3. **Keep files short** (2-4 seconds)
4. **Clear pronunciation**
5. **Consistent volume** (~40KB file size)

## Recording Script

Use this script to generate all audio files using text-to-speech (temporary solution):

```bash
# Install required tools (Ubuntu/Debian)
sudo apt-get install espeak-ng ffmpeg

# Generate audio files (basic TTS - replace with real recordings)
for file in game-started game-paused game-resumed game-finished winner-valid winner-invalid winner-late card-registered card-unregistered card-locked speed-changed connected disconnected connection-error no-cards-registered permission-denied success saved; do
  echo "Generating $file.mp3..."
  # This is a placeholder - you need real Amharic recordings
  espeak-ng -v am "Message" -w temp.wav
  ffmpeg -i temp.wav -codec:a libmp3lame -qscale:a 2 "$file.mp3"
  rm temp.wav
done
```

## Temporary Solution

Until you record proper audio:
1. Copy existing event audio files as placeholders
2. System will work but play wrong audio
3. English mode will show text without audio

## Status

- [ ] Game messages (4 files)
- [ ] Winner messages (3 files)
- [ ] Card messages (3 files)
- [ ] Speed control (1 file)
- [ ] Connection messages (3 files)
- [ ] Error messages (2 files)
- [ ] Success messages (2 files)

**Total: 18 audio files needed**
