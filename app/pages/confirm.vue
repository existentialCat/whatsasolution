<!-- pages/confirm.vue -->
<template>
  <v-container class="fill-height">
    <v-row align="center" justify="center">
      <v-col cols="12" class="text-center">
        <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
        <p class="mt-4">Finalizing your login, please wait...</p>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { useSupabaseUser, useRouter } from '#imports';

const user = useSupabaseUser();
const router = useRouter();

// The Supabase Nuxt module automatically handles the session from the URL.
// We just need to watch for the user object to be populated and then redirect.
watch(user, (currentUser) => {
  if (currentUser) {
    router.push('/problems');
  }
}, { immediate: true });
</script>
