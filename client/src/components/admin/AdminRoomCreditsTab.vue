<template>
  <div class="user-credits-overview-page">
    <div class="page-header mb-6">
      <div>
        <div class="page-kicker">CREDIT MANAGEMENT</div>
        <h1 class="text-h4 font-weight-bold mt-1">User Credits Overview</h1>
        <p class="text-medium-emphasis mt-2">
          Monitor credit balances and game activity across all users.
        </p>
      </div>
    </div>

    <!-- Summary Card -->
    <v-card class="content-card mb-6" rounded="xl">
      <v-card-text class="pa-5">
        <v-row>
          <v-col cols="12" sm="6" md="3">
            <div class="stat-card">
              <div class="stat-label">Total Users</div>
              <div class="stat-value">{{ userCreditsSummary.length }}</div>
            </div>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <div class="stat-card">
              <div class="stat-label">Total Credits</div>
              <div class="stat-value text-info">{{ totalCredits }}</div>
            </div>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <div class="stat-card">
              <div class="stat-label">Total Games Played</div>
              <div class="stat-value text-success">{{ totalGamesPlayed }}</div>
            </div>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <div class="stat-card">
              <div class="stat-label">Users with Credits</div>
              <div class="stat-value text-primary">{{ usersWithCredits }}</div>
            </div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- User Credits Table -->
    <v-card class="content-card" rounded="xl">
      <v-card-title class="d-flex flex-wrap align-center justify-space-between ga-3">
        <div class="d-flex align-center ga-2">
          <v-icon color="primary">mdi-account-cash</v-icon>
          User Credit Status
        </div>

        <v-btn
          variant="outlined"
          color="primary"
          prepend-icon="mdi-refresh"
          :loading="loading"
          @click="loadData"
        >
          Refresh
        </v-btn>
      </v-card-title>

      <v-card-text class="pa-4">
        <v-data-table
          :headers="headers"
          :items="userCreditsSummary"
          :loading="loading"
          item-value="id"
          hover
          class="credits-table"
        >
          <template v-slot:[`item.username`]="{ item }">
            <div class="d-flex align-center">
              <v-icon class="mr-2" :color="item.role === 'admin' ? 'error' : 'primary'">
                {{ item.role === 'admin' ? 'mdi-shield-crown' : 'mdi-account' }}
              </v-icon>
              <strong>{{ item.username }}</strong>
            </div>
          </template>

          <template v-slot:[`item.role`]="{ item }">
            <v-chip 
              size="small" 
              :color="item.role === 'admin' ? 'error' : 'primary'"
              variant="tonal"
            >
              {{ item.role.toUpperCase() }}
            </v-chip>
          </template>

          <template v-slot:[`item.credits`]="{ item }">
            <v-chip 
              size="small" 
              :color="item.credits > 0 ? 'info' : 'grey'"
            >
              {{ item.credits }}
            </v-chip>
          </template>

          <template v-slot:[`item.gamesPlayed`]="{ item }">
            <v-chip 
              size="small" 
              color="primary"
            >
              {{ item.gamesPlayed }}
            </v-chip>
          </template>

          <template v-slot:loading>
            <v-skeleton-loader type="table-row@5" />
          </template>

          <template v-slot:no-data>
            <v-alert type="info" variant="tonal" class="ma-4">
              No users found.
            </v-alert>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, inject } from 'vue';
import type { Services } from '@/services';

const services = inject<Services>('services');

const loading = ref(false);
const userCreditsSummary = ref<any[]>([]);
// eslint-disable-next-line no-undef
let refreshInterval: NodeJS.Timeout | null = null;

const headers = [
  { title: 'Username', key: 'username', sortable: true },
  { title: 'Role', key: 'role', sortable: true },
  { title: 'Credits', key: 'credits', sortable: true },
  { title: 'Games Played', key: 'gamesPlayed', sortable: true },
];

const totalCredits = computed(() => {
  return userCreditsSummary.value.reduce((sum, user) => sum + (user.credits || 0), 0);
});

const totalGamesPlayed = computed(() => {
  return userCreditsSummary.value.reduce((sum, user) => sum + (user.gamesPlayed || 0), 0);
});

const usersWithCredits = computed(() => {
  return userCreditsSummary.value.filter(user => (user.credits || 0) > 0).length;
});

async function loadData() {
  loading.value = true;
  try {
    const response = await services?.userService.getAllUsersCredits();
    userCreditsSummary.value = response?.data?.data || [];
  } catch (error) {
    console.error('Failed to load user credits summary:', error);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadData();
  
  // Auto-refresh every 30 seconds
  refreshInterval = setInterval(() => {
    loadData();
  }, 30000);
});

onBeforeUnmount(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});
</script>

<style scoped>
.page-kicker {
  text-transform: uppercase;
  letter-spacing: 1px;
  font-size: 0.75rem;
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
}

.content-card {
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.stat-card {
  text-align: center;
  padding: 1rem;
}

.stat-label {
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.6);
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.87);
}

.stat-value.text-info {
  color: rgb(var(--v-theme-info));
}

.stat-value.text-success {
  color: rgb(var(--v-theme-success));
}

.stat-value.text-primary {
  color: rgb(var(--v-theme-primary));
}

.credits-table {
  border-radius: 8px;
  overflow: hidden;
}
</style>
