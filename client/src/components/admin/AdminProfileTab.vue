<template>
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
</template>


<script setup lang="ts">
import { useAdminDashboard } from '@/composables/useAdminDashboard';

const {
  changePassword,
  changingPassword,
  passwordForm,
  user,
} = useAdminDashboard();
</script>
