<template>
  <div class="modern-home-container">
    <!-- Modern Header -->
    <v-app-bar color="white" elevation="1" class="modern-header" v-if="logged">
      <v-container class="d-flex align-center">
        <div class="d-flex align-center">
          <v-avatar color="primary" size="40" class="mr-3">
            <v-icon color="white">mdi-cards</v-icon>
          </v-avatar>
          <div>
            <div class="app-name">Bingo Game</div>
            <div class="app-tagline">Play & Win</div>
          </div>
        </div>

        <v-spacer></v-spacer>

        <v-chip class="user-chip mr-3" variant="flat" color="primary">
          <v-avatar start color="white">
            <v-icon color="primary" size="small">mdi-account</v-icon>
          </v-avatar>
          {{ user?.username }}
        </v-chip>

        <v-btn icon variant="text" @click="confirmLogout" class="logout-btn">
          <v-icon>mdi-logout</v-icon>
        </v-btn>
      </v-container>
    </v-app-bar>

    <!-- Hero Section -->
    <div class="hero-section">
      <v-container>
        <div class="hero-content">
          <div class="hero-icon-wrapper">
            <v-avatar color="white" size="120" class="hero-icon">
              <v-icon size="60" color="primary">mdi-cards-playing-outline</v-icon>
            </v-avatar>
          </div>
          
          <h1 class="hero-title">Welcome to Bingo Game</h1>
          <p class="hero-subtitle">Your ultimate bingo gaming experience</p>

          <!-- Admin Section -->
          <v-card v-if="isAdmin" class="action-card admin-card" elevation="8">
            <v-card-text class="pa-6">
              <div class="d-flex align-center mb-4">
                <v-avatar color="primary" size="48" class="mr-3">
                  <v-icon color="white">mdi-shield-crown</v-icon>
                </v-avatar>
                <div>
                  <h3 class="text-h6 font-weight-bold mb-1">Administrator Access</h3>
                  <p class="text-body-2 text-grey mb-0">
                    Manage rooms, users, and game settings
                  </p>
                </div>
              </div>

              <v-divider class="my-4"></v-divider>

              <div class="admin-features mb-4">
                <div class="feature-item">
                  <v-icon color="primary" size="small">mdi-check-circle</v-icon>
                  <span>Room Management</span>
                </div>
                <div class="feature-item">
                  <v-icon color="primary" size="small">mdi-check-circle</v-icon>
                  <span>User Control</span>
                </div>
                <div class="feature-item">
                  <v-icon color="primary" size="small">mdi-check-circle</v-icon>
                  <span>Card Management</span>
                </div>
                <div class="feature-item">
                  <v-icon color="primary" size="small">mdi-check-circle</v-icon>
                  <span>Privilege Settings</span>
                </div>
              </div>

              <v-btn
                color="primary"
                size="x-large"
                block
                elevation="2"
                @click="goToAdminDashboard"
                class="admin-btn"
              >
                <v-icon class="mr-2">mdi-view-dashboard</v-icon>
                Open Admin Dashboard
              </v-btn>
            </v-card-text>
          </v-card>

          <!-- Non-Admin Section -->
          <div v-else>
            <!-- Not Logged In -->
            <v-card v-if="!logged" class="action-card warning-card" elevation="8">
              <v-card-text class="pa-6 text-center">
                <v-avatar color="warning" size="64" class="mb-4">
                  <v-icon color="white" size="32">mdi-lock-alert</v-icon>
                </v-avatar>
                <h3 class="text-h6 font-weight-bold mb-2">Authentication Required</h3>
                <p class="text-body-2 text-grey mb-4">
                  Please contact an administrator to create your account
                </p>
                <v-btn color="warning" variant="outlined" size="large">
                  <v-icon class="mr-2">mdi-email</v-icon>
                  Contact Admin
                </v-btn>
              </v-card-text>
            </v-card>

            <!-- Logged In - Manager View -->
            <v-card v-else class="action-card manager-card" elevation="8">
              <v-card-text class="pa-6">
                <div class="d-flex align-center mb-4">
                  <v-avatar color="success" size="48" class="mr-3">
                    <v-icon color="white">mdi-account-tie</v-icon>
                  </v-avatar>
                  <div>
                    <h3 class="text-h6 font-weight-bold mb-1">Room Manager</h3>
                    <p class="text-body-2 text-grey mb-0">
                      Your assigned rooms
                    </p>
                  </div>
                </div>

                <v-divider class="my-4"></v-divider>

                <!-- Loading State -->
                <div v-if="loadingManagedRooms" class="text-center py-8">
                  <v-progress-circular
                    indeterminate
                    color="primary"
                    size="48"
                    class="mb-3"
                  ></v-progress-circular>
                  <p class="text-body-2 text-grey">Loading your rooms...</p>
                </div>

                <!-- No Rooms -->
                <div v-else-if="managedRooms.length === 0" class="empty-state">
                  <v-icon size="80" color="grey-lighten-1" class="mb-3">mdi-office-building-outline</v-icon>
                  <h4 class="text-h6 mb-2">No Rooms Assigned</h4>
                  <p class="text-body-2 text-grey">
                    Please ask an administrator to assign you as a room manager
                  </p>
                </div>

                <!-- Rooms List -->
                <div v-else class="rooms-grid">
                  <v-card
                    v-for="room in managedRooms"
                    :key="room.id"
                    class="room-item"
                    elevation="2"
                    hover
                  >
                    <v-card-text class="pa-4">
                      <div class="d-flex align-center justify-space-between mb-3">
                        <h4 class="text-h6 font-weight-bold">{{ room.name }}</h4>
                        <v-chip color="success" size="small" variant="flat">
                          <v-icon size="x-small" class="mr-1">mdi-check</v-icon>
                          ACTIVE
                        </v-chip>
                      </div>

                      <div class="room-info mb-3">
                        <div class="info-item">
                          <v-icon size="small" color="grey">mdi-currency-usd</v-icon>
                          <span>{{ Number(room.ticketPrice || 0).toFixed(2) }} Birr</span>
                        </div>
                      </div>

                      <v-btn
                        color="primary"
                        variant="elevated"
                        block
                        @click="openManagedRoom(room.id)"
                      >
                        <v-icon class="mr-2">mdi-login-variant</v-icon>
                        Enter Room
                      </v-btn>
                    </v-card-text>
                  </v-card>
                </div>
              </v-card-text>
            </v-card>
          </div>
        </div>
      </v-container>
    </div>

    <!-- Features Section -->
    <div class="features-section">
      <v-container>
        <h2 class="section-title text-center mb-8">Why Choose Our Platform?</h2>
        <v-row>
          <v-col cols="12" md="4">
            <div class="feature-card">
              <v-avatar color="primary" size="64" class="mb-4">
                <v-icon color="white" size="32">mdi-lightning-bolt</v-icon>
              </v-avatar>
              <h3 class="text-h6 font-weight-bold mb-2">Fast & Reliable</h3>
              <p class="text-body-2 text-grey">
                Real-time gameplay with instant updates and smooth performance
              </p>
            </div>
          </v-col>
          <v-col cols="12" md="4">
            <div class="feature-card">
              <v-avatar color="success" size="64" class="mb-4">
                <v-icon color="white" size="32">mdi-shield-check</v-icon>
              </v-avatar>
              <h3 class="text-h6 font-weight-bold mb-2">Secure Platform</h3>
              <p class="text-body-2 text-grey">
                Your data and gameplay are protected with enterprise-grade security
              </p>
            </div>
          </v-col>
          <v-col cols="12" md="4">
            <div class="feature-card">
              <v-avatar color="warning" size="64" class="mb-4">
                <v-icon color="white" size="32">mdi-trophy</v-icon>
              </v-avatar>
              <h3 class="text-h6 font-weight-bold mb-2">Win Big</h3>
              <p class="text-body-2 text-grey">
                Exciting prizes and rewards for winners in every game
              </p>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </div>

    <!-- Footer -->
    <div class="modern-footer">
      <v-container>
        <div class="text-center">
          <p class="text-body-2 text-grey mb-2">
            © 2024 Bingo Game. All rights reserved.
          </p>
          <p class="text-caption text-grey">
            Powered by modern web technologies
          </p>
        </div>
      </v-container>
    </div>

    <!-- Logout Confirmation Dialog -->
    <v-dialog v-model="showLogoutDialog" max-width="400">
      <v-card class="logout-dialog">
        <v-card-text class="pa-6 text-center">
          <v-avatar color="warning" size="64" class="mb-4">
            <v-icon color="white" size="32">mdi-logout</v-icon>
          </v-avatar>
          <h3 class="text-h6 font-weight-bold mb-2">Confirm Logout</h3>
          <p class="text-body-2 text-grey mb-4">
            Are you sure you want to logout?
          </p>
          <div class="d-flex gap-2">
            <v-btn
              color="grey"
              variant="outlined"
              block
              @click="showLogoutDialog = false"
            >
              Cancel
            </v-btn>
            <v-btn
              color="error"
              variant="elevated"
              block
              @click="logout"
            >
              <v-icon class="mr-1">mdi-logout</v-icon>
              Logout
            </v-btn>
          </div>
        </v-card-text>
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
.modern-home-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
    pointer-events: none;
  }
}

/* Modern Header */
.modern-header {
  background: white !important;
  border-bottom: 1px solid #e0e0e0;
  
  .app-name {
    font-size: 1.1rem;
    font-weight: 700;
    color: #2c3e50;
    line-height: 1.2;
  }
  
  .app-tagline {
    font-size: 0.75rem;
    color: #8898aa;
    line-height: 1.2;
  }
  
  .user-chip {
    font-weight: 600;
  }
  
  .logout-btn {
    color: #5a6c7d;
  }
}

/* Hero Section */
.hero-section {
  padding: 80px 0 60px;
  position: relative;
  z-index: 1;
}

.hero-content {
  max-width: 700px;
  margin: 0 auto;
  text-align: center;
}

.hero-icon-wrapper {
  margin-bottom: 32px;
  animation: float 3s ease-in-out infinite;
  
  .hero-icon {
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
}

.hero-title {
  font-size: 3rem;
  font-weight: 800;
  color: white;
  margin-bottom: 16px;
  text-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  
  @media (max-width: 600px) {
    font-size: 2rem;
  }
}

.hero-subtitle {
  font-size: 1.25rem;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 48px;
  font-weight: 400;
}

/* Action Cards */
.action-card {
  border-radius: 24px !important;
  background: white;
  backdrop-filter: blur(10px);
  animation: slideUp 0.6s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.admin-card {
  border: 2px solid #4e73df;
}

.manager-card {
  border: 2px solid #1cc88a;
}

.warning-card {
  border: 2px solid #f6c23e;
}

.admin-features {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  color: #5a6c7d;
  font-weight: 500;
}

.admin-btn {
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: none;
  font-size: 1rem;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 48px 24px;
  
  h4 {
    color: #2c3e50;
  }
}

/* Rooms Grid */
.rooms-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.room-item {
  border-radius: 16px !important;
  border: 2px solid transparent;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #1cc88a;
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15) !important;
  }
}

.room-info {
  .info-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.875rem;
    color: #5a6c7d;
  }
}

/* Features Section */
.features-section {
  padding: 80px 0;
  background: white;
  position: relative;
  z-index: 1;
}

.section-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #2c3e50;
  
  @media (max-width: 600px) {
    font-size: 1.75rem;
  }
}

.feature-card {
  text-align: center;
  padding: 32px 24px;
  border-radius: 16px;
  transition: transform 0.3s ease;
  
  &:hover {
    transform: translateY(-8px);
  }
  
  h3 {
    color: #2c3e50;
  }
}

/* Footer */
.modern-footer {
  padding: 40px 0;
  background: rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 1;
}

/* Logout Dialog */
.logout-dialog {
  border-radius: 24px !important;
}

/* Responsive */
@media (max-width: 600px) {
  .hero-section {
    padding: 40px 0 30px;
  }
  
  .features-section {
    padding: 40px 0;
  }
}
</style>
