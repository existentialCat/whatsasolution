<template>
  <v-app>
    <ClientOnly>
      <LayoutAppSidebar @open-submit-dialog="showProblemForm = true" />
    </ClientOnly>
    
    <v-main class="main-content-area">
        <NuxtPage />
      <SubmitProblemDialog v-if="user" v-model="showProblemForm" />
    </v-main>
  </v-app>
</template>

<script setup>
import { ref } from 'vue';
import { useSupabaseUser } from '#imports';

const user = useSupabaseUser();
const showProblemForm = ref(false);
</script>

<style>
.main-content-area {
  height: 100vh;
  overflow-y: auto;
}
</style>