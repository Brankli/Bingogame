/**
 * Toast Audio Service
 * Plays audio for toast notifications based on language setting
 */

export interface ToastMessage {
  key: string;
  en: string;
  am: string;
  audioFile?: string; // Optional audio file name
}

export const TOAST_MESSAGES: Record<string, ToastMessage> = {
  // Game Start Messages
  GAME_STARTED: {
    key: 'GAME_STARTED',
    en: 'Game started successfully!',
    am: 'ጨዋታው በተሳካ ሁኔታ ተጀምሯል!',
    audioFile: 'game-started',
  },
  GAME_PAUSED: {
    key: 'GAME_PAUSED',
    en: 'Game paused. BINGO called!',
    am: 'ጨዋታው ቆሟል። ቢንጎ ተጠርቷል!',
    audioFile: 'game-paused',
  },
  GAME_RESUMED: {
    key: 'GAME_RESUMED',
    en: 'Game resumed. Continuing to call numbers.',
    am: 'ጨዋታው ቀጥሏል። ቁጥሮችን መጥራት ቀጥሏል።',
    audioFile: 'game-resumed',
  },
  GAME_FINISHED: {
    key: 'GAME_FINISHED',
    en: 'Game finished! Congratulations to all winners!',
    am: 'ጨዋታው አልቋል! ለሁሉም አሸናፊዎች እንኳን ደስ አላችሁ!',
    audioFile: 'game-finished',
  },

  // Winner Messages
  WINNER_VALID: {
    key: 'WINNER_VALID',
    en: 'Valid win! Congratulations!',
    am: 'ትክክለኛ አሸናፊ! እንኳን ደስ አለህ!',
    audioFile: 'winner-valid',
  },
  WINNER_INVALID: {
    key: 'WINNER_INVALID',
    en: 'Invalid win. Card will be locked.',
    am: 'ትክክለኛ አሸናፊ አይደለም። ካርዱ ይቆለፋል።',
    audioFile: 'winner-invalid',
  },
  WINNER_LATE: {
    key: 'WINNER_LATE',
    en: 'Late claim! You must call BINGO immediately.',
    am: 'ዘግይተህ ጠርተሃል! ቢንጎን ወዲያውኑ መጥራት አለብህ።',
    audioFile: 'winner-late',
  },

  // Card Messages
  CARD_REGISTERED: {
    key: 'CARD_REGISTERED',
    en: 'Card registered successfully!',
    am: 'ካርድ በተሳካ ሁኔታ ተመዝግቧል!',
    audioFile: 'card-registered',
  },
  CARD_UNREGISTERED: {
    key: 'CARD_UNREGISTERED',
    en: 'Card unregistered.',
    am: 'ካርድ ተሰርዟል።',
    audioFile: 'card-unregistered',
  },
  CARD_LOCKED: {
    key: 'CARD_LOCKED',
    en: 'Card is locked due to invalid claim.',
    am: 'ካርዱ በተሳሳተ ጥያቄ ምክንያት ተቆልፏል።',
    audioFile: 'card-locked',
  },

  // Speed Control
  SPEED_CHANGED: {
    key: 'SPEED_CHANGED',
    en: 'Calling speed changed',
    am: 'የጥሪ ፍጥነት ተቀይሯል',
    audioFile: 'speed-changed',
  },

  // Connection Messages
  CONNECTED: {
    key: 'CONNECTED',
    en: 'Connected to game server',
    am: 'ከጨዋታ አገልጋይ ጋር ተገናኝቷል',
    audioFile: 'connected',
  },
  DISCONNECTED: {
    key: 'DISCONNECTED',
    en: 'Disconnected from server. Reconnecting...',
    am: 'ከአገልጋይ ተቋርጧል። እንደገና በመገናኘት ላይ...',
    audioFile: 'disconnected',
  },
  CONNECTION_ERROR: {
    key: 'CONNECTION_ERROR',
    en: 'Connection error. Please check your internet.',
    am: 'የግንኙነት ስህተት። እባክዎ በይነመረብዎን ያረጋግጡ።',
    audioFile: 'connection-error',
  },

  // Error Messages
  NO_CARDS_REGISTERED: {
    key: 'NO_CARDS_REGISTERED',
    en: 'Please register at least one card before starting.',
    am: 'እባክዎ ከመጀመርዎ በፊት ቢያንስ አንድ ካርድ ያስመዝግቡ።',
    audioFile: 'no-cards-registered',
  },
  PERMISSION_DENIED: {
    key: 'PERMISSION_DENIED',
    en: 'Only admin or manager can perform this action.',
    am: 'ይህን ድርጊት ማከናወን የሚችለው አስተዳዳሪ ወይም ስራ አስኪያጅ ብቻ ነው።',
    audioFile: 'permission-denied',
  },

  // Success Messages
  SUCCESS: {
    key: 'SUCCESS',
    en: 'Operation completed successfully!',
    am: 'ስራው በተሳካ ሁኔታ ተጠናቋል!',
    audioFile: 'success',
  },
  SAVED: {
    key: 'SAVED',
    en: 'Settings saved successfully!',
    am: 'ቅንብሮች በተሳካ ሁኔታ ተቀምጠዋል!',
    audioFile: 'saved',
  },
};

class ToastAudioService {
  private currentLanguage: string = 'en';
  private audioCache: Map<string, HTMLAudioElement> = new Map();
  private volume: number = 0.7;
  private enabled: boolean = true;

  constructor() {
    // Load language from localStorage
    this.currentLanguage = localStorage.getItem('voiceLanguage') || 'en';
  }

  /**
   * Set the current language
   */
  setLanguage(lang: 'en' | 'am'): void {
    this.currentLanguage = lang;
    localStorage.setItem('voiceLanguage', lang);
  }

  /**
   * Get current language
   */
  getLanguage(): string {
    return this.currentLanguage;
  }

  /**
   * Set volume (0.0 to 1.0)
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    // Update all cached audio elements
    this.audioCache.forEach(audio => {
      audio.volume = this.volume;
    });
  }

  /**
   * Enable or disable toast audio
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    localStorage.setItem('toastAudioEnabled', enabled ? 'true' : 'false');
  }

  /**
   * Check if toast audio is enabled
   */
  isEnabled(): boolean {
    const stored = localStorage.getItem('toastAudioEnabled');
    return stored === null ? true : stored === 'true';
  }

  /**
   * Get message text in current language
   */
  getMessage(messageKey: string): string {
    const message = TOAST_MESSAGES[messageKey];
    if (!message) return messageKey;
    
    return this.currentLanguage === 'am' ? message.am : message.en;
  }

  /**
   * Play audio for a toast message
   */
  async playToastAudio(messageKey: string): Promise<void> {
    if (!this.enabled || !this.isEnabled()) {
      console.log('[ToastAudio] Audio disabled');
      return;
    }

    const message = TOAST_MESSAGES[messageKey];
    if (!message || !message.audioFile) {
      console.log('[ToastAudio] No audio file for:', messageKey);
      return;
    }

    // Only play Amharic audio files
    if (this.currentLanguage !== 'am') {
      console.log('[ToastAudio] English mode - no audio file');
      return;
    }

    const audioPath = `/audio/amharic/toasts/${message.audioFile}.mp3`;
    
    try {
      let audio = this.audioCache.get(audioPath);
      
      if (!audio) {
        audio = new Audio(audioPath);
        audio.volume = this.volume;
        audio.preload = 'auto';
        
        // Cache the audio element
        this.audioCache.set(audioPath, audio);
        
        // Wait for audio to load
        await new Promise((resolve, reject) => {
          audio!.addEventListener('canplaythrough', resolve, { once: true });
          audio!.addEventListener('error', reject, { once: true });
        });
      }

      // Reset and play
      audio.currentTime = 0;
      await audio.play();
      console.log('[ToastAudio] ✅ Played:', audioPath);
    } catch (error) {
      console.warn('[ToastAudio] ❌ Error playing audio:', audioPath, error);
      // Silently fail - toast will still show
    }
  }

  /**
   * Preload common toast audio files
   */
  async preloadCommonAudios(): Promise<void> {
    if (this.currentLanguage !== 'am') return;

    const commonMessages = [
      'GAME_STARTED',
      'GAME_PAUSED',
      'GAME_RESUMED',
      'WINNER_VALID',
      'WINNER_INVALID',
      'CARD_REGISTERED',
    ];

    for (const key of commonMessages) {
      const message = TOAST_MESSAGES[key];
      if (message?.audioFile) {
        const audioPath = `/audio/amharic/toasts/${message.audioFile}.mp3`;
        try {
          const audio = new Audio(audioPath);
          audio.volume = this.volume;
          audio.preload = 'auto';
          this.audioCache.set(audioPath, audio);
        } catch (error) {
          console.warn('[ToastAudio] Failed to preload:', audioPath);
        }
      }
    }
  }
}

// Export singleton instance
export const toastAudioService = new ToastAudioService();
