import { ref } from 'vue';
import type { User } from '@/types/user';
import type { EarningsTransaction } from '@/types/earnings';
import type { Services } from '@/services';

export function formatFee(amount: number): string {
  return Number(amount || 0).toFixed(2);
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return 'Invalid Date';

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return `${day}-${month}-${year} ${hours}:${minutes}`;
}

export function getActivityColor(lastActive: string | Date | null | undefined): string {
  if (!lastActive) return 'grey';

  const diffMinutes =
    (Date.now() - new Date(lastActive).getTime()) / (1000 * 60);

  if (diffMinutes <= 5) return 'success';
  if (diffMinutes <= 60) return 'warning';
  if (diffMinutes <= 10080) return 'info';
  return 'grey';
}

export function getActivityText(lastActive: string | Date | null | undefined): string {
  if (!lastActive) return 'Never active';

  const diffMinutes =
    (Date.now() - new Date(lastActive).getTime()) / (1000 * 60);

  if (diffMinutes < 1) return 'Active now';
  if (diffMinutes < 5) return `${Math.floor(diffMinutes)} min ago`;
  if (diffMinutes < 60) return `${Math.floor(diffMinutes)} minutes ago`;
  if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} hours ago`;
  if (diffMinutes < 10080) return `${Math.floor(diffMinutes / 1440)} days ago`;
  return 'Inactive (7+ days)';
}

export function matchesActivityFilter(
  lastActive: string | Date | null | undefined,
  filter: string,
): boolean {
  if (filter === 'All') return true;
  if (!lastActive) return filter === 'Inactive';

  const diffMinutes =
    (Date.now() - new Date(lastActive).getTime()) / (1000 * 60);

  switch (filter) {
    case 'Online Now':
      return diffMinutes <= 5;
    case 'Active Today':
      return diffMinutes <= 1440;
    case 'This Week':
      return diffMinutes <= 10080;
    case 'Inactive':
      return diffMinutes > 10080;
    default:
      return true;
  }
}

export function formatTransactionType(type: string): string {
  return String(type || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function useEarningsManagement(services: Services | undefined) {
  const showAdjustDialog = ref(false);
  const showHistoryDialog = ref(false);
  const selectedUser = ref<User | null>(null);
  const adjustmentType = ref<'add' | 'subtract' | 'payout' | 'reset'>('add');
  const adjustmentAmount = ref(0);
  const adjustmentReason = ref('');
  const adjusting = ref(false);
  const earningsHistory = ref<EarningsTransaction[]>([]);
  const loadingHistory = ref(false);

  function openAdjustEarnings(user: User, type: 'add' | 'subtract' | 'payout' | 'reset') {
    selectedUser.value = user;
    adjustmentType.value = type;
    adjustmentAmount.value = 0;
    adjustmentReason.value = '';
    showAdjustDialog.value = true;
  }

  async function loadEarningsHistory(userId: number) {
    loadingHistory.value = true;
    try {
      const response = await services?.userService.getEarningsHistory(userId);
      const payload = response?.data as
        | EarningsTransaction[]
        | { data?: EarningsTransaction[] }
        | undefined;
      if (Array.isArray(payload)) {
        earningsHistory.value = payload;
      } else if (payload && Array.isArray(payload.data)) {
        earningsHistory.value = payload.data;
      } else {
        earningsHistory.value = [];
      }
    } catch {
      earningsHistory.value = [];
    } finally {
      loadingHistory.value = false;
    }
  }

  async function viewEarningsHistory(user: User) {
    selectedUser.value = user;
    showHistoryDialog.value = true;
    await loadEarningsHistory(user.id);
  }

  function getAdjustmentColor(type: string): string {
    switch (type) {
      case 'add':
        return 'success';
      case 'subtract':
        return 'warning';
      case 'payout':
        return 'info';
      case 'reset':
        return 'error';
      default:
        return 'primary';
    }
  }

  function getAdjustmentIcon(type: string): string {
    switch (type) {
      case 'add':
        return 'mdi-plus-circle';
      case 'subtract':
        return 'mdi-minus-circle';
      case 'payout':
        return 'mdi-bank-transfer';
      case 'reset':
        return 'mdi-refresh';
      default:
        return 'mdi-cash';
    }
  }

  function getAdjustmentTitle(type: string): string {
    switch (type) {
      case 'add':
        return 'Add Earnings';
      case 'subtract':
        return 'Subtract Earnings';
      case 'payout':
        return 'Process Payout';
      case 'reset':
        return 'Reset Earnings';
      default:
        return 'Adjust Earnings';
    }
  }

  return {
    showAdjustDialog,
    showHistoryDialog,
    selectedUser,
    adjustmentType,
    adjustmentAmount,
    adjustmentReason,
    adjusting,
    earningsHistory,
    loadingHistory,
    openAdjustEarnings,
    viewEarningsHistory,
    loadEarningsHistory,
    getAdjustmentColor,
    getAdjustmentIcon,
    getAdjustmentTitle,
  };
}
