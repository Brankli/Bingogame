import { defineStore } from 'pinia';
import io, { Socket } from 'socket.io-client';
import { computed, ref, Ref } from 'vue';
import { getApiUrl } from '@/utils/apiUrl';

export const useSocket = defineStore('socket', () => {
  const client: Ref<Socket | null> = ref(null);

  const isConnected = computed(() => !!client.value?.connected);

  function connect(uri?: string, token?: string) {
    const authToken = token || localStorage.getItem('token') || undefined;
    if (!authToken) {
      console.warn('[Socket] Cannot connect without auth token');
      return;
    }

    const url = uri || getApiUrl();

    if (client.value?.connected) {
      return;
    }

    if (client.value) {
      client.value.removeAllListeners();
      client.value.disconnect();
    }

    client.value = io(url, {
      auth: {
        Bearer: authToken,
      },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
  }

  function ensureConnected(token?: string) {
    if (!client.value?.connected) {
      connect(undefined, token);
    }
  }

  function disconnect() {
    if (client.value) {
      client.value.removeAllListeners();
      client.value.disconnect();
      client.value = null;
    }
  }

  return { client, isConnected, connect, ensureConnected, disconnect };
});
