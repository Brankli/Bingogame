<template>
  <v-container class="py-8">
    <v-btn variant="text" color="primary" class="mb-4" @click="goBack">
      <v-icon class="mr-2">mdi-arrow-left</v-icon>
      Back
    </v-btn>
    <DailyBingoReport />
  </v-container>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import DailyBingoReport from '@/components/DailyBingoReport.vue';

const router = useRouter();

function goBack() {
  if (window.history.state?.back) {
    router.back();
    return;
  }

  router.push({ name: 'home' });
}
</script>
