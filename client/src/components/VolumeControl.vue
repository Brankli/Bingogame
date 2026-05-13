<template>
  <div class="volume-control">
    <v-card variant="outlined">
      <v-card-text class="pa-3">
        <div class="d-flex align-center">
          <v-icon 
            :color="volume === 0 ? 'grey' : 'primary'" 
            class="mr-2"
            size="small"
          >
            {{ volumeIcon }}
          </v-icon>
          <v-slider
            v-model="volume"
            :min="0"
            :max="100"
            :step="5"
            hide-details
            density="compact"
            @update:modelValue="updateVolume"
            class="flex-grow-1"
          >
            <template v-slot:append>
              <span class="text-caption volume-label">{{ volume }}%</span>
            </template>
          </v-slider>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
/* eslint-disable no-undef */
import { ref, computed, onMounted } from 'vue';

const volume = ref(100);

const emit = defineEmits<{
  (e: 'volume-changed', volume: number): void
}>();

const volumeIcon = computed(() => {
  if (volume.value === 0) return 'mdi-volume-mute';
  if (volume.value < 50) return 'mdi-volume-low';
  return 'mdi-volume-high';
});

const updateVolume = (value: number) => {
  const normalizedVolume = value / 100; // Convert to 0.0-1.0 range
  emit('volume-changed', normalizedVolume);
  localStorage.setItem('voiceVolume', value.toString());
};

// Load saved volume preference on mount
onMounted(() => {
  const savedVolume = localStorage.getItem('voiceVolume');
  if (savedVolume) {
    const volumeValue = parseInt(savedVolume, 10);
    if (!isNaN(volumeValue) && volumeValue >= 0 && volumeValue <= 100) {
      volume.value = volumeValue;
      emit('volume-changed', volumeValue / 100);
    }
  }
});
</script>

<style scoped>
.volume-control {
  max-width: 300px;
}

.volume-label {
  min-width: 35px;
  text-align: right;
}
</style>
