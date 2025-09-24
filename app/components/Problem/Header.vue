<template>
  <div>
    <div v-if="!mobile" class="d-flex justify-space-between align-start">
      <div class="flex-grow-1" style="min-width: 0;">
          <h1 class="text-wrap text-h4">{{ problem.title }}</h1>
          <p class="text-subtitle-1 mt-1">
            Submitted by: 
            <NuxtLink :to="`/profile/${problem.users?.slug}`" class="text-decoration-none">
              {{ problem.users?.username || 'Anonymous' }}
            </NuxtLink>
          </p>
      </div>
      
      <div class="ml-4 flex-shrink-0">
          <v-menu v-if="isOwner(problem, user) || profile?.role === 'admin'" location="bottom end">
            <template v-slot:activator="{ props }">
              <v-btn v-bind="props" icon="mdi-dots-vertical" variant="text"></v-btn>
            </template>
            <v-list>
              <v-list-item @click="$emit('delete')">
                <template v-slot:prepend>
                  <v-icon color="red-darken-1">mdi-delete</v-icon>
                </template>
                <v-list-item-title class="text-red-darken-1">Delete Problem</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
      </div>
    </div>

    <div v-else>
      <div class="d-flex justify-space-between align-start">
        <div class="flex-grow-1">
          <h1 class="text-h5 text-wrap mb-2">{{ problem.title }}</h1>
          <v-chip
            :to="`/profile/${problem.users?.slug}`"
            variant="text"
            size="small"
            class="px-0"
          >
            <template v-slot:prepend>
              <v-avatar class="mr-1" color="grey-lighten-2" size="24">
                <span v-if="problem.users?.username">{{ problem.users.username.charAt(0).toUpperCase() }}</span>
              </v-avatar>
            </template>
            {{ problem.users?.username || 'Anonymous' }}
          </v-chip>
        </div>
        
        <div class="ml-2 flex-shrink-0">
          <v-menu v-if="isOwner(problem, user) || profile?.role === 'admin'" location="bottom end">
            <template v-slot:activator="{ props }">
              <v-btn v-bind="props" icon="mdi-dots-vertical" variant="text" size="small"></v-btn>
            </template>
            <v-list>
              <v-list-item @click="$emit('delete')">
                <template v-slot:prepend>
                  <v-icon color="red-darken-1">mdi-delete</v-icon>
                </template>
                <v-list-item-title class="text-red-darken-1">Delete</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useDisplay } from 'vuetify';
import { useSupabaseUser } from '#imports';
import { usePermissions } from '~/composables/usePermissions';

defineProps({
    problem: { type: Object, required: true },
    profile: { type: Object, default: null }
});

defineEmits(['delete']);

const { mobile } = useDisplay();
const { isOwner } = usePermissions();
const user = useSupabaseUser();
</script>