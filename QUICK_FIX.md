# ⚡ QUICK FIX - Audio Not Working

## 🎯 Do This Now (2 Minutes)

### 1. Start the server
```bash
cd client
npm run serve
```

### 2. Open test page
```
http://localhost:8080/test-audio.html
```

### 3. Click "B-1" button
- **Hear sound?** ✅ Files work! Go to step 4
- **No sound?** ❌ Check console on page for errors

### 4. Test in game
```
http://localhost:8080/
```

### 5. Press F12 (open console)

### 6. Click language toggle → **አማርኛ**
**CRITICAL:** Make sure it switches to Amharic!

### 7. Start a game
Watch console for:
```
[Audio Debug] Playing Amharic event: game-start
```

## 🔍 Quick Checks

| Check | How | Fix |
|-------|-----|-----|
| Language | Console shows `language: am` | Click toggle button |
| Volume | Slider not at 0 | Move slider up |
| Tab muted | No 🔇 icon on tab | Right-click tab → Unmute |
| Clicked page | Click anywhere first | Browser autoplay policy |

## 📋 Most Common Issue

**Language is still English!**
- Console shows: `language: en` ❌
- Should show: `language: am` ✅
- **Fix:** Click the language toggle button

## 🆘 Still Broken?

Share this from console:
1. All `[Audio Debug]` messages
2. All `[AmharicAudio]` messages  
3. Any red errors
4. Confirm: `language: am` or `language: en`?

---

**Files are verified ✅ | Code is fixed ✅ | Debug logging added ✅**

Now test and share console output! 🚀
