/**
 * Bilingual Toast Composable
 * Shows toast messages in English or Amharic with optional audio
 */

import { ref } from 'vue';
import { toastAudioService, TOAST_MESSAGES } from '@/services/ToastAudioService';

export interface ToastOptions {
  color?: string;
  timeout?: number;
  playAudio?: boolean;
}

export function useBilingualToast() {
  const toast = ref<{ show: boolean; message: string; color: string }>({
    show: false,
    message: '',
    color: 'info',
  });

  /**
   * Show a toast message with optional audio
   * @param messageKey - Key from TOAST_MESSAGES or custom text
   * @param options - Toast options
   */
  const showToast = async (
    messageKey: string,
    options: ToastOptions = {}
  ): Promise<void> => {
    const {
      color = 'info',
      timeout = 3000,
      playAudio = true,
    } = options;

    // Get message text in current language
    const message = TOAST_MESSAGES[messageKey]
      ? toastAudioService.getMessage(messageKey)
      : messageKey; // Use as-is if not a key

    // Show toast
    toast.value = {
      show: true,
      message,
      color,
    };

    // Play audio if enabled
    if (playAudio && TOAST_MESSAGES[messageKey]) {
      await toastAudioService.playToastAudio(messageKey);
    }

    // Auto-hide after timeout
    if (timeout > 0) {
      setTimeout(() => {
        toast.value.show = false;
      }, timeout);
    }
  };

  /**
   * Show success toast
   */
  const showSuccess = async (messageKey = 'SUCCESS'): Promise<void> => {
    await showToast(messageKey, { color: 'success' });
  };

  /**
   * Show error toast
   */
  const showError = async (messageKey: string): Promise<void> => {
    await showToast(messageKey, { color: 'error' });
  };

  /**
   * Show warning toast
   */
  const showWarning = async (messageKey: string): Promise<void> => {
    await showToast(messageKey, { color: 'warning' });
  };

  /**
   * Show info toast
   */
  const showInfo = async (messageKey: string): Promise<void> => {
    await showToast(messageKey, { color: 'info' });
  };

  /**
   * Hide current toast
   */
  const hideToast = (): void => {
    toast.value.show = false;
  };

  return {
    toast,
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hideToast,
  };
}
