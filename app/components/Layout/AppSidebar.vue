<template>
  <v-navigation-drawer
    class="app-sidebar"
    permanent
    :rail="mobile"
  >
    <LayoutSidebarHeader />

    <v-list density="compact" nav>
      <v-list-item prepend-icon="mdi-home-variant-outline" title="Problems" to="/problems" rounded="xl"></v-list-item>
      <LayoutNotificationMenu v-if="user" />
      <v-list-item v-if="user" prepend-icon="mdi-account-outline" title="Profile" :to="`/profile/${user.id}`" rounded="xl"></v-list-item>
    </v-list>

    <v-spacer></v-spacer>

    <div class="pa-2 text-center">
      <v-btn v-if="user && !mobile" block color="primary" @click="$emit('open-submit-dialog')" rounded="xl" size="large">
        Submit Problem
      </v-btn>
      <v-btn v-if="user && mobile" icon color="primary" @click="$emit('open-submit-dialog')" size="small">
        <v-icon>mdi-plus</v-icon>
      </v-btn>
    </div>

    <template v-slot:append>
      <LayoutUserProfileMenu />
    </template>
  </v-navigation-drawer>
</template>

<script setup>
import { useDisplay } from 'vuetify';
import { useSupabaseUser } from '#imports';

const user = useSupabaseUser();
const { mobile } = useDisplay();
defineEmits(['open-submit-dialog']);
</script>

<style scoped>
.app-sidebar {
  position: fixed !important;
  top: 0;
  left: 0;
  height: 100vh !important;
  /* Using !important to override any conflicting styles */
}
</style>