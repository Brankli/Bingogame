<template>
  <div class="language-selector">
    <v-btn
      @click="toggleLanguage"
      variant="outlined"
      size="small"
      block
      color="primary"
    >
      <v-icon class="mr-1">{{ currentLanguage === 'en' ? 'mdi-translate' : 'mdi-translate-variant' }}</v-icon>
      {{ currentLanguage === 'en' ? 'Switch to አማርኛ' : 'Switch to English' }}
    </v-btn>
  </div>
</template>

<script setup lang="ts">
/* eslint-disable no-undef */
import { ref, onMounted } from 'vue';

const currentLanguage = ref('en');

const emit = defineEmits<{
  (e: 'language-changed', lang: string): void
}>();

const toggleLanguage = () => {
  const newLang = currentLanguage.value === 'en' ? 'am' : 'en';
  currentLanguage.value = newLang;
  emit('language-changed', newLang);
  localStorage.setItem('voiceLanguage', newLang);
};

// Load saved language preference on mount
onMounted(() => {
  const savedLanguage = localStorage.getItem('voiceLanguage');
  if (savedLanguage && ['en', 'am'].includes(savedLanguage)) {
    currentLanguage.value = savedLanguage;
    emit('language-changed', savedLanguage);
  }
});
</script>

<style scoped>
.language-selector {
  width: 100%;
}
</style>
