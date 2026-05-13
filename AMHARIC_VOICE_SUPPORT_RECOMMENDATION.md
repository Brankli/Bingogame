# Amharic Language Voice Support - Implementation Recommendation

## Current System

### Voice Implementation
The system currently uses **Web Speech API** (`window.speechSynthesis`) for voice announcements:
- Number calling: "B 5", "N 42", etc.
- Game events: "Congratulations! Card wins", "Invalid win", etc.
- Currently defaults to English language

### Current Code Location
- **File**: `client/src/views/BingoRoomView.vue`
- **Function**: `speakMessage(message: string)`
- **Usage**: Called for game announcements and number calling

## Challenge: Amharic Language Support

### The Problem
The Web Speech API has **limited or no native Amharic support** in most browsers:
- Chrome/Edge: No Amharic voices available
- Firefox: No Amharic voices available
- Safari: No Amharic voices available

### Browser Compatibility Check
```javascript
// Check available voices
const voices = window.speechSynthesis.getVoices();
const amharicVoices = voices.filter(v => v.lang.startsWith('am')); // Amharic
console.log(amharicVoices); // Likely empty []
```

## Recommended Solutions

### 🎯 Option 1: Pre-recorded Audio Files (RECOMMENDED)
**Best for: Production quality, reliability, offline support**

#### How It Works:
1. Record Amharic voice for all game phrases
2. Store audio files in the project
3. Play appropriate audio file based on event

#### Implementation Steps:

**Step 1: Record Audio Files**
```
/public/audio/amharic/
  ├── numbers/
  │   ├── b-1.mp3, b-2.mp3, ..., b-15.mp3
  │   ├── i-16.mp3, i-17.mp3, ..., i-30.mp3
  │   ├── n-31.mp3, ..., n-45.mp3
  │   ├── g-46.mp3, ..., g-60.mp3
  │   └── o-61.mp3, ..., o-75.mp3
  ├── events/
  │   ├── game-start.mp3
  │   ├── bingo-called.mp3
  │   ├── winner-valid.mp3
  │   ├── winner-invalid.mp3
  │   └── game-paused.mp3
  └── patterns/
      ├── horizontal.mp3
      ├── vertical.mp3
      ├── diagonal.mp3
      └── fullhouse.mp3
```

**Step 2: Create Audio Service**
```typescript
// client/src/services/AudioService.ts
export class AmharicAudioService {
  private audioCache: Map<string, HTMLAudioElement> = new Map();
  private enabled: boolean = true;
  
  constructor() {
    this.preloadCommonSounds();
  }
  
  private preloadCommonSounds() {
    // Preload frequently used sounds
    const commonSounds = [
      'events/game-start',
      'events/bingo-called',
      'events/winner-valid',
    ];
    
    commonSounds.forEach(sound => this.loadAudio(sound));
  }
  
  private loadAudio(path: string): HTMLAudioElement {
    if (this.audioCache.has(path)) {
      return this.audioCache.get(path)!;
    }
    
    const audio = new Audio(`/audio/amharic/${path}.mp3`);
    audio.preload = 'auto';
    this.audioCache.set(path, audio);
    return audio;
  }
  
  async playNumber(letter: string, number: number) {
    if (!this.enabled) return;
    
    const path = `numbers/${letter.toLowerCase()}-${number}`;
    const audio = this.loadAudio(path);
    
    try {
      await audio.play();
    } catch (error) {
      console.error('Error playing Amharic audio:', error);
    }
  }
  
  async playEvent(eventName: string) {
    if (!this.enabled) return;
    
    const path = `events/${eventName}`;
    const audio = this.loadAudio(path);
    
    try {
      await audio.play();
    } catch (error) {
      console.error('Error playing Amharic audio:', error);
    }
  }
  
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }
}
```

**Step 3: Language Selector Component**
```vue
<!-- client/src/components/LanguageSelector.vue -->
<template>
  <v-select
    v-model="selectedLanguage"
    :items="languages"
    label="Voice Language"
    @update:modelValue="changeLanguage"
  >
    <template v-slot:prepend>
      <v-icon>mdi-translate</v-icon>
    </template>
  </v-select>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const languages = [
  { title: 'English', value: 'en' },
  { title: 'አማርኛ (Amharic)', value: 'am' },
];

const selectedLanguage = ref('en');

const emit = defineEmits(['language-changed']);

const changeLanguage = (lang: string) => {
  emit('language-changed', lang);
  localStorage.setItem('voiceLanguage', lang);
};
</script>
```

**Step 4: Update BingoRoomView**
```typescript
// In BingoRoomView.vue
import { AmharicAudioService } from '@/services/AudioService';

const amharicAudio = new AmharicAudioService();
const currentLanguage = ref(localStorage.getItem('voiceLanguage') || 'en');

const speakMessage = (message: string) => {
  if (currentLanguage.value === 'am') {
    // Use Amharic audio
    // Map message to audio file
    const eventMap = {
      'Congratulations': 'winner-valid',
      'Invalid win': 'winner-invalid',
      'Game started': 'game-start',
    };
    
    const eventKey = Object.keys(eventMap).find(key => message.includes(key));
    if (eventKey) {
      amharicAudio.playEvent(eventMap[eventKey]);
    }
  } else {
    // Use English Web Speech API
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
  }
};

const announceNumber = (letter: string, number: number) => {
  if (currentLanguage.value === 'am') {
    amharicAudio.playNumber(letter, number);
  } else {
    const msg = new SpeechSynthesisUtterance(`${letter} ${number}`);
    msg.lang = 'en-US';
    window.speechSynthesis.speak(msg);
  }
};
```

**Pros:**
- ✅ High quality, natural voice
- ✅ Works offline
- ✅ Consistent across all browsers
- ✅ Full control over pronunciation
- ✅ No API costs

**Cons:**
- ❌ Requires recording ~100 audio files
- ❌ Larger app size (~5-10 MB)
- ❌ Cannot dynamically generate new phrases

---

### 🌐 Option 2: Google Cloud Text-to-Speech API
**Best for: Dynamic content, professional quality**

#### How It Works:
1. Send text to Google Cloud TTS API
2. Receive audio file
3. Play audio in browser

#### Implementation:

**Step 1: Setup Backend Endpoint**
```typescript
// src/tts/tts.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';

@Controller('tts')
export class TtsController {
  private client: TextToSpeechClient;
  
  constructor() {
    this.client = new TextToSpeechClient({
      keyFilename: './google-credentials.json'
    });
  }
  
  @Post('synthesize')
  async synthesize(@Body() body: { text: string; language: string }) {
    const request = {
      input: { text: body.text },
      voice: {
        languageCode: body.language === 'am' ? 'am-ET' : 'en-US',
        ssmlGender: 'NEUTRAL',
      },
      audioConfig: { audioEncoding: 'MP3' },
    };
    
    const [response] = await this.client.synthesizeSpeech(request);
    return {
      audio: response.audioContent.toString('base64'),
    };
  }
}
```

**Step 2: Frontend Service**
```typescript
// client/src/services/TTSService.ts
export class TTSService {
  async speak(text: string, language: string) {
    const response = await fetch('/api/tts/synthesize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, language }),
    });
    
    const data = await response.json();
    const audio = new Audio(`data:audio/mp3;base64,${data.audio}`);
    await audio.play();
  }
}
```

**Pros:**
- ✅ Supports Amharic (am-ET)
- ✅ High quality voice
- ✅ Dynamic text generation
- ✅ Professional quality

**Cons:**
- ❌ Requires internet connection
- ❌ API costs (~$4 per 1 million characters)
- ❌ Latency (200-500ms per request)
- ❌ Requires Google Cloud account

---

### 🔧 Option 3: Hybrid Approach (BEST SOLUTION)
**Combine pre-recorded audio + fallback TTS**

#### Strategy:
1. **Pre-record common phrases** (numbers, frequent events)
2. **Use TTS for dynamic messages** (player names, scores)
3. **Cache TTS responses** to reduce API calls

#### Implementation:
```typescript
export class HybridVoiceService {
  private audioService: AmharicAudioService;
  private ttsService: TTSService;
  private ttsCache: Map<string, string> = new Map();
  
  async speak(message: string, language: string) {
    if (language === 'am') {
      // Try pre-recorded first
      const audioFile = this.getPrerecordedAudio(message);
      if (audioFile) {
        await this.audioService.play(audioFile);
        return;
      }
      
      // Fallback to TTS with caching
      const cacheKey = `${language}-${message}`;
      if (this.ttsCache.has(cacheKey)) {
        await this.playFromCache(cacheKey);
      } else {
        const audio = await this.ttsService.speak(message, language);
        this.ttsCache.set(cacheKey, audio);
      }
    } else {
      // Use Web Speech API for English
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(message));
    }
  }
}
```

**Pros:**
- ✅ Best of both worlds
- ✅ Fast for common phrases
- ✅ Flexible for dynamic content
- ✅ Reduced API costs

**Cons:**
- ❌ More complex implementation
- ❌ Still requires some API usage

---

## Recommended Implementation Plan

### Phase 1: Basic Amharic Support (Week 1)
1. Record 75 number audio files (B-1 to O-75)
2. Record 10 common event phrases
3. Implement audio service
4. Add language selector to UI

### Phase 2: Complete Coverage (Week 2)
1. Record all game events
2. Record pattern names
3. Add audio preloading
4. Implement caching

### Phase 3: Enhancement (Week 3)
1. Add TTS fallback for dynamic messages
2. Implement audio quality settings
3. Add volume control
4. Test across devices

## Recording Guidelines

### Voice Talent Requirements:
- Native Amharic speaker
- Clear pronunciation
- Consistent tone and pace
- Professional recording equipment

### Audio Specifications:
- **Format**: MP3
- **Bitrate**: 128 kbps
- **Sample Rate**: 44.1 kHz
- **Channels**: Mono
- **Duration**: 1-3 seconds per file

### Recording Script Example:
```
Numbers:
- "ቢ አንድ" (B 1)
- "ቢ ሁለት" (B 2)
...
- "ኦ ሰባ አምስት" (O 75)

Events:
- "ጨዋታው ተጀምሯል" (Game started)
- "ቢንጎ!" (BINGO!)
- "አሸናፊ ትክክለኛ ነው" (Winner is valid)
- "ጨዋታው ቆሟል" (Game paused)
```

## Cost Estimation

### Option 1 (Pre-recorded):
- Voice talent: $200-500
- Recording studio: $100-300
- Audio editing: $100-200
- **Total**: $400-1000 (one-time)

### Option 2 (Google TTS):
- Setup: Free
- Usage: ~$4 per 1M characters
- Estimated monthly: $10-50
- **Total**: $120-600/year (recurring)

### Option 3 (Hybrid):
- Initial: $400-1000
- Monthly API: $5-20
- **Total**: $460-1240 first year, $60-240/year after

## Recommendation Summary

**🎯 I recommend Option 1 (Pre-recorded Audio) for your use case because:**

1. **One-time cost** - No recurring API fees
2. **Offline support** - Works without internet
3. **Consistent quality** - Same voice every time
4. **Fast performance** - No API latency
5. **Simple implementation** - No external dependencies
6. **Bingo-specific** - Limited vocabulary (75 numbers + ~20 phrases)

The total vocabulary needed is small enough that pre-recording is practical and cost-effective.

## Next Steps

Would you like me to:
1. **Create a spec** for implementing pre-recorded Amharic audio support?
2. **Provide the complete recording script** in Amharic?
3. **Implement the audio service** with language switching?
4. **Set up the hybrid approach** with TTS fallback?

Let me know which direction you'd like to proceed!
