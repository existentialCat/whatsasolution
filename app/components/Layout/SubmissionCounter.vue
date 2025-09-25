<!-- /components/Layout/SubmissionCounter.vue -->
<template>
  <div v-if="user && !isExempt">
    <v-list-item 
      :title="mobile ? `${problemsRemaining} Problems Remaining` : undefined"
      :subtitle="!mobile ? `${problemsRemaining} problems remaining` : undefined" 
      density="compact" 
      class="text-caption"
    />
    <v-list-item 
      :title="mobile ? `${solutionsRemaining} Solutions Remaining` : undefined"
      :subtitle="!mobile ? `${solutionsRemaining} solutions remaining` : undefined" 
      density="compact" 
      class="text-caption"
    />
    <v-list-item v-if="timeUntilReset" density="compact" class="text-caption text-grey-darken-1">
        <template v-slot:prepend>
            <v-icon v-if="mobile" size="x-small">mdi-timer-sand</v-icon>
        </template>
        <v-list-item-subtitle>{{ timeUntilReset }}</v-list-item-subtitle>
    </v-list-item>
  </div>
</template>

<script setup>
import { useSupabaseUser } from '#imports';
import { useSubmissionLimits } from '~/composables/useSubmissionLimits';

defineProps({
    mobile: {
        type: Boolean,
        default: false
    }
});

const user = useSupabaseUser();
const { problemsRemaining, solutionsRemaining, timeUntilReset, isExempt } = useSubmissionLimits();
</script>

