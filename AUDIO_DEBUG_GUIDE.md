# 🔊 Audio Debugging Guide

## Problem: Amharic Audio Not Playing

I've added comprehensive debug logging to help identify why the audio isn't working.

## ✅ Changes Made

### 1. Enhanced Debug Logging
- Added `[Audio Debug]` logs in BingoRoomView.vue
- Added `[AmharicAudio]` logs in AmharicAudioService.ts
- Better error messages with error codes and details

### 2. Improved Error Handling
- Added audio loading state checks
- Added timeout protection (5 seconds)
- Better error reporting with network state and ready state

### 3. Created Test Page
- Simple HTML page to test audio files directly
- Located at: `http://localhost:8080/test-audio.html`

## 🧪 How to Debug

### Step 1: Open Browser Console
1. Open your bingo game in the browser
2. Press `F12` to open Developer Tools
3. Go to the **Console** tab
4. Keep it open while testing

### Step 2: Test with the Test Page
1. Navigate to: `http://localhost:8080/test-audio.html`
2. Click on different audio buttons
3. Watch the console log on the page
4. Look for error messages

**Expected Results:**
- ✅ Green messages = Success
- ❌ Red messages = Errors (file not found, format issues, etc.)

### Step 3: Test in the Game
1. Switch language to **አማርኛ** (Amharic)
2. Watch the browser console
3. Try these actions:

#### Test Numbers:
- Start a game
- Call a number
- **Look for:** `[Audio Debug] announceNumber called: B-1`
- **Look for:** `[AmharicAudio] Loading audio file: /audio/amharic/numbers/b-1.mp3`
- **Look for:** `[AmharicAudio] ✅ Successfully playing: numbers/b-1`

#### Test Events:
- Start a game
- **Look for:** `[Audio Debug] ✅ Playing Amharic event: game-start`
- Pause the game
- **Look for:** `[Audio Debug] ✅ Playing Amharic event: game-paused`

## 🔍 Common Issues & Solutions

### Issue 1: "Audio file error - MEDIA_ERR_SRC_NOT_SUPPORTED"
**Cause:** File doesn't exist or wrong path

**Solution:**
```bash
# Check if files exist
ls -la client/public/audio/amharic/numbers/
ls -la client/public/audio/amharic/events/

# Files should be named like:
# b-1.mp3, b-2.mp3, i-16.mp3, etc.
# game-start.mp3, congratulations.mp3, etc.
```

### Issue 2: "Audio disabled, skipping..."
**Cause:** Audio service is disabled

**Solution:**
- Check if volume is set to 0
- Check if audio was disabled in settings
- Try adjusting the volume slider

### Issue 3: "No Amharic mapping found for message"
**Cause:** Message doesn't match any event mapping

**Solution:**
- Check the console to see what message was sent
- The message might need to be added to the event map
- Example: If you see `"Some new message"`, add it to the eventMap

### Issue 4: Audio plays but no sound
**Cause:** Volume is 0 or browser is muted

**Solution:**
- Check browser tab isn't muted (look for 🔇 icon)
- Check system volume
- Use the volume slider in the game
- Check browser's site permissions for audio

### Issue 5: "Audio load timeout"
**Cause:** File is taking too long to load

**Solution:**
- Check network connection
- Check if file is too large (should be < 1MB)
- Check server is running properly

## 📊 Debug Console Output Examples

### ✅ Successful Number Play:
```
[Audio Debug] announceNumber called: B-5, language: am
[AmharicAudio] Loading audio file: /audio/amharic/numbers/b-5.mp3
[AmharicAudio] Using cached audio: numbers/b-5
[AmharicAudio] Playing audio: numbers/b-5
[AmharicAudio] ✅ Successfully playing: numbers/b-5
```

### ✅ Successful Event Play:
```
[Audio Debug] speakMessage called with: "Game started successfully.", language: am
[Audio Debug] ✅ Playing Amharic event: game-start for message: "Game started successfully."
[AmharicAudio] Loading event audio file: /audio/amharic/events/game-start.mp3
[AmharicAudio] Creating new Audio element for: /audio/amharic/events/game-start.mp3
[AmharicAudio] ✅ Audio loaded successfully: events/game-start
[AmharicAudio] Playing event audio: events/game-start
[AmharicAudio] ✅ Successfully playing event: events/game-start
```

### ❌ File Not Found:
```
[Audio Debug] announceNumber called: B-1, language: am
[AmharicAudio] Loading audio file: /audio/amharic/numbers/b-1.mp3
[AmharicAudio] Creating new Audio element for: /audio/amharic/numbers/b-1.mp3
[AmharicAudio] ❌ Audio file error for /audio/amharic/numbers/b-1.mp3: {
  code: 4,
  message: "MEDIA_ERR_SRC_NOT_SUPPORTED",
  src: "http://localhost:8080/audio/amharic/numbers/b-1.mp3",
  networkState: 3,
  readyState: 0
}
[AmharicAudio] ❌ Error playing Amharic number audio: B-1
```

## 🎯 Quick Checklist

Before reporting issues, verify:

- [ ] Files exist in `client/public/audio/amharic/numbers/` and `events/`
- [ ] Files are named correctly (lowercase, with hyphens)
- [ ] Files are `.mp3` format
- [ ] Language is set to **አማርኛ** (Amharic)
- [ ] Volume is not 0
- [ ] Browser tab is not muted
- [ ] Browser console shows debug messages
- [ ] No red error messages in console

## 🔧 Testing Commands

### Check file structure:
```bash
# From project root
tree client/public/audio/amharic/

# Or list files
find client/public/audio/amharic -name "*.mp3" | sort
```

### Check file sizes:
```bash
# Files should be reasonable size (< 1MB each)
du -h client/public/audio/amharic/numbers/*.mp3
du -h client/public/audio/amharic/events/*.mp3
```

### Test a file directly:
```bash
# Try playing with a media player
mpv client/public/audio/amharic/numbers/b-1.mp3
# or
vlc client/public/audio/amharic/numbers/b-1.mp3
```

## 📝 What to Report

If audio still doesn't work, provide:

1. **Console output** (copy all `[Audio Debug]` and `[AmharicAudio]` messages)
2. **File listing:**
   ```bash
   ls -la client/public/audio/amharic/numbers/ | head -20
   ls -la client/public/audio/amharic/events/
   ```
3. **Browser info:** Chrome/Firefox/Safari version
4. **What you tried:** Which buttons you clicked
5. **Language setting:** Confirm it's set to አማርኛ

## 🎬 Next Steps

1. **Rebuild the client** (if you haven't):
   ```bash
   cd client
   npm run build
   ```

2. **Restart the dev server**:
   ```bash
   npm run serve
   ```

3. **Test with the test page first**: `http://localhost:8080/test-audio.html`

4. **Then test in the game** with console open

5. **Share the console output** so we can see exactly what's happening
