<template>
  <div class="modern-admin-layout">
    <!-- Top Navigation Bar -->
    <v-app-bar color="white" elevation="1" class="top-bar">
      <v-app-bar-nav-icon @click="drawer = !drawer" class="menu-icon"></v-app-bar-nav-icon>
      
      <v-toolbar-title class="app-title">
        <v-icon color="primary" class="mr-2">mdi-view-dashboard</v-icon>
        <span class="text-h6 font-weight-bold">Bingo Admin</span>
      </v-toolbar-title>

      <v-spacer></v-spacer>

      <v-btn icon class="mr-2">
        <v-icon>mdi-bell-outline</v-icon>
      </v-btn>

      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn v-bind="props" class="user-menu-btn">
            <v-avatar color="primary" size="32" class="mr-2">
              <v-icon size="small">mdi-account</v-icon>
            </v-avatar>
            <div class="user-info">
              <div class="user-name">{{ user?.username }}</div>
              <div class="user-role">Admin</div>
            </div>
            <v-icon class="ml-2">mdi-chevron-down</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item @click="activeTab = 'profile'">
            <template v-slot:prepend>
              <v-icon>mdi-account-cog</v-icon>
            </template>
            <v-list-item-title>My Profile</v-list-item-title>
          </v-list-item>
          <v-list-item @click="confirmLogout">
            <template v-slot:prepend>
              <v-icon>mdi-logout</v-icon>
            </template>
            <v-list-item-title>Logout</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <!-- Sidebar Navigation -->
    <v-navigation-drawer
      v-model="drawer"
      :rail="rail"
      permanent
      class="modern-sidebar"
      color="#1a1d2e"
    >
      <div class="sidebar-header">
        <v-icon color="white" size="large">mdi-apps</v-icon>
        <div v-if="!rail" class="ml-3">
          <div class="sidebar-title">Admin Panel</div>
          <div class="sidebar-subtitle">Management System</div>
        </div>
      </div>

      <v-divider class="my-4" color="rgba(255,255,255,0.1)"></v-divider>

      <div class="sidebar-section-title" v-if="!rail">MAIN</div>
      
      <v-list density="compact" nav class="sidebar-menu">
        <v-list-item
          :class="{ 'active-menu-item': activeTab === 'dashboard' }"
          @click="activeTab = 'dashboard'"
          class="menu-item"
        >
          <template v-slot:prepend>
            <v-icon>mdi-view-dashboard</v-icon>
          </template>
          <v-list-item-title>Dashboard</v-list-item-title>
        </v-list-item>

        <v-list-item
          :class="{ 'active-menu-item': activeTab === 'rooms' }"
          @click="activeTab = 'rooms'"
          class="menu-item"
        >
          <template v-slot:prepend>
            <v-icon>mdi-door-open</v-icon>
          </template>
          <v-list-item-title>Rooms</v-list-item-title>
        </v-list-item>

        <v-list-item
          :class="{ 'active-menu-item': activeTab === 'users' }"
          @click="activeTab = 'users'"
          class="menu-item"
        >
          <template v-slot:prepend>
            <v-icon>mdi-account-multiple</v-icon>
          </template>
          <v-list-item-title>Users</v-list-item-title>
        </v-list-item>

        <v-list-item
          :class="{ 'active-menu-item': activeTab === 'register' }"
          @click="activeTab = 'register'"
          class="menu-item"
        >
          <template v-slot:prepend>
            <v-icon>mdi-account-plus</v-icon>
          </template>
          <v-list-item-title>Register User</v-list-item-title>
        </v-list-item>

        <v-list-item
          :class="{ 'active-menu-item': activeTab === 'cards' }"
          @click="activeTab = 'cards'"
          class="menu-item"
        >
          <template v-slot:prepend>
            <v-icon>mdi-cards</v-icon>
          </template>
          <v-list-item-title>Card Management</v-list-item-title>
        </v-list-item>
      </v-list>

      <template v-slot:append>
        <div class="pa-2">
          <v-btn
            icon
            @click.stop="rail = !rail"
            class="toggle-btn"
          >
            <v-icon>{{ rail ? 'mdi-chevron-right' : 'mdi-chevron-left' }}</v-icon>
          </v-btn>
        </div>
      </template>
    </v-navigation-drawer>

    <!-- Main Content -->
    <v-main class="main-content">
      <v-container fluid class="pa-6">
        <v-window v-model="activeTab">
          <!-- Dashboard Tab -->
          <v-window-item value="dashboard">
            <div class="page-header mb-6">
              <div>
                <h1 class="text-h4 font-weight-bold mb-1">Dashboard</h1>
                <p class="text-body-2 text-grey">Welcome back, {{ user?.username }}! Here's what's happening today.</p>
              </div>
              <div class="text-right">
                <div class="text-caption text-grey">{{ currentDate }}</div>
                <div class="text-h6 font-weight-bold">{{ currentTime }}</div>
              </div>
            </div>

            <!-- Metric Cards -->
            <v-row class="mb-6">
              <v-col cols="12" sm="6" md="3">
                <v-card class="metric-card blue-card" elevation="0">
                  <v-card-text>
                    <div class="metric-icon">
                      <v-icon size="32" color="white">mdi-door-open</v-icon>
                    </div>
                    <div class="metric-value">{{ rooms.length }}</div>
                    <div class="metric-label">Active Rooms</div>
                    <div class="metric-trend">
                      <v-icon size="small">mdi-arrow-up</v-icon>
                      <span>All rooms</span>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>

              <v-col cols="12" sm="6" md="3">
                <v-card class="metric-card orange-card" elevation="0">
                  <v-card-text>
                    <div class="metric-icon">
                      <v-icon size="32" color="white">mdi-account-multiple</v-icon>
                    </div>
                    <div class="metric-value">{{ totalUsers }}</div>
                    <div class="metric-label">Total Users</div>
                    <div class="metric-trend">
                      <v-icon size="small">mdi-account</v-icon>
                      <span>Registered</span>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>

              <v-col cols="12" sm="6" md="3">
                <v-card class="metric-card green-card" elevation="0">
                  <v-card-text>
                    <div class="metric-icon">
                      <v-icon size="32" color="white">mdi-shield-crown</v-icon>
                    </div>
                    <div class="metric-value">{{ adminCount }}</div>
                    <div class="metric-label">Admins</div>
                    <div class="metric-trend">
                      <v-icon size="small">mdi-shield</v-icon>
                      <span>Active</span>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>

              <v-col cols="12" sm="6" md="3">
                <v-card class="metric-card purple-card" elevation="0">
                  <v-card-text>
                    <div class="metric-icon">
                      <v-icon size="32" color="white">mdi-currency-usd</v-icon>
                    </div>
                    <div class="metric-value">{{ formatFee(totalUserEarnings) }}</div>
                    <div class="metric-label">Total Earnings</div>
                    <div class="metric-trend">
                      <v-icon size="small">mdi-trending-up</v-icon>
                      <span>Birr</span>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <!-- Quick Actions -->
            <v-row>
              <v-col cols="12" md="8">
                <v-card elevation="0" class="content-card">
                  <v-card-title class="d-flex align-center justify-space-between">
                    <span class="text-h6 font-weight-bold">Recent Activity</span>
                    <v-btn size="small" variant="text" color="primary">View All</v-btn>
                  </v-card-title>
                  <v-card-text>
                    <v-list>
                      <v-list-item v-for="room in rooms.slice(0, 5)" :key="room.id">
                        <template v-slot:prepend>
                          <v-avatar color="primary" size="40">
                            <v-icon>mdi-door</v-icon>
                          </v-avatar>
                        </template>
                        <v-list-item-title>{{ room.name }}</v-list-item-title>
                        <v-list-item-subtitle>{{ room.currentUsers?.length || 0 }} players • Owner: {{ room.owner?.username }}</v-list-item-subtitle>
                        <template v-slot:append>
                          <v-btn size="small" color="primary" variant="text" @click="joinRoom(room.id)">
                            View
                          </v-btn>
                        </template>
                      </v-list-item>
                    </v-list>
                  </v-card-text>
                </v-card>
              </v-col>

              <v-col cols="12" md="4">
                <v-card elevation="0" class="content-card">
                  <v-card-title class="text-h6 font-weight-bold">Quick Actions</v-card-title>
                  <v-card-text>
                    <v-btn color="primary" block class="mb-2" @click="activeTab = 'rooms'">
                      <v-icon class="mr-2">mdi-door-open</v-icon>
                      Manage Rooms
                    </v-btn>
                    <v-btn color="success" block class="mb-2" @click="activeTab = 'register'">
                      <v-icon class="mr-2">mdi-account-plus</v-icon>
                      Add User
                    </v-btn>
                    <v-btn color="info" block @click="activeTab = 'cards'">
                      <v-icon class="mr-2">mdi-cards</v-icon>
                      Manage Cards
                    </v-btn>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-window-item>
        <!-- Rooms Tab -->
        <v-window-item value="rooms">
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
                        <v-chip size="x-small" color="success" variant="flat">
                          ACTIVE
                        </v-chip>
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

                  <form @submit.prevent="assignManagerToRoom">
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
                  <v-form @submit.prevent="createRoom">
                    <v-text-field
                      v-model="newRoom.name"
                      label="Room Name"
                      placeholder="Enter room name..."
                      variant="outlined"
                      density="comfortable"
                      prepend-inner-icon="mdi-door-open"
                      required
                      class="mb-2"
                    >
                      <template v-slot:prepend-inner>
                        <v-icon color="primary">mdi-door-open</v-icon>
                      </template>
                    </v-text-field>
                    
                    <v-alert type="info" variant="tonal" density="compact" class="mb-4">
                      <div class="d-flex align-center">
                        <v-icon size="small" class="mr-2">mdi-information</v-icon>
                        <span class="text-caption">400 cards will be auto-generated for this room</span>
                      </div>
                    </v-alert>

                    <v-btn 
                      type="submit"
                      color="success" 
                      size="large"
                      block
                      elevation="2"
                    >
                      <v-icon class="mr-2">mdi-plus-circle</v-icon>
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
          <v-row justify="center">
            <v-col cols="12" md="8" lg="6">
              <v-card class="modern-register-card" elevation="0">
                <v-card-text class="pa-6">
                  <div class="text-center mb-4">
                    <v-avatar color="primary" size="64" class="mb-3">
                      <v-icon size="32" color="white">mdi-account-plus</v-icon>
                    </v-avatar>
                    <h2 class="text-h5 font-weight-bold mb-1">Register New User</h2>
                    <p class="text-body-2 text-grey">Create a new account for the system</p>
                  </div>

                  <v-form @submit.prevent="registerUser">
                    <div class="form-section mb-4">
                      <h3 class="text-subtitle-1 font-weight-bold mb-3">
                        <v-icon class="mr-2" color="primary" size="small">mdi-account-circle</v-icon>
                        Account Information
                      </h3>
                      
                      <v-text-field
                        v-model="newUser.username"
                        label="Username"
                        variant="outlined"
                        prepend-inner-icon="mdi-account"
                        required
                        density="comfortable"
                        class="mb-3"
                        hint="Minimum 3 characters, alphanumeric"
                        persistent-hint
                        :rules="[
                          v => !!v || 'Username is required',
                          v => v.length >= 3 || 'Minimum 3 characters'
                        ]"
                      >
                        <template v-slot:append-inner>
                          <v-icon v-if="newUser.username.length >= 3" color="success" size="small">mdi-check-circle</v-icon>
                        </template>
                      </v-text-field>

                      <v-text-field
                        v-model="newUser.password"
                        type="password"
                        label="Password"
                        variant="outlined"
                        prepend-inner-icon="mdi-lock"
                        required
                        density="comfortable"
                        hint="Minimum 6 characters for security"
                        persistent-hint
                        :rules="[
                          v => !!v || 'Password is required',
                          v => v.length >= 6 || 'Minimum 6 characters'
                        ]"
                      >
                        <template v-slot:append-inner>
                          <v-icon v-if="newUser.password.length >= 6" color="success" size="small">mdi-check-circle</v-icon>
                        </template>
                      </v-text-field>
                    </div>

                    <div class="form-section mb-4">
                      <h3 class="text-subtitle-1 font-weight-bold mb-3">
                        <v-icon class="mr-2" color="primary" size="small">mdi-shield-account</v-icon>
                        User Role
                      </h3>

                      <v-radio-group v-model="newUser.role" class="role-selector">
                        <v-card
                          class="role-card mb-2"
                          :class="{ 'role-card-selected': newUser.role === 'user' }"
                          @click="newUser.role = 'user'"
                          elevation="0"
                          variant="outlined"
                        >
                          <v-card-text class="d-flex align-center pa-3">
                            <v-radio value="user" class="mr-2"></v-radio>
                            <v-avatar color="success" size="40" class="mr-3">
                              <v-icon color="white" size="small">mdi-account</v-icon>
                            </v-avatar>
                            <div class="flex-grow-1">
                              <h4 class="text-subtitle-2 font-weight-bold mb-0">User</h4>
                              <p class="text-caption text-grey mb-0">Can join rooms and play games</p>
                            </div>
                            <v-icon v-if="newUser.role === 'user'" color="success" size="small">mdi-check-circle</v-icon>
                          </v-card-text>
                        </v-card>

                        <v-card
                          class="role-card"
                          :class="{ 'role-card-selected': newUser.role === 'admin' }"
                          @click="newUser.role = 'admin'"
                          elevation="0"
                          variant="outlined"
                        >
                          <v-card-text class="d-flex align-center pa-3">
                            <v-radio value="admin" class="mr-2"></v-radio>
                            <v-avatar color="error" size="40" class="mr-3">
                              <v-icon color="white" size="small">mdi-shield-crown</v-icon>
                            </v-avatar>
                            <div class="flex-grow-1">
                              <h4 class="text-subtitle-2 font-weight-bold mb-0">Administrator</h4>
                              <p class="text-caption text-grey mb-0">Full system access and management</p>
                            </div>
                            <v-icon v-if="newUser.role === 'admin'" color="error" size="small">mdi-check-circle</v-icon>
                          </v-card-text>
                        </v-card>
                      </v-radio-group>
                    </div>

                    <v-btn 
                      type="submit"
                      color="primary" 
                      size="large"
                      block
                      elevation="2"
                      class="register-submit-btn"
                    >
                      <v-icon class="mr-2">mdi-account-plus</v-icon>
                      Create User Account
                    </v-btn>
                  </v-form>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-window-item>

        <!-- Card Management Tab -->
        <v-window-item value="cards">
          <!-- Compact Room Selector & Stats -->
          <v-row>
            <v-col cols="12" lg="8">
              <v-card class="modern-card-selector" elevation="0">
                <v-card-title class="modern-card-header">
                  <div class="d-flex align-center">
                    <v-avatar color="primary" size="48" class="mr-3">
                      <v-icon color="white" size="24">mdi-door-open</v-icon>
                    </v-avatar>
                    <div>
                      <h3 class="text-h6 font-weight-bold mb-0">Select Room</h3>
                      <p class="text-caption text-grey mb-0">Choose a room to manage cards</p>
                    </div>
                  </div>
                </v-card-title>
                <v-card-text class="pa-6">
                  <v-select
                    v-model="selectedRoomForCardView"
                    :items="rooms"
                    item-title="name"
                    item-value="id"
                    label="Choose a room to manage cards"
                    variant="outlined"
                    density="comfortable"
                    @update:model-value="loadRoomCards"
                  >
                    <template v-slot:prepend-inner>
                      <v-icon color="primary">mdi-door</v-icon>
                    </template>
                  </v-select>

                  <v-row v-if="selectedRoomForCardView" class="mt-2">
                    <v-col cols="6" sm="3">
                      <v-card variant="tonal" color="primary" class="compact-stat-card">
                        <v-card-text class="pa-3 text-center">
                          <v-icon color="primary" size="small" class="mb-1">mdi-door</v-icon>
                          <div class="text-caption text-grey">Room</div>
                          <div class="text-subtitle-2 font-weight-bold">{{ selectedRoomName }}</div>
                        </v-card-text>
                      </v-card>
                    </v-col>
                    <v-col cols="6" sm="3">
                      <v-card variant="tonal" color="success" class="compact-stat-card">
                        <v-card-text class="pa-3 text-center">
                          <v-icon color="success" size="small" class="mb-1">mdi-cards</v-icon>
                          <div class="text-caption text-grey">Total</div>
                          <div class="text-subtitle-2 font-weight-bold">{{ roomCards.length }}/400</div>
                        </v-card-text>
                      </v-card>
                    </v-col>
                    <v-col cols="6" sm="3">
                      <v-card variant="tonal" color="info" class="compact-stat-card">
                        <v-card-text class="pa-3 text-center">
                          <v-icon color="info" size="small" class="mb-1">mdi-card-plus</v-icon>
                          <div class="text-caption text-grey">Available</div>
                          <div class="text-subtitle-2 font-weight-bold">{{ availableRoomCards }}</div>
                        </v-card-text>
                      </v-card>
                    </v-col>
                    <v-col cols="6" sm="3">
                      <v-card variant="tonal" color="warning" class="compact-stat-card">
                        <v-card-text class="pa-3 text-center">
                          <v-icon color="warning" size="small" class="mb-1">mdi-account-check</v-icon>
                          <div class="text-caption text-grey">Assigned</div>
                          <div class="text-subtitle-2 font-weight-bold">{{ assignedRoomCards }}</div>
                        </v-card-text>
                      </v-card>
                    </v-col>
                  </v-row>

                  <v-btn
                    v-if="selectedRoomForCardView"
                    color="info"
                    variant="outlined"
                    block
                    class="mt-4"
                    @click="loadRoomCards"
                  >
                    <v-icon class="mr-2" size="small">mdi-refresh</v-icon>
                    Refresh Cards
                  </v-btn>
                </v-card-text>
              </v-card>
            </v-col>

            <v-col cols="12" lg="4">
              <v-card class="modern-guide-card" elevation="0">
                <v-card-title class="modern-card-header">
                  <div class="d-flex align-center">
                    <v-avatar color="info" size="48" class="mr-3">
                      <v-icon color="white" size="24">mdi-lightbulb-on</v-icon>
                    </v-avatar>
                    <div>
                      <h3 class="text-h6 font-weight-bold mb-0">Quick Guide</h3>
                      <p class="text-caption text-grey mb-0">How it works</p>
                    </div>
                  </div>
                </v-card-title>
                <v-card-text class="pa-4">
                  <div class="guide-step">
                    <v-chip size="x-small" color="success" class="mb-2">1</v-chip>
                    <div class="text-caption"><strong>Create Room</strong> - Cards auto-generated</div>
                  </div>
                  <div class="guide-step">
                    <v-chip size="x-small" color="primary" class="mb-2">2</v-chip>
                    <div class="text-caption"><strong>Generate/Copy</strong> - Create or copy cards</div>
                  </div>
                  <div class="guide-step">
                    <v-chip size="x-small" color="info" class="mb-2">3</v-chip>
                    <div class="text-caption"><strong>Assign Manager</strong> - ONE user manages room</div>
                  </div>
                  <div class="guide-step">
                    <v-chip size="x-small" color="warning" class="mb-2">4</v-chip>
                    <div class="text-caption"><strong>Distribute</strong> - Manager assigns to players</div>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <!-- Card Generation Options - Compact -->
          <v-row v-if="selectedRoomForCardView && roomCards.length < 400" class="mt-4">
            <v-col cols="12">
              <v-card class="modern-generation-card" elevation="0">
                <v-card-title class="modern-card-header">
                  <div class="d-flex align-center">
                    <v-avatar color="success" size="48" class="mr-3">
                      <v-icon color="white" size="24">mdi-cog</v-icon>
                    </v-avatar>
                    <div>
                      <h3 class="text-h6 font-weight-bold mb-0">Card Generation Options</h3>
                      <p class="text-caption text-grey mb-0">Generate or copy 400 cards for this room</p>
                    </div>
                  </div>
                </v-card-title>
                <v-card-text class="pa-6">
                  <v-row>
                    <v-col cols="12" md="6">
                      <v-card class="compact-option-card" variant="outlined" hover>
                        <v-card-text class="pa-4">
                          <div class="d-flex align-center mb-3">
                            <v-avatar color="success" size="56" class="mr-3">
                              <v-icon size="28">mdi-cards-playing-outline</v-icon>
                            </v-avatar>
                            <div>
                              <h4 class="text-subtitle-1 font-weight-bold mb-1">Generate Unique Cards</h4>
                              <p class="text-caption text-grey mb-0">Create 400 brand new cards</p>
                            </div>
                          </div>
                          <v-btn
                            color="success"
                            block
                            @click="generateCardsForRoom"
                            :loading="generatingRoomCards"
                          >
                            <v-icon class="mr-2" size="small">mdi-plus-circle</v-icon>
                            Generate 400 Cards
                          </v-btn>
                        </v-card-text>
                      </v-card>
                    </v-col>

                    <v-col cols="12" md="6">
                      <v-card class="compact-option-card" variant="outlined" hover>
                        <v-card-text class="pa-4">
                          <div class="d-flex align-center mb-3">
                            <v-avatar color="primary" size="56" class="mr-3">
                              <v-icon size="28">mdi-content-copy</v-icon>
                            </v-avatar>
                            <div>
                              <h4 class="text-subtitle-1 font-weight-bold mb-1">Copy from Room</h4>
                              <p class="text-caption text-grey mb-0">Use same patterns</p>
                            </div>
                          </div>
                          <v-select
                            v-model="selectedSourceRoom"
                            :items="roomsWithCards"
                            item-title="displayName"
                            item-value="id"
                            label="Select source room"
                            variant="outlined"
                            density="compact"
                            class="mb-2"
                          >
                            <template v-slot:prepend-inner>
                              <v-icon color="primary" size="small">mdi-door</v-icon>
                            </template>
                          </v-select>
                          <v-btn
                            color="primary"
                            block
                            @click="copyCardsFromRoom"
                            :disabled="!selectedSourceRoom"
                            :loading="copyingCards"
                          >
                            <v-icon class="mr-2" size="small">mdi-content-copy</v-icon>
                            Copy Cards
                          </v-btn>
                        </v-card-text>
                      </v-card>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <!-- Cards Table - Compact -->
          <v-row v-if="selectedRoomForCardView" class="mt-4">
            <v-col cols="12">
              <v-card class="modern-table-card" elevation="0">
                <v-card-title class="modern-card-header d-flex align-center justify-space-between">
                  <div class="d-flex align-center">
                    <v-avatar color="primary" size="48" class="mr-3">
                      <v-icon color="white" size="24">mdi-view-list</v-icon>
                    </v-avatar>
                    <div>
                      <h3 class="text-h6 font-weight-bold mb-0">Cards for {{ selectedRoomName }}</h3>
                      <p class="text-caption text-grey mb-0">{{ filteredRoomCards.length }} cards</p>
                    </div>
                  </div>
                  <v-chip color="primary" variant="flat" size="small">
                    {{ filteredRoomCards.length }} / {{ roomCards.length }}
                  </v-chip>
                </v-card-title>
                <v-card-text class="pa-6">
                  <v-text-field
                    v-model="cardSearch"
                    label="Search Card Number"
                    variant="outlined"
                    density="compact"
                    clearable
                    class="mb-4"
                  >
                    <template v-slot:prepend-inner>
                      <v-icon color="primary" size="small">mdi-magnify</v-icon>
                    </template>
                  </v-text-field>

                  <v-table class="compact-cards-table" v-if="filteredRoomCards.length > 0">
                    <thead>
                      <tr>
                        <th>Card Number</th>
                        <th>Assigned To</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="card in paginatedRoomCards" :key="card.id">
                        <td>
                          <v-chip color="primary" size="small" variant="flat">
                            {{ card.cardNumber }}
                          </v-chip>
                        </td>
                        <td>
                          <v-chip v-if="card.assignedUser" color="success" size="small" variant="flat">
                            <v-icon size="x-small" class="mr-1">mdi-account</v-icon>
                            {{ card.assignedUser.username }}
                          </v-chip>
                          <v-chip v-else color="grey" size="small" variant="outlined">
                            Unassigned
                          </v-chip>
                        </td>
                        <td>
                          <v-chip 
                            :color="card.isLocked ? 'error' : 'success'" 
                            size="small"
                            variant="flat"
                          >
                            <v-icon size="x-small">{{ card.isLocked ? 'mdi-lock' : 'mdi-lock-open' }}</v-icon>
                          </v-chip>
                        </td>
                      </tr>
                    </tbody>
                  </v-table>

                  <v-pagination
                    v-if="totalRoomCardsPages > 1"
                    v-model="roomCardsPage"
                    :length="totalRoomCardsPages"
                    :total-visible="5"
                    class="mt-4"
                    size="small"
                    rounded="circle"
                  ></v-pagination>

                  <div v-else-if="roomCards.length === 0" class="empty-cards-state">
                    <v-icon size="60" color="grey-lighten-1">mdi-cards-outline</v-icon>
                    <h4 class="text-subtitle-1 mt-3 mb-2">No Cards Found</h4>
                    <p class="text-caption text-grey">Generate or copy cards to get started</p>
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
      </v-container>
    </v-main>

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
const drawer = ref(true);
const rail = ref(false);
const toast = ref<{ show: boolean; message: string; color: string }>({
  show: false,
  message: '',
  color: 'info',
});

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
const activeTab = ref('dashboard');
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
    if (response?.data) {
      users.value = response.data.map((u: any) => ({
        ...u,
        houseFee: Number(u.houseFee || 0),
      }));
    }
  } catch (error) {
    console.error('Error loading users:', error);
    // Don't show toast - this is a background operation
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

async function loadRoomCards() {
  if (!selectedRoomForCardView.value) return;
  
  try {
    const response = await services?.cardService.getByRoom(selectedRoomForCardView.value);
    roomCards.value = response?.data || [];
    roomCardsPage.value = 1; // Reset to first page
  } catch (error) {
    console.error('Error loading room cards:', error);
    showToast('Failed to load room cards: ' + getErrorMessage(error), 'error');
  }
}

async function generateAllCards() {
  if (!confirm('Generate 400 cards? This may take a moment.')) return;

  generating.value = true;
  try {
    await services?.cardService.generateBulk();
    showToast('400 cards generated successfully!', 'success');
    await loadCards();
  } catch (error) {
    console.error('Error generating cards:', error);
    showToast('Failed to generate cards: ' + getErrorMessage(error), 'error');
  } finally {
    generating.value = false;
  }
}

async function generateCardsForRoom() {
  if (!selectedRoomForCardView.value) return;
  
  if (!confirm('Generate 400 unique cards for this room? This may take a moment.')) return;

  generatingRoomCards.value = true;
  try {
    const response = await services?.roomService.generateCardsForRoom(selectedRoomForCardView.value);
    showToast(`Generated ${response?.data?.generated || 0} unique cards successfully!`, 'success');
    await loadRoomCards();
  } catch (error) {
    console.error('Error generating room cards:', error);
    showToast('Failed to generate cards: ' + getErrorMessage(error), 'error');
  } finally {
    generatingRoomCards.value = false;
  }
}

async function copyCardsFromRoom() {
  if (!selectedRoomForCardView.value || !selectedSourceRoom.value) return;
  
  const sourceRoomName = rooms.value.find((r: any) => r.id === selectedSourceRoom.value)?.name || 'selected room';
  
  if (!confirm(`Copy 400 cards from "${sourceRoomName}" to "${selectedRoomName.value}"? This will use the same card patterns.`)) return;

  copyingCards.value = true;
  try {
    const response = await services?.roomService.copyCardsFromRoom(
      selectedRoomForCardView.value,
      selectedSourceRoom.value
    );
    showToast(`Copied ${response?.data?.copied || 0} cards successfully!`, 'success');
    selectedSourceRoom.value = null;
    await loadRoomCards();
  } catch (error) {
    console.error('Error copying cards:', error);
    showToast('Failed to copy cards: ' + getErrorMessage(error), 'error');
  } finally {
    copyingCards.value = false;
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
      try {
        // Get the newly created user and make them admin
        const allUsers = await services?.userService.getAll();
        const newlyCreated = allUsers?.data?.find((u: any) => u.username === newUser.value.username);
        if (newlyCreated) {
          await services?.userService.updateRole(newlyCreated.id, 'admin');
        }
      } catch (roleError) {
        console.error('Error updating user role to admin:', roleError);
        // Don't show error toast - user was created successfully
        // Just log the error and continue
      }
    }
    
    showToast(`User "${newUser.value.username}" registered successfully!`, 'success');
    newUser.value = { username: '', password: '', role: 'user' };
    
    // Reload users list (with error handling)
    try {
      await loadUsers();
    } catch (loadError) {
      console.error('Error reloading users list:', loadError);
      // Don't show error toast - user was created successfully
    }
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
  loadCards();
  
  client?.on(NEW_ROOM_AVAILABLE_EVENT, async () => {
    await loadRooms();
  });
});

onBeforeUnmount(() => {
  client?.off(NEW_ROOM_AVAILABLE_EVENT);
});
</script>

<style scoped lang="scss">
/* Modern Admin Layout */
.modern-admin-layout {
  min-height: 100vh;
  background: #f5f7fa;
}

/* Top Bar */
.top-bar {
  border-bottom: 1px solid #e0e0e0 !important;
  
  .app-title {
    display: flex;
    align-items: center;
    font-weight: 600;
    color: #2c3e50;
  }

  .menu-icon {
    color: #5a6c7d;
  }

  .user-menu-btn {
    text-transform: none;
    height: auto;
    padding: 8px 16px;
    border-radius: 8px;
    
    .user-info {
      text-align: left;
      
      .user-name {
        font-size: 0.875rem;
        font-weight: 600;
        color: #2c3e50;
        line-height: 1.2;
      }
      
      .user-role {
        font-size: 0.75rem;
        color: #8898aa;
        line-height: 1.2;
      }
    }
  }
}

/* Sidebar */
.modern-sidebar {
  border-right: none !important;
  
  .sidebar-header {
    padding: 24px 16px;
    display: flex;
    align-items: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    
    .sidebar-title {
      color: white;
      font-size: 1.1rem;
      font-weight: 600;
      line-height: 1.2;
    }
    
    .sidebar-subtitle {
      color: rgba(255, 255, 255, 0.6);
      font-size: 0.75rem;
      line-height: 1.2;
    }
  }

  .sidebar-section-title {
    padding: 16px 16px 8px;
    font-size: 0.75rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.5);
    letter-spacing: 0.5px;
  }

  .sidebar-menu {
    padding: 8px;
    
    .menu-item {
      margin-bottom: 4px;
      border-radius: 8px;
      color: rgba(255, 255, 255, 0.8);
      transition: all 0.2s ease;
      
      &:hover {
        background: rgba(255, 255, 255, 0.1);
        color: white;
      }
      
      &.active-menu-item {
        background: linear-gradient(135deg, #4e73df 0%, #224abe 100%);
        color: white;
        
        .v-icon {
          color: white;
        }
      }
      
      .v-icon {
        color: rgba(255, 255, 255, 0.8);
      }
    }
  }

  .toggle-btn {
    color: rgba(255, 255, 255, 0.8);
    
    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  }
}

/* Main Content */
.main-content {
  background: #f5f7fa;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  
  h1 {
    color: #2c3e50;
    margin-bottom: 4px;
  }
  
  .text-grey {
    color: #8898aa;
  }
}

/* Metric Cards */
.metric-card {
  border-radius: 16px !important;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15) !important;
  }
  
  .v-card-text {
    padding: 24px !important;
    position: relative;
  }
  
  .metric-icon {
    position: absolute;
    top: 20px;
    right: 20px;
    opacity: 0.3;
  }
  
  .metric-value {
    font-size: 2.5rem;
    font-weight: 700;
    color: white;
    line-height: 1;
    margin: 8px 0;
  }
  
  .metric-label {
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.9);
    font-weight: 500;
    margin-bottom: 12px;
  }
  
  .metric-trend {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.8);
    
    .v-icon {
      color: rgba(255, 255, 255, 0.8);
    }
  }
}

.blue-card {
  background: linear-gradient(135deg, #4e73df 0%, #224abe 100%) !important;
}

.orange-card {
  background: linear-gradient(135deg, #f6c23e 0%, #f4a742 100%) !important;
}

.green-card {
  background: linear-gradient(135deg, #1cc88a 0%, #13855c 100%) !important;
}

.purple-card {
  background: linear-gradient(135deg, #6f42c1 0%, #5a32a3 100%) !important;
}

/* Content Cards */
.content-card {
  border-radius: 16px !important;
  border: 1px solid #e3e8ef;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04) !important;
  
  .v-card-title {
    padding: 20px 24px;
    border-bottom: 1px solid #e3e8ef;
    background: white;
    color: #2c3e50;
  }
  
  .v-card-text {
    padding: 0;
  }
  
  .v-list {
    background: transparent;
    
    .v-list-item {
      padding: 16px 24px;
      border-bottom: 1px solid #f0f3f7;
      
      &:last-child {
        border-bottom: none;
      }
      
      &:hover {
        background: #f8f9fa;
      }
    }
  }
}

/* Responsive */
@media (max-width: 960px) {
  .page-header {
    flex-direction: column;
    gap: 16px;
    
    .text-right {
      text-align: left !important;
    }
  }
}

/* Modern Register Card */
.modern-register-card {
  border-radius: 24px !important;
  border: 1px solid #e3e8ef;
  background: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08) !important;
}

.form-section {
  h3 {
    color: #2c3e50;
    display: flex;
    align-items: center;
  }
}

.role-selector {
  .v-selection-control {
    display: none;
  }
}

.role-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid #e3e8ef !important;
  border-radius: 12px !important;
  
  &:hover {
    border-color: #4e73df !important;
    transform: translateX(4px);
  }
  
  &.role-card-selected {
    border-color: #4e73df !important;
    background: rgba(78, 115, 223, 0.05);
  }
}

.register-submit-btn {
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: none;
  font-size: 1rem;
  height: 48px !important;
}

/* Modern Rooms Styles */
.modern-rooms-card,
.modern-action-card {
  border-radius: 16px !important;
  border: 1px solid #e3e8ef;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04) !important;
}

.modern-card-header {
  padding: 20px 24px !important;
  border-bottom: 1px solid #e3e8ef;
  background: white;
}

.modern-room-card {
  border-radius: 16px !important;
  border: 2px solid #e3e8ef;
  background: white;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #4e73df;
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(78, 115, 223, 0.15) !important;
  }
}

.room-stats {
  .stat-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  .stat-chip {
    width: 100%;
    justify-content: flex-start;
  }
}

.empty-rooms-state {
  text-align: center;
  padding: 80px 20px;
  
  h4 {
    color: #2c3e50;
  }
}

.managers-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* Compact Card Management Styles */
.modern-card-selector,
.modern-guide-card,
.modern-generation-card,
.modern-table-card {
  border-radius: 16px !important;
  border: 1px solid #e3e8ef;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04) !important;
}

.compact-stat-card {
  border-radius: 12px !important;
  transition: transform 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
  }
}

.guide-step {
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
  
  &:last-child {
    border-bottom: none;
  }
}

.compact-option-card {
  border-radius: 12px !important;
  border: 2px solid #e3e8ef;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #4e73df;
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1) !important;
  }
}

.compact-cards-table {
  border-radius: 12px !important;
  overflow: hidden;
  
  thead {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    
    tr th {
      color: white !important;
      font-weight: 600 !important;
      padding: 12px 16px !important;
      border: none !important;
      font-size: 0.875rem;
    }
  }
  
  tbody {
    tr {
      transition: background-color 0.2s ease;
      
      &:hover {
        background-color: rgba(102, 126, 234, 0.05) !important;
      }
      
      td {
        padding: 10px 16px !important;
        border-bottom: 1px solid rgba(0, 0, 0, 0.06) !important;
      }
    }
  }
}

.empty-cards-state {
  text-align: center;
  padding: 40px 20px;
  
  h4 {
    color: #2c3e50;
  }
}

/* Old styles below - keeping for other tabs */
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
.create-room-card,
.card-management-card,
.profile-card {
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

/* Card Management Enhancements */
.info-banner {
  border-left: 4px solid #667eea !important;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%) !important;
}

.room-selector-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 1) 100%) !important;
}

.room-select {
  .v-field {
    border-radius: 12px !important;
  }
}

.stats-card {
  border-radius: 12px !important;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%) !important;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  align-items: center;

  @media (max-width: 960px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;

  .stat-content {
    flex: 1;
  }

  .stat-label {
    font-size: 0.75rem;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
  }

  .stat-value {
    font-size: 1.5rem;
    font-weight: bold;
    color: #333;
  }
}

.info-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 1) 100%) !important;
}

.guide-timeline {
  .timeline-content {
    h4 {
      color: #333;
      font-size: 0.95rem;
    }

    p {
      color: #666;
      margin: 0;
    }
  }
}

.generation-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 1) 100%) !important;
}

.option-card {
  border: 2px solid transparent !important;
  transition: all 0.3s ease !important;
  border-radius: 16px !important;
  height: 100%;

  &:hover {
    border-color: currentColor !important;
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;
  }

  .v-avatar {
    margin: 0 auto;
  }
}

.cards-table-card {
  background: white !important;
}

.search-field {
  .v-field {
    border-radius: 12px !important;
  }
}

.modern-table {
  border-radius: 12px !important;
  overflow: hidden;

  thead {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

    tr th {
      color: white !important;
      font-weight: 600 !important;
      padding: 16px !important;
      border: none !important;
    }
  }

  tbody {
    tr {
      transition: background-color 0.2s ease;

      &:hover {
        background-color: rgba(102, 126, 234, 0.05) !important;
      }

      td {
        padding: 12px 16px !important;
        border-bottom: 1px solid rgba(0, 0, 0, 0.06) !important;
      }
    }
  }
}

.table-header {
  display: flex;
  align-items: center;
}

.empty-state {
  border-radius: 12px !important;
  
  .v-icon {
    opacity: 0.5;
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

  .stats-grid {
    grid-template-columns: 1fr !important;
  }
}
</style>
