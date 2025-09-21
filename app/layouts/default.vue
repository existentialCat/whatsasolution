<!-- layouts/default.vue -->
<template>
  <v-app>
    <LayoutAppSidebar @open-submit-dialog="showProblemForm = true" />
    
    <!-- 
      By giving v-main a specific class, we can style it to be the primary
      scrolling container for the application content.
    -->
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
/* These are global styles, not scoped, because they need to apply
  to Vuetify's core components to establish the main layout.
*/

/* This style turns the <v-main> component into the scrolling container
  for the page by constraining its height to the viewport and allowing
  vertical overflow. This is the key to making `position: sticky` work.
*/
.main-content-area {
  height: 100vh;
  overflow-y: auto;
}
</style>
