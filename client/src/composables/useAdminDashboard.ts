import { ref, inject, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuth } from '@/store/auth';
import { useSocket } from '@/store/socket';
import type { Services } from '@/services';
import { NEW_ROOM_AVAILABLE_EVENT } from '@/constants/socketEvents';
import { storeToRefs } from 'pinia';
import { UserRole } from '@/types/user';
import { useConfirmDialog } from '@/composables/useConfirmDialog';
import type { RoomCardPreview, RoomCardStatus } from '@/types/roomCards';

let adminDashboardSingleton: AdminDashboardContext | null = null;

const ADMIN_TABS = ['dashboard', 'rooms', 'users', 'register', 'cards', 'profile'] as const;
type AdminTab = (typeof ADMIN_TABS)[number];

function isAdminTab(value: string): value is AdminTab {
  return (ADMIN_TABS as readonly string[]).includes(value);
}

function createAdminDashboardState() {
  // Store
  const auth = useAuth();
const { user } = storeToRefs(auth);
const router = useRouter();
const route = useRoute();
const socketStore = useSocket();
let adminDataInitialized = false;

// State
const showLogoutDialog = ref(false);
const drawer = ref(true);
const rail = ref(false);
const toast = ref<{ show: boolean; message: string; color: string }>({
  show: false,
  message: '',
  color: 'info',
});

const {
  confirmDialog,
  openConfirm,
  cancelConfirm,
  executeConfirm,
} = useConfirmDialog();

const currentDate = computed(() => {
  const date = new Date();
  return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
});

const currentTime = computed(() => {
  const date = new Date();
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
});

// Services
const services = inject<Services>('services');

// Data
function resolveInitialTab(): AdminTab {
  const fromQuery = route.query.tab;
  if (typeof fromQuery === 'string' && isAdminTab(fromQuery)) {
    return fromQuery;
  }

  const saved = sessionStorage.getItem('adminActiveTab');
  if (saved && isAdminTab(saved)) {
    return saved;
  }

  return 'dashboard';
}

const activeTab = ref<AdminTab>(resolveInitialTab());

watch(activeTab, (tab) => {
  sessionStorage.setItem('adminActiveTab', tab);
  if (route.query.tab !== tab) {
    router.replace({ name: 'admin-dashboard', query: { tab } });
  }
});

watch(
  () => route.query.tab,
  (tab) => {
    if (typeof tab === 'string' && isAdminTab(tab) && activeTab.value !== tab) {
      activeTab.value = tab;
    }
  },
);
const rooms = ref<any[]>([]);
const users = ref<any[]>([]);
const newRoom = ref<{ name: string; cardMode: 'static' | 'automatic' }>({
  name: '',
  cardMode: 'automatic',
});
const staticLibraryStatus = ref<{
  total: number;
  complete: boolean;
  message: string;
} | null>(null);
const generatingStaticLibrary = ref(false);
const newUser = ref({ username: '', password: '', role: 'user' });
const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});
const changingPassword = ref(false);
const selectedRoomForManager = ref<number | null>(null);
const selectedUserForManager = ref<number | null>(null);
const editingUserId = ref<number | null>(null);
const editForm = ref<{ role: UserRole; houseFee: number }>({
  role: UserRole.USER,
  houseFee: 0,
});
const cards = ref<any[]>([]);
const roomCards = ref<any[]>([]);
const cardSearch = ref('');
const generating = ref(false);
const generatingRoomCards = ref(false);
const copyingCards = ref(false);
const selectedRoomForCard = ref<number | null>(null);
const selectedUserForCard = ref<number | null>(null);
const selectedCardNumber = ref<string | null>(null);
const selectedRoomForCardView = ref<number | null>(null);
const selectedSourceRoom = ref<number | null>(null);

// Pagination
const usersPage = ref(1);
const usersPerPage = ref(10);
const roomsPage = ref(1);
const roomsPerPage = ref(10);
const cardsPage = ref(1);
const cardsPerPage = ref(10);
const roomCardsPage = ref(1);
const roomCardsPerPage = ref(10);
const roomCardStatus = ref<RoomCardStatus | null>(null);
const cardGenProgress = ref(0);
const previewCardData = ref<RoomCardPreview | null>(null);
const showCardPreviewDialog = ref(false);
const previewCardIndex = ref(1);
const loadingCardStatus = ref(false);

const roleOptions = [
  { title: 'User', value: 'user' },
  { title: 'Admin', value: 'admin' },
];

function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const maybeResponse = (error as { response?: { data?: { message?: string } } })
      .response;
    if (maybeResponse?.data?.message) {
      return maybeResponse.data.message;
    }
    const maybeMessage = (error as { message?: string }).message;
    if (maybeMessage) {
      return maybeMessage;
    }
  }
  return 'Unexpected error';
}

// Computed
const totalUsers = computed(() => users.value.length);
const adminCount = computed(() => users.value.filter(u => u.role === 'admin').length);

// Filter out users who are already assigned as managers to any room (1-to-1 relationship)
const managerCandidates = computed(() => {
  // Get all user IDs that are already assigned as managers to any room
  const assignedUserIds = new Set<number>();
  
  rooms.value.forEach((room: any) => {
    if (room.managers && Array.isArray(room.managers)) {
      room.managers.forEach((manager: any) => {
        if (manager.user?.id) {
          assignedUserIds.add(manager.user.id);
        }
      });
    }
  });
  
  // Filter out admins and users who are already assigned to any room
  return users.value.filter((u: any) => {
    const isAdmin = String(u.role || '').toLowerCase() === 'admin';
    const isAlreadyAssigned = assignedUserIds.has(u.id);
    
    // Only show users who are NOT admins AND NOT already assigned
    return !isAdmin && !isAlreadyAssigned;
  });
});

const selectedRoomManagers = computed(() => {
  const room = rooms.value.find((r: any) => r.id === selectedRoomForManager.value);
  return room?.managers || [];
});

// Pagination computed
const paginatedUsers = computed(() => {
  const start = (usersPage.value - 1) * usersPerPage.value;
  const end = start + usersPerPage.value;
  return users.value.slice(start, end);
});

const totalUsersPages = computed(() => Math.ceil(users.value.length / usersPerPage.value));

const paginatedRooms = computed(() => {
  const start = (roomsPage.value - 1) * roomsPerPage.value;
  const end = start + roomsPerPage.value;
  return rooms.value.slice(start, end);
});

const totalRoomsPages = computed(() => Math.ceil(rooms.value.length / roomsPerPage.value));

const selectedRoomName = computed(() => {
  const room = rooms.value.find((r: any) => r.id === selectedRoomForCardView.value);
  return room?.name || '';
});

const roomsWithCards = computed(() => {
  // Filter out the currently selected room and only show rooms that might have cards
  return rooms.value
    .filter((r: any) => r.id !== selectedRoomForCardView.value)
    .map((r: any) => ({
      id: r.id,
      displayName: `${r.name} (Room #${r.id})`,
    }));
});

const filteredRoomCards = computed(() => {
  if (!cardSearch.value) return roomCards.value;
  return roomCards.value.filter((card: any) =>
    card.cardNumber.toLowerCase().includes(cardSearch.value.toLowerCase())
  );
});

const paginatedRoomCards = computed(() => {
  const start = (roomCardsPage.value - 1) * roomCardsPerPage.value;
  const end = start + roomCardsPerPage.value;
  return filteredRoomCards.value.slice(start, end);
});

const totalRoomCardsPages = computed(() => Math.ceil(filteredRoomCards.value.length / roomCardsPerPage.value));

const availableRoomCards = computed(() => {
  return roomCards.value.filter((card: any) => !card.assignedUser).length;
});

const assignedRoomCards = computed(() => {
  return roomCards.value.filter((card: any) => card.assignedUser).length;
});

const filteredCards = computed(() => {
  if (!cardSearch.value) return cards.value;
  return cards.value.filter((card: any) =>
    card.cardNumber.toLowerCase().includes(cardSearch.value.toLowerCase())
  );
});

const paginatedCards = computed(() => {
  const start = (cardsPage.value - 1) * cardsPerPage.value;
  const end = start + cardsPerPage.value;
  return filteredCards.value.slice(start, end);
});

const totalCardsPages = computed(() => Math.ceil(filteredCards.value.length / cardsPerPage.value));

const availableCards = computed(() => {
  return cards.value.filter((card: any) => !card.assignedUser).length;
});

const assignedCards = computed(() => {
  return cards.value.filter((card: any) => card.assignedUser).length;
});

const availableCardsList = computed(() => {
  return cards.value.filter((card: any) => !card.assignedUser);
});

// Total earnings for regular users
const totalUserEarnings = computed(() => {
  return users.value
    .filter(u => u.role === 'user')
    .reduce((sum, u) => sum + (u.totalEarnings || 0), 0);
});

// Toast notification
const showToast = (message: string, color = 'info') => {
  toast.value = {
    show: true,
    message,
    color,
  };
};

// Navigation functions
function goBack() {
  router.push({ name: 'home' });
}

function confirmLogout() {
  showLogoutDialog.value = true;
}

function logout() {
  showLogoutDialog.value = false;
  auth.logout();
  socketStore.disconnect();
  router.push({ name: 'home' });
}

// Methods
async function loadRooms() {
  try {
    const response = await services?.roomService.index();
    rooms.value = response?.data || [];
    if (!selectedRoomForManager.value && rooms.value.length > 0) {
      selectedRoomForManager.value = rooms.value[0].id;
    }
  } catch (error) {
    console.error('Error loading rooms:', error);
    showToast('Failed to load rooms: ' + getErrorMessage(error), 'error');
  }
}

async function loadUsers() {
  try {
    console.log('[AdminDashboard] Loading users...');
    const response = await services?.userService.getAll();
    console.log('[AdminDashboard] Users response:', response);
    if (response?.data) {
      users.value = response.data.map((u: any) => ({
        ...u,
        houseFee: Number(u.houseFee || 0),
      }));
      console.log('[AdminDashboard] Users loaded:', users.value.length);
    } else {
      console.warn('[AdminDashboard] No data in response');
    }
  } catch (error) {
    console.error('[AdminDashboard] Error loading users:', error);
    showToast('Failed to load users: ' + getErrorMessage(error), 'error');
  }
}

async function loadCards() {
  try {
    const response = await services?.cardService.getAll();
    cards.value = response?.data || [];
  } catch (error) {
    console.error('Error loading cards:', error);
  }
}

async function loadRoomCardStatus() {
  if (!selectedRoomForCardView.value) {
    roomCardStatus.value = null;
    return;
  }

  loadingCardStatus.value = true;
  try {
    const response = await services?.roomService.getRoomCardStatus(
      selectedRoomForCardView.value,
    );
    roomCardStatus.value = response?.data ?? null;
  } catch (error) {
    console.error('Error loading room card status:', error);
    roomCardStatus.value = null;
  } finally {
    loadingCardStatus.value = false;
  }
}

async function loadRoomCards() {
  if (!selectedRoomForCardView.value) return;

  try {
    const response = await services?.cardService.getByRoom(
      selectedRoomForCardView.value,
      { summary: true },
    );
    roomCards.value = response?.data || [];
    roomCardsPage.value = 1;
    await loadRoomCardStatus();
  } catch (error) {
    console.error('Error loading room cards:', error);
    showToast('Failed to load room cards: ' + getErrorMessage(error), 'error');
  }
}

function startCardGenProgress() {
  cardGenProgress.value = 0;
  const interval = window.setInterval(() => {
    if (cardGenProgress.value < 90) {
      cardGenProgress.value += 5;
    }
  }, 400);
  return interval;
}

function stopCardGenProgress(intervalId: number) {
  window.clearInterval(intervalId);
  cardGenProgress.value = 100;
  window.setTimeout(() => {
    cardGenProgress.value = 0;
  }, 600);
}

async function generateCardsForRoom(reset = false) {
  if (!selectedRoomForCardView.value) return;

  const missing = roomCardStatus.value?.missing ?? 400 - roomCards.value.length;
  const message = reset
    ? 'Delete all cards in this room and generate a fresh deck of 400? This cannot be undone.'
    : roomCardStatus.value?.deckStatus === 'incomplete'
      ? `Generate ${missing} missing card(s) for this room? This may take a moment.`
      : 'Generate missing cards for this room? This may take a moment.';

  openConfirm({
    title: reset ? 'Reset & Regenerate Deck' : 'Complete Card Deck',
    message,
    confirmLabel: reset ? 'Reset & Generate' : 'Generate Missing',
    confirmColor: reset ? 'error' : 'success',
    onConfirm: async () => {
      generatingRoomCards.value = true;
      const progressTimer = startCardGenProgress();
      try {
        const response = await services?.roomService.generateCardsForRoom(
          selectedRoomForCardView.value!,
          { reset },
        );
        const data = response?.data;
        const color =
          data?.status === 'complete' || data?.status === 'already_complete'
            ? 'success'
            : data?.status === 'failed'
              ? 'error'
              : 'info';
        showToast(data?.message || 'Card generation finished', color);
        await loadRoomCards();
      } catch (error) {
        console.error('Error generating room cards:', error);
        showToast('Failed to generate cards: ' + getErrorMessage(error), 'error');
      } finally {
        stopCardGenProgress(progressTimer);
        generatingRoomCards.value = false;
      }
    },
  });
}

async function previewRoomCard() {
  if (!selectedRoomForCardView.value) return;

  try {
    const response = await services?.roomService.previewRoomCard(
      selectedRoomForCardView.value,
      previewCardIndex.value,
    );
    previewCardData.value = response?.data ?? null;
    showCardPreviewDialog.value = true;
  } catch (error) {
    showToast('Failed to load preview: ' + getErrorMessage(error), 'error');
  }
}

async function exportRoomCards() {
  if (!selectedRoomForCardView.value) return;

  try {
    await services?.roomService.exportRoomCards(selectedRoomForCardView.value);
    showToast('Card export downloaded', 'success');
  } catch (error) {
    showToast('Failed to export cards: ' + getErrorMessage(error), 'error');
  }
}

async function copyCardsFromRoom() {
  if (!selectedRoomForCardView.value || !selectedSourceRoom.value) return;

  if (roomCardStatus.value?.inUse) {
    showToast('Cannot copy cards while players have assigned or locked cards in this room.', 'warning');
    return;
  }

  const sourceRoomName = rooms.value.find((r: any) => r.id === selectedSourceRoom.value)?.name || 'selected room';
  const missing = roomCardStatus.value?.missing ?? 400;

  openConfirm({
    title: 'Copy Cards',
    message: `Copy up to ${missing} missing card slot(s) from "${sourceRoomName}" to "${selectedRoomName.value}"?`,
    confirmLabel: 'Copy',
    confirmColor: 'primary',
    onConfirm: async () => {
      copyingCards.value = true;
      const progressTimer = startCardGenProgress();
      try {
        const response = await services?.roomService.copyCardsFromRoom(
          selectedRoomForCardView.value!,
          selectedSourceRoom.value!,
        );
        showToast(response?.data?.message || `Copied ${response?.data?.copied || 0} cards`, 'success');
        selectedSourceRoom.value = null;
        await loadRoomCards();
      } catch (error) {
        console.error('Error copying cards:', error);
        showToast('Failed to copy cards: ' + getErrorMessage(error), 'error');
      } finally {
        stopCardGenProgress(progressTimer);
        copyingCards.value = false;
      }
    },
  });
}

async function assignManagerToRoom() {
  if (!selectedRoomForManager.value || !selectedUserForManager.value) return;
  
  // Check if user is already assigned to any room (1-to-1 validation)
  const isUserAlreadyAssigned = rooms.value.some((room: any) => 
    room.managers?.some((manager: any) => manager.user?.id === selectedUserForManager.value)
  );
  
  if (isUserAlreadyAssigned) {
    showToast('This user is already assigned to another room. One user can only manage one room.', 'error');
    return;
  }
  
  try {
    await services?.roomService.assignManager(
      selectedUserForManager.value,
      selectedRoomForManager.value,
    );
    showToast('Manager assigned successfully!', 'success');
    selectedUserForManager.value = null;
    await loadRooms();
  } catch (error) {
    showToast('Error assigning manager: ' + getErrorMessage(error), 'error');
  }
}

async function removeManagerFromRoom(userId: number) {
  if (!selectedRoomForManager.value || !userId) return;
  const managerUser = users.value.find((u: any) => u.id === userId);
  openConfirm({
    title: 'Remove Manager',
    message: `Remove "${managerUser?.username ?? 'this user'}" as room manager?`,
    confirmLabel: 'Remove',
    confirmColor: 'warning',
    onConfirm: async () => {
      try {
        await services?.roomService.removeManager(userId, selectedRoomForManager.value!);
        await loadRooms();
        showToast('Manager removed successfully!', 'success');
      } catch (error) {
        showToast('Error removing manager: ' + getErrorMessage(error), 'error');
      }
    },
  });
}

function startEditUser(u: any) {
  editingUserId.value = u.id;
  editForm.value = {
    role: (u.role as UserRole) || UserRole.USER,
    houseFee: Number(u.houseFee || 0),
  };
}

function cancelEditUser() {
  editingUserId.value = null;
}

async function saveUser(userId: number) {
  try {
    await services?.userService.update(userId, {
      role: editForm.value.role,
      houseFee: Number(editForm.value.houseFee || 0),
    });
    editingUserId.value = null;
    await loadUsers();
    showToast('User updated successfully!', 'success');
  } catch (error) {
    showToast('Error updating user: ' + getErrorMessage(error), 'error');
  }
}

function isCurrentUserAdmin(): boolean {
  return String(user.value?.role || '').toLowerCase() === 'admin';
}

async function loadStaticLibraryStatus() {
  if (!isCurrentUserAdmin()) {
    return;
  }

  try {
    const response = await services?.roomService.getStaticCardLibraryStatus();
    staticLibraryStatus.value = response?.data ?? null;
  } catch (error) {
    console.error('Error loading static library status:', error);
    staticLibraryStatus.value = null;
  }
}

function generateStaticCardLibrary(reset = false) {
  if (!isCurrentUserAdmin()) {
    showToast('Admin login required to manage the static card library.', 'warning');
    return;
  }

  const message = reset
    ? 'Replace the entire static master deck (400 cards)? All static rooms share these patterns.'
    : staticLibraryStatus.value?.complete
      ? 'Static library is already complete (400/400).'
      : 'Generate the shared static master deck (400 cards)?';

  if (!reset && staticLibraryStatus.value?.complete) {
    showToast(message, 'info');
    return;
  }

  openConfirm({
    title: reset ? 'Reset Static Library' : 'Generate Static Library',
    message,
    confirmLabel: reset ? 'Reset & Generate' : 'Generate',
    confirmColor: reset ? 'error' : 'primary',
    onConfirm: async () => {
      generatingStaticLibrary.value = true;
      const progressTimer = startCardGenProgress();
      try {
        const response = await services?.roomService.generateStaticCardLibrary(reset);
        showToast(response?.data?.message || 'Static library updated', 'success');
        await loadStaticLibraryStatus();
      } catch (error) {
        showToast('Failed to update static library: ' + getErrorMessage(error), 'error');
      } finally {
        stopCardGenProgress(progressTimer);
        generatingStaticLibrary.value = false;
      }
    },
  });
}

async function createRoom(): Promise<boolean> {
  const roomName = newRoom.value.name.trim();
  const cardMode = newRoom.value.cardMode;

  if (!roomName) {
    showToast('Room name is required', 'warning');
    return false;
  }

  if (cardMode === 'static' && !staticLibraryStatus.value?.complete) {
    showToast(
      'Static card library is not ready. Generate 400 static cards in Card Management first.',
      'warning',
    );
    return false;
  }

  try {
    const response = await services?.roomService.create(roomName, cardMode);
    const cardGen = response?.data?.cardGeneration;
    newRoom.value = { name: '', cardMode: 'automatic' };
    await loadRooms();
    activeTab.value = 'rooms';
    const modeLabel = cardMode === 'static' ? 'static (shared patterns)' : 'automatic (unique)';
    showToast(`Room "${roomName}" created with ${modeLabel} cards!`, 'success');
    if (cardGen) {
      const cardColor =
        cardGen.status === 'complete'
          ? 'success'
          : cardGen.status === 'failed'
            ? 'error'
            : 'warning';
      showToast(cardGen.message, cardColor);
    }
    return true;
  } catch (error) {
    showToast('Error creating room: ' + getErrorMessage(error), 'error');
    return false;
  }
}

async function cleanupInvalidManagers() {
  openConfirm({
    title: 'Cleanup Managers',
    message: 'This will remove all invalid manager assignments (deleted users). Continue?',
    confirmLabel: 'Cleanup',
    confirmColor: 'warning',
    onConfirm: async () => {
      try {
        const response = await services?.roomService.cleanupInvalidManagers();
        showToast(response?.data?.message || 'Cleanup completed', 'success');
        await loadRooms();
      } catch (error) {
        showToast('Error cleaning up invalid managers: ' + getErrorMessage(error), 'error');
      }
    },
  });
}

function deleteRoom(roomId: number) {
  const room = rooms.value.find((r: any) => r.id === roomId);
  openConfirm({
    title: 'Delete Room',
    message: `Are you sure you want to delete "${room?.name ?? 'this room'}"?`,
    confirmLabel: 'Delete',
    confirmColor: 'error',
    onConfirm: async () => {
      try {
        await services?.roomService.delete(roomId);
        await loadRooms();
        showToast('Room deleted successfully!', 'success');
      } catch (error) {
        showToast('Error deleting room: ' + getErrorMessage(error), 'error');
      }
    },
  });
}

async function joinRoom(roomId: number) {
  router.push({ name: 'bingo-rooms', params: { roomId } });
}

async function changePassword() {
  if (!passwordForm.value.currentPassword || !passwordForm.value.newPassword) {
    showToast('Please fill in all password fields', 'warning');
    return;
  }

  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    showToast('New passwords do not match', 'warning');
    return;
  }

  if (passwordForm.value.newPassword.length < 6) {
    showToast('Password must be at least 6 characters', 'warning');
    return;
  }

  try {
    changingPassword.value = true;
    await services?.userService.changePassword(
      passwordForm.value.currentPassword,
      passwordForm.value.newPassword
    );
    showToast('Password changed successfully!', 'success');
    passwordForm.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    };
  } catch (error: any) {
    const message = error?.response?.data?.message || 'Failed to change password';
    showToast(message, 'error');
  } finally {
    changingPassword.value = false;
  }
}

async function registerUser(): Promise<boolean> {
  const registeredUsername = newUser.value.username.trim();

  try {
    await services?.authService.register(
      registeredUsername,
      newUser.value.password,
    );

    // If role is admin, update the user role
    if (newUser.value.role === 'admin') {
      try {
        const allUsers = await services?.userService.getAll();
        const newlyCreated = allUsers?.data?.find((u: any) => u.username === registeredUsername);
        if (newlyCreated) {
          await services?.userService.updateRole(newlyCreated.id, 'admin');
        }
      } catch (roleError) {
        console.error('Error updating user role to admin:', roleError);
      }
    }

    newUser.value = { username: '', password: '', role: 'user' };
    showToast(`User "${registeredUsername}" registered successfully!`, 'success');

    try {
      await loadUsers();
    } catch (loadError) {
      console.error('Error reloading users list:', loadError);
    }

    return true;
  } catch (error) {
    showToast('Error registering user: ' + getErrorMessage(error), 'error');
    return false;
  }
}

function makeAdmin(userId: number) {
  const targetUser = users.value.find((u: any) => u.id === userId);
  openConfirm({
    title: 'Make Admin',
    message: `Make "${targetUser?.username ?? 'this user'}" an admin?`,
    confirmLabel: 'Make Admin',
    confirmColor: 'warning',
    onConfirm: async () => {
      try {
        await services?.userService.updateRole(userId, 'admin');
        await loadUsers();
        showToast('User is now an admin!', 'success');
      } catch (error) {
        showToast('Error updating user: ' + getErrorMessage(error), 'error');
      }
    },
  });
}

function removeAdmin(userId: number) {
  const targetUser = users.value.find((u: any) => u.id === userId);
  openConfirm({
    title: 'Remove Admin',
    message: `Remove admin privileges from "${targetUser?.username ?? 'this user'}"?`,
    confirmLabel: 'Remove Admin',
    confirmColor: 'warning',
    onConfirm: async () => {
      try {
        await services?.userService.updateRole(userId, 'user');
        await loadUsers();
        showToast('Admin privileges removed successfully!', 'success');
      } catch (error) {
        showToast('Error updating user: ' + getErrorMessage(error), 'error');
      }
    },
  });
}

function formatFee(fee: number) {
  return `${Number(fee || 0).toFixed(2)}`;
}

function formatDate(date: string | Date) {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Invalid Date';
  
  // Format as DD-MM-YYYY HH:MM
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return `${day}-${month}-${year} ${hours}:${minutes}`;
}

function deleteUser(userId: number) {
  const targetUser = users.value.find((u: any) => u.id === userId);
  openConfirm({
    title: 'Delete User',
    message: `Are you sure you want to delete "${targetUser?.username ?? 'this user'}"? This cannot be undone.`,
    confirmLabel: 'Delete',
    confirmColor: 'error',
    onConfirm: async () => {
      try {
        await services?.userService.delete(userId);
        await loadUsers();
        showToast('User deleted successfully!', 'success');
      } catch (error) {
        showToast('Error deleting user: ' + getErrorMessage(error), 'error');
      }
    },
  });
}

function initializeAdminData() {
  if (adminDataInitialized) return;
  adminDataInitialized = true;

  loadRooms();
  loadUsers();
  loadCards();
  loadStaticLibraryStatus();

  socketStore.ensureConnected();
  socketStore.client?.on(NEW_ROOM_AVAILABLE_EVENT, async () => {
    await loadRooms();
  });
}

function ensureAdminAccess() {
  if (String(user.value?.role || '').toLowerCase() === 'admin') {
    initializeAdminData();
    return;
  }

  const token = localStorage.getItem('token');
  if (!token) {
    router.push({ name: 'home' });
    return;
  }

  const stop = watch(
    user,
    (currentUser) => {
      if (!currentUser) return;

      stop();
      if (String(currentUser.role || '').toLowerCase() === 'admin') {
        initializeAdminData();
      } else {
        router.push({ name: 'home' });
      }
    },
  );
}

// Socket events
onMounted(() => {
  ensureAdminAccess();
});

onBeforeUnmount(() => {
  socketStore.client?.off(NEW_ROOM_AVAILABLE_EVENT);
});
  const api = {
    user,
    showLogoutDialog,
    drawer,
    rail,
    toast,
    confirmDialog,
    cancelConfirm,
    executeConfirm,
    currentDate,
    currentTime,
    activeTab,
    rooms,
    users,
    newRoom,
    staticLibraryStatus,
    generatingStaticLibrary,
    loadStaticLibraryStatus,
    generateStaticCardLibrary,
    newUser,
    passwordForm,
    changingPassword,
    selectedRoomForManager,
    selectedUserForManager,
    editingUserId,
    editForm,
    cards,
    roomCards,
    cardSearch,
    generating,
    generatingRoomCards,
    copyingCards,
    selectedRoomForCard,
    selectedUserForCard,
    selectedCardNumber,
    selectedRoomForCardView,
    selectedSourceRoom,
    usersPage,
    usersPerPage,
    roomsPage,
    roomsPerPage,
    cardsPage,
    cardsPerPage,
    roomCardsPage,
    roomCardsPerPage,
    roleOptions,
    totalUsers,
    adminCount,
    managerCandidates,
    selectedRoomManagers,
    paginatedUsers,
    totalUsersPages,
    paginatedRooms,
    totalRoomsPages,
    selectedRoomName,
    roomsWithCards,
    filteredRoomCards,
    paginatedRoomCards,
    totalRoomCardsPages,
    availableRoomCards,
    assignedRoomCards,
    filteredCards,
    paginatedCards,
    totalCardsPages,
    availableCards,
    assignedCards,
    availableCardsList,
    totalUserEarnings,
    showToast,
    goBack,
    confirmLogout,
    logout,
    loadUsers,
    loadRooms,
    loadCards,
    loadRoomCards,
    roomCardStatus,
    cardGenProgress,
    previewCardData,
    showCardPreviewDialog,
    previewCardIndex,
    loadingCardStatus,
    loadRoomCardStatus,
    generateCardsForRoom,
    previewRoomCard,
    exportRoomCards,
    copyCardsFromRoom,
    assignManagerToRoom,
    removeManagerFromRoom,
    startEditUser,
    cancelEditUser,
    saveUser,
    createRoom,
    cleanupInvalidManagers,
    deleteRoom,
    joinRoom,
    changePassword,
    registerUser,
    makeAdmin,
    removeAdmin,
    formatFee,
    formatDate,
    deleteUser,
  };
  return api;
}

export type AdminDashboardContext = ReturnType<typeof createAdminDashboardState>;

export function useAdminDashboard(): AdminDashboardContext {
  if (!adminDashboardSingleton) {
    adminDashboardSingleton = createAdminDashboardState();
  }
  return adminDashboardSingleton;
}
