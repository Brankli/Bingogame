import { ref } from 'vue';

type ConfirmHandler = () => void | Promise<void>;

export interface ConfirmDialogState {
  show: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  confirmColor: string;
}

export function useConfirmDialog() {
  const confirmDialog = ref<ConfirmDialogState>({
    show: false,
    title: 'Confirm',
    message: '',
    confirmLabel: 'Confirm',
    confirmColor: 'primary',
  });

  let pendingAction: ConfirmHandler | null = null;

  function openConfirm(options: {
    title: string;
    message: string;
    confirmLabel?: string;
    confirmColor?: string;
    onConfirm: ConfirmHandler;
  }): void {
    confirmDialog.value = {
      show: true,
      title: options.title,
      message: options.message,
      confirmLabel: options.confirmLabel ?? 'Confirm',
      confirmColor: options.confirmColor ?? 'primary',
    };
    pendingAction = options.onConfirm;
  }

  function cancelConfirm(): void {
    confirmDialog.value.show = false;
    pendingAction = null;
  }

  async function executeConfirm(): Promise<void> {
    const action = pendingAction;
    confirmDialog.value.show = false;
    pendingAction = null;
    if (action) {
      await action();
    }
  }

  return {
    confirmDialog,
    openConfirm,
    cancelConfirm,
    executeConfirm,
  };
}
