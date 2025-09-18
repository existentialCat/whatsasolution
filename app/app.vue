<template>
  <div>
    <v-app>
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </v-app>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useThemeManager } from '~/composables/useTheme';

const { initializeTheme } = useThemeManager();

// Initialize the theme as soon as the app mounts
onMounted(() => {
  initializeTheme();
});
</script>
