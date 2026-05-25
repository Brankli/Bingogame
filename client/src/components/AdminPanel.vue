<template>
  <v-container>
    <v-card class="admin-panel">
      <v-card-title class="admin-title">
        <v-icon class="mr-2">mdi-shield-account</v-icon>
        Admin Panel
      </v-card-title>

      <v-tabs v-model="tab">
        <v-tab value="users">Users</v-tab>
        <v-tab value="rooms">Room Assignments</v-tab>
      </v-tabs>

      <v-card-text>
        <v-window v-model="tab">
          <!-- Users Tab -->
          <v-window-item value="users">
            <v-row class="mb-4">
              <v-col cols="12">
                <v-btn color="primary" @click="showCreateUser = true">
                  <v-icon>mdi-account-plus</v-icon>
                  Create User
                </v-btn>
              </v-col>
            </v-row>

            <v-table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in users" :key="user.id">
                  <td>{{ user.id }}</td>
                  <td>{{ user.username }}</td>
                  <td>
                    <v-chip :color="user.role === 'admin' ? 'error' : 'primary'" size="small">
                      {{ user.role }}
                    </v-chip>
                  </td>
                  <td>
                    <v-btn size="small" color="error" @click="deleteUser(user.id)" v-if="user.id !== currentUser?.id">
                      <v-icon>mdi-delete</v-icon>
                    </v-btn>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-window-item>

          <!-- Room Assignments Tab -->
          <v-window-item value="rooms">
            <v-row>
              <v-col cols="12" md="6">
                <v-select
                  v-model="selectedUser"
                  :items="users"
                  item-title="username"
                  item-value="id"
                  label="Select User"
                  variant="outlined"
                ></v-select>
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="selectedRoom"
                  :items="rooms"
                  item-title="name"
                  item-value="id"
                  label="Select Room"
                  variant="outlined"
                ></v-select>
              </v-col>
              <v-col cols="12">
                <v-btn color="success" @click="assignManager" :disabled="!selectedUser || !selectedRoom">
                  <v-icon>mdi-link</v-icon>
                  Assign Room Manager
                </v-btn>
              </v-col>
            </v-row>

            <v-divider class="my-4"></v-divider>

            <h3 class="mb-4">Current Assignments</h3>
            <v-table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Room</th>
                  <th>Assigned At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="assignment in assignments" :key="`${assignment.userId}-${assignment.roomId}`">
                  <td>{{ getUserName(assignment.userId) }}</td>
                  <td>{{ getRoomName(assignment.roomId) }}</td>
                  <td>{{ formatDate(assignment.assignedAt) }}</td>
                  <td>
                    <v-btn size="small" color="error" @click="removeManager(assignment.userId, assignment.roomId)">
                      <v-icon>mdi-link-off</v-icon>
                    </v-btn>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>

    <!-- Create User Dialog -->
    <v-dialog v-model="showCreateUser" max-width="500">
      <v-card>
        <v-card-title>Create New User</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="newUser.username"
            label="Username"
            variant="outlined"
            class="mb-2"
          ></v-text-field>
          <v-text-field
            v-model="newUser.password"
            label="Password"
            type="password"
            variant="outlined"
            class="mb-2"
          ></v-text-field>
          <v-select
            v-model="newUser.role"
            :items="['user', 'admin']"
            label="Role"
            variant="outlined"
          ></v-select>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="showCreateUser = false">Cancel</v-btn>
          <v-btn color="primary" @click="createUser">Create</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Confirmation Dialog -->
    <v-dialog v-model="confirmDialog.show" max-width="450" persistent>
      <v-card>
        <v-card-title class="text-h5">
          <v-icon class="mr-2" :color="confirmDialog.confirmColor">mdi-alert-circle-outline</v-icon>
          {{ confirmDialog.title }}
        </v-card-title>
        <v-card-text>{{ confirmDialog.message }}</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="grey" variant="text" @click="cancelConfirm">Cancel</v-btn>
          <v-btn :color="confirmDialog.confirmColor" variant="elevated" @click="executeConfirm">
            {{ confirmDialog.confirmLabel }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Toast Notification -->
    <v-snackbar v-model="toast.show" :color="toast.color" timeout="3000">
      {{ toast.message }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, inject } from 'vue';
import type { Services } from '../services';
import { useAuth } from '../store/auth';
import { useConfirmDialog } from '../composables/useConfirmDialog';

const services = inject<Services>('services');
const auth = useAuth();
const { user: currentUser } = auth;

const tab = ref('users');
const users = ref<any[]>([]);
const rooms = ref<any[]>([]);
const assignments = ref<any[]>([]);
const selectedUser = ref<number | null>(null);
const selectedRoom = ref<number | null>(null);
const showCreateUser = ref(false);
const newUser = ref({
  username: '',
  password: '',
  role: 'user',
});

const toast = ref<{ show: boolean; message: string; color: string }>({
  show: false,
  message: '',
  color: 'info',
});

const { confirmDialog, openConfirm, cancelConfirm, executeConfirm } = useConfirmDialog();

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

const loadUsers = async () => {
  const response = await services?.userService.findAll();
  users.value = response?.data || [];
};

const loadRooms = async () => {
  const response = await services?.roomService.findAll();
  rooms.value = response?.data || [];
};

const loadAssignments = async () => {
  // Load all rooms with their managers
  const response = await services?.roomService.findAll();
  const allRooms = response?.data || [];
  
  const allAssignments: any[] = [];
  allRooms.forEach((room: any) => {
    if (room.managers) {
      room.managers.forEach((manager: any) => {
        allAssignments.push({
          userId: manager.user.id,
          roomId: room.id,
          assignedAt: manager.assignedAt,
        });
      });
    }
  });
  
  assignments.value = allAssignments;
};

const createUser = async () => {
  try {
    await services?.authService.register(
      newUser.value.username,
      newUser.value.password,
    );
    showCreateUser.value = false;
    newUser.value = { username: '', password: '', role: 'user' };
    await loadUsers();
    showToast('User created successfully!', 'success');
  } catch (error) {
    console.error('Error creating user:', error);
    showToast('Failed to create user: ' + getErrorMessage(error), 'error');
  }
};

const deleteUser = (userId: number) => {
  const targetUser = users.value.find((u) => u.id === userId);
  openConfirm({
    title: 'Delete User',
    message: `Are you sure you want to delete "${targetUser?.username ?? 'this user'}"?`,
    confirmLabel: 'Delete',
    confirmColor: 'error',
    onConfirm: async () => {
      try {
        await services?.userService.remove(userId);
        await loadUsers();
        showToast('User deleted successfully!', 'success');
      } catch (error) {
        console.error('Error deleting user:', error);
        showToast('Failed to delete user: ' + getErrorMessage(error), 'error');
      }
    },
  });
};

const assignManager = async () => {
  if (!selectedUser.value || !selectedRoom.value) return;

  try {
    await services?.roomService.assignManager(selectedUser.value, selectedRoom.value);
    selectedUser.value = null;
    selectedRoom.value = null;
    await loadAssignments();
    showToast('Manager assigned successfully!', 'success');
  } catch (error) {
    console.error('Error assigning manager:', error);
    showToast('Failed to assign manager: ' + getErrorMessage(error), 'error');
  }
};

const removeManager = (userId: number, roomId: number) => {
  openConfirm({
    title: 'Remove Manager',
    message: 'Are you sure you want to remove this assignment?',
    confirmLabel: 'Remove',
    confirmColor: 'warning',
    onConfirm: async () => {
      try {
        await services?.roomService.removeManager(userId, roomId);
        await loadAssignments();
        showToast('Manager removed successfully!', 'success');
      } catch (error) {
        console.error('Error removing manager:', error);
        showToast('Failed to remove manager: ' + getErrorMessage(error), 'error');
      }
    },
  });
};

const getUserName = (userId: number) => {
  const user = users.value.find((u) => u.id === userId);
  return user?.username || 'Unknown';
};

const getRoomName = (roomId: number) => {
  const room = rooms.value.find((r) => r.id === roomId);
  return room?.name || 'Unknown';
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleString();
};

onMounted(async () => {
  await loadUsers();
  await loadRooms();
  await loadAssignments();
});
</script>

<style scoped lang="scss">
.admin-panel {
  margin: 20px auto;
  max-width: 1200px;
}

.admin-title {
  background: linear-gradient(135deg, #d32f2f 0%, #c62828 100%);
  color: white;
  font-weight: bold;
}
</style>
