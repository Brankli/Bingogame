<template>
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

                  <v-form
                    :key="formKey"
                    ref="registerFormRef"
                    @submit.prevent="handleRegister"
                  >
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
                        validate-on="blur"
                        :rules="usernameRules"
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
                        validate-on="blur"
                        :rules="passwordRules"
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
                      :loading="registering"
                    >
                      <v-icon class="mr-2">mdi-account-plus</v-icon>
                      Create User Account
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
  newUser,
  registerUser,
} = useAdminDashboard();

const registerFormRef = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(null);
const formKey = ref(0);
const registering = ref(false);

const usernameRules = [
  (v: string) => !!v?.trim() || 'Username is required',
  (v: string) => (v?.trim().length ?? 0) >= 3 || 'Minimum 3 characters',
];

const passwordRules = [
  (v: string) => !!v || 'Password is required',
  (v: string) => (v?.length ?? 0) >= 6 || 'Minimum 6 characters',
];

async function handleRegister() {
  const form = registerFormRef.value;
  if (!form) return;

  const { valid } = await form.validate();
  if (!valid) return;

  registering.value = true;
  try {
    const success = await registerUser();
    if (success) {
      formKey.value += 1;
    }
  } finally {
    registering.value = false;
  }
}
</script>
