<!-- /components/Layout/AppSideBar.vue -->
<template>
  <v-navigation-drawer
    class="app-sidebar"
    permanent
    :rail="mobile"
    app 
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
/* The position: fixed CSS has been removed. 
  The `app` prop on v-navigation-drawer handles this behavior correctly now.
  You can keep other styling here if you need it.
*/
.app-sidebar {
  /* You can keep styles here, but avoid positioning properties like position, top, left, etc. */
}
</style>
