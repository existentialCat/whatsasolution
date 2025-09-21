<!-- components/ProblemHeader.vue -->
<template>
    <div class="d-flex" :class="mobile ? 'flex-column' : 'justify-space-between align-start'">
        <div class="flex-grow-1" style="min-width: 0;">
            <h1 class="text-wrap" :class="mobile ? 'text-h5' : 'text-h4'">{{ problem.title }}</h1>
            <p class="text-subtitle-1 mt-1">
              Submitted by: 
              <NuxtLink :to="`/profile/${problem.submitted_by}`" class="text-decoration-none">
                {{ problem.users?.username || 'Anonymous' }}
              </NuxtLink>
            </p>
        </div>
        <div :class="mobile ? 'mt-4 align-self-end' : 'ml-4 flex-shrink-0'">
            <v-btn
              v-if="isOwner(problem, user) || profile?.role === 'admin'"
              color="red-darken-1"
              :variant="mobile ? 'tonal' : 'text'"
              @click="$emit('delete')"
              :icon="mobile"
            >
                <v-icon v-if="mobile">mdi-delete</v-icon>
                <template v-else><v-icon start>mdi-delete</v-icon>Delete</template>
            </v-btn>
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
