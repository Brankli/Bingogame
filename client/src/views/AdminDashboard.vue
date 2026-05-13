<template>
  <div class="admin-dashboard-layout">
    <!-- Top Navigation Bar -->
    <v-app-bar color="primary" dark elevation="4">
      <v-btn icon @click="goBack">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      
      <v-toolbar-title>
        <v-icon class="mr-2">mdi-shield-admin</v-icon>
        Admin Dashboard
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

    <v-container fluid class="pa-4 pa-md-6">
      <v-card class="dashboard-shell" elevation="6">
        <!-- Header -->
        <div class="top-header">
          <div>
            <h1 class="text-h4 font-weight-bold text-white mb-1">
              <v-icon size="large" class="mr-2">mdi-shield-admin</v-icon>
              Admin Dashboard
            </h1>
            <p class="text-body-1 text-white opacity-75">
              Smart control panel for rooms, users, and privileges
            </p>
          </div>
          <div class="header-stats">
            <v-card class="stat-card">
              <v-card-text class="text-center">
                <div class="stat-number">{{ rooms.length }}</div>
                <div class="stat-label">Active Rooms</div>
              </v-card-text>
            </v-card>
            <v-card class="stat-card">
              <v-card-text class="text-center">
                <div class="stat-number">{{ totalUsers }}</div>
                <div class="stat-label">Total Users</div>
              </v-card-text>
            </v-card>
            <v-card class="stat-card">
              <v-card-text class="text-center">
                <div class="stat-number">{{ adminCount }}</div>
                <div class="stat-label">Admins</div>
              </v-card-text>
            </v-card>
          </div>
        </div>

        <div class="dashboard-body">
          <!-- Left Sidebar -->
          <aside class="left-sidebar">
            <div class="sidebar-title">Navigation</div>
            <v-btn
              block
              class="sidebar-btn mb-2"
              :class="{ active: activeTab === 'rooms' }"
              variant="text"
              @click="activeTab = 'rooms'"
            >
              <v-icon class="mr-2">mdi-door-open</v-icon>
              Available Rooms
            </v-btn>
            <v-btn
              block
              class="sidebar-btn mb-2"
              :class="{ active: activeTab === 'users' }"
              variant="text"
              @click="activeTab = 'users'"
            >
              <v-icon class="mr-2">mdi-account-multiple</v-icon>
              User Management
            </v-btn>
            <v-btn
              block
              class="sidebar-btn"
              :class="{ active: activeTab === 'register' }"
              variant="text"
              @click="activeTab = 'register'"
            >
              <v-icon class="mr-2">mdi-account-plus</v-icon>
              Register User
            </v-btn>
            <v-btn
              block
              class="sidebar-btn mt-4"
              :class="{ active: activeTab === 'profile' }"
              variant="text"
              @click="activeTab = 'profile'"
            >
              <v-icon class="mr-2">mdi-account-cog</v-icon>
              My Profile
            </v-btn>
          </aside>

          <!-- Main Content -->
          <main class="main-content">
            <v-window v-model="activeTab">
        <!-- Rooms Tab -->
        <v-window-item value="rooms">
          <v-row>
            <v-col cols="12">
              <v-card class="rooms-card" elevation="4">
                <v-card-title class="card-title">
                  <v-icon class="mr-2">mdi-door-open</v-icon>
                  Available Rooms
                </v-card-title>
                <v-card-text>
                  <v-row v-if="rooms.length > 0">
                    <v-col 
                      v-for="room in paginatedRooms" 
                      :key="room.id"
                      cols="12"
                      sm="6"
                      md="4"
                      lg="3"
                    >
                      <v-card class="room-card" hover elevation="2">
                        <v-card-title class="room-card-title">
                          {{ room.name }}
                        </v-card-title>
                        <v-card-text>
                          <div class="room-info-item">
                            <v-icon size="small" class="mr-2">mdi-account-multiple</v-icon>
                            <span>{{ room.currentUsers?.length || 0 }} players</span>
                          </div>
                          <div class="room-info-item">
                            <v-icon size="small" class="mr-2">mdi-account</v-icon>
                            <span>Owner: {{ room.owner?.username }}</span>
                          </div>
                          <div class="room-info-item">
                            <v-icon size="small" class="mr-2">mdi-calendar</v-icon>
                            <span>{{ formatDate(room.createdAt) }}</span>
                          </div>
                          <div class="room-info-item">
                            <v-icon size="small" class="mr-2">mdi-account-tie</v-icon>
                            <span>
                              Managers:
                              <template v-if="room.managers?.length">
                                <v-chip
                                  v-for="manager in room.managers.filter(m => m.user)"
                                  :key="manager.id"
                                  size="x-small"
                                  color="indigo"
                                  class="ml-1"
                                >
                                  {{ manager.user.username }}
                                </v-chip>
                                <v-chip
                                  v-if="room.managers.some(m => !m.user)"
                                  size="x-small"
                                  color="error"
                                  class="ml-1"
                                  title="Invalid manager assignment - user deleted"
                                >
                                  <v-icon size="x-small" class="mr-1">mdi-alert</v-icon>
                                  Invalid
                                </v-chip>
                              </template>
                              <span v-else>None</span>
                            </span>
                          </div>
                        </v-card-text>
                        <v-card-actions>
                          <v-btn 
                            color="primary" 
                            variant="text" 
                            size="small"
                            @click="joinRoom(room.id)"
                          >
                            <v-icon class="mr-1">mdi-login</v-icon>
                            Join
                          </v-btn>
                          <v-spacer></v-spacer>
                          <v-btn 
                            color="error" 
                            variant="text" 
                            size="small"
                            @click="deleteRoom(room.id)"
                          >
                            <v-icon>mdi-delete</v-icon>
                          </v-btn>
                        </v-card-actions>
                      </v-card>
                    </v-col>
                  </v-row>

                  <!-- Rooms Pagination -->
                  <v-pagination
                    v-if="totalRoomsPages > 1"
                    v-model="roomsPage"
                    :length="totalRoomsPages"
                    :total-visible="7"
                    class="mt-4"
                  ></v-pagination>

                  <v-alert v-else-if="rooms.length === 0" type="info" variant="tonal">
                    <v-icon class="mr-2">mdi-information</v-icon>
                    No rooms available. Create one to get started!
                  </v-alert>
                </v-card-text>
              </v-card>

              <!-- Room Manager Assignment -->
              <v-card class="mt-6 create-room-card" elevation="4">
                <v-card-title class="card-title">
                  <v-icon class="mr-2">mdi-account-tie</v-icon>
                  Assign Room Manager
                </v-card-title>
                <v-card-text>
                  <v-alert type="warning" variant="tonal" class="mb-4" v-if="rooms.some(r => r.managers?.some(m => !m.user))">
                    <v-icon class="mr-2">mdi-alert</v-icon>
                    Some rooms have invalid manager assignments (deleted users).
                    <v-btn
                      color="error"
                      size="small"
                      variant="elevated"
                      class="ml-2"
                      @click="cleanupInvalidManagers"
                    >
                      <v-icon class="mr-1">mdi-broom</v-icon>
                      Clean Up
                    </v-btn>
                  </v-alert>

                  <v-row>
                    <v-col cols="12" md="5">
                      <v-select
                        v-model="selectedRoomForManager"
                        :items="rooms"
                        item-title="name"
                        item-value="id"
                        label="Select Room"
                        variant="outlined"
                      />
                    </v-col>
                    <v-col cols="12" md="5">
                      <v-select
                        v-model="selectedUserForManager"
                        :items="managerCandidates"
                        item-title="username"
                        item-value="id"
                        label="Select User"
                        variant="outlined"
                      />
                    </v-col>
                    <v-col cols="12" md="2" class="d-flex align-center">
                      <v-btn
                        color="primary"
                        block
                        :disabled="!selectedRoomForManager || !selectedUserForManager"
                        @click="assignManagerToRoom"
                      >
                        Assign
                      </v-btn>
                    </v-col>
                  </v-row>

                  <v-row>
                    <v-col cols="12">
                      <v-chip
                        v-for="manager in selectedRoomManagers"
                        :key="manager.id"
                        color="indigo"
                        class="mr-2 mb-2"
                      >
                        {{ manager.user?.username }}
                        <v-btn
                          icon
                          size="x-small"
                          variant="text"
                          class="ml-1"
                          @click="removeManagerFromRoom(manager.user?.id)"
                        >
                          <v-icon size="small">mdi-close</v-icon>
                        </v-btn>
                      </v-chip>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>

              <!-- Create Room Section -->
              <v-card class="mt-6 create-room-card" elevation="4">
                <v-card-title class="card-title">
                  <v-icon class="mr-2">mdi-plus-circle</v-icon>
                  Create New Room
                </v-card-title>
                <v-card-text>
                  <v-form @submit.prevent="createRoom">
                    <v-text-field
                      v-model="newRoom.name"
                      label="Room Name"
                      placeholder="Enter room name..."
                      variant="outlined"
                      prepend-inner-icon="mdi-door-open"
                      required
                      class="mb-4"
                    ></v-text-field>
                    <v-btn 
                      type="submit"
                      color="success" 
                      size="large"
                      block
                      elevation="2"
                    >
                      <v-icon class="mr-2">mdi-plus</v-icon>
                      Create Room
                    </v-btn>
                  </v-form>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-window-item>

        <!-- Users Tab -->
        <v-window-item value="users">
          <v-card class="users-card" elevation="4">
            <v-card-title class="card-title">
              <v-icon class="mr-2">mdi-account-multiple</v-icon>
              User Management
            </v-card-title>
            <v-card-text>
              <v-alert type="info" variant="tonal" class="mb-4">
                <v-icon class="mr-2">mdi-account-group</v-icon>
                {{ users.length }} users total | Total User Earnings: {{ formatFee(totalUserEarnings) }} Birr
              </v-alert>

              <v-table class="elevation-1 user-table" v-if="users.length > 0">
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
                  <tr v-for="u in paginatedUsers" :key="u.id">
                    <td>{{ u.username }}</td>
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
                    <td>
                      <v-chip color="success" size="small" v-if="u.role === 'user'">
                        {{ formatFee(u.totalEarnings || 0) }} Birr
                      </v-chip>
                      <span v-else>-</span>
                    </td>
                    <td>
                      <small>{{ formatDate(u.createdAt) }}</small>
                    </td>
                    <td>
                      <small>{{ formatDate(u.lastActive) }}</small>
                    </td>
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

              <!-- Users Pagination -->
              <v-pagination
                v-if="totalUsersPages > 1"
                v-model="usersPage"
                :length="totalUsersPages"
                :total-visible="7"
                class="mt-4"
              ></v-pagination>

              <v-alert v-if="users.length === 0" type="warning" variant="tonal" class="mt-4">
                <v-icon class="mr-2">mdi-alert-circle</v-icon>
                No users found.
              </v-alert>
            </v-card-text>
          </v-card>
        </v-window-item>

        <!-- Register User Tab -->
        <v-window-item value="register">
          <v-row>
            <v-col cols="12" md="6" lg="4">
              <v-card class="register-card" elevation="4">
                <v-card-title class="card-title">
                  <v-icon class="mr-2">mdi-account-plus</v-icon>
                  Register New User
                </v-card-title>
                <v-card-text>
                  <v-form @submit.prevent="registerUser">
                    <v-text-field
                      v-model="newUser.username"
                      label="Username"
                      variant="outlined"
                      prepend-inner-icon="mdi-account"
                      required
                      class="mb-4"
                    ></v-text-field>

                    <v-text-field
                      v-model="newUser.password"
                      type="password"
                      label="Password"
                      variant="outlined"
                      prepend-inner-icon="mdi-lock"
                      required
                      class="mb-4"
                    ></v-text-field>

                    <v-select
                      v-model="newUser.role"
                      :items="roleOptions"
                      item-title="title"
                      item-value="value"
                      label="User Role"
                      variant="outlined"
                      prepend-inner-icon="mdi-shield"
                      required
                      class="mb-4"
                    ></v-select>

                    <v-btn 
                      type="submit"
                      color="success" 
                      size="large"
                      block
                      elevation="2"
                    >
                      <v-icon class="mr-2">mdi-account-plus</v-icon>
                      Register User
                    </v-btn>
                  </v-form>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="12" md="6" lg="8">
              <v-card class="register-info-card" elevation="4">
                <v-card-title class="card-title">
                  <v-icon class="mr-2">mdi-information</v-icon>
                  Registration Guidelines
                </v-card-title>
                <v-card-text>
                  <div class="guideline-item">
                    <h4 class="font-weight-bold mb-2">Username Requirements:</h4>
                    <ul>
                      <li>Must be unique</li>
                      <li>Minimum 3 characters</li>
                      <li>Alphanumeric characters allowed</li>
                    </ul>
                  </div>
                  <v-divider class="my-4"></v-divider>
                  <div class="guideline-item">
                    <h4 class="font-weight-bold mb-2">Password Requirements:</h4>
                    <ul>
                      <li>Minimum 6 characters</li>
                      <li>Should be strong and secure</li>
                      <li>Users can change password after login</li>
                    </ul>
                  </div>
                  <v-divider class="my-4"></v-divider>
                  <div class="guideline-item">
                    <h4 class="font-weight-bold mb-2">User Roles:</h4>
                    <ul>
                      <li><strong>Admin:</strong> Full system access and management</li>
                      <li><strong>User:</strong> Can join rooms and play games</li>
                    </ul>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-window-item>

        <!-- Profile Tab -->
        <v-window-item value="profile">
          <v-row>
            <v-col cols="12" md="10" lg="8" class="mx-auto">
              <v-card class="profile-card" elevation="4">
                <v-card-title class="card-title">
                  <v-icon class="mr-2">mdi-account-cog</v-icon>
                  My Profile
                </v-card-title>
                <v-card-text>
                  <v-alert type="info" variant="tonal" class="mb-4">
                    <v-icon class="mr-2">mdi-information</v-icon>
                    Update your profile information and change your password
                  </v-alert>

                  <!-- Current User Info -->
                  <div class="mb-6">
                    <h3 class="text-h6 mb-3">Current Information</h3>
                    <v-list>
                      <v-list-item>
                        <template v-slot:prepend>
                          <v-icon>mdi-account</v-icon>
                        </template>
                        <v-list-item-title>Username</v-list-item-title>
                        <v-list-item-subtitle>{{ user?.username }}</v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item>
                        <template v-slot:prepend>
                          <v-icon>mdi-shield-account</v-icon>
                        </template>
                        <v-list-item-title>Role</v-list-item-title>
                        <v-list-item-subtitle>
                          <v-chip color="primary" size="small">{{ user?.role?.toUpperCase() }}</v-chip>
                        </v-list-item-subtitle>
                      </v-list-item>
                    </v-list>
                  </div>

                  <v-divider class="my-4"></v-divider>

                  <!-- Change Password Form -->
                  <div>
                    <h3 class="text-h6 mb-3">Change Password</h3>
                    <v-form @submit.prevent="changePassword">
                      <v-text-field
                        v-model="passwordForm.currentPassword"
                        label="Current Password"
                        type="password"
                        variant="outlined"
                        prepend-inner-icon="mdi-lock"
                        :rules="[v => !!v || 'Current password is required']"
                        class="mb-3"
                      ></v-text-field>

                      <v-text-field
                        v-model="passwordForm.newPassword"
                        label="New Password"
                        type="password"
                        variant="outlined"
                        prepend-inner-icon="mdi-lock-reset"
                        :rules="[
                          v => !!v || 'New password is required',
                          v => v.length >= 6 || 'Password must be at least 6 characters'
                        ]"
                        class="mb-3"
                      ></v-text-field>

                      <v-text-field
                        v-model="passwordForm.confirmPassword"
                        label="Confirm New Password"
                        type="password"
                        variant="outlined"
                        prepend-inner-icon="mdi-lock-check"
                        :rules="[
                          v => !!v || 'Please confirm your password',
                          v => v === passwordForm.newPassword || 'Passwords do not match'
                        ]"
                        class="mb-4"
                      ></v-text-field>

                      <v-btn
                        type="submit"
                        color="primary"
                        size="large"
                        block
                        :loading="changingPassword"
                      >
                        <v-icon class="mr-2">mdi-content-save</v-icon>
                        Update Password
                      </v-btn>
                    </v-form>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-window-item>
            </v-window>
          </main>
        </div>

        <!-- Footer -->
        <div class="dashboard-footer">
          <span>Admin Control Center</span>
          <span>Secure RBAC Enabled</span>
        </div>
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

    <!-- Toast Notification -->
    <v-snackbar
      v-model="toast.show"
      :color="toast.color"
      timeout="3000"
    >
      {{ toast.message }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, inject, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@/store/auth';
import { useSocket } from '../store/socket';
import type { Services } from '../services';
import { NEW_ROOM_AVAILABLE_EVENT } from '../../../src/sockets/consts/sockets.const';
import { storeToRefs } from 'pinia';

// Store
const auth = useAuth();
const { user } = storeToRefs(auth);
const router = useRouter();
const socket = useSocket();
const { client } = socket;

// State
const showLogoutDialog = ref(false);
const toast = ref<{ show: boolean; message: string; color: string }>({
  show: false,
  message: '',
  color: 'info',
});

// Services
const services = inject<Services>('services');

// Data
const activeTab = ref('rooms');
const rooms = ref<any[]>([]);
const users = ref<any[]>([]);
const newRoom = ref({ name: '' });
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
const editForm = ref<{ role: 'user' | 'admin'; houseFee: number }>({
  role: 'user',
  houseFee: 0,
});

// Pagination
const usersPage = ref(1);
const usersPerPage = ref(10);
const roomsPage = ref(1);
const roomsPerPage = ref(10);

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
  }
}

async function loadUsers() {
  try {
    const response = await services?.userService.getAll();
    users.value = (response?.data || []).map((u: any) => ({
      ...u,
      houseFee: Number(u.houseFee || 0),
    }));
  } catch (error) {
    console.error('Error loading users:', error);
  }
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
  try {
    await services?.roomService.removeManager(userId, selectedRoomForManager.value);
    await loadRooms();
  } catch (error) {
    showToast('Error removing manager: ' + getErrorMessage(error), 'error');
  }
}

function startEditUser(u: any) {
  editingUserId.value = u.id;
  editForm.value = {
    role: u.role || 'user',
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
  } catch (error) {
    showToast('Error updating user: ' + getErrorMessage(error), 'error');
  }
}

async function createRoom() {
  try {
    await services?.roomService.create(newRoom.value.name);
    newRoom.value.name = '';
    await loadRooms();
  } catch (error) {
    showToast('Error creating room: ' + getErrorMessage(error), 'error');
  }
}

async function cleanupInvalidManagers() {
  if (confirm('This will remove all invalid manager assignments (deleted users). Continue?')) {
    try {
      const response = await services?.roomService.cleanupInvalidManagers();
      showToast(response?.data?.message || 'Cleanup completed', 'success');
      await loadRooms();
    } catch (error) {
      showToast('Error cleaning up invalid managers: ' + getErrorMessage(error), 'error');
    }
  }
}

async function deleteRoom(roomId: number) {
  if (confirm('Are you sure you want to delete this room?')) {
    try {
      await services?.roomService.delete(roomId);
      await loadRooms();
    } catch (error) {
      showToast('Error deleting room: ' + getErrorMessage(error), 'error');
    }
  }
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

async function registerUser() {
  try {
    await services?.authService.register(newUser.value.username, newUser.value.password);
    
    // If role is admin, update the user role
    if (newUser.value.role === 'admin') {
      // Get the newly created user and make them admin
      const allUsers = await services?.userService.getAll();
      const newlyCreated = allUsers?.data?.find((u: any) => u.username === newUser.value.username);
      if (newlyCreated) {
        await services?.userService.updateRole(newlyCreated.id, 'admin');
      }
    }
    
    showToast(`User "${newUser.value.username}" registered successfully!`, 'success');
    newUser.value = { username: '', password: '', role: 'user' };
    await loadUsers();
  } catch (error) {
    showToast('Error registering user: ' + getErrorMessage(error), 'error');
  }
}

async function makeAdmin(userId: number) {
  if (confirm('Make this user an admin?')) {
    try {
      await services?.userService.updateRole(userId, 'admin');
      await loadUsers();
    } catch (error) {
      showToast('Error updating user: ' + getErrorMessage(error), 'error');
    }
  }
}

async function removeAdmin(userId: number) {
  if (confirm('Remove admin privileges from this user?')) {
    try {
      await services?.userService.updateRole(userId, 'user');
      await loadUsers();
    } catch (error) {
      showToast('Error updating user: ' + getErrorMessage(error), 'error');
    }
  }
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

async function deleteUser(userId: number) {
  if (confirm('Are you sure you want to delete this user?')) {
    try {
      await services?.userService.delete(userId);
      await loadUsers();
    } catch (error) {
      showToast('Error deleting user: ' + getErrorMessage(error), 'error');
    }
  }
}

// Socket events
onMounted(() => {
  if (String(user.value?.role || '').toLowerCase() !== 'admin') {
    router.push({ name: 'home' });
    return;
  }

  loadRooms();
  loadUsers();
  
  client?.on(NEW_ROOM_AVAILABLE_EVENT, async () => {
    await loadRooms();
  });
});

onBeforeUnmount(() => {
  client?.off(NEW_ROOM_AVAILABLE_EVENT);
});
</script>

<style scoped lang="scss">
.admin-dashboard-layout {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.dashboard-shell {
  border-radius: 16px !important;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.08) !important;
  backdrop-filter: blur(8px);
}

.top-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  padding: 20px;
  background: linear-gradient(135deg, rgba(80, 90, 200, 0.7) 0%, rgba(118, 75, 162, 0.7) 100%);

  h1 {
    color: white;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  }

  .header-stats {
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
  }
}

.dashboard-body {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 16px;
  padding: 16px;
}

.left-sidebar {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 16px;
  height: fit-content;
}

.sidebar-title {
  font-weight: bold;
  color: #5c4bb0;
  margin-bottom: 12px;
}

.sidebar-btn {
  justify-content: flex-start;
  color: #444 !important;
  border-radius: 10px !important;
}

.sidebar-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  color: white !important;
}

.main-content {
  min-width: 0;
}

.stat-card {
  min-width: 150px;
  background: rgba(255, 255, 255, 0.95) !important;
  border-radius: 12px !important;

  .stat-number {
    font-size: 2.5rem;
    font-weight: bold;
    color: #667eea;
  }

  .stat-label {
    font-size: 0.9rem;
    color: #666;
    margin-top: 8px;
  }
}

.v-tabs {
  background: rgba(255, 255, 255, 0.95) !important;
  border-radius: 12px !important;
  padding: 0 20px;
}

.dashboard-footer {
  display: flex;
  justify-content: space-between;
  padding: 12px 18px;
  color: white;
  font-size: 0.85rem;
  background: rgba(0, 0, 0, 0.18);
}

.card-title {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: bold;
  font-size: 1.2rem;
  padding: 16px !important;
}

.rooms-card,
.users-card,
.privileges-card,
.register-card,
.register-info-card,
.create-room-card {
  border-radius: 12px !important;
  background: white !important;
}

.room-card {
  border-radius: 12px !important;
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2) !important;
  }

  .room-card-title {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    font-weight: bold;
  }

  .room-info-item {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
    color: #666;
  }
}

.privilege-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  font-size: 1rem;
  color: #333;

  ul {
    margin: 0;
    padding-left: 20px;

    li {
      margin-bottom: 6px;
    }
  }
}

.guideline-item {
  color: #333;

  ul {
    margin: 0;
    padding-left: 20px;

    li {
      margin-bottom: 6px;
    }
  }
}

@media (max-width: 768px) {
  .top-header {
    flex-direction: column;
    align-items: flex-start;

    .header-stats {
      width: 100%;
    }
  }

  .dashboard-body {
    grid-template-columns: 1fr;
  }

  .dashboard-footer {
    flex-direction: column;
    gap: 4px;
  }
}
</style>
