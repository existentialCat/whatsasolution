<!-- /components/Layout/UserProfileMenu.vue -->
<template>
  <div class="pa-2">
    <v-menu v-if="user && profile" location="top end">
      <template v-slot:activator="{ props }">
        <v-btn v-if="!mobile" v-bind="props" block variant="text" class="justify-start text-none pa-2" height="auto">
          <v-avatar color="primary" size="40" class="mr-3">
            <span class="text-h6 text-white" v-if="profile.username">{{ profile.username.charAt(0).toUpperCase() }}</span>
          </v-avatar>
          <div class="text-left">
            <div class="font-weight-bold">{{ profile.username }}</div>
            <div class="text-caption text-grey">@{{ profile.username }}</div>
          </div>
          <v-spacer></v-spacer>
          <v-icon>mdi-dots-horizontal</v-icon>
        </v-btn>
        <div v-else class="d-flex justify-center">
          <v-btn v-bind="props" icon size="40" variant="text">
            <v-avatar color="primary" size="40">
              <span class="text-h6 text-white" v-if="profile.username">{{ profile.username.charAt(0).toUpperCase() }}</span>
            </v-avatar>
          </v-btn>
        </div>
      </template>
      <v-list>
        <!-- This is the new section for submission limits in the menu -->
        <div v-if="!isExempt" class="px-2">
            <LayoutSubmissionCounter mobile />
            <v-divider class="my-2"></v-divider>
        </div>
        <v-list-item @click.stop>
          <v-switch
            :model-value="currentThemeName === 'dark'"
            @update:model-value="toggleTheme"
            label="Dark Mode"
            color="primary"
            hide-details
          ></v-switch>
        </v-list-item>
        <v-divider></v-divider>
        <v-list-item @click="handleLogout">
          <v-list-item-title>Logout @{{ profile.username }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
    <div v-else class="text-center">
      <v-btn v-if="mobile" to="/login" variant="outlined" rounded="xl" icon="mdi-login"></v-btn>
      <v-btn v-else to="/login" variant="outlined" rounded="xl" block>Login</v-btn>
    </div>
  </div>
</template>

<script setup>
import { useDisplay } from 'vuetify';
import { useSupabaseUser } from '#imports';
import { useThemeManager } from '~/composables/useTheme';
import { useUserProfile } from '~/composables/useUserProfile';
import { useAuthHandler } from '~/composables/useAuthHandler';
import { useSubmissionLimits } from '~/composables/useSubmissionLimits';
import LayoutSubmissionCounter from '~/components/Layout/SubmissionCounter.vue'; // Import the new component

const user = useSupabaseUser();
const { mobile } = useDisplay();
const { toggleTheme, currentThemeName } = useThemeManager();
const { profile } = useUserProfile();
const { handleLogout } = useAuthHandler();
const { isExempt } = useSubmissionLimits();
</script>
