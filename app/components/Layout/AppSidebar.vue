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
      <LayoutNotificationMenu v-if="user" />
      <!-- This is the key fix: The button is now always visible for logged-in users but disabled while the profile loads. -->
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
        <v-list-item :subtitle="`${problemsRemaining} problems remaining`" density="compact" class="text-caption"></v-list-item>
        <v-list-item :subtitle="`${solutionsRemaining} solutions remaining`" density="compact" class="text-caption"></v-list-item>
    </div>
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
import { useUserProfile } from '~/composables/useUserProfile';
import { useSubmissionLimits } from '~/composables/useSubmissionLimits';


const user = useSupabaseUser();
const { mobile } = useDisplay();
const { profile } = useUserProfile(); // Fetch profile to get the slug
const { problemsRemaining, solutionsRemaining, isExempt } = useSubmissionLimits();

defineEmits(['open-submit-dialog']);

</script>

<style scoped>
</style>

