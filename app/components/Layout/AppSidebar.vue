<!-- /components/Layout/AppSideBar.vue -->
<template>
  <v-navigation-drawer
    class="app-sidebar"
    permanent
    :rail="mobile"
  >
    <LayoutSidebarHeader />

    <v-list density="compact" nav>
      <v-list-item prepend-icon="mdi-home-variant-outline" title="Problems" to="/problems" rounded="xl"></v-list-item>
      <!-- This is the new Search link -->
      <v-list-item prepend-icon="mdi-magnify" title="Search" to="/search" rounded="xl"></v-list-item>
      <LayoutNotificationMenu v-if="user" />
      <v-list-item
        v-if="user"
        prepend-icon="mdi-account-outline"
        title="Profile"
        :to="`/profile/${profile?.slug}`"
        :disabled="!profile || !profile.slug"
        rounded="xl"
      ></v-list-item>
    </v-list>

    <v-spacer></v-spacer>

    <div v-if="user && !isExempt && !mobile" class="pa-2">
        <LayoutSubmissionCounter />
    </div>

    <div class="pa-2 text-center">
      <v-btn v-if="user && !mobile" block color="primary" @click="$emit('open-submit-dialog')" rounded="xl" size="large">
        Submit Problem
      </v-btn>
      <v-tooltip v-if="user && mobile" location="end">
          <template v-slot:activator="{ props }">
              <v-btn v-bind="props" icon color="primary" @click="$emit('open-submit-dialog')" size="small">
                <v-icon>mdi-plus</v-icon>
              </v-btn>
          </template>
          <LayoutSubmissionCounter mobile />
      </v-tooltip>
    </div>

    <template v-slot:append>
      <LayoutUserProfileMenu />
    </template>
  </v-navigation-drawer>
</template>

<script setup>
import { useDisplay } from 'vuetify';
import { useSupabaseUser } from '#imports';
import { useUserProfile } from '~/composables/useUserProfile';
import { useSubmissionLimits } from '~/composables/useSubmissionLimits';


const user = useSupabaseUser();
const { mobile } = useDisplay();
const { profile } = useUserProfile(); // Fetch profile to get the slug
const { isExempt } = useSubmissionLimits();

defineEmits(['open-submit-dialog']);

</script>

<style scoped>
.app-sidebar {
  position: fixed !important;
  top: 0;
  left: 0;
  height: 100dvh !important;
}
</style>

