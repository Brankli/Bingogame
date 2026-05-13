# Amharic Audio Files - Setup Guide

## ✅ Folders Created Successfully!

The folder structure has been created at:

```
📁 client/public/audio/amharic/
```

## 📂 Where to Put Your Audio Files

### 1️⃣ Number Files (75 files)
**Location**: `client/public/audio/amharic/numbers/`

**Put these files here**:
```
b-1.mp3, b-2.mp3, b-3.mp3, ..., b-15.mp3
i-16.mp3, i-17.mp3, i-18.mp3, ..., i-30.mp3
n-31.mp3, n-32.mp3, n-33.mp3, ..., n-45.mp3
g-46.mp3, g-47.mp3, g-48.mp3, ..., g-60.mp3
o-61.mp3, o-62.mp3, o-63.mp3, ..., o-75.mp3
```

**Example**:
- Recording for "B 5" (ቢ አምስት) → Save as `b-5.mp3`
- Recording for "N 42" (ኤን አርባ ሁለት) → Save as `n-42.mp3`
- Recording for "O 75" (ኦ ሰባ አምስት) → Save as `o-75.mp3`

---

### 2️⃣ Event Files (15 files)
**Location**: `client/public/audio/amharic/events/`

**Put these files here**:
```
game-start.mp3          → "ጨዋታው ተጀምሯል"
bingo-called.mp3        → "ቢንጎ!"
winner-valid.mp3        → "አሸናፊ ትክክለኛ ነው"
winner-invalid.mp3      → "ልክ ያልሆነ አሸናፊ"
game-paused.mp3         → "ጨዋታው ቆሟል"
game-resumed.mp3        → "ጨዋታው ቀጥሏል"
game-reset.mp3          → "ጨዋታው እንደገና ተጀምሯል"
card-registered.mp3     → "ካርድ ተመዝግቧል"
card-locked.mp3         → "ካርድ ተቆልፏል"
please-wait.mp3         → "እባክዎ ይጠብቁ"
congratulations.mp3     → "እንኳን ደስ አለዎት"
try-again.mp3           → "እንደገና ይሞክሩ"
game-over.mp3           → "ጨዋታው አልቋል"
new-game.mp3            → "አዲስ ጨዋታ"
all-numbers-called.mp3  → "ሁሉም ቁጥሮች ተጠርተዋል"
```

---

### 3️⃣ Pattern Files (8 files)
**Location**: `client/public/audio/amharic/patterns/`

**Put these files here**:
```
horizontal.mp3    → "አግድም መስመር"
vertical.mp3      → "ቀጥተኛ መስመር"
diagonal.mp3      → "ሰያፍ መስመር"
corners.mp3       → "አራት ማዕዘናት"
x-pattern.mp3     → "ኤክስ ቅርጽ"
t-pattern.mp3     → "ቲ ቅርጽ"
l-pattern.mp3     → "ኤል ቅርጽ"
fullhouse.mp3     → "ሙሉ ቤት"
```

---

## 🎯 Quick Steps to Add Files

### Step 1: Record Your Audio
Follow the recording script in:
`.kiro/specs/amharic-voice-support/recording-script.md`

### Step 2: Convert to MP3
Make sure files are:
- Format: MP3
- Bitrate: 128 kbps
- Sample Rate: 44.1 kHz
- Channels: Mono

### Step 3: Rename Files
Use the exact naming convention:
- Lowercase letters only
- Use hyphens for spaces
- Include .mp3 extension

### Step 4: Copy to Folders
```bash
# Navigate to your project
cd /path/to/your/project

# Copy number files
cp /path/to/recordings/b-*.mp3 client/public/audio/amharic/numbers/
cp /path/to/recordings/i-*.mp3 client/public/audio/amharic/numbers/
cp /path/to/recordings/n-*.mp3 client/public/audio/amharic/numbers/
cp /path/to/recordings/g-*.mp3 client/public/audio/amharic/numbers/
cp /path/to/recordings/o-*.mp3 client/public/audio/amharic/numbers/

# Copy event files
cp /path/to/recordings/game-*.mp3 client/public/audio/amharic/events/
cp /path/to/recordings/bingo-*.mp3 client/public/audio/amharic/events/
cp /path/to/recordings/winner-*.mp3 client/public/audio/amharic/events/
# ... etc

# Copy pattern files
cp /path/to/recordings/horizontal.mp3 client/public/audio/amharic/patterns/
cp /path/to/recordings/vertical.mp3 client/public/audio/amharic/patterns/
# ... etc
```

### Step 5: Verify Files
Check that all files are in place:
```bash
# Count number files (should be 75)
ls client/public/audio/amharic/numbers/*.mp3 | wc -l

# Count event files (should be 15)
ls client/public/audio/amharic/events/*.mp3 | wc -l

# Count pattern files (should be 8)
ls client/public/audio/amharic/patterns/*.mp3 | wc -l
```

---

## 📋 File Checklist

### Numbers Folder
```
☐ b-1.mp3    ☐ b-2.mp3    ☐ b-3.mp3    ☐ b-4.mp3    ☐ b-5.mp3
☐ b-6.mp3    ☐ b-7.mp3    ☐ b-8.mp3    ☐ b-9.mp3    ☐ b-10.mp3
☐ b-11.mp3   ☐ b-12.mp3   ☐ b-13.mp3   ☐ b-14.mp3   ☐ b-15.mp3

☐ i-16.mp3   ☐ i-17.mp3   ☐ i-18.mp3   ☐ i-19.mp3   ☐ i-20.mp3
☐ i-21.mp3   ☐ i-22.mp3   ☐ i-23.mp3   ☐ i-24.mp3   ☐ i-25.mp3
☐ i-26.mp3   ☐ i-27.mp3   ☐ i-28.mp3   ☐ i-29.mp3   ☐ i-30.mp3

☐ n-31.mp3   ☐ n-32.mp3   ☐ n-33.mp3   ☐ n-34.mp3   ☐ n-35.mp3
☐ n-36.mp3   ☐ n-37.mp3   ☐ n-38.mp3   ☐ n-39.mp3   ☐ n-40.mp3
☐ n-41.mp3   ☐ n-42.mp3   ☐ n-43.mp3   ☐ n-44.mp3   ☐ n-45.mp3

☐ g-46.mp3   ☐ g-47.mp3   ☐ g-48.mp3   ☐ g-49.mp3   ☐ g-50.mp3
☐ g-51.mp3   ☐ g-52.mp3   ☐ g-53.mp3   ☐ g-54.mp3   ☐ g-55.mp3
☐ g-56.mp3   ☐ g-57.mp3   ☐ g-58.mp3   ☐ g-59.mp3   ☐ g-60.mp3

☐ o-61.mp3   ☐ o-62.mp3   ☐ o-63.mp3   ☐ o-64.mp3   ☐ o-65.mp3
☐ o-66.mp3   ☐ o-67.mp3   ☐ o-68.mp3   ☐ o-69.mp3   ☐ o-70.mp3
☐ o-71.mp3   ☐ o-72.mp3   ☐ o-73.mp3   ☐ o-74.mp3   ☐ o-75.mp3
```

### Events Folder
```
☐ game-start.mp3
☐ bingo-called.mp3
☐ winner-valid.mp3
☐ winner-invalid.mp3
☐ game-paused.mp3
☐ game-resumed.mp3
☐ game-reset.mp3
☐ card-registered.mp3
☐ card-locked.mp3
☐ please-wait.mp3
☐ congratulations.mp3
☐ try-again.mp3
☐ game-over.mp3
☐ new-game.mp3
☐ all-numbers-called.mp3
```

### Patterns Folder
```
☐ horizontal.mp3
☐ vertical.mp3
☐ diagonal.mp3
☐ corners.mp3
☐ x-pattern.mp3
☐ t-pattern.mp3
☐ l-pattern.mp3
☐ fullhouse.mp3
```

---

## 🔍 How to Test

After adding files:

1. **Start the application**:
   ```bash
   npm run start:dev  # Backend
   npm run serve      # Frontend (in client folder)
   ```

2. **Open the game room**

3. **Select Amharic language** from the language selector

4. **Start a game** and listen for:
   - Number announcements when numbers are called
   - Event announcements (game start, BINGO, etc.)
   - Pattern announcements when patterns are selected

5. **Check browser console** for any missing file errors

---

## ⚠️ Common Issues

### Files Not Playing?
- Check file names are exactly correct (lowercase, hyphens)
- Verify files are in the correct folder
- Check file format is MP3
- Look for errors in browser console (F12)

### Wrong Audio Playing?
- Verify file naming matches the convention
- Check that the correct Amharic text was recorded

### Audio Quality Issues?
- Ensure bitrate is 128 kbps
- Check sample rate is 44.1 kHz
- Normalize volume across all files

---

## 📞 Need Help?

Refer to these documents:
- **Recording Script**: `.kiro/specs/amharic-voice-support/recording-script.md`
- **Requirements**: `.kiro/specs/amharic-voice-support/requirements.md`
- **Recommendation**: `AMHARIC_VOICE_SUPPORT_RECOMMENDATION.md`

---

## ✅ Summary

**Folders Created**:
- ✅ `client/public/audio/amharic/numbers/` (for 75 number files)
- ✅ `client/public/audio/amharic/events/` (for 15 event files)
- ✅ `client/public/audio/amharic/patterns/` (for 8 pattern files)

**Total Files Needed**: 98 MP3 files

**You're all set!** Just record the audio files and copy them to these folders.
