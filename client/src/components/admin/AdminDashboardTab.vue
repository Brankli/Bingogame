<template>
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
</template>


<script setup lang="ts">
import { useAdminDashboard } from '@/composables/useAdminDashboard';

const {
  activeTab,
  adminCount,
  cards,
  currentDate,
  currentTime,
  formatFee,
  joinRoom,
  rooms,
  totalUserEarnings,
  totalUsers,
  user
} = useAdminDashboard();
</script>
