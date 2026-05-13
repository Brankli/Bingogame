/**
 * Amharic Audio Service
 * Manages playback of pre-recorded Amharic audio files for the bingo game
 */

export class AmharicAudioService {
  private audioCache: Map<string, HTMLAudioElement> = new Map();
  private enabled = true;
  private volume = 1.0;
  private currentAudio: HTMLAudioElement | null = null;

  constructor() {
    this.preloadCommonSounds();
  }

  /**
   * Preload frequently used audio files for faster playback
   */
  private preloadCommonSounds() {
    const commonSounds = [
      'events/game-start',
      'events/bingo-called',
      'events/winner-valid',
      'events/winner-invalid',
      'events/game-paused',
      'events/game-resumed',
    ];

    commonSounds.forEach(sound => {
      try {
        this.loadAudio(sound);
      } catch (error) {
        console.warn(`Failed to preload audio: ${sound}`, error);
      }
    });
  }

  /**
   * Load an audio file and cache it
   */
  private loadAudio(path: string): HTMLAudioElement {
    if (this.audioCache.has(path)) {
      console.log(`[AmharicAudio] Using cached audio: ${path}`);
      return this.audioCache.get(path)!;
    }

    const fullPath = `/audio/amharic/${path}.mp3`;
    console.log(`[AmharicAudio] Creating new Audio element for: ${fullPath}`);
    
    const audio = new Audio(fullPath);
    audio.preload = 'auto';
    audio.volume = this.volume;
    
    // Handle loading errors gracefully
    audio.addEventListener('error', (e) => {
      const target = e.target as HTMLAudioElement;
      const errorCode = target.error?.code;
      const errorMessage = target.error?.message;
      console.error(`[AmharicAudio] ❌ Audio file error for ${fullPath}:`, {
        code: errorCode,
        message: errorMessage,
        src: target.src,
        networkState: target.networkState,
        readyState: target.readyState
      });
    });
    
    audio.addEventListener('loadeddata', () => {
      console.log(`[AmharicAudio] ✅ Audio loaded successfully: ${path}`);
    });

    this.audioCache.set(path, audio);
    return audio;
  }

  /**
   * Play a number announcement (B-1 through O-75)
   * @param letter - The bingo letter (B, I, N, G, O)
   * @param number - The number (1-75)
   */
  async playNumber(letter: string, number: number): Promise<void> {
    if (!this.enabled) {
      console.log(`[AmharicAudio] Audio disabled, skipping number: ${letter}-${number}`);
      return;
    }

    try {
      // Stop any currently playing audio
      this.stopCurrent();

      const path = `numbers/${letter.toLowerCase()}-${number}`;
      console.log(`[AmharicAudio] Loading audio file: /audio/amharic/${path}.mp3`);
      
      const audio = this.loadAudio(path);
      
      this.currentAudio = audio;
      
      // Wait for audio to be ready
      if (audio.readyState < 2) {
        console.log(`[AmharicAudio] Waiting for audio to load: ${path}`);
        await new Promise((resolve, reject) => {
          audio.addEventListener('canplay', resolve, { once: true });
          audio.addEventListener('error', reject, { once: true });
          setTimeout(() => reject(new Error('Audio load timeout')), 5000);
        });
      }
      
      console.log(`[AmharicAudio] Playing audio: ${path}`);
      await audio.play();
      console.log(`[AmharicAudio] ✅ Successfully playing: ${path}`);
    } catch (error) {
      console.error(`[AmharicAudio] ❌ Error playing Amharic number audio: ${letter}-${number}`, error);
      throw error;
    }
  }

  /**
   * Play a game event announcement
   * @param eventName - The event name (e.g., 'game-start', 'bingo-called')
   */
  async playEvent(eventName: string): Promise<void> {
    if (!this.enabled) {
      console.log(`[AmharicAudio] Audio disabled, skipping event: ${eventName}`);
      return;
    }

    try {
      // Stop any currently playing audio
      this.stopCurrent();

      const path = `events/${eventName}`;
      console.log(`[AmharicAudio] Loading event audio file: /audio/amharic/${path}.mp3`);
      
      const audio = this.loadAudio(path);
      
      this.currentAudio = audio;
      
      // Wait for audio to be ready
      if (audio.readyState < 2) {
        console.log(`[AmharicAudio] Waiting for event audio to load: ${path}`);
        await new Promise((resolve, reject) => {
          audio.addEventListener('canplay', resolve, { once: true });
          audio.addEventListener('error', reject, { once: true });
          setTimeout(() => reject(new Error('Audio load timeout')), 5000);
        });
      }
      
      console.log(`[AmharicAudio] Playing event audio: ${path}`);
      await audio.play();
      console.log(`[AmharicAudio] ✅ Successfully playing event: ${path}`);
    } catch (error) {
      console.error(`[AmharicAudio] ❌ Error playing Amharic event audio: ${eventName}`, error);
      throw error;
    }
  }

  /**
   * Play a pattern name announcement
   * @param patternName - The pattern name (e.g., 'horizontal', 'vertical')
   */
  async playPattern(patternName: string): Promise<void> {
    if (!this.enabled) return;

    try {
      // Stop any currently playing audio
      this.stopCurrent();

      const path = `patterns/${patternName}`;
      const audio = this.loadAudio(path);
      
      this.currentAudio = audio;
      await audio.play();
    } catch (error) {
      console.warn(`Error playing Amharic pattern audio: ${patternName}`, error);
    }
  }

  /**
   * Stop currently playing audio
   */
  private stopCurrent(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
  }

  /**
   * Set volume for all audio playback (0.0 to 1.0)
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    
    // Update volume for all cached audio
    this.audioCache.forEach(audio => {
      audio.volume = this.volume;
    });

    // Update current playing audio
    if (this.currentAudio) {
      this.currentAudio.volume = this.volume;
    }
  }

  /**
   * Enable or disable audio playback
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    
    if (!enabled) {
      this.stopCurrent();
    }
  }

  /**
   * Check if audio is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Clear audio cache to free memory
   */
  clearCache(): void {
    this.stopCurrent();
    this.audioCache.clear();
  }

  /**
   * Get the current volume level
   */
  getVolume(): number {
    return this.volume;
  }
}

// Singleton instance
let amharicAudioInstance: AmharicAudioService | null = null;

/**
 * Get the singleton instance of AmharicAudioService
 */
export function getAmharicAudioService(): AmharicAudioService {
  if (!amharicAudioInstance) {
    amharicAudioInstance = new AmharicAudioService();
  }
  return amharicAudioInstance;
}
