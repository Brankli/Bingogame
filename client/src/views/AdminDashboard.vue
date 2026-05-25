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
            <AdminDashboardTab />
          </v-window-item>
        <!-- Rooms Tab -->
        <v-window-item value="rooms">
            <AdminRoomsTab />
          </v-window-item>

        <!-- Users Tab -->
        <v-window-item value="users">
            <AdminUsersTab />
          </v-window-item>

        <!-- Register User Tab -->
        <v-window-item value="register">
            <AdminRegisterTab />
          </v-window-item>

        <!-- Card Management Tab -->
        <v-window-item value="cards">
            <AdminCardsTab />
          </v-window-item>

        <!-- Profile Tab -->
        <v-window-item value="profile">
            <AdminProfileTab />
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
import { useAdminDashboard } from '@/composables/useAdminDashboard';
import AdminDashboardTab from '@/components/admin/AdminDashboardTab.vue';
import AdminRoomsTab from '@/components/admin/AdminRoomsTab.vue';
import AdminUsersTab from '@/components/admin/AdminUsersTab.vue';
import AdminRegisterTab from '@/components/admin/AdminRegisterTab.vue';
import AdminCardsTab from '@/components/admin/AdminCardsTab.vue';
import AdminProfileTab from '@/components/admin/AdminProfileTab.vue';

const {
  user,
  showLogoutDialog,
  drawer,
  rail,
  toast,
  activeTab,
  confirmLogout,
  logout,
} = useAdminDashboard();
</script>

<style lang="scss">
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
