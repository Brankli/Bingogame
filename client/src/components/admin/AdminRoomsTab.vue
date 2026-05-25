<template>
<!-- Available Rooms Section -->
          <v-card class="modern-rooms-card mb-6" elevation="0">
            <v-card-title class="modern-card-header d-flex align-center justify-space-between">
              <div class="d-flex align-center">
                <v-avatar color="primary" size="48" class="mr-3">
                  <v-icon color="white" size="24">mdi-door-open</v-icon>
                </v-avatar>
                <div>
                  <h3 class="text-h6 font-weight-bold mb-0">Available Rooms</h3>
                  <p class="text-caption text-grey mb-0">{{ rooms.length }} rooms total</p>
                </div>
              </div>
              <v-chip color="primary" variant="flat" size="small">
                <v-icon size="small" class="mr-1">mdi-circle-medium</v-icon>
                {{ rooms.length }} Active
              </v-chip>
            </v-card-title>
            <v-card-text class="pa-6">
              <v-row v-if="rooms.length > 0">
                <v-col 
                  v-for="room in paginatedRooms" 
                  :key="room.id"
                  cols="12"
                  sm="6"
                  lg="4"
                  xl="3"
                >
                  <v-card class="modern-room-card" elevation="0" hover>
                    <v-card-text class="pa-4">
                      <div class="d-flex align-center justify-space-between mb-3">
                        <div class="d-flex align-center">
                          <v-avatar color="primary" size="36" class="mr-2">
                            <v-icon color="white" size="20">mdi-door</v-icon>
                          </v-avatar>
                          <h4 class="text-subtitle-1 font-weight-bold">{{ room.name }}</h4>
                        </div>
                        <div class="d-flex flex-column align-end gap-1">
                          <v-chip size="x-small" color="success" variant="flat">
                            ACTIVE
                          </v-chip>
                          <v-chip
                            size="x-small"
                            :color="room.cardMode === 'static' ? 'indigo' : 'teal'"
                            variant="tonal"
                          >
                            {{ room.cardMode === 'static' ? 'STATIC' : 'AUTO' }} CARDS
                          </v-chip>
                        </div>
                      </div>

                      <v-divider class="my-3"></v-divider>

                      <div class="room-stats mb-3">
                        <div class="stat-row">
                          <v-chip size="small" variant="tonal" color="primary" class="stat-chip">
                            <v-icon size="small" class="mr-1">mdi-account-multiple</v-icon>
                            {{ room.currentUsers?.length || 0 }} Players
                          </v-chip>
                        </div>
                        <div class="stat-row mt-2">
                          <div class="text-caption text-grey">Owner:</div>
                          <v-chip size="x-small" variant="outlined" color="info">
                            <v-icon size="x-small" class="mr-1">mdi-account</v-icon>
                            {{ room.owner?.username }}
                          </v-chip>
                        </div>
                        <div class="stat-row mt-2">
                          <div class="text-caption text-grey">Created:</div>
                          <span class="text-caption">{{ formatDate(room.createdAt) }}</span>
                        </div>
                      </div>

                      <div v-if="room.managers?.length" class="mb-3">
                        <div class="text-caption text-grey mb-1">Managers:</div>
                        <div class="d-flex flex-wrap gap-1">
                          <v-chip
                            v-for="manager in room.managers.filter(m => m.user)"
                            :key="manager.id"
                            size="x-small"
                            color="indigo"
                            variant="flat"
                          >
                            <v-icon size="x-small" class="mr-1">mdi-account-tie</v-icon>
                            {{ manager.user.username }}
                          </v-chip>
                        </div>
                      </div>

                      <v-divider class="my-3"></v-divider>

                      <v-btn 
                        color="primary" 
                        variant="flat" 
                        size="small"
                        block
                        @click="joinRoom(room.id)"
                        class="mb-2"
                      >
                        <v-icon size="small" class="mr-1">mdi-login-variant</v-icon>
                        Enter Room
                      </v-btn>
                      
                      <v-btn 
                        color="error" 
                        variant="outlined" 
                        size="small"
                        block
                        @click="deleteRoom(room.id)"
                      >
                        <v-icon size="small" class="mr-1">mdi-delete</v-icon>
                        Delete Room
                      </v-btn>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>

              <!-- Rooms Pagination -->
              <v-pagination
                v-if="totalRoomsPages > 1"
                v-model="roomsPage"
                :length="totalRoomsPages"
                :total-visible="7"
                class="mt-6"
                rounded="circle"
              ></v-pagination>

              <div v-else-if="rooms.length === 0" class="empty-rooms-state">
                <v-avatar color="grey-lighten-3" size="100" class="mb-4">
                  <v-icon size="50" color="grey-lighten-1">mdi-door-open-outline</v-icon>
                </v-avatar>
                <h4 class="text-h6 font-weight-bold mb-2">No Rooms Available</h4>
                <p class="text-body-2 text-grey mb-4">Create your first room to get started!</p>
                <v-btn color="success" variant="elevated" @click="activeTab = 'rooms'">
                  <v-icon class="mr-2">mdi-plus</v-icon>
                  Create Room
                </v-btn>
              </div>
            </v-card-text>
          </v-card>

          <v-row>
            <!-- Assign Room Manager -->
            <v-col cols="12" lg="6">
              <v-card class="modern-action-card" elevation="0">
                <v-card-title class="modern-card-header">
                  <div class="d-flex align-center">
                    <v-avatar color="indigo" size="48" class="mr-3">
                      <v-icon color="white" size="24">mdi-account-tie</v-icon>
                    </v-avatar>
                    <div>
                      <h3 class="text-h6 font-weight-bold mb-0">Assign Manager</h3>
                      <p class="text-caption text-grey mb-0">Assign a user to manage a room</p>
                    </div>
                  </div>
                </v-card-title>
                <v-card-text class="pa-6">
                  <v-alert 
                    v-if="rooms.some(r => r.managers?.some(m => !m.user))" 
                    type="warning" 
                    variant="tonal" 
                    density="compact"
                    class="mb-4"
                  >
                    <div class="d-flex align-center justify-space-between">
                      <span class="text-caption">Invalid manager assignments found</span>
                      <v-btn
                        color="error"
                        size="x-small"
                        variant="elevated"
                        @click="cleanupInvalidManagers"
                      >
                        <v-icon size="x-small" class="mr-1">mdi-broom</v-icon>
                        Clean Up
                      </v-btn>
                    </div>
                  </v-alert>

                  <form @submit.prevent="handleAssignManager">
                    <v-row>
                      <v-col cols="12" md="6">
                        <v-select
                          v-model="selectedRoomForManager"
                          :items="rooms"
                          item-title="name"
                          item-value="id"
                          label="Select Room"
                          variant="outlined"
                          density="comfortable"
                        >
                          <template v-slot:prepend-inner>
                            <v-icon color="primary">mdi-door</v-icon>
                          </template>
                        </v-select>
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-select
                          v-model="selectedUserForManager"
                          :items="managerCandidates"
                          item-title="username"
                          item-value="id"
                          label="Select User"
                          variant="outlined"
                          density="comfortable"
                        >
                          <template v-slot:prepend-inner>
                            <v-icon color="primary">mdi-account</v-icon>
                          </template>
                        </v-select>
                      </v-col>
                    </v-row>

                    <v-btn
                      type="submit"
                      color="indigo"
                      size="large"
                      block
                      :disabled="!selectedRoomForManager || !selectedUserForManager"
                      :loading="assigningManager"
                      class="mb-4"
                    >
                      <v-icon class="mr-2">mdi-link-variant</v-icon>
                      Assign Manager
                    </v-btn>
                  </form>

                  <div v-if="selectedRoomManagers.length">
                    <v-divider class="mb-4"></v-divider>
                    <div class="d-flex align-center justify-space-between mb-3">
                      <div class="text-subtitle-2 font-weight-bold">Current Managers</div>
                      <v-chip size="x-small" color="indigo" variant="flat">
                        {{ selectedRoomManagers.length }}
                      </v-chip>
                    </div>
                    <div class="managers-grid">
                      <v-chip
                        v-for="manager in selectedRoomManagers"
                        :key="manager.id"
                        color="indigo"
                        variant="flat"
                        closable
                        @click:close="removeManagerFromRoom(manager.user?.id)"
                      >
                        <v-icon size="small" class="mr-1">mdi-account-tie</v-icon>
                        {{ manager.user?.username }}
                      </v-chip>
                    </div>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>

            <!-- Create New Room -->
            <v-col cols="12" lg="6">
              <v-card class="modern-action-card" elevation="0">
                <v-card-title class="modern-card-header">
                  <div class="d-flex align-center">
                    <v-avatar color="success" size="48" class="mr-3">
                      <v-icon color="white" size="24">mdi-plus-circle</v-icon>
                    </v-avatar>
                    <div>
                      <h3 class="text-h6 font-weight-bold mb-0">Create New Room</h3>
                      <p class="text-caption text-grey mb-0">Add a new game room</p>
                    </div>
                  </div>
                </v-card-title>
                <v-card-text class="pa-6">
                  <v-form
                    :key="createRoomFormKey"
                    ref="createRoomFormRef"
                    @submit.prevent="handleCreateRoom"
                  >
                    <v-text-field
                      v-model="newRoom.name"
                      label="Room Name"
                      placeholder="Enter room name..."
                      variant="outlined"
                      density="comfortable"
                      required
                      maxlength="20"
                      counter="20"
                      class="mb-2"
                      validate-on="blur"
                      :rules="roomNameRules"
                    >
                      <template v-slot:prepend-inner>
                        <v-icon color="primary">mdi-door-open</v-icon>
                      </template>
                    </v-text-field>
                    
                    <div class="text-subtitle-2 font-weight-bold mb-2">Card deck type</div>
                    <v-radio-group v-model="newRoom.cardMode" class="mb-2" hide-details>
                      <v-card
                        class="mb-2 pa-0"
                        variant="outlined"
                        :class="{ 'border-primary': newRoom.cardMode === 'static' }"
                        @click="newRoom.cardMode = 'static'"
                      >
                        <v-card-text class="d-flex align-center pa-3">
                          <v-radio value="static" class="mr-2" />
                          <div>
                            <div class="font-weight-bold">Static (shared)</div>
                            <div class="text-caption text-grey">
                              Same 400 patterns as other static rooms — master deck must exist
                            </div>
                          </div>
                        </v-card-text>
                      </v-card>
                      <v-card
                        variant="outlined"
                        :class="{ 'border-primary': newRoom.cardMode === 'automatic' }"
                        @click="newRoom.cardMode = 'automatic'"
                      >
                        <v-card-text class="d-flex align-center pa-3">
                          <v-radio value="automatic" class="mr-2" />
                          <div>
                            <div class="font-weight-bold">Automatic (unique)</div>
                            <div class="text-caption text-grey">
                              New random cards generated only for this room
                            </div>
                          </div>
                        </v-card-text>
                      </v-card>
                    </v-radio-group>

                    <v-alert
                      v-if="newRoom.cardMode === 'static'"
                      :type="staticLibraryStatus?.complete ? 'success' : 'warning'"
                      variant="tonal"
                      density="compact"
                      class="mb-4"
                    >
                      <span class="text-caption">
                        Static library: {{ staticLibraryStatus?.total ?? 0 }}/400
                        — {{ staticLibraryStatus?.complete ? 'ready' : 'generate in Card Management first' }}
                      </span>
                    </v-alert>
                    <v-alert
                      v-else
                      type="info"
                      variant="tonal"
                      density="compact"
                      class="mb-4"
                    >
                      <span class="text-caption">400 unique cards will be generated for this room</span>
                    </v-alert>

                    <v-btn 
                      type="submit"
                      color="success" 
                      size="large"
                      block
                      elevation="2"
                      :loading="creatingRoom"
                    >
                      <v-icon class="mr-2">mdi-plus-circle</v-icon>
                      Create Room
                    </v-btn>
                  </v-form>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
</template>


<script setup lang="ts">
import { ref } from 'vue';
import { useAdminDashboard } from '../../composables/useAdminDashboard';

const {
  activeTab,
  assignManagerToRoom,
  cleanupInvalidManagers,
  createRoom,
  deleteRoom,
  formatDate,
  joinRoom,
  managerCandidates,
  newRoom,
  paginatedRooms,
  staticLibraryStatus,
  removeManagerFromRoom,
  rooms,
  roomsPage,
  selectedRoomForManager,
  selectedRoomManagers,
  selectedUserForManager,
  totalRoomsPages,
} = useAdminDashboard();

const createRoomFormRef = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(null);
const createRoomFormKey = ref(0);
const creatingRoom = ref(false);
const assigningManager = ref(false);

const roomNameRules = [
  (v: string) => !!v?.trim() || 'Room name is required',
  (v: string) => (v?.trim().length ?? 0) <= 20 || 'Maximum 20 characters',
];

async function handleCreateRoom() {
  const form = createRoomFormRef.value;
  if (!form) return;

  const { valid } = await form.validate();
  if (!valid) return;

  creatingRoom.value = true;
  try {
    const success = await createRoom();
    if (success) {
      createRoomFormKey.value += 1;
    }
  } finally {
    creatingRoom.value = false;
  }
}

async function handleAssignManager() {
  if (!selectedRoomForManager.value || !selectedUserForManager.value) return;

  assigningManager.value = true;
  try {
    await assignManagerToRoom();
  } finally {
    assigningManager.value = false;
  }
}
</script>
