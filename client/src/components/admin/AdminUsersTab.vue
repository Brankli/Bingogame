<template>
  <v-card class="users-card" elevation="4">
    <v-card-title class="card-title">
      <v-icon class="mr-2">mdi-account-multiple</v-icon>
      User Management
    </v-card-title>
    
    <v-card-text>
      <!-- Summary Alert -->
      <v-alert type="info" variant="tonal" class="mb-4">
        <v-icon class="mr-2">mdi-account-group</v-icon>
        {{ filteredUsers.length }} users {{ searchQuery || filterRole !== 'All' || filterActivity !== 'All' ? 'found' : 'total' }} | 
        Total User Earnings: {{ formatFee(totalUserEarnings) }} Birr
      </v-alert>

      <!-- Search & Filter Section -->
      <v-card variant="outlined" class="mb-4">
        <v-card-text>
          <v-row>
            <v-col cols="12" md="4">
              <v-text-field
                v-model="searchQuery"
                prepend-inner-icon="mdi-magnify"
                label="Search by username..."
                variant="outlined"
                density="compact"
                clearable
                hide-details
              />
            </v-col>
            <v-col cols="12" md="2">
              <v-select
                v-model="filterRole"
                :items="['All', 'Admin', 'User']"
                label="Role"
                variant="outlined"
                density="compact"
                hide-details
              />
            </v-col>
            <v-col cols="12" md="3">
              <v-select
                v-model="filterActivity"
                :items="activityFilterOptions"
                label="Activity"
                variant="outlined"
                density="compact"
                hide-details
              />
            </v-col>
            <v-col cols="12" md="2">
              <v-select
                v-model="sortBy"
                :items="sortOptions"
                label="Sort By"
                variant="outlined"
                density="compact"
                hide-details
              />
            </v-col>
            <v-col cols="12" md="1">
              <v-btn 
                color="secondary" 
                block 
                @click="clearFilters"
                :disabled="!hasActiveFilters"
              >
                <v-icon>mdi-filter-off</v-icon>
              </v-btn>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Users Table -->
      <v-table class="elevation-1 user-table" v-if="filteredUsers.length > 0">
        <thead>
          <tr>
            <th class="text-left">Username</th>
            <th class="text-left">Role</th>
            <th class="text-left">House Fee</th>
            <th class="text-left">Total Earnings</th>
            <th class="text-left">Created</th>
            <th class="text-left">Last Active</th>
            <th class="text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in paginatedFilteredUsers" :key="u.id">
            <!-- Username with Activity Status -->
            <td>
              <div class="d-flex align-center">
                <v-badge
                  :color="getActivityColor(u.lastActive)"
                  dot
                  inline
                  class="mr-2"
                />
                <span>{{ u.username }}</span>
              </div>
            </td>
            
            <!-- Role -->
            <td>
              <div v-if="editingUserId === u.id">
                <v-select
                  v-model="editForm.role"
                  :items="roleOptions"
                  item-title="title"
                  item-value="value"
                  density="compact"
                  hide-details
                  variant="outlined"
                />
              </div>
              <v-chip
                v-else
                :color="u.role === 'admin' ? 'error' : 'primary'"
                variant="elevated"
                size="small"
              >
                {{ String(u.role || '').toUpperCase() }}
              </v-chip>
            </td>
            
            <!-- House Fee -->
            <td>
              <div v-if="editingUserId === u.id" class="fee-editor">
                <v-text-field
                  v-model.number="editForm.houseFee"
                  type="number"
                  density="compact"
                  hide-details
                  variant="outlined"
                  min="0"
                  step="0.01"
                />
              </div>
              <span v-else>{{ formatFee(u.houseFee) }} Birr</span>
            </td>
            
            <!-- Total Earnings with Menu -->
            <td>
              <v-menu v-if="u.role === 'user'">
                <template v-slot:activator="{ props }">
                  <v-chip 
                    v-bind="props" 
                    color="success" 
                    size="small"
                    class="cursor-pointer"
                  >
                    {{ formatFee(u.totalEarnings || 0) }} Birr
                    <v-icon end size="small">mdi-chevron-down</v-icon>
                  </v-chip>
                </template>
                <v-list density="compact">
                  <v-list-item @click="viewEarningsHistory(u)">
                    <template v-slot:prepend>
                      <v-icon size="small">mdi-history</v-icon>
                    </template>
                    <v-list-item-title>View History</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="openAdjustEarnings(u, 'add')">
                    <template v-slot:prepend>
                      <v-icon size="small" color="success">mdi-plus-circle</v-icon>
                    </template>
                    <v-list-item-title>Add Earnings</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="openAdjustEarnings(u, 'subtract')">
                    <template v-slot:prepend>
                      <v-icon size="small" color="warning">mdi-minus-circle</v-icon>
                    </template>
                    <v-list-item-title>Subtract Earnings</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="openAdjustEarnings(u, 'payout')">
                    <template v-slot:prepend>
                      <v-icon size="small" color="info">mdi-bank-transfer</v-icon>
                    </template>
                    <v-list-item-title>Process Payout</v-list-item-title>
                  </v-list-item>
                  <v-divider />
                  <v-list-item @click="openAdjustEarnings(u, 'reset')">
                    <template v-slot:prepend>
                      <v-icon size="small" color="error">mdi-refresh</v-icon>
                    </template>
                    <v-list-item-title>Reset Earnings</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
              <span v-else>-</span>
            </td>
            
            <!-- Created -->
            <td>
              <small>{{ formatDate(u.createdAt) }}</small>
            </td>
            
            <!-- Last Active with Status Text -->
            <td>
              <div class="d-flex flex-column">
                <small>{{ formatDate(u.lastActive) }}</small>
                <small class="text-caption" :style="{ color: getActivityColor(u.lastActive) }">
                  {{ getActivityText(u.lastActive) }}
                </small>
              </div>
            </td>
            
            <!-- Actions -->
            <td>
              <v-btn
                v-if="editingUserId !== u.id"
                color="primary"
                variant="text"
                size="small"
                @click="startEditUser(u)"
                title="Edit User"
              >
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
              <v-btn
                v-if="editingUserId === u.id"
                color="success"
                variant="text"
                size="small"
                @click="saveUser(u.id)"
                title="Update User"
              >
                <v-icon>mdi-content-save</v-icon>
              </v-btn>
              <v-btn
                v-if="editingUserId === u.id"
                color="secondary"
                variant="text"
                size="small"
                @click="cancelEditUser"
                title="Cancel Edit"
              >
                <v-icon>mdi-close</v-icon>
              </v-btn>
              <v-btn
                v-if="u.role !== 'admin'"
                color="warning"
                variant="text"
                size="small"
                @click="makeAdmin(u.id)"
                title="Make Admin"
              >
                <v-icon>mdi-shield-crown</v-icon>
              </v-btn>
              <v-btn
                v-else
                color="info"
                variant="text"
                size="small"
                @click="removeAdmin(u.id)"
                title="Remove Admin"
              >
                <v-icon>mdi-shield-remove</v-icon>
              </v-btn>
              <v-btn
                color="error"
                variant="text"
                size="small"
                @click="deleteUser(u.id)"
                title="Delete User"
              >
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </td>
          </tr>
        </tbody>
      </v-table>

      <!-- Empty State -->
      <v-alert v-if="filteredUsers.length === 0" type="warning" variant="tonal" class="mt-4">
        <v-icon class="mr-2">mdi-alert-circle</v-icon>
        No users found matching your filters.
      </v-alert>

      <div
        v-if="filteredUsers.length > 0"
        class="d-flex flex-wrap align-center justify-space-between mt-4 ga-3"
      >
        <div class="text-caption text-medium-emphasis">
          Showing {{ usersRangeStart }}–{{ usersRangeEnd }} of {{ filteredUsers.length }} users
          <span v-if="onlineCount > 0"> · {{ onlineCount }} online now</span>
        </div>
        <v-select
          v-model="itemsPerPage"
          :items="pageSizeOptions"
          label="Per page"
          variant="outlined"
          density="compact"
          hide-details
          style="max-width: 120px"
        />
        <v-pagination
          v-model="currentPage"
          :length="totalFilteredPages"
          :total-visible="7"
          density="comfortable"
        />
      </div>
    </v-card-text>

    <!-- Earnings Adjustment Dialog -->
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
            <strong>User:</strong> {{ selectedUser?.username }}<br>
            <strong>Current Balance:</strong> {{ formatFee(selectedUser?.totalEarnings || 0) }} Birr
          </v-alert>

          <v-text-field
            v-if="adjustmentType !== 'reset'"
            v-model.number="adjustmentAmount"
            label="Amount (Birr)"
            type="number"
            variant="outlined"
            min="0"
            step="0.01"
            prepend-inner-icon="mdi-currency-usd"
            class="mb-4"
          />

          <v-textarea
            v-model="adjustmentReason"
            label="Reason (optional)"
            variant="outlined"
            rows="3"
            placeholder="Enter reason for this adjustment..."
          />

          <v-alert 
            v-if="adjustmentType === 'reset'" 
            type="warning" 
            variant="tonal"
          >
            This will reset the user's earnings to 0 Birr. This action cannot be undone.
          </v-alert>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn @click="showAdjustDialog = false">Cancel</v-btn>
          <v-btn 
            :color="getAdjustmentColor(adjustmentType)" 
            @click="confirmAdjustment"
            :loading="adjusting"
          >
            Confirm
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Earnings History Dialog -->
    <v-dialog v-model="showHistoryDialog" max-width="700">
      <v-card>
        <v-card-title>
          <v-icon class="mr-2">mdi-history</v-icon>
          Earnings History - {{ selectedUser?.username }}
        </v-card-title>
        
        <v-card-text>
          <v-alert type="info" variant="tonal" class="mb-4">
            <strong>Current Balance:</strong> {{ formatFee(selectedUser?.totalEarnings || 0) }} Birr
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
                <td><v-chip size="x-small">{{ formatTransactionType(tx.type) }}</v-chip></td>
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
            No payment history yet.
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
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject, watch } from 'vue';
import { useAdminDashboard } from '@/composables/useAdminDashboard';
import type { Services } from '@/services';
import {
  formatTransactionType,
  getActivityColor,
  getActivityText,
  matchesActivityFilter,
  useEarningsManagement,
} from '@/composables/useUserTracking';

const services = inject<Services>('services');

const {
  cancelEditUser,
  deleteUser,
  editForm,
  editingUserId,
  formatDate,
  formatFee,
  loadUsers,
  makeAdmin,
  removeAdmin,
  roleOptions,
  saveUser,
  showToast,
  startEditUser,
  totalUserEarnings,
  users,
} = useAdminDashboard();

// Search & Filter State
const searchQuery = ref('');
const filterRole = ref('All');
const filterActivity = ref('All');
const sortBy = ref('username');
const currentPage = ref(1);
const itemsPerPage = ref(10);
const historyPage = ref(1);
const historyPerPage = 10;
const pageSizeOptions = [5, 10, 25, 50];

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

// Filter Options
const activityFilterOptions = [
  'All',
  'Online Now',
  'Active Today',
  'This Week',
  'Inactive',
];

const sortOptions = [
  { title: 'Username (A-Z)', value: 'username' },
  { title: 'Username (Z-A)', value: 'username-desc' },
  { title: 'Earnings (High-Low)', value: 'earnings-desc' },
  { title: 'Earnings (Low-High)', value: 'earnings' },
  { title: 'Last Active (Recent)', value: 'active-desc' },
  { title: 'Last Active (Oldest)', value: 'active' },
];

// Computed: Has Active Filters
const hasActiveFilters = computed(() => {
  return searchQuery.value !== '' || 
         filterRole.value !== 'All' || 
         filterActivity.value !== 'All' ||
         sortBy.value !== 'username';
});

// Computed: Filtered Users
const filteredUsers = computed(() => {
  let result = [...users.value];

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(u => 
      u.username.toLowerCase().includes(query)
    );
  }

  // Role filter
  if (filterRole.value !== 'All') {
    result = result.filter(u => 
      u.role.toLowerCase() === filterRole.value.toLowerCase()
    );
  }

  if (filterActivity.value !== 'All') {
    result = result.filter((u) =>
      matchesActivityFilter(u.lastActive, filterActivity.value),
    );
  }

  // Sort
  result.sort((a, b) => {
    switch (sortBy.value) {
      case 'username':
        return a.username.localeCompare(b.username);
      case 'username-desc':
        return b.username.localeCompare(a.username);
      case 'earnings':
        return (a.totalEarnings || 0) - (b.totalEarnings || 0);
      case 'earnings-desc':
        return (b.totalEarnings || 0) - (a.totalEarnings || 0);
      case 'active':
        return new Date(a.lastActive || 0).getTime() - new Date(b.lastActive || 0).getTime();
      case 'active-desc':
        return new Date(b.lastActive || 0).getTime() - new Date(a.lastActive || 0).getTime();
      default:
        return 0;
    }
  });

  return result;
});

// Computed: Paginated Filtered Users
const paginatedFilteredUsers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  return filteredUsers.value.slice(start, start + itemsPerPage.value);
});

const totalFilteredPages = computed(() =>
  Math.max(1, Math.ceil(filteredUsers.value.length / itemsPerPage.value)),
);

const usersRangeStart = computed(() =>
  filteredUsers.value.length === 0 ? 0 : (currentPage.value - 1) * itemsPerPage.value + 1,
);

const usersRangeEnd = computed(() =>
  Math.min(currentPage.value * itemsPerPage.value, filteredUsers.value.length),
);

const onlineCount = computed(() =>
  users.value.filter((u) => matchesActivityFilter(u.lastActive, 'Online Now')).length,
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

watch([searchQuery, filterRole, filterActivity, sortBy], () => {
  currentPage.value = 1;
});

watch(itemsPerPage, () => {
  currentPage.value = 1;
});

watch(earningsHistory, () => {
  historyPage.value = 1;
});

watch(currentPage, (page) => {
  if (page > totalFilteredPages.value) {
    currentPage.value = totalFilteredPages.value;
  }
});

// Clear Filters
function clearFilters() {
  searchQuery.value = '';
  filterRole.value = 'All';
  filterActivity.value = 'All';
  sortBy.value = 'username';
  currentPage.value = 1;
}

async function confirmAdjustment() {
  if (!selectedUser.value) return;
  
  if (adjustmentType.value !== 'reset' && adjustmentAmount.value <= 0) {
    showToast('Please enter a valid amount', 'error');
    return;
  }

  adjusting.value = true;
  try {
    const amount = adjustmentType.value === 'reset' ? 0 : adjustmentAmount.value;
    await services?.userService.adjustEarnings(
      selectedUser.value.id,
      amount,
      adjustmentType.value,
      adjustmentReason.value
    );
    
    showToast(`Earnings ${adjustmentType.value === 'reset' ? 'reset' : 'adjusted'} successfully!`, 'success');
    showAdjustDialog.value = false;
    await loadUsers();
    if (showHistoryDialog.value && selectedUser.value) {
      await loadEarningsHistory(selectedUser.value.id);
    }
  } catch (error: any) {
    showToast(error.response?.data?.message || 'Failed to adjust earnings', 'error');
  } finally {
    adjusting.value = false;
  }
}

// Load users on mount
onMounted(() => {
  console.log('[AdminUsersTabEnhanced] Component mounted, loading users...');
  loadUsers();
});
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

.user-table {
  border-radius: 8px;
  overflow: hidden;
}

.user-table thead {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.user-table thead th {
  color: white !important;
  font-weight: 600;
}

.user-table tbody tr:hover {
  background-color: rgba(102, 126, 234, 0.05);
}
</style>
