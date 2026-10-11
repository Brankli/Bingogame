<template>
  <div class="profile-page">
    <div class="page-header mb-6">
      <div>
        <div class="page-kicker mb-2">Account settings</div>
        <h1 class="text-h4 font-weight-bold mb-1">My Profile</h1>
        <p class="text-body-2 text-grey">Manage your administrator account and security preferences.</p>
      </div>
    </div>

    <v-row class="profile-layout">
      <v-col cols="12" md="4" lg="3">
        <v-card class="profile-summary" elevation="0">
          <v-card-text class="pa-6">
            <div class="profile-avatar">
              <v-avatar color="primary" size="76">
                <v-icon color="white" size="38">mdi-account</v-icon>
              </v-avatar>
              <span class="profile-status"></span>
            </div>
            <h2 class="text-h6 font-weight-bold mt-4 mb-1">{{ user?.username }}</h2>
            <p class="text-body-2 text-grey mb-5">Administrator account</p>
            <v-chip color="primary" variant="tonal" size="small">
              <v-icon start size="16">mdi-shield-crown</v-icon>
              {{ user?.role?.toUpperCase() }}
            </v-chip>

            <v-divider class="my-6" />

            <div class="profile-note">
              <v-icon color="primary" size="20">mdi-lock-check-outline</v-icon>
              <span>Your account is protected with password authentication.</span>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="8" lg="7">
        <v-card class="profile-card" elevation="0">
          <v-card-title class="profile-card-title">
            <div>
              <div class="text-h6 font-weight-bold">Change password</div>
              <div class="text-body-2 text-grey">Use a strong password you do not reuse elsewhere.</div>
            </div>
            <v-avatar color="blue-lighten-5" size="44">
              <v-icon color="primary">mdi-lock-reset</v-icon>
            </v-avatar>
          </v-card-title>
          <v-card-text class="pa-6">
            <v-alert type="info" variant="tonal" density="compact" class="mb-6">
              You will need your current password to confirm this change.
            </v-alert>

            <v-form @submit.prevent="changePassword">
              <v-text-field
                v-model="passwordForm.currentPassword"
                label="Current password"
                type="password"
                variant="outlined"
                prepend-inner-icon="mdi-lock"
                :rules="[v => !!v || 'Current password is required']"
                class="mb-3"
              />

              <v-text-field
                v-model="passwordForm.newPassword"
                label="New password"
                type="password"
                variant="outlined"
                prepend-inner-icon="mdi-lock-reset"
                :rules="[
                  v => !!v || 'New password is required',
                  v => v.length >= 6 || 'Password must be at least 6 characters'
                ]"
                class="mb-3"
              />

              <v-text-field
                v-model="passwordForm.confirmPassword"
                label="Confirm new password"
                type="password"
                variant="outlined"
                prepend-inner-icon="mdi-lock-check"
                :rules="[
                  v => !!v || 'Please confirm your password',
                  v => v === passwordForm.newPassword || 'Passwords do not match'
                ]"
                class="mb-5"
              />

              <v-btn
                type="submit"
                color="primary"
                size="large"
                :loading="changingPassword"
                class="profile-submit"
              >
                <v-icon start>mdi-content-save</v-icon>
                Update password
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
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

<style scoped>
.profile-page {
  min-width: 0;
}

.profile-layout {
  align-items: flex-start;
}

.profile-summary,
.profile-card {
  height: 100%;
  border: 1px solid #e2e9f1;
  border-radius: 18px !important;
  background: #fff;
  box-shadow: 0 8px 24px rgba(35, 53, 78, 0.06) !important;
}

.profile-summary {
  text-align: center;
}

.profile-avatar {
  position: relative;
  display: inline-flex;
}

.profile-status {
  position: absolute;
  right: 2px;
  bottom: 2px;
  width: 14px;
  height: 14px;
  border: 3px solid white;
  border-radius: 50%;
  background: #22c55e;
}

.profile-note {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  color: #69798c;
  font-size: 0.8rem;
  line-height: 1.45;
  text-align: left;
}

.profile-card-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 24px !important;
  border-bottom: 1px solid #edf1f5;
}

.profile-submit {
  min-width: 190px;
  text-transform: none;
  font-weight: 700;
}

@media (max-width: 600px) {
  .profile-card-title {
    padding: 18px !important;
  }

  .profile-card > .v-card-text {
    padding: 18px !important;
  }

  .profile-submit {
    width: 100%;
  }
}
</style>
