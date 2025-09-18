<!-- layouts/default.vue -->
<template>
  <v-app>
    <LayoutAppSidebar @open-submit-dialog="showProblemForm = true" />
    <v-main>
        <NuxtPage />
      <SubmitProblemDialog v-if="user" v-model="showProblemForm" />
    </v-main>
  </v-app>
</template>

<script setup>
import { ref } from 'vue';
import { useSupabaseUser } from '#imports';
// The new sidebar component will be auto-imported by Nuxt

const user = useSupabaseUser();
const showProblemForm = ref(false);
</script>