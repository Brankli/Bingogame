<template>
  <v-app>
    <v-app-bar elevation="4" class="app-header" v-if="notInRoom">
      <v-app-bar-title class="app-title">
        <v-icon size="large" class="mr-2">mdi-cards</v-icon>
        <span class="title-text">Bingo Game</span>
      </v-app-bar-title>

      <v-spacer></v-spacer>

      <!-- User Info -->
      <div v-if="token && user" class="user-section">
        <v-chip 
          :color="String(user?.role || '').toLowerCase() === 'admin' ? 'error' : 'primary'" 
          variant="elevated" 
          class="mr-2"
        >
          <v-icon start>{{ String(user?.role || '').toLowerCase() === 'admin' ? 'mdi-shield-crown' : 'mdi-account-circle' }}</v-icon>
          {{ user?.username }}
          <v-chip 
            v-if="String(user?.role || '').toLowerCase() === 'admin'" 
            size="x-small" 
            color="white" 
            class="ml-2"
          >
            ADMIN
          </v-chip>
        </v-chip>
        
        <v-btn
          v-if="String(user?.role || '').toLowerCase() === 'admin'"
          color="success"
          variant="elevated"
          class="mr-2"
          @click="goToAdminDashboard"
        >
          <v-icon class="mr-1">mdi-view-dashboard</v-icon>
          Admin Dashboard
        </v-btn>
        
        <v-btn color="error" variant="elevated" @click="logout">
          <v-icon class="mr-1">mdi-logout</v-icon>
          Logout
        </v-btn>
      </div>

      <!-- Auth Buttons - Login Only -->
      <div v-else class="auth-buttons">
        <v-dialog v-model="loginDialog" max-width="500">
          <template v-slot:activator="{ props }">
            <v-btn color="primary" variant="elevated" v-bind="props" class="mr-2">
              <v-icon class="mr-1">mdi-login</v-icon>
              Login
            </v-btn>
          </template>

          <v-card class="auth-card">
            <v-card-title class="auth-card-title">
              <v-icon class="mr-2">mdi-login</v-icon>
              Login to Your Account
            </v-card-title>

            <v-card-text class="pa-6">
              <v-form ref="loginForm" @submit.prevent="login">
                <v-text-field
                  v-model="username"
                  label="Username"
                  variant="outlined"
                  prepend-inner-icon="mdi-account"
                  :rules="[
                    v => !!v || 'Username is required',
                    v => (v && v.length >= 3) || 'Username must be at least 3 characters'
                  ]"
                  required
                  class="mb-4"
                  :error-messages="loginError && !username ? ['Please enter your username'] : []"
                ></v-text-field>

                <v-text-field
                  v-model="password"
                  type="password"
                  label="Password"
                  variant="outlined"
                  prepend-inner-icon="mdi-lock"
                  :rules="[
                    v => !!v || 'Password is required',
                    v => (v && v.length >= 6) || 'Password must be at least 6 characters'
                  ]"
                  required
                  class="mb-4"
                  :error-messages="loginError && !password ? ['Please enter your password'] : []"
                ></v-text-field>

                <v-alert v-if="loginError" type="error" density="compact" class="mb-4">
                  <v-icon class="mr-2">mdi-alert-circle</v-icon>
                  {{ loginError }}
                </v-alert>

                <v-alert v-else type="info" density="compact" class="mb-4">
                  <strong>Note:</strong> Contact an administrator to create an account.
                </v-alert>

                <v-btn 
                  type="submit" 
                  color="primary" 
                  size="large" 
                  block
                  :loading="loggingIn"
                >
                  Login
                </v-btn>
              </v-form>
            </v-card-text>

            <v-card-actions>
              <v-btn color="grey" variant="text" block @click="closeLoginDialog">
                Close
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </div>
    </v-app-bar>

    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup>
import { computed, inject, ref } from "vue";
import { useCookies } from "vue3-cookies";
import { useAuth } from "@/store/auth";
import { useSocket } from "@/store/socket";
import { storeToRefs } from "pinia";
import { useRoute, useRouter } from "vue-router";

// Store
const auth = useAuth();
const { user } = storeToRefs(auth);
const socket = useSocket();
const { cookies } = useCookies();
const route = useRoute();
const router = useRouter();

// Services
const services = inject('services');

// Data
const loginDialog = ref(false);
const loginForm = ref(null);
const username = ref(null);
const password = ref(null);
const token = ref(null);
const loginError = ref('');
const loggingIn = ref(false);
const notInRoom = computed(() => {
  const path = route.path || '';
  return !path.includes('/rooms/') && !path.includes('/bingo-rooms/');
});

// Methods
function closeLoginDialog() {
  loginDialog.value = false;
  loginError.value = '';
  username.value = null;
  password.value = null;
  if (loginForm.value) {
    loginForm.value.reset();
  }
}
async function login() {
  // Clear previous errors
  loginError.value = '';
  
  // Validate form
  if (!loginForm.value) return;
  
  const { valid } = await loginForm.value.validate();
  if (!valid) {
    loginError.value = 'Please fill in all required fields correctly';
    return;
  }

  // Check if fields are filled
  if (!username.value || !password.value) {
    loginError.value = 'Username and password are required';
    return;
  }

  try {
    loggingIn.value = true;
    const loginResponse = await services?.authService.login(username.value, password.value);
    
    if (!loginResponse.data.access_token) {
      loginError.value = 'Login failed. Please try again.';
      return;
    }

    token.value = loginResponse.data.access_token;
    cookies.set('token', token.value);
    auth.setUser(loginResponse.data.user);
    
    // Clear form
    username.value = null;
    password.value = null;
    loginError.value = '';
    loginDialog.value = false;
    
    window.location.reload();
  } catch (error) {
    console.error('Login error:', error);
    
    // Handle specific error messages
    if (error.response?.status === 401) {
      loginError.value = 'Invalid username or password';
    } else if (error.response?.data?.message) {
      loginError.value = error.response.data.message;
    } else if (error.message) {
      loginError.value = 'Login failed: ' + error.message;
    } else {
      loginError.value = 'Login failed. Please try again.';
    }
  } finally {
    loggingIn.value = false;
  }
}

function goToAdminDashboard() {
  router.push({ name: 'admin-dashboard' });
}

async function logout() {
  cookies.remove('token');
  auth.setUser(null);
  token.value = null;
}

if (cookies.get('token')) {
  token.value = cookies.get('token');

  services?.authService.me()
    .then(({ data }) => {
      auth.setUser(data)
      socket.connect(`${process.env.VUE_APP_API_URL || 'http://localhost:3000'}`, token.value);
    });
}

</script>

<style lang="scss">
.app-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  
  .app-title {
    display: flex;
    align-items: center;
    color: white;
    font-weight: bold;
    font-size: 1.5rem;
    
    .title-text {
      font-family: 'Roboto', sans-serif;
      letter-spacing: 1px;
    }
  }
}

.user-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.auth-buttons {
  display: flex;
  gap: 8px;
}

.auth-card {
  border-radius: 12px !important;
  
  .auth-card-title {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    font-size: 1.3rem;
    font-weight: bold;
    padding: 20px;
    
    &.register {
      background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
    }
  }
}

.v-main {
  background: #f5f5f5;
}
</style>
