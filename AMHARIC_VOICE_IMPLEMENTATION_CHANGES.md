# Amharic Voice Support - Implementation Changes

## Files Created

1. ✅ `client/src/services/AmharicAudioService.ts` - Audio service for Amharic playback
2. ✅ `client/src/components/LanguageSelector.vue` - Language selection component
3. ✅ `client/src/components/VolumeControl.vue` - Volume control component

## Changes Needed in BingoRoomView.vue

### 1. Add Imports (after line 621)

```typescript
import LanguageSelector from '@/components/LanguageSelector.vue';
import VolumeControl from '@/components/VolumeControl.vue';
import { getAmharicAudioService } from '@/services/AmharicAudioService';
```

### 2. Add Reactive Variables (after line 668)

```typescript
// Language and audio support
const currentLanguage = ref(localStorage.getItem('voiceLanguage') || 'en');
const amharicAudio = getAmharicAudioService();
```

### 3. Replace speakMessage Function (around line 768)

**OLD CODE:**
```typescript
const speakMessage = (message: string) => {
  try {
    window.speechSynthesis.cancel();
    const voiceMessage = new SpeechSynthesisUtterance(message);
    voiceMessage.rate = 1;
    voiceMessage.pitch = 1;
    window.speechSynthesis.speak(voiceMessage);
  } catch (error) {
    console.error('Speech synthesis error:', error);
  }
};
```

**NEW CODE:**
```typescript
const speakMessage = async (message: string) => {
  if (currentLanguage.value === 'am') {
    // Use Amharic audio for specific messages
    const eventMap: Record<string, string> = {
      'Congratulations': 'congratulations',
      'Invalid win': 'winner-invalid',
      'Game started': 'game-start',
      'Game paused': 'game-paused',
      'Game resumed': 'game-resumed',
      'Please register': 'please-wait',
      'Card locked': 'card-locked',
    };
    
    // Find matching event
    const eventKey = Object.keys(eventMap).find(key => message.includes(key));
    if (eventKey) {
      await amharicAudio.playEvent(eventMap[eventKey]);
      return;
    }
  }
  
  // Fallback to English Web Speech API
  try {
    window.speechSynthesis.cancel();
    const voiceMessage = new SpeechSynthesisUtterance(message);
    voiceMessage.lang = 'en-US';
    voiceMessage.rate = 1;
    voiceMessage.pitch = 1;
    window.speechSynthesis.speak(voiceMessage);
  } catch (error) {
    console.error('Speech synthesis error:', error);
  }
};
```

### 4. Add Number Announcement Function (after speakMessage)

```typescript
const announceNumber = async (letter: string, number: number) => {
  if (currentLanguage.value === 'am') {
    await amharicAudio.playNumber(letter, number);
  } else {
    try {
      const msg = new SpeechSynthesisUtterance(`${letter} ${number}`);
      msg.lang = 'en-US';
      window.speechSynthesis.speak(msg);
    } catch (error) {
      console.error('Speech synthesis error:', error);
    }
  }
};
```

### 5. Add Language Change Handler

```typescript
const handleLanguageChange = (lang: string) => {
  currentLanguage.value = lang;
  const message = lang === 'am' ? 'Language changed to Amharic' : 'Language changed to English';
  showToast(message, 'info');
};
```

### 6. Add Volume Change Handler

```typescript
const handleVolumeChange = (volume: number) => {
  amharicAudio.setVolume(volume);
  
  // Also update Web Speech API volume if possible
  // Note: Web Speech API doesn't support volume control directly
};
```

### 7. Update Socket Event Handler for Number Calling (around line 1244)

**Find this code:**
```typescript
client?.on(EXTRACTED_NUMBERS_EVENT, ({ number }: { number: number }) => {
  // ... existing code ...
  
  // Announce number
  const letter = getBallLetter(number);
  const msg = new SpeechSynthesisUtterance(`${letter} ${number}`);
  window.speechSynthesis.speak(msg);
});
```

**Replace with:**
```typescript
client?.on(EXTRACTED_NUMBERS_EVENT, ({ number }: { number: number }) => {
  // ... existing code ...
  
  // Announce number in selected language
  const letter = getBallLetter(number);
  announceNumber(letter, number);
});
```

### 8. Update onBeforeUnmount (around line 1293)

**Add this line:**
```typescript
onBeforeUnmount(() => {
  // ... existing cleanup code ...
  
  // Stop speech synthesis
  window.speechSynthesis.cancel();
  
  // Clear Amharic audio cache
  amharicAudio.clearCache();
});
```

### 9. Add UI Components in Template

**Find the left panel card (around line 30-60) and add after the pattern preview:**

```vue
<!-- Language and Volume Controls -->
<v-card class="mb-4" v-if="canManageRoom">
  <v-card-title class="text-subtitle-1">
    <v-icon class="mr-2">mdi-volume-high</v-icon>
    Voice Settings
  </v-card-title>
  <v-card-text>
    <LanguageSelector 
      @language-changed="handleLanguageChange"
      class="mb-3"
    />
    <VolumeControl 
      @volume-changed="handleVolumeChange"
    />
  </v-card-text>
</v-card>
```

## Audio File Mapping Reference

### Numbers (75 files)
- B column: `b-1.mp3` to `b-15.mp3`
- I column: `i-16.mp3` to `i-30.mp3`
- N column: `n-31.mp3` to `n-45.mp3`
- G column: `g-46.mp3` to `g-60.mp3`
- O column: `o-61.mp3` to `o-75.mp3`

### Events (15 files)
- `game-start.mp3` - Game started
- `bingo-called.mp3` - BINGO called
- `winner-valid.mp3` - Winner is valid
- `winner-invalid.mp3` - Invalid winner
- `game-paused.mp3` - Game paused
- `game-resumed.mp3` - Game resumed
- `game-reset.mp3` - Game reset
- `card-registered.mp3` - Card registered
- `card-locked.mp3` - Card locked
- `please-wait.mp3` - Please wait
- `congratulations.mp3` - Congratulations
- `try-again.mp3` - Try again
- `game-over.mp3` - Game over
- `new-game.mp3` - New game
- `all-numbers-called.mp3` - All numbers called

### Patterns (8 files)
- `horizontal.mp3` - Horizontal line
- `vertical.mp3` - Vertical line
- `diagonal.mp3` - Diagonal line
- `corners.mp3` - Four corners
- `x-pattern.mp3` - X pattern
- `t-pattern.mp3` - T pattern
- `l-pattern.mp3` - L pattern
- `fullhouse.mp3` - Full house

## Testing Checklist

After implementation:

1. [ ] Language selector appears in the game room
2. [ ] Volume control appears in the game room
3. [ ] Selecting Amharic changes language preference
4. [ ] Language preference persists after page reload
5. [ ] Volume changes affect audio playback
6. [ ] Volume preference persists after page reload
7. [ ] Missing audio files don't crash the game
8. [ ] Console shows warnings for missing files
9. [ ] English still works when selected
10. [ ] Game continues if audio fails to play

## Next Steps

1. Apply the changes to `BingoRoomView.vue`
2. Test the language selector and volume control
3. Add audio files to the folders as they become available
4. Test each audio file as it's added
5. Verify all 98 files are working correctly

## Notes

- The code is designed to fail gracefully if audio files are missing
- Console warnings will show which files are missing
- The game will continue to work even without audio files
- You can add audio files incrementally and test as you go
