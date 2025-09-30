<!-- /layouts/default.vue -->
<template>
  <v-app>
    <ClientOnly>
      <LayoutAppSidebar @open-submit-dialog="showProblemForm = true" />
    </ClientOnly>
    
    <v-main>
        <NuxtPage />
      <SubmitProblemDialog v-if="user" v-model="showProblemForm" />
    </v-main>
  </v-app>
</template>

<script setup>
import { ref } from 'vue';
import { useSupabaseUser } from '#imports';
import { useFaviconNotifier } from '~/composables/useFaviconNotifier';

const user = useSupabaseUser();
const showProblemForm = ref(false);

// ✅ Activate the favicon notifier on every page
useFaviconNotifier();
</script>

<style>
.main-content-area {
  height: 100vh;
  overflow-y: auto;
}
</style>