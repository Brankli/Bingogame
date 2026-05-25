<template>
  <v-card class="user-management">
    <v-card-title class="management-title">
      <v-icon class="mr-2">mdi-account-cash</v-icon>
      Room User &amp; Payment Tracking
    </v-card-title>

    <v-card-text>
      <v-tabs v-model="tab" bg-color="primary" class="mb-2">
        <v-tab value="users">
          <v-icon start>mdi-account-group</v-icon>
          Users &amp; Payments
        </v-tab>
        <v-tab value="cards">
          <v-icon start>mdi-card-multiple</v-icon>
          Room Cards
        </v-tab>
      </v-tabs>

      <v-window v-model="tab">
        <!-- Users & Payments -->
        <v-window-item value="users">
          <v-row class="mb-3" dense>
            <v-col cols="6" sm="3">
              <v-card variant="tonal" color="primary">
                <v-card-text class="text-center py-2">
                  <div class="text-h6">{{ users.length }}</div>
                  <div class="text-caption">Total Users</div>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="6" sm="3">
              <v-card variant="tonal" color="success">
                <v-card-text class="text-center py-2">
                  <div class="text-h6">{{ usersInRoom.length }}</div>
                  <div class="text-caption">Cards in Room</div>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="6" sm="3">
              <v-card variant="tonal" color="info">
                <v-card-text class="text-center py-2">
                  <div class="text-h6">{{ onlineCount }}</div>
                  <div class="text-caption">Online (5 min)</div>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="6" sm="3">
              <v-card variant="tonal" color="warning">
                <v-card-text class="text-center py-2">
                  <div class="text-h6">{{ formatFee(totalEarnings) }}</div>
                  <div class="text-caption">Total Earnings (Birr)</div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <v-card variant="outlined" class="mb-4">
            <v-card-text>
              <v-row dense>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="searchPlayer"
                    label="Search username"
                    prepend-inner-icon="mdi-magnify"
                    variant="outlined"
                    density="compact"
                    clearable
                    hide-details
                  />
                </v-col>
                <v-col cols="6" md="2">
                  <v-select
                    v-model="filterRole"
                    :items="['All', 'Admin', 'User']"
                    label="Role"
                    variant="outlined"
                    density="compact"
                    hide-details
                  />
                </v-col>
                <v-col cols="6" md="3">
                  <v-select
                    v-model="filterActivity"
                    :items="activityFilterOptions"
                    label="Activity"
                    variant="outlined"
                    density="compact"
                    hide-details
                  />
                </v-col>
                <v-col cols="12" md="3">
                  <v-switch
                    v-model="roomOnly"
                    label="Only users with cards in this room"
                    color="primary"
                    density="compact"
                    hide-details
                  />
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <v-alert v-if="filteredUsers.length === 0" type="info" variant="tonal" class="mb-4">
            No users match your filters.
          </v-alert>

          <v-table v-else class="elevation-1 user-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Room Cards</th>
                <th>House Fee</th>
                <th>Balance</th>
                <th>Registered</th>
                <th>Last Active</th>
                <th>Payments</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="u in paginatedUsers" :key="u.id">
                <td>
                  <div class="d-flex align-center">
                    <v-badge :color="getActivityColor(u.lastActive)" dot inline class="mr-2" />
                    <strong>{{ u.username }}</strong>
                  </div>
                </td>
                <td>
                  <v-chip :color="u.role === 'admin' ? 'error' : 'primary'" size="small">
                    {{ String(u.role || '').toUpperCase() }}
                  </v-chip>
                </td>
                <td>
                  <v-chip size="small" :color="getUserCards(u.id).length ? 'success' : 'grey'">
                    {{ getUserCards(u.id).length }}
                  </v-chip>
                </td>
                <td>{{ formatFee(u.houseFee) }} Birr</td>
                <td>
                  <v-chip
                    v-if="u.role !== 'admin'"
                    color="success"
                    size="small"
                    class="cursor-pointer"
                    @click="openAdjustEarnings(u, 'add')"
                  >
                    {{ formatFee(u.totalEarnings || 0) }} Birr
                  </v-chip>
                  <span v-else>—</span>
                </td>
                <td><small>{{ formatDate(u.createdAt) }}</small></td>
                <td>
                  <small>{{ formatDate(u.lastActive) }}</small>
                  <div class="text-caption" :style="{ color: getActivityColor(u.lastActive) }">
                    {{ getActivityText(u.lastActive) }}
                  </div>
                </td>
                <td>
                  <template v-if="u.role !== 'admin'">
                    <v-btn icon size="x-small" variant="text" title="History" @click="viewEarningsHistory(u)">
                      <v-icon size="small">mdi-history</v-icon>
                    </v-btn>
                    <v-btn icon size="x-small" variant="text" color="success" title="Add" @click="openAdjustEarnings(u, 'add')">
                      <v-icon size="small">mdi-plus-circle</v-icon>
                    </v-btn>
                    <v-btn icon size="x-small" variant="text" color="warning" title="Subtract" @click="openAdjustEarnings(u, 'subtract')">
                      <v-icon size="small">mdi-minus-circle</v-icon>
                    </v-btn>
                    <v-btn icon size="x-small" variant="text" color="info" title="Payout" @click="openAdjustEarnings(u, 'payout')">
                      <v-icon size="small">mdi-bank-transfer</v-icon>
                    </v-btn>
                  </template>
                </td>
              </tr>
            </tbody>
          </v-table>

          <div v-if="filteredUsers.length > 0" class="d-flex flex-wrap align-center justify-space-between mt-4 ga-3">
            <div class="text-caption text-medium-emphasis">
              Showing {{ usersRangeStart }}–{{ usersRangeEnd }} of {{ filteredUsers.length }} users
            </div>
            <v-select
              v-model="usersPerPage"
              :items="pageSizeOptions"
              label="Per page"
              variant="outlined"
              density="compact"
              hide-details
              style="max-width: 120px"
            />
            <v-pagination
              v-model="usersPage"
              :length="usersTotalPages"
              :total-visible="7"
              density="comfortable"
            />
          </div>
        </v-window-item>

        <!-- Room Cards -->
        <v-window-item value="cards">
          <v-alert type="info" variant="tonal" class="mb-4">
            Assign cards for <strong>Room #{{ roomId }}</strong>. Bulk generation is in Admin Dashboard → Card Management.
          </v-alert>

          <v-row class="mb-4" dense>
            <v-col cols="12" md="4">
              <v-select
                v-model="selectedUserId"
                :items="assignableUsers"
                item-title="username"
                item-value="id"
                label="Assign to user"
                variant="outlined"
                density="compact"
                clearable
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-select
                v-model="selectedCardNumber"
                :items="availableCardOptions"
                label="Available card"
                variant="outlined"
                density="compact"
                clearable
              />
            </v-col>
            <v-col cols="12" md="4" class="d-flex align-center">
              <v-btn
                color="primary"
                :disabled="!selectedUserId || !selectedCardNumber"
                :loading="assigning"
                @click="assignCard"
              >
                <v-icon start>mdi-link</v-icon>
                Assign Card
              </v-btn>
            </v-col>
          </v-row>

          <v-text-field
            v-model="searchCard"
            label="Search card number"
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="compact"
            clearable
            class="mb-3"
          />

          <v-data-table
            v-model:page="cardsTablePage"
            v-model:items-per-page="cardsTablePerPage"
            :headers="cardHeaders"
            :items="filteredCards"
            :items-per-page-options="pageSizeOptions"
            class="elevation-1"
          >
            <template #[`item.cardNumber`]="{ item }">
              <v-chip color="primary" size="small">{{ item.cardNumber }}</v-chip>
            </template>
            <template #[`item.assignedUser`]="{ item }">
              <v-chip v-if="item.assignedUser" color="success" size="small">
                {{ item.assignedUser.username }}
              </v-chip>
              <v-chip v-else color="grey" size="small">Unassigned</v-chip>
            </template>
            <template #[`item.isLocked`]="{ item }">
              <v-icon :color="item.isLocked ? 'error' : 'success'">
                {{ item.isLocked ? 'mdi-lock' : 'mdi-lock-open' }}
              </v-icon>
            </template>
            <template #[`item.actions`]="{ item }">
              <v-btn icon size="small" color="primary" class="mr-1" @click="viewCard(item)">
                <v-icon>mdi-eye</v-icon>
              </v-btn>
              <v-btn
                v-if="item.assignedUser"
                icon
                size="small"
                color="error"
                @click="unassignCard(item.cardNumber)"
              >
                <v-icon>mdi-link-off</v-icon>
              </v-btn>
            </template>
          </v-data-table>

          <CardGrid
            class="mt-4"
            :cards="paginatedGridCards"
            @cards-selected="onCardSelected"
          />

          <div v-if="filteredCards.length > 0" class="d-flex flex-wrap align-center justify-space-between mt-4 ga-3">
            <div class="text-caption text-medium-emphasis">
              Card grid: {{ cardsGridRangeStart }}–{{ cardsGridRangeEnd }} of {{ filteredCards.length }}
            </div>
            <v-select
              v-model="cardsGridPerPage"
              :items="gridPageSizeOptions"
              label="Grid per page"
              variant="outlined"
              density="compact"
              hide-details
              style="max-width: 140px"
            />
            <v-pagination
              v-model="cardsGridPage"
              :length="cardsGridTotalPages"
              :total-visible="7"
              density="comfortable"
            />
          </div>
        </v-window-item>
      </v-window>
    </v-card-text>

    <!-- Card Preview -->
    <v-dialog v-model="cardPreviewDialog" max-width="500">
      <v-card v-if="selectedCardForPreview">
        <v-card-title class="card-preview-title">{{ selectedCardForPreview.cardNumber }}</v-card-title>
        <v-card-text>
          <div class="bingo-card-preview">
            <div class="bingo-header">
              <span v-for="letter in ['B', 'I', 'N', 'G', 'O']" :key="letter" class="header-letter">{{ letter }}</span>
            </div>
            <table class="card-grid">
              <tbody>
                <tr v-for="(row, rowIndex) in selectedCardForPreview.grid" :key="rowIndex">
                  <td
                    v-for="(num, colIndex) in row"
                    :key="colIndex"
                    class="card-cell"
                    :class="{ 'free-cell': num === 0 }"
                  >
                    {{ num === 0 ? 'FREE' : num }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <v-alert v-if="selectedCardForPreview.assignedUser" type="info" variant="tonal" class="mt-4">
            <strong>Assigned to:</strong> {{ selectedCardForPreview.assignedUser.username }}
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" block @click="cardPreviewDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Earnings Adjustment -->
    <v-dialog v-model="showAdjustDialog" max-width="500">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2" :color="getAdjustmentColor(adjustmentType)">
            {{ getAdjustmentIcon(adjustmentType) }}
          </v-icon>
          {{ getAdjustmentTitle(adjustmentType) }}
        </v-card-title>
        <v-card-text>
          <v-alert type="info" variant="tonal" class="mb-4">
            <strong>User:</strong> {{ selectedUser?.username }}<br />
            <strong>Current balance:</strong> {{ formatFee(selectedUser?.totalEarnings || 0) }} Birr
          </v-alert>
          <v-text-field
            v-if="adjustmentType !== 'reset'"
            v-model.number="adjustmentAmount"
            label="Amount (Birr)"
            type="number"
            variant="outlined"
            min="0"
            step="0.01"
            prepend-inner-icon="mdi-cash"
          />
          <v-textarea
            v-model="adjustmentReason"
            label="Reason (optional)"
            variant="outlined"
            rows="2"
            placeholder="e.g. Room #21 payout, correction..."
          />
          <v-alert v-if="adjustmentType === 'reset'" type="warning" variant="tonal">
            Resets balance to 0 Birr. Recorded in payment history.
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showAdjustDialog = false">Cancel</v-btn>
          <v-btn :color="getAdjustmentColor(adjustmentType)" :loading="adjusting" @click="confirmAdjustment">
            Confirm
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Earnings History -->
    <v-dialog v-model="showHistoryDialog" max-width="800">
      <v-card>
        <v-card-title>
          <v-icon class="mr-2">mdi-history</v-icon>
          Payment History — {{ selectedUser?.username }}
        </v-card-title>
        <v-card-text>
          <v-alert type="info" variant="tonal" class="mb-4">
            <strong>Current balance:</strong> {{ formatFee(selectedUser?.totalEarnings || 0) }} Birr
          </v-alert>
          <v-progress-linear v-if="loadingHistory" indeterminate class="mb-4" />
          <v-table v-else-if="earningsHistory.length > 0" density="compact">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Before</th>
                <th>After</th>
                <th>By</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="tx in paginatedEarningsHistory" :key="tx.id">
                <td><small>{{ formatDate(tx.createdAt) }}</small></td>
                <td>
                  <v-chip size="x-small">{{ formatTransactionType(tx.type) }}</v-chip>
                </td>
                <td :class="tx.amount >= 0 ? 'text-success' : 'text-error'">
                  {{ tx.amount >= 0 ? '+' : '' }}{{ formatFee(tx.amount) }}
                </td>
                <td>{{ formatFee(tx.balanceBefore) }}</td>
                <td>{{ formatFee(tx.balanceAfter) }}</td>
                <td><small>{{ tx.performedBy || '—' }}</small></td>
                <td><small>{{ tx.reason || '—' }}</small></td>
              </tr>
            </tbody>
          </v-table>
          <v-alert v-else type="info" variant="tonal">
            No payment history yet. Adjustments and payouts will appear here.
          </v-alert>

          <div
            v-if="earningsHistory.length > historyPerPage"
            class="d-flex flex-wrap align-center justify-space-between mt-4 ga-3"
          >
            <div class="text-caption">
              {{ historyRangeStart }}–{{ historyRangeEnd }} of {{ earningsHistory.length }} transactions
            </div>
            <v-pagination
              v-model="historyPage"
              :length="historyTotalPages"
              :total-visible="5"
              density="compact"
            />
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" @click="showHistoryDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="confirmDialog.show" max-width="450" persistent>
      <v-card>
        <v-card-title class="text-h5">
          <v-icon class="mr-2" :color="confirmDialog.confirmColor">mdi-alert-circle-outline</v-icon>
          {{ confirmDialog.title }}
        </v-card-title>
        <v-card-text>{{ confirmDialog.message }}</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="cancelConfirm">Cancel</v-btn>
          <v-btn :color="confirmDialog.confirmColor" variant="elevated" @click="executeConfirm">
            {{ confirmDialog.confirmLabel }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="toast.show" :color="toast.color" timeout="3500">
      {{ toast.message }}
    </v-snackbar>
  </v-card>
</template>

<script setup lang="ts">
/* eslint-disable no-undef */
import { ref, computed, inject, onMounted, watch } from 'vue';
import type { Services } from '../services';
import type { User } from '../types/user';
import CardGrid from './CardGrid.vue';
import { useConfirmDialog } from '../composables/useConfirmDialog';
import {
  formatDate,
  formatFee,
  formatTransactionType,
  getActivityColor,
  getActivityText,
  matchesActivityFilter,
  useEarningsManagement,
} from '../composables/useUserTracking';

interface RoomCard {
  id: number;
  cardNumber: string;
  grid?: number[][];
  isLocked?: boolean;
  assignedUser?: { id: number; username: string } | null;
}

const props = defineProps<{
  roomId: number;
}>();

const emit = defineEmits(['cards-generated', 'cards-selected', 'cards-assigned']);

const services = inject<Services>('services');

const tab = ref('users');
const users = ref<User[]>([]);
const allCards = ref<RoomCard[]>([]);
const searchPlayer = ref('');
const searchCard = ref('');
const filterRole = ref('All');
const filterActivity = ref('All');
const roomOnly = ref(false);
const usersPage = ref(1);
const usersPerPage = ref(10);
const cardsTablePage = ref(1);
const cardsTablePerPage = ref(10);
const cardsGridPage = ref(1);
const cardsGridPerPage = ref(40);
const historyPage = ref(1);
const historyPerPage = 10;
const pageSizeOptions = [10, 25, 50];
const gridPageSizeOptions = [20, 40, 80, 120];
const selectedUserId = ref<number | null>(null);
const selectedCardNumber = ref<string | null>(null);
const assigning = ref(false);
const cardPreviewDialog = ref(false);
const selectedCardForPreview = ref<RoomCard | null>(null);

const toast = ref({ show: false, message: '', color: 'info' });
const { confirmDialog, openConfirm, cancelConfirm, executeConfirm } = useConfirmDialog();

const {
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
} = useEarningsManagement(services);

const activityFilterOptions = [
  'All',
  'Online Now',
  'Active Today',
  'This Week',
  'Inactive',
];

const cardHeaders = [
  { title: 'Card Number', key: 'cardNumber' },
  { title: 'Assigned To', key: 'assignedUser' },
  { title: 'Status', key: 'isLocked' },
  { title: 'Actions', key: 'actions', sortable: false },
];

function showToast(message: string, color = 'info') {
  toast.value = { show: true, message, color };
}

function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const maybeResponse = (error as { response?: { data?: { message?: string } } }).response;
    if (maybeResponse?.data?.message) return maybeResponse.data.message;
    const maybeMessage = (error as { message?: string }).message;
    if (maybeMessage) return maybeMessage;
  }
  return 'Unexpected error';
}

const usersInRoom = computed(() => {
  const ids = new Set<number>();
  allCards.value.forEach((card) => {
    if (card.assignedUser?.id) ids.add(card.assignedUser.id);
  });
  return users.value.filter((u) => ids.has(u.id));
});

const onlineCount = computed(() =>
  users.value.filter((u) => matchesActivityFilter(u.lastActive, 'Online Now')).length,
);

const totalEarnings = computed(() =>
  users.value
    .filter((u) => u.role !== 'admin')
    .reduce((sum, u) => sum + (u.totalEarnings || 0), 0),
);

const filteredUsers = computed(() => {
  let result = [...users.value];

  if (roomOnly.value) {
    const inRoom = new Set(usersInRoom.value.map((u) => u.id));
    result = result.filter((u) => inRoom.has(u.id));
  }

  if (searchPlayer.value) {
    const q = searchPlayer.value.toLowerCase();
    result = result.filter((u) => u.username.toLowerCase().includes(q));
  }

  if (filterRole.value !== 'All') {
    result = result.filter(
      (u) => String(u.role).toLowerCase() === filterRole.value.toLowerCase(),
    );
  }

  if (filterActivity.value !== 'All') {
    result = result.filter((u) => matchesActivityFilter(u.lastActive, filterActivity.value));
  }

  return result.sort((a, b) => a.username.localeCompare(b.username));
});

const filteredCards = computed(() => {
  if (!searchCard.value) return allCards.value;
  const q = searchCard.value.toLowerCase();
  return allCards.value.filter((c) => c.cardNumber.toLowerCase().includes(q));
});

const usersTotalPages = computed(() =>
  Math.max(1, Math.ceil(filteredUsers.value.length / usersPerPage.value)),
);

const paginatedUsers = computed(() => {
  const start = (usersPage.value - 1) * usersPerPage.value;
  return filteredUsers.value.slice(start, start + usersPerPage.value);
});

const usersRangeStart = computed(() =>
  filteredUsers.value.length === 0 ? 0 : (usersPage.value - 1) * usersPerPage.value + 1,
);

const usersRangeEnd = computed(() =>
  Math.min(usersPage.value * usersPerPage.value, filteredUsers.value.length),
);

const cardsGridTotalPages = computed(() =>
  Math.max(1, Math.ceil(filteredCards.value.length / cardsGridPerPage.value)),
);

const paginatedGridCards = computed(() => {
  const start = (cardsGridPage.value - 1) * cardsGridPerPage.value;
  return filteredCards.value.slice(start, start + cardsGridPerPage.value);
});

const cardsGridRangeStart = computed(() =>
  filteredCards.value.length === 0 ? 0 : (cardsGridPage.value - 1) * cardsGridPerPage.value + 1,
);

const cardsGridRangeEnd = computed(() =>
  Math.min(cardsGridPage.value * cardsGridPerPage.value, filteredCards.value.length),
);

const historyTotalPages = computed(() =>
  Math.max(1, Math.ceil(earningsHistory.value.length / historyPerPage)),
);

const paginatedEarningsHistory = computed(() => {
  const start = (historyPage.value - 1) * historyPerPage;
  return earningsHistory.value.slice(start, start + historyPerPage);
});

const historyRangeStart = computed(() =>
  earningsHistory.value.length === 0 ? 0 : (historyPage.value - 1) * historyPerPage + 1,
);

const historyRangeEnd = computed(() =>
  Math.min(historyPage.value * historyPerPage, earningsHistory.value.length),
);

watch([searchPlayer, filterRole, filterActivity, roomOnly], () => {
  usersPage.value = 1;
});

watch(searchCard, () => {
  cardsTablePage.value = 1;
  cardsGridPage.value = 1;
});

watch(usersPerPage, () => {
  usersPage.value = 1;
});

watch(cardsGridPerPage, () => {
  cardsGridPage.value = 1;
});

watch(earningsHistory, () => {
  historyPage.value = 1;
});

watch(usersPage, (page) => {
  if (page > usersTotalPages.value) {
    usersPage.value = usersTotalPages.value;
  }
});

watch(cardsGridPage, (page) => {
  if (page > cardsGridTotalPages.value) {
    cardsGridPage.value = cardsGridTotalPages.value;
  }
});

const availableCardOptions = computed(() =>
  allCards.value
    .filter((c) => !c.assignedUser)
    .map((c) => c.cardNumber),
);

const assignableUsers = computed(() =>
  users.value.filter((u) => String(u.role).toLowerCase() !== 'admin'),
);

const getUserCards = (userId: number) =>
  allCards.value.filter((c) => c.assignedUser?.id === userId);

async function loadData() {
  try {
    const [usersResponse, cardsResponse] = await Promise.all([
      services?.userService.findAll(),
      services?.cardService.getByRoom(props.roomId),
    ]);
    users.value = usersResponse?.data || [];
    allCards.value = cardsResponse?.data || [];
  } catch (error) {
    console.error('Error loading user management data:', error);
    showToast('Failed to load users and cards', 'error');
  }
}

async function assignCard() {
  if (!selectedUserId.value || !selectedCardNumber.value) return;

  assigning.value = true;
  try {
    await services?.cardService.assignCard(
      selectedCardNumber.value,
      selectedUserId.value,
      props.roomId,
    );
    showToast('Card assigned successfully!', 'success');
    selectedUserId.value = null;
    selectedCardNumber.value = null;
    await loadData();
    emit('cards-assigned');
  } catch (error) {
    showToast(getErrorMessage(error), 'error');
  } finally {
    assigning.value = false;
  }
}

function unassignCard(cardNumber: string) {
  openConfirm({
    title: 'Unassign Card',
    message: `Unassign card ${cardNumber} from this room?`,
    confirmLabel: 'Unassign',
    confirmColor: 'warning',
    onConfirm: async () => {
      try {
        await services?.cardService.unassignCard(cardNumber);
        showToast('Card unassigned', 'success');
        await loadData();
      } catch (error) {
        showToast(getErrorMessage(error), 'error');
      }
    },
  });
}

function viewCard(card: RoomCard) {
  selectedCardForPreview.value = card;
  cardPreviewDialog.value = true;
}

function onCardSelected(cardNumbers: string[]) {
  emit('cards-selected', cardNumbers);
}

async function confirmAdjustment() {
  if (!selectedUser.value) return;

  if (adjustmentType.value !== 'reset' && adjustmentAmount.value <= 0) {
    showToast('Enter a valid amount', 'warning');
    return;
  }

  adjusting.value = true;
  try {
    const amount =
      adjustmentType.value === 'reset' ? 0 : adjustmentAmount.value;
    const response = await services?.userService.adjustEarnings(
      selectedUser.value.id,
      amount,
      adjustmentType.value,
      adjustmentReason.value,
    );
    const newBalance = (response?.data as { newBalance?: number })?.newBalance;
    showToast(
      newBalance != null
        ? `Balance updated to ${formatFee(newBalance)} Birr`
        : 'Payment updated successfully',
      'success',
    );
    showAdjustDialog.value = false;
    await loadData();
    if (showHistoryDialog.value && selectedUser.value) {
      await loadEarningsHistory(selectedUser.value.id);
      const refreshed = users.value.find((u) => u.id === selectedUser.value?.id);
      if (refreshed) selectedUser.value = refreshed;
    }
  } catch (error) {
    showToast(getErrorMessage(error), 'error');
  } finally {
    adjusting.value = false;
  }
}

onMounted(() => {
  loadData();
});
</script>

<style scoped lang="scss">
.user-management {
  margin: 20px 0;
  border-radius: 12px !important;
}

.management-title {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 1.5rem;
  font-weight: bold;
  padding: 20px;
}

.user-table thead {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.user-table thead th {
  color: white !important;
  font-weight: 600;
}

.user-table tbody tr:hover {
  background-color: rgba(102, 126, 234, 0.06);
}

.cursor-pointer {
  cursor: pointer;
}

.card-preview-title {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: center;
  padding: 16px;
}

.bingo-header {
  display: flex;
  justify-content: space-around;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 12px 0;
  border-radius: 8px 8px 0 0;
}

.header-letter {
  flex: 1;
  text-align: center;
  font-size: 1.5rem;
  font-weight: bold;
  color: white;
}

.card-grid {
  width: 100%;
  border-collapse: collapse;
  border: 3px solid #333;
}

.card-cell {
  width: 20%;
  height: 52px;
  border: 2px solid #333;
  text-align: center;
  font-size: 1.2rem;
  font-weight: bold;

  &.free-cell {
    background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
    font-size: 0.9rem;
  }
}
</style>
