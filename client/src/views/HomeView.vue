<template>
  <div class="home-container">
    <!-- Header with Logout -->
    <v-app-bar color="primary" dark elevation="4" v-if="logged">
      <v-toolbar-title>
        <v-icon class="mr-2">mdi-cards</v-icon>
        Bingo Game
      </v-toolbar-title>

      <v-spacer></v-spacer>

      <v-chip class="mr-3" color="white" text-color="primary">
        <v-icon left small>mdi-account</v-icon>
        {{ user?.username }}
      </v-chip>

      <v-btn icon @click="confirmLogout">
        <v-icon>mdi-logout</v-icon>
      </v-btn>
    </v-app-bar>

    <v-container class="welcome-section">
      <v-card class="welcome-card" elevation="6">
        <v-card-title class="welcome-title">
          <v-icon class="mr-2">mdi-cards</v-icon>
          Welcome to Bingo Game
        </v-card-title>
        <v-card-text class="pa-6">
          <v-alert v-if="isAdmin" type="info" variant="tonal" class="mb-4">
            <v-icon class="mr-2">mdi-shield-admin</v-icon>
            You are logged in as admin. Room management, user management, privilege control,
            and registration are available in the admin dashboard.
          </v-alert>

          <v-alert v-else type="info" variant="tonal" class="mb-4">
            <v-icon class="mr-2">mdi-information</v-icon>
            Rooms are managed by administrators. Your assigned manager rooms appear below.
          </v-alert>

          <div class="actions">
            <v-btn
              v-if="isAdmin"
              color="primary"
              size="large"
              @click="goToAdminDashboard"
            >
              <v-icon class="mr-2">mdi-view-dashboard</v-icon>
              Open Admin Dashboard
            </v-btn>
            <v-alert v-else-if="!logged" type="warning" variant="tonal">
              <v-icon class="mr-2">mdi-lock</v-icon>
              Please login. Ask an administrator to create your account.
            </v-alert>
          </div>

          <div v-if="logged && !isAdmin" class="mt-4">
            <v-card variant="outlined" class="managed-rooms-card">
              <v-card-title class="text-h6">
                <v-icon class="mr-2">mdi-office-building-cog</v-icon>
                My Assigned Rooms
              </v-card-title>
              <v-card-text>
                <v-progress-linear
                  v-if="loadingManagedRooms"
                  indeterminate
                  color="primary"
                  class="mb-3"
                />

                <v-alert v-else-if="managedRooms.length === 0" type="warning" variant="tonal">
                  No room assigned yet. Please ask admin to assign you as room manager.
                </v-alert>

                <v-row v-else>
                  <v-col v-for="room in managedRooms" :key="room.id" cols="12" md="6">
                    <v-card class="room-card" elevation="2">
                      <v-card-title class="d-flex align-center justify-space-between">
                        <span>{{ room.name }}</span>
                        <v-chip color="success" size="small">ASSIGNED</v-chip>
                      </v-card-title>
                      <v-card-text>
                        <div class="text-caption mb-2">
                          Ticket price: {{ Number(room.ticketPrice || 0).toFixed(2) }}
                        </div>
                        <v-btn
                          color="primary"
                          variant="elevated"
                          size="small"
                          @click="openManagedRoom(room.id)"
                        >
                          <v-icon class="mr-1">mdi-login-variant</v-icon>
                          Open Room
                        </v-btn>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </div>
        </v-card-text>
      </v-card>
    </v-container>

    <!-- Logout Confirmation Dialog -->
    <v-dialog v-model="showLogoutDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h5">
          <v-icon class="mr-2" color="warning">mdi-logout</v-icon>
          Confirm Logout
        </v-card-title>
        <v-card-text>
          Are you sure you want to logout?
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="showLogoutDialog = false">
            Cancel
          </v-btn>
          <v-btn color="error" variant="elevated" @click="logout">
            <v-icon class="mr-1">mdi-logout</v-icon>
            Logout
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, onMounted, onBeforeUnmount, ref, watch } from "vue";
import { useAuth } from "@/store/auth";
import { useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import type { Services } from "@/services";

// Store
const auth = useAuth();
const { logged, user } = storeToRefs(auth);
const router = useRouter();
const services = inject<Services>('services');

// State
const showLogoutDialog = ref(false);

// Computed
const isAdmin = computed(() => String(user.value?.role || '').toLowerCase() === 'admin');
type ManagedRoom = { id: number; name: string; ticketPrice?: number };
const managedRooms = ref<ManagedRoom[]>([]);
const loadingManagedRooms = ref(false);

function resolveRoomId(room: any): number | null {
  const direct = Number(room?.id);
  if (Number.isFinite(direct) && direct > 0) return direct;
  const nested = Number(room?.room?.id);
  if (Number.isFinite(nested) && nested > 0) return nested;
  return null;
}

function normalizeManagedRooms(rawRooms: any[]): ManagedRoom[] {
  return rawRooms
    .map((room) => {
      const id = resolveRoomId(room);
      if (!id) return null;
      return {
        id,
        name: String(room?.name || room?.room?.name || `Room #${id}`),
        ticketPrice: Number(room?.ticketPrice || room?.room?.ticketPrice || 0),
      };
    })
    .filter((room): room is ManagedRoom => Boolean(room));
}

async function loadManagedRooms() {
  if (!logged.value || isAdmin.value || !user.value?.id) {
    managedRooms.value = [];
    return;
  }

  try {
    loadingManagedRooms.value = true;
    console.log('Loading managed rooms for user:', user.value.id);
    const response = await services?.roomService.getUserManagedRooms(user.value.id);
    console.log('Managed rooms response:', response?.data);
    managedRooms.value = normalizeManagedRooms(response?.data || []);
    console.log('Normalized managed rooms:', managedRooms.value);
    if (managedRooms.value.length === 1 && managedRooms.value[0].id) {
      console.log('Auto-redirecting to room:', managedRooms.value[0].id);
      openManagedRoom(managedRooms.value[0].id);
    }
  } catch (error) {
    console.error('Failed to load managed rooms:', error);
    managedRooms.value = [];
  } finally {
    loadingManagedRooms.value = false;
  }
}

function goToAdminDashboard() {
  router?.push({ name: 'admin-dashboard' });
}

function openManagedRoom(roomId: number) {
  if (!Number.isFinite(Number(roomId)) || Number(roomId) <= 0) {
    return;
  }
  router?.push({ name: 'bingo-rooms', params: { roomId } });
}

function confirmLogout() {
  showLogoutDialog.value = true;
}

function logout() {
  showLogoutDialog.value = false;
  auth.logout();
  router?.push({ name: 'home' });
}

onMounted(() => {
  loadManagedRooms();
});

const stopWatcher = watch([logged, user], () => {
  loadManagedRooms();
}, { deep: true });

onBeforeUnmount(() => {
  // Stop the watcher when component unmounts
  stopWatcher();
});
</script>

<style scoped lang="scss">
.home-container {
  min-height: 80vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 0;
}

.welcome-section {
  max-width: 900px;
  margin: 0 auto;
}

.welcome-card {
  border-radius: 12px !important;
}

.welcome-title {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: bold;
}

.actions {
  display: flex;
  justify-content: center;
}

.managed-rooms-card {
  border-radius: 12px;
}

.room-card {
  border-radius: 10px;
}
</style>
